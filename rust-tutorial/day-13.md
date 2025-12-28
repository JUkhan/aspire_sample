# Day 13: Error Handling

## Learning Objectives
- Understand panic vs recoverable errors
- Use Result<T, E> for error handling
- Propagate errors with ?
- Create custom error types

---

## Two Types of Errors

1. **Unrecoverable errors (panic!)**: Program cannot continue
2. **Recoverable errors (Result)**: Handle and continue

```rust
fn main() {
    // Panic - unrecoverable
    // panic!("crash and burn");

    // Result - recoverable
    let result: Result<i32, &str> = Ok(42);
    println!("Result: {:?}", result);
}
```

---

## The panic! Macro

```rust
fn main() {
    let v = vec![1, 2, 3];

    // This will panic
    // println!("{}", v[99]);  // index out of bounds

    // Explicit panic
    // panic!("Something went wrong!");

    // Panic with formatting
    let x = 5;
    if x != 10 {
        // panic!("x should be 10, but it was {}", x);
    }

    println!("Program continues if no panic");
}
```

### Setting RUST_BACKTRACE

```bash
RUST_BACKTRACE=1 cargo run
```

---

## The Result Enum

```rust
enum Result<T, E> {
    Ok(T),
    Err(E),
}
```

```rust
use std::fs::File;

fn main() {
    let file_result = File::open("hello.txt");

    match file_result {
        Ok(file) => println!("File opened successfully: {:?}", file),
        Err(error) => println!("Failed to open file: {}", error),
    }
}
```

---

## Hands-On Exercise 1: Basic Error Handling

```rust
fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err(String::from("Cannot divide by zero"))
    } else {
        Ok(a / b)
    }
}

fn main() {
    let operations = vec![
        (10.0, 2.0),
        (10.0, 0.0),
        (15.0, 3.0),
    ];

    for (a, b) in operations {
        match divide(a, b) {
            Ok(result) => println!("{} / {} = {}", a, b, result),
            Err(e) => println!("{} / {} failed: {}", a, b, e),
        }
    }

    // Using if let
    if let Ok(result) = divide(20.0, 4.0) {
        println!("Quick result: {}", result);
    }
}
```

---

## Unwrap and Expect

```rust
use std::fs::File;

fn main() {
    // unwrap: Panic if Err
    // let file = File::open("hello.txt").unwrap();

    // expect: Panic with custom message
    // let file = File::open("hello.txt")
    //     .expect("Failed to open hello.txt");

    // Safer alternatives
    let result = File::open("hello.txt");
    let file = match result {
        Ok(f) => f,
        Err(e) => {
            println!("Could not open file: {}", e);
            return;
        }
    };
}
```

---

## Handling Specific Errors

```rust
use std::fs::File;
use std::io::ErrorKind;

fn main() {
    let file = File::open("hello.txt");

    let file = match file {
        Ok(f) => f,
        Err(error) => match error.kind() {
            ErrorKind::NotFound => {
                // Try to create the file
                match File::create("hello.txt") {
                    Ok(fc) => {
                        println!("Created new file");
                        fc
                    }
                    Err(e) => panic!("Could not create file: {:?}", e),
                }
            }
            ErrorKind::PermissionDenied => {
                panic!("Permission denied!");
            }
            other_error => {
                panic!("Could not open file: {:?}", other_error);
            }
        },
    };

    println!("File: {:?}", file);
}
```

---

## Using unwrap_or and unwrap_or_else

```rust
fn main() {
    let value: Result<i32, &str> = Err("error");

    // unwrap_or: Provide default value
    let x = value.unwrap_or(0);
    println!("unwrap_or: {}", x);

    // unwrap_or_else: Lazy default with closure
    let y = value.unwrap_or_else(|e| {
        println!("Error occurred: {}", e);
        -1
    });
    println!("unwrap_or_else: {}", y);

    // unwrap_or_default: Use Default trait
    let z: i32 = value.unwrap_or_default();
    println!("unwrap_or_default: {}", z);

    // ok(): Convert Result to Option
    let maybe: Option<i32> = value.ok();
    println!("ok(): {:?}", maybe);
}
```

---

## Hands-On Exercise 2: Parser with Error Handling

```rust
#[derive(Debug)]
enum ParseError {
    Empty,
    InvalidNumber(String),
    Overflow,
}

fn parse_positive_int(s: &str) -> Result<u32, ParseError> {
    let s = s.trim();

    if s.is_empty() {
        return Err(ParseError::Empty);
    }

    match s.parse::<u32>() {
        Ok(n) => Ok(n),
        Err(_) => {
            // Check if it's a valid number but too large
            if s.chars().all(|c| c.is_ascii_digit()) {
                Err(ParseError::Overflow)
            } else {
                Err(ParseError::InvalidNumber(s.to_string()))
            }
        }
    }
}

fn main() {
    let inputs = vec!["42", "", "abc", "999999999999999999", "  100  "];

    for input in inputs {
        match parse_positive_int(input) {
            Ok(n) => println!("'{}' -> {}", input, n),
            Err(ParseError::Empty) => println!("'{}' -> Error: empty input", input),
            Err(ParseError::InvalidNumber(s)) => {
                println!("'{}' -> Error: '{}' is not a number", input, s)
            }
            Err(ParseError::Overflow) => println!("'{}' -> Error: number too large", input),
        }
    }
}
```

---

## Propagating Errors with ?

The `?` operator propagates errors automatically:

```rust
use std::fs::File;
use std::io::{self, Read};

fn read_username_from_file() -> Result<String, io::Error> {
    let mut file = File::open("username.txt")?;  // Returns early if error
    let mut username = String::new();
    file.read_to_string(&mut username)?;  // Returns early if error
    Ok(username)
}

// Even more concise with chaining
fn read_username_short() -> Result<String, io::Error> {
    let mut username = String::new();
    File::open("username.txt")?.read_to_string(&mut username)?;
    Ok(username)
}

// Shortest with fs::read_to_string
fn read_username_shortest() -> Result<String, io::Error> {
    std::fs::read_to_string("username.txt")
}

fn main() {
    match read_username_from_file() {
        Ok(username) => println!("Username: {}", username),
        Err(e) => println!("Error: {}", e),
    }
}
```

---

## Hands-On Exercise 3: Chained Operations

```rust
#[derive(Debug)]
struct User {
    name: String,
    age: u32,
}

fn parse_user_data(data: &str) -> Result<User, String> {
    let parts: Vec<&str> = data.split(',').collect();

    if parts.len() != 2 {
        return Err(String::from("Invalid format: expected 'name,age'"));
    }

    let name = parts[0].trim().to_string();
    if name.is_empty() {
        return Err(String::from("Name cannot be empty"));
    }

    let age = parts[1]
        .trim()
        .parse::<u32>()
        .map_err(|_| String::from("Invalid age"))?;

    Ok(User { name, age })
}

fn process_users(data: &[&str]) -> Result<Vec<User>, String> {
    data.iter()
        .map(|line| parse_user_data(line))
        .collect()  // Collects into Result<Vec<User>, String>
}

fn main() {
    let good_data = vec!["Alice, 30", "Bob, 25", "Charlie, 35"];
    let bad_data = vec!["Alice, 30", "Invalid", "Charlie, 35"];

    match process_users(&good_data) {
        Ok(users) => {
            println!("Parsed {} users:", users.len());
            for user in users {
                println!("  {:?}", user);
            }
        }
        Err(e) => println!("Error: {}", e),
    }

    println!();

    match process_users(&bad_data) {
        Ok(users) => println!("Parsed {} users", users.len()),
        Err(e) => println!("Error processing users: {}", e),
    }
}
```

---

## Custom Error Types

```rust
use std::fmt;

#[derive(Debug)]
enum AppError {
    IoError(std::io::Error),
    ParseError(std::num::ParseIntError),
    ValidationError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::IoError(e) => write!(f, "IO error: {}", e),
            AppError::ParseError(e) => write!(f, "Parse error: {}", e),
            AppError::ValidationError(msg) => write!(f, "Validation error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        AppError::IoError(error)
    }
}

impl From<std::num::ParseIntError> for AppError {
    fn from(error: std::num::ParseIntError) -> Self {
        AppError::ParseError(error)
    }
}

fn read_and_parse(filename: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(filename)?;
    let number: i32 = content.trim().parse()?;

    if number < 0 {
        return Err(AppError::ValidationError(
            "Number must be positive".to_string()
        ));
    }

    Ok(number)
}

fn main() {
    match read_and_parse("number.txt") {
        Ok(n) => println!("Read number: {}", n),
        Err(e) => println!("Error: {}", e),
    }
}
```

---

## Hands-On Exercise 4: Config Parser

```rust
use std::collections::HashMap;

#[derive(Debug)]
enum ConfigError {
    MissingKey(String),
    InvalidValue { key: String, message: String },
    ParseError(String),
}

struct Config {
    values: HashMap<String, String>,
}

impl Config {
    fn parse(input: &str) -> Result<Self, ConfigError> {
        let mut values = HashMap::new();

        for line in input.lines() {
            let line = line.trim();
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            let parts: Vec<&str> = line.splitn(2, '=').collect();
            if parts.len() != 2 {
                return Err(ConfigError::ParseError(
                    format!("Invalid line: {}", line)
                ));
            }

            let key = parts[0].trim().to_string();
            let value = parts[1].trim().to_string();
            values.insert(key, value);
        }

        Ok(Config { values })
    }

    fn get(&self, key: &str) -> Result<&str, ConfigError> {
        self.values
            .get(key)
            .map(|s| s.as_str())
            .ok_or_else(|| ConfigError::MissingKey(key.to_string()))
    }

    fn get_int(&self, key: &str) -> Result<i32, ConfigError> {
        let value = self.get(key)?;
        value.parse().map_err(|_| ConfigError::InvalidValue {
            key: key.to_string(),
            message: format!("'{}' is not a valid integer", value),
        })
    }

    fn get_bool(&self, key: &str) -> Result<bool, ConfigError> {
        let value = self.get(key)?;
        match value.to_lowercase().as_str() {
            "true" | "yes" | "1" => Ok(true),
            "false" | "no" | "0" => Ok(false),
            _ => Err(ConfigError::InvalidValue {
                key: key.to_string(),
                message: format!("'{}' is not a valid boolean", value),
            }),
        }
    }
}

fn main() {
    let config_text = r#"
        # Application config
        app_name = MyApp
        port = 8080
        debug = true
        max_connections = 100
    "#;

    match Config::parse(config_text) {
        Ok(config) => {
            println!("Config parsed successfully!");

            match config.get("app_name") {
                Ok(name) => println!("App name: {}", name),
                Err(e) => println!("Error: {:?}", e),
            }

            match config.get_int("port") {
                Ok(port) => println!("Port: {}", port),
                Err(e) => println!("Error: {:?}", e),
            }

            match config.get_bool("debug") {
                Ok(debug) => println!("Debug mode: {}", debug),
                Err(e) => println!("Error: {:?}", e),
            }

            // Missing key
            match config.get("missing_key") {
                Ok(v) => println!("Value: {}", v),
                Err(e) => println!("Expected error: {:?}", e),
            }
        }
        Err(e) => println!("Failed to parse config: {:?}", e),
    }
}
```

---

## Result Combinators

```rust
fn main() {
    let result: Result<i32, &str> = Ok(10);

    // map: Transform Ok value
    let doubled = result.map(|x| x * 2);
    println!("Doubled: {:?}", doubled);

    // map_err: Transform Err value
    let with_context: Result<i32, String> = result.map_err(|e| format!("Error: {}", e));
    println!("With context: {:?}", with_context);

    // and_then: Chain operations that return Result
    let chained = result.and_then(|x| {
        if x > 5 {
            Ok(x * 2)
        } else {
            Err("Too small")
        }
    });
    println!("Chained: {:?}", chained);

    // or_else: Handle error with another Result
    let recovered: Result<i32, &str> = Err("original error")
        .or_else(|_| Ok(0));
    println!("Recovered: {:?}", recovered);

    // is_ok and is_err
    println!("Is Ok: {}", result.is_ok());
    println!("Is Err: {}", result.is_err());
}
```

---

## Hands-On Exercise 5: Pipeline Processing

```rust
fn validate_not_empty(s: &str) -> Result<&str, String> {
    if s.trim().is_empty() {
        Err("Input cannot be empty".to_string())
    } else {
        Ok(s.trim())
    }
}

fn validate_length(s: &str) -> Result<&str, String> {
    if s.len() < 3 {
        Err("Input must be at least 3 characters".to_string())
    } else {
        Ok(s)
    }
}

fn validate_alphanumeric(s: &str) -> Result<&str, String> {
    if s.chars().all(|c| c.is_alphanumeric() || c == '_') {
        Ok(s)
    } else {
        Err("Input must be alphanumeric".to_string())
    }
}

fn validate_username(input: &str) -> Result<String, String> {
    validate_not_empty(input)
        .and_then(validate_length)
        .and_then(validate_alphanumeric)
        .map(|s| s.to_lowercase())
}

fn main() {
    let test_inputs = vec![
        "Alice123",
        "ab",
        "  ",
        "user@name",
        "Valid_User",
    ];

    for input in test_inputs {
        match validate_username(input) {
            Ok(username) => println!("'{}' -> Valid username: {}", input, username),
            Err(e) => println!("'{}' -> Invalid: {}", input, e),
        }
    }
}
```

---

## Option vs Result

```rust
fn main() {
    // Option: Value might not exist
    let maybe_number: Option<i32> = Some(42);
    let no_number: Option<i32> = None;

    // Result: Operation might fail
    let success: Result<i32, &str> = Ok(42);
    let failure: Result<i32, &str> = Err("something went wrong");

    // Convert Option to Result
    let result = maybe_number.ok_or("no value");
    println!("Option to Result: {:?}", result);

    // Convert Result to Option
    let option = success.ok();
    println!("Result to Option: {:?}", option);

    // ? works with both in functions returning the same type
    fn example() -> Option<i32> {
        let x = Some(10)?;
        let y = Some(20)?;
        Some(x + y)
    }
}
```

---

## Challenge: Error Recovery

```rust
use std::collections::HashMap;

#[derive(Debug)]
enum DbError {
    ConnectionFailed,
    QueryFailed(String),
    NotFound,
}

struct Database {
    connected: bool,
    data: HashMap<String, String>,
}

impl Database {
    fn new() -> Self {
        Database {
            connected: false,
            data: HashMap::new(),
        }
    }

    fn connect(&mut self) -> Result<(), DbError> {
        self.connected = true;
        Ok(())
    }

    fn disconnect(&mut self) {
        self.connected = false;
    }

    fn insert(&mut self, key: &str, value: &str) -> Result<(), DbError> {
        if !self.connected {
            return Err(DbError::ConnectionFailed);
        }
        self.data.insert(key.to_string(), value.to_string());
        Ok(())
    }

    fn get(&self, key: &str) -> Result<&String, DbError> {
        if !self.connected {
            return Err(DbError::ConnectionFailed);
        }
        self.data.get(key).ok_or(DbError::NotFound)
    }
}

fn perform_operations(db: &mut Database) -> Result<String, DbError> {
    db.connect()?;
    db.insert("name", "Alice")?;
    db.insert("email", "alice@example.com")?;
    let name = db.get("name")?;
    Ok(name.clone())
}

fn main() {
    let mut db = Database::new();

    match perform_operations(&mut db) {
        Ok(name) => println!("Retrieved name: {}", name),
        Err(e) => println!("Error: {:?}", e),
    }

    // Try getting non-existent key
    match db.get("phone") {
        Ok(phone) => println!("Phone: {}", phone),
        Err(DbError::NotFound) => println!("Phone number not found"),
        Err(e) => println!("Error: {:?}", e),
    }
}
```

---

## Key Takeaways

1. **Use `panic!` for unrecoverable errors only**
2. **Use `Result<T, E>` for recoverable errors**
3. **`?` propagates errors automatically**
4. **Create custom error types for complex applications**
5. **Use `map`, `and_then`, `map_err` for transformations**
6. **Implement `From` trait for error conversion**
7. **`unwrap()` and `expect()` should be avoided in production**

---

## Homework

1. Create a CSV parser that returns detailed error information
2. Build a simple HTTP request validator with custom errors
3. Implement a calculator that handles all error cases gracefully
4. Create an error type that can wrap multiple error sources

---

[← Previous: Day 12](day-12.md) | [Next: Day 14 - Generic Types →](day-14.md)
