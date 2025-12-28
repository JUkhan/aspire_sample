# Day 1: Introduction to Rust & Hello World

## Learning Objectives
- Understand what Rust is and why it matters
- Install Rust on your system
- Write and run your first Rust program
- Understand Cargo, Rust's build system

---

## What is Rust?

Rust is a systems programming language focused on:
- **Safety**: Memory safety without garbage collection
- **Speed**: Performance comparable to C/C++
- **Concurrency**: Fearless concurrent programming

### Why Learn Rust?
- Used by Mozilla, Microsoft, Google, Amazon, and more
- Voted "most loved language" on Stack Overflow for 8+ years
- Great for systems programming, WebAssembly, CLI tools, and web services

---

## Installation

### Windows
```bash
# Download and run rustup-init.exe from https://rustup.rs
# Or use winget:
winget install Rustlang.Rustup
```

### macOS/Linux
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Verify Installation
```bash
rustc --version
cargo --version
```

---

## Hands-On Exercise 1: Hello World (The Simple Way)

Create a file called `hello.rs`:

```rust
fn main() {
    println!("Hello, World!");
}
```

Compile and run:
```bash
rustc hello.rs
./hello       # On Linux/macOS
hello.exe     # On Windows
```

### Understanding the Code
- `fn main()` - The entry point of every Rust program
- `println!` - A macro (note the `!`) that prints to console
- Statements end with semicolons `;`

---

## Hands-On Exercise 2: Using Cargo (The Right Way)

Cargo is Rust's package manager and build system. Always use it for real projects!

```bash
# Create a new project
cargo new hello_cargo
cd hello_cargo

# Look at the structure
# hello_cargo/
# ├── Cargo.toml    # Project configuration
# └── src/
#     └── main.rs   # Your code
```

### Explore Cargo.toml
```toml
[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2021"

[dependencies]
```

### Explore src/main.rs
```rust
fn main() {
    println!("Hello, world!");
}
```

### Build and Run
```bash
cargo build          # Compile (debug mode)
cargo run            # Compile and run
cargo build --release # Compile optimized for release
cargo check          # Check for errors without building
```

---

## Hands-On Exercise 3: Customize Your Greeting

Modify `src/main.rs`:

```rust
fn main() {
    let name = "Rustacean";
    println!("Hello, {}!", name);
    println!("Welcome to 30 Days of Rust!");

    // This is a comment
    /* This is a
       multi-line comment */

    // Print with multiple values
    let day = 1;
    let total_days = 30;
    println!("This is day {} of {}", day, total_days);
}
```

Run it:
```bash
cargo run
```

Expected output:
```
Hello, Rustacean!
Welcome to 30 Days of Rust!
This is day 1 of 30
```

---

## Hands-On Exercise 4: Playing with println!

```rust
fn main() {
    // Different formatting options
    println!("Basic print");
    println!();  // Empty line

    // Positional arguments
    println!("{0} is learning {1}. {0} loves {1}!", "Alice", "Rust");

    // Named arguments
    println!("{language} was created by {creator}",
             language = "Rust",
             creator = "Graydon Hoare");

    // Debug printing
    println!("{:?}", (1, 2, 3));  // Prints: (1, 2, 3)

    // Binary, hex, octal
    println!("Binary: {:b}, Hex: {:x}, Octal: {:o}", 42, 42, 42);

    // Padding
    println!("|{:>10}|", "right");   // Right align
    println!("|{:<10}|", "left");    // Left align
    println!("|{:^10}|", "center");  // Center
}
```

---

## Challenge: Build a ASCII Art Printer

Create a new project and make it print ASCII art:

```rust
fn main() {
    println!(r"
    ____            _
   |  _ \ _   _ ___| |_
   | |_) | | | / __| __|
   |  _ <| |_| \__ \ |_
   |_| \_\\__,_|___/\__|

   30 Days of Rust - Day 1
    ");

    // r"..." is a raw string - backslashes aren't escape characters
}
```

---

## Key Takeaways

1. Rust programs start with `fn main()`
2. Use `cargo` for all real projects
3. `println!` is a macro for printing (macros use `!`)
4. Comments use `//` or `/* */`
5. Use `cargo run` to build and execute

---

## Homework

1. Create a Cargo project called `about_me`
2. Print your name, favorite programming language, and why you're learning Rust
3. Experiment with different `println!` formatting options
4. Run `cargo check` and `cargo build --release` to see the difference

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `rustc file.rs` | Compile a single file |
| `cargo new project_name` | Create new project |
| `cargo build` | Build project |
| `cargo run` | Build and run |
| `cargo check` | Check for errors |
| `cargo build --release` | Build optimized |

---

[Next: Day 2 - Variables, Mutability, and Data Types →](day-02.md)
