# Day 12: Common Collections - HashMaps

## Learning Objectives
- Create and use HashMaps
- Insert, update, and remove entries
- Access and iterate over HashMaps
- Handle collisions and default values

---

## What is a HashMap?

A `HashMap<K, V>` stores key-value pairs with O(1) average lookup time.

```rust
use std::collections::HashMap;

fn main() {
    // Create an empty HashMap
    let mut scores: HashMap<String, i32> = HashMap::new();

    // Insert values
    scores.insert(String::from("Blue"), 10);
    scores.insert(String::from("Red"), 50);

    println!("{:?}", scores);
}
```

---

## Creating HashMaps

```rust
use std::collections::HashMap;

fn main() {
    // Method 1: new() and insert
    let mut map1 = HashMap::new();
    map1.insert("key1", "value1");
    map1.insert("key2", "value2");

    // Method 2: From iterator of tuples
    let map2: HashMap<_, _> = vec![
        ("a", 1),
        ("b", 2),
        ("c", 3),
    ].into_iter().collect();

    // Method 3: From arrays
    let map3 = HashMap::from([
        ("x", 10),
        ("y", 20),
        ("z", 30),
    ]);

    // Method 4: With capacity
    let map4: HashMap<i32, String> = HashMap::with_capacity(100);

    println!("map1: {:?}", map1);
    println!("map2: {:?}", map2);
    println!("map3: {:?}", map3);
    println!("map4 capacity: {}", map4.capacity());
}
```

---

## Hands-On Exercise 1: Contact Book

```rust
use std::collections::HashMap;

fn main() {
    let mut contacts: HashMap<String, String> = HashMap::new();

    // Add contacts
    contacts.insert(String::from("Alice"), String::from("555-1234"));
    contacts.insert(String::from("Bob"), String::from("555-5678"));
    contacts.insert(String::from("Charlie"), String::from("555-9012"));

    println!("All contacts:");
    for (name, phone) in &contacts {
        println!("  {}: {}", name, phone);
    }

    // Look up a contact
    let name = "Alice";
    match contacts.get(name) {
        Some(phone) => println!("\n{}'s number: {}", name, phone),
        None => println!("\n{} not found", name),
    }

    // Check if contact exists
    println!("\nContains 'Bob': {}", contacts.contains_key("Bob"));
    println!("Contains 'David': {}", contacts.contains_key("David"));

    // Count contacts
    println!("\nTotal contacts: {}", contacts.len());
}
```

---

## Accessing Values

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();
    scores.insert("Alice", 100);
    scores.insert("Bob", 85);
    scores.insert("Charlie", 92);

    // Using get() - returns Option<&V>
    let alice_score = scores.get("Alice");
    println!("Alice's score: {:?}", alice_score);

    // Using get() with unwrap_or
    let unknown = scores.get("Unknown").unwrap_or(&0);
    println!("Unknown's score: {}", unknown);

    // Direct indexing (panics if key doesn't exist!)
    // let score = scores["Unknown"];  // PANIC!

    // Check and get
    if let Some(&score) = scores.get("Bob") {
        println!("Bob's score: {}", score);
    }

    // Get with copied value
    let charlie: Option<i32> = scores.get("Charlie").copied();
    println!("Charlie's score: {:?}", charlie);
}
```

---

## Updating Values

```rust
use std::collections::HashMap;

fn main() {
    let mut scores = HashMap::new();

    // Insert new value
    scores.insert("Blue", 10);
    println!("After insert: {:?}", scores);

    // Overwrite existing value
    scores.insert("Blue", 25);
    println!("After overwrite: {:?}", scores);

    // Insert only if key doesn't exist
    scores.entry("Yellow").or_insert(50);  // Inserted
    scores.entry("Blue").or_insert(50);    // Not inserted (exists)
    println!("After or_insert: {:?}", scores);

    // Update based on old value
    let count = scores.entry("Blue").or_insert(0);
    *count += 10;
    println!("After update: {:?}", scores);
}
```

---

## Hands-On Exercise 2: Word Counter

```rust
use std::collections::HashMap;

fn main() {
    let text = "hello world hello rust hello world rust programming";

    let mut word_count: HashMap<&str, u32> = HashMap::new();

    for word in text.split_whitespace() {
        let count = word_count.entry(word).or_insert(0);
        *count += 1;
    }

    println!("Word counts:");
    for (word, count) in &word_count {
        println!("  {}: {}", word, count);
    }

    // Find most common word
    let most_common = word_count
        .iter()
        .max_by_key(|&(_, count)| count);

    if let Some((word, count)) = most_common {
        println!("\nMost common: '{}' ({} times)", word, count);
    }

    // Sort by count
    let mut sorted: Vec<(&&str, &u32)> = word_count.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));

    println!("\nSorted by frequency:");
    for (word, count) in sorted {
        println!("  {}: {}", word, count);
    }
}
```

---

## Removing Entries

```rust
use std::collections::HashMap;

fn main() {
    let mut map = HashMap::from([
        ("a", 1),
        ("b", 2),
        ("c", 3),
    ]);

    println!("Original: {:?}", map);

    // Remove by key
    let removed = map.remove("b");
    println!("Removed 'b': {:?}", removed);
    println!("After remove: {:?}", map);

    // Remove with entry
    if let Some(value) = map.remove("a") {
        println!("Removed 'a' with value: {}", value);
    }

    // Remove non-existent key
    let not_found = map.remove("x");
    println!("Remove 'x': {:?}", not_found);

    // Clear all
    map.clear();
    println!("After clear: {:?} (empty: {})", map, map.is_empty());
}
```

---

## Iterating Over HashMaps

```rust
use std::collections::HashMap;

fn main() {
    let scores = HashMap::from([
        ("Alice", 100),
        ("Bob", 85),
        ("Charlie", 92),
    ]);

    // Iterate over key-value pairs (immutable)
    println!("All scores:");
    for (name, score) in &scores {
        println!("  {}: {}", name, score);
    }

    // Iterate over keys only
    println!("\nNames:");
    for name in scores.keys() {
        println!("  {}", name);
    }

    // Iterate over values only
    println!("\nScores:");
    for score in scores.values() {
        println!("  {}", score);
    }

    // Mutable iteration
    let mut map = HashMap::from([("a", 1), ("b", 2), ("c", 3)]);
    for value in map.values_mut() {
        *value *= 2;
    }
    println!("\nDoubled values: {:?}", map);
}
```

---

## Hands-On Exercise 3: Student Grade Tracker

```rust
use std::collections::HashMap;

#[derive(Debug)]
struct StudentRecord {
    grades: Vec<f64>,
}

impl StudentRecord {
    fn new() -> Self {
        StudentRecord { grades: Vec::new() }
    }

    fn add_grade(&mut self, grade: f64) {
        self.grades.push(grade);
    }

    fn average(&self) -> Option<f64> {
        if self.grades.is_empty() {
            None
        } else {
            Some(self.grades.iter().sum::<f64>() / self.grades.len() as f64)
        }
    }
}

fn main() {
    let mut students: HashMap<String, StudentRecord> = HashMap::new();

    // Add grades
    let grades_data = vec![
        ("Alice", vec![95.0, 87.0, 92.0, 88.0]),
        ("Bob", vec![78.0, 82.0, 80.0, 75.0]),
        ("Charlie", vec![90.0, 95.0, 88.0, 92.0]),
    ];

    for (name, grades) in grades_data {
        let record = students.entry(name.to_string()).or_insert(StudentRecord::new());
        for grade in grades {
            record.add_grade(grade);
        }
    }

    // Display all students
    println!("Student Grades:");
    for (name, record) in &students {
        let avg = record.average().unwrap_or(0.0);
        println!("  {}: {:?} (avg: {:.2})", name, record.grades, avg);
    }

    // Find top student
    let top_student = students
        .iter()
        .max_by(|a, b| {
            let avg_a = a.1.average().unwrap_or(0.0);
            let avg_b = b.1.average().unwrap_or(0.0);
            avg_a.partial_cmp(&avg_b).unwrap()
        });

    if let Some((name, record)) = top_student {
        println!("\nTop student: {} ({:.2})", name, record.average().unwrap());
    }
}
```

---

## HashMap with Custom Types

```rust
use std::collections::HashMap;

#[derive(Hash, Eq, PartialEq, Debug)]
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let mut grid: HashMap<Point, &str> = HashMap::new();

    grid.insert(Point { x: 0, y: 0 }, "origin");
    grid.insert(Point { x: 1, y: 0 }, "right");
    grid.insert(Point { x: 0, y: 1 }, "up");

    // Look up
    let origin = grid.get(&Point { x: 0, y: 0 });
    println!("At origin: {:?}", origin);

    // Iterate
    for (point, label) in &grid {
        println!("{:?}: {}", point, label);
    }
}
```

---

## Hands-On Exercise 4: Inventory System

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Product {
    name: String,
    price: f64,
    quantity: u32,
}

struct Inventory {
    products: HashMap<String, Product>,
}

impl Inventory {
    fn new() -> Self {
        Inventory {
            products: HashMap::new(),
        }
    }

    fn add_product(&mut self, id: &str, name: &str, price: f64, quantity: u32) {
        let product = Product {
            name: name.to_string(),
            price,
            quantity,
        };
        self.products.insert(id.to_string(), product);
    }

    fn update_quantity(&mut self, id: &str, quantity: u32) -> bool {
        if let Some(product) = self.products.get_mut(id) {
            product.quantity = quantity;
            true
        } else {
            false
        }
    }

    fn sell(&mut self, id: &str, amount: u32) -> Result<f64, &str> {
        if let Some(product) = self.products.get_mut(id) {
            if product.quantity >= amount {
                product.quantity -= amount;
                Ok(product.price * amount as f64)
            } else {
                Err("Insufficient stock")
            }
        } else {
            Err("Product not found")
        }
    }

    fn total_value(&self) -> f64 {
        self.products
            .values()
            .map(|p| p.price * p.quantity as f64)
            .sum()
    }

    fn low_stock(&self, threshold: u32) -> Vec<&Product> {
        self.products
            .values()
            .filter(|p| p.quantity <= threshold)
            .collect()
    }
}

fn main() {
    let mut inventory = Inventory::new();

    // Add products
    inventory.add_product("LAPTOP", "Laptop Pro", 999.99, 10);
    inventory.add_product("MOUSE", "Wireless Mouse", 29.99, 50);
    inventory.add_product("KB", "Mechanical Keyboard", 149.99, 5);

    println!("Initial Inventory:");
    for (id, product) in &inventory.products {
        println!("  [{}] {} - ${:.2} (qty: {})",
                 id, product.name, product.price, product.quantity);
    }

    println!("\nTotal inventory value: ${:.2}", inventory.total_value());

    // Sell some items
    match inventory.sell("LAPTOP", 2) {
        Ok(total) => println!("\nSold 2 laptops for ${:.2}", total),
        Err(e) => println!("Error: {}", e),
    }

    // Check low stock
    println!("\nLow stock items (<=5):");
    for product in inventory.low_stock(5) {
        println!("  {} (qty: {})", product.name, product.quantity);
    }
}
```

---

## Entry API

The Entry API provides powerful ways to handle insertions:

```rust
use std::collections::HashMap;

fn main() {
    let mut cache: HashMap<&str, i32> = HashMap::new();

    // or_insert: Insert if key doesn't exist
    cache.entry("key1").or_insert(10);
    cache.entry("key1").or_insert(20);  // Won't change
    println!("key1: {}", cache["key1"]);  // 10

    // or_insert_with: Lazy insertion with closure
    cache.entry("key2").or_insert_with(|| {
        println!("Computing default value...");
        100
    });

    // or_default: Insert default value for type
    let count: &mut i32 = cache.entry("key3").or_default();
    *count += 1;
    println!("key3: {}", cache["key3"]);  // 1

    // and_modify: Modify existing value
    cache.entry("key1")
        .and_modify(|v| *v *= 2)
        .or_insert(0);
    println!("key1 after modify: {}", cache["key1"]);  // 20

    // Chaining and_modify with or_insert
    cache.entry("key4")
        .and_modify(|v| *v += 1)
        .or_insert(1);
    println!("key4: {}", cache["key4"]);  // 1
}
```

---

## Hands-On Exercise 5: Group By Operations

```rust
use std::collections::HashMap;

fn main() {
    let data = vec![
        ("fruit", "apple"),
        ("vegetable", "carrot"),
        ("fruit", "banana"),
        ("vegetable", "broccoli"),
        ("fruit", "cherry"),
        ("meat", "beef"),
        ("vegetable", "spinach"),
    ];

    // Group by category
    let mut groups: HashMap<&str, Vec<&str>> = HashMap::new();

    for (category, item) in &data {
        groups.entry(category).or_default().push(item);
    }

    println!("Grouped data:");
    for (category, items) in &groups {
        println!("  {}: {:?}", category, items);
    }

    // Count by category
    let counts: HashMap<&str, usize> = groups
        .iter()
        .map(|(k, v)| (*k, v.len()))
        .collect();

    println!("\nCategory counts:");
    for (category, count) in &counts {
        println!("  {}: {}", category, count);
    }
}
```

---

## Challenge: Simple Database

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
struct Record {
    fields: HashMap<String, String>,
}

struct Table {
    name: String,
    records: Vec<Record>,
    index: HashMap<String, usize>,  // Index by "id" field
}

impl Table {
    fn new(name: &str) -> Self {
        Table {
            name: name.to_string(),
            records: Vec::new(),
            index: HashMap::new(),
        }
    }

    fn insert(&mut self, record: Record) -> bool {
        if let Some(id) = record.fields.get("id") {
            if self.index.contains_key(id) {
                return false;  // Duplicate ID
            }
            let idx = self.records.len();
            self.index.insert(id.clone(), idx);
            self.records.push(record);
            true
        } else {
            false  // No ID field
        }
    }

    fn find_by_id(&self, id: &str) -> Option<&Record> {
        self.index.get(id).map(|&idx| &self.records[idx])
    }

    fn find_by_field(&self, field: &str, value: &str) -> Vec<&Record> {
        self.records
            .iter()
            .filter(|r| r.fields.get(field).map_or(false, |v| v == value))
            .collect()
    }

    fn count(&self) -> usize {
        self.records.len()
    }
}

fn main() {
    let mut users = Table::new("users");

    // Insert records
    users.insert(Record {
        fields: HashMap::from([
            ("id".to_string(), "1".to_string()),
            ("name".to_string(), "Alice".to_string()),
            ("city".to_string(), "New York".to_string()),
        ]),
    });

    users.insert(Record {
        fields: HashMap::from([
            ("id".to_string(), "2".to_string()),
            ("name".to_string(), "Bob".to_string()),
            ("city".to_string(), "Los Angeles".to_string()),
        ]),
    });

    users.insert(Record {
        fields: HashMap::from([
            ("id".to_string(), "3".to_string()),
            ("name".to_string(), "Charlie".to_string()),
            ("city".to_string(), "New York".to_string()),
        ]),
    });

    println!("Total records: {}", users.count());

    // Find by ID
    if let Some(record) = users.find_by_id("2") {
        println!("\nFound by ID 2: {:?}", record);
    }

    // Find by field
    let ny_users = users.find_by_field("city", "New York");
    println!("\nUsers in New York:");
    for user in ny_users {
        println!("  {:?}", user.fields.get("name"));
    }
}
```

---

## Key Takeaways

1. **HashMap<K, V> stores key-value pairs**
2. **Keys must implement Hash and Eq**
3. **Use `get()` for safe access (returns Option)**
4. **Use `insert()` to add or overwrite**
5. **Use `entry()` API for conditional operations**
6. **Iterate with `iter()`, `keys()`, or `values()`**
7. **HashMaps don't preserve insertion order**

---

## Homework

1. Build a simple cache with expiration times
2. Create a two-way dictionary (word -> definition and definition -> words)
3. Implement a frequency counter for characters in a string
4. Build a simple contact manager with search functionality

---

[← Previous: Day 11](day-11.md) | [Next: Day 13 - Error Handling →](day-13.md)
