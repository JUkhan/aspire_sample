# Day 11: Common Collections - Strings

## Learning Objectives
- Understand String vs &str
- Create and manipulate strings
- Handle UTF-8 encoding
- Use string methods effectively

---

## String vs &str

```rust
fn main() {
    // &str - String slice (borrowed, immutable)
    let s1: &str = "Hello, world!";  // String literal

    // String - Owned string (heap-allocated, mutable)
    let s2: String = String::from("Hello, world!");

    // Convert between them
    let s3: String = s1.to_string();     // &str -> String
    let s4: &str = &s2;                   // String -> &str
    let s5: String = s1.to_owned();       // Another way

    println!("s1 (&str): {}", s1);
    println!("s2 (String): {}", s2);
    println!("s3 (converted): {}", s3);
    println!("s4 (borrowed): {}", s4);
}
```

---

## Creating Strings

```rust
fn main() {
    // Different ways to create strings
    let s1 = String::new();                    // Empty
    let s2 = String::from("hello");            // From &str
    let s3 = "world".to_string();              // Also from &str
    let s4 = String::with_capacity(50);        // Pre-allocated
    let s5 = format!("{} {}", "hello", "world"); // From format!

    // From characters
    let s6: String = ['H', 'i', '!'].iter().collect();

    // From bytes
    let s7 = String::from_utf8(vec![72, 101, 108, 108, 111]).unwrap();

    println!("s1: '{}'", s1);
    println!("s2: '{}'", s2);
    println!("s3: '{}'", s3);
    println!("s4 capacity: {}", s4.capacity());
    println!("s5: '{}'", s5);
    println!("s6: '{}'", s6);
    println!("s7: '{}'", s7);
}
```

---

## Hands-On Exercise 1: String Basics

```rust
fn main() {
    let mut greeting = String::from("Hello");

    // Check properties
    println!("String: '{}'", greeting);
    println!("Length: {} bytes", greeting.len());
    println!("Capacity: {}", greeting.capacity());
    println!("Is empty: {}", greeting.is_empty());

    // Append
    greeting.push(' ');           // Single character
    greeting.push_str("World");   // String slice
    greeting.push('!');

    println!("After appending: '{}'", greeting);

    // Clear
    let mut temp = greeting.clone();
    temp.clear();
    println!("After clear: '{}' (len: {})", temp, temp.len());
}
```

---

## Concatenation

```rust
fn main() {
    let s1 = String::from("Hello, ");
    let s2 = String::from("World!");

    // Using + operator (takes ownership of s1)
    let s3 = s1 + &s2;  // s1 is moved, s2 is borrowed
    // println!("{}", s1);  // Error: s1 is moved!
    println!("Concatenated: {}", s3);

    // Using format! (no ownership issues)
    let hello = String::from("Hello");
    let world = String::from("World");
    let s4 = format!("{}, {}!", hello, world);
    println!("Formatted: {}", s4);
    println!("Still have: {} and {}", hello, world);

    // Using push_str
    let mut s5 = String::from("Hello");
    s5.push_str(", ");
    s5.push_str("World!");
    println!("Pushed: {}", s5);
}
```

---

## Iterating Over Strings

```rust
fn main() {
    let s = String::from("Hello, 世界!");

    // Iterate over characters
    println!("Characters:");
    for c in s.chars() {
        println!("  '{}'", c);
    }

    // Iterate over bytes
    println!("\nBytes:");
    for b in s.bytes() {
        print!("{} ", b);
    }
    println!();

    // Character count vs byte length
    println!("\nCharacter count: {}", s.chars().count());
    println!("Byte length: {}", s.len());

    // Enumerate characters
    println!("\nEnumerated:");
    for (i, c) in s.chars().enumerate() {
        println!("  {}: '{}'", i, c);
    }
}
```

---

## Hands-On Exercise 2: Character Analysis

```rust
fn main() {
    let text = "Rust Programming 2024! 🦀";

    println!("Text: {}", text);
    println!("Total characters: {}", text.chars().count());
    println!("Total bytes: {}", text.len());

    let letters: usize = text.chars().filter(|c| c.is_alphabetic()).count();
    let digits: usize = text.chars().filter(|c| c.is_numeric()).count();
    let spaces: usize = text.chars().filter(|c| c.is_whitespace()).count();
    let uppercase: usize = text.chars().filter(|c| c.is_uppercase()).count();
    let lowercase: usize = text.chars().filter(|c| c.is_lowercase()).count();

    println!("Letters: {}", letters);
    println!("Digits: {}", digits);
    println!("Spaces: {}", spaces);
    println!("Uppercase: {}", uppercase);
    println!("Lowercase: {}", lowercase);
}
```

---

## String Slicing

```rust
fn main() {
    let s = String::from("Hello, World!");

    // Slice by byte indices (be careful with UTF-8!)
    let hello = &s[0..5];
    let world = &s[7..12];

    println!("hello: {}", hello);
    println!("world: {}", world);

    // Be careful with non-ASCII!
    let chinese = "你好世界";
    // let bad = &chinese[0..1];  // PANIC! Slicing in middle of character

    // Safe slicing with char_indices
    let mut safe_slice = String::new();
    for (i, c) in chinese.char_indices() {
        if i < 6 {  // First two characters (each is 3 bytes)
            safe_slice.push(c);
        }
    }
    println!("Safe slice: {}", safe_slice);
}
```

---

## Common String Methods

```rust
fn main() {
    let s = String::from("  Hello, World!  ");

    // Trimming
    println!("Original: '{}'", s);
    println!("Trimmed: '{}'", s.trim());
    println!("Trim start: '{}'", s.trim_start());
    println!("Trim end: '{}'", s.trim_end());

    // Case conversion
    let greeting = "Hello, World!";
    println!("Uppercase: {}", greeting.to_uppercase());
    println!("Lowercase: {}", greeting.to_lowercase());

    // Replace
    let text = "Hello, World!";
    println!("Replaced: {}", text.replace("World", "Rust"));
    println!("Replace n: {}", "ababa".replacen("a", "X", 2));

    // Split
    let csv = "apple,banana,cherry";
    let fruits: Vec<&str> = csv.split(',').collect();
    println!("Fruits: {:?}", fruits);

    // Contains, starts_with, ends_with
    println!("Contains 'World': {}", text.contains("World"));
    println!("Starts with 'Hello': {}", text.starts_with("Hello"));
    println!("Ends with '!': {}", text.ends_with("!"));
}
```

---

## Hands-On Exercise 3: Text Processor

```rust
fn main() {
    let text = "   The quick BROWN fox jumps OVER the lazy DOG.   ";

    println!("Original: '{}'", text);

    // Clean up
    let cleaned = text.trim();
    println!("Trimmed: '{}'", cleaned);

    // Normalize case
    let lower = cleaned.to_lowercase();
    println!("Lowercase: '{}'", lower);

    // Count words
    let word_count = lower.split_whitespace().count();
    println!("Word count: {}", word_count);

    // Title case (capitalize first letter of each word)
    let title_case = lower
        .split_whitespace()
        .map(|word| {
            let mut chars = word.chars();
            match chars.next() {
                None => String::new(),
                Some(first) => {
                    first.to_uppercase().to_string() + chars.as_str()
                }
            }
        })
        .collect::<Vec<String>>()
        .join(" ");

    println!("Title case: '{}'", title_case);

    // Reverse words
    let reversed: String = lower
        .split_whitespace()
        .rev()
        .collect::<Vec<&str>>()
        .join(" ");
    println!("Reversed words: '{}'", reversed);
}
```

---

## Searching in Strings

```rust
fn main() {
    let text = "The quick brown fox jumps over the lazy fox.";

    // Find first occurrence
    match text.find("fox") {
        Some(pos) => println!("First 'fox' at position: {}", pos),
        None => println!("'fox' not found"),
    }

    // Find last occurrence
    match text.rfind("fox") {
        Some(pos) => println!("Last 'fox' at position: {}", pos),
        None => println!("'fox' not found"),
    }

    // Find all occurrences
    let matches: Vec<usize> = text.match_indices("fox")
        .map(|(i, _)| i)
        .collect();
    println!("All 'fox' positions: {:?}", matches);

    // Check patterns
    println!("Starts with 'The': {}", text.starts_with("The"));
    println!("Ends with '.': {}", text.ends_with("."));
    println!("Contains 'quick': {}", text.contains("quick"));
}
```

---

## Hands-On Exercise 4: Word Frequency Counter

```rust
use std::collections::HashMap;

fn main() {
    let text = "the quick brown fox jumps over the lazy dog the fox is quick";

    let mut word_counts: HashMap<String, u32> = HashMap::new();

    for word in text.split_whitespace() {
        let word = word.to_lowercase();
        *word_counts.entry(word).or_insert(0) += 1;
    }

    println!("Word frequencies:");
    let mut counts: Vec<(&String, &u32)> = word_counts.iter().collect();
    counts.sort_by(|a, b| b.1.cmp(a.1));

    for (word, count) in counts {
        println!("  {}: {}", word, count);
    }

    // Most common word
    if let Some((word, count)) = word_counts.iter().max_by_key(|(_, &count)| count) {
        println!("\nMost common: '{}' ({} times)", word, count);
    }

    // Unique words
    println!("Unique words: {}", word_counts.len());
}
```

---

## Parsing Strings

```rust
fn main() {
    // Parse to number
    let num_str = "42";
    let num: i32 = num_str.parse().unwrap();
    println!("Parsed number: {}", num);

    // Parse with error handling
    let maybe_num = "not a number".parse::<i32>();
    match maybe_num {
        Ok(n) => println!("Got: {}", n),
        Err(e) => println!("Parse error: {}", e),
    }

    // Parse with type annotation
    let float: f64 = "3.14".parse().unwrap();
    let bool_val: bool = "true".parse().unwrap();
    println!("Float: {}, Bool: {}", float, bool_val);

    // Parse multiple values
    let data = "10,20,30,40,50";
    let numbers: Vec<i32> = data
        .split(',')
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("Numbers: {:?}", numbers);
}
```

---

## Hands-On Exercise 5: CSV Parser

```rust
fn main() {
    let csv_data = "name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago
Diana,28,Houston";

    let lines: Vec<&str> = csv_data.lines().collect();
    let headers: Vec<&str> = lines[0].split(',').collect();

    println!("Headers: {:?}\n", headers);

    for line in &lines[1..] {
        let values: Vec<&str> = line.split(',').collect();

        println!("Record:");
        for (header, value) in headers.iter().zip(values.iter()) {
            println!("  {}: {}", header, value);
        }
        println!();
    }

    // Parse specific fields
    println!("Names and ages:");
    for line in &lines[1..] {
        let fields: Vec<&str> = line.split(',').collect();
        let name = fields[0];
        let age: u32 = fields[1].parse().unwrap_or(0);
        println!("  {} is {} years old", name, age);
    }
}
```

---

## String Building

```rust
fn main() {
    // Using String methods
    let mut s = String::new();
    s.push_str("Hello");
    s.push(' ');
    s.push_str("World");
    println!("Built: {}", s);

    // Using format!
    let name = "Alice";
    let age = 30;
    let formatted = format!("Name: {}, Age: {}", name, age);
    println!("{}", formatted);

    // Building with join
    let parts = vec!["Hello", "World", "Rust"];
    let joined = parts.join(", ");
    println!("Joined: {}", joined);

    // Building from iterator
    let built: String = (1..=5)
        .map(|n| n.to_string())
        .collect::<Vec<String>>()
        .join("-");
    println!("Built from numbers: {}", built);

    // Repeat
    let repeated = "abc".repeat(3);
    println!("Repeated: {}", repeated);
}
```

---

## UTF-8 and Special Characters

```rust
fn main() {
    // UTF-8 strings
    let hello = "Привет";      // Russian
    let hello_cn = "你好";       // Chinese
    let hello_jp = "こんにちは";  // Japanese
    let emoji = "Hello 🦀!";

    println!("Russian: {} ({} bytes, {} chars)",
             hello, hello.len(), hello.chars().count());
    println!("Chinese: {} ({} bytes, {} chars)",
             hello_cn, hello_cn.len(), hello_cn.chars().count());
    println!("Japanese: {} ({} bytes, {} chars)",
             hello_jp, hello_jp.len(), hello_jp.chars().count());
    println!("Emoji: {} ({} bytes, {} chars)",
             emoji, emoji.len(), emoji.chars().count());

    // Safe character-by-character processing
    for c in "🦀 Rust!".chars() {
        println!("Char: {} (unicode: U+{:04X})", c, c as u32);
    }
}
```

---

## Challenge: Text Analyzer

```rust
fn main() {
    let text = r#"
        Rust is a systems programming language
        focused on safety, speed, and concurrency.
        It achieves memory safety without garbage collection.
    "#;

    analyze_text(text);
}

fn analyze_text(text: &str) {
    println!("=== Text Analysis ===\n");
    println!("Input text:\n{}\n", text.trim());

    // Character analysis
    let chars: Vec<char> = text.chars().collect();
    let letters = chars.iter().filter(|c| c.is_alphabetic()).count();
    let digits = chars.iter().filter(|c| c.is_numeric()).count();
    let whitespace = chars.iter().filter(|c| c.is_whitespace()).count();
    let punctuation = chars.iter().filter(|c| c.is_ascii_punctuation()).count();

    println!("Character Analysis:");
    println!("  Total characters: {}", chars.len());
    println!("  Letters: {}", letters);
    println!("  Digits: {}", digits);
    println!("  Whitespace: {}", whitespace);
    println!("  Punctuation: {}", punctuation);

    // Word analysis
    let words: Vec<&str> = text.split_whitespace().collect();
    let word_lengths: Vec<usize> = words.iter().map(|w| w.len()).collect();
    let avg_word_len: f64 = word_lengths.iter().sum::<usize>() as f64 / words.len() as f64;

    println!("\nWord Analysis:");
    println!("  Total words: {}", words.len());
    println!("  Average word length: {:.2}", avg_word_len);

    if let Some(&max_len) = word_lengths.iter().max() {
        let longest: Vec<&&str> = words.iter()
            .filter(|w| w.len() == max_len)
            .collect();
        println!("  Longest word(s): {:?} ({} chars)", longest, max_len);
    }

    // Sentence analysis
    let sentences: Vec<&str> = text
        .split(|c| c == '.' || c == '!' || c == '?')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();

    println!("\nSentence Analysis:");
    println!("  Total sentences: {}", sentences.len());

    // Unique words
    use std::collections::HashSet;
    let unique: HashSet<String> = words.iter()
        .map(|w| w.to_lowercase().trim_matches(|c: char| !c.is_alphanumeric()).to_string())
        .filter(|w| !w.is_empty())
        .collect();

    println!("  Unique words: {}", unique.len());
}
```

---

## Key Takeaways

1. **`String` is owned and mutable; `&str` is borrowed**
2. **Strings are UTF-8 encoded**
3. **Use `format!` for safe concatenation**
4. **Iterate with `.chars()` or `.bytes()`**
5. **Slicing requires valid UTF-8 boundaries**
6. **Use `.parse()` to convert strings to other types**
7. **Many methods: `trim`, `split`, `replace`, `contains`**

---

## Homework

1. Build a simple template engine that replaces `{{variable}}` patterns
2. Create a palindrome checker that ignores case and spaces
3. Implement a basic markdown to plain text converter
4. Build a word scrambler/unscrambler

---

[← Previous: Day 10](day-10.md) | [Next: Day 12 - HashMaps →](day-12.md)
