# Day 18: Iterators

## Learning Objectives
- Understand the Iterator trait
- Use iterator adapters and consumers
- Create custom iterators
- Master lazy evaluation and iterator chains

---

## The Iterator Trait

```rust
// The Iterator trait (simplified)
trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}
```

Basic iterator usage:

```rust
fn main() {
    let v = vec![1, 2, 3];

    // Get an iterator
    let mut iter = v.iter();

    // Call next manually
    println!("{:?}", iter.next());  // Some(&1)
    println!("{:?}", iter.next());  // Some(&2)
    println!("{:?}", iter.next());  // Some(&3)
    println!("{:?}", iter.next());  // None

    // For loop uses iterators automatically
    for x in v.iter() {
        println!("{}", x);
    }
}
```

---

## Three Types of Iteration

```rust
fn main() {
    let v = vec![1, 2, 3];

    // iter() - borrows elements (&T)
    for x in v.iter() {
        println!("Borrowed: {}", x);
    }
    println!("v still exists: {:?}", v);

    // iter_mut() - mutable borrow (&mut T)
    let mut v2 = vec![1, 2, 3];
    for x in v2.iter_mut() {
        *x *= 2;
    }
    println!("Mutated: {:?}", v2);

    // into_iter() - takes ownership (T)
    let v3 = vec![1, 2, 3];
    for x in v3.into_iter() {
        println!("Owned: {}", x);
    }
    // v3 no longer exists
}
```

---

## Hands-On Exercise 1: Basic Iterator Operations

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // count
    println!("Count: {}", numbers.iter().count());

    // sum and product
    let sum: i32 = numbers.iter().sum();
    let product: i32 = numbers.iter().product();
    println!("Sum: {}, Product: {}", sum, product);

    // min and max
    println!("Min: {:?}", numbers.iter().min());
    println!("Max: {:?}", numbers.iter().max());

    // first and last
    println!("First: {:?}", numbers.iter().next());
    println!("Last: {:?}", numbers.iter().last());

    // nth (0-indexed)
    println!("Third element: {:?}", numbers.iter().nth(2));

    // position
    let pos = numbers.iter().position(|&x| x == 5);
    println!("Position of 5: {:?}", pos);
}
```

---

## Iterator Adapters

Adapters transform iterators into other iterators (lazy!):

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // map - transform each element
    let doubled: Vec<i32> = numbers.iter()
        .map(|x| x * 2)
        .collect();
    println!("Doubled: {:?}", doubled);

    // filter - keep matching elements
    let evens: Vec<&i32> = numbers.iter()
        .filter(|x| *x % 2 == 0)
        .collect();
    println!("Evens: {:?}", evens);

    // filter_map - filter and map combined
    let parsed: Vec<i32> = vec!["1", "two", "3", "four", "5"]
        .iter()
        .filter_map(|s| s.parse().ok())
        .collect();
    println!("Parsed: {:?}", parsed);

    // take and skip
    let first_3: Vec<&i32> = numbers.iter().take(3).collect();
    let skip_2: Vec<&i32> = numbers.iter().skip(2).collect();
    println!("First 3: {:?}, Skip 2: {:?}", first_3, skip_2);
}
```

---

## Hands-On Exercise 2: Chaining Adapters

```rust
fn main() {
    let data = vec![
        ("Alice", 85),
        ("Bob", 92),
        ("Charlie", 78),
        ("Diana", 95),
        ("Eve", 88),
    ];

    // Find high scorers
    let high_scorers: Vec<&str> = data.iter()
        .filter(|(_, score)| *score >= 90)
        .map(|(name, _)| *name)
        .collect();
    println!("High scorers: {:?}", high_scorers);

    // Calculate average
    let avg: f64 = data.iter()
        .map(|(_, score)| *score as f64)
        .sum::<f64>() / data.len() as f64;
    println!("Average: {:.2}", avg);

    // Grade distribution
    let passing = data.iter().filter(|(_, s)| *s >= 60).count();
    let failing = data.iter().filter(|(_, s)| *s < 60).count();
    println!("Passing: {}, Failing: {}", passing, failing);

    // Transform to report strings
    let report: Vec<String> = data.iter()
        .map(|(name, score)| format!("{}: {} ({})",
            name, score,
            if *score >= 90 { "A" }
            else if *score >= 80 { "B" }
            else if *score >= 70 { "C" }
            else { "F" }
        ))
        .collect();

    println!("\nReport:");
    for line in &report {
        println!("  {}", line);
    }
}
```

---

## More Iterator Adapters

```rust
fn main() {
    let words = vec!["hello", "world", "rust"];

    // enumerate - get index with value
    for (i, word) in words.iter().enumerate() {
        println!("{}: {}", i, word);
    }

    // zip - combine two iterators
    let numbers = vec![1, 2, 3];
    let zipped: Vec<(&i32, &&str)> = numbers.iter()
        .zip(words.iter())
        .collect();
    println!("\nZipped: {:?}", zipped);

    // chain - concatenate iterators
    let a = vec![1, 2];
    let b = vec![3, 4, 5];
    let chained: Vec<&i32> = a.iter().chain(b.iter()).collect();
    println!("Chained: {:?}", chained);

    // flatten - flatten nested iterators
    let nested = vec![vec![1, 2], vec![3, 4], vec![5]];
    let flat: Vec<&i32> = nested.iter()
        .flatten()
        .collect();
    println!("Flattened: {:?}", flat);

    // flat_map - map then flatten
    let result: Vec<i32> = vec![1, 2, 3].iter()
        .flat_map(|&x| vec![x, x * 10])
        .collect();
    println!("Flat mapped: {:?}", result);
}
```

---

## Iterator Consumers

Consumers produce a final value (they're eager):

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    // collect - most common consumer
    let doubled: Vec<i32> = numbers.iter().map(|x| x * 2).collect();

    // fold - accumulate with initial value
    let sum = numbers.iter().fold(0, |acc, x| acc + x);
    let product = numbers.iter().fold(1, |acc, x| acc * x);
    println!("Sum: {}, Product: {}", sum, product);

    // reduce - like fold but uses first element as initial
    let max = numbers.iter().copied().reduce(|a, b| if a > b { a } else { b });
    println!("Max via reduce: {:?}", max);

    // any and all
    let has_even = numbers.iter().any(|x| x % 2 == 0);
    let all_positive = numbers.iter().all(|x| *x > 0);
    println!("Has even: {}, All positive: {}", has_even, all_positive);

    // find
    let first_even = numbers.iter().find(|x| *x % 2 == 0);
    println!("First even: {:?}", first_even);

    // partition
    let (evens, odds): (Vec<i32>, Vec<i32>) = numbers.iter()
        .partition(|x| *x % 2 == 0);
    println!("Evens: {:?}, Odds: {:?}", evens, odds);
}
```

---

## Hands-On Exercise 3: Data Processing Pipeline

```rust
#[derive(Debug, Clone)]
struct Transaction {
    id: u32,
    amount: f64,
    category: String,
    is_expense: bool,
}

fn main() {
    let transactions = vec![
        Transaction { id: 1, amount: 100.0, category: "Food".to_string(), is_expense: true },
        Transaction { id: 2, amount: 500.0, category: "Salary".to_string(), is_expense: false },
        Transaction { id: 3, amount: 50.0, category: "Transport".to_string(), is_expense: true },
        Transaction { id: 4, amount: 200.0, category: "Food".to_string(), is_expense: true },
        Transaction { id: 5, amount: 1000.0, category: "Salary".to_string(), is_expense: false },
        Transaction { id: 6, amount: 75.0, category: "Entertainment".to_string(), is_expense: true },
    ];

    // Total income
    let income: f64 = transactions.iter()
        .filter(|t| !t.is_expense)
        .map(|t| t.amount)
        .sum();
    println!("Total income: ${:.2}", income);

    // Total expenses
    let expenses: f64 = transactions.iter()
        .filter(|t| t.is_expense)
        .map(|t| t.amount)
        .sum();
    println!("Total expenses: ${:.2}", expenses);

    // Balance
    println!("Balance: ${:.2}", income - expenses);

    // Expenses by category
    let food_expenses: f64 = transactions.iter()
        .filter(|t| t.is_expense && t.category == "Food")
        .map(|t| t.amount)
        .sum();
    println!("Food expenses: ${:.2}", food_expenses);

    // Largest expense
    let largest = transactions.iter()
        .filter(|t| t.is_expense)
        .max_by(|a, b| a.amount.partial_cmp(&b.amount).unwrap());
    println!("Largest expense: {:?}", largest.map(|t| (&t.category, t.amount)));

    // Count by type
    let expense_count = transactions.iter().filter(|t| t.is_expense).count();
    let income_count = transactions.iter().filter(|t| !t.is_expense).count();
    println!("Transactions: {} expenses, {} income", expense_count, income_count);
}
```

---

## Creating Custom Iterators

```rust
struct Counter {
    current: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Self {
        Counter { current: 0, max }
    }
}

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<Self::Item> {
        if self.current < self.max {
            self.current += 1;
            Some(self.current)
        } else {
            None
        }
    }
}

fn main() {
    // Basic usage
    let counter = Counter::new(5);
    for n in counter {
        print!("{} ", n);
    }
    println!();

    // With iterator methods
    let sum: u32 = Counter::new(10).sum();
    println!("Sum 1-10: {}", sum);

    // Chaining with other adapters
    let result: Vec<u32> = Counter::new(10)
        .filter(|x| x % 2 == 0)
        .map(|x| x * x)
        .collect();
    println!("Even squares: {:?}", result);
}
```

---

## Hands-On Exercise 4: Range Iterator

```rust
struct Range {
    start: i32,
    end: i32,
    step: i32,
}

impl Range {
    fn new(start: i32, end: i32) -> Self {
        Range { start, end, step: 1 }
    }

    fn with_step(start: i32, end: i32, step: i32) -> Self {
        Range { start, end, step }
    }
}

impl Iterator for Range {
    type Item = i32;

    fn next(&mut self) -> Option<Self::Item> {
        if (self.step > 0 && self.start < self.end) ||
           (self.step < 0 && self.start > self.end) {
            let value = self.start;
            self.start += self.step;
            Some(value)
        } else {
            None
        }
    }
}

fn main() {
    // Basic range
    let range: Vec<i32> = Range::new(1, 6).collect();
    println!("1 to 5: {:?}", range);

    // With step
    let evens: Vec<i32> = Range::with_step(0, 11, 2).collect();
    println!("Even 0-10: {:?}", evens);

    // Negative step (countdown)
    let countdown: Vec<i32> = Range::with_step(5, 0, -1).collect();
    println!("Countdown: {:?}", countdown);

    // Using iterator methods
    let sum: i32 = Range::new(1, 101).sum();
    println!("Sum 1-100: {}", sum);

    let squares: Vec<i32> = Range::new(1, 6)
        .map(|x| x * x)
        .collect();
    println!("Squares 1-5: {:?}", squares);
}
```

---

## IntoIterator Trait

```rust
struct Wrapper {
    items: Vec<i32>,
}

impl IntoIterator for Wrapper {
    type Item = i32;
    type IntoIter = std::vec::IntoIter<i32>;

    fn into_iter(self) -> Self::IntoIter {
        self.items.into_iter()
    }
}

// For borrowing
impl<'a> IntoIterator for &'a Wrapper {
    type Item = &'a i32;
    type IntoIter = std::slice::Iter<'a, i32>;

    fn into_iter(self) -> Self::IntoIter {
        self.items.iter()
    }
}

fn main() {
    let w = Wrapper { items: vec![1, 2, 3] };

    // Borrow iteration
    for x in &w {
        println!("{}", x);
    }

    // Owned iteration
    for x in w {
        println!("Owned: {}", x);
    }
    // w is consumed
}
```

---

## Hands-On Exercise 5: Fibonacci Iterator

```rust
struct Fibonacci {
    curr: u64,
    next: u64,
}

impl Fibonacci {
    fn new() -> Self {
        Fibonacci { curr: 0, next: 1 }
    }
}

impl Iterator for Fibonacci {
    type Item = u64;

    fn next(&mut self) -> Option<Self::Item> {
        let new_next = self.curr.checked_add(self.next)?;
        self.curr = self.next;
        self.next = new_next;
        Some(self.curr)
    }
}

fn main() {
    // First 10 Fibonacci numbers
    let fibs: Vec<u64> = Fibonacci::new().take(10).collect();
    println!("First 10 Fibonacci: {:?}", fibs);

    // Fibonacci numbers less than 100
    let small_fibs: Vec<u64> = Fibonacci::new()
        .take_while(|&x| x < 100)
        .collect();
    println!("Fibonacci < 100: {:?}", small_fibs);

    // Sum of first 20 Fibonacci numbers
    let sum: u64 = Fibonacci::new().take(20).sum();
    println!("Sum of first 20: {}", sum);

    // Even Fibonacci numbers
    let even_fibs: Vec<u64> = Fibonacci::new()
        .take(15)
        .filter(|x| x % 2 == 0)
        .collect();
    println!("Even Fibonacci: {:?}", even_fibs);
}
```

---

## Peekable and Other Utilities

```rust
fn main() {
    // peekable - look ahead without consuming
    let mut iter = vec![1, 2, 3, 4].into_iter().peekable();

    while let Some(&next) = iter.peek() {
        if next % 2 == 0 {
            println!("Even: {}", iter.next().unwrap());
        } else {
            println!("Odd: {}", iter.next().unwrap());
        }
    }

    // cycle - repeat forever
    let pattern: Vec<i32> = vec![1, 2, 3].into_iter()
        .cycle()
        .take(10)
        .collect();
    println!("Cycled: {:?}", pattern);

    // step_by - skip elements
    let stepped: Vec<i32> = (0..20).step_by(3).collect();
    println!("Step by 3: {:?}", stepped);

    // rev - reverse
    let reversed: Vec<i32> = (1..=5).rev().collect();
    println!("Reversed: {:?}", reversed);

    // inspect - debug without consuming
    let result: Vec<i32> = (1..=5)
        .inspect(|x| println!("Before: {}", x))
        .map(|x| x * 2)
        .inspect(|x| println!("After: {}", x))
        .collect();
    println!("Result: {:?}", result);
}
```

---

## Challenge: Tree Iterator

```rust
#[derive(Debug)]
struct TreeNode<T> {
    value: T,
    children: Vec<TreeNode<T>>,
}

impl<T> TreeNode<T> {
    fn new(value: T) -> Self {
        TreeNode {
            value,
            children: Vec::new(),
        }
    }

    fn add_child(&mut self, child: TreeNode<T>) {
        self.children.push(child);
    }

    // Depth-first iterator
    fn iter(&self) -> TreeIter<T> {
        TreeIter {
            stack: vec![self],
        }
    }
}

struct TreeIter<'a, T> {
    stack: Vec<&'a TreeNode<T>>,
}

impl<'a, T> Iterator for TreeIter<'a, T> {
    type Item = &'a T;

    fn next(&mut self) -> Option<Self::Item> {
        if let Some(node) = self.stack.pop() {
            // Add children in reverse order for left-to-right traversal
            for child in node.children.iter().rev() {
                self.stack.push(child);
            }
            Some(&node.value)
        } else {
            None
        }
    }
}

fn main() {
    let mut root = TreeNode::new("root");

    let mut child1 = TreeNode::new("child1");
    child1.add_child(TreeNode::new("grandchild1"));
    child1.add_child(TreeNode::new("grandchild2"));

    let mut child2 = TreeNode::new("child2");
    child2.add_child(TreeNode::new("grandchild3"));

    root.add_child(child1);
    root.add_child(child2);
    root.add_child(TreeNode::new("child3"));

    println!("Tree traversal (depth-first):");
    for value in root.iter() {
        println!("  {}", value);
    }

    // Using iterator methods
    let count = root.iter().count();
    println!("\nTotal nodes: {}", count);

    let collected: Vec<&&str> = root.iter().collect();
    println!("All values: {:?}", collected);
}
```

---

## Key Takeaways

1. **Iterators are lazy - adapters don't execute until consumed**
2. **iter(), iter_mut(), into_iter() for different ownership**
3. **Adapters transform: map, filter, take, skip, zip, chain**
4. **Consumers produce values: collect, fold, sum, count**
5. **Implement Iterator trait for custom iterators**
6. **IntoIterator enables for-loop syntax**
7. **Chain adapters for powerful data pipelines**

---

## Homework

1. Create a `PrimeIterator` that yields prime numbers
2. Implement a `SlidingWindow` iterator
3. Build a `GroupBy` iterator that groups consecutive equal elements
4. Create an iterator that reads and processes file lines

---

[← Previous: Day 17](day-17.md) | [Next: Day 19 - Smart Pointers →](day-19.md)
