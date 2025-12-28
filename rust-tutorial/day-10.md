# Day 10: Common Collections - Vectors

## Learning Objectives
- Create and manipulate vectors
- Access and modify vector elements
- Iterate over vectors
- Use vector methods effectively

---

## What is a Vector?

A `Vec<T>` is a growable array that stores elements of the same type on the heap.

```rust
fn main() {
    // Create empty vector with type annotation
    let v1: Vec<i32> = Vec::new();

    // Create vector with values using vec! macro
    let v2 = vec![1, 2, 3, 4, 5];

    // Create with specified capacity
    let v3: Vec<String> = Vec::with_capacity(10);

    println!("v1: {:?}", v1);
    println!("v2: {:?}", v2);
    println!("v3 capacity: {}", v3.capacity());
}
```

---

## Adding Elements

```rust
fn main() {
    let mut v = Vec::new();  // Type inferred from first push

    v.push(1);
    v.push(2);
    v.push(3);

    println!("Vector: {:?}", v);

    // Extend with multiple elements
    v.extend([4, 5, 6]);
    println!("Extended: {:?}", v);

    // Append another vector
    let mut other = vec![7, 8, 9];
    v.append(&mut other);  // other is now empty
    println!("Appended: {:?}", v);
    println!("Other is empty: {:?}", other);
}
```

---

## Hands-On Exercise 1: Building a Number List

```rust
fn main() {
    let mut numbers = Vec::new();

    // Add numbers 1-10
    for i in 1..=10 {
        numbers.push(i);
    }

    println!("Numbers: {:?}", numbers);
    println!("Length: {}", numbers.len());
    println!("Capacity: {}", numbers.capacity());

    // Add more numbers
    numbers.extend(11..=20);
    println!("Extended: {:?}", numbers);

    // Calculate sum
    let sum: i32 = numbers.iter().sum();
    println!("Sum: {}", sum);

    // Calculate average
    let avg = sum as f64 / numbers.len() as f64;
    println!("Average: {:.2}", avg);
}
```

---

## Accessing Elements

```rust
fn main() {
    let v = vec![10, 20, 30, 40, 50];

    // Direct indexing (can panic!)
    let third = v[2];
    println!("Third element: {}", third);

    // Safe access with get() (returns Option)
    match v.get(2) {
        Some(value) => println!("Got: {}", value),
        None => println!("No element at that index"),
    }

    // Access out of bounds
    // let bad = v[100];  // PANIC!
    let safe = v.get(100);  // Returns None
    println!("Safe access to index 100: {:?}", safe);

    // First and last
    println!("First: {:?}", v.first());
    println!("Last: {:?}", v.last());
}
```

---

## Modifying Elements

```rust
fn main() {
    let mut v = vec![1, 2, 3, 4, 5];
    println!("Original: {:?}", v);

    // Modify by index
    v[0] = 100;
    println!("After v[0] = 100: {:?}", v);

    // Using get_mut
    if let Some(elem) = v.get_mut(1) {
        *elem = 200;
    }
    println!("After get_mut: {:?}", v);

    // Pop last element
    let last = v.pop();
    println!("Popped: {:?}, Vector: {:?}", last, v);

    // Remove at index
    let removed = v.remove(1);
    println!("Removed at 1: {}, Vector: {:?}", removed, v);

    // Insert at index
    v.insert(1, 999);
    println!("After insert: {:?}", v);
}
```

---

## Hands-On Exercise 2: Stack Operations

```rust
fn main() {
    let mut stack: Vec<i32> = Vec::new();

    println!("=== Stack Operations ===");

    // Push operations
    stack.push(1);
    stack.push(2);
    stack.push(3);
    println!("After pushing 1, 2, 3: {:?}", stack);

    // Peek at top (last element)
    if let Some(&top) = stack.last() {
        println!("Top of stack: {}", top);
    }

    // Pop operations
    while let Some(value) = stack.pop() {
        println!("Popped: {}", value);
    }

    println!("Stack is empty: {}", stack.is_empty());
}
```

---

## Iterating Over Vectors

```rust
fn main() {
    let v = vec![10, 20, 30, 40, 50];

    // Immutable iteration
    println!("Reading values:");
    for value in &v {
        println!("  {}", value);
    }

    // With index
    println!("\nWith indices:");
    for (index, value) in v.iter().enumerate() {
        println!("  v[{}] = {}", index, value);
    }

    // Mutable iteration
    let mut v2 = vec![1, 2, 3, 4, 5];
    for value in &mut v2 {
        *value *= 2;
    }
    println!("\nDoubled: {:?}", v2);

    // Consuming iteration (takes ownership)
    let v3 = vec![1, 2, 3];
    for value in v3 {  // v3 is moved
        println!("Owned: {}", value);
    }
    // v3 is no longer valid here
}
```

---

## Hands-On Exercise 3: Vector Transformations

```rust
fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Filter: get only even numbers
    let evens: Vec<i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .copied()
        .collect();
    println!("Even numbers: {:?}", evens);

    // Map: square each number
    let squares: Vec<i32> = numbers.iter()
        .map(|&x| x * x)
        .collect();
    println!("Squares: {:?}", squares);

    // Filter and map combined
    let even_squares: Vec<i32> = numbers.iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| x * x)
        .collect();
    println!("Even squares: {:?}", even_squares);

    // Fold: calculate product
    let product: i32 = numbers.iter().product();
    println!("Product: {}", product);

    // Take and skip
    let first_three: Vec<i32> = numbers.iter().take(3).copied().collect();
    let skip_three: Vec<i32> = numbers.iter().skip(3).copied().collect();
    println!("First three: {:?}", first_three);
    println!("Skip three: {:?}", skip_three);
}
```

---

## Useful Vector Methods

```rust
fn main() {
    let mut v = vec![3, 1, 4, 1, 5, 9, 2, 6];

    // Length and capacity
    println!("Length: {}", v.len());
    println!("Capacity: {}", v.capacity());
    println!("Is empty: {}", v.is_empty());

    // Contains
    println!("Contains 5: {}", v.contains(&5));
    println!("Contains 7: {}", v.contains(&7));

    // Sort
    v.sort();
    println!("Sorted: {:?}", v);

    // Reverse
    v.reverse();
    println!("Reversed: {:?}", v);

    // Dedup (remove consecutive duplicates - sort first!)
    let mut v2 = vec![1, 1, 2, 2, 2, 3, 1, 1];
    v2.sort();
    v2.dedup();
    println!("After sort + dedup: {:?}", v2);

    // Clear
    v.clear();
    println!("After clear: {:?}", v);
}
```

---

## Hands-On Exercise 4: Statistics Calculator

```rust
fn main() {
    let data = vec![85.0, 90.0, 78.0, 92.0, 88.0, 76.0, 95.0, 89.0, 84.0, 91.0];

    println!("Data: {:?}", data);
    println!("Count: {}", count(&data));
    println!("Sum: {}", sum(&data));
    println!("Mean: {:.2}", mean(&data));
    println!("Min: {}", min(&data).unwrap());
    println!("Max: {}", max(&data).unwrap());
    println!("Range: {}", range(&data).unwrap());
    println!("Median: {:.2}", median(&data).unwrap());
}

fn count(data: &[f64]) -> usize {
    data.len()
}

fn sum(data: &[f64]) -> f64 {
    data.iter().sum()
}

fn mean(data: &[f64]) -> f64 {
    if data.is_empty() {
        return 0.0;
    }
    sum(data) / count(data) as f64
}

fn min(data: &[f64]) -> Option<f64> {
    data.iter().copied().reduce(f64::min)
}

fn max(data: &[f64]) -> Option<f64> {
    data.iter().copied().reduce(f64::max)
}

fn range(data: &[f64]) -> Option<f64> {
    Some(max(data)? - min(data)?)
}

fn median(data: &[f64]) -> Option<f64> {
    if data.is_empty() {
        return None;
    }

    let mut sorted = data.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    let mid = sorted.len() / 2;
    if sorted.len() % 2 == 0 {
        Some((sorted[mid - 1] + sorted[mid]) / 2.0)
    } else {
        Some(sorted[mid])
    }
}
```

---

## Slicing Vectors

```rust
fn main() {
    let v = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Create slices
    let first_half = &v[..5];
    let second_half = &v[5..];
    let middle = &v[3..7];

    println!("Full vector: {:?}", v);
    println!("First half: {:?}", first_half);
    println!("Second half: {:?}", second_half);
    println!("Middle: {:?}", middle);

    // Split
    let (left, right) = v.split_at(5);
    println!("Left: {:?}, Right: {:?}", left, right);

    // Chunks
    println!("Chunks of 3:");
    for chunk in v.chunks(3) {
        println!("  {:?}", chunk);
    }

    // Windows
    println!("Windows of 3:");
    for window in v.windows(3) {
        println!("  {:?}", window);
    }
}
```

---

## Hands-On Exercise 5: Todo List Manager

```rust
#[derive(Debug, Clone)]
struct Todo {
    id: usize,
    title: String,
    completed: bool,
}

struct TodoList {
    todos: Vec<Todo>,
    next_id: usize,
}

impl TodoList {
    fn new() -> Self {
        TodoList {
            todos: Vec::new(),
            next_id: 1,
        }
    }

    fn add(&mut self, title: &str) {
        let todo = Todo {
            id: self.next_id,
            title: String::from(title),
            completed: false,
        };
        self.todos.push(todo);
        self.next_id += 1;
    }

    fn complete(&mut self, id: usize) -> bool {
        if let Some(todo) = self.todos.iter_mut().find(|t| t.id == id) {
            todo.completed = true;
            return true;
        }
        false
    }

    fn remove(&mut self, id: usize) -> bool {
        if let Some(pos) = self.todos.iter().position(|t| t.id == id) {
            self.todos.remove(pos);
            return true;
        }
        false
    }

    fn list_all(&self) -> &[Todo] {
        &self.todos
    }

    fn list_pending(&self) -> Vec<&Todo> {
        self.todos.iter().filter(|t| !t.completed).collect()
    }

    fn list_completed(&self) -> Vec<&Todo> {
        self.todos.iter().filter(|t| t.completed).collect()
    }

    fn count(&self) -> usize {
        self.todos.len()
    }

    fn count_pending(&self) -> usize {
        self.todos.iter().filter(|t| !t.completed).count()
    }
}

fn main() {
    let mut list = TodoList::new();

    // Add todos
    list.add("Learn Rust vectors");
    list.add("Practice iterators");
    list.add("Build a project");
    list.add("Read documentation");

    println!("All todos ({}):", list.count());
    for todo in list.list_all() {
        println!("  {:?}", todo);
    }

    // Complete some
    list.complete(1);
    list.complete(2);

    println!("\nPending ({}):", list.count_pending());
    for todo in list.list_pending() {
        println!("  {} - {}", todo.id, todo.title);
    }

    println!("\nCompleted:");
    for todo in list.list_completed() {
        println!("  {} - {} ✓", todo.id, todo.title);
    }

    // Remove one
    list.remove(3);
    println!("\nAfter removing #3: {} todos remaining", list.count());
}
```

---

## Vectors with Enums

Store different types using enums:

```rust
#[derive(Debug)]
enum SpreadsheetCell {
    Int(i32),
    Float(f64),
    Text(String),
}

fn main() {
    let row = vec![
        SpreadsheetCell::Int(42),
        SpreadsheetCell::Float(3.14),
        SpreadsheetCell::Text(String::from("Hello")),
    ];

    for cell in &row {
        match cell {
            SpreadsheetCell::Int(i) => println!("Integer: {}", i),
            SpreadsheetCell::Float(f) => println!("Float: {}", f),
            SpreadsheetCell::Text(t) => println!("Text: {}", t),
        }
    }
}
```

---

## Challenge: Matrix Operations

```rust
type Matrix = Vec<Vec<f64>>;

fn create_matrix(rows: usize, cols: usize, value: f64) -> Matrix {
    vec![vec![value; cols]; rows]
}

fn print_matrix(m: &Matrix) {
    for row in m {
        println!("{:?}", row);
    }
}

fn add_matrices(a: &Matrix, b: &Matrix) -> Option<Matrix> {
    if a.len() != b.len() || a[0].len() != b[0].len() {
        return None;
    }

    let result = a.iter()
        .zip(b.iter())
        .map(|(row_a, row_b)| {
            row_a.iter()
                .zip(row_b.iter())
                .map(|(x, y)| x + y)
                .collect()
        })
        .collect();

    Some(result)
}

fn transpose(m: &Matrix) -> Matrix {
    if m.is_empty() || m[0].is_empty() {
        return vec![];
    }

    let rows = m.len();
    let cols = m[0].len();

    (0..cols)
        .map(|col| (0..rows).map(|row| m[row][col]).collect())
        .collect()
}

fn main() {
    let a = vec![
        vec![1.0, 2.0, 3.0],
        vec![4.0, 5.0, 6.0],
    ];

    let b = vec![
        vec![7.0, 8.0, 9.0],
        vec![10.0, 11.0, 12.0],
    ];

    println!("Matrix A:");
    print_matrix(&a);

    println!("\nMatrix B:");
    print_matrix(&b);

    if let Some(sum) = add_matrices(&a, &b) {
        println!("\nA + B:");
        print_matrix(&sum);
    }

    println!("\nTranspose of A:");
    print_matrix(&transpose(&a));
}
```

---

## Key Takeaways

1. **Vec<T> is a growable array on the heap**
2. **Use `vec![]` macro for convenient creation**
3. **`push()` and `pop()` for stack-like operations**
4. **Use `get()` for safe access (returns Option)**
5. **Iterate with `&v`, `&mut v`, or `v.iter()`**
6. **Chain iterator methods for transformations**
7. **Vectors can hold any type, including enums**

---

## Homework

1. Implement a ring buffer using a vector
2. Create a function that removes duplicates from a vector
3. Build a priority queue using a vector
4. Implement binary search on a sorted vector

---

[← Previous: Day 9](day-09.md) | [Next: Day 11 - Strings →](day-11.md)
