# Day 9: Modules and Packages

## Learning Objectives
- Understand Rust's module system
- Create and organize modules
- Use `pub` for visibility control
- Work with `use` and paths
- Structure a Cargo project

---

## The Module System

Rust's module system helps organize code:

- **Packages**: A Cargo feature for building, testing, and sharing crates
- **Crates**: A tree of modules that produces a library or executable
- **Modules**: Organize and control visibility of code
- **Paths**: A way to name items (structs, functions, modules)

---

## Defining Modules

Modules are defined with the `mod` keyword:

```rust
mod front_of_house {
    mod hosting {
        fn add_to_waitlist() {}
        fn seat_at_table() {}
    }

    mod serving {
        fn take_order() {}
        fn serve_order() {}
        fn take_payment() {}
    }
}

fn main() {
    // Module tree:
    // crate (root)
    // └── front_of_house
    //     ├── hosting
    //     │   ├── add_to_waitlist
    //     │   └── seat_at_table
    //     └── serving
    //         ├── take_order
    //         ├── serve_order
    //         └── take_payment
}
```

---

## Paths and Visibility

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {
            println!("Adding to waitlist...");
        }

        fn seat_at_table() {  // private
            println!("Seating...");
        }
    }

    mod serving {  // private module
        fn take_order() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path
    front_of_house::hosting::add_to_waitlist();
}

fn main() {
    eat_at_restaurant();
}
```

---

## Hands-On Exercise 1: Restaurant Modules

```rust
mod restaurant {
    pub mod kitchen {
        pub struct Dish {
            pub name: String,
            ingredients: Vec<String>,  // private
        }

        impl Dish {
            pub fn new(name: &str, ingredients: Vec<&str>) -> Dish {
                Dish {
                    name: String::from(name),
                    ingredients: ingredients.iter().map(|s| s.to_string()).collect(),
                }
            }

            pub fn describe(&self) {
                println!("Dish: {} ({} ingredients)",
                         self.name, self.ingredients.len());
            }
        }

        pub fn prepare_dish(dish: &Dish) {
            println!("Preparing {} in the kitchen", dish.name);
            mix_ingredients(&dish);
            cook();
        }

        fn mix_ingredients(dish: &Dish) {
            println!("  Mixing ingredients for {}", dish.name);
        }

        fn cook() {
            println!("  Cooking...");
        }
    }

    pub mod dining {
        use super::kitchen::Dish;

        pub fn serve(dish: &Dish) {
            println!("Serving {} to the customer", dish.name);
        }

        pub fn take_order() -> String {
            String::from("Special of the day")
        }
    }
}

fn main() {
    use restaurant::kitchen::{Dish, prepare_dish};
    use restaurant::dining;

    let order = dining::take_order();
    println!("Order received: {}", order);

    let pasta = Dish::new("Pasta", vec!["pasta", "tomato", "garlic"]);
    pasta.describe();

    prepare_dish(&pasta);
    dining::serve(&pasta);
}
```

---

## The use Keyword

Bring paths into scope:

```rust
mod outer {
    pub mod inner {
        pub fn function() {
            println!("Called outer::inner::function()");
        }
    }
}

// Bring into scope
use outer::inner::function;
use outer::inner;  // Or bring the module

fn main() {
    function();          // Direct call
    inner::function();   // Via module
}
```

### Renaming with as

```rust
use std::fmt::Result;
use std::io::Result as IoResult;

fn function1() -> Result {
    Ok(())
}

fn function2() -> IoResult<()> {
    Ok(())
}
```

---

## Re-exporting with pub use

```rust
mod internal {
    pub mod deep {
        pub fn secret_function() {
            println!("Deep secret!");
        }
    }
}

// Re-export for easier access
pub use internal::deep::secret_function;

fn main() {
    // Users can call directly
    secret_function();
}
```

---

## Hands-On Exercise 2: Math Library

```rust
mod math {
    pub mod basic {
        pub fn add(a: i32, b: i32) -> i32 { a + b }
        pub fn subtract(a: i32, b: i32) -> i32 { a - b }
        pub fn multiply(a: i32, b: i32) -> i32 { a * b }
        pub fn divide(a: i32, b: i32) -> Option<i32> {
            if b == 0 { None } else { Some(a / b) }
        }
    }

    pub mod advanced {
        pub fn power(base: i32, exp: u32) -> i32 {
            (0..exp).fold(1, |acc, _| acc * base)
        }

        pub fn factorial(n: u32) -> u64 {
            (1..=n as u64).product()
        }

        pub fn fibonacci(n: u32) -> u64 {
            match n {
                0 => 0,
                1 => 1,
                _ => {
                    let mut a = 0u64;
                    let mut b = 1u64;
                    for _ in 2..=n {
                        let temp = a + b;
                        a = b;
                        b = temp;
                    }
                    b
                }
            }
        }
    }

    pub mod geometry {
        use std::f64::consts::PI;

        pub fn circle_area(radius: f64) -> f64 {
            PI * radius * radius
        }

        pub fn rectangle_area(width: f64, height: f64) -> f64 {
            width * height
        }

        pub fn triangle_area(base: f64, height: f64) -> f64 {
            0.5 * base * height
        }
    }

    // Re-export commonly used functions
    pub use basic::{add, multiply};
    pub use geometry::circle_area;
}

fn main() {
    // Use re-exported functions directly
    println!("2 + 3 = {}", math::add(2, 3));
    println!("Circle area (r=5) = {:.2}", math::circle_area(5.0));

    // Or bring them into scope
    use math::advanced::*;

    println!("2^10 = {}", power(2, 10));
    println!("10! = {}", factorial(10));
    println!("Fibonacci(20) = {}", fibonacci(20));
}
```

---

## Nested Paths

Clean up multiple imports:

```rust
// Instead of:
use std::collections::HashMap;
use std::collections::HashSet;
use std::collections::BTreeMap;

// Use nested paths:
use std::collections::{HashMap, HashSet, BTreeMap};

// Or bring the module and self:
use std::io::{self, Read, Write};
// Same as:
// use std::io;
// use std::io::Read;
// use std::io::Write;
```

---

## Glob Imports

```rust
// Import everything public from a module
use std::collections::*;

fn main() {
    let mut map: HashMap<String, i32> = HashMap::new();
    let mut set: HashSet<i32> = HashSet::new();

    map.insert(String::from("one"), 1);
    set.insert(1);
}
```

> Use sparingly - can make it unclear where names come from.

---

## Separating Modules into Files

### Project Structure

```
my_project/
├── Cargo.toml
└── src/
    ├── main.rs
    ├── lib.rs          (optional library root)
    ├── garden.rs       (module file)
    └── garden/
        └── vegetables.rs (submodule)
```

### main.rs

```rust
mod garden;  // Load garden module

fn main() {
    garden::plant();
    garden::vegetables::harvest();
}
```

### garden.rs

```rust
pub mod vegetables;  // Load submodule

pub fn plant() {
    println!("Planting in the garden...");
}
```

### garden/vegetables.rs

```rust
pub fn harvest() {
    println!("Harvesting vegetables!");
}
```

---

## Hands-On Exercise 3: Multi-File Project Structure

Create this structure:

```
project/
└── src/
    ├── main.rs
    ├── config.rs
    ├── utils.rs
    └── models/
        ├── mod.rs
        ├── user.rs
        └── product.rs
```

### main.rs
```rust
mod config;
mod utils;
mod models;

use models::{User, Product};

fn main() {
    config::init();

    let user = User::new("alice", "alice@example.com");
    let product = Product::new("Laptop", 999.99);

    println!("User: {:?}", user);
    println!("Product: {:?}", product);

    let formatted = utils::format_price(product.price);
    println!("Formatted price: {}", formatted);
}
```

### config.rs
```rust
pub fn init() {
    println!("Initializing configuration...");
}

pub fn get_setting(key: &str) -> Option<String> {
    match key {
        "app_name" => Some(String::from("MyApp")),
        "version" => Some(String::from("1.0.0")),
        _ => None,
    }
}
```

### utils.rs
```rust
pub fn format_price(price: f64) -> String {
    format!("${:.2}", price)
}

pub fn validate_email(email: &str) -> bool {
    email.contains('@') && email.contains('.')
}
```

### models/mod.rs
```rust
mod user;
mod product;

pub use user::User;
pub use product::Product;
```

### models/user.rs
```rust
#[derive(Debug)]
pub struct User {
    pub username: String,
    pub email: String,
}

impl User {
    pub fn new(username: &str, email: &str) -> User {
        User {
            username: String::from(username),
            email: String::from(email),
        }
    }
}
```

### models/product.rs
```rust
#[derive(Debug)]
pub struct Product {
    pub name: String,
    pub price: f64,
}

impl Product {
    pub fn new(name: &str, price: f64) -> Product {
        Product {
            name: String::from(name),
            price,
        }
    }
}
```

---

## Cargo.toml and Dependencies

```toml
[package]
name = "my_project"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]
description = "A sample project"

[dependencies]
serde = "1.0"
serde_json = "1.0"
rand = "0.8"

[dev-dependencies]
criterion = "0.4"

[build-dependencies]
cc = "1.0"
```

---

## Using External Crates

```rust
// After adding to Cargo.toml:
// rand = "0.8"

use rand::Rng;

fn main() {
    let mut rng = rand::thread_rng();

    let n: u32 = rng.gen_range(1..=100);
    println!("Random number: {}", n);

    let coin: bool = rng.gen();
    println!("Coin flip: {}", if coin { "heads" } else { "tails" });
}
```

---

## Hands-On Exercise 4: Building a Library Crate

### lib.rs (library root)
```rust
//! # My Math Library
//!
//! A collection of mathematical utilities.

pub mod arithmetic;
pub mod statistics;

/// Adds two numbers together.
///
/// # Examples
///
/// ```
/// let result = my_math::add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    arithmetic::add(a, b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 2), 4);
    }
}
```

### arithmetic.rs
```rust
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn subtract(a: i32, b: i32) -> i32 {
    a - b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

pub fn divide(a: i32, b: i32) -> Option<i32> {
    if b == 0 { None } else { Some(a / b) }
}
```

### statistics.rs
```rust
pub fn mean(numbers: &[f64]) -> Option<f64> {
    if numbers.is_empty() {
        return None;
    }
    Some(numbers.iter().sum::<f64>() / numbers.len() as f64)
}

pub fn median(numbers: &mut [f64]) -> Option<f64> {
    if numbers.is_empty() {
        return None;
    }

    numbers.sort_by(|a, b| a.partial_cmp(b).unwrap());
    let mid = numbers.len() / 2;

    if numbers.len() % 2 == 0 {
        Some((numbers[mid - 1] + numbers[mid]) / 2.0)
    } else {
        Some(numbers[mid])
    }
}

pub fn mode(numbers: &[i32]) -> Option<i32> {
    use std::collections::HashMap;

    if numbers.is_empty() {
        return None;
    }

    let mut counts = HashMap::new();
    for &num in numbers {
        *counts.entry(num).or_insert(0) += 1;
    }

    counts.into_iter()
        .max_by_key(|&(_, count)| count)
        .map(|(num, _)| num)
}
```

---

## Workspaces

For projects with multiple crates:

```toml
# Cargo.toml (root)
[workspace]
members = [
    "core",
    "cli",
    "web",
]
```

```
my_workspace/
├── Cargo.toml
├── core/
│   ├── Cargo.toml
│   └── src/
│       └── lib.rs
├── cli/
│   ├── Cargo.toml
│   └── src/
│       └── main.rs
└── web/
    ├── Cargo.toml
    └── src/
        └── main.rs
```

---

## Visibility Summary

```rust
mod outer {
    // Private by default
    fn private_fn() {}

    // Public
    pub fn public_fn() {}

    // Public within crate only
    pub(crate) fn crate_fn() {}

    // Public within parent module
    pub(super) fn super_fn() {}

    pub mod inner {
        // Public within outer module
        pub(in crate::outer) fn outer_fn() {}
    }
}
```

---

## Challenge: Plugin System

```rust
// main.rs
mod plugins;

use plugins::{Plugin, PluginManager};

fn main() {
    let mut manager = PluginManager::new();

    manager.register(plugins::hello::HelloPlugin);
    manager.register(plugins::counter::CounterPlugin::new());

    manager.execute_all("World");
    manager.execute_all("Rust");
}

// plugins/mod.rs
pub mod hello;
pub mod counter;

pub trait Plugin {
    fn name(&self) -> &str;
    fn execute(&mut self, input: &str);
}

pub struct PluginManager {
    plugins: Vec<Box<dyn Plugin>>,
}

impl PluginManager {
    pub fn new() -> Self {
        PluginManager { plugins: Vec::new() }
    }

    pub fn register(&mut self, plugin: impl Plugin + 'static) {
        self.plugins.push(Box::new(plugin));
    }

    pub fn execute_all(&mut self, input: &str) {
        for plugin in &mut self.plugins {
            println!("[{}]", plugin.name());
            plugin.execute(input);
        }
    }
}

// plugins/hello.rs
use super::Plugin;

pub struct HelloPlugin;

impl Plugin for HelloPlugin {
    fn name(&self) -> &str { "Hello Plugin" }

    fn execute(&mut self, input: &str) {
        println!("Hello, {}!", input);
    }
}

// plugins/counter.rs
use super::Plugin;

pub struct CounterPlugin {
    count: u32,
}

impl CounterPlugin {
    pub fn new() -> Self {
        CounterPlugin { count: 0 }
    }
}

impl Plugin for CounterPlugin {
    fn name(&self) -> &str { "Counter Plugin" }

    fn execute(&mut self, input: &str) {
        self.count += 1;
        println!("Execution #{} with input: {}", self.count, input);
    }
}
```

---

## Key Takeaways

1. **Modules organize code hierarchically**
2. **Items are private by default**
3. **Use `pub` to make items public**
4. **`use` brings paths into scope**
5. **Modules can be in separate files**
6. **`mod.rs` or `module_name.rs` defines modules**
7. **`pub use` re-exports for cleaner APIs**
8. **Cargo.toml manages dependencies**

---

## Homework

1. Create a project with at least 3 modules in separate files
2. Build a library crate with a public API and internal helpers
3. Create a workspace with two crates that share common code
4. Practice using external crates from crates.io

---

[← Previous: Day 8](day-08.md) | [Next: Day 10 - Vectors →](day-10.md)
