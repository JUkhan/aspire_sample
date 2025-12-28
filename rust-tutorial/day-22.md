# Day 22: Channels for Message Passing

## Learning Objectives
- Use channels for thread communication
- Understand mpsc (multiple producer, single consumer)
- Send complex data between threads
- Build concurrent pipelines

---

## Basic Channels

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Create a channel
    let (tx, rx) = mpsc::channel();

    // Spawn a thread that sends a message
    thread::spawn(move || {
        let message = String::from("Hello from thread!");
        tx.send(message).unwrap();
        println!("Sent message");
    });

    // Receive in main thread
    let received = rx.recv().unwrap();
    println!("Received: {}", received);
}
```

---

## Sending Multiple Messages

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec![
            "Hello",
            "from",
            "the",
            "thread",
        ];

        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(Duration::from_millis(200));
        }
    });

    // Receive all messages
    for received in rx {
        println!("Got: {}", received);
    }
}
```

---

## Hands-On Exercise 1: Producer-Consumer

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[derive(Debug)]
struct Task {
    id: u32,
    data: String,
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // Producer thread
    let producer = thread::spawn(move || {
        for i in 1..=5 {
            let task = Task {
                id: i,
                data: format!("Task data {}", i),
            };
            println!("Producing: {:?}", task);
            tx.send(task).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
        println!("Producer done");
    });

    // Consumer in main thread
    let consumer = thread::spawn(move || {
        for task in rx {
            println!("Consuming: {:?}", task);
            // Simulate work
            thread::sleep(Duration::from_millis(150));
            println!("Completed task {}", task.id);
        }
        println!("Consumer done");
    });

    producer.join().unwrap();
    consumer.join().unwrap();
}
```

---

## Multiple Producers

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Clone transmitter for multiple producers
    let tx1 = tx.clone();
    let tx2 = tx.clone();
    let tx3 = tx;  // Move original

    let handle1 = thread::spawn(move || {
        for i in 0..3 {
            tx1.send(format!("Producer 1: message {}", i)).unwrap();
        }
    });

    let handle2 = thread::spawn(move || {
        for i in 0..3 {
            tx2.send(format!("Producer 2: message {}", i)).unwrap();
        }
    });

    let handle3 = thread::spawn(move || {
        for i in 0..3 {
            tx3.send(format!("Producer 3: message {}", i)).unwrap();
        }
    });

    // Wait for all producers
    handle1.join().unwrap();
    handle2.join().unwrap();
    handle3.join().unwrap();

    // Drop happens, channel closes

    // Receive all messages
    for msg in rx {
        println!("Received: {}", msg);
    }
}
```

---

## Hands-On Exercise 2: Log Aggregator

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[derive(Debug)]
enum LogLevel {
    Info,
    Warning,
    Error,
}

#[derive(Debug)]
struct LogMessage {
    level: LogLevel,
    source: String,
    message: String,
}

fn main() {
    let (tx, rx) = mpsc::channel();

    // Service 1
    let tx1 = tx.clone();
    thread::spawn(move || {
        for i in 0..3 {
            tx1.send(LogMessage {
                level: LogLevel::Info,
                source: "Service1".to_string(),
                message: format!("Processing item {}", i),
            }).unwrap();
            thread::sleep(Duration::from_millis(50));
        }
    });

    // Service 2
    let tx2 = tx.clone();
    thread::spawn(move || {
        tx2.send(LogMessage {
            level: LogLevel::Warning,
            source: "Service2".to_string(),
            message: "Low memory warning".to_string(),
        }).unwrap();

        thread::sleep(Duration::from_millis(100));

        tx2.send(LogMessage {
            level: LogLevel::Error,
            source: "Service2".to_string(),
            message: "Connection failed".to_string(),
        }).unwrap();
    });

    // Service 3
    thread::spawn(move || {
        for i in 0..2 {
            tx.send(LogMessage {
                level: LogLevel::Info,
                source: "Service3".to_string(),
                message: format!("Health check {}", i),
            }).unwrap();
            thread::sleep(Duration::from_millis(75));
        }
    });

    // Log aggregator
    let mut info_count = 0;
    let mut warning_count = 0;
    let mut error_count = 0;

    for log in rx {
        let level_str = match log.level {
            LogLevel::Info => { info_count += 1; "INFO" }
            LogLevel::Warning => { warning_count += 1; "WARN" }
            LogLevel::Error => { error_count += 1; "ERROR" }
        };
        println!("[{}] {}: {}", level_str, log.source, log.message);
    }

    println!("\n--- Summary ---");
    println!("Info: {}, Warnings: {}, Errors: {}", info_count, warning_count, error_count);
}
```

---

## Synchronous Channels

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // sync_channel has a fixed buffer size
    let (tx, rx) = mpsc::sync_channel(2);  // Buffer of 2

    thread::spawn(move || {
        for i in 0..5 {
            println!("Sending {}", i);
            tx.send(i).unwrap();  // Blocks when buffer is full
            println!("Sent {}", i);
        }
    });

    for received in rx {
        println!("Received: {}", received);
        thread::sleep(std::time::Duration::from_millis(500));
    }
}
```

---

## Hands-On Exercise 3: Pipeline Processing

```rust
use std::sync::mpsc;
use std::thread;

fn main() {
    // Stage 1: Generate numbers
    let (tx1, rx1) = mpsc::channel();

    // Stage 2: Square numbers
    let (tx2, rx2) = mpsc::channel();

    // Stage 3: Filter even
    let (tx3, rx3) = mpsc::channel();

    // Generator
    thread::spawn(move || {
        for i in 1..=10 {
            tx1.send(i).unwrap();
        }
    });

    // Squarer
    thread::spawn(move || {
        for num in rx1 {
            let squared = num * num;
            tx2.send((num, squared)).unwrap();
        }
    });

    // Filter
    thread::spawn(move || {
        for (original, squared) in rx2 {
            if squared % 2 == 0 {
                tx3.send((original, squared)).unwrap();
            }
        }
    });

    // Consumer
    println!("Even squares:");
    for (original, squared) in rx3 {
        println!("  {}² = {}", original, squared);
    }
}
```

---

## Non-Blocking Receive

```rust
use std::sync::mpsc::{self, TryRecvError};
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        thread::sleep(Duration::from_millis(500));
        tx.send("Hello!").unwrap();
    });

    // Non-blocking receive
    loop {
        match rx.try_recv() {
            Ok(msg) => {
                println!("Received: {}", msg);
                break;
            }
            Err(TryRecvError::Empty) => {
                println!("No message yet, doing other work...");
                thread::sleep(Duration::from_millis(100));
            }
            Err(TryRecvError::Disconnected) => {
                println!("Channel closed!");
                break;
            }
        }
    }
}
```

---

## Hands-On Exercise 4: Worker Pool

```rust
use std::sync::mpsc;
use std::thread;

enum Message {
    Work(u32),
    Terminate,
}

fn main() {
    let num_workers = 4;
    let (tx, rx) = mpsc::channel();
    let rx = std::sync::Arc::new(std::sync::Mutex::new(rx));
    let mut handles = vec![];

    // Create workers
    for id in 0..num_workers {
        let rx = std::sync::Arc::clone(&rx);

        let handle = thread::spawn(move || {
            loop {
                let msg = {
                    let rx = rx.lock().unwrap();
                    rx.recv()
                };

                match msg {
                    Ok(Message::Work(n)) => {
                        println!("Worker {}: processing task {}", id, n);
                        // Simulate work
                        thread::sleep(std::time::Duration::from_millis(100));
                        println!("Worker {}: completed task {}", id, n);
                    }
                    Ok(Message::Terminate) => {
                        println!("Worker {}: terminating", id);
                        break;
                    }
                    Err(_) => {
                        println!("Worker {}: channel closed", id);
                        break;
                    }
                }
            }
        });

        handles.push(handle);
    }

    // Send work
    for i in 0..10 {
        tx.send(Message::Work(i)).unwrap();
    }

    // Send terminate signals
    for _ in 0..num_workers {
        tx.send(Message::Terminate).unwrap();
    }

    // Wait for workers
    for handle in handles {
        handle.join().unwrap();
    }

    println!("All workers finished");
}
```

---

## Timeout Receive

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        thread::sleep(Duration::from_millis(300));
        tx.send("Message arrived!").unwrap();
    });

    // Try with short timeout
    match rx.recv_timeout(Duration::from_millis(100)) {
        Ok(msg) => println!("Received: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("Timeout - no message"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("Disconnected"),
    }

    // Try with longer timeout
    match rx.recv_timeout(Duration::from_millis(500)) {
        Ok(msg) => println!("Received: {}", msg),
        Err(mpsc::RecvTimeoutError::Timeout) => println!("Timeout"),
        Err(mpsc::RecvTimeoutError::Disconnected) => println!("Disconnected"),
    }
}
```

---

## Hands-On Exercise 5: Request-Response Pattern

```rust
use std::sync::mpsc;
use std::thread;
use std::collections::HashMap;

struct Request {
    id: u32,
    query: String,
    response_tx: mpsc::Sender<Response>,
}

struct Response {
    id: u32,
    result: String,
}

fn main() {
    let (request_tx, request_rx) = mpsc::channel::<Request>();

    // Server thread
    let server = thread::spawn(move || {
        let mut database = HashMap::new();
        database.insert("name", "Alice");
        database.insert("age", "30");
        database.insert("city", "New York");

        for request in request_rx {
            println!("Server: processing request {} for '{}'", request.id, request.query);

            let result = database
                .get(request.query.as_str())
                .map(|s| s.to_string())
                .unwrap_or_else(|| "Not found".to_string());

            request.response_tx.send(Response {
                id: request.id,
                result,
            }).unwrap();
        }

        println!("Server: shutting down");
    });

    // Client requests
    let queries = vec!["name", "age", "unknown", "city"];

    for (id, query) in queries.iter().enumerate() {
        let (response_tx, response_rx) = mpsc::channel();

        request_tx.send(Request {
            id: id as u32,
            query: query.to_string(),
            response_tx,
        }).unwrap();

        let response = response_rx.recv().unwrap();
        println!("Client: got response for '{}': {}", query, response.result);
    }

    // Close the channel
    drop(request_tx);

    server.join().unwrap();
}
```

---

## Select-like Pattern

```rust
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

fn main() {
    let (tx1, rx1) = mpsc::channel();
    let (tx2, rx2) = mpsc::channel();

    // Fast producer
    thread::spawn(move || {
        for i in 0..5 {
            tx1.send(format!("Fast: {}", i)).unwrap();
            thread::sleep(Duration::from_millis(100));
        }
    });

    // Slow producer
    thread::spawn(move || {
        for i in 0..3 {
            tx2.send(format!("Slow: {}", i)).unwrap();
            thread::sleep(Duration::from_millis(250));
        }
    });

    // Receive from both (simple polling)
    let mut done1 = false;
    let mut done2 = false;

    while !done1 || !done2 {
        if !done1 {
            match rx1.try_recv() {
                Ok(msg) => println!("Received: {}", msg),
                Err(mpsc::TryRecvError::Empty) => {}
                Err(mpsc::TryRecvError::Disconnected) => done1 = true,
            }
        }

        if !done2 {
            match rx2.try_recv() {
                Ok(msg) => println!("Received: {}", msg),
                Err(mpsc::TryRecvError::Empty) => {}
                Err(mpsc::TryRecvError::Disconnected) => done2 = true,
            }
        }

        thread::sleep(Duration::from_millis(10));
    }

    println!("All done!");
}
```

---

## Challenge: Chat System

```rust
use std::sync::mpsc;
use std::thread;
use std::collections::HashMap;

#[derive(Clone, Debug)]
struct ChatMessage {
    from: String,
    to: Option<String>,  // None = broadcast
    content: String,
}

fn main() {
    let (server_tx, server_rx) = mpsc::channel();
    let mut client_senders: HashMap<String, mpsc::Sender<ChatMessage>> = HashMap::new();
    let mut handles = vec![];

    // Create clients
    for name in &["Alice", "Bob", "Charlie"] {
        let (tx, rx) = mpsc::channel();
        client_senders.insert(name.to_string(), tx);

        let name = name.to_string();
        let handle = thread::spawn(move || {
            println!("[{}] Connected", name);
            for msg in rx {
                if msg.to.as_ref().map_or(true, |to| to == &name) {
                    println!("[{}] From {}: {}", name, msg.from, msg.content);
                }
            }
            println!("[{}] Disconnected", name);
        });
        handles.push(handle);
    }

    // Server
    let clients = client_senders.clone();
    let server = thread::spawn(move || {
        for msg in server_rx {
            println!("[Server] Routing: {:?}", msg);

            match &msg.to {
                Some(to) => {
                    if let Some(tx) = clients.get(to) {
                        tx.send(msg).ok();
                    }
                }
                None => {
                    for (name, tx) in &clients {
                        if name != &msg.from {
                            tx.send(msg.clone()).ok();
                        }
                    }
                }
            }
        }
    });

    // Simulate messages
    server_tx.send(ChatMessage {
        from: "Alice".to_string(),
        to: None,
        content: "Hello everyone!".to_string(),
    }).unwrap();

    server_tx.send(ChatMessage {
        from: "Bob".to_string(),
        to: Some("Alice".to_string()),
        content: "Hi Alice!".to_string(),
    }).unwrap();

    server_tx.send(ChatMessage {
        from: "Charlie".to_string(),
        to: None,
        content: "Good morning!".to_string(),
    }).unwrap();

    thread::sleep(std::time::Duration::from_millis(100));

    // Cleanup
    drop(server_tx);
    drop(client_senders);
    server.join().unwrap();
    for handle in handles {
        handle.join().unwrap();
    }
}
```

---

## Key Takeaways

1. **Channels provide safe message passing between threads**
2. **mpsc: multiple producers, single consumer**
3. **Clone `tx` for multiple producers**
4. **`recv()` blocks, `try_recv()` is non-blocking**
5. **`sync_channel` has bounded buffer**
6. **Channel closes when all senders are dropped**
7. **Use channels for decoupled, concurrent systems**

---

## Homework

1. Implement a pub/sub system with multiple topics
2. Create a concurrent task executor with priority
3. Build a rate limiter using channels
4. Implement a fan-out pattern for parallel processing

---

[← Previous: Day 21](day-21.md) | [Next: Day 23 - Testing →](day-23.md)
