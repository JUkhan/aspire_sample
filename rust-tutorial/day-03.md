# Day 3: Functions and Control Flow

## Learning Objectives
- Define and call functions in Rust
- Understand parameters and return values
- Master if/else expressions
- Learn loop, while, and for loops

---

## Functions in Rust

### Basic Function Syntax

```rust
fn main() {
    println!("Hello from main!");
    greet();  // Call the function
    greet();  // Call it again!
}

fn greet() {
    println!("Hello, Rustacean!");
}
```

### Functions with Parameters

```rust
fn main() {
    greet("Alice");
    greet("Bob");

    print_sum(5, 10);
}

fn greet(name: &str) {
    println!("Hello, {}!", name);
}

fn print_sum(a: i32, b: i32) {
    println!("{} + {} = {}", a, b, a + b);
}
```

> **Note**: You MUST specify the type of each parameter.

---

## Hands-On Exercise 1: Function Basics

```rust
fn main() {
    // Calling our functions
    say_hello();
    print_number(42);
    print_two_numbers(10, 20);
    describe_person("Alice", 25);
}

fn say_hello() {
    println!("Hello, World!");
}

fn print_number(x: i32) {
    println!("The number is: {}", x);
}

fn print_two_numbers(a: i32, b: i32) {
    println!("Numbers: {} and {}", a, b);
}

fn describe_person(name: &str, age: u32) {
    println!("{} is {} years old", name, age);
}
```

---

## Return Values

### Explicit Return

```rust
fn add(a: i32, b: i32) -> i32 {
    return a + b;
}

fn main() {
    let result = add(5, 3);
    println!("5 + 3 = {}", result);
}
```

### Implicit Return (No Semicolon)

```rust
fn add(a: i32, b: i32) -> i32 {
    a + b  // No semicolon = return this value
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn main() {
    println!("5 + 3 = {}", add(5, 3));
    println!("5 * 3 = {}", multiply(5, 3));
}
```

---

## Hands-On Exercise 2: Math Functions

```rust
fn main() {
    let a = 10;
    let b = 3;

    println!("=== Math Operations ===");
    println!("{} + {} = {}", a, b, add(a, b));
    println!("{} - {} = {}", a, b, subtract(a, b));
    println!("{} * {} = {}", a, b, multiply(a, b));
    println!("{} / {} = {}", a, b, divide(a, b));
    println!("{} % {} = {}", a, b, remainder(a, b));

    println!("\nSquare of {} = {}", a, square(a));
    println!("Cube of {} = {}", b, cube(b));
}

fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn subtract(a: i32, b: i32) -> i32 {
    a - b
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

fn divide(a: i32, b: i32) -> i32 {
    a / b
}

fn remainder(a: i32, b: i32) -> i32 {
    a % b
}

fn square(n: i32) -> i32 {
    n * n
}

fn cube(n: i32) -> i32 {
    n * n * n
}
```

---

## Expressions vs Statements

```rust
fn main() {
    // Statement - doesn't return a value
    let x = 5;  // This is a statement

    // Expression - returns a value
    let y = {
        let temp = 3;
        temp + 1  // This block returns 4
    };

    println!("x = {}, y = {}", x, y);

    // if is an expression!
    let condition = true;
    let number = if condition { 5 } else { 6 };
    println!("number = {}", number);
}
```

---

## Control Flow: if/else

### Basic if/else

```rust
fn main() {
    let number = 7;

    if number < 5 {
        println!("Number is less than 5");
    } else if number > 5 {
        println!("Number is greater than 5");
    } else {
        println!("Number is 5");
    }
}
```

### if as an Expression

```rust
fn main() {
    let condition = true;
    let number = if condition { 5 } else { 6 };
    println!("The number is: {}", number);

    let age = 20;
    let status = if age >= 18 { "adult" } else { "minor" };
    println!("Status: {}", status);
}
```

---

## Hands-On Exercise 3: Grade Calculator

```rust
fn main() {
    let scores = [85, 92, 78, 65, 95];

    for score in scores {
        let grade = calculate_grade(score);
        println!("Score: {} -> Grade: {}", score, grade);
    }
}

fn calculate_grade(score: i32) -> char {
    if score >= 90 {
        'A'
    } else if score >= 80 {
        'B'
    } else if score >= 70 {
        'C'
    } else if score >= 60 {
        'D'
    } else {
        'F'
    }
}
```

---

## Loops

### loop - Infinite Loop

```rust
fn main() {
    let mut counter = 0;

    let result = loop {
        counter += 1;
        println!("Counter: {}", counter);

        if counter == 5 {
            break counter * 2;  // Return value from loop
        }
    };

    println!("Result: {}", result);
}
```

### while Loop

```rust
fn main() {
    let mut number = 3;

    while number != 0 {
        println!("{}!", number);
        number -= 1;
    }

    println!("LIFTOFF!");
}
```

### for Loop

```rust
fn main() {
    // Iterate over array
    let arr = [10, 20, 30, 40, 50];

    for element in arr {
        println!("Value: {}", element);
    }

    // Range (exclusive end)
    println!("\nCounting 1 to 5:");
    for number in 1..6 {
        println!("{}", number);
    }

    // Range (inclusive end)
    println!("\nCounting 1 to 5 (inclusive):");
    for number in 1..=5 {
        println!("{}", number);
    }

    // Reverse
    println!("\nCountdown:");
    for number in (1..4).rev() {
        println!("{}!", number);
    }
    println!("LIFTOFF!");
}
```

---

## Hands-On Exercise 4: FizzBuzz

The classic programming challenge!

```rust
fn main() {
    println!("=== FizzBuzz ===\n");

    for n in 1..=20 {
        let result = fizzbuzz(n);
        println!("{}: {}", n, result);
    }
}

fn fizzbuzz(n: i32) -> String {
    if n % 15 == 0 {
        String::from("FizzBuzz")
    } else if n % 3 == 0 {
        String::from("Fizz")
    } else if n % 5 == 0 {
        String::from("Buzz")
    } else {
        n.to_string()
    }
}
```

---

## Hands-On Exercise 5: Number Guessing Logic

```rust
fn main() {
    let secret = 42;
    let guesses = [25, 50, 42, 30, 45];

    println!("=== Number Guessing Game ===");
    println!("Secret number: {}\n", secret);

    for guess in guesses {
        print!("Guess {}: ", guess);
        check_guess(guess, secret);
    }
}

fn check_guess(guess: i32, secret: i32) {
    if guess == secret {
        println!("Correct! You got it!");
    } else if guess < secret {
        println!("Too low!");
    } else {
        println!("Too high!");
    }
}
```

---

## Loop Labels

```rust
fn main() {
    let mut count = 0;

    'outer: loop {
        println!("Count: {}", count);
        let mut remaining = 10;

        loop {
            println!("  Remaining: {}", remaining);
            if remaining == 9 {
                break;  // Breaks inner loop
            }
            if count == 2 {
                break 'outer;  // Breaks outer loop
            }
            remaining -= 1;
        }

        count += 1;
    }

    println!("Final count: {}", count);
}
```

---

## Hands-On Exercise 6: Factorial Calculator

```rust
fn main() {
    for n in 0..=10 {
        println!("{}! = {}", n, factorial(n));
    }
}

fn factorial(n: u64) -> u64 {
    if n == 0 {
        1
    } else {
        n * factorial(n - 1)
    }
}

// Iterative version
fn factorial_iterative(n: u64) -> u64 {
    let mut result = 1;
    for i in 1..=n {
        result *= i;
    }
    result
}
```

---

## Challenge: Temperature Converter Functions

```rust
fn main() {
    println!("=== Temperature Converter ===\n");

    let celsius_temps = [0.0, 25.0, 50.0, 100.0];

    for c in celsius_temps {
        let f = celsius_to_fahrenheit(c);
        let k = celsius_to_kelvin(c);
        println!("{:.1}°C = {:.1}°F = {:.1}K", c, f, k);
    }

    println!("\n=== Reverse Conversion ===\n");

    let fahrenheit_temps = [32.0, 77.0, 98.6, 212.0];

    for f in fahrenheit_temps {
        let c = fahrenheit_to_celsius(f);
        println!("{:.1}°F = {:.1}°C", f, c);
    }
}

fn celsius_to_fahrenheit(c: f64) -> f64 {
    (c * 9.0 / 5.0) + 32.0
}

fn celsius_to_kelvin(c: f64) -> f64 {
    c + 273.15
}

fn fahrenheit_to_celsius(f: f64) -> f64 {
    (f - 32.0) * 5.0 / 9.0
}
```

---

## Challenge: Fibonacci Sequence

```rust
fn main() {
    println!("=== Fibonacci Sequence ===\n");

    // Print first 20 Fibonacci numbers
    for n in 0..20 {
        println!("F({}) = {}", n, fibonacci(n));
    }
}

fn fibonacci(n: u32) -> u64 {
    if n == 0 {
        0
    } else if n == 1 {
        1
    } else {
        fibonacci(n - 1) + fibonacci(n - 2)
    }
}
```

---

## Key Takeaways

1. Functions are defined with `fn` keyword
2. Parameter types must be explicitly declared
3. Return type uses `-> Type` syntax
4. Last expression without `;` is the return value
5. `if/else` is an expression that returns a value
6. Three loop types: `loop`, `while`, `for`
7. Use `break` and `continue` to control loops
8. Loop labels allow breaking from nested loops

---

## Homework

1. Write a function that checks if a number is prime
2. Create a function that returns the nth Fibonacci number (optimized version)
3. Build a simple calculator with add, subtract, multiply, divide functions
4. Write a function that prints a multiplication table for a given number

---

[← Previous: Day 2](day-02.md) | [Next: Day 4 - Ownership →](day-04.md)
