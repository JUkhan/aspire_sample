# Day 23: Testing

## Learning Objectives
- Write unit tests with #[test]
- Use assertions and test attributes
- Organize tests in modules
- Run integration tests

---

## Basic Tests

```rust
// In src/lib.rs or any file

fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_multiply() {
        assert_eq!(multiply(4, 5), 20);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-1, 1), 0);
    }
}
```

Run tests with:
```bash
cargo test
```

---

## Assertion Macros

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_assertions() {
        // Basic equality
        assert_eq!(2 + 2, 4);
        assert_ne!(2 + 2, 5);

        // Boolean
        assert!(true);
        assert!(5 > 3);

        // With custom message
        let result = 10;
        assert!(result > 5, "Result {} should be greater than 5", result);
        assert_eq!(result, 10, "Expected 10, got {}", result);
    }

    #[test]
    fn test_approximate_equality() {
        let a = 0.1 + 0.2;
        let b = 0.3;

        // Float comparison with epsilon
        assert!((a - b).abs() < 1e-10, "Floats should be approximately equal");
    }
}
```

---

## Hands-On Exercise 1: Testing a Calculator

```rust
struct Calculator;

impl Calculator {
    fn add(a: f64, b: f64) -> f64 {
        a + b
    }

    fn subtract(a: f64, b: f64) -> f64 {
        a - b
    }

    fn multiply(a: f64, b: f64) -> f64 {
        a * b
    }

    fn divide(a: f64, b: f64) -> Result<f64, String> {
        if b == 0.0 {
            Err("Division by zero".to_string())
        } else {
            Ok(a / b)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(Calculator::add(5.0, 3.0), 8.0);
        assert_eq!(Calculator::add(-5.0, 3.0), -2.0);
        assert_eq!(Calculator::add(0.0, 0.0), 0.0);
    }

    #[test]
    fn test_subtract() {
        assert_eq!(Calculator::subtract(10.0, 4.0), 6.0);
        assert_eq!(Calculator::subtract(4.0, 10.0), -6.0);
    }

    #[test]
    fn test_multiply() {
        assert_eq!(Calculator::multiply(3.0, 4.0), 12.0);
        assert_eq!(Calculator::multiply(-3.0, 4.0), -12.0);
        assert_eq!(Calculator::multiply(0.0, 100.0), 0.0);
    }

    #[test]
    fn test_divide_success() {
        assert_eq!(Calculator::divide(10.0, 2.0).unwrap(), 5.0);
        assert_eq!(Calculator::divide(-10.0, 2.0).unwrap(), -5.0);
    }

    #[test]
    fn test_divide_by_zero() {
        let result = Calculator::divide(10.0, 0.0);
        assert!(result.is_err());
        assert_eq!(result.unwrap_err(), "Division by zero");
    }
}
```

---

## Expected Panics

```rust
fn divide(a: i32, b: i32) -> i32 {
    if b == 0 {
        panic!("Cannot divide by zero!");
    }
    a / b
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    #[should_panic]
    fn test_divide_by_zero_panics() {
        divide(10, 0);
    }

    #[test]
    #[should_panic(expected = "Cannot divide by zero")]
    fn test_divide_by_zero_message() {
        divide(10, 0);
    }
}
```

---

## Using Result in Tests

```rust
#[cfg(test)]
mod tests {
    use std::fs;

    #[test]
    fn test_with_result() -> Result<(), String> {
        let value: i32 = "42".parse().map_err(|_| "Parse error")?;
        assert_eq!(value, 42);
        Ok(())
    }

    #[test]
    fn test_file_operation() -> Result<(), std::io::Error> {
        let content = fs::read_to_string("Cargo.toml")?;
        assert!(content.contains("[package]"));
        Ok(())
    }
}
```

---

## Hands-On Exercise 2: Testing a Validator

```rust
struct Validator;

impl Validator {
    fn validate_email(email: &str) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        if email.is_empty() {
            errors.push("Email cannot be empty".to_string());
        }

        if !email.contains('@') {
            errors.push("Email must contain @".to_string());
        }

        if !email.contains('.') {
            errors.push("Email must contain a dot".to_string());
        }

        if email.starts_with('@') || email.ends_with('@') {
            errors.push("@ cannot be at start or end".to_string());
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }

    fn validate_password(password: &str) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();

        if password.len() < 8 {
            errors.push("Password must be at least 8 characters".to_string());
        }

        if !password.chars().any(|c| c.is_uppercase()) {
            errors.push("Password must contain uppercase letter".to_string());
        }

        if !password.chars().any(|c| c.is_lowercase()) {
            errors.push("Password must contain lowercase letter".to_string());
        }

        if !password.chars().any(|c| c.is_numeric()) {
            errors.push("Password must contain a number".to_string());
        }

        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod email_tests {
        use super::*;

        #[test]
        fn valid_email() {
            assert!(Validator::validate_email("test@example.com").is_ok());
        }

        #[test]
        fn empty_email() {
            let result = Validator::validate_email("");
            assert!(result.is_err());
            assert!(result.unwrap_err().contains(&"Email cannot be empty".to_string()));
        }

        #[test]
        fn email_without_at() {
            let result = Validator::validate_email("testexample.com");
            assert!(result.is_err());
        }

        #[test]
        fn email_without_dot() {
            let result = Validator::validate_email("test@examplecom");
            assert!(result.is_err());
        }
    }

    mod password_tests {
        use super::*;

        #[test]
        fn valid_password() {
            assert!(Validator::validate_password("SecureP4ss").is_ok());
        }

        #[test]
        fn short_password() {
            let result = Validator::validate_password("Short1");
            assert!(result.is_err());
        }

        #[test]
        fn password_no_uppercase() {
            let result = Validator::validate_password("lowercase123");
            assert!(result.is_err());
        }

        #[test]
        fn password_no_number() {
            let result = Validator::validate_password("NoNumbers");
            assert!(result.is_err());
        }

        #[test]
        fn count_errors() {
            let result = Validator::validate_password("ab");
            let errors = result.unwrap_err();
            assert!(errors.len() >= 2);  // Short + no uppercase + no number
        }
    }
}
```

---

## Test Organization

```rust
// src/lib.rs

pub fn public_function() -> i32 {
    private_function() * 2
}

fn private_function() -> i32 {
    42
}

// Tests can access private functions
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_public() {
        assert_eq!(public_function(), 84);
    }

    #[test]
    fn test_private() {
        assert_eq!(private_function(), 42);
    }

    // Nested modules for organization
    mod unit_tests {
        use super::*;

        #[test]
        fn another_test() {
            assert!(true);
        }
    }
}
```

---

## Ignoring Tests

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn quick_test() {
        assert!(true);
    }

    #[test]
    #[ignore]
    fn expensive_test() {
        // This test takes a long time
        std::thread::sleep(std::time::Duration::from_secs(10));
        assert!(true);
    }

    #[test]
    #[ignore = "not yet implemented"]
    fn future_test() {
        todo!("Implement this test");
    }
}
```

Run ignored tests:
```bash
cargo test -- --ignored
cargo test -- --include-ignored
```

---

## Hands-On Exercise 3: Testing a Data Structure

```rust
struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self {
        Stack { items: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }

    fn peek(&self) -> Option<&T> {
        self.items.last()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    fn len(&self) -> usize {
        self.items.len()
    }

    fn clear(&mut self) {
        self.items.clear();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_stack_is_empty() {
        let stack: Stack<i32> = Stack::new();
        assert!(stack.is_empty());
        assert_eq!(stack.len(), 0);
    }

    #[test]
    fn push_adds_element() {
        let mut stack = Stack::new();
        stack.push(1);
        assert!(!stack.is_empty());
        assert_eq!(stack.len(), 1);
    }

    #[test]
    fn pop_removes_element() {
        let mut stack = Stack::new();
        stack.push(1);
        stack.push(2);

        assert_eq!(stack.pop(), Some(2));
        assert_eq!(stack.len(), 1);
    }

    #[test]
    fn pop_empty_returns_none() {
        let mut stack: Stack<i32> = Stack::new();
        assert_eq!(stack.pop(), None);
    }

    #[test]
    fn peek_returns_last() {
        let mut stack = Stack::new();
        stack.push(1);
        stack.push(2);

        assert_eq!(stack.peek(), Some(&2));
        assert_eq!(stack.len(), 2);  // Not removed
    }

    #[test]
    fn lifo_order() {
        let mut stack = Stack::new();
        stack.push(1);
        stack.push(2);
        stack.push(3);

        assert_eq!(stack.pop(), Some(3));
        assert_eq!(stack.pop(), Some(2));
        assert_eq!(stack.pop(), Some(1));
        assert_eq!(stack.pop(), None);
    }

    #[test]
    fn clear_removes_all() {
        let mut stack = Stack::new();
        stack.push(1);
        stack.push(2);
        stack.push(3);

        stack.clear();

        assert!(stack.is_empty());
        assert_eq!(stack.len(), 0);
    }

    #[test]
    fn works_with_strings() {
        let mut stack = Stack::new();
        stack.push(String::from("hello"));
        stack.push(String::from("world"));

        assert_eq!(stack.pop(), Some(String::from("world")));
    }
}
```

---

## Integration Tests

Create tests in `tests/` directory:

```rust
// tests/integration_test.rs

// Import your library
use your_crate_name::*;

#[test]
fn test_public_api() {
    // Test public interface
    assert_eq!(public_function(), 84);
}

mod common;

#[test]
fn test_with_helper() {
    let data = common::setup();
    // Use data...
}
```

```rust
// tests/common/mod.rs

pub fn setup() -> Vec<i32> {
    vec![1, 2, 3, 4, 5]
}

pub fn teardown() {
    // Cleanup code
}
```

---

## Test Fixtures and Setup

```rust
#[cfg(test)]
mod tests {
    struct TestDatabase {
        data: std::collections::HashMap<String, String>,
    }

    impl TestDatabase {
        fn new() -> Self {
            let mut data = std::collections::HashMap::new();
            data.insert("key1".to_string(), "value1".to_string());
            data.insert("key2".to_string(), "value2".to_string());
            TestDatabase { data }
        }

        fn get(&self, key: &str) -> Option<&String> {
            self.data.get(key)
        }

        fn insert(&mut self, key: &str, value: &str) {
            self.data.insert(key.to_string(), value.to_string());
        }
    }

    impl Drop for TestDatabase {
        fn drop(&mut self) {
            // Cleanup
            println!("Cleaning up test database");
        }
    }

    #[test]
    fn test_with_fixture() {
        let db = TestDatabase::new();
        assert_eq!(db.get("key1"), Some(&"value1".to_string()));
    }

    #[test]
    fn test_insert() {
        let mut db = TestDatabase::new();
        db.insert("key3", "value3");
        assert_eq!(db.get("key3"), Some(&"value3".to_string()));
    }
}
```

---

## Hands-On Exercise 4: Testing Async-like Code

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

struct MessageQueue {
    sender: mpsc::Sender<String>,
    receiver: mpsc::Receiver<String>,
}

impl MessageQueue {
    fn new() -> Self {
        let (sender, receiver) = mpsc::channel();
        MessageQueue { sender, receiver }
    }

    fn send(&self, message: &str) -> Result<(), mpsc::SendError<String>> {
        self.sender.send(message.to_string())
    }

    fn receive(&self, timeout: Duration) -> Result<String, mpsc::RecvTimeoutError> {
        self.receiver.recv_timeout(timeout)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn send_and_receive() {
        let queue = MessageQueue::new();
        queue.send("Hello").unwrap();

        let msg = queue.receive(Duration::from_secs(1)).unwrap();
        assert_eq!(msg, "Hello");
    }

    #[test]
    fn receive_timeout() {
        let queue = MessageQueue::new();

        let result = queue.receive(Duration::from_millis(100));
        assert!(result.is_err());
    }

    #[test]
    fn multiple_messages() {
        let queue = MessageQueue::new();

        queue.send("First").unwrap();
        queue.send("Second").unwrap();
        queue.send("Third").unwrap();

        assert_eq!(queue.receive(Duration::from_secs(1)).unwrap(), "First");
        assert_eq!(queue.receive(Duration::from_secs(1)).unwrap(), "Second");
        assert_eq!(queue.receive(Duration::from_secs(1)).unwrap(), "Third");
    }

    #[test]
    fn concurrent_send() {
        let queue = MessageQueue::new();
        let sender = queue.sender.clone();

        let handle = thread::spawn(move || {
            sender.send("From thread".to_string()).unwrap();
        });

        handle.join().unwrap();

        let msg = queue.receive(Duration::from_secs(1)).unwrap();
        assert_eq!(msg, "From thread");
    }
}
```

---

## Test Output and Debugging

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn test_with_output() {
        println!("This will only show if test fails or --nocapture is used");

        let value = 42;
        eprintln!("Debug: value = {}", value);

        assert_eq!(value, 42);
    }

    #[test]
    fn test_debug_format() {
        #[derive(Debug)]
        struct Point { x: i32, y: i32 }

        let p = Point { x: 10, y: 20 };
        dbg!(&p);  // Prints to stderr with file/line info

        assert_eq!(p.x, 10);
    }
}
```

Run with output:
```bash
cargo test -- --nocapture
cargo test -- --show-output
```

---

## Benchmark Tests (Nightly)

```rust
#![feature(test)]

extern crate test;

fn fibonacci(n: u32) -> u32 {
    match n {
        0 => 0,
        1 => 1,
        _ => fibonacci(n - 1) + fibonacci(n - 2),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use test::Bencher;

    #[bench]
    fn bench_fibonacci_20(b: &mut Bencher) {
        b.iter(|| fibonacci(20));
    }
}
```

---

## Challenge: Comprehensive Test Suite

```rust
pub struct BankAccount {
    id: String,
    balance: f64,
    transaction_history: Vec<Transaction>,
}

#[derive(Clone, Debug, PartialEq)]
pub struct Transaction {
    pub amount: f64,
    pub transaction_type: TransactionType,
}

#[derive(Clone, Debug, PartialEq)]
pub enum TransactionType {
    Deposit,
    Withdrawal,
}

impl BankAccount {
    pub fn new(id: &str) -> Self {
        BankAccount {
            id: id.to_string(),
            balance: 0.0,
            transaction_history: Vec::new(),
        }
    }

    pub fn deposit(&mut self, amount: f64) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("Deposit amount must be positive".to_string());
        }
        self.balance += amount;
        self.transaction_history.push(Transaction {
            amount,
            transaction_type: TransactionType::Deposit,
        });
        Ok(())
    }

    pub fn withdraw(&mut self, amount: f64) -> Result<(), String> {
        if amount <= 0.0 {
            return Err("Withdrawal amount must be positive".to_string());
        }
        if amount > self.balance {
            return Err("Insufficient funds".to_string());
        }
        self.balance -= amount;
        self.transaction_history.push(Transaction {
            amount,
            transaction_type: TransactionType::Withdrawal,
        });
        Ok(())
    }

    pub fn balance(&self) -> f64 {
        self.balance
    }

    pub fn history(&self) -> &[Transaction] {
        &self.transaction_history
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    mod creation {
        use super::*;

        #[test]
        fn new_account_has_zero_balance() {
            let account = BankAccount::new("123");
            assert_eq!(account.balance(), 0.0);
        }

        #[test]
        fn new_account_has_empty_history() {
            let account = BankAccount::new("123");
            assert!(account.history().is_empty());
        }
    }

    mod deposits {
        use super::*;

        #[test]
        fn deposit_increases_balance() {
            let mut account = BankAccount::new("123");
            account.deposit(100.0).unwrap();
            assert_eq!(account.balance(), 100.0);
        }

        #[test]
        fn multiple_deposits() {
            let mut account = BankAccount::new("123");
            account.deposit(100.0).unwrap();
            account.deposit(50.0).unwrap();
            assert_eq!(account.balance(), 150.0);
        }

        #[test]
        fn deposit_zero_fails() {
            let mut account = BankAccount::new("123");
            let result = account.deposit(0.0);
            assert!(result.is_err());
        }

        #[test]
        fn deposit_negative_fails() {
            let mut account = BankAccount::new("123");
            let result = account.deposit(-50.0);
            assert!(result.is_err());
        }

        #[test]
        fn deposit_records_transaction() {
            let mut account = BankAccount::new("123");
            account.deposit(100.0).unwrap();

            let history = account.history();
            assert_eq!(history.len(), 1);
            assert_eq!(history[0].amount, 100.0);
            assert_eq!(history[0].transaction_type, TransactionType::Deposit);
        }
    }

    mod withdrawals {
        use super::*;

        #[test]
        fn withdraw_decreases_balance() {
            let mut account = BankAccount::new("123");
            account.deposit(100.0).unwrap();
            account.withdraw(30.0).unwrap();
            assert_eq!(account.balance(), 70.0);
        }

        #[test]
        fn withdraw_more_than_balance_fails() {
            let mut account = BankAccount::new("123");
            account.deposit(50.0).unwrap();
            let result = account.withdraw(100.0);
            assert!(result.is_err());
            assert_eq!(account.balance(), 50.0);  // Balance unchanged
        }

        #[test]
        fn withdraw_exact_balance() {
            let mut account = BankAccount::new("123");
            account.deposit(100.0).unwrap();
            account.withdraw(100.0).unwrap();
            assert_eq!(account.balance(), 0.0);
        }
    }
}
```

---

## Key Takeaways

1. **Use `#[test]` to mark test functions**
2. **`assert!`, `assert_eq!`, `assert_ne!` for assertions**
3. **`#[should_panic]` for expected panics**
4. **Tests can return `Result<(), E>`**
5. **`#[cfg(test)]` compiles only for tests**
6. **Integration tests go in `tests/` directory**
7. **Use `cargo test` to run all tests**

---

## Homework

1. Write a complete test suite for a linked list
2. Create integration tests for a file parser
3. Implement property-based testing for a sorting algorithm
4. Build a test harness with setup/teardown

---

[← Previous: Day 22](day-22.md) | [Next: Day 24 - Documentation & Cargo →](day-24.md)
