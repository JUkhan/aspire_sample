# Day 16: Lifetimes

## Learning Objectives
- Understand why lifetimes exist
- Use lifetime annotations
- Apply lifetime elision rules
- Work with lifetimes in structs

---

## Why Lifetimes?

Lifetimes prevent dangling references:

```rust
fn main() {
    let r;
    {
        let x = 5;
        r = &x;  // ERROR: x doesn't live long enough
    }
    // println!("{}", r);  // r would point to invalid memory
}
```

The compiler uses lifetimes to ensure references are always valid.

---

## Lifetime Annotations

Lifetime annotations describe how references relate to each other:

```rust
// This won't compile - which input does the output reference?
// fn longest(x: &str, y: &str) -> &str { ... }

// With lifetime annotations
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

fn main() {
    let string1 = String::from("long string is long");
    let string2 = String::from("xyz");

    let result = longest(&string1, &string2);
    println!("Longest: {}", result);
}
```

The `'a` annotation means: "The returned reference lives as long as the shortest of the input lifetimes."

---

## Hands-On Exercise 1: Basic Lifetime Annotations

```rust
// Returns a reference to the first non-empty string
fn first_non_empty<'a>(s1: &'a str, s2: &'a str) -> &'a str {
    if !s1.is_empty() {
        s1
    } else {
        s2
    }
}

// Returns reference to the larger slice
fn larger_slice<'a, T>(s1: &'a [T], s2: &'a [T]) -> &'a [T] {
    if s1.len() >= s2.len() {
        s1
    } else {
        s2
    }
}

// Returns reference to element if found
fn find_element<'a, T: PartialEq>(slice: &'a [T], target: &T) -> Option<&'a T> {
    slice.iter().find(|&x| x == target)
}

fn main() {
    let s1 = "Hello";
    let s2 = "";
    println!("First non-empty: {}", first_non_empty(s1, s2));

    let arr1 = [1, 2, 3, 4, 5];
    let arr2 = [10, 20, 30];
    println!("Larger slice: {:?}", larger_slice(&arr1, &arr2));

    let numbers = [1, 2, 3, 4, 5];
    println!("Found 3: {:?}", find_element(&numbers, &3));
    println!("Found 9: {:?}", find_element(&numbers, &9));
}
```

---

## Lifetime Elision Rules

The compiler can infer lifetimes in many cases:

```rust
// Rule 1: Each reference parameter gets its own lifetime
// fn foo(x: &str, y: &str) -> ...
// becomes: fn foo<'a, 'b>(x: &'a str, y: &'b str) -> ...

// Rule 2: If there's exactly one input lifetime, it's assigned to all outputs
// fn foo(x: &str) -> &str
// becomes: fn foo<'a>(x: &'a str) -> &'a str

// Rule 3: If &self or &mut self exists, its lifetime is assigned to outputs
// fn foo(&self, x: &str) -> &str
// becomes: fn foo<'a, 'b>(&'a self, x: &'b str) -> &'a str

// These compile without explicit lifetimes due to elision:
fn first_word(s: &str) -> &str {
    s.split_whitespace().next().unwrap_or("")
}

fn get_value(text: &str) -> &str {
    &text[0..5]
}

fn main() {
    let text = "Hello, World!";
    println!("First word: {}", first_word(text));
    println!("First 5 chars: {}", get_value(text));
}
```

---

## Lifetimes in Structs

```rust
// Struct holding a reference
struct Excerpt<'a> {
    text: &'a str,
}

impl<'a> Excerpt<'a> {
    fn new(text: &'a str) -> Self {
        Excerpt { text }
    }

    fn first_word(&self) -> &str {
        self.text.split_whitespace().next().unwrap_or("")
    }

    // The output lifetime is tied to self, not text
    fn announce_and_return(&self, announcement: &str) -> &str {
        println!("Announcement: {}", announcement);
        self.text
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let first_sentence = novel.split('.').next().unwrap();
    let excerpt = Excerpt::new(first_sentence);

    println!("Excerpt: {}", excerpt.text);
    println!("First word: {}", excerpt.first_word());
}
```

---

## Hands-On Exercise 2: Cache with Lifetimes

```rust
struct Cache<'a> {
    data: &'a str,
    processed: Option<String>,
}

impl<'a> Cache<'a> {
    fn new(data: &'a str) -> Self {
        Cache {
            data,
            processed: None,
        }
    }

    fn get_data(&self) -> &str {
        self.data
    }

    fn get_processed(&mut self) -> &str {
        if self.processed.is_none() {
            // Expensive processing
            let result = self.data.to_uppercase();
            self.processed = Some(result);
        }
        self.processed.as_ref().unwrap()
    }

    fn clear_cache(&mut self) {
        self.processed = None;
    }
}

fn main() {
    let text = "hello, world!";
    let mut cache = Cache::new(text);

    println!("Original: {}", cache.get_data());
    println!("Processed: {}", cache.get_processed());
    println!("Processed again: {}", cache.get_processed());

    cache.clear_cache();
    println!("After clear, processed: {}", cache.get_processed());
}
```

---

## Multiple Lifetimes

```rust
// Different lifetimes for different references
fn first_or_default<'a, 'b>(s: &'a str, default: &'b str) -> &'a str {
    if s.is_empty() {
        // Can't return default here - different lifetime!
        // This won't compile: return default;
        ""  // Return a static string instead
    } else {
        s
    }
}

// When you need to return either
fn first_or_default_v2<'a>(s: &'a str, default: &'a str) -> &'a str {
    if s.is_empty() {
        default
    } else {
        s
    }
}

// Return the longer-lived reference
struct Context<'a, 'b> {
    primary: &'a str,
    secondary: &'b str,
}

impl<'a, 'b> Context<'a, 'b> {
    fn primary(&self) -> &'a str {
        self.primary
    }

    fn secondary(&self) -> &'b str {
        self.secondary
    }
}

fn main() {
    let s1 = String::from("hello");
    let result;
    {
        let s2 = String::from("world");
        let ctx = Context {
            primary: &s1,
            secondary: &s2,
        };
        result = ctx.primary();  // OK - lives as long as s1
        println!("Secondary: {}", ctx.secondary());
    }
    println!("Result: {}", result);  // Still valid!
}
```

---

## Static Lifetime

The `'static` lifetime means the reference lives for the entire program:

```rust
// String literals have 'static lifetime
let s: &'static str = "I live forever!";

// Static constants
static HELLO: &str = "Hello, World!";

// Generic bound with 'static
fn print_static<T: std::fmt::Display + 'static>(value: T) {
    println!("{}", value);
}

fn main() {
    println!("{}", s);
    println!("{}", HELLO);

    // Owned values satisfy 'static
    print_static(String::from("Owned string"));
    print_static(42);
}
```

---

## Hands-On Exercise 3: String Parser

```rust
struct Parser<'a> {
    input: &'a str,
    position: usize,
}

impl<'a> Parser<'a> {
    fn new(input: &'a str) -> Self {
        Parser { input, position: 0 }
    }

    fn remaining(&self) -> &'a str {
        &self.input[self.position..]
    }

    fn peek(&self) -> Option<char> {
        self.remaining().chars().next()
    }

    fn advance(&mut self) {
        if let Some(c) = self.peek() {
            self.position += c.len_utf8();
        }
    }

    fn take_while<F>(&mut self, predicate: F) -> &'a str
    where
        F: Fn(char) -> bool,
    {
        let start = self.position;
        while let Some(c) = self.peek() {
            if predicate(c) {
                self.advance();
            } else {
                break;
            }
        }
        &self.input[start..self.position]
    }

    fn skip_whitespace(&mut self) {
        self.take_while(|c| c.is_whitespace());
    }

    fn parse_word(&mut self) -> Option<&'a str> {
        self.skip_whitespace();
        let word = self.take_while(|c| c.is_alphanumeric());
        if word.is_empty() {
            None
        } else {
            Some(word)
        }
    }

    fn parse_number(&mut self) -> Option<&'a str> {
        self.skip_whitespace();
        let num = self.take_while(|c| c.is_ascii_digit());
        if num.is_empty() {
            None
        } else {
            Some(num)
        }
    }
}

fn main() {
    let input = "Hello 123 World 456";
    let mut parser = Parser::new(input);

    println!("Parsing: '{}'", input);

    while let Some(word) = parser.parse_word() {
        println!("Word: {}", word);

        if let Some(num) = parser.parse_number() {
            println!("Number: {}", num);
        }
    }
}
```

---

## Lifetime Bounds with Generics

```rust
use std::fmt::Display;

// T must live at least as long as 'a
fn longest_with_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement: {}", ann);
    if x.len() > y.len() {
        x
    } else {
        y
    }
}

// Struct with generic type and lifetime
struct Wrapper<'a, T: 'a> {
    value: &'a T,
}

impl<'a, T> Wrapper<'a, T> {
    fn new(value: &'a T) -> Self {
        Wrapper { value }
    }

    fn get(&self) -> &T {
        self.value
    }
}

fn main() {
    let result = longest_with_announcement(
        "Hello",
        "World!",
        "Comparing strings",
    );
    println!("Longest: {}", result);

    let num = 42;
    let wrapper = Wrapper::new(&num);
    println!("Wrapped: {}", wrapper.get());
}
```

---

## Hands-On Exercise 4: Reference Container

```rust
#[derive(Debug)]
struct RefPair<'a, T> {
    first: &'a T,
    second: &'a T,
}

impl<'a, T> RefPair<'a, T> {
    fn new(first: &'a T, second: &'a T) -> Self {
        RefPair { first, second }
    }

    fn swap(&mut self) {
        std::mem::swap(&mut self.first, &mut self.second);
    }
}

impl<'a, T: PartialOrd> RefPair<'a, T> {
    fn min(&self) -> &T {
        if self.first < self.second {
            self.first
        } else {
            self.second
        }
    }

    fn max(&self) -> &T {
        if self.first > self.second {
            self.first
        } else {
            self.second
        }
    }
}

impl<'a, T: std::fmt::Display> RefPair<'a, T> {
    fn print(&self) {
        println!("Pair: ({}, {})", self.first, self.second);
    }
}

fn main() {
    let a = 10;
    let b = 20;

    let mut pair = RefPair::new(&a, &b);
    pair.print();

    println!("Min: {}", pair.min());
    println!("Max: {}", pair.max());

    pair.swap();
    pair.print();
}
```

---

## Common Lifetime Patterns

### Pattern 1: Return Input Reference

```rust
fn choose<'a>(condition: bool, a: &'a str, b: &'a str) -> &'a str {
    if condition { a } else { b }
}
```

### Pattern 2: Struct Holding References

```rust
struct Config<'a> {
    name: &'a str,
    value: &'a str,
}
```

### Pattern 3: Method Returning Self Reference

```rust
struct Buffer {
    data: String,
}

impl Buffer {
    fn get(&self) -> &str {
        &self.data
    }
}
```

### Pattern 4: Multiple Distinct Lifetimes

```rust
struct Complex<'a, 'b> {
    x: &'a str,
    y: &'b str,
}
```

---

## Hands-On Exercise 5: Split Iterator

```rust
struct SplitIterator<'a> {
    text: &'a str,
    delimiter: char,
}

impl<'a> SplitIterator<'a> {
    fn new(text: &'a str, delimiter: char) -> Self {
        SplitIterator { text, delimiter }
    }
}

impl<'a> Iterator for SplitIterator<'a> {
    type Item = &'a str;

    fn next(&mut self) -> Option<Self::Item> {
        if self.text.is_empty() {
            return None;
        }

        match self.text.find(self.delimiter) {
            Some(pos) => {
                let part = &self.text[..pos];
                self.text = &self.text[pos + self.delimiter.len_utf8()..];
                Some(part)
            }
            None => {
                let part = self.text;
                self.text = "";
                Some(part)
            }
        }
    }
}

fn main() {
    let text = "apple,banana,cherry,date";
    let splitter = SplitIterator::new(text, ',');

    println!("Splitting: {}", text);
    for (i, part) in splitter.enumerate() {
        println!("  [{}] {}", i, part);
    }

    // Works with collect
    let parts: Vec<&str> = SplitIterator::new("a:b:c", ':').collect();
    println!("\nCollected: {:?}", parts);
}
```

---

## Challenge: Document with Sections

```rust
struct Document<'a> {
    title: &'a str,
    sections: Vec<Section<'a>>,
}

struct Section<'a> {
    heading: &'a str,
    content: &'a str,
}

impl<'a> Document<'a> {
    fn new(title: &'a str) -> Self {
        Document {
            title,
            sections: Vec::new(),
        }
    }

    fn add_section(&mut self, heading: &'a str, content: &'a str) {
        self.sections.push(Section { heading, content });
    }

    fn find_section(&self, heading: &str) -> Option<&Section<'a>> {
        self.sections.iter().find(|s| s.heading == heading)
    }

    fn all_content(&self) -> String {
        self.sections
            .iter()
            .map(|s| format!("# {}\n{}", s.heading, s.content))
            .collect::<Vec<_>>()
            .join("\n\n")
    }

    fn word_count(&self) -> usize {
        self.sections
            .iter()
            .map(|s| s.content.split_whitespace().count())
            .sum()
    }
}

fn main() {
    let title = "Rust Tutorial";
    let intro_heading = "Introduction";
    let intro_content = "Rust is a systems programming language.";
    let basics_heading = "Basics";
    let basics_content = "Variables in Rust are immutable by default.";

    let mut doc = Document::new(title);
    doc.add_section(intro_heading, intro_content);
    doc.add_section(basics_heading, basics_content);

    println!("Document: {}", doc.title);
    println!("Sections: {}", doc.sections.len());
    println!("Word count: {}", doc.word_count());

    println!("\n{}", doc.all_content());

    if let Some(section) = doc.find_section("Introduction") {
        println!("\nFound section: {}", section.heading);
    }
}
```

---

## Key Takeaways

1. **Lifetimes ensure references are always valid**
2. **Annotate with `'a` to describe reference relationships**
3. **Elision rules handle most simple cases**
4. **Structs holding references need lifetime parameters**
5. **`'static` means the entire program duration**
6. **Multiple lifetimes describe independent durations**
7. **Lifetime bounds work with generics**

---

## Homework

1. Create a `TextAnalyzer` struct that holds a reference and provides analysis methods
2. Implement a `LineIterator` that iterates over lines in a string slice
3. Build a `Config` struct that holds references to key-value pairs
4. Create a function that returns the longest common prefix of two strings

---

[← Previous: Day 15](day-15.md) | [Next: Day 17 - Closures →](day-17.md)
