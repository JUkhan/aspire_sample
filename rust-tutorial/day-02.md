# Day 2: Variables, Mutability, and Data Types

## Learning Objectives
- Understand variables and mutability in Rust
- Learn about Rust's type system
- Master scalar and compound data types
- Practice type annotations

---

## Variables in Rust

### Immutable by Default

```rust
fn main() {
    let x = 5;
    println!("x = {}", x);

    // x = 6;  // ERROR! Cannot assign twice to immutable variable
}
```

### Making Variables Mutable

```rust
fn main() {
    let mut x = 5;
    println!("x = {}", x);

    x = 6;  // OK! x is mutable
    println!("x = {}", x);
}
```

---

## Hands-On Exercise 1: Immutability vs Mutability

```rust
fn main() {
    // Immutable - value cannot change
    let age = 25;
    println!("Age: {}", age);

    // Mutable - value can change
    let mut score = 0;
    println!("Initial score: {}", score);

    score = 100;
    println!("Final score: {}", score);

    score += 50;  // Add to score
    println!("Bonus score: {}", score);
}
```

---

## Shadowing

You can declare a new variable with the same name:

```rust
fn main() {
    let x = 5;
    println!("x = {}", x);  // 5

    let x = x + 1;  // Shadowing - new variable
    println!("x = {}", x);  // 6

    let x = x * 2;
    println!("x = {}", x);  // 12

    // Shadowing can change types!
    let spaces = "   ";      // String
    let spaces = spaces.len(); // Now it's a number
    println!("Number of spaces: {}", spaces);
}
```

---

## Constants

Constants are always immutable and must have type annotations:

```rust
const MAX_POINTS: u32 = 100_000;
const PI: f64 = 3.14159;
const APP_NAME: &str = "Rust Tutorial";

fn main() {
    println!("Max points: {}", MAX_POINTS);
    println!("Pi: {}", PI);
    println!("App: {}", APP_NAME);
}
```

---

## Scalar Data Types

### Integers

```rust
fn main() {
    // Signed integers (can be negative)
    let a: i8 = -128;     // -128 to 127
    let b: i16 = -32768;  // -32,768 to 32,767
    let c: i32 = -2_147_483_648;  // Default integer type
    let d: i64 = -9_223_372_036_854_775_808;
    let e: i128 = -170_141_183_460_469_231_731_687_303_715_884_105_728;

    // Unsigned integers (positive only)
    let f: u8 = 255;
    let g: u16 = 65535;
    let h: u32 = 4_294_967_295;
    let i: u64 = 18_446_744_073_709_551_615;

    // Architecture-dependent
    let j: isize = 100;  // Depends on 32/64-bit system
    let k: usize = 100;  // Used for indexing

    println!("i8: {}, u8: {}", a, f);

    // Number literals
    let decimal = 98_222;      // Underscores for readability
    let hex = 0xff;            // Hexadecimal
    let octal = 0o77;          // Octal
    let binary = 0b1111_0000;  // Binary
    let byte = b'A';           // Byte (u8 only)

    println!("Decimal: {}, Hex: {}, Octal: {}, Binary: {}, Byte: {}",
             decimal, hex, octal, binary, byte);
}
```

### Floating-Point

```rust
fn main() {
    let x = 2.0;      // f64 (default)
    let y: f32 = 3.0; // f32

    // Arithmetic
    let sum = 5.0 + 10.5;
    let difference = 95.5 - 4.3;
    let product = 4.0 * 30.0;
    let quotient = 56.7 / 32.2;

    println!("Sum: {}, Diff: {}, Product: {}, Quotient: {}",
             sum, difference, product, quotient);
}
```

### Boolean

```rust
fn main() {
    let t = true;
    let f: bool = false;

    println!("True: {}, False: {}", t, f);

    // Boolean operations
    let and = true && false;  // false
    let or = true || false;   // true
    let not = !true;          // false

    println!("AND: {}, OR: {}, NOT: {}", and, or, not);
}
```

### Character

```rust
fn main() {
    let c = 'z';
    let z: char = 'Z';
    let heart = '❤';
    let emoji = '🦀';  // Ferris the crab!

    println!("Characters: {}, {}, {}, {}", c, z, heart, emoji);

    // Char is 4 bytes (Unicode scalar value)
    println!("Size of char: {} bytes", std::mem::size_of::<char>());
}
```

---

## Hands-On Exercise 2: Type Explorer

```rust
fn main() {
    // Let's explore sizes of types
    println!("=== Type Sizes ===");
    println!("i8:    {} byte", std::mem::size_of::<i8>());
    println!("i16:   {} bytes", std::mem::size_of::<i16>());
    println!("i32:   {} bytes", std::mem::size_of::<i32>());
    println!("i64:   {} bytes", std::mem::size_of::<i64>());
    println!("i128:  {} bytes", std::mem::size_of::<i128>());
    println!("f32:   {} bytes", std::mem::size_of::<f32>());
    println!("f64:   {} bytes", std::mem::size_of::<f64>());
    println!("bool:  {} byte", std::mem::size_of::<bool>());
    println!("char:  {} bytes", std::mem::size_of::<char>());
}
```

---

## Compound Types

### Tuples

Fixed-size collection of values with different types:

```rust
fn main() {
    // Creating tuples
    let tup: (i32, f64, u8) = (500, 6.4, 1);

    // Destructuring
    let (x, y, z) = tup;
    println!("x: {}, y: {}, z: {}", x, y, z);

    // Access by index
    let five_hundred = tup.0;
    let six_point_four = tup.1;
    let one = tup.2;
    println!("Values: {}, {}, {}", five_hundred, six_point_four, one);

    // Unit type - empty tuple
    let unit: () = ();
    println!("Unit: {:?}", unit);
}
```

### Arrays

Fixed-size collection of same-type values:

```rust
fn main() {
    // Creating arrays
    let arr = [1, 2, 3, 4, 5];
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    // With type annotation
    let arr2: [i32; 5] = [1, 2, 3, 4, 5];

    // Initialize with same value
    let zeros = [0; 5];  // [0, 0, 0, 0, 0]

    // Accessing elements
    let first = arr[0];
    let second = arr[1];
    println!("First: {}, Second: {}", first, second);

    // Array length
    println!("Array length: {}", arr.len());
    println!("Months: {:?}", months);
    println!("Zeros: {:?}", zeros);
}
```

---

## Hands-On Exercise 3: Personal Info Card

```rust
fn main() {
    // Create variables for a personal info card
    let name: &str = "Alice";
    let age: u8 = 28;
    let height: f32 = 5.7;
    let is_student: bool = true;
    let grade: char = 'A';

    // Tuple for location (latitude, longitude)
    let location: (f64, f64) = (40.7128, -74.0060);

    // Array for hobbies
    let hobbies: [&str; 3] = ["coding", "reading", "gaming"];

    println!("=== Personal Info Card ===");
    println!("Name: {}", name);
    println!("Age: {} years", age);
    println!("Height: {} ft", height);
    println!("Student: {}", is_student);
    println!("Grade: {}", grade);
    println!("Location: ({}, {})", location.0, location.1);
    println!("Hobbies: {:?}", hobbies);
}
```

---

## Hands-On Exercise 4: Simple Calculator Variables

```rust
fn main() {
    let num1: f64 = 10.0;
    let num2: f64 = 3.0;

    let sum = num1 + num2;
    let difference = num1 - num2;
    let product = num1 * num2;
    let quotient = num1 / num2;
    let remainder = num1 % num2;

    println!("=== Calculator ===");
    println!("{} + {} = {}", num1, num2, sum);
    println!("{} - {} = {}", num1, num2, difference);
    println!("{} * {} = {}", num1, num2, product);
    println!("{} / {} = {:.2}", num1, num2, quotient);
    println!("{} % {} = {}", num1, num2, remainder);

    // Integer division
    let int_a: i32 = 10;
    let int_b: i32 = 3;
    println!("\nInteger division: {} / {} = {}", int_a, int_b, int_a / int_b);
}
```

---

## Type Conversion

```rust
fn main() {
    // Use 'as' for type casting
    let x: i32 = 10;
    let y: f64 = x as f64;

    let a: f64 = 3.99;
    let b: i32 = a as i32;  // Truncates to 3

    println!("i32 {} as f64: {}", x, y);
    println!("f64 {} as i32: {}", a, b);

    // Be careful with overflow!
    let big: i32 = 1000;
    let small: u8 = big as u8;  // Wraps around!
    println!("i32 {} as u8: {}", big, small);
}
```

---

## Challenge: Temperature Converter Variables

```rust
fn main() {
    let celsius: f64 = 25.0;
    let fahrenheit: f64 = (celsius * 9.0/5.0) + 32.0;
    let kelvin: f64 = celsius + 273.15;

    println!("=== Temperature Converter ===");
    println!("{:.1}°C = {:.1}°F", celsius, fahrenheit);
    println!("{:.1}°C = {:.1}K", celsius, kelvin);

    // Store all conversions in a tuple
    let temperatures = (celsius, fahrenheit, kelvin);
    println!("\nAll temperatures: {:?}", temperatures);

    // Create an array of test temperatures
    let test_temps: [f64; 5] = [0.0, 25.0, 50.0, 75.0, 100.0];
    println!("\nTest temperatures: {:?}", test_temps);
}
```

---

## Key Takeaways

1. Variables are immutable by default; use `mut` for mutability
2. Shadowing allows reusing variable names with `let`
3. Constants use `const` and require type annotations
4. Scalar types: integers, floats, booleans, characters
5. Compound types: tuples (mixed types) and arrays (same type)
6. Use `as` for type conversion

---

## Homework

1. Create a program that stores your personal stats (age, height, weight) in appropriate types
2. Experiment with different integer types and their limits
3. Create a tuple containing mixed data about a product (name, price, quantity)
4. Make an array of your favorite numbers and print each one

---

[← Previous: Day 1](day-01.md) | [Next: Day 3 - Functions and Control Flow →](day-03.md)
