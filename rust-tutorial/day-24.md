# Day 24: Documentation and Cargo

## Learning Objectives
- Write documentation comments
- Generate documentation with rustdoc
- Use Cargo features and workspaces
- Publish crates to crates.io

---

## Documentation Comments

```rust
/// Adds two numbers together.
///
/// # Arguments
///
/// * `a` - The first number
/// * `b` - The second number
///
/// # Returns
///
/// The sum of `a` and `b`
///
/// # Examples
///
/// ```
/// let result = add(2, 3);
/// assert_eq!(result, 5);
/// ```
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/// Divides two numbers.
///
/// # Arguments
///
/// * `a` - The dividend
/// * `b` - The divisor
///
/// # Returns
///
/// * `Ok(result)` - The quotient if successful
/// * `Err(message)` - An error if division by zero
///
/// # Errors
///
/// Returns an error if `b` is zero.
///
/// # Examples
///
/// ```
/// let result = divide(10.0, 2.0).unwrap();
/// assert_eq!(result, 5.0);
/// ```
///
/// ```
/// let result = divide(10.0, 0.0);
/// assert!(result.is_err());
/// ```
pub fn divide(a: f64, b: f64) -> Result<f64, String> {
    if b == 0.0 {
        Err("Division by zero".to_string())
    } else {
        Ok(a / b)
    }
}
```

---

## Module Documentation

```rust
//! # My Math Library
//!
//! `my_math` provides basic mathematical operations.
//!
//! ## Features
//!
//! - Basic arithmetic (add, subtract, multiply, divide)
//! - Advanced operations (power, factorial)
//! - Statistical functions (mean, median, mode)
//!
//! ## Quick Start
//!
//! ```rust
//! use my_math::basic::add;
//!
//! let sum = add(2, 3);
//! assert_eq!(sum, 5);
//! ```

/// Basic arithmetic operations.
pub mod basic {
    /// Adds two numbers.
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    /// Subtracts the second number from the first.
    pub fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }
}

/// Advanced mathematical operations.
pub mod advanced {
    /// Calculates the power of a number.
    ///
    /// # Examples
    ///
    /// ```
    /// use my_math::advanced::power;
    /// assert_eq!(power(2, 10), 1024);
    /// ```
    pub fn power(base: i32, exp: u32) -> i32 {
        (0..exp).fold(1, |acc, _| acc * base)
    }
}
```

---

## Hands-On Exercise 1: Documenting a Library

```rust
//! # Configuration Parser
//!
//! A simple library for parsing configuration files.
//!
//! ## Supported Formats
//!
//! - Key-value pairs (`key = value`)
//! - Comments (lines starting with `#`)
//! - Empty lines (ignored)
//!
//! ## Example
//!
//! ```
//! use config_parser::Config;
//!
//! let text = "
//! # Database settings
//! host = localhost
//! port = 5432
//! ";
//!
//! let config = Config::parse(text).unwrap();
//! assert_eq!(config.get("host"), Some(&"localhost".to_string()));
//! ```

use std::collections::HashMap;

/// A configuration container that stores key-value pairs.
///
/// # Example
///
/// ```
/// use config_parser::Config;
///
/// let mut config = Config::new();
/// config.set("key", "value");
/// assert_eq!(config.get("key"), Some(&"value".to_string()));
/// ```
#[derive(Debug, Default)]
pub struct Config {
    values: HashMap<String, String>,
}

/// Errors that can occur during parsing.
#[derive(Debug)]
pub enum ParseError {
    /// Line has invalid format (missing `=`)
    InvalidLine(String),
    /// Key is empty
    EmptyKey,
}

impl Config {
    /// Creates a new empty configuration.
    ///
    /// # Examples
    ///
    /// ```
    /// use config_parser::Config;
    /// let config = Config::new();
    /// assert!(config.is_empty());
    /// ```
    pub fn new() -> Self {
        Config {
            values: HashMap::new(),
        }
    }

    /// Parses configuration from a string.
    ///
    /// # Arguments
    ///
    /// * `text` - The configuration text to parse
    ///
    /// # Returns
    ///
    /// A `Result` containing the parsed `Config` or a `ParseError`.
    ///
    /// # Examples
    ///
    /// ```
    /// use config_parser::Config;
    ///
    /// let config = Config::parse("name = Alice\nage = 30").unwrap();
    /// assert_eq!(config.get("name"), Some(&"Alice".to_string()));
    /// ```
    pub fn parse(text: &str) -> Result<Self, ParseError> {
        let mut config = Config::new();

        for line in text.lines() {
            let line = line.trim();

            // Skip empty lines and comments
            if line.is_empty() || line.starts_with('#') {
                continue;
            }

            // Parse key = value
            let parts: Vec<&str> = line.splitn(2, '=').collect();
            if parts.len() != 2 {
                return Err(ParseError::InvalidLine(line.to_string()));
            }

            let key = parts[0].trim();
            let value = parts[1].trim();

            if key.is_empty() {
                return Err(ParseError::EmptyKey);
            }

            config.set(key, value);
        }

        Ok(config)
    }

    /// Gets a value by key.
    ///
    /// Returns `None` if the key doesn't exist.
    pub fn get(&self, key: &str) -> Option<&String> {
        self.values.get(key)
    }

    /// Sets a key-value pair.
    pub fn set(&mut self, key: &str, value: &str) {
        self.values.insert(key.to_string(), value.to_string());
    }

    /// Returns true if the configuration is empty.
    pub fn is_empty(&self) -> bool {
        self.values.is_empty()
    }

    /// Returns the number of configuration entries.
    pub fn len(&self) -> usize {
        self.values.len()
    }
}
```

---

## Generating Documentation

```bash
# Generate and open documentation
cargo doc --open

# Include dependencies
cargo doc --no-deps

# Document private items
cargo doc --document-private-items
```

---

## Doc Tests

Documentation examples are tested automatically:

```rust
/// Calculates factorial.
///
/// # Panics
///
/// Panics if `n` is greater than 20 (overflow).
///
/// # Examples
///
/// ```
/// assert_eq!(factorial(0), 1);
/// assert_eq!(factorial(5), 120);
/// ```
///
/// ```should_panic
/// factorial(21);  // This will panic
/// ```
///
/// ```no_run
/// // This example compiles but doesn't run
/// let result = factorial(10);
/// println!("{}", result);
/// ```
///
/// ```ignore
/// // This example is completely ignored
/// let x = broken_code();
/// ```
pub fn factorial(n: u64) -> u64 {
    if n > 20 {
        panic!("Overflow: n must be <= 20");
    }
    (1..=n).product()
}
```

---

## Cargo.toml Configuration

```toml
[package]
name = "my_crate"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <you@example.com>"]
description = "A short description of your crate"
license = "MIT"
repository = "https://github.com/user/repo"
documentation = "https://docs.rs/my_crate"
readme = "README.md"
keywords = ["keyword1", "keyword2"]
categories = ["development-tools"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1.0", optional = true }

[dev-dependencies]
criterion = "0.4"

[features]
default = []
async = ["tokio"]
full = ["async"]

[profile.release]
opt-level = 3
lto = true

[profile.dev]
opt-level = 0
debug = true
```

---

## Hands-On Exercise 2: Feature Flags

```rust
// src/lib.rs

//! A library with optional features.

/// Basic functionality (always available)
pub fn basic_function() -> &'static str {
    "Basic function"
}

/// Async functionality (requires "async" feature)
#[cfg(feature = "async")]
pub async fn async_function() -> &'static str {
    "Async function"
}

/// Advanced functionality (requires "advanced" feature)
#[cfg(feature = "advanced")]
pub mod advanced {
    pub fn advanced_function() -> &'static str {
        "Advanced function"
    }
}

/// Full functionality (requires "full" feature)
#[cfg(feature = "full")]
pub fn full_function() -> &'static str {
    "Full function"
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_basic() {
        assert_eq!(basic_function(), "Basic function");
    }

    #[test]
    #[cfg(feature = "advanced")]
    fn test_advanced() {
        assert_eq!(advanced::advanced_function(), "Advanced function");
    }
}
```

```toml
# Cargo.toml
[features]
default = []
async = ["tokio"]
advanced = []
full = ["async", "advanced"]

[dependencies]
tokio = { version = "1.0", optional = true }
```

---

## Workspaces

For projects with multiple crates:

```toml
# Cargo.toml (workspace root)
[workspace]
members = [
    "core",
    "cli",
    "web",
]

[workspace.dependencies]
serde = "1.0"
tokio = "1.0"
```

```
my_workspace/
├── Cargo.toml
├── core/
│   ├── Cargo.toml
│   └── src/lib.rs
├── cli/
│   ├── Cargo.toml
│   └── src/main.rs
└── web/
    ├── Cargo.toml
    └── src/main.rs
```

```toml
# core/Cargo.toml
[package]
name = "my_core"
version = "0.1.0"

[dependencies]
serde.workspace = true
```

```toml
# cli/Cargo.toml
[package]
name = "my_cli"
version = "0.1.0"

[dependencies]
my_core = { path = "../core" }
```

---

## Cargo Commands

```bash
# Build
cargo build
cargo build --release

# Run
cargo run
cargo run --example example_name
cargo run --bin binary_name

# Test
cargo test
cargo test --lib
cargo test --doc
cargo test test_name

# Check (faster than build)
cargo check

# Format
cargo fmt

# Lint
cargo clippy

# Documentation
cargo doc --open

# Update dependencies
cargo update

# Audit for security
cargo audit

# See dependency tree
cargo tree
```

---

## Hands-On Exercise 3: Build Scripts

```rust
// build.rs (in crate root)

use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // Get OUT_DIR
    let out_dir = env::var("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("generated.rs");

    // Generate code
    let code = r#"
        pub const BUILD_TIME: &str = env!("BUILD_TIME");
        pub const GIT_HASH: &str = env!("GIT_HASH");

        pub fn version_info() -> String {
            format!("Built at {} ({})", BUILD_TIME, GIT_HASH)
        }
    "#;

    fs::write(&dest_path, code).unwrap();

    // Set environment variables for build
    println!("cargo:rustc-env=BUILD_TIME={}", chrono::Utc::now());

    // Try to get git hash
    let git_hash = std::process::Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
        .unwrap_or_else(|_| "unknown".to_string());

    println!("cargo:rustc-env=GIT_HASH={}", git_hash);

    // Rerun if these change
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=.git/HEAD");
}
```

```rust
// src/lib.rs

// Include generated code
include!(concat!(env!("OUT_DIR"), "/generated.rs"));

pub fn get_version() -> String {
    version_info()
}
```

---

## Publishing to crates.io

1. Create account at https://crates.io
2. Get API token
3. Login:

```bash
cargo login <your-token>
```

4. Prepare Cargo.toml:

```toml
[package]
name = "unique_crate_name"
version = "0.1.0"
edition = "2021"
authors = ["Your Name <email@example.com>"]
description = "A short description"
license = "MIT"
repository = "https://github.com/user/repo"
documentation = "https://docs.rs/unique_crate_name"
readme = "README.md"
keywords = ["keyword1", "keyword2"]
categories = ["category"]
```

5. Verify:

```bash
cargo publish --dry-run
```

6. Publish:

```bash
cargo publish
```

---

## Hands-On Exercise 4: Complete Crate Structure

```
my_crate/
├── Cargo.toml
├── README.md
├── LICENSE
├── CHANGELOG.md
├── src/
│   ├── lib.rs
│   ├── config.rs
│   └── utils.rs
├── examples/
│   └── basic.rs
├── tests/
│   └── integration.rs
└── benches/
    └── benchmark.rs
```

```toml
# Cargo.toml
[package]
name = "my_crate"
version = "0.1.0"
edition = "2021"
authors = ["Author <author@example.com>"]
description = "A demonstration crate"
license = "MIT OR Apache-2.0"
repository = "https://github.com/author/my_crate"
documentation = "https://docs.rs/my_crate"
readme = "README.md"
keywords = ["demo", "example"]
categories = ["development-tools"]

[dependencies]

[dev-dependencies]
criterion = "0.4"

[[bench]]
name = "benchmark"
harness = false
```

```rust
// src/lib.rs
//! # My Crate
//!
//! A demonstration of crate structure.

mod config;
mod utils;

pub use config::Config;
pub use utils::*;

/// The main entry point.
pub fn run() {
    println!("Running my_crate");
}
```

```rust
// examples/basic.rs
use my_crate::run;

fn main() {
    run();
}
```

Run example:
```bash
cargo run --example basic
```

---

## Semantic Versioning

```toml
# version = "MAJOR.MINOR.PATCH"

# MAJOR: Breaking changes
# MINOR: New features, backward compatible
# PATCH: Bug fixes, backward compatible

version = "1.2.3"

# Pre-release
version = "1.0.0-alpha.1"
version = "1.0.0-beta.2"
version = "1.0.0-rc.1"
```

---

## Key Takeaways

1. **Use `///` for documentation comments**
2. **`//!` documents the enclosing item**
3. **Doc examples are tested with `cargo test`**
4. **Use features for optional functionality**
5. **Workspaces manage multiple related crates**
6. **`cargo doc` generates HTML documentation**
7. **Follow semantic versioning for releases**

---

## Homework

1. Document a library with examples for every public item
2. Create a workspace with shared dependencies
3. Implement feature flags for optional functionality
4. Create a build script that generates version info

---

[← Previous: Day 23](day-23.md) | [Next: Day 25 - File I/O →](day-25.md)
