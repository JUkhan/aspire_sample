# Day 7: Structs

## Learning Objectives
- Define and instantiate structs
- Create struct methods with impl blocks
- Understand associated functions
- Use tuple structs and unit structs

---

## Defining Structs

Structs group related data together:

```rust
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    let user = User {
        username: String::from("rustacean"),
        email: String::from("rust@example.com"),
        active: true,
        sign_in_count: 1,
    };

    println!("Username: {}", user.username);
    println!("Email: {}", user.email);
    println!("Active: {}", user.active);
    println!("Sign-ins: {}", user.sign_in_count);
}
```

---

## Mutable Structs

```rust
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    let mut user = User {
        username: String::from("rustacean"),
        email: String::from("rust@example.com"),
        active: true,
        sign_in_count: 1,
    };

    // Modify fields
    user.email = String::from("new@example.com");
    user.sign_in_count += 1;

    println!("Updated email: {}", user.email);
    println!("Sign-in count: {}", user.sign_in_count);
}
```

> Note: The entire struct must be mutable; you can't make individual fields mutable.

---

## Hands-On Exercise 1: Building User Profiles

```rust
struct Profile {
    name: String,
    age: u32,
    bio: String,
    followers: u32,
    following: u32,
}

fn main() {
    let mut profile = Profile {
        name: String::from("Alice"),
        age: 28,
        bio: String::from("Rust enthusiast and coffee lover"),
        followers: 1000,
        following: 150,
    };

    print_profile(&profile);

    // Gain followers
    profile.followers += 50;
    profile.bio = String::from("Rust enthusiast, coffee lover, open source contributor");

    println!("\n=== Updated Profile ===");
    print_profile(&profile);
}

fn print_profile(p: &Profile) {
    println!("Name: {}", p.name);
    println!("Age: {}", p.age);
    println!("Bio: {}", p.bio);
    println!("Followers: {} | Following: {}", p.followers, p.following);
}
```

---

## Field Init Shorthand

When variable names match field names:

```rust
struct Point {
    x: i32,
    y: i32,
}

fn create_point(x: i32, y: i32) -> Point {
    Point { x, y }  // Shorthand for Point { x: x, y: y }
}

fn main() {
    let p = create_point(10, 20);
    println!("Point: ({}, {})", p.x, p.y);
}
```

---

## Struct Update Syntax

Create a new struct from an existing one:

```rust
struct User {
    username: String,
    email: String,
    active: bool,
    sign_in_count: u64,
}

fn main() {
    let user1 = User {
        username: String::from("user1"),
        email: String::from("user1@example.com"),
        active: true,
        sign_in_count: 1,
    };

    // Create user2 with some fields from user1
    let user2 = User {
        email: String::from("user2@example.com"),
        ..user1  // Use remaining fields from user1
    };

    // Note: user1.username was moved to user2!
    println!("User2: {} - {}", user2.username, user2.email);
}
```

---

## Hands-On Exercise 2: Configuration Structs

```rust
#[derive(Debug)]
struct ServerConfig {
    host: String,
    port: u16,
    max_connections: u32,
    timeout_seconds: u32,
    debug_mode: bool,
}

impl ServerConfig {
    fn default() -> Self {
        ServerConfig {
            host: String::from("localhost"),
            port: 8080,
            max_connections: 100,
            timeout_seconds: 30,
            debug_mode: false,
        }
    }
}

fn main() {
    // Default config
    let default_config = ServerConfig::default();
    println!("Default: {:?}", default_config);

    // Production config (override some defaults)
    let production = ServerConfig {
        host: String::from("0.0.0.0"),
        port: 443,
        debug_mode: false,
        ..ServerConfig::default()
    };
    println!("Production: {:?}", production);

    // Development config
    let development = ServerConfig {
        debug_mode: true,
        timeout_seconds: 60,
        ..ServerConfig::default()
    };
    println!("Development: {:?}", development);
}
```

---

## Tuple Structs

Structs without named fields:

```rust
struct Color(u8, u8, u8);
struct Point3D(f64, f64, f64);

fn main() {
    let red = Color(255, 0, 0);
    let origin = Point3D(0.0, 0.0, 0.0);

    println!("Red: RGB({}, {}, {})", red.0, red.1, red.2);
    println!("Origin: ({}, {}, {})", origin.0, origin.1, origin.2);

    // Destructuring
    let Color(r, g, b) = red;
    println!("Components: r={}, g={}, b={}", r, g, b);
}
```

---

## Unit Structs

Structs with no fields:

```rust
struct AlwaysEqual;
struct Marker;

fn main() {
    let _subject = AlwaysEqual;
    let _marker = Marker;

    // Useful for traits (we'll cover later)
}
```

---

## Methods with impl

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // Method: takes &self
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn perimeter(&self) -> u32 {
        2 * (self.width + self.height)
    }

    fn is_square(&self) -> bool {
        self.width == self.height
    }
}

fn main() {
    let rect = Rectangle { width: 30, height: 50 };

    println!("Width: {}", rect.width);
    println!("Height: {}", rect.height);
    println!("Area: {}", rect.area());
    println!("Perimeter: {}", rect.perimeter());
    println!("Is square: {}", rect.is_square());
}
```

---

## Hands-On Exercise 3: Rectangle with Methods

```rust
#[derive(Debug)]
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn perimeter(&self) -> u32 {
        2 * (self.width + self.height)
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }

    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }

    fn make_square(&mut self) {
        let side = self.width.max(self.height);
        self.width = side;
        self.height = side;
    }
}

fn main() {
    let mut rect1 = Rectangle { width: 30, height: 50 };
    let rect2 = Rectangle { width: 10, height: 40 };
    let rect3 = Rectangle { width: 60, height: 45 };

    println!("rect1: {:?}", rect1);
    println!("Area: {}", rect1.area());

    println!("\nCan rect1 hold rect2? {}", rect1.can_hold(&rect2));
    println!("Can rect1 hold rect3? {}", rect1.can_hold(&rect3));

    rect1.scale(2);
    println!("\nAfter scaling by 2: {:?}", rect1);

    rect1.make_square();
    println!("After make_square: {:?}", rect1);
}
```

---

## Associated Functions (Constructors)

Functions that don't take `self`:

```rust
struct Rectangle {
    width: u32,
    height: u32,
}

impl Rectangle {
    // Associated function (constructor)
    fn new(width: u32, height: u32) -> Rectangle {
        Rectangle { width, height }
    }

    fn square(size: u32) -> Rectangle {
        Rectangle {
            width: size,
            height: size
        }
    }

    fn area(&self) -> u32 {
        self.width * self.height
    }
}

fn main() {
    // Call with :: not .
    let rect = Rectangle::new(10, 20);
    let square = Rectangle::square(15);

    println!("Rectangle: {}x{}, area: {}",
             rect.width, rect.height, rect.area());
    println!("Square: {}x{}, area: {}",
             square.width, square.height, square.area());
}
```

---

## Multiple impl Blocks

You can have multiple impl blocks for the same struct:

```rust
struct Circle {
    radius: f64,
}

impl Circle {
    fn new(radius: f64) -> Circle {
        Circle { radius }
    }
}

impl Circle {
    fn area(&self) -> f64 {
        std::f64::consts::PI * self.radius * self.radius
    }

    fn circumference(&self) -> f64 {
        2.0 * std::f64::consts::PI * self.radius
    }
}

impl Circle {
    fn diameter(&self) -> f64 {
        self.radius * 2.0
    }
}

fn main() {
    let circle = Circle::new(5.0);
    println!("Radius: {}", circle.radius);
    println!("Diameter: {}", circle.diameter());
    println!("Circumference: {:.2}", circle.circumference());
    println!("Area: {:.2}", circle.area());
}
```

---

## Hands-On Exercise 4: Bank Account

```rust
#[derive(Debug)]
struct BankAccount {
    account_number: String,
    holder_name: String,
    balance: f64,
}

impl BankAccount {
    fn new(account_number: &str, holder_name: &str) -> BankAccount {
        BankAccount {
            account_number: String::from(account_number),
            holder_name: String::from(holder_name),
            balance: 0.0,
        }
    }

    fn deposit(&mut self, amount: f64) -> Result<(), &str> {
        if amount <= 0.0 {
            return Err("Deposit amount must be positive");
        }
        self.balance += amount;
        Ok(())
    }

    fn withdraw(&mut self, amount: f64) -> Result<(), &str> {
        if amount <= 0.0 {
            return Err("Withdrawal amount must be positive");
        }
        if amount > self.balance {
            return Err("Insufficient funds");
        }
        self.balance -= amount;
        Ok(())
    }

    fn get_balance(&self) -> f64 {
        self.balance
    }

    fn transfer(&mut self, to: &mut BankAccount, amount: f64) -> Result<(), &str> {
        self.withdraw(amount)?;
        to.deposit(amount)?;
        Ok(())
    }
}

fn main() {
    let mut alice = BankAccount::new("001", "Alice");
    let mut bob = BankAccount::new("002", "Bob");

    println!("Initial state:");
    println!("Alice: ${:.2}", alice.get_balance());
    println!("Bob: ${:.2}", bob.get_balance());

    // Deposit
    alice.deposit(1000.0).unwrap();
    println!("\nAfter Alice deposits $1000:");
    println!("Alice: ${:.2}", alice.get_balance());

    // Transfer
    alice.transfer(&mut bob, 300.0).unwrap();
    println!("\nAfter Alice transfers $300 to Bob:");
    println!("Alice: ${:.2}", alice.get_balance());
    println!("Bob: ${:.2}", bob.get_balance());

    // Try overdraft
    match alice.withdraw(1000.0) {
        Ok(_) => println!("Withdrawal successful"),
        Err(e) => println!("Withdrawal failed: {}", e),
    }
}
```

---

## Hands-On Exercise 5: Building a Todo List

```rust
#[derive(Debug)]
struct Todo {
    id: u32,
    title: String,
    completed: bool,
}

#[derive(Debug)]
struct TodoList {
    todos: Vec<Todo>,
    next_id: u32,
}

impl Todo {
    fn new(id: u32, title: &str) -> Todo {
        Todo {
            id,
            title: String::from(title),
            completed: false,
        }
    }
}

impl TodoList {
    fn new() -> TodoList {
        TodoList {
            todos: Vec::new(),
            next_id: 1,
        }
    }

    fn add(&mut self, title: &str) -> u32 {
        let id = self.next_id;
        self.todos.push(Todo::new(id, title));
        self.next_id += 1;
        id
    }

    fn complete(&mut self, id: u32) -> bool {
        for todo in &mut self.todos {
            if todo.id == id {
                todo.completed = true;
                return true;
            }
        }
        false
    }

    fn remove(&mut self, id: u32) -> bool {
        if let Some(pos) = self.todos.iter().position(|t| t.id == id) {
            self.todos.remove(pos);
            return true;
        }
        false
    }

    fn list_pending(&self) -> Vec<&Todo> {
        self.todos.iter().filter(|t| !t.completed).collect()
    }

    fn list_completed(&self) -> Vec<&Todo> {
        self.todos.iter().filter(|t| t.completed).collect()
    }
}

fn main() {
    let mut list = TodoList::new();

    // Add todos
    list.add("Learn Rust basics");
    list.add("Build a project");
    list.add("Read the Rust book");

    println!("All todos: {:?}", list.todos);

    // Complete some
    list.complete(1);

    println!("\nPending: {:?}", list.list_pending());
    println!("Completed: {:?}", list.list_completed());

    // Remove one
    list.remove(2);
    println!("\nAfter removing #2: {:?}", list.todos);
}
```

---

## Deriving Traits

Common derives for structs:

```rust
#[derive(Debug, Clone, PartialEq)]
struct Point {
    x: f64,
    y: f64,
}

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1.clone();  // Clone trait
    let p3 = Point { x: 1.0, y: 2.0 };

    println!("{:?}", p1);  // Debug trait
    println!("p1 == p2: {}", p1 == p2);  // PartialEq trait
    println!("p1 == p3: {}", p1 == p3);
}
```

---

## Challenge: 2D Vector Operations

```rust
#[derive(Debug, Clone, Copy)]
struct Vec2 {
    x: f64,
    y: f64,
}

impl Vec2 {
    fn new(x: f64, y: f64) -> Vec2 {
        Vec2 { x, y }
    }

    fn zero() -> Vec2 {
        Vec2 { x: 0.0, y: 0.0 }
    }

    fn magnitude(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    fn normalize(&self) -> Vec2 {
        let mag = self.magnitude();
        if mag == 0.0 {
            Vec2::zero()
        } else {
            Vec2 {
                x: self.x / mag,
                y: self.y / mag,
            }
        }
    }

    fn add(&self, other: &Vec2) -> Vec2 {
        Vec2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }

    fn subtract(&self, other: &Vec2) -> Vec2 {
        Vec2 {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }

    fn dot(&self, other: &Vec2) -> f64 {
        self.x * other.x + self.y * other.y
    }

    fn scale(&self, factor: f64) -> Vec2 {
        Vec2 {
            x: self.x * factor,
            y: self.y * factor,
        }
    }

    fn distance(&self, other: &Vec2) -> f64 {
        self.subtract(other).magnitude()
    }
}

fn main() {
    let v1 = Vec2::new(3.0, 4.0);
    let v2 = Vec2::new(1.0, 2.0);

    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
    println!("v1 magnitude: {}", v1.magnitude());
    println!("v1 normalized: {:?}", v1.normalize());
    println!("v1 + v2: {:?}", v1.add(&v2));
    println!("v1 - v2: {:?}", v1.subtract(&v2));
    println!("v1 · v2: {}", v1.dot(&v2));
    println!("v1 * 2: {:?}", v1.scale(2.0));
    println!("Distance: {}", v1.distance(&v2));
}
```

---

## Key Takeaways

1. **Structs group related data with named fields**
2. **Use `impl` blocks to add methods**
3. **`&self` for reading, `&mut self` for modifying**
4. **Associated functions (like `new`) don't take self**
5. **Tuple structs have unnamed fields**
6. **Use `#[derive(...)]` for common traits**
7. **Struct update syntax uses `..other_struct`**

---

## Homework

1. Create a `Book` struct with title, author, pages, and implement methods
2. Build a `ShoppingCart` with items and total calculation
3. Implement a `Timer` struct that can start, stop, and get elapsed time
4. Create a `Matrix2x2` struct with matrix operations

---

[← Previous: Day 6](day-06.md) | [Next: Day 8 - Enums and Pattern Matching →](day-08.md)
