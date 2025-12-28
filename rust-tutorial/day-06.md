# Day 6: Slices

## Learning Objectives
- Understand slices as references to contiguous sequences
- Master string slices (&str)
- Work with array and vector slices
- Use slices in function parameters

---

## What Are Slices?

Slices are references to a contiguous sequence of elements. They don't own the data.

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[1..4];  // [2, 3, 4]

    println!("Array: {:?}", arr);
    println!("Slice: {:?}", slice);
}
```

---

## String Slices (&str)

```rust
fn main() {
    let s = String::from("hello world");

    // Different ways to create slices
    let hello = &s[0..5];     // "hello"
    let world = &s[6..11];    // "world"
    let hello2 = &s[..5];     // From beginning
    let world2 = &s[6..];     // To end
    let full = &s[..];        // Entire string

    println!("hello: {}", hello);
    println!("world: {}", world);
    println!("full: {}", full);

    // String literals are slices!
    let literal: &str = "I am a string slice";
    println!("Literal: {}", literal);
}
```

---

## Hands-On Exercise 1: String Slice Operations

```rust
fn main() {
    let sentence = "The quick brown fox jumps over the lazy dog";

    // Get different parts
    let first_word = &sentence[..3];
    let last_word = &sentence[40..];
    let middle = &sentence[10..19];

    println!("First word: '{}'", first_word);
    println!("Last word: '{}'", last_word);
    println!("Middle: '{}'", middle);

    // Find and slice
    if let Some(pos) = sentence.find("fox") {
        let from_fox = &sentence[pos..];
        println!("From 'fox': {}", from_fox);
    }

    // Be careful with UTF-8!
    let emoji = "Hello 🦀 World";
    // let bad_slice = &emoji[6..7];  // PANIC! Slicing in middle of character
    let good_slice = &emoji[..5];
    println!("Safe slice: {}", good_slice);
}
```

---

## Array Slices

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Create slices
    let first_three = &arr[..3];
    let middle = &arr[3..7];
    let last_three = &arr[7..];

    println!("First three: {:?}", first_three);
    println!("Middle: {:?}", middle);
    println!("Last three: {:?}", last_three);

    // Slice of a slice
    let sub_slice = &middle[1..3];
    println!("Sub-slice: {:?}", sub_slice);
}
```

---

## Mutable Slices

```rust
fn main() {
    let mut arr = [1, 2, 3, 4, 5];

    println!("Before: {:?}", arr);

    // Get a mutable slice
    let slice = &mut arr[1..4];

    // Modify through the slice
    slice[0] = 20;
    slice[1] = 30;
    slice[2] = 40;

    println!("After: {:?}", arr);

    // Double all elements in a slice
    let slice2 = &mut arr[..];
    for elem in slice2.iter_mut() {
        *elem *= 2;
    }

    println!("Doubled: {:?}", arr);
}
```

---

## Hands-On Exercise 2: Slice Manipulation

```rust
fn main() {
    let mut numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Zero out first half
    zero_slice(&mut numbers[..5]);
    println!("First half zeroed: {:?}", numbers);

    // Double the second half
    double_slice(&mut numbers[5..]);
    println!("Second half doubled: {:?}", numbers);

    // Reset and reverse
    let mut data = [1, 2, 3, 4, 5];
    reverse_slice(&mut data);
    println!("Reversed: {:?}", data);
}

fn zero_slice(slice: &mut [i32]) {
    for elem in slice {
        *elem = 0;
    }
}

fn double_slice(slice: &mut [i32]) {
    for elem in slice {
        *elem *= 2;
    }
}

fn reverse_slice(slice: &mut [i32]) {
    let len = slice.len();
    for i in 0..len / 2 {
        slice.swap(i, len - 1 - i);
    }
}
```

---

## Slices as Function Parameters

Using slices makes functions more flexible:

```rust
fn main() {
    // Works with arrays
    let arr = [1, 2, 3, 4, 5];
    println!("Array sum: {}", sum(&arr));

    // Works with vectors
    let vec = vec![10, 20, 30];
    println!("Vector sum: {}", sum(&vec));

    // Works with partial slices
    println!("Partial sum: {}", sum(&arr[1..4]));

    // String slices
    let s = String::from("hello");
    print_str(&s);        // &String coerces to &str
    print_str("world");   // &str literal
}

fn sum(numbers: &[i32]) -> i32 {
    numbers.iter().sum()
}

fn print_str(s: &str) {
    println!("String: {}", s);
}
```

---

## Hands-On Exercise 3: Generic Slice Functions

```rust
fn main() {
    let numbers = [5, 2, 8, 1, 9, 3, 7, 4, 6];

    println!("Numbers: {:?}", numbers);
    println!("First: {:?}", first(&numbers));
    println!("Last: {:?}", last(&numbers));
    println!("Max: {:?}", find_max(&numbers));
    println!("Min: {:?}", find_min(&numbers));
    println!("Average: {:.2}", average(&numbers));

    // With partial slice
    let middle = &numbers[2..7];
    println!("\nMiddle slice: {:?}", middle);
    println!("Middle max: {:?}", find_max(middle));
}

fn first<T>(slice: &[T]) -> Option<&T> {
    slice.first()
}

fn last<T>(slice: &[T]) -> Option<&T> {
    slice.last()
}

fn find_max(slice: &[i32]) -> Option<i32> {
    slice.iter().copied().max()
}

fn find_min(slice: &[i32]) -> Option<i32> {
    slice.iter().copied().min()
}

fn average(slice: &[i32]) -> f64 {
    if slice.is_empty() {
        return 0.0;
    }
    let sum: i32 = slice.iter().sum();
    sum as f64 / slice.len() as f64
}
```

---

## Slice Methods

```rust
fn main() {
    let arr = [1, 2, 3, 4, 5];
    let slice = &arr[..];

    // Length and emptiness
    println!("Length: {}", slice.len());
    println!("Is empty: {}", slice.is_empty());

    // Accessing elements
    println!("First: {:?}", slice.first());
    println!("Last: {:?}", slice.last());
    println!("Get index 2: {:?}", slice.get(2));
    println!("Get index 10: {:?}", slice.get(10));  // None, not panic!

    // Contains
    println!("Contains 3: {}", slice.contains(&3));

    // Iteration
    print!("Elements: ");
    for elem in slice {
        print!("{} ", elem);
    }
    println!();

    // Splitting
    let (left, right) = slice.split_at(2);
    println!("Left: {:?}, Right: {:?}", left, right);
}
```

---

## Hands-On Exercise 4: Word Processing with Slices

```rust
fn main() {
    let text = "Rust is awesome and Rust is fast";

    let words: Vec<&str> = text.split_whitespace().collect();
    println!("Words: {:?}", words);

    // Process word slices
    let first_three = &words[..3];
    let last_three = &words[words.len()-3..];

    println!("First three: {:?}", first_three);
    println!("Last three: {:?}", last_three);

    // Find longest word
    let longest = find_longest_word(&words);
    println!("Longest word: {}", longest);

    // Count occurrences
    println!("'Rust' appears {} times", count_word(&words, "Rust"));
    println!("'is' appears {} times", count_word(&words, "is"));
}

fn find_longest_word<'a>(words: &[&'a str]) -> &'a str {
    let mut longest = "";
    for word in words {
        if word.len() > longest.len() {
            longest = word;
        }
    }
    longest
}

fn count_word(words: &[&str], target: &str) -> usize {
    words.iter().filter(|&&w| w == target).count()
}
```

---

## Windows and Chunks

```rust
fn main() {
    let data = [1, 2, 3, 4, 5, 6, 7, 8];

    // Windows: overlapping slices
    println!("Windows of size 3:");
    for window in data.windows(3) {
        println!("  {:?}", window);
    }

    // Chunks: non-overlapping slices
    println!("\nChunks of size 3:");
    for chunk in data.chunks(3) {
        println!("  {:?}", chunk);
    }

    // Exact chunks (ignores remainder)
    println!("\nExact chunks of size 3:");
    for chunk in data.chunks_exact(3) {
        println!("  {:?}", chunk);
    }
}
```

---

## Hands-On Exercise 5: Moving Average

```rust
fn main() {
    let prices = [100.0, 102.5, 101.0, 105.0, 103.5, 108.0, 107.5, 110.0];

    println!("Prices: {:?}", prices);

    // Calculate 3-day moving average
    let ma3 = moving_average(&prices, 3);
    println!("3-day MA: {:?}", ma3);

    // Calculate 5-day moving average
    let ma5 = moving_average(&prices, 5);
    println!("5-day MA: {:?}", ma5);
}

fn moving_average(data: &[f64], window_size: usize) -> Vec<f64> {
    data.windows(window_size)
        .map(|window| {
            let sum: f64 = window.iter().sum();
            sum / window_size as f64
        })
        .collect()
}
```

---

## Binary Search with Slices

```rust
fn main() {
    let sorted = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

    // Built-in binary search
    match sorted.binary_search(&7) {
        Ok(index) => println!("Found 7 at index {}", index),
        Err(index) => println!("7 not found, would insert at {}", index),
    }

    match sorted.binary_search(&8) {
        Ok(index) => println!("Found 8 at index {}", index),
        Err(index) => println!("8 not found, would insert at {}", index),
    }

    // Custom binary search
    let result = binary_search(&sorted, 13);
    println!("Custom search for 13: {:?}", result);
}

fn binary_search(slice: &[i32], target: i32) -> Option<usize> {
    let mut left = 0;
    let mut right = slice.len();

    while left < right {
        let mid = left + (right - left) / 2;

        if slice[mid] == target {
            return Some(mid);
        } else if slice[mid] < target {
            left = mid + 1;
        } else {
            right = mid;
        }
    }

    None
}
```

---

## Challenge: Slice-Based Text Parser

```rust
fn main() {
    let csv_data = "name,age,city
Alice,30,New York
Bob,25,Los Angeles
Charlie,35,Chicago";

    let lines: Vec<&str> = csv_data.lines().collect();

    // Get header
    let header = lines.first().unwrap();
    println!("Header: {}", header);

    // Get data rows
    let data_rows = &lines[1..];
    println!("\nData rows:");
    for row in data_rows {
        let fields: Vec<&str> = row.split(',').collect();
        println!("  Name: {}, Age: {}, City: {}",
                 fields[0], fields[1], fields[2]);
    }

    // Parse and process
    println!("\nProcessed data:");
    for row in data_rows {
        let parsed = parse_row(row);
        println!("  {:?}", parsed);
    }
}

fn parse_row(row: &str) -> (&str, u32, &str) {
    let parts: Vec<&str> = row.split(',').collect();
    let name = parts[0];
    let age: u32 = parts[1].parse().unwrap_or(0);
    let city = parts[2];
    (name, age, city)
}
```

---

## Key Takeaways

1. **Slices are references to contiguous sequences**
2. **`&str` is a string slice, `&[T]` is an array/vector slice**
3. **Slices don't own data, they borrow it**
4. **Use `&[T]` in function parameters for flexibility**
5. **Mutable slices allow modification: `&mut [T]`**
6. **Methods like `windows()`, `chunks()`, `split_at()` are powerful**
7. **String slices must respect UTF-8 boundaries**

---

## Homework

1. Implement a function that rotates a slice left by n positions
2. Create a function that finds all palindrome substrings
3. Build a simple CSV parser using slices
4. Implement merge sort using slices

---

## Quick Reference

```rust
// Create slices
let slice = &arr[start..end];
let slice = &arr[..end];      // from start
let slice = &arr[start..];    // to end
let slice = &arr[..];         // entire

// Mutable slice
let slice = &mut arr[..];

// Common methods
slice.len()
slice.is_empty()
slice.first()
slice.last()
slice.get(index)
slice.contains(&value)
slice.split_at(index)
slice.windows(size)
slice.chunks(size)
slice.iter()
slice.iter_mut()
```

---

[← Previous: Day 5](day-05.md) | [Next: Day 7 - Structs →](day-07.md)
