# Day 4: Ownership - The Core Concept

## Learning Objectives
- Understand Rust's ownership system
- Learn the three ownership rules
- Master the concepts of move and copy
- Understand scope and memory management

---

## Why Ownership?

Rust manages memory through ownership with rules checked at compile time. No garbage collector needed!

**The Three Rules of Ownership:**
1. Each value in Rust has an **owner**
2. There can only be **one owner** at a time
3. When the owner goes out of **scope**, the value is dropped

---

## Stack vs Heap

```rust
fn main() {
    // Stack: Fixed size, fast, automatic cleanup
    let x = 5;        // Stored on stack
    let y = true;     // Stored on stack

    // Heap: Dynamic size, slower, manual management
    let s = String::from("hello");  // Data on heap, pointer on stack

    println!("x: {}, y: {}, s: {}", x, y, s);
}
```

### Visualizing Memory

```
Stack                    Heap
+--------+              +---+---+---+---+---+
| s ptr  | ---------->  | h | e | l | l | o |
| s len  | = 5          +---+---+---+---+---+
| s cap  | = 5
+--------+
| y      | = true
+--------+
| x      | = 5
+--------+
```

---

## Hands-On Exercise 1: Scope and Drop

```rust
fn main() {
    {
        let s = String::from("hello");
        println!("Inside scope: {}", s);
    }  // s goes out of scope, memory is freed (drop is called)

    // println!("{}", s);  // ERROR! s doesn't exist here

    let outer = String::from("outer");
    {
        let inner = String::from("inner");
        println!("outer: {}, inner: {}", outer, inner);
    }
    println!("outer still exists: {}", outer);
    // inner is gone
}
```

---

## The Move Concept

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1;  // s1 is MOVED to s2

    // println!("{}", s1);  // ERROR! s1 is no longer valid
    println!("{}", s2);     // OK! s2 owns the data now
}
```

### Why Move?

If both s1 and s2 pointed to the same memory, when they go out of scope, Rust would try to free the same memory twice (double free error). Move prevents this!

```
After: let s2 = s1;

Stack                    Heap
+--------+              +---+---+---+---+---+
| s1 ptr | (invalid)    | h | e | l | l | o |
| s1 len |              +---+---+---+---+---+
| s1 cap |                    ^
+--------+                    |
| s2 ptr | -------------------+
| s2 len | = 5
| s2 cap | = 5
+--------+
```

---

## Hands-On Exercise 2: Move in Action

```rust
fn main() {
    // Move with assignment
    let name = String::from("Alice");
    let moved_name = name;
    // println!("Original: {}", name);  // ERROR!
    println!("Moved: {}", moved_name);

    // Move with function call
    let greeting = String::from("Hello!");
    takes_ownership(greeting);
    // println!("{}", greeting);  // ERROR! greeting was moved

    // Getting value back
    let s = String::from("hello");
    let s = returns_ownership(s);  // Get it back
    println!("Got back: {}", s);
}

fn takes_ownership(s: String) {
    println!("Took ownership of: {}", s);
}  // s is dropped here

fn returns_ownership(s: String) -> String {
    println!("Will return: {}", s);
    s  // Ownership is returned
}
```

---

## The Copy Trait

Simple types that live entirely on the stack implement `Copy`:

```rust
fn main() {
    // These types implement Copy
    let x = 5;
    let y = x;  // Copy, not move!
    println!("x: {}, y: {}", x, y);  // Both valid!

    let a = 3.14;
    let b = a;  // Copy
    println!("a: {}, b: {}", a, b);

    let c = true;
    let d = c;  // Copy
    println!("c: {}, d: {}", c, d);

    let e = 'z';
    let f = e;  // Copy
    println!("e: {}, f: {}", e, f);

    // Tuples of Copy types are also Copy
    let point = (3, 4);
    let point2 = point;
    println!("point: {:?}, point2: {:?}", point, point2);
}
```

### Copy Types in Rust
- All integer types (`i32`, `u64`, etc.)
- All floating-point types (`f32`, `f64`)
- `bool`
- `char`
- Tuples (if all elements are Copy)
- Arrays (if all elements are Copy)

---

## Hands-On Exercise 3: Copy vs Move

```rust
fn main() {
    // Copy types - integers
    let num = 42;
    let num_copy = num;
    println!("Original: {}, Copy: {}", num, num_copy);

    uses_integer(num);
    println!("Still have: {}", num);  // Still works!

    // Move types - String
    let text = String::from("hello");
    let text_moved = text;
    // println!("Original: {}", text);  // ERROR!
    println!("Moved: {}", text_moved);

    // Solution 1: Clone (explicit deep copy)
    let original = String::from("world");
    let cloned = original.clone();
    println!("Original: {}, Clone: {}", original, cloned);
}

fn uses_integer(n: i32) {
    println!("Using integer: {}", n);
}  // n goes out of scope, but it was just a copy
```

---

## Clone - Deep Copy

```rust
fn main() {
    let s1 = String::from("hello");
    let s2 = s1.clone();  // Deep copy - both are valid

    println!("s1: {}, s2: {}", s1, s2);

    // Clone with vectors
    let v1 = vec![1, 2, 3];
    let v2 = v1.clone();

    println!("v1: {:?}, v2: {:?}", v1, v2);
}
```

---

## Ownership and Functions

```rust
fn main() {
    // String - ownership moves
    let s = String::from("hello");
    takes_string(s);
    // s is no longer valid here

    // Integer - copy happens
    let n = 5;
    takes_integer(n);
    println!("n is still valid: {}", n);

    // Return value transfers ownership
    let s2 = gives_string();
    println!("Got: {}", s2);

    // Take and give back
    let s3 = String::from("hello");
    let s3 = takes_and_gives_back(s3);
    println!("Got back: {}", s3);
}

fn takes_string(s: String) {
    println!("Took: {}", s);
}

fn takes_integer(n: i32) {
    println!("Copied: {}", n);
}

fn gives_string() -> String {
    String::from("new string")
}

fn takes_and_gives_back(s: String) -> String {
    println!("Processing: {}", s);
    s
}
```

---

## Hands-On Exercise 4: Ownership Transfer

```rust
fn main() {
    let mut names = Vec::new();

    names.push(create_name("Alice"));
    names.push(create_name("Bob"));
    names.push(create_name("Charlie"));

    println!("Names: {:?}", names);

    // Process and get back
    let processed = process_names(names);
    // names is no longer valid

    println!("Processed: {:?}", processed);
}

fn create_name(name: &str) -> String {
    let mut full = String::from("Hello, ");
    full.push_str(name);
    full  // Ownership transferred to caller
}

fn process_names(mut names: Vec<String>) -> Vec<String> {
    for name in &mut names {
        name.push_str("!");
    }
    names  // Return ownership
}
```

---

## Hands-On Exercise 5: Multiple Return Values

When you need to return ownership plus additional data:

```rust
fn main() {
    let s = String::from("hello world");

    let (s, length) = calculate_length(s);

    println!("'{}' has length {}", s, length);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len();
    (s, length)  // Return both
}
```

> This is tedious! Tomorrow we'll learn about **references** for a better solution.

---

## Hands-On Exercise 6: Building a String Processor

```rust
fn main() {
    // Create a string
    let text = String::from("rust programming");

    // Transform it through multiple functions
    let text = capitalize_first(text);
    let text = add_exclamation(text);
    let text = duplicate(text);

    println!("Final: {}", text);
}

fn capitalize_first(s: String) -> String {
    let mut chars: Vec<char> = s.chars().collect();
    if let Some(first) = chars.first_mut() {
        *first = first.to_uppercase().next().unwrap();
    }
    chars.into_iter().collect()
}

fn add_exclamation(mut s: String) -> String {
    s.push('!');
    s
}

fn duplicate(s: String) -> String {
    format!("{} {}", s, s)
}
```

---

## Common Ownership Patterns

### Pattern 1: Clone when needed

```rust
fn main() {
    let original = String::from("important data");

    // Clone for independent use
    let backup = original.clone();

    process(original);
    println!("Backup: {}", backup);
}

fn process(s: String) {
    println!("Processing: {}", s);
}
```

### Pattern 2: Return ownership

```rust
fn main() {
    let data = String::from("data");
    let data = transform(data);
    println!("Transformed: {}", data);
}

fn transform(s: String) -> String {
    s.to_uppercase()
}
```

### Pattern 3: Use references (preview of Day 5)

```rust
fn main() {
    let data = String::from("data");
    let len = get_length(&data);  // Borrow, don't move
    println!("'{}' has length {}", data, len);  // data still valid!
}

fn get_length(s: &String) -> usize {
    s.len()
}
```

---

## Challenge: Ownership Puzzle

```rust
fn main() {
    let a = String::from("a");
    let b = String::from("b");
    let c = String::from("c");

    // Chain transformations
    let result = combine(a, b);
    let result = combine(result, c);

    println!("Result: {}", result);

    // Challenge: Create a function that combines three strings
    let x = String::from("x");
    let y = String::from("y");
    let z = String::from("z");

    let combined = combine_three(x, y, z);
    println!("Combined: {}", combined);
}

fn combine(a: String, b: String) -> String {
    format!("{}-{}", a, b)
}

fn combine_three(a: String, b: String, c: String) -> String {
    format!("{}-{}-{}", a, b, c)
}
```

---

## Visualizing Ownership

```rust
fn main() {
    println!("=== Ownership Flow ===\n");

    let s = String::from("hello");
    println!("1. Created 's': {:p}", &s);  // Print pointer

    let s2 = s;  // Move
    println!("2. Moved to 's2': {:p}", &s2);
    // s is now invalid

    let s3 = s2.clone();  // Clone
    println!("3. Cloned to 's3': {:p}", &s3);
    println!("   's2' still at: {:p}", &s2);

    drop(s2);  // Explicit drop
    println!("4. Dropped 's2'");

    println!("5. 's3' still valid: {}", s3);
}
```

---

## Key Takeaways

1. **Each value has exactly one owner**
2. **When owner goes out of scope, value is dropped**
3. **Assignment moves ownership for heap data**
4. **Simple types (integers, etc.) implement Copy**
5. **Use clone() for explicit deep copies**
6. **Functions take ownership of parameters**
7. **Return values transfer ownership to caller**

---

## Homework

1. Create a function that takes a String and returns it reversed
2. Write a program that demonstrates all three ownership rules
3. Create a "string builder" that chains multiple transformations
4. Experiment with what types implement Copy

---

## Common Errors to Watch For

```rust
// Error 1: Use after move
let s = String::from("hello");
let s2 = s;
// println!("{}", s);  // ERROR: value borrowed after move

// Error 2: Move in loop
let s = String::from("hello");
for _ in 0..3 {
    // takes_string(s);  // ERROR: use of moved value
}

// Solution: clone in loop
let s = String::from("hello");
for _ in 0..3 {
    takes_string(s.clone());  // OK
}
```

---

[← Previous: Day 3](day-03.md) | [Next: Day 5 - References and Borrowing →](day-05.md)
