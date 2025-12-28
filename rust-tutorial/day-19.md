# Day 19: Smart Pointers - Box

## Learning Objectives
- Understand heap allocation with Box
- Use Box for recursive types
- Work with trait objects
- Apply Box in real-world scenarios

---

## What is Box?

`Box<T>` is the simplest smart pointer - it allocates data on the heap:

```rust
fn main() {
    // Stack allocation
    let x = 5;

    // Heap allocation with Box
    let y = Box::new(5);

    println!("x = {}", x);
    println!("y = {}", y);  // Box implements Deref
    println!("*y = {}", *y);  // Explicit dereference

    // Size comparison
    println!("Size of x: {} bytes", std::mem::size_of_val(&x));
    println!("Size of y: {} bytes", std::mem::size_of_val(&y));
}
```

---

## When to Use Box

1. When you have a type whose size can't be known at compile time
2. When you want to transfer ownership of large data without copying
3. When you want to own a value that implements a trait

```rust
fn main() {
    // Large data on heap
    let large_array = Box::new([0u8; 1_000_000]);
    println!("Large array is on the heap");

    // Transfer without copying
    let data = Box::new(vec![1, 2, 3, 4, 5]);
    let moved_data = data;  // Only pointer is moved
    println!("Data: {:?}", moved_data);
}
```

---

## Hands-On Exercise 1: Basic Box Operations

```rust
fn main() {
    // Create boxes
    let b1 = Box::new(42);
    let b2 = Box::new(String::from("Hello"));
    let b3 = Box::new(vec![1, 2, 3]);

    println!("b1: {}", b1);
    println!("b2: {}", b2);
    println!("b3: {:?}", b3);

    // Dereference to modify
    let mut b4 = Box::new(10);
    *b4 += 5;
    println!("b4 after modification: {}", b4);

    // Box implements Drop - automatically freed
    {
        let temp = Box::new("temporary");
        println!("Inside scope: {}", temp);
    }  // temp is freed here
    println!("temp is gone");

    // Move out of Box
    let boxed = Box::new(String::from("owned"));
    let unboxed: String = *boxed;  // Move out of Box
    println!("Unboxed: {}", unboxed);
}
```

---

## Recursive Types with Box

Without Box, recursive types have infinite size:

```rust
// This won't compile:
// enum List {
//     Cons(i32, List),  // How big is List? Infinite!
//     Nil,
// }

// With Box it works:
#[derive(Debug)]
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};

fn main() {
    let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));

    println!("{:?}", list);

    // Size is now finite
    println!("Size of List: {} bytes", std::mem::size_of::<List>());
}
```

---

## Hands-On Exercise 2: Linked List

```rust
#[derive(Debug)]
struct Node<T> {
    value: T,
    next: Option<Box<Node<T>>>,
}

struct LinkedList<T> {
    head: Option<Box<Node<T>>>,
}

impl<T> LinkedList<T> {
    fn new() -> Self {
        LinkedList { head: None }
    }

    fn push(&mut self, value: T) {
        let new_node = Box::new(Node {
            value,
            next: self.head.take(),
        });
        self.head = Some(new_node);
    }

    fn pop(&mut self) -> Option<T> {
        self.head.take().map(|node| {
            self.head = node.next;
            node.value
        })
    }

    fn peek(&self) -> Option<&T> {
        self.head.as_ref().map(|node| &node.value)
    }

    fn is_empty(&self) -> bool {
        self.head.is_none()
    }
}

impl<T: std::fmt::Debug> LinkedList<T> {
    fn print(&self) {
        let mut current = &self.head;
        print!("List: ");
        while let Some(node) = current {
            print!("{:?} -> ", node.value);
            current = &node.next;
        }
        println!("None");
    }
}

fn main() {
    let mut list = LinkedList::new();

    list.push(3);
    list.push(2);
    list.push(1);

    list.print();

    println!("Peek: {:?}", list.peek());
    println!("Pop: {:?}", list.pop());
    println!("Pop: {:?}", list.pop());

    list.print();
}
```

---

## Binary Trees with Box

```rust
#[derive(Debug)]
struct TreeNode<T> {
    value: T,
    left: Option<Box<TreeNode<T>>>,
    right: Option<Box<TreeNode<T>>>,
}

impl<T> TreeNode<T> {
    fn new(value: T) -> Self {
        TreeNode {
            value,
            left: None,
            right: None,
        }
    }

    fn with_children(value: T, left: TreeNode<T>, right: TreeNode<T>) -> Self {
        TreeNode {
            value,
            left: Some(Box::new(left)),
            right: Some(Box::new(right)),
        }
    }
}

impl<T: std::fmt::Display> TreeNode<T> {
    fn print_inorder(&self) {
        if let Some(left) = &self.left {
            left.print_inorder();
        }
        print!("{} ", self.value);
        if let Some(right) = &self.right {
            right.print_inorder();
        }
    }
}

impl<T: Ord> TreeNode<T> {
    fn insert(&mut self, value: T) {
        if value < self.value {
            match &mut self.left {
                Some(left) => left.insert(value),
                None => self.left = Some(Box::new(TreeNode::new(value))),
            }
        } else {
            match &mut self.right {
                Some(right) => right.insert(value),
                None => self.right = Some(Box::new(TreeNode::new(value))),
            }
        }
    }

    fn contains(&self, value: &T) -> bool {
        if value == &self.value {
            true
        } else if value < &self.value {
            self.left.as_ref().map_or(false, |left| left.contains(value))
        } else {
            self.right.as_ref().map_or(false, |right| right.contains(value))
        }
    }
}

fn main() {
    let mut root = TreeNode::new(5);
    root.insert(3);
    root.insert(7);
    root.insert(1);
    root.insert(9);
    root.insert(4);

    print!("Inorder: ");
    root.print_inorder();
    println!();

    println!("Contains 4: {}", root.contains(&4));
    println!("Contains 6: {}", root.contains(&6));
}
```

---

## Hands-On Exercise 3: Expression Tree

```rust
#[derive(Debug)]
enum Expr {
    Value(i32),
    Add(Box<Expr>, Box<Expr>),
    Sub(Box<Expr>, Box<Expr>),
    Mul(Box<Expr>, Box<Expr>),
    Div(Box<Expr>, Box<Expr>),
}

impl Expr {
    fn value(n: i32) -> Box<Expr> {
        Box::new(Expr::Value(n))
    }

    fn add(left: Box<Expr>, right: Box<Expr>) -> Box<Expr> {
        Box::new(Expr::Add(left, right))
    }

    fn sub(left: Box<Expr>, right: Box<Expr>) -> Box<Expr> {
        Box::new(Expr::Sub(left, right))
    }

    fn mul(left: Box<Expr>, right: Box<Expr>) -> Box<Expr> {
        Box::new(Expr::Mul(left, right))
    }

    fn div(left: Box<Expr>, right: Box<Expr>) -> Box<Expr> {
        Box::new(Expr::Div(left, right))
    }

    fn evaluate(&self) -> Result<i32, String> {
        match self {
            Expr::Value(n) => Ok(*n),
            Expr::Add(l, r) => Ok(l.evaluate()? + r.evaluate()?),
            Expr::Sub(l, r) => Ok(l.evaluate()? - r.evaluate()?),
            Expr::Mul(l, r) => Ok(l.evaluate()? * r.evaluate()?),
            Expr::Div(l, r) => {
                let right = r.evaluate()?;
                if right == 0 {
                    Err("Division by zero".to_string())
                } else {
                    Ok(l.evaluate()? / right)
                }
            }
        }
    }

    fn to_string(&self) -> String {
        match self {
            Expr::Value(n) => n.to_string(),
            Expr::Add(l, r) => format!("({} + {})", l.to_string(), r.to_string()),
            Expr::Sub(l, r) => format!("({} - {})", l.to_string(), r.to_string()),
            Expr::Mul(l, r) => format!("({} * {})", l.to_string(), r.to_string()),
            Expr::Div(l, r) => format!("({} / {})", l.to_string(), r.to_string()),
        }
    }
}

fn main() {
    // (3 + 4) * (10 - 5)
    let expr = Expr::mul(
        Expr::add(Expr::value(3), Expr::value(4)),
        Expr::sub(Expr::value(10), Expr::value(5)),
    );

    println!("Expression: {}", expr.to_string());
    println!("Result: {:?}", expr.evaluate());

    // More complex: ((2 + 3) * 4) - (10 / 2)
    let expr2 = Expr::sub(
        Expr::mul(
            Expr::add(Expr::value(2), Expr::value(3)),
            Expr::value(4),
        ),
        Expr::div(Expr::value(10), Expr::value(2)),
    );

    println!("\nExpression: {}", expr2.to_string());
    println!("Result: {:?}", expr2.evaluate());
}
```

---

## Box with Trait Objects

```rust
trait Animal {
    fn speak(&self) -> String;
    fn name(&self) -> &str;
}

struct Dog {
    name: String,
}

struct Cat {
    name: String,
}

struct Cow {
    name: String,
}

impl Animal for Dog {
    fn speak(&self) -> String { String::from("Woof!") }
    fn name(&self) -> &str { &self.name }
}

impl Animal for Cat {
    fn speak(&self) -> String { String::from("Meow!") }
    fn name(&self) -> &str { &self.name }
}

impl Animal for Cow {
    fn speak(&self) -> String { String::from("Moo!") }
    fn name(&self) -> &str { &self.name }
}

fn main() {
    // Vec of different animal types using Box<dyn Trait>
    let animals: Vec<Box<dyn Animal>> = vec![
        Box::new(Dog { name: "Rex".to_string() }),
        Box::new(Cat { name: "Whiskers".to_string() }),
        Box::new(Cow { name: "Bessie".to_string() }),
    ];

    for animal in &animals {
        println!("{} says: {}", animal.name(), animal.speak());
    }
}
```

---

## Hands-On Exercise 4: Command Pattern

```rust
trait Command {
    fn execute(&self);
    fn undo(&self);
    fn description(&self) -> &str;
}

struct PrintCommand {
    message: String,
}

impl Command for PrintCommand {
    fn execute(&self) {
        println!("Printing: {}", self.message);
    }

    fn undo(&self) {
        println!("Undoing print of: {}", self.message);
    }

    fn description(&self) -> &str {
        "Print command"
    }
}

struct CalculateCommand {
    a: i32,
    b: i32,
}

impl Command for CalculateCommand {
    fn execute(&self) {
        println!("Calculating: {} + {} = {}", self.a, self.b, self.a + self.b);
    }

    fn undo(&self) {
        println!("Undoing calculation of {} + {}", self.a, self.b);
    }

    fn description(&self) -> &str {
        "Calculate command"
    }
}

struct CommandQueue {
    commands: Vec<Box<dyn Command>>,
    executed: Vec<Box<dyn Command>>,
}

impl CommandQueue {
    fn new() -> Self {
        CommandQueue {
            commands: Vec::new(),
            executed: Vec::new(),
        }
    }

    fn add(&mut self, command: Box<dyn Command>) {
        self.commands.push(command);
    }

    fn execute_all(&mut self) {
        while let Some(cmd) = self.commands.pop() {
            println!("[{}]", cmd.description());
            cmd.execute();
            self.executed.push(cmd);
        }
    }

    fn undo_last(&mut self) {
        if let Some(cmd) = self.executed.pop() {
            println!("[Undoing: {}]", cmd.description());
            cmd.undo();
        }
    }
}

fn main() {
    let mut queue = CommandQueue::new();

    queue.add(Box::new(PrintCommand {
        message: "Hello, World!".to_string(),
    }));
    queue.add(Box::new(CalculateCommand { a: 10, b: 20 }));
    queue.add(Box::new(PrintCommand {
        message: "Goodbye!".to_string(),
    }));

    println!("=== Executing commands ===");
    queue.execute_all();

    println!("\n=== Undoing ===");
    queue.undo_last();
    queue.undo_last();
}
```

---

## Box for Large Stack Data

```rust
fn main() {
    // This might cause stack overflow for large arrays
    // let large = [0u8; 10_000_000];

    // Box puts it on the heap
    let large = Box::new([0u8; 10_000_000]);
    println!("Large array created on heap");
    println!("First element: {}", large[0]);

    // Function returning large data
    let data = create_large_data();
    println!("Received large data: {} bytes", data.len());
}

fn create_large_data() -> Box<[u8]> {
    let mut data = vec![0u8; 1_000_000];
    for (i, byte) in data.iter_mut().enumerate() {
        *byte = (i % 256) as u8;
    }
    data.into_boxed_slice()
}
```

---

## Hands-On Exercise 5: JSON-like Structure

```rust
use std::collections::HashMap;

#[derive(Debug, Clone)]
enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<JsonValue>),
    Object(HashMap<String, Box<JsonValue>>),
}

impl JsonValue {
    fn null() -> Self {
        JsonValue::Null
    }

    fn bool(b: bool) -> Self {
        JsonValue::Bool(b)
    }

    fn number(n: f64) -> Self {
        JsonValue::Number(n)
    }

    fn string(s: &str) -> Self {
        JsonValue::String(s.to_string())
    }

    fn array(items: Vec<JsonValue>) -> Self {
        JsonValue::Array(items)
    }

    fn object() -> JsonObject {
        JsonObject {
            map: HashMap::new(),
        }
    }

    fn get(&self, key: &str) -> Option<&JsonValue> {
        if let JsonValue::Object(map) = self {
            map.get(key).map(|b| b.as_ref())
        } else {
            None
        }
    }

    fn to_pretty_string(&self, indent: usize) -> String {
        let spaces = "  ".repeat(indent);
        match self {
            JsonValue::Null => "null".to_string(),
            JsonValue::Bool(b) => b.to_string(),
            JsonValue::Number(n) => n.to_string(),
            JsonValue::String(s) => format!("\"{}\"", s),
            JsonValue::Array(arr) => {
                let items: Vec<String> = arr
                    .iter()
                    .map(|v| format!("{}{}", "  ".repeat(indent + 1), v.to_pretty_string(indent + 1)))
                    .collect();
                format!("[\n{}\n{}]", items.join(",\n"), spaces)
            }
            JsonValue::Object(map) => {
                let items: Vec<String> = map
                    .iter()
                    .map(|(k, v)| {
                        format!(
                            "{}\"{}\": {}",
                            "  ".repeat(indent + 1),
                            k,
                            v.to_pretty_string(indent + 1)
                        )
                    })
                    .collect();
                format!("{{\n{}\n{}}}", items.join(",\n"), spaces)
            }
        }
    }
}

struct JsonObject {
    map: HashMap<String, Box<JsonValue>>,
}

impl JsonObject {
    fn insert(mut self, key: &str, value: JsonValue) -> Self {
        self.map.insert(key.to_string(), Box::new(value));
        self
    }

    fn build(self) -> JsonValue {
        JsonValue::Object(self.map)
    }
}

fn main() {
    let json = JsonValue::object()
        .insert("name", JsonValue::string("Alice"))
        .insert("age", JsonValue::number(30.0))
        .insert("active", JsonValue::bool(true))
        .insert("scores", JsonValue::array(vec![
            JsonValue::number(95.0),
            JsonValue::number(87.0),
            JsonValue::number(92.0),
        ]))
        .insert("address", JsonValue::object()
            .insert("city", JsonValue::string("New York"))
            .insert("zip", JsonValue::string("10001"))
            .build())
        .build();

    println!("{}", json.to_pretty_string(0));

    // Access nested values
    if let Some(name) = json.get("name") {
        println!("\nName: {:?}", name);
    }
}
```

---

## Key Takeaways

1. **Box<T> allocates data on the heap**
2. **Box implements Deref for automatic dereferencing**
3. **Use Box for recursive types (lists, trees)**
4. **Box enables trait objects: Box<dyn Trait>**
5. **Box has minimal overhead (just a pointer)**
6. **Box automatically frees memory when dropped**
7. **Use Box for large stack data to avoid overflow**

---

## Homework

1. Implement a doubly-linked list using Box and Option
2. Create an abstract syntax tree (AST) for a simple language
3. Build a file system tree structure using Box
4. Implement a strategy pattern with Box<dyn Strategy>

---

[← Previous: Day 18](day-18.md) | [Next: Day 20 - Rc and RefCell →](day-20.md)
