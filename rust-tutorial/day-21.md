# Day 21: Concurrency Basics

## Learning Objectives
- Create and manage threads
- Share data safely between threads
- Use Arc and Mutex for thread-safe sharing
- Understand Send and Sync traits

---

## Creating Threads

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // Spawn a new thread
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("Thread: count {}", i);
            thread::sleep(Duration::from_millis(100));
        }
    });

    // Main thread continues
    for i in 1..=3 {
        println!("Main: count {}", i);
        thread::sleep(Duration::from_millis(150));
    }

    // Wait for thread to finish
    handle.join().unwrap();

    println!("All done!");
}
```

---

## Moving Data into Threads

```rust
use std::thread;

fn main() {
    let data = vec![1, 2, 3, 4, 5];

    // Use move to transfer ownership
    let handle = thread::spawn(move || {
        println!("Data in thread: {:?}", data);
        let sum: i32 = data.iter().sum();
        sum
    });

    // data is no longer accessible here

    let result = handle.join().unwrap();
    println!("Sum: {}", result);
}
```

---

## Hands-On Exercise 1: Parallel Computation

```rust
use std::thread;

fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Split work across threads
    let mid = numbers.len() / 2;
    let first_half = numbers[..mid].to_vec();
    let second_half = numbers[mid..].to_vec();

    let handle1 = thread::spawn(move || {
        let sum: i32 = first_half.iter().sum();
        println!("First half sum: {}", sum);
        sum
    });

    let handle2 = thread::spawn(move || {
        let sum: i32 = second_half.iter().sum();
        println!("Second half sum: {}", sum);
        sum
    });

    let sum1 = handle1.join().unwrap();
    let sum2 = handle2.join().unwrap();

    println!("Total sum: {}", sum1 + sum2);
}
```

---

## Multiple Threads

```rust
use std::thread;

fn main() {
    let mut handles = vec![];

    for i in 0..5 {
        let handle = thread::spawn(move || {
            println!("Thread {} starting", i);
            thread::sleep(std::time::Duration::from_millis(100 * i as u64));
            println!("Thread {} done", i);
            i * i
        });
        handles.push(handle);
    }

    let results: Vec<i32> = handles
        .into_iter()
        .map(|h| h.join().unwrap())
        .collect();

    println!("Results: {:?}", results);
}
```

---

## Arc: Atomic Reference Counting

For sharing data across threads:

```rust
use std::sync::Arc;
use std::thread;

fn main() {
    let data = Arc::new(vec![1, 2, 3, 4, 5]);

    let mut handles = vec![];

    for i in 0..3 {
        let data = Arc::clone(&data);

        let handle = thread::spawn(move || {
            println!("Thread {}: {:?}", i, data);
            let sum: i32 = data.iter().sum();
            println!("Thread {} sum: {}", i, sum);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Original data still accessible: {:?}", data);
}
```

---

## Mutex: Mutual Exclusion

For safe mutable access:

```rust
use std::sync::Mutex;

fn main() {
    let counter = Mutex::new(0);

    {
        let mut num = counter.lock().unwrap();
        *num += 1;
    }  // Lock released here

    {
        let mut num = counter.lock().unwrap();
        *num += 10;
    }

    println!("Counter: {}", counter.lock().unwrap());
}
```

---

## Hands-On Exercise 2: Thread-Safe Counter

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);

        let handle = thread::spawn(move || {
            for _ in 0..100 {
                let mut num = counter.lock().unwrap();
                *num += 1;
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", counter.lock().unwrap());
    // Should be 1000 (10 threads × 100 increments)
}
```

---

## Combining Arc and Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::HashMap;

fn main() {
    let scores = Arc::new(Mutex::new(HashMap::new()));
    let mut handles = vec![];

    let players = vec!["Alice", "Bob", "Charlie"];

    for player in players {
        let scores = Arc::clone(&scores);

        let handle = thread::spawn(move || {
            // Simulate game
            let score = (player.len() * 10) as i32;

            let mut map = scores.lock().unwrap();
            map.insert(player.to_string(), score);

            println!("{} scored {}", player, score);
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("\nFinal scores:");
    let scores = scores.lock().unwrap();
    for (player, score) in scores.iter() {
        println!("  {}: {}", player, score);
    }
}
```

---

## Hands-On Exercise 3: Parallel Map

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn parallel_map<T, U, F>(data: Vec<T>, f: F) -> Vec<U>
where
    T: Send + 'static,
    U: Send + 'static,
    F: Fn(T) -> U + Send + Sync + 'static,
{
    let f = Arc::new(f);
    let results = Arc::new(Mutex::new(vec![]));
    let mut handles = vec![];

    for (index, item) in data.into_iter().enumerate() {
        let f = Arc::clone(&f);
        let results = Arc::clone(&results);

        let handle = thread::spawn(move || {
            let result = f(item);
            let mut vec = results.lock().unwrap();
            vec.push((index, result));
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    let mut results = Arc::try_unwrap(results).unwrap().into_inner().unwrap();
    results.sort_by_key(|(i, _)| *i);
    results.into_iter().map(|(_, v)| v).collect()
}

fn main() {
    let numbers = vec![1, 2, 3, 4, 5];

    let squared = parallel_map(numbers, |x| {
        thread::sleep(std::time::Duration::from_millis(100));
        x * x
    });

    println!("Squared: {:?}", squared);
}
```

---

## RwLock: Read-Write Lock

Multiple readers OR one writer:

```rust
use std::sync::{Arc, RwLock};
use std::thread;

fn main() {
    let data = Arc::new(RwLock::new(vec![1, 2, 3]));
    let mut handles = vec![];

    // Multiple readers
    for i in 0..3 {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let reader = data.read().unwrap();
            println!("Reader {}: {:?}", i, *reader);
        });
        handles.push(handle);
    }

    // One writer
    {
        let data = Arc::clone(&data);
        let handle = thread::spawn(move || {
            let mut writer = data.write().unwrap();
            writer.push(4);
            println!("Writer: added 4");
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final data: {:?}", data.read().unwrap());
}
```

---

## Hands-On Exercise 4: Thread Pool Simulation

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::VecDeque;

struct ThreadPool {
    workers: Vec<thread::JoinHandle<()>>,
    sender: Arc<Mutex<VecDeque<Box<dyn FnOnce() + Send>>>>,
    running: Arc<Mutex<bool>>,
}

impl ThreadPool {
    fn new(size: usize) -> Self {
        let sender = Arc::new(Mutex::new(VecDeque::new()));
        let running = Arc::new(Mutex::new(true));
        let mut workers = Vec::new();

        for id in 0..size {
            let sender = Arc::clone(&sender);
            let running = Arc::clone(&running);

            let handle = thread::spawn(move || {
                loop {
                    let job = {
                        let mut queue = sender.lock().unwrap();
                        queue.pop_front()
                    };

                    if let Some(job) = job {
                        println!("Worker {} executing job", id);
                        job();
                    } else {
                        let is_running = *running.lock().unwrap();
                        if !is_running {
                            break;
                        }
                        thread::sleep(std::time::Duration::from_millis(10));
                    }
                }
                println!("Worker {} shutting down", id);
            });

            workers.push(handle);
        }

        ThreadPool {
            workers,
            sender,
            running,
        }
    }

    fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let mut queue = self.sender.lock().unwrap();
        queue.push_back(Box::new(f));
    }

    fn shutdown(self) {
        *self.running.lock().unwrap() = false;

        for worker in self.workers {
            worker.join().unwrap();
        }
    }
}

fn main() {
    let pool = ThreadPool::new(4);

    for i in 0..8 {
        pool.execute(move || {
            println!("Task {} running", i);
            thread::sleep(std::time::Duration::from_millis(100));
            println!("Task {} done", i);
        });
    }

    thread::sleep(std::time::Duration::from_millis(500));
    pool.shutdown();
    println!("All done!");
}
```

---

## Send and Sync Traits

```rust
use std::rc::Rc;
use std::sync::Arc;
use std::cell::RefCell;
use std::sync::Mutex;

fn main() {
    // Arc<T> is Send and Sync (if T is Send + Sync)
    let arc = Arc::new(5);
    let arc_clone = Arc::clone(&arc);

    std::thread::spawn(move || {
        println!("Arc in thread: {}", arc_clone);
    }).join().unwrap();

    // Rc<T> is NOT Send - single-threaded only
    let rc = Rc::new(5);
    // This won't compile:
    // std::thread::spawn(move || {
    //     println!("Rc in thread: {}", rc);
    // });

    // Mutex<T> provides Sync even if T isn't
    let mutex = Arc::new(Mutex::new(RefCell::new(5)));
    let mutex_clone = Arc::clone(&mutex);

    std::thread::spawn(move || {
        let lock = mutex_clone.lock().unwrap();
        println!("Mutex<RefCell> in thread: {:?}", lock.borrow());
    }).join().unwrap();
}
```

---

## Hands-On Exercise 5: Producer-Consumer

```rust
use std::sync::{Arc, Mutex, Condvar};
use std::thread;
use std::collections::VecDeque;

struct Queue<T> {
    data: Mutex<VecDeque<T>>,
    not_empty: Condvar,
}

impl<T> Queue<T> {
    fn new() -> Self {
        Queue {
            data: Mutex::new(VecDeque::new()),
            not_empty: Condvar::new(),
        }
    }

    fn push(&self, item: T) {
        let mut data = self.data.lock().unwrap();
        data.push_back(item);
        self.not_empty.notify_one();
    }

    fn pop(&self) -> T {
        let mut data = self.data.lock().unwrap();
        while data.is_empty() {
            data = self.not_empty.wait(data).unwrap();
        }
        data.pop_front().unwrap()
    }
}

fn main() {
    let queue = Arc::new(Queue::new());
    let mut handles = vec![];

    // Producers
    for i in 0..3 {
        let queue = Arc::clone(&queue);
        let handle = thread::spawn(move || {
            for j in 0..3 {
                let item = format!("Item {}-{}", i, j);
                println!("Producing: {}", item);
                queue.push(item);
                thread::sleep(std::time::Duration::from_millis(50));
            }
        });
        handles.push(handle);
    }

    // Consumer
    let queue_consumer = Arc::clone(&queue);
    let consumer = thread::spawn(move || {
        for _ in 0..9 {
            let item = queue_consumer.pop();
            println!("Consumed: {}", item);
        }
    });
    handles.push(consumer);

    for handle in handles {
        handle.join().unwrap();
    }

    println!("All done!");
}
```

---

## Atomic Types

For lock-free operations:

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

fn main() {
    let counter = Arc::new(AtomicUsize::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);

        let handle = thread::spawn(move || {
            for _ in 0..100 {
                counter.fetch_add(1, Ordering::SeqCst);
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final count: {}", counter.load(Ordering::SeqCst));
}
```

---

## Challenge: Parallel Word Counter

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::collections::HashMap;

fn parallel_word_count(texts: Vec<&str>, num_threads: usize) -> HashMap<String, usize> {
    let word_counts = Arc::new(Mutex::new(HashMap::new()));
    let texts = Arc::new(texts.into_iter().map(String::from).collect::<Vec<_>>());
    let chunk_size = (texts.len() + num_threads - 1) / num_threads;
    let mut handles = vec![];

    for i in 0..num_threads {
        let word_counts = Arc::clone(&word_counts);
        let texts = Arc::clone(&texts);
        let start = i * chunk_size;
        let end = ((i + 1) * chunk_size).min(texts.len());

        let handle = thread::spawn(move || {
            let mut local_counts = HashMap::new();

            for text in &texts[start..end] {
                for word in text.split_whitespace() {
                    let word = word.to_lowercase();
                    *local_counts.entry(word).or_insert(0) += 1;
                }
            }

            // Merge local counts into global
            let mut global = word_counts.lock().unwrap();
            for (word, count) in local_counts {
                *global.entry(word).or_insert(0) += count;
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    Arc::try_unwrap(word_counts).unwrap().into_inner().unwrap()
}

fn main() {
    let texts = vec![
        "hello world hello rust",
        "world of rust programming",
        "rust is awesome rust is fast",
        "hello from the rust world",
    ];

    let counts = parallel_word_count(texts, 2);

    let mut sorted: Vec<_> = counts.iter().collect();
    sorted.sort_by(|a, b| b.1.cmp(a.1));

    println!("Word counts:");
    for (word, count) in sorted {
        println!("  {}: {}", word, count);
    }
}
```

---

## Key Takeaways

1. **Use `thread::spawn` to create threads**
2. **`move` closure transfers ownership to thread**
3. **Arc for shared ownership across threads**
4. **Mutex for exclusive mutable access**
5. **RwLock for multiple readers OR one writer**
6. **Send: safe to transfer between threads**
7. **Sync: safe to access from multiple threads**
8. **Atomics for lock-free operations**

---

## Homework

1. Implement a parallel merge sort
2. Create a thread-safe cache with expiration
3. Build a simple web scraper using multiple threads
4. Implement a bounded buffer with producer-consumer pattern

---

[← Previous: Day 20](day-20.md) | [Next: Day 22 - Channels →](day-22.md)
