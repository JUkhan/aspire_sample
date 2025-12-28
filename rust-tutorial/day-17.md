# Day 17: Closures

## Learning Objectives
- Understand closures and how they capture variables
- Use closures as function parameters
- Implement the Fn traits
- Apply closures in iterators and callbacks

---

## What Are Closures?

Closures are anonymous functions that can capture their environment:

```rust
fn main() {
    // Basic closure
    let add = |a, b| a + b;
    println!("5 + 3 = {}", add(5, 3));

    // Closure with type annotations
    let multiply: fn(i32, i32) -> i32 = |a, b| a * b;
    println!("5 * 3 = {}", multiply(5, 3));

    // Closure with block body
    let complex = |x| {
        let y = x * 2;
        let z = y + 10;
        z * 3
    };
    println!("complex(5) = {}", complex(5));
}
```

---

## Capturing Variables

Closures can capture variables from their environment:

```rust
fn main() {
    // Capture by reference (borrowing)
    let x = 10;
    let add_x = |n| n + x;  // x is borrowed
    println!("add_x(5) = {}", add_x(5));
    println!("x is still: {}", x);  // x still usable

    // Capture by mutable reference
    let mut count = 0;
    let mut increment = || {
        count += 1;  // Mutably borrows count
    };
    increment();
    increment();
    println!("Count: {}", count);

    // Capture by value (moving)
    let s = String::from("hello");
    let print_s = move || {
        println!("s = {}", s);  // s is moved into closure
    };
    print_s();
    // println!("{}", s);  // Error: s was moved
}
```

---

## Hands-On Exercise 1: Counter Factory

```rust
fn make_counter(start: i32) -> impl FnMut() -> i32 {
    let mut count = start;
    move || {
        count += 1;
        count
    }
}

fn make_step_counter(start: i32, step: i32) -> impl FnMut() -> i32 {
    let mut count = start;
    move || {
        count += step;
        count
    }
}

fn main() {
    let mut counter1 = make_counter(0);
    let mut counter2 = make_counter(100);

    println!("Counter 1: {}", counter1());
    println!("Counter 1: {}", counter1());
    println!("Counter 2: {}", counter2());
    println!("Counter 1: {}", counter1());
    println!("Counter 2: {}", counter2());

    let mut by_five = make_step_counter(0, 5);
    for _ in 0..5 {
        println!("By 5: {}", by_five());
    }
}
```

---

## The Three Fn Traits

```rust
// FnOnce - takes ownership, can only be called once
fn call_once<F: FnOnce()>(f: F) {
    f();
}

// FnMut - takes mutable reference, can be called multiple times
fn call_mut<F: FnMut()>(mut f: F) {
    f();
    f();
}

// Fn - takes immutable reference, can be called multiple times
fn call_fn<F: Fn()>(f: F) {
    f();
    f();
}

fn main() {
    // FnOnce - consumes captured variable
    let s = String::from("hello");
    let consume = || {
        drop(s);  // Takes ownership of s
    };
    call_once(consume);

    // FnMut - mutates captured variable
    let mut count = 0;
    let mut_closure = || {
        count += 1;
        println!("Count: {}", count);
    };
    call_mut(mut_closure);

    // Fn - only reads captured variable
    let x = 42;
    let read_closure = || {
        println!("x = {}", x);
    };
    call_fn(read_closure);
}
```

---

## Closures as Parameters

```rust
fn apply<F>(f: F, value: i32) -> i32
where
    F: Fn(i32) -> i32,
{
    f(value)
}

fn apply_twice<F>(f: F, value: i32) -> i32
where
    F: Fn(i32) -> i32,
{
    f(f(value))
}

fn do_operation<F>(mut f: F, times: u32)
where
    F: FnMut(),
{
    for _ in 0..times {
        f();
    }
}

fn main() {
    // Pass closure to function
    let double = |x| x * 2;
    println!("apply double to 5: {}", apply(double, 5));
    println!("apply_twice double to 5: {}", apply_twice(double, 5));

    // Stateful closure
    let mut sum = 0;
    do_operation(|| {
        sum += 1;
        println!("Sum is now: {}", sum);
    }, 3);
}
```

---

## Hands-On Exercise 2: Higher-Order Functions

```rust
fn map_vec<T, U, F>(vec: Vec<T>, f: F) -> Vec<U>
where
    F: Fn(T) -> U,
{
    vec.into_iter().map(f).collect()
}

fn filter_vec<T, F>(vec: Vec<T>, predicate: F) -> Vec<T>
where
    F: Fn(&T) -> bool,
{
    vec.into_iter().filter(|x| predicate(x)).collect()
}

fn reduce_vec<T, U, F>(vec: Vec<T>, initial: U, f: F) -> U
where
    F: Fn(U, T) -> U,
{
    vec.into_iter().fold(initial, f)
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // Map: square each number
    let squared = map_vec(numbers.clone(), |x| x * x);
    println!("Squared: {:?}", squared);

    // Filter: keep even numbers
    let evens = filter_vec(numbers.clone(), |x| x % 2 == 0);
    println!("Evens: {:?}", evens);

    // Reduce: sum all numbers
    let sum = reduce_vec(numbers.clone(), 0, |acc, x| acc + x);
    println!("Sum: {}", sum);

    // Chain operations
    let result = map_vec(
        filter_vec(numbers, |x| x % 2 == 1),  // Keep odd
        |x| x * 10,  // Multiply by 10
    );
    println!("Odd * 10: {:?}", result);
}
```

---

## Closures with Iterators

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // map
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();
    println!("Doubled: {:?}", doubled);

    // filter
    let evens: Vec<&i32> = numbers.iter().filter(|x| *x % 2 == 0).collect();
    println!("Evens: {:?}", evens);

    // find
    let first_greater_than_5 = numbers.iter().find(|&&x| x > 5);
    println!("First > 5: {:?}", first_greater_than_5);

    // any and all
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    let all_positive = numbers.iter().all(|x| *x > 0);
    println!("Has even: {}, All positive: {}", has_even, all_positive);

    // fold
    let product: i32 = numbers.iter().fold(1, |acc, x| acc * x);
    println!("Product: {}", product);

    // for_each
    print!("Each doubled: ");
    numbers.iter().for_each(|x| print!("{} ", x * 2));
    println!();
}
```

---

## Hands-On Exercise 3: Event Handler System

```rust
type EventHandler = Box<dyn Fn(&str)>;

struct EventEmitter {
    handlers: Vec<EventHandler>,
}

impl EventEmitter {
    fn new() -> Self {
        EventEmitter {
            handlers: Vec::new(),
        }
    }

    fn on<F: Fn(&str) + 'static>(&mut self, handler: F) {
        self.handlers.push(Box::new(handler));
    }

    fn emit(&self, message: &str) {
        for handler in &self.handlers {
            handler(message);
        }
    }
}

fn main() {
    let mut emitter = EventEmitter::new();

    // Add handlers using closures
    emitter.on(|msg| {
        println!("[Logger] {}", msg);
    });

    emitter.on(|msg| {
        println!("[Uppercase] {}", msg.to_uppercase());
    });

    let prefix = String::from("Alert: ");
    emitter.on(move |msg| {
        println!("{}{}", prefix, msg);
    });

    emitter.emit("Hello, World!");
    println!();
    emitter.emit("Testing events");
}
```

---

## Returning Closures

```rust
// Return closure using impl Trait
fn make_adder(x: i32) -> impl Fn(i32) -> i32 {
    move |y| x + y
}

// Return closure using Box (for different closure types)
fn make_operation(op: &str) -> Box<dyn Fn(i32, i32) -> i32> {
    match op {
        "add" => Box::new(|a, b| a + b),
        "sub" => Box::new(|a, b| a - b),
        "mul" => Box::new(|a, b| a * b),
        "div" => Box::new(|a, b| a / b),
        _ => Box::new(|_, _| 0),
    }
}

fn main() {
    let add_5 = make_adder(5);
    let add_10 = make_adder(10);

    println!("add_5(3) = {}", add_5(3));
    println!("add_10(3) = {}", add_10(3));

    let add = make_operation("add");
    let mul = make_operation("mul");

    println!("add(10, 5) = {}", add(10, 5));
    println!("mul(10, 5) = {}", mul(10, 5));
}
```

---

## Hands-On Exercise 4: Middleware Chain

```rust
type Middleware = Box<dyn Fn(&str) -> String>;

struct Pipeline {
    middlewares: Vec<Middleware>,
}

impl Pipeline {
    fn new() -> Self {
        Pipeline {
            middlewares: Vec::new(),
        }
    }

    fn add<F: Fn(&str) -> String + 'static>(&mut self, middleware: F) {
        self.middlewares.push(Box::new(middleware));
    }

    fn execute(&self, input: &str) -> String {
        let mut result = input.to_string();
        for middleware in &self.middlewares {
            result = middleware(&result);
        }
        result
    }
}

fn main() {
    let mut pipeline = Pipeline::new();

    // Add middleware functions
    pipeline.add(|s| {
        println!("Step 1: Trimming");
        s.trim().to_string()
    });

    pipeline.add(|s| {
        println!("Step 2: Lowercase");
        s.to_lowercase()
    });

    pipeline.add(|s| {
        println!("Step 3: Replace spaces");
        s.replace(' ', "_")
    });

    pipeline.add(|s| {
        println!("Step 4: Add prefix");
        format!("processed_{}", s)
    });

    let input = "  Hello World  ";
    println!("Input: '{}'", input);
    println!("---");
    let output = pipeline.execute(input);
    println!("---");
    println!("Output: '{}'", output);
}
```

---

## Move Closures

```rust
fn main() {
    // Without move - borrows
    let x = vec![1, 2, 3];
    let borrow_closure = || {
        println!("Borrowed: {:?}", x);
    };
    borrow_closure();
    println!("x still available: {:?}", x);

    // With move - takes ownership
    let y = vec![4, 5, 6];
    let move_closure = move || {
        println!("Moved: {:?}", y);
    };
    move_closure();
    // println!("{:?}", y);  // Error: y was moved

    // Move is required for threads
    let data = vec![1, 2, 3];
    std::thread::spawn(move || {
        println!("In thread: {:?}", data);
    }).join().unwrap();
}
```

---

## Hands-On Exercise 5: Lazy Evaluation

```rust
struct Lazy<T, F>
where
    F: FnOnce() -> T,
{
    value: Option<T>,
    init: Option<F>,
}

impl<T, F> Lazy<T, F>
where
    F: FnOnce() -> T,
{
    fn new(init: F) -> Self {
        Lazy {
            value: None,
            init: Some(init),
        }
    }

    fn get(&mut self) -> &T {
        if self.value.is_none() {
            let init = self.init.take().unwrap();
            self.value = Some(init());
        }
        self.value.as_ref().unwrap()
    }
}

fn expensive_computation() -> i32 {
    println!("Computing expensive value...");
    std::thread::sleep(std::time::Duration::from_millis(100));
    42
}

fn main() {
    println!("Creating lazy value...");
    let mut lazy = Lazy::new(|| expensive_computation());

    println!("Lazy value created (not computed yet)");

    println!("First access:");
    println!("Value: {}", lazy.get());

    println!("Second access (cached):");
    println!("Value: {}", lazy.get());

    // Closure with captured values
    let multiplier = 10;
    let mut lazy2 = Lazy::new(move || {
        println!("Computing with multiplier...");
        5 * multiplier
    });

    println!("\nLazy2 first access: {}", lazy2.get());
    println!("Lazy2 second access: {}", lazy2.get());
}
```

---

## Closure Performance

```rust
fn main() {
    // Function pointer (no capture)
    let fn_ptr: fn(i32) -> i32 = |x| x * 2;

    // Zero-sized closure (no capture)
    let zero_sized = |x: i32| x * 2;
    println!("Size of zero_sized: {}", std::mem::size_of_val(&zero_sized));

    // Closure with capture
    let y = 10;
    let with_capture = |x: i32| x + y;
    println!("Size of with_capture: {}", std::mem::size_of_val(&with_capture));

    // Closure with larger capture
    let data = vec![1, 2, 3, 4, 5];
    let with_vec = || data.len();
    println!("Size of with_vec: {}", std::mem::size_of_val(&with_vec));

    println!("\nResults:");
    println!("fn_ptr(5) = {}", fn_ptr(5));
    println!("zero_sized(5) = {}", zero_sized(5));
    println!("with_capture(5) = {}", with_capture(5));
    println!("with_vec() = {}", with_vec());
}
```

---

## Challenge: Composable Functions

```rust
fn compose<A, B, C, F, G>(f: F, g: G) -> impl Fn(A) -> C
where
    F: Fn(A) -> B,
    G: Fn(B) -> C,
{
    move |x| g(f(x))
}

fn pipe<T, F>(value: T, f: F) -> T
where
    F: FnOnce(T) -> T,
{
    f(value)
}

fn chain<T>(value: T) -> Chain<T> {
    Chain { value }
}

struct Chain<T> {
    value: T,
}

impl<T> Chain<T> {
    fn apply<U, F: FnOnce(T) -> U>(self, f: F) -> Chain<U> {
        Chain { value: f(self.value) }
    }

    fn finish(self) -> T {
        self.value
    }
}

fn main() {
    // Compose two functions
    let add_one = |x: i32| x + 1;
    let double = |x: i32| x * 2;
    let stringify = |x: i32| x.to_string();

    let add_then_double = compose(add_one, double);
    println!("add_then_double(5) = {}", add_then_double(5));

    let triple_compose = compose(compose(add_one, double), stringify);
    println!("triple_compose(5) = {}", triple_compose(5));

    // Chain operations fluently
    let result = chain(5)
        .apply(|x| x + 1)
        .apply(|x| x * 2)
        .apply(|x| x.to_string())
        .apply(|s| format!("Result: {}", s))
        .finish();

    println!("{}", result);

    // More complex chain
    let text_result = chain("  Hello World  ")
        .apply(|s| s.trim().to_string())
        .apply(|s| s.to_lowercase())
        .apply(|s| s.replace(' ', "_"))
        .finish();

    println!("Processed text: {}", text_result);
}
```

---

## Key Takeaways

1. **Closures are anonymous functions with `|args| body`**
2. **Closures capture environment variables automatically**
3. **Three traits: Fn, FnMut, FnOnce**
4. **Use `move` to take ownership of captured variables**
5. **Closures work seamlessly with iterators**
6. **Return closures with `impl Fn` or `Box<dyn Fn>`**
7. **Zero-sized closures have no runtime overhead**

---

## Homework

1. Create a `memoize` function that caches closure results
2. Implement a `retry` function that retries a closure on failure
3. Build a simple expression evaluator using closures
4. Create a debounce function that limits closure execution rate

---

[← Previous: Day 16](day-16.md) | [Next: Day 18 - Iterators →](day-18.md)
