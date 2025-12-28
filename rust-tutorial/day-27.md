# Day 27: Working with JSON

## Learning Objectives
- Parse JSON data with serde
- Serialize Rust structs to JSON
- Handle complex JSON structures
- Work with optional fields

---

## Adding Serde Dependencies

```toml
# Cargo.toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

---

## Basic JSON Parsing

```rust
use serde::{Deserialize, Serialize};
use serde_json;

#[derive(Debug, Serialize, Deserialize)]
struct Person {
    name: String,
    age: u32,
    email: String,
}

fn main() -> Result<(), serde_json::Error> {
    // Parse JSON string to struct
    let json_str = r#"
        {
            "name": "Alice",
            "age": 30,
            "email": "alice@example.com"
        }
    "#;

    let person: Person = serde_json::from_str(json_str)?;
    println!("Parsed: {:?}", person);
    println!("Name: {}", person.name);

    // Serialize struct to JSON
    let json_output = serde_json::to_string(&person)?;
    println!("\nSerialized: {}", json_output);

    // Pretty print
    let json_pretty = serde_json::to_string_pretty(&person)?;
    println!("\nPretty:\n{}", json_pretty);

    Ok(())
}
```

---

## Hands-On Exercise 1: User Data

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct User {
    id: u64,
    username: String,
    email: String,
    active: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct UserList {
    users: Vec<User>,
    total: usize,
}

fn main() -> Result<(), serde_json::Error> {
    let json = r#"
        {
            "users": [
                {"id": 1, "username": "alice", "email": "alice@example.com", "active": true},
                {"id": 2, "username": "bob", "email": "bob@example.com", "active": false},
                {"id": 3, "username": "charlie", "email": "charlie@example.com", "active": true}
            ],
            "total": 3
        }
    "#;

    let user_list: UserList = serde_json::from_str(json)?;
    println!("Total users: {}", user_list.total);

    println!("\nActive users:");
    for user in user_list.users.iter().filter(|u| u.active) {
        println!("  {} ({})", user.username, user.email);
    }

    // Create new user and serialize
    let new_user = User {
        id: 4,
        username: "diana".to_string(),
        email: "diana@example.com".to_string(),
        active: true,
    };

    println!("\nNew user JSON:");
    println!("{}", serde_json::to_string_pretty(&new_user)?);

    Ok(())
}
```

---

## Optional and Default Values

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    name: String,

    #[serde(default)]
    port: u16,

    #[serde(default = "default_host")]
    host: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    description: Option<String>,

    #[serde(rename = "maxConnections")]
    max_connections: Option<u32>,
}

fn default_host() -> String {
    "localhost".to_string()
}

impl Default for Config {
    fn default() -> Self {
        Config {
            name: String::new(),
            port: 8080,
            host: default_host(),
            description: None,
            max_connections: None,
        }
    }
}

fn main() -> Result<(), serde_json::Error> {
    // Minimal JSON
    let json1 = r#"{"name": "MyApp"}"#;
    let config1: Config = serde_json::from_str(json1)?;
    println!("Minimal config: {:?}", config1);

    // Full JSON
    let json2 = r#"
        {
            "name": "MyApp",
            "port": 3000,
            "host": "0.0.0.0",
            "description": "My application",
            "maxConnections": 100
        }
    "#;
    let config2: Config = serde_json::from_str(json2)?;
    println!("\nFull config: {:?}", config2);

    // Serialize (description skipped when None)
    println!("\nSerialized minimal:");
    println!("{}", serde_json::to_string_pretty(&config1)?);

    Ok(())
}
```

---

## Hands-On Exercise 2: API Response Handler

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
#[serde(tag = "status")]
enum ApiResponse {
    #[serde(rename = "success")]
    Success { data: serde_json::Value },
    #[serde(rename = "error")]
    Error { message: String, code: u32 },
}

#[derive(Debug, Serialize, Deserialize)]
struct Product {
    id: u64,
    name: String,
    price: f64,
    #[serde(default)]
    in_stock: bool,
}

fn parse_product_response(json: &str) -> Result<Vec<Product>, String> {
    let response: ApiResponse = serde_json::from_str(json)
        .map_err(|e| format!("Parse error: {}", e))?;

    match response {
        ApiResponse::Success { data } => {
            let products: Vec<Product> = serde_json::from_value(data)
                .map_err(|e| format!("Data parse error: {}", e))?;
            Ok(products)
        }
        ApiResponse::Error { message, code } => {
            Err(format!("API error {}: {}", code, message))
        }
    }
}

fn main() {
    let success_json = r#"
        {
            "status": "success",
            "data": [
                {"id": 1, "name": "Widget", "price": 9.99, "in_stock": true},
                {"id": 2, "name": "Gadget", "price": 19.99, "in_stock": false}
            ]
        }
    "#;

    let error_json = r#"
        {
            "status": "error",
            "message": "Unauthorized access",
            "code": 401
        }
    "#;

    println!("Success response:");
    match parse_product_response(success_json) {
        Ok(products) => {
            for p in products {
                let stock = if p.in_stock { "In stock" } else { "Out of stock" };
                println!("  {} - ${:.2} ({})", p.name, p.price, stock);
            }
        }
        Err(e) => println!("Error: {}", e),
    }

    println!("\nError response:");
    match parse_product_response(error_json) {
        Ok(_) => println!("Unexpected success"),
        Err(e) => println!("  {}", e),
    }
}
```

---

## Working with Dynamic JSON

```rust
use serde_json::{json, Value};

fn main() -> Result<(), serde_json::Error> {
    // Create JSON dynamically
    let user = json!({
        "name": "Alice",
        "age": 30,
        "emails": ["alice@work.com", "alice@home.com"],
        "address": {
            "city": "New York",
            "zip": "10001"
        }
    });

    println!("Dynamic JSON:\n{}", serde_json::to_string_pretty(&user)?);

    // Access values
    println!("\nAccessing values:");
    println!("  Name: {}", user["name"]);
    println!("  Age: {}", user["age"]);
    println!("  City: {}", user["address"]["city"]);

    // Check types
    if let Some(name) = user["name"].as_str() {
        println!("  Name as string: {}", name);
    }

    if let Some(age) = user["age"].as_u64() {
        println!("  Age as number: {}", age);
    }

    // Iterate array
    println!("\n  Emails:");
    if let Some(emails) = user["emails"].as_array() {
        for email in emails {
            println!("    - {}", email);
        }
    }

    // Modify JSON
    let mut data = user.clone();
    data["age"] = json!(31);
    data["phone"] = json!("555-1234");
    println!("\nModified:\n{}", serde_json::to_string_pretty(&data)?);

    Ok(())
}
```

---

## Hands-On Exercise 3: Configuration File

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
struct DatabaseConfig {
    host: String,
    port: u16,
    name: String,
    #[serde(default)]
    pool_size: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct ServerConfig {
    host: String,
    port: u16,
    #[serde(default)]
    workers: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct LoggingConfig {
    level: String,
    #[serde(default)]
    file: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct AppConfig {
    name: String,
    version: String,
    database: DatabaseConfig,
    server: ServerConfig,
    #[serde(default)]
    logging: Option<LoggingConfig>,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        DatabaseConfig {
            host: "localhost".to_string(),
            port: 5432,
            name: "app".to_string(),
            pool_size: 5,
        }
    }
}

impl Default for ServerConfig {
    fn default() -> Self {
        ServerConfig {
            host: "127.0.0.1".to_string(),
            port: 8080,
            workers: 4,
        }
    }
}

impl AppConfig {
    fn load(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let config = serde_json::from_str(&content)?;
        Ok(config)
    }

    fn save(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }

    fn default_config() -> Self {
        AppConfig {
            name: "MyApp".to_string(),
            version: "1.0.0".to_string(),
            database: DatabaseConfig::default(),
            server: ServerConfig::default(),
            logging: Some(LoggingConfig {
                level: "info".to_string(),
                file: None,
            }),
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Create default config
    let config = AppConfig::default_config();
    println!("Default config:\n{}", serde_json::to_string_pretty(&config)?);

    // Save to file
    config.save(Path::new("config.json"))?;
    println!("\nSaved to config.json");

    // Load from file
    let loaded = AppConfig::load(Path::new("config.json"))?;
    println!("\nLoaded config:");
    println!("  App: {} v{}", loaded.name, loaded.version);
    println!("  Database: {}:{}", loaded.database.host, loaded.database.port);
    println!("  Server: {}:{}", loaded.server.host, loaded.server.port);

    // Cleanup
    fs::remove_file("config.json")?;

    Ok(())
}
```

---

## Nested and Complex Types

```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
struct Author {
    name: String,
    email: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BlogPost {
    id: u64,
    title: String,
    content: String,
    author: Author,
    tags: Vec<String>,
    metadata: HashMap<String, String>,
    published_at: Option<String>,
}

fn main() -> Result<(), serde_json::Error> {
    let json = r#"
        {
            "id": 1,
            "title": "Getting Started with Rust",
            "content": "Rust is a systems programming language...",
            "author": {
                "name": "Alice",
                "email": "alice@blog.com"
            },
            "tags": ["rust", "programming", "tutorial"],
            "metadata": {
                "readTime": "5 min",
                "category": "Technology"
            },
            "publishedAt": "2024-01-15"
        }
    "#;

    let post: BlogPost = serde_json::from_str(json)?;

    println!("Blog Post:");
    println!("  Title: {}", post.title);
    println!("  Author: {}", post.author.name);
    println!("  Tags: {}", post.tags.join(", "));

    if let Some(read_time) = post.metadata.get("readTime") {
        println!("  Read time: {}", read_time);
    }

    // Create new post
    let new_post = BlogPost {
        id: 2,
        title: "Advanced Rust Patterns".to_string(),
        content: "In this post...".to_string(),
        author: Author {
            name: "Bob".to_string(),
            email: None,
        },
        tags: vec!["rust".to_string(), "patterns".to_string()],
        metadata: HashMap::from([
            ("readTime".to_string(), "10 min".to_string()),
        ]),
        published_at: None,
    };

    println!("\nNew post JSON:");
    println!("{}", serde_json::to_string_pretty(&new_post)?);

    Ok(())
}
```

---

## Hands-On Exercise 4: Todo List Storage

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Todo {
    id: u32,
    title: String,
    completed: bool,
    #[serde(default)]
    priority: Priority,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "lowercase")]
enum Priority {
    Low,
    #[default]
    Medium,
    High,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct TodoList {
    todos: Vec<Todo>,
    #[serde(skip)]
    next_id: u32,
}

impl TodoList {
    fn new() -> Self {
        TodoList {
            todos: Vec::new(),
            next_id: 1,
        }
    }

    fn load(path: &Path) -> Result<Self, Box<dyn std::error::Error>> {
        if path.exists() {
            let content = fs::read_to_string(path)?;
            let mut list: TodoList = serde_json::from_str(&content)?;
            list.next_id = list.todos.iter().map(|t| t.id).max().unwrap_or(0) + 1;
            Ok(list)
        } else {
            Ok(TodoList::new())
        }
    }

    fn save(&self, path: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(&self)?;
        fs::write(path, content)?;
        Ok(())
    }

    fn add(&mut self, title: String, priority: Priority) -> u32 {
        let id = self.next_id;
        self.todos.push(Todo {
            id,
            title,
            completed: false,
            priority,
        });
        self.next_id += 1;
        id
    }

    fn complete(&mut self, id: u32) -> bool {
        if let Some(todo) = self.todos.iter_mut().find(|t| t.id == id) {
            todo.completed = true;
            true
        } else {
            false
        }
    }

    fn remove(&mut self, id: u32) -> bool {
        if let Some(pos) = self.todos.iter().position(|t| t.id == id) {
            self.todos.remove(pos);
            true
        } else {
            false
        }
    }

    fn list(&self) {
        if self.todos.is_empty() {
            println!("No todos!");
            return;
        }

        for todo in &self.todos {
            let status = if todo.completed { "✓" } else { " " };
            let priority = match todo.priority {
                Priority::High => "!!!",
                Priority::Medium => "!! ",
                Priority::Low => "!  ",
            };
            println!("[{}] {} #{}: {}", status, priority, todo.id, todo.title);
        }
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new("todos.json");

    // Load or create
    let mut list = TodoList::load(path)?;

    // Add some todos
    list.add("Learn Rust JSON".to_string(), Priority::High);
    list.add("Write documentation".to_string(), Priority::Medium);
    list.add("Take a break".to_string(), Priority::Low);

    println!("Current todos:");
    list.list();

    // Complete one
    list.complete(1);
    println!("\nAfter completing #1:");
    list.list();

    // Save
    list.save(path)?;
    println!("\nSaved to todos.json");

    // Reload and verify
    let reloaded = TodoList::load(path)?;
    println!("\nReloaded:");
    reloaded.list();

    // Cleanup
    fs::remove_file(path)?;

    Ok(())
}
```

---

## Error Handling with JSON

```rust
use serde::{Deserialize, Serialize};
use serde_json::Error as JsonError;

#[derive(Debug, Serialize, Deserialize)]
struct Data {
    value: i32,
}

fn parse_json(input: &str) -> Result<Data, String> {
    serde_json::from_str(input).map_err(|e| {
        match e.classify() {
            serde_json::error::Category::Io => format!("I/O error: {}", e),
            serde_json::error::Category::Syntax => {
                format!("Syntax error at line {}, column {}: {}",
                    e.line(), e.column(), e)
            }
            serde_json::error::Category::Data => format!("Data error: {}", e),
            serde_json::error::Category::Eof => "Unexpected end of input".to_string(),
        }
    })
}

fn main() {
    let test_cases = vec![
        r#"{"value": 42}"#,
        r#"{"value": "not a number"}"#,
        r#"{"wrong_field": 42}"#,
        r#"{"value": 42"#,
        r#""#,
    ];

    for json in test_cases {
        println!("Input: {}", if json.is_empty() { "(empty)" } else { json });
        match parse_json(json) {
            Ok(data) => println!("  Success: {:?}\n", data),
            Err(e) => println!("  Error: {}\n", e),
        }
    }
}
```

---

## Key Takeaways

1. **Use serde and serde_json for JSON handling**
2. **`#[derive(Serialize, Deserialize)]` for structs**
3. **`#[serde(default)]` for optional fields with defaults**
4. **`#[serde(rename)]` to match JSON naming conventions**
5. **`serde_json::Value` for dynamic JSON**
6. **`json!` macro for building JSON dynamically**
7. **Handle errors with proper error types**

---

## Homework

1. Create a REST API client that fetches and parses JSON
2. Build a settings manager with JSON persistence
3. Implement a data migration tool between JSON formats
4. Create a JSON schema validator

---

[← Previous: Day 26](day-26.md) | [Next: Day 28 - Async/Await →](day-28.md)
