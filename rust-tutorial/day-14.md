# Day 14: Generic Types

## Learning Objectives
- Understand generic types and why they matter
- Use generics in functions, structs, and enums
- Apply generic constraints with trait bounds
- Work with multiple generic parameters

---

## What Are Generics?

Generics allow you to write code that works with multiple types:

```rust
// Without generics: duplicate code
fn largest_i32(list: &[i32]) -> i32 {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn largest_char(list: &[char]) -> char {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

// With generics: one function for many types
fn largest<T: PartialOrd + Copy>(list: &[T]) -> T {
    let mut largest = list[0];
    for &item in list {
        if item > largest {
            largest = item;
        }
    }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    let chars = vec!['y', 'm', 'a', 'q'];

    println!("Largest number: {}", largest(&numbers));
    println!("Largest char: {}", largest(&chars));
}
```

---

## Generic Functions

```rust
// Basic generic function
fn identity<T>(value: T) -> T {
    value
}

// Multiple generic parameters
fn swap<T, U>(a: T, b: U) -> (U, T) {
    (b, a)
}

// Generic with reference
fn first<T>(list: &[T]) -> Option<&T> {
    list.first()
}

fn main() {
    // Type inference
    let x = identity(5);
    let y = identity("hello");
    let z = identity(3.14);

    println!("x: {}, y: {}, z: {}", x, y, z);

    // Swap different types
    let swapped = swap(1, "hello");
    println!("Swapped: {:?}", swapped);

    // First element
    let numbers = [1, 2, 3];
    println!("First: {:?}", first(&numbers));
}
```

---

## Hands-On Exercise 1: Generic Utilities

```rust
fn min<T: PartialOrd>(a: T, b: T) -> T {
    if a < b { a } else { b }
}

fn max<T: PartialOrd>(a: T, b: T) -> T {
    if a > b { a } else { b }
}

fn clamp<T: PartialOrd>(value: T, min_val: T, max_val: T) -> T {
    if value < min_val {
        min_val
    } else if value > max_val {
        max_val
    } else {
        value
    }
}

fn main() {
    // With integers
    println!("min(3, 5) = {}", min(3, 5));
    println!("max(3, 5) = {}", max(3, 5));
    println!("clamp(7, 0, 5) = {}", clamp(7, 0, 5));

    // With floats
    println!("min(3.14, 2.71) = {}", min(3.14, 2.71));

    // With chars
    println!("min('a', 'z') = {}", min('a', 'z'));

    // With strings
    println!("min(\"apple\", \"banana\") = {}", min("apple", "banana"));
}
```

---

## Generic Structs

```rust
// Single generic parameter
struct Point<T> {
    x: T,
    y: T,
}

// Multiple generic parameters
struct Pair<T, U> {
    first: T,
    second: U,
}

fn main() {
    // Same type for both fields
    let int_point = Point { x: 5, y: 10 };
    let float_point = Point { x: 1.0, y: 4.0 };

    println!("Int point: ({}, {})", int_point.x, int_point.y);
    println!("Float point: ({}, {})", float_point.x, float_point.y);

    // Different types
    let pair = Pair { first: 42, second: "hello" };
    println!("Pair: ({}, {})", pair.first, pair.second);
}
```

---

## Implementing Methods on Generic Structs

```rust
struct Point<T> {
    x: T,
    y: T,
}

// Methods for any Point<T>
impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point { x, y }
    }

    fn x(&self) -> &T {
        &self.x
    }

    fn y(&self) -> &T {
        &self.y
    }
}

// Methods only for Point<f64>
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

// Methods requiring traits
impl<T: std::fmt::Display> Point<T> {
    fn display(&self) {
        println!("Point({}, {})", self.x, self.y);
    }
}

fn main() {
    let p1 = Point::new(5, 10);
    println!("p1.x = {}", p1.x());

    let p2 = Point::new(3.0, 4.0);
    println!("Distance from origin: {}", p2.distance_from_origin());

    p1.display();
    p2.display();
}
```

---

## Hands-On Exercise 2: Generic Container

```rust
#[derive(Debug)]
struct Container<T> {
    items: Vec<T>,
}

impl<T> Container<T> {
    fn new() -> Self {
        Container { items: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }

    fn len(&self) -> usize {
        self.items.len()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    fn get(&self, index: usize) -> Option<&T> {
        self.items.get(index)
    }
}

impl<T: Clone> Container<T> {
    fn to_vec(&self) -> Vec<T> {
        self.items.clone()
    }
}

impl<T: std::fmt::Display> Container<T> {
    fn print_all(&self) {
        for item in &self.items {
            println!("  {}", item);
        }
    }
}

fn main() {
    // Container of integers
    let mut numbers: Container<i32> = Container::new();
    numbers.push(1);
    numbers.push(2);
    numbers.push(3);

    println!("Numbers:");
    numbers.print_all();

    // Container of strings
    let mut words: Container<String> = Container::new();
    words.push(String::from("hello"));
    words.push(String::from("world"));

    println!("\nWords:");
    words.print_all();

    println!("\nPopped from numbers: {:?}", numbers.pop());
    println!("Numbers length: {}", numbers.len());
}
```

---

## Generic Enums

You've already used generic enums!

```rust
// Option<T> - value might not exist
enum Option<T> {
    Some(T),
    None,
}

// Result<T, E> - operation might fail
enum Result<T, E> {
    Ok(T),
    Err(E),
}

// Custom generic enum
enum BinaryTree<T> {
    Empty,
    Node {
        value: T,
        left: Box<BinaryTree<T>>,
        right: Box<BinaryTree<T>>,
    },
}

fn main() {
    let some_number: Option<i32> = Some(42);
    let no_number: Option<i32> = None;

    let success: Result<i32, &str> = Ok(100);
    let failure: Result<i32, &str> = Err("failed");

    println!("{:?}, {:?}", some_number, no_number);
    println!("{:?}, {:?}", success, failure);
}
```

---

## Trait Bounds

Restrict generics to types implementing certain traits:

```rust
use std::fmt::Display;

// Single trait bound
fn print_value<T: Display>(value: T) {
    println!("Value: {}", value);
}

// Multiple trait bounds with +
fn compare_and_display<T: PartialOrd + Display>(a: T, b: T) {
    if a > b {
        println!("{} is greater than {}", a, b);
    } else {
        println!("{} is not greater than {}", a, b);
    }
}

// Where clause for cleaner syntax
fn complex_function<T, U>(t: T, u: U) -> i32
where
    T: Display + Clone,
    U: Clone + std::fmt::Debug,
{
    println!("T: {}", t);
    println!("U: {:?}", u);
    42
}

fn main() {
    print_value(42);
    print_value("hello");

    compare_and_display(5, 3);
    compare_and_display("apple", "banana");

    complex_function("test", vec![1, 2, 3]);
}
```

---

## Hands-On Exercise 3: Sortable Collection

```rust
struct SortedVec<T: Ord> {
    data: Vec<T>,
}

impl<T: Ord> SortedVec<T> {
    fn new() -> Self {
        SortedVec { data: Vec::new() }
    }

    fn insert(&mut self, value: T) {
        // Find position to insert
        let pos = self.data.iter().position(|x| x > &value).unwrap_or(self.data.len());
        self.data.insert(pos, value);
    }

    fn contains(&self, value: &T) -> bool {
        self.data.binary_search(value).is_ok()
    }

    fn get(&self, index: usize) -> Option<&T> {
        self.data.get(index)
    }

    fn len(&self) -> usize {
        self.data.len()
    }
}

impl<T: Ord + std::fmt::Debug> SortedVec<T> {
    fn print(&self) {
        println!("{:?}", self.data);
    }
}

fn main() {
    let mut sorted = SortedVec::new();

    sorted.insert(5);
    sorted.insert(2);
    sorted.insert(8);
    sorted.insert(1);
    sorted.insert(9);

    println!("Sorted vector:");
    sorted.print();

    println!("Contains 5: {}", sorted.contains(&5));
    println!("Contains 7: {}", sorted.contains(&7));

    // Works with other types too
    let mut words = SortedVec::new();
    words.insert("cherry");
    words.insert("apple");
    words.insert("banana");

    println!("\nSorted words:");
    words.print();
}
```

---

## Generic Methods with Different Types

```rust
struct Point<T, U> {
    x: T,
    y: U,
}

impl<T, U> Point<T, U> {
    fn new(x: T, y: U) -> Self {
        Point { x, y }
    }

    // Method that introduces new generic types
    fn mixup<V, W>(self, other: Point<V, W>) -> Point<T, W> {
        Point {
            x: self.x,
            y: other.y,
        }
    }
}

fn main() {
    let p1 = Point::new(5, 10.4);
    let p2 = Point::new("Hello", 'c');

    let p3 = p1.mixup(p2);

    println!("p3.x = {}, p3.y = {}", p3.x, p3.y);
}
```

---

## Hands-On Exercise 4: Generic Key-Value Store

```rust
use std::collections::HashMap;
use std::hash::Hash;

struct Store<K, V> {
    data: HashMap<K, V>,
}

impl<K: Eq + Hash, V> Store<K, V> {
    fn new() -> Self {
        Store {
            data: HashMap::new(),
        }
    }

    fn insert(&mut self, key: K, value: V) -> Option<V> {
        self.data.insert(key, value)
    }

    fn get(&self, key: &K) -> Option<&V> {
        self.data.get(key)
    }

    fn remove(&mut self, key: &K) -> Option<V> {
        self.data.remove(key)
    }

    fn contains(&self, key: &K) -> bool {
        self.data.contains_key(key)
    }

    fn len(&self) -> usize {
        self.data.len()
    }
}

impl<K: Eq + Hash, V: Clone> Store<K, V> {
    fn get_or_default(&self, key: &K, default: V) -> V {
        self.data.get(key).cloned().unwrap_or(default)
    }
}

impl<K: Eq + Hash + std::fmt::Debug, V: std::fmt::Debug> Store<K, V> {
    fn print_all(&self) {
        for (key, value) in &self.data {
            println!("  {:?} => {:?}", key, value);
        }
    }
}

fn main() {
    // Store with String keys and i32 values
    let mut scores: Store<String, i32> = Store::new();
    scores.insert("Alice".to_string(), 100);
    scores.insert("Bob".to_string(), 85);

    println!("Scores:");
    scores.print_all();

    println!("Alice's score: {:?}", scores.get(&"Alice".to_string()));
    println!("Unknown's score: {}", scores.get_or_default(&"Unknown".to_string(), 0));

    // Store with different types
    let mut config: Store<&str, bool> = Store::new();
    config.insert("debug", true);
    config.insert("verbose", false);

    println!("\nConfig:");
    config.print_all();
}
```

---

## Default Type Parameters

```rust
use std::ops::Add;

// Custom type with default
struct Counter<T = i32> {
    count: T,
}

impl<T: Default> Counter<T> {
    fn new() -> Self {
        Counter {
            count: T::default(),
        }
    }
}

impl<T: Add<Output = T> + Copy> Counter<T> {
    fn add(&mut self, value: T) {
        self.count = self.count + value;
    }
}

impl<T: std::fmt::Display> Counter<T> {
    fn display(&self) {
        println!("Count: {}", self.count);
    }
}

fn main() {
    // Uses default type i32
    let mut counter: Counter = Counter::new();
    counter.add(5);
    counter.add(3);
    counter.display();

    // Explicit type
    let mut float_counter: Counter<f64> = Counter::new();
    float_counter.add(1.5);
    float_counter.add(2.5);
    float_counter.display();
}
```

---

## Hands-On Exercise 5: Generic Result Handler

```rust
struct ResultHandler<T, E> {
    results: Vec<Result<T, E>>,
}

impl<T, E> ResultHandler<T, E> {
    fn new() -> Self {
        ResultHandler { results: Vec::new() }
    }

    fn add(&mut self, result: Result<T, E>) {
        self.results.push(result);
    }

    fn success_count(&self) -> usize {
        self.results.iter().filter(|r| r.is_ok()).count()
    }

    fn failure_count(&self) -> usize {
        self.results.iter().filter(|r| r.is_err()).count()
    }
}

impl<T: Clone, E> ResultHandler<T, E> {
    fn successes(&self) -> Vec<T> {
        self.results
            .iter()
            .filter_map(|r| r.as_ref().ok().cloned())
            .collect()
    }
}

impl<T, E: Clone> ResultHandler<T, E> {
    fn failures(&self) -> Vec<E> {
        self.results
            .iter()
            .filter_map(|r| r.as_ref().err().cloned())
            .collect()
    }
}

impl<T: std::fmt::Debug, E: std::fmt::Debug> ResultHandler<T, E> {
    fn report(&self) {
        println!("=== Result Report ===");
        println!("Total: {}", self.results.len());
        println!("Successes: {}", self.success_count());
        println!("Failures: {}", self.failure_count());

        println!("\nDetails:");
        for (i, result) in self.results.iter().enumerate() {
            match result {
                Ok(v) => println!("  [{}] Success: {:?}", i, v),
                Err(e) => println!("  [{}] Error: {:?}", i, e),
            }
        }
    }
}

fn main() {
    let mut handler: ResultHandler<i32, String> = ResultHandler::new();

    handler.add(Ok(42));
    handler.add(Err("Failed to parse".to_string()));
    handler.add(Ok(100));
    handler.add(Ok(55));
    handler.add(Err("Connection timeout".to_string()));

    handler.report();

    println!("\nSuccessful values: {:?}", handler.successes());
    println!("Error messages: {:?}", handler.failures());
}
```

---

## Const Generics (Compile-Time Values)

```rust
// Array with compile-time size
struct Array<T, const N: usize> {
    data: [T; N],
}

impl<T: Default + Copy, const N: usize> Array<T, N> {
    fn new() -> Self {
        Array {
            data: [T::default(); N],
        }
    }

    fn len(&self) -> usize {
        N
    }
}

impl<T: std::fmt::Debug, const N: usize> Array<T, N> {
    fn print(&self) {
        println!("{:?}", self.data);
    }
}

fn main() {
    let arr3: Array<i32, 3> = Array::new();
    let arr5: Array<f64, 5> = Array::new();

    println!("Array of 3: length = {}", arr3.len());
    arr3.print();

    println!("Array of 5: length = {}", arr5.len());
    arr5.print();
}
```

---

## Challenge: Generic Math Library

```rust
use std::ops::{Add, Sub, Mul, Div};

#[derive(Debug, Clone, Copy)]
struct Vector2<T> {
    x: T,
    y: T,
}

impl<T> Vector2<T> {
    fn new(x: T, y: T) -> Self {
        Vector2 { x, y }
    }
}

impl<T: Add<Output = T>> Add for Vector2<T> {
    type Output = Vector2<T>;

    fn add(self, other: Vector2<T>) -> Vector2<T> {
        Vector2 {
            x: self.x + other.x,
            y: self.y + other.y,
        }
    }
}

impl<T: Sub<Output = T>> Sub for Vector2<T> {
    type Output = Vector2<T>;

    fn sub(self, other: Vector2<T>) -> Vector2<T> {
        Vector2 {
            x: self.x - other.x,
            y: self.y - other.y,
        }
    }
}

impl<T: Mul<Output = T> + Copy> Vector2<T> {
    fn scale(self, scalar: T) -> Vector2<T> {
        Vector2 {
            x: self.x * scalar,
            y: self.y * scalar,
        }
    }
}

impl<T: Mul<Output = T> + Add<Output = T>> Vector2<T> {
    fn dot(self, other: Vector2<T>) -> T {
        self.x * other.x + self.y * other.y
    }
}

impl Vector2<f64> {
    fn magnitude(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

    fn normalize(&self) -> Vector2<f64> {
        let mag = self.magnitude();
        Vector2 {
            x: self.x / mag,
            y: self.y / mag,
        }
    }
}

fn main() {
    let v1 = Vector2::new(3.0, 4.0);
    let v2 = Vector2::new(1.0, 2.0);

    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
    println!("v1 + v2: {:?}", v1 + v2);
    println!("v1 - v2: {:?}", v1 - v2);
    println!("v1 * 2: {:?}", v1.scale(2.0));
    println!("v1 · v2: {}", v1.dot(v2));
    println!("v1 magnitude: {}", v1.magnitude());
    println!("v1 normalized: {:?}", v1.normalize());

    // Also works with integers
    let v3 = Vector2::new(5, 10);
    let v4 = Vector2::new(3, 4);
    println!("\nInteger vectors:");
    println!("v3 + v4: {:?}", v3 + v4);
    println!("v3 · v4: {}", v3.dot(v4));
}
```

---

## Key Takeaways

1. **Generics enable code reuse across types**
2. **Use `<T>` for type parameters**
3. **Trait bounds restrict what types can be used**
4. **Use `where` clause for complex bounds**
5. **Generic types have zero runtime cost (monomorphization)**
6. **impl blocks can have different generic constraints**
7. **Const generics allow compile-time values as parameters**

---

## Homework

1. Create a generic `Stack<T>` data structure with push, pop, and peek
2. Implement a generic `Pair<T, U>` that can compare if both values are equal
3. Build a generic `Cache<K, V>` with size limits
4. Create a generic `Matrix<T, const ROWS: usize, const COLS: usize>`

---

[← Previous: Day 13](day-13.md) | [Next: Day 15 - Traits →](day-15.md)
