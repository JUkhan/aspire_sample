# Day 5: References and Borrowing

## Learning Objectives
- Understand references and borrowing
- Learn the rules of references
- Master mutable vs immutable references
- Avoid dangling references

---

## The Problem with Ownership

```rust
// Tedious: passing ownership back and forth
fn main() {
    let s = String::from("hello");
    let (s, len) = calculate_length(s);  // Take and return ownership
    println!("Length of '{}' is {}", s, len);
}

fn calculate_length(s: String) -> (String, usize) {
    let length = s.len();
    (s, length)
}
```

**There's a better way: References!**

---

## References: Borrowing Without Taking Ownership

```rust
fn main() {
    let s = String::from("hello");
    let len = calculate_length(&s);  // Pass a reference
    println!("Length of '{}' is {}", s, len);  // s is still valid!
}

fn calculate_length(s: &String) -> usize {  // Takes a reference
    s.len()
}  // s goes out of scope, but since it doesn't have ownership, nothing happens
```

### Visualizing References

```
Stack                           Heap
+--------+                     +---+---+---+---+---+
| s  ptr | ------------------> | h | e | l | l | o |
| s  len | = 5                 +---+---+---+---+---+
| s  cap | = 5                       ^
+--------+                           |
| &s ptr | --------------------------+
+--------+    (reference points to s)
```

---

## Hands-On Exercise 1: Basic References

```rust
fn main() {
    let s = String::from("hello");

    // Create multiple references - all valid!
    let r1 = &s;
    let r2 = &s;
    let r3 = &s;

    println!("r1: {}", r1);
    println!("r2: {}", r2);
    println!("r3: {}", r3);
    println!("s:  {}", s);  // Original still valid

    // Pass to functions
    print_string(&s);
    print_length(&s);
    println!("After functions, s is still: {}", s);
}

fn print_string(s: &String) {
    println!("String: {}", s);
}

fn print_length(s: &String) {
    println!("Length: {}", s.len());
}
```

---

## Mutable References

To modify borrowed data, use `&mut`:

```rust
fn main() {
    let mut s = String::from("hello");

    change(&mut s);

    println!("Changed: {}", s);
}

fn change(s: &mut String) {
    s.push_str(", world!");
}
```

---

## Hands-On Exercise 2: Mutable References

```rust
fn main() {
    let mut name = String::from("Alice");
    println!("Original: {}", name);

    // Modify through mutable reference
    add_greeting(&mut name);
    println!("With greeting: {}", name);

    // Another modification
    make_uppercase(&mut name);
    println!("Uppercase: {}", name);

    // Multiple operations
    let mut counter = 0;
    increment(&mut counter);
    increment(&mut counter);
    increment(&mut counter);
    println!("Counter: {}", counter);
}

fn add_greeting(s: &mut String) {
    s.insert_str(0, "Hello, ");
    s.push('!');
}

fn make_uppercase(s: &mut String) {
    *s = s.to_uppercase();
}

fn increment(n: &mut i32) {
    *n += 1;
}
```

---

## The Rules of References

### Rule 1: One Mutable OR Multiple Immutable

```rust
fn main() {
    let mut s = String::from("hello");

    // Multiple immutable references - OK!
    let r1 = &s;
    let r2 = &s;
    println!("{} and {}", r1, r2);

    // Single mutable reference - OK!
    let r3 = &mut s;
    r3.push_str(" world");
    println!("{}", r3);

    // But NOT both at the same time!
    // let r4 = &s;
    // let r5 = &mut s;  // ERROR: cannot borrow as mutable
}
```

### Rule 2: References Must Be Valid

```rust
fn main() {
    let r;
    {
        let s = String::from("hello");
        // r = &s;  // ERROR: s doesn't live long enough
    }
    // println!("{}", r);  // s is already dropped!
}
```

---

## Hands-On Exercise 3: Reference Rules in Practice

```rust
fn main() {
    let mut data = vec![1, 2, 3, 4, 5];

    // Phase 1: Reading (multiple immutable references OK)
    let sum = calculate_sum(&data);
    let avg = calculate_average(&data);
    println!("Sum: {}, Average: {:.2}", sum, avg);

    // Phase 2: Writing (one mutable reference)
    double_all(&mut data);
    println!("Doubled: {:?}", data);

    // Phase 3: Reading again
    let new_sum = calculate_sum(&data);
    println!("New sum: {}", new_sum);
}

fn calculate_sum(numbers: &Vec<i32>) -> i32 {
    numbers.iter().sum()
}

fn calculate_average(numbers: &Vec<i32>) -> f64 {
    let sum: i32 = numbers.iter().sum();
    sum as f64 / numbers.len() as f64
}

fn double_all(numbers: &mut Vec<i32>) {
    for n in numbers.iter_mut() {
        *n *= 2;
    }
}
```

---

## Non-Lexical Lifetimes (NLL)

Rust is smart about when references end:

```rust
fn main() {
    let mut s = String::from("hello");

    let r1 = &s;
    let r2 = &s;
    println!("{} and {}", r1, r2);
    // r1 and r2 are no longer used after this point

    let r3 = &mut s;  // OK! r1 and r2 are "done"
    r3.push_str(" world");
    println!("{}", r3);
}
```

---

## Dereferencing

```rust
fn main() {
    let x = 5;
    let r = &x;

    // Use * to dereference
    println!("r points to: {}", *r);

    // For comparison, we need to dereference or compare references
    assert_eq!(5, *r);
    assert_eq!(&5, r);

    // With mutable references
    let mut y = 10;
    let r_mut = &mut y;
    *r_mut += 5;  // Modify through dereference
    println!("y is now: {}", y);
}
```

---

## Hands-On Exercise 4: Working with References

```rust
fn main() {
    // Swapping values using mutable references
    let mut a = 5;
    let mut b = 10;

    println!("Before: a = {}, b = {}", a, b);
    swap(&mut a, &mut b);
    println!("After:  a = {}, b = {}", a, b);

    // Finding max using immutable references
    let x = 42;
    let y = 17;
    let max = find_max(&x, &y);
    println!("Max of {} and {} is {}", x, y, max);
}

fn swap(a: &mut i32, b: &mut i32) {
    let temp = *a;
    *a = *b;
    *b = temp;
}

fn find_max<'a>(a: &'a i32, b: &'a i32) -> &'a i32 {
    if a > b { a } else { b }
}
```

---

## String Slices: A Special Reference

```rust
fn main() {
    let s = String::from("hello world");

    // String slices reference parts of a String
    let hello = &s[0..5];   // "hello"
    let world = &s[6..11];  // "world"

    println!("{} {}", hello, world);

    // Shorthand
    let hello = &s[..5];    // From start
    let world = &s[6..];    // To end
    let full = &s[..];      // Entire string

    println!("{} {} {}", hello, world, full);
}
```

---

## Hands-On Exercise 5: First Word Function

```rust
fn main() {
    let sentence = String::from("Hello Rust World");

    let first = first_word(&sentence);
    println!("First word: {}", first);

    let second = second_word(&sentence);
    match second {
        Some(word) => println!("Second word: {}", word),
        None => println!("No second word"),
    }
}

fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();

    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[..i];
        }
    }

    &s[..]  // Return whole string if no space found
}

fn second_word(s: &str) -> Option<&str> {
    let mut spaces = 0;
    let mut start = 0;
    let bytes = s.as_bytes();

    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            spaces += 1;
            if spaces == 1 {
                start = i + 1;
            } else if spaces == 2 {
                return Some(&s[start..i]);
            }
        }
    }

    if spaces >= 1 {
        Some(&s[start..])
    } else {
        None
    }
}
```

---

## &str vs String

```rust
fn main() {
    // String: owned, heap-allocated, mutable
    let mut owned = String::from("hello");
    owned.push_str(" world");

    // &str: borrowed slice, can be from String or literal
    let slice: &str = &owned[..];
    let literal: &str = "hello world";  // String literal is &str

    // Functions often take &str to be flexible
    print_message(&owned);      // &String coerces to &str
    print_message(slice);       // Already &str
    print_message(literal);     // Already &str
    print_message("inline");    // Literal is &str
}

fn print_message(msg: &str) {
    println!("Message: {}", msg);
}
```

---

## Hands-On Exercise 6: Building a Text Analyzer

```rust
fn main() {
    let text = "Rust is a systems programming language that runs blazingly fast";

    println!("Text: {}", text);
    println!("Word count: {}", word_count(text));
    println!("Character count: {}", char_count(text));
    println!("Longest word: {}", longest_word(text));
    println!("Contains 'Rust': {}", contains_word(text, "Rust"));
    println!("Contains 'Python': {}", contains_word(text, "Python"));
}

fn word_count(s: &str) -> usize {
    s.split_whitespace().count()
}

fn char_count(s: &str) -> usize {
    s.chars().count()
}

fn longest_word(s: &str) -> &str {
    let mut longest = "";
    for word in s.split_whitespace() {
        if word.len() > longest.len() {
            longest = word;
        }
    }
    longest
}

fn contains_word(text: &str, word: &str) -> bool {
    text.split_whitespace().any(|w| w == word)
}
```

---

## Common Borrowing Patterns

### Pattern 1: Read-Only Access

```rust
fn print_info(data: &Vec<i32>) {
    println!("Length: {}", data.len());
    println!("Sum: {}", data.iter().sum::<i32>());
}
```

### Pattern 2: Modify In Place

```rust
fn normalize(data: &mut Vec<f64>) {
    let max = data.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    for value in data.iter_mut() {
        *value /= max;
    }
}
```

### Pattern 3: Return Reference to Input

```rust
fn longest<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() > b.len() { a } else { b }
}
```

---

## Challenge: Safe Vector Operations

```rust
fn main() {
    let mut numbers = vec![1, 2, 3, 4, 5];

    // Read operations
    println!("First: {:?}", get_first(&numbers));
    println!("Last: {:?}", get_last(&numbers));
    println!("Sum: {}", sum_all(&numbers));

    // Modify operations
    append(&mut numbers, 6);
    remove_first(&mut numbers);

    println!("Final: {:?}", numbers);
}

fn get_first(v: &Vec<i32>) -> Option<&i32> {
    v.first()
}

fn get_last(v: &Vec<i32>) -> Option<&i32> {
    v.last()
}

fn sum_all(v: &Vec<i32>) -> i32 {
    v.iter().sum()
}

fn append(v: &mut Vec<i32>, value: i32) {
    v.push(value);
}

fn remove_first(v: &mut Vec<i32>) -> Option<i32> {
    if v.is_empty() {
        None
    } else {
        Some(v.remove(0))
    }
}
```

---

## Key Takeaways

1. **References borrow without taking ownership**
2. **`&T` is an immutable reference**
3. **`&mut T` is a mutable reference**
4. **Can have many `&T` OR one `&mut T`, not both**
5. **References must always be valid**
6. **`&str` is a string slice (reference)**
7. **Use references in function parameters when possible**

---

## Homework

1. Write a function that finds all words starting with a given letter
2. Create a function that reverses a string in place using mutable reference
3. Implement a function that splits a string slice into two at a given index
4. Build a simple text statistics calculator (words, sentences, paragraphs)

---

## Quick Reference

```rust
// Immutable reference
let r = &x;

// Mutable reference
let r = &mut x;

// Dereference
*r = 10;

// String slice
let slice = &s[start..end];

// Function taking reference
fn foo(s: &String) { }

// Function taking mutable reference
fn bar(s: &mut String) { }

// Function taking string slice (preferred)
fn baz(s: &str) { }
```

---

[← Previous: Day 4](day-04.md) | [Next: Day 6 - Slices →](day-06.md)
