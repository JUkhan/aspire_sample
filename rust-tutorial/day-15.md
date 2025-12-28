# Day 15: Traits

## Learning Objectives
- Define and implement traits
- Use default implementations
- Understand trait bounds and trait objects
- Work with common standard library traits

---

## What Are Traits?

Traits define shared behavior that types can implement:

```rust
// Define a trait
trait Greet {
    fn greet(&self) -> String;
}

// Implement for a type
struct Person {
    name: String,
}

impl Greet for Person {
    fn greet(&self) -> String {
        format!("Hello, my name is {}!", self.name)
    }
}

struct Robot {
    id: u32,
}

impl Greet for Robot {
    fn greet(&self) -> String {
        format!("BEEP BOOP. I am unit {}.", self.id)
    }
}

fn main() {
    let person = Person { name: String::from("Alice") };
    let robot = Robot { id: 42 };

    println!("{}", person.greet());
    println!("{}", robot.greet());
}
```

---

## Default Implementations

```rust
trait Summary {
    fn summarize_author(&self) -> String;

    // Default implementation
    fn summarize(&self) -> String {
        format!("(Read more from {}...)", self.summarize_author())
    }
}

struct Article {
    title: String,
    author: String,
    content: String,
}

impl Summary for Article {
    fn summarize_author(&self) -> String {
        self.author.clone()
    }

    // Override default
    fn summarize(&self) -> String {
        format!("{}, by {}", self.title, self.author)
    }
}

struct Tweet {
    username: String,
    content: String,
}

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // Uses default summarize()
}

fn main() {
    let article = Article {
        title: String::from("Rust is Great"),
        author: String::from("Alice"),
        content: String::from("..."),
    };

    let tweet = Tweet {
        username: String::from("rustlang"),
        content: String::from("Hello, World!"),
    };

    println!("Article: {}", article.summarize());
    println!("Tweet: {}", tweet.summarize());
}
```

---

## Hands-On Exercise 1: Shape Trait

```rust
use std::f64::consts::PI;

trait Shape {
    fn area(&self) -> f64;
    fn perimeter(&self) -> f64;

    fn describe(&self) -> String {
        format!("Area: {:.2}, Perimeter: {:.2}", self.area(), self.perimeter())
    }
}

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

struct Triangle {
    a: f64,
    b: f64,
    c: f64,
}

impl Shape for Circle {
    fn area(&self) -> f64 {
        PI * self.radius * self.radius
    }

    fn perimeter(&self) -> f64 {
        2.0 * PI * self.radius
    }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }
}

impl Shape for Triangle {
    fn area(&self) -> f64 {
        // Heron's formula
        let s = (self.a + self.b + self.c) / 2.0;
        (s * (s - self.a) * (s - self.b) * (s - self.c)).sqrt()
    }

    fn perimeter(&self) -> f64 {
        self.a + self.b + self.c
    }
}

fn main() {
    let circle = Circle { radius: 5.0 };
    let rect = Rectangle { width: 4.0, height: 6.0 };
    let triangle = Triangle { a: 3.0, b: 4.0, c: 5.0 };

    println!("Circle: {}", circle.describe());
    println!("Rectangle: {}", rect.describe());
    println!("Triangle: {}", triangle.describe());
}
```

---

## Traits as Parameters

```rust
trait Printable {
    fn format(&self) -> String;
}

// Using impl Trait syntax
fn print_item(item: &impl Printable) {
    println!("{}", item.format());
}

// Using trait bound syntax
fn print_item_bound<T: Printable>(item: &T) {
    println!("{}", item.format());
}

// Multiple trait bounds
fn print_and_debug<T: Printable + std::fmt::Debug>(item: &T) {
    println!("{}", item.format());
    println!("{:?}", item);
}

// Where clause for complex bounds
fn complex_function<T, U>(t: &T, u: &U)
where
    T: Printable + Clone,
    U: Printable + std::fmt::Debug,
{
    println!("T: {}", t.format());
    println!("U: {:?}", u);
}

#[derive(Debug)]
struct Item {
    name: String,
}

impl Printable for Item {
    fn format(&self) -> String {
        format!("Item: {}", self.name)
    }
}

fn main() {
    let item = Item { name: String::from("Widget") };
    print_item(&item);
    print_and_debug(&item);
}
```

---

## Returning Types That Implement Traits

```rust
trait Animal {
    fn speak(&self) -> String;
}

struct Dog;
struct Cat;

impl Animal for Dog {
    fn speak(&self) -> String {
        String::from("Woof!")
    }
}

impl Animal for Cat {
    fn speak(&self) -> String {
        String::from("Meow!")
    }
}

// Return impl Trait (single concrete type)
fn get_dog() -> impl Animal {
    Dog
}

// Can't return different types with impl Trait
// fn get_animal(is_dog: bool) -> impl Animal {
//     if is_dog { Dog } else { Cat }  // ERROR!
// }

// Use trait objects for different types
fn get_animal(is_dog: bool) -> Box<dyn Animal> {
    if is_dog {
        Box::new(Dog)
    } else {
        Box::new(Cat)
    }
}

fn main() {
    let dog = get_dog();
    println!("Dog says: {}", dog.speak());

    let animal = get_animal(false);
    println!("Animal says: {}", animal.speak());
}
```

---

## Hands-On Exercise 2: Plugin System

```rust
trait Plugin {
    fn name(&self) -> &str;
    fn version(&self) -> &str;
    fn execute(&self, input: &str) -> String;

    fn info(&self) -> String {
        format!("{} v{}", self.name(), self.version())
    }
}

struct UppercasePlugin;
struct ReversePlugin;
struct CountPlugin;

impl Plugin for UppercasePlugin {
    fn name(&self) -> &str { "Uppercase" }
    fn version(&self) -> &str { "1.0" }

    fn execute(&self, input: &str) -> String {
        input.to_uppercase()
    }
}

impl Plugin for ReversePlugin {
    fn name(&self) -> &str { "Reverse" }
    fn version(&self) -> &str { "1.0" }

    fn execute(&self, input: &str) -> String {
        input.chars().rev().collect()
    }
}

impl Plugin for CountPlugin {
    fn name(&self) -> &str { "Count" }
    fn version(&self) -> &str { "1.0" }

    fn execute(&self, input: &str) -> String {
        format!("Characters: {}, Words: {}",
            input.chars().count(),
            input.split_whitespace().count()
        )
    }
}

fn run_plugin(plugin: &dyn Plugin, input: &str) {
    println!("Running {}...", plugin.info());
    println!("Output: {}\n", plugin.execute(input));
}

fn main() {
    let plugins: Vec<Box<dyn Plugin>> = vec![
        Box::new(UppercasePlugin),
        Box::new(ReversePlugin),
        Box::new(CountPlugin),
    ];

    let input = "Hello, Rust World!";
    println!("Input: {}\n", input);

    for plugin in &plugins {
        run_plugin(plugin.as_ref(), input);
    }
}
```

---

## Trait Objects (dyn Trait)

```rust
trait Draw {
    fn draw(&self);
}

struct Circle {
    radius: f64,
}

struct Square {
    side: f64,
}

impl Draw for Circle {
    fn draw(&self) {
        println!("Drawing a circle with radius {}", self.radius);
    }
}

impl Draw for Square {
    fn draw(&self) {
        println!("Drawing a square with side {}", self.side);
    }
}

struct Canvas {
    shapes: Vec<Box<dyn Draw>>,
}

impl Canvas {
    fn new() -> Self {
        Canvas { shapes: Vec::new() }
    }

    fn add(&mut self, shape: Box<dyn Draw>) {
        self.shapes.push(shape);
    }

    fn draw_all(&self) {
        for shape in &self.shapes {
            shape.draw();
        }
    }
}

fn main() {
    let mut canvas = Canvas::new();

    canvas.add(Box::new(Circle { radius: 5.0 }));
    canvas.add(Box::new(Square { side: 3.0 }));
    canvas.add(Box::new(Circle { radius: 2.5 }));

    canvas.draw_all();
}
```

---

## Common Standard Library Traits

### Display and Debug

```rust
use std::fmt;

struct Point {
    x: f64,
    y: f64,
}

impl fmt::Display for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "({}, {})", self.x, self.y)
    }
}

impl fmt::Debug for Point {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "Point {{ x: {}, y: {} }}", self.x, self.y)
    }
}

fn main() {
    let p = Point { x: 3.0, y: 4.0 };
    println!("Display: {}", p);
    println!("Debug: {:?}", p);
}
```

### Clone and Copy

```rust
#[derive(Clone)]
struct DeepClone {
    data: Vec<i32>,
}

#[derive(Clone, Copy)]
struct ShallowCopy {
    x: i32,
    y: i32,
}

fn main() {
    let a = DeepClone { data: vec![1, 2, 3] };
    let b = a.clone();  // Explicit clone needed

    let c = ShallowCopy { x: 1, y: 2 };
    let d = c;  // Implicit copy
    println!("c is still valid: {:?}", c.x);
}
```

---

## Hands-On Exercise 3: Custom Ordering

```rust
use std::cmp::Ordering;

#[derive(Eq, PartialEq)]
struct Task {
    name: String,
    priority: u8,  // Higher = more important
    deadline: u32, // Days until deadline
}

impl Task {
    fn new(name: &str, priority: u8, deadline: u32) -> Self {
        Task {
            name: name.to_string(),
            priority,
            deadline,
        }
    }
}

impl Ord for Task {
    fn cmp(&self, other: &Self) -> Ordering {
        // First by priority (descending)
        // Then by deadline (ascending)
        other.priority.cmp(&self.priority)
            .then(self.deadline.cmp(&other.deadline))
    }
}

impl PartialOrd for Task {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn main() {
    let mut tasks = vec![
        Task::new("Low priority task", 1, 10),
        Task::new("Urgent task", 5, 1),
        Task::new("High priority later", 4, 7),
        Task::new("Medium priority soon", 3, 2),
        Task::new("Urgent but later", 5, 5),
    ];

    tasks.sort();

    println!("Tasks by priority (then deadline):");
    for task in &tasks {
        println!("  [P{}] {} (due in {} days)",
            task.priority, task.name, task.deadline);
    }
}
```

---

## Supertraits

```rust
trait Animal {
    fn name(&self) -> String;
}

// Pet requires Animal
trait Pet: Animal {
    fn owner(&self) -> String;

    fn describe(&self) -> String {
        format!("{} is owned by {}", self.name(), self.owner())
    }
}

struct Dog {
    name: String,
    owner: String,
}

impl Animal for Dog {
    fn name(&self) -> String {
        self.name.clone()
    }
}

impl Pet for Dog {
    fn owner(&self) -> String {
        self.owner.clone()
    }
}

fn main() {
    let dog = Dog {
        name: String::from("Rex"),
        owner: String::from("Alice"),
    };

    println!("{}", dog.describe());
}
```

---

## Hands-On Exercise 4: Iterator Pattern

```rust
struct Counter {
    current: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Self {
        Counter { current: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.max {
            self.current += 1;
            Some(self.current)
        } else {
            None
        }
    }
}

// Custom iterator for Fibonacci
struct Fibonacci {
    curr: u64,
    next: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { curr: 0, next: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let new_next = self.curr + self.next;
        self.curr = self.next;
        self.next = new_next;
        Some(self.curr)
    }
}

fn main() {
    // Counter iterator
    println!("Counter 1-5:");
    for n in Counter::new(5) {
        print!("{} ", n);
    }
    println!();

    // Using iterator methods
    let sum: u32 = Counter::new(10).sum();
    println!("Sum of 1-10: {}", sum);

    // Fibonacci iterator
    println!("\nFirst 10 Fibonacci numbers:");
    for n in Fibonacci::new().take(10) {
        print!("{} ", n);
    }
    println!();
}
```

---

## Associated Types

```rust
trait Container {
    type Item;

    fn add(&mut self, item: Self::Item);
    fn get(&self) -> Option<&Self::Item>;
}

struct Stack<T> {
    items: Vec<T>,
}

impl<T> Container for Stack<T> {
    type Item = T;

    fn add(&mut self, item: T) {
        self.items.push(item);
    }

    fn get(&self) -> Option<&T> {
        self.items.last()
    }
}

fn main() {
    let mut stack: Stack<i32> = Stack { items: Vec::new() };
    stack.add(1);
    stack.add(2);
    stack.add(3);

    println!("Top: {:?}", stack.get());
}
```

---

## Hands-On Exercise 5: Event System

```rust
trait Event {
    fn event_type(&self) -> &str;
    fn timestamp(&self) -> u64;
}

trait EventHandler<E: Event> {
    fn handle(&self, event: &E);
}

#[derive(Debug)]
struct ClickEvent {
    x: i32,
    y: i32,
    timestamp: u64,
}

impl Event for ClickEvent {
    fn event_type(&self) -> &str { "click" }
    fn timestamp(&self) -> u64 { self.timestamp }
}

#[derive(Debug)]
struct KeyEvent {
    key: char,
    timestamp: u64,
}

impl Event for KeyEvent {
    fn event_type(&self) -> &str { "key" }
    fn timestamp(&self) -> u64 { self.timestamp }
}

struct Logger;

impl<E: Event + std::fmt::Debug> EventHandler<E> for Logger {
    fn handle(&self, event: &E) {
        println!("[{}] {:?}", event.timestamp(), event);
    }
}

struct ClickCounter {
    count: std::cell::Cell<u32>,
}

impl EventHandler<ClickEvent> for ClickCounter {
    fn handle(&self, event: &ClickEvent) {
        self.count.set(self.count.get() + 1);
        println!("Click #{} at ({}, {})", self.count.get(), event.x, event.y);
    }
}

fn main() {
    let logger = Logger;
    let counter = ClickCounter { count: std::cell::Cell::new(0) };

    let click1 = ClickEvent { x: 100, y: 200, timestamp: 1000 };
    let click2 = ClickEvent { x: 150, y: 250, timestamp: 2000 };
    let key = KeyEvent { key: 'A', timestamp: 3000 };

    logger.handle(&click1);
    counter.handle(&click1);

    logger.handle(&click2);
    counter.handle(&click2);

    logger.handle(&key);
}
```

---

## Derive Macro Common Traits

```rust
#[derive(Debug, Clone, PartialEq, Eq, Hash, Default)]
struct User {
    id: u32,
    name: String,
}

use std::collections::HashMap;

fn main() {
    // Debug
    let user = User { id: 1, name: String::from("Alice") };
    println!("{:?}", user);

    // Clone
    let user2 = user.clone();

    // PartialEq
    println!("Equal: {}", user == user2);

    // Hash
    let mut map = HashMap::new();
    map.insert(user, "Admin");

    // Default
    let default_user = User::default();
    println!("Default: {:?}", default_user);
}
```

---

## Challenge: Serialization Trait

```rust
trait Serialize {
    fn to_json(&self) -> String;
}

trait Deserialize: Sized {
    fn from_json(json: &str) -> Result<Self, String>;
}

#[derive(Debug)]
struct Person {
    name: String,
    age: u32,
    email: String,
}

impl Serialize for Person {
    fn to_json(&self) -> String {
        format!(
            r#"{{"name":"{}","age":{},"email":"{}"}}"#,
            self.name, self.age, self.email
        )
    }
}

impl Deserialize for Person {
    fn from_json(json: &str) -> Result<Self, String> {
        // Simple parsing (not production-ready)
        let json = json.trim();
        if !json.starts_with('{') || !json.ends_with('}') {
            return Err("Invalid JSON object".to_string());
        }

        let mut name = String::new();
        let mut age = 0u32;
        let mut email = String::new();

        // Very basic parsing
        for part in json[1..json.len()-1].split(',') {
            let kv: Vec<&str> = part.splitn(2, ':').collect();
            if kv.len() != 2 { continue; }

            let key = kv[0].trim().trim_matches('"');
            let value = kv[1].trim();

            match key {
                "name" => name = value.trim_matches('"').to_string(),
                "age" => age = value.parse().unwrap_or(0),
                "email" => email = value.trim_matches('"').to_string(),
                _ => {}
            }
        }

        Ok(Person { name, age, email })
    }
}

fn main() {
    let person = Person {
        name: String::from("Alice"),
        age: 30,
        email: String::from("alice@example.com"),
    };

    let json = person.to_json();
    println!("Serialized: {}", json);

    match Person::from_json(&json) {
        Ok(p) => println!("Deserialized: {:?}", p),
        Err(e) => println!("Error: {}", e),
    }
}
```

---

## Key Takeaways

1. **Traits define shared behavior**
2. **Types implement traits with `impl Trait for Type`**
3. **Default implementations provide fallback behavior**
4. **Use `impl Trait` or generics for trait parameters**
5. **Use `dyn Trait` for trait objects (runtime polymorphism)**
6. **Common traits: Debug, Clone, Copy, PartialEq, Ord**
7. **Associated types define type placeholders in traits**
8. **Supertraits create trait hierarchies**

---

## Homework

1. Create a `Validate` trait for form field validation
2. Implement `Display` for a custom struct with formatted output
3. Build a simple ORM-like trait with `save()` and `load()` methods
4. Create an `Observable` trait for event-driven programming

---

[← Previous: Day 14](day-14.md) | [Next: Day 16 - Lifetimes →](day-16.md)
