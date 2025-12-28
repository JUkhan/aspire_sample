# Day 8: Enums and Pattern Matching

## Learning Objectives
- Define and use enums
- Understand enum variants with data
- Master pattern matching with match
- Use if let for simple patterns

---

## Basic Enums

Enums define a type with a fixed set of variants:

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let dir = Direction::North;

    match dir {
        Direction::North => println!("Going up!"),
        Direction::South => println!("Going down!"),
        Direction::East => println!("Going right!"),
        Direction::West => println!("Going left!"),
    }
}
```

---

## Enums with Data

Each variant can hold different types of data:

```rust
enum Message {
    Quit,                       // No data
    Move { x: i32, y: i32 },    // Named fields (like a struct)
    Write(String),              // Single value
    ChangeColor(u8, u8, u8),    // Multiple values
}

fn main() {
    let messages = vec![
        Message::Quit,
        Message::Move { x: 10, y: 20 },
        Message::Write(String::from("Hello")),
        Message::ChangeColor(255, 128, 0),
    ];

    for msg in messages {
        process_message(msg);
    }
}

fn process_message(msg: Message) {
    match msg {
        Message::Quit => println!("Quitting..."),
        Message::Move { x, y } => println!("Moving to ({}, {})", x, y),
        Message::Write(text) => println!("Message: {}", text),
        Message::ChangeColor(r, g, b) => println!("Color: RGB({}, {}, {})", r, g, b),
    }
}
```

---

## Hands-On Exercise 1: Traffic Light

```rust
#[derive(Debug)]
enum TrafficLight {
    Red,
    Yellow,
    Green,
}

impl TrafficLight {
    fn duration(&self) -> u32 {
        match self {
            TrafficLight::Red => 60,
            TrafficLight::Yellow => 5,
            TrafficLight::Green => 45,
        }
    }

    fn next(&self) -> TrafficLight {
        match self {
            TrafficLight::Red => TrafficLight::Green,
            TrafficLight::Yellow => TrafficLight::Red,
            TrafficLight::Green => TrafficLight::Yellow,
        }
    }
}

fn main() {
    let mut light = TrafficLight::Red;

    for _ in 0..6 {
        println!("{:?} for {} seconds", light, light.duration());
        light = light.next();
    }
}
```

---

## The Option Enum

Rust's way of handling null values:

```rust
// Defined in the standard library:
// enum Option<T> {
//     Some(T),
//     None,
// }

fn main() {
    let some_number: Option<i32> = Some(5);
    let no_number: Option<i32> = None;

    println!("some_number: {:?}", some_number);
    println!("no_number: {:?}", no_number);

    // Must handle both cases!
    match some_number {
        Some(n) => println!("Got: {}", n),
        None => println!("Got nothing"),
    }
}
```

---

## Hands-On Exercise 2: Safe Division

```rust
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 {
        None
    } else {
        Some(a / b)
    }
}

fn main() {
    let results = vec![
        (10.0, 2.0),
        (10.0, 0.0),
        (15.0, 3.0),
        (8.0, 0.0),
    ];

    for (a, b) in results {
        match divide(a, b) {
            Some(result) => println!("{} / {} = {}", a, b, result),
            None => println!("{} / {} = undefined (division by zero)", a, b),
        }
    }
}
```

---

## Option Methods

```rust
fn main() {
    let some_value: Option<i32> = Some(10);
    let none_value: Option<i32> = None;

    // is_some() and is_none()
    println!("some_value.is_some(): {}", some_value.is_some());
    println!("none_value.is_none(): {}", none_value.is_none());

    // unwrap() - panics if None!
    println!("some_value.unwrap(): {}", some_value.unwrap());
    // none_value.unwrap();  // PANIC!

    // unwrap_or() - provide default
    println!("none_value.unwrap_or(0): {}", none_value.unwrap_or(0));

    // unwrap_or_else() - lazy default
    println!("none_value.unwrap_or_else(|| 42): {}", none_value.unwrap_or_else(|| 42));

    // map() - transform the value if Some
    let doubled = some_value.map(|x| x * 2);
    println!("doubled: {:?}", doubled);

    // and_then() - chain operations
    let result = some_value
        .map(|x| x * 2)
        .map(|x| x + 1);
    println!("chained: {:?}", result);
}
```

---

## The Result Enum

For operations that can fail:

```rust
// Defined in the standard library:
// enum Result<T, E> {
//     Ok(T),
//     Err(E),
// }

fn parse_number(s: &str) -> Result<i32, String> {
    match s.parse::<i32>() {
        Ok(n) => Ok(n),
        Err(_) => Err(format!("'{}' is not a valid number", s)),
    }
}

fn main() {
    let inputs = vec!["42", "abc", "100", "-7", "3.14"];

    for input in inputs {
        match parse_number(input) {
            Ok(n) => println!("Parsed '{}' as {}", input, n),
            Err(e) => println!("Error: {}", e),
        }
    }
}
```

---

## Hands-On Exercise 3: File-like Operations

```rust
#[derive(Debug)]
enum FileError {
    NotFound,
    PermissionDenied,
    Corrupted,
}

struct File {
    name: String,
    content: String,
    is_readable: bool,
}

impl File {
    fn new(name: &str, content: &str, is_readable: bool) -> File {
        File {
            name: String::from(name),
            content: String::from(content),
            is_readable,
        }
    }

    fn read(&self) -> Result<&String, FileError> {
        if !self.is_readable {
            Err(FileError::PermissionDenied)
        } else {
            Ok(&self.content)
        }
    }
}

fn find_file(name: &str, files: &[File]) -> Result<&File, FileError> {
    files.iter().find(|f| f.name == name).ok_or(FileError::NotFound)
}

fn main() {
    let files = vec![
        File::new("readme.txt", "Hello, World!", true),
        File::new("secret.txt", "Top secret data", false),
        File::new("data.txt", "Some data here", true),
    ];

    let file_names = vec!["readme.txt", "secret.txt", "missing.txt"];

    for name in file_names {
        println!("\nLooking for '{}':", name);
        match find_file(name, &files) {
            Ok(file) => match file.read() {
                Ok(content) => println!("  Content: {}", content),
                Err(FileError::PermissionDenied) => println!("  Error: Permission denied"),
                Err(e) => println!("  Error: {:?}", e),
            },
            Err(FileError::NotFound) => println!("  Error: File not found"),
            Err(e) => println!("  Error: {:?}", e),
        }
    }
}
```

---

## Pattern Matching with match

The `match` expression is exhaustive:

```rust
fn main() {
    let number = 7;

    match number {
        1 => println!("One"),
        2 => println!("Two"),
        3 => println!("Three"),
        4 | 5 | 6 => println!("Four, five, or six"),
        7..=10 => println!("Seven to ten"),
        _ => println!("Something else"),  // Default case
    }
}
```

### Matching with Guards

```rust
fn main() {
    let number = 15;

    match number {
        n if n < 0 => println!("Negative"),
        n if n == 0 => println!("Zero"),
        n if n % 2 == 0 => println!("Positive even: {}", n),
        n => println!("Positive odd: {}", n),
    }
}
```

---

## Hands-On Exercise 4: Command Parser

```rust
#[derive(Debug)]
enum Command {
    Ping,
    Echo(String),
    Add(i32, i32),
    Quit,
    Unknown(String),
}

fn parse_command(input: &str) -> Command {
    let parts: Vec<&str> = input.trim().split_whitespace().collect();

    match parts.as_slice() {
        ["ping"] => Command::Ping,
        ["echo", rest @ ..] => Command::Echo(rest.join(" ")),
        ["add", a, b] => {
            let a: i32 = a.parse().unwrap_or(0);
            let b: i32 = b.parse().unwrap_or(0);
            Command::Add(a, b)
        }
        ["quit"] | ["exit"] => Command::Quit,
        _ => Command::Unknown(input.to_string()),
    }
}

fn execute_command(cmd: Command) -> bool {
    match cmd {
        Command::Ping => {
            println!("Pong!");
            true
        }
        Command::Echo(msg) => {
            println!("{}", msg);
            true
        }
        Command::Add(a, b) => {
            println!("{} + {} = {}", a, b, a + b);
            true
        }
        Command::Quit => {
            println!("Goodbye!");
            false
        }
        Command::Unknown(cmd) => {
            println!("Unknown command: {}", cmd);
            true
        }
    }
}

fn main() {
    let commands = vec![
        "ping",
        "echo Hello World",
        "add 5 3",
        "unknown command",
        "quit",
    ];

    for cmd_str in commands {
        println!("> {}", cmd_str);
        let cmd = parse_command(cmd_str);
        if !execute_command(cmd) {
            break;
        }
        println!();
    }
}
```

---

## if let: Simpler Pattern Matching

When you only care about one pattern:

```rust
fn main() {
    let some_value: Option<i32> = Some(42);

    // Instead of:
    match some_value {
        Some(x) => println!("Got: {}", x),
        None => {}
    }

    // Use if let:
    if let Some(x) = some_value {
        println!("Got: {}", x);
    }

    // With else:
    if let Some(x) = some_value {
        println!("Got: {}", x);
    } else {
        println!("Got nothing");
    }
}
```

---

## while let

Loop while pattern matches:

```rust
fn main() {
    let mut stack = vec![1, 2, 3, 4, 5];

    while let Some(top) = stack.pop() {
        println!("Popped: {}", top);
    }

    println!("Stack is empty!");
}
```

---

## Hands-On Exercise 5: State Machine

```rust
#[derive(Debug, Clone)]
enum State {
    Idle,
    Loading { progress: u32 },
    Playing { track: String, position: u32 },
    Paused { track: String, position: u32 },
    Error(String),
}

#[derive(Debug)]
enum Action {
    Play(String),
    Pause,
    Resume,
    Stop,
    UpdateProgress(u32),
}

fn transition(state: State, action: Action) -> State {
    match (state, action) {
        (State::Idle, Action::Play(track)) => State::Loading { progress: 0 },
        (State::Loading { progress }, Action::UpdateProgress(p)) if p >= 100 => {
            State::Playing { track: String::from("Unknown"), position: 0 }
        }
        (State::Loading { .. }, Action::UpdateProgress(p)) => State::Loading { progress: p },
        (State::Playing { track, position }, Action::Pause) => State::Paused { track, position },
        (State::Paused { track, position }, Action::Resume) => State::Playing { track, position },
        (State::Playing { .. }, Action::Stop) | (State::Paused { .. }, Action::Stop) => State::Idle,
        (state, action) => {
            println!("Invalid transition: {:?} + {:?}", state, action);
            state
        }
    }
}

fn main() {
    let mut state = State::Idle;
    println!("Initial: {:?}", state);

    let actions = vec![
        Action::Play(String::from("song.mp3")),
        Action::UpdateProgress(50),
        Action::UpdateProgress(100),
        Action::Pause,
        Action::Resume,
        Action::Stop,
    ];

    for action in actions {
        println!("\nAction: {:?}", action);
        state = transition(state, action);
        println!("New state: {:?}", state);
    }
}
```

---

## Destructuring in Patterns

```rust
struct Point {
    x: i32,
    y: i32,
}

fn main() {
    let point = Point { x: 0, y: 7 };

    // Destructure struct
    match point {
        Point { x: 0, y } => println!("On y-axis at y = {}", y),
        Point { x, y: 0 } => println!("On x-axis at x = {}", x),
        Point { x, y } => println!("At ({}, {})", x, y),
    }

    // Tuple destructuring
    let tuple = (1, 2, 3);
    match tuple {
        (0, _, _) => println!("First is zero"),
        (_, 0, _) => println!("Second is zero"),
        (_, _, 0) => println!("Third is zero"),
        (a, b, c) => println!("({}, {}, {})", a, b, c),
    }

    // Ignore with ..
    let numbers = (1, 2, 3, 4, 5);
    match numbers {
        (first, .., last) => println!("First: {}, Last: {}", first, last),
    }
}
```

---

## Challenge: Expression Evaluator

```rust
#[derive(Debug)]
enum Expr {
    Number(f64),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

fn evaluate(expr: &Expr) -> Result<f64, String> {
    match expr {
        Expr::Number(n) => Ok(*n),
        Expr::Add(left, right) => {
            let l = evaluate(left)?;
            let r = evaluate(right)?;
            Ok(l + r)
        }
        Expr::Sub(left, right) => {
            let l = evaluate(left)?;
            let r = evaluate(right)?;
            Ok(l - r)
        }
        Expr::Mul(left, right) => {
            let l = evaluate(left)?;
            let r = evaluate(right)?;
            Ok(l * r)
        }
        Expr::Div(left, right) => {
            let l = evaluate(left)?;
            let r = evaluate(right)?;
            if r == 0.0 {
                Err(String::from("Division by zero"))
            } else {
                Ok(l / r)
            }
        }
    }
}

fn main() {
    // (3 + 4) * (10 - 5)
    let expr = Expr::Mul(
        Box::new(Expr::Add(
            Box::new(Expr::Number(3.0)),
            Box::new(Expr::Number(4.0)),
        )),
        Box::new(Expr::Sub(
            Box::new(Expr::Number(10.0)),
            Box::new(Expr::Number(5.0)),
        )),
    );

    println!("Expression: {:?}", expr);
    match evaluate(&expr) {
        Ok(result) => println!("Result: {}", result),
        Err(e) => println!("Error: {}", e),
    }
}
```

---

## Key Takeaways

1. **Enums define types with fixed variants**
2. **Variants can hold different types of data**
3. **Option<T> handles nullable values**
4. **Result<T, E> handles operations that can fail**
5. **match is exhaustive - all cases must be handled**
6. **if let for simple single-pattern matching**
7. **while let for pattern-based loops**
8. **Patterns can destructure structs and tuples**

---

## Homework

1. Create a `Shape` enum with Circle, Rectangle, Triangle variants and calculate areas
2. Build a simple calculator using Expression enum
3. Implement a card game with Suit and Rank enums
4. Create a state machine for a vending machine

---

[← Previous: Day 7](day-07.md) | [Next: Day 9 - Modules and Packages →](day-09.md)
