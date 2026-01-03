# Rust VecDeque - Complete Interactive Guide

## 📚 What is VecDeque?

**VecDeque** (Vector Deque) is a **double-ended queue** that allows you to efficiently add or remove elements from both the front and back in O(1) time.

Think of it as a line of people where:
- New people can join at either the **front** or **back**
- People can leave from either the **front** or **back**
- You can still access people in the middle by index

### Internal Structure
VecDeque is implemented as a **ring buffer** (circular buffer) using a Vec, which makes operations at both ends very efficient.

```
Visual representation:
┌─────────────────────────────────┐
│  [A] [B] [C] [D] [E]            │
│   ↑                 ↑            │
│  front            back           │
└─────────────────────────────────┘
```

---

## 🚀 Basic Operations

### Creating a VecDeque

```rust
use std::collections::VecDeque;

fn main() {
    // Empty deque
    let mut deque1: VecDeque<i32> = VecDeque::new();
    
    // With initial capacity
    let mut deque2 = VecDeque::with_capacity(10);
    
    // From a vector
    let mut deque3: VecDeque<_> = vec![1, 2, 3].into_iter().collect();
    
    // Using from()
    let mut deque4 = VecDeque::from([1, 2, 3]);
}
```

### Adding Elements (Push)

```rust
let mut deque = VecDeque::new();

// Add to the back (like a normal queue)
deque.push_back(1);  // [1]
deque.push_back(2);  // [1, 2]
deque.push_back(3);  // [1, 2, 3]

// Add to the front
deque.push_front(0); // [0, 1, 2, 3]
deque.push_front(-1); // [-1, 0, 1, 2, 3]

println!("{:?}", deque); // [-1, 0, 1, 2, 3]
```

**Try it yourself:**
1. Create an empty deque
2. Push "A", "B", "C" to the back
3. Push "Z" to the front
4. What does your deque look like? Answer: [Z, A, B, C]

### Removing Elements (Pop)

```rust
let mut deque = VecDeque::from([1, 2, 3, 4, 5]);

// Remove from front (returns Option)
let front = deque.pop_front(); // Some(1)
println!("{:?}", deque); // [2, 3, 4, 5]

// Remove from back
let back = deque.pop_back(); // Some(5)
println!("{:?}", deque); // [2, 3, 4]

// When empty, returns None
let mut empty = VecDeque::<i32>::new();
let result = empty.pop_front(); // None
```

**Try it yourself:**
1. Create deque: [10, 20, 30, 40, 50]
2. Pop from front → What do you get? (10)
3. Pop from back → What do you get? (50)
4. What remains? ([20, 30, 40])

---

## 🔍 Accessing Elements

### Front and Back

```rust
let deque = VecDeque::from([1, 2, 3, 4, 5]);

// Peek at front without removing
let first = deque.front();     // Some(&1)
let last = deque.back();       // Some(&5)

// Mutable access
let mut deque = VecDeque::from([1, 2, 3]);
if let Some(front) = deque.front_mut() {
    *front = 100;
}
println!("{:?}", deque); // [100, 2, 3]
```

### Indexing

```rust
let deque = VecDeque::from(['a', 'b', 'c', 'd']);

// Access by index (like Vec)
let first = deque[0];      // 'a'
let second = deque[1];     // 'b'
let last = deque[deque.len() - 1]; // 'd'

// Mutable indexing
let mut deque = VecDeque::from([10, 20, 30]);
deque[1] = 200;
println!("{:?}", deque); // [10, 200, 30]
```

### Safe Access with get()

```rust
let deque = VecDeque::from([1, 2, 3]);

match deque.get(1) {
    Some(value) => println!("Value: {}", value),
    None => println!("Index out of bounds"),
}

// Out of bounds doesn't panic
let result = deque.get(10); // None
```

---

## 🔄 Advanced Operations

### Rotation

```rust
let mut deque = VecDeque::from([1, 2, 3, 4, 5]);

// Rotate left (elements move left, first becomes last)
deque.rotate_left(2);
println!("{:?}", deque); // [3, 4, 5, 1, 2]

let mut deque = VecDeque::from([1, 2, 3, 4, 5]);

// Rotate right (elements move right, last becomes first)
deque.rotate_right(2);
println!("{:?}", deque); // [4, 5, 1, 2, 3]
```

**Try it yourself:**
1. Start with [A, B, C, D, E]
2. Rotate left by 1 → What happens? ([B, C, D, E, A])
3. Rotate right by 2 → What happens? ([D, E, A, B, C])

### Iteration

```rust
let deque = VecDeque::from([1, 2, 3, 4, 5]);

// Immutable iteration
for item in &deque {
    print!("{} ", item);
}
// Output: 1 2 3 4 5

// Mutable iteration
let mut deque = VecDeque::from([1, 2, 3]);
for item in &mut deque {
    *item *= 2;
}
println!("{:?}", deque); // [2, 4, 6]

// Consuming iteration
for item in deque {
    println!("{}", item);
}
// deque is now moved and cannot be used
```

### Insert and Remove at Index

```rust
let mut deque = VecDeque::from([1, 2, 4, 5]);

// Insert at index (O(n) operation!)
deque.insert(2, 3);
println!("{:?}", deque); // [1, 2, 3, 4, 5]

// Remove at index (O(n) operation!)
let removed = deque.remove(2);
println!("Removed: {}", removed); // 3
println!("{:?}", deque); // [1, 2, 4, 5]
```

⚠️ **Note**: Insert and remove at arbitrary indices are **O(n)** operations. Use push/pop for O(1) performance!

---

## 💡 Practical Examples

### Example 1: Simple Queue (FIFO)

```rust
use std::collections::VecDeque;

fn main() {
    let mut queue = VecDeque::new();
    
    // Enqueue (add to back)
    queue.push_back("Task 1");
    queue.push_back("Task 2");
    queue.push_back("Task 3");
    
    // Dequeue (remove from front)
    while let Some(task) = queue.pop_front() {
        println!("Processing: {}", task);
    }
}

// Output:
// Processing: Task 1
// Processing: Task 2
// Processing: Task 3
```

**Exercise**: Create a queue of numbers 1-5 and process them in order.

---

### Example 2: Stack (LIFO)

```rust
use std::collections::VecDeque;

fn main() {
    let mut stack = VecDeque::new();
    
    // Push to back
    stack.push_back(1);
    stack.push_back(2);
    stack.push_back(3);
    
    // Pop from back (LIFO)
    while let Some(item) = stack.pop_back() {
        println!("{}", item);
    }
}

// Output:
// 3
// 2
// 1
```

---

### Example 3: Sliding Window

```rust
use std::collections::VecDeque;

fn sliding_window_max(nums: Vec<i32>, k: usize) {
    let mut window = VecDeque::new();
    
    println!("Finding max in sliding window of size {}", k);
    
    for i in 0..nums.len() {
        // Add new element
        window.push_back(nums[i]);
        
        // Remove oldest if window is too large
        if window.len() > k {
            window.pop_front();
        }
        
        // Print window and max
        if window.len() == k {
            let max = window.iter().max().unwrap();
            println!("Window: {:?}, Max: {}", window, max);
        }
    }
}

fn main() {
    sliding_window_max(vec![1, 3, -1, -3, 5, 3, 6, 7], 3);
}

// Output:
// Window: [1, 3, -1], Max: 3
// Window: [3, -1, -3], Max: 3
// Window: [-1, -3, 5], Max: 5
// Window: [-3, 5, 3], Max: 5
// Window: [5, 3, 6], Max: 6
// Window: [3, 6, 7], Max: 7
```

**Exercise**: Modify this to find the minimum in each window instead.

---

### Example 4: Palindrome Checker

```rust
use std::collections::VecDeque;

fn is_palindrome(s: &str) -> bool {
    let mut deque: VecDeque<char> = s.chars()
        .filter(|c| c.is_alphanumeric())
        .map(|c| c.to_lowercase().next().unwrap())
        .collect();
    
    while deque.len() > 1 {
        if deque.pop_front() != deque.pop_back() {
            return false;
        }
    }
    true
}

fn main() {
    println!("{}", is_palindrome("racecar"));        // true
    println!("{}", is_palindrome("hello"));          // false
    println!("{}", is_palindrome("A man a plan a canal Panama")); // true
}
```

**How it works:**
1. Convert string to deque of chars
2. Compare first and last characters
3. Remove both and repeat
4. If all match, it's a palindrome!

**Exercise**: Write a function that uses VecDeque to reverse a string.

---

### Example 5: BFS Graph Traversal

```rust
use std::collections::{VecDeque, HashSet};

fn bfs(graph: &Vec<Vec<usize>>, start: usize) {
    let mut queue = VecDeque::new();
    let mut visited = HashSet::new();
    
    queue.push_back(start);
    visited.insert(start);
    
    println!("BFS traversal starting from node {}:", start);
    
    while let Some(node) = queue.pop_front() {
        print!("{} ", node);
        
        // Visit all neighbors
        for &neighbor in &graph[node] {
            if visited.insert(neighbor) {
                queue.push_back(neighbor);
            }
        }
    }
    println!();
}

fn main() {
    // Graph: 0 -> [1, 2]
    //        1 -> [2, 3]
    //        2 -> [3]
    //        3 -> []
    let graph = vec![
        vec![1, 2],    // neighbors of 0
        vec![2, 3],    // neighbors of 1
        vec![3],       // neighbors of 2
        vec![],        // neighbors of 3
    ];
    
    bfs(&graph, 0);
}

// Output: BFS traversal starting from node 0:
// 0 1 2 3
```

---

### Example 6: Recent Items Cache

```rust
use std::collections::VecDeque;

struct RecentCache<T> {
    items: VecDeque<T>,
    capacity: usize,
}

impl<T> RecentCache<T> {
    fn new(capacity: usize) -> Self {
        RecentCache {
            items: VecDeque::with_capacity(capacity),
            capacity,
        }
    }
    
    fn add(&mut self, item: T) {
        if self.items.len() >= self.capacity {
            self.items.pop_front(); // Remove oldest
        }
        self.items.push_back(item); // Add newest
    }
    
    fn get_recent(&self) -> Vec<&T> {
        self.items.iter().collect()
    }
}

fn main() {
    let mut cache = RecentCache::new(3);
    
    cache.add("page1");
    cache.add("page2");
    cache.add("page3");
    println!("{:?}", cache.get_recent()); // ["page1", "page2", "page3"]
    
    cache.add("page4"); // page1 is removed
    println!("{:?}", cache.get_recent()); // ["page2", "page3", "page4"]
}
```

**Exercise**: Extend this to add a method that checks if an item is in recent history.

---

## ⚡ Performance Characteristics

| Operation | Time Complexity |
|-----------|----------------|
| `push_front()` | O(1) amortized |
| `push_back()` | O(1) amortized |
| `pop_front()` | O(1) |
| `pop_back()` | O(1) |
| `front()` / `back()` | O(1) |
| Index access `[i]` | O(1) |
| `insert(i, x)` | O(n) |
| `remove(i)` | O(n) |
| `len()` | O(1) |

**When to use VecDeque:**
- ✅ Queue operations (FIFO)
- ✅ Stack operations (LIFO)
- ✅ Sliding window problems
- ✅ BFS algorithms
- ✅ Maintaining recent items
- ✅ Double-ended access patterns

**When NOT to use VecDeque:**
- ❌ Only need single-ended queue (use `Vec`)
- ❌ Frequent insertions/deletions in the middle (use `LinkedList`)
- ❌ Need persistent data structure

---

## 🎯 Common Methods Cheat Sheet

```rust
// Creation
let mut d = VecDeque::new();
let mut d = VecDeque::with_capacity(10);
let d = VecDeque::from([1, 2, 3]);

// Adding elements
d.push_back(x);      // Add to back
d.push_front(x);     // Add to front

// Removing elements
d.pop_back();        // Remove from back, returns Option<T>
d.pop_front();       // Remove from front, returns Option<T>

// Accessing
d.front();           // Peek front, returns Option<&T>
d.back();            // Peek back, returns Option<&T>
d[i];                // Index access
d.get(i);            // Safe index access, returns Option<&T>

// Modification
d.insert(i, x);      // Insert at index i
d.remove(i);         // Remove at index i
d.rotate_left(n);    // Rotate left n positions
d.rotate_right(n);   // Rotate right n positions

// Queries
d.len();             // Number of elements
d.is_empty();        // Check if empty
d.capacity();        // Current capacity
d.contains(&x);      // Check if contains element

// Clearing
d.clear();           // Remove all elements
d.truncate(n);       // Keep only first n elements

// Iteration
for item in &d { }   // Immutable
for item in &mut d { } // Mutable
for item in d { }    // Consuming
```

---

## 🏋️ Practice Exercises

### Easy
1. Create a VecDeque and add numbers 1-10 to it. Then print them in reverse order.
2. Implement a function that rotates a VecDeque left by n positions.
3. Write a program that simulates a printer queue.

### Medium
4. Implement a circular buffer that wraps around using VecDeque.
5. Write a function that finds the first non-repeating character in a string using VecDeque.
6. Create a "recent history" browser back/forward navigation system.

### Hard
7. Implement a deque-based approach to solve the "sliding window maximum" problem.
8. Use VecDeque to solve the "shortest path in a maze" using BFS.
9. Create an LRU (Least Recently Used) cache using VecDeque.

---

## 🔑 Key Takeaways

1. **VecDeque = Double-Ended Queue**: Efficient operations at both ends
2. **O(1) at ends**: `push_front`, `push_back`, `pop_front`, `pop_back` are all O(1)
3. **Ring buffer**: Implemented as circular buffer for efficiency
4. **Random access**: Can still access elements by index in O(1)
5. **Use cases**: Queues, stacks, sliding windows, BFS, recent items

---

## 📖 Further Reading

- [Rust VecDeque Documentation](https://doc.rust-lang.org/std/collections/struct.VecDeque.html)
- Compare with `Vec`, `LinkedList`, and `BinaryHeap`
- Learn about memory layout and capacity management

---

**Happy coding with VecDeque! 🦀**
