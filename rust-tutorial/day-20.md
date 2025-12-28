# Day 20: Smart Pointers - Rc and RefCell

## Learning Objectives
- Share ownership with Rc (Reference Counting)
- Enable interior mutability with RefCell
- Combine Rc and RefCell for shared mutable state
- Understand the differences from Box

---

## Rc: Reference Counting

`Rc<T>` allows multiple ownership of the same data:

```rust
use std::rc::Rc;

fn main() {
    // Create an Rc
    let a = Rc::new(5);
    println!("Value: {}", a);
    println!("Reference count: {}", Rc::strong_count(&a));

    // Clone creates another reference
    let b = Rc::clone(&a);
    println!("After clone, count: {}", Rc::strong_count(&a));

    {
        let c = Rc::clone(&a);
        println!("Inside block, count: {}", Rc::strong_count(&a));
    }

    println!("After block, count: {}", Rc::strong_count(&a));
}
```

---

## Rc vs Box

```rust
use std::rc::Rc;

fn main() {
    // Box - single owner
    let box_data = Box::new(vec![1, 2, 3]);
    // let box_copy = box_data;  // Moves, can't use box_data anymore

    // Rc - multiple owners
    let rc_data = Rc::new(vec![1, 2, 3]);
    let rc_copy = Rc::clone(&rc_data);

    println!("Original: {:?}", rc_data);
    println!("Copy: {:?}", rc_copy);
    println!("They're the same data: {}", Rc::ptr_eq(&rc_data, &rc_copy));
}
```

---

## Hands-On Exercise 1: Shared Data Structure

```rust
use std::rc::Rc;

#[derive(Debug)]
struct SharedConfig {
    database_url: String,
    max_connections: u32,
    timeout: u32,
}

struct Service {
    name: String,
    config: Rc<SharedConfig>,
}

impl Service {
    fn new(name: &str, config: Rc<SharedConfig>) -> Self {
        Service {
            name: name.to_string(),
            config,
        }
    }

    fn describe(&self) {
        println!("{} using {} with max {} connections",
            self.name,
            self.config.database_url,
            self.config.max_connections
        );
    }
}

fn main() {
    let config = Rc::new(SharedConfig {
        database_url: "postgres://localhost/db".to_string(),
        max_connections: 10,
        timeout: 30,
    });

    println!("Config created, ref count: {}", Rc::strong_count(&config));

    let service1 = Service::new("UserService", Rc::clone(&config));
    let service2 = Service::new("OrderService", Rc::clone(&config));
    let service3 = Service::new("ProductService", Rc::clone(&config));

    println!("After services created, ref count: {}", Rc::strong_count(&config));

    service1.describe();
    service2.describe();
    service3.describe();

    drop(service1);
    println!("After dropping service1, ref count: {}", Rc::strong_count(&config));
}
```

---

## RefCell: Interior Mutability

`RefCell<T>` allows mutable access to immutable data (enforced at runtime):

```rust
use std::cell::RefCell;

fn main() {
    let data = RefCell::new(5);

    // Immutable borrow
    {
        let r = data.borrow();
        println!("Value: {}", *r);
    }

    // Mutable borrow
    {
        let mut r = data.borrow_mut();
        *r += 10;
    }

    println!("New value: {}", data.borrow());

    // Runtime borrow checking
    // This would panic:
    // let r1 = data.borrow();
    // let r2 = data.borrow_mut();  // PANIC! Already borrowed
}
```

---

## Hands-On Exercise 2: Mutable Counter

```rust
use std::cell::RefCell;

struct Counter {
    value: RefCell<i32>,
}

impl Counter {
    fn new() -> Self {
        Counter {
            value: RefCell::new(0),
        }
    }

    fn increment(&self) {
        *self.value.borrow_mut() += 1;
    }

    fn decrement(&self) {
        *self.value.borrow_mut() -= 1;
    }

    fn get(&self) -> i32 {
        *self.value.borrow()
    }

    fn reset(&self) {
        *self.value.borrow_mut() = 0;
    }
}

fn main() {
    let counter = Counter::new();

    // Even though counter is immutable, we can modify through RefCell
    counter.increment();
    counter.increment();
    counter.increment();

    println!("Count: {}", counter.get());

    counter.decrement();
    println!("After decrement: {}", counter.get());

    counter.reset();
    println!("After reset: {}", counter.get());
}
```

---

## Combining Rc and RefCell

The power combo for shared mutable state:

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    // Shared, mutable value
    let data = Rc::new(RefCell::new(vec![1, 2, 3]));

    // Clone references
    let a = Rc::clone(&data);
    let b = Rc::clone(&data);

    // Mutate through any reference
    a.borrow_mut().push(4);
    b.borrow_mut().push(5);

    println!("Data: {:?}", data.borrow());
    println!("Reference count: {}", Rc::strong_count(&data));
}
```

---

## Hands-On Exercise 3: Observable Pattern

```rust
use std::rc::Rc;
use std::cell::RefCell;

type Observer = Box<dyn Fn(i32)>;

struct Observable {
    value: RefCell<i32>,
    observers: RefCell<Vec<Observer>>,
}

impl Observable {
    fn new(initial: i32) -> Rc<Self> {
        Rc::new(Observable {
            value: RefCell::new(initial),
            observers: RefCell::new(Vec::new()),
        })
    }

    fn subscribe(&self, observer: Observer) {
        self.observers.borrow_mut().push(observer);
    }

    fn set(&self, value: i32) {
        *self.value.borrow_mut() = value;
        self.notify();
    }

    fn get(&self) -> i32 {
        *self.value.borrow()
    }

    fn notify(&self) {
        let value = self.get();
        for observer in self.observers.borrow().iter() {
            observer(value);
        }
    }
}

fn main() {
    let observable = Observable::new(0);

    observable.subscribe(Box::new(|v| {
        println!("Observer 1: Value changed to {}", v);
    }));

    observable.subscribe(Box::new(|v| {
        if v > 5 {
            println!("Observer 2: Value is high! ({})", v);
        }
    }));

    observable.subscribe(Box::new(|v| {
        println!("Observer 3: Current value is {}", v);
    }));

    println!("Setting value to 3:");
    observable.set(3);

    println!("\nSetting value to 10:");
    observable.set(10);
}
```

---

## Shared Graph Structure

```rust
use std::rc::Rc;
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    neighbors: RefCell<Vec<Rc<Node>>>,
}

impl Node {
    fn new(value: i32) -> Rc<Self> {
        Rc::new(Node {
            value,
            neighbors: RefCell::new(Vec::new()),
        })
    }

    fn add_neighbor(&self, neighbor: Rc<Node>) {
        self.neighbors.borrow_mut().push(neighbor);
    }

    fn print_neighbors(&self) {
        println!("Node {} neighbors:", self.value);
        for neighbor in self.neighbors.borrow().iter() {
            println!("  -> Node {}", neighbor.value);
        }
    }
}

fn main() {
    let node1 = Node::new(1);
    let node2 = Node::new(2);
    let node3 = Node::new(3);

    // Create connections (shared references)
    node1.add_neighbor(Rc::clone(&node2));
    node1.add_neighbor(Rc::clone(&node3));
    node2.add_neighbor(Rc::clone(&node3));
    node3.add_neighbor(Rc::clone(&node1));

    node1.print_neighbors();
    node2.print_neighbors();
    node3.print_neighbors();

    println!("\nReference counts:");
    println!("Node 1: {}", Rc::strong_count(&node1));
    println!("Node 2: {}", Rc::strong_count(&node2));
    println!("Node 3: {}", Rc::strong_count(&node3));
}
```

---

## Hands-On Exercise 4: Event Bus

```rust
use std::rc::Rc;
use std::cell::RefCell;
use std::collections::HashMap;

type Handler = Box<dyn Fn(&str)>;

struct EventBus {
    handlers: RefCell<HashMap<String, Vec<Handler>>>,
}

impl EventBus {
    fn new() -> Rc<Self> {
        Rc::new(EventBus {
            handlers: RefCell::new(HashMap::new()),
        })
    }

    fn subscribe(&self, event: &str, handler: Handler) {
        self.handlers
            .borrow_mut()
            .entry(event.to_string())
            .or_insert_with(Vec::new)
            .push(handler);
    }

    fn emit(&self, event: &str, data: &str) {
        if let Some(handlers) = self.handlers.borrow().get(event) {
            for handler in handlers {
                handler(data);
            }
        }
    }

    fn handler_count(&self, event: &str) -> usize {
        self.handlers
            .borrow()
            .get(event)
            .map_or(0, |h| h.len())
    }
}

fn main() {
    let bus = EventBus::new();

    bus.subscribe("user:login", Box::new(|data| {
        println!("[Logger] User logged in: {}", data);
    }));

    bus.subscribe("user:login", Box::new(|data| {
        println!("[Analytics] Track login event: {}", data);
    }));

    bus.subscribe("user:logout", Box::new(|data| {
        println!("[Logger] User logged out: {}", data);
    }));

    println!("Login handlers: {}", bus.handler_count("user:login"));
    println!("Logout handlers: {}", bus.handler_count("user:logout"));

    println!("\nEmitting login event:");
    bus.emit("user:login", "alice@example.com");

    println!("\nEmitting logout event:");
    bus.emit("user:logout", "alice@example.com");
}
```

---

## Weak References

Prevent reference cycles with `Weak<T>`:

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

#[derive(Debug)]
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,
    children: RefCell<Vec<Rc<Node>>>,
}

impl Node {
    fn new(value: i32) -> Rc<Self> {
        Rc::new(Node {
            value,
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(Vec::new()),
        })
    }

    fn add_child(parent: &Rc<Self>, child: &Rc<Node>) {
        *child.parent.borrow_mut() = Rc::downgrade(parent);
        parent.children.borrow_mut().push(Rc::clone(child));
    }
}

fn main() {
    let root = Node::new(1);
    let child1 = Node::new(2);
    let child2 = Node::new(3);

    Node::add_child(&root, &child1);
    Node::add_child(&root, &child2);

    println!("Root children:");
    for child in root.children.borrow().iter() {
        println!("  Child: {}", child.value);

        if let Some(parent) = child.parent.borrow().upgrade() {
            println!("    Parent: {}", parent.value);
        }
    }

    println!("\nReference counts:");
    println!("Root strong: {}", Rc::strong_count(&root));
    println!("Root weak: {}", Rc::weak_count(&root));
    println!("Child1 strong: {}", Rc::strong_count(&child1));
}
```

---

## Hands-On Exercise 5: Component Tree with Parent References

```rust
use std::rc::{Rc, Weak};
use std::cell::RefCell;

struct Component {
    name: String,
    parent: RefCell<Weak<Component>>,
    children: RefCell<Vec<Rc<Component>>>,
    data: RefCell<String>,
}

impl Component {
    fn new(name: &str) -> Rc<Self> {
        Rc::new(Component {
            name: name.to_string(),
            parent: RefCell::new(Weak::new()),
            children: RefCell::new(Vec::new()),
            data: RefCell::new(String::new()),
        })
    }

    fn add_child(parent: &Rc<Self>, child: &Rc<Component>) {
        *child.parent.borrow_mut() = Rc::downgrade(parent);
        parent.children.borrow_mut().push(Rc::clone(child));
    }

    fn set_data(&self, data: &str) {
        *self.data.borrow_mut() = data.to_string();
    }

    fn get_path(&self) -> String {
        let mut path = vec![self.name.clone()];
        let mut current = self.parent.borrow().upgrade();

        while let Some(parent) = current {
            path.push(parent.name.clone());
            current = parent.parent.borrow().upgrade();
        }

        path.reverse();
        path.join("/")
    }

    fn print_tree(&self, indent: usize) {
        let spaces = "  ".repeat(indent);
        let data = self.data.borrow();
        let data_str = if data.is_empty() {
            String::new()
        } else {
            format!(" [{}]", data)
        };
        println!("{}{}{}", spaces, self.name, data_str);

        for child in self.children.borrow().iter() {
            child.print_tree(indent + 1);
        }
    }
}

fn main() {
    let root = Component::new("app");
    let header = Component::new("header");
    let main = Component::new("main");
    let footer = Component::new("footer");
    let nav = Component::new("nav");
    let content = Component::new("content");

    Component::add_child(&root, &header);
    Component::add_child(&root, &main);
    Component::add_child(&root, &footer);
    Component::add_child(&header, &nav);
    Component::add_child(&main, &content);

    content.set_data("Hello, World!");
    nav.set_data("Home | About | Contact");

    println!("Component Tree:");
    root.print_tree(0);

    println!("\nPaths:");
    println!("Content path: {}", content.get_path());
    println!("Nav path: {}", nav.get_path());
}
```

---

## Cell vs RefCell

```rust
use std::cell::{Cell, RefCell};

fn main() {
    // Cell - for Copy types, no borrow checking
    let cell = Cell::new(5);
    cell.set(10);
    let value = cell.get();
    println!("Cell value: {}", value);

    // RefCell - for any type, runtime borrow checking
    let refcell = RefCell::new(String::from("hello"));
    refcell.borrow_mut().push_str(" world");
    println!("RefCell value: {}", refcell.borrow());

    // Cell is simpler for Copy types
    struct Point {
        x: Cell<i32>,
        y: Cell<i32>,
    }

    let point = Point {
        x: Cell::new(0),
        y: Cell::new(0),
    };

    point.x.set(10);
    point.y.set(20);
    println!("Point: ({}, {})", point.x.get(), point.y.get());
}
```

---

## Key Takeaways

1. **Rc<T> enables multiple ownership (reference counting)**
2. **RefCell<T> enables interior mutability (runtime borrow checking)**
3. **Combine Rc<RefCell<T>> for shared mutable data**
4. **Use Weak<T> to break reference cycles**
5. **Cell<T> is simpler for Copy types**
6. **Rc is single-threaded; use Arc for multi-threaded**
7. **RefCell panics on borrow violations at runtime**

---

## Homework

1. Implement a doubly-linked list with Rc and RefCell
2. Create a simple undo/redo system using shared state
3. Build a dependency graph with cycle detection
4. Implement an observer pattern with weak references

---

[← Previous: Day 19](day-19.md) | [Next: Day 21 - Concurrency Basics →](day-21.md)
