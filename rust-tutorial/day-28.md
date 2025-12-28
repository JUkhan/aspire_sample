# Day 28: Async/Await Basics

## Learning Objectives
- Understand async programming concepts
- Use async/await syntax
- Work with the tokio runtime
- Handle concurrent async operations

---

## Adding Tokio

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1.0", features = ["full"] }
```

---

## Basic Async Function

```rust
use tokio::time::{sleep, Duration};

// Async function
async fn say_hello() {
    println!("Hello");
    sleep(Duration::from_secs(1)).await;
    println!("World!");
}

async fn delayed_value(delay: u64) -> u32 {
    sleep(Duration::from_secs(delay)).await;
    42
}

#[tokio::main]
async fn main() {
    println!("Starting...");

    say_hello().await;

    let value = delayed_value(1).await;
    println!("Got value: {}", value);

    println!("Done!");
}
```

---

## Concurrent Execution

```rust
use tokio::time::{sleep, Duration, Instant};

async fn task(name: &str, delay: u64) -> String {
    println!("{} starting", name);
    sleep(Duration::from_secs(delay)).await;
    println!("{} done", name);
    format!("{} completed", name)
}

#[tokio::main]
async fn main() {
    let start = Instant::now();

    // Sequential - takes 6 seconds
    println!("=== Sequential ===");
    let a = task("Task A", 2).await;
    let b = task("Task B", 2).await;
    let c = task("Task C", 2).await;
    println!("Results: {}, {}, {}", a, b, c);
    println!("Time: {:?}\n", start.elapsed());

    let start = Instant::now();

    // Concurrent - takes 2 seconds
    println!("=== Concurrent ===");
    let (a, b, c) = tokio::join!(
        task("Task A", 2),
        task("Task B", 2),
        task("Task C", 2)
    );
    println!("Results: {}, {}, {}", a, b, c);
    println!("Time: {:?}", start.elapsed());
}
```

---

## Hands-On Exercise 1: Simulated API Calls

```rust
use tokio::time::{sleep, Duration};

async fn fetch_user(id: u32) -> Result<String, String> {
    println!("Fetching user {}...", id);
    sleep(Duration::from_millis(500)).await;

    if id == 0 {
        Err("User not found".to_string())
    } else {
        Ok(format!("User_{}", id))
    }
}

async fn fetch_posts(user: &str) -> Vec<String> {
    println!("Fetching posts for {}...", user);
    sleep(Duration::from_millis(300)).await;

    vec![
        format!("{}'s post 1", user),
        format!("{}'s post 2", user),
    ]
}

async fn fetch_comments(post: &str) -> Vec<String> {
    println!("Fetching comments for '{}'...", post);
    sleep(Duration::from_millis(200)).await;

    vec![
        format!("Comment on '{}'", post),
    ]
}

#[tokio::main]
async fn main() {
    // Sequential data fetching
    match fetch_user(1).await {
        Ok(user) => {
            let posts = fetch_posts(&user).await;
            println!("\nPosts for {}:", user);

            for post in &posts {
                let comments = fetch_comments(post).await;
                println!("  {} ({} comments)", post, comments.len());
            }
        }
        Err(e) => println!("Error: {}", e),
    }
}
```

---

## Spawning Tasks

```rust
use tokio::time::{sleep, Duration};

async fn background_task(id: u32) {
    for i in 1..=3 {
        println!("Task {}: iteration {}", id, i);
        sleep(Duration::from_millis(500)).await;
    }
    println!("Task {} completed", id);
}

#[tokio::main]
async fn main() {
    // Spawn independent tasks
    let handle1 = tokio::spawn(background_task(1));
    let handle2 = tokio::spawn(background_task(2));
    let handle3 = tokio::spawn(background_task(3));

    println!("Tasks spawned, doing other work...");
    sleep(Duration::from_secs(1)).await;
    println!("Still working...\n");

    // Wait for all tasks
    let _ = tokio::join!(handle1, handle2, handle3);

    println!("\nAll tasks completed!");
}
```

---

## Hands-On Exercise 2: Parallel Downloads Simulation

```rust
use tokio::time::{sleep, Duration, Instant};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Debug)]
struct DownloadResult {
    url: String,
    size: u64,
    duration_ms: u64,
}

async fn download(url: &str) -> DownloadResult {
    let start = Instant::now();

    // Simulate download time based on URL
    let delay = (url.len() * 100) as u64;
    sleep(Duration::from_millis(delay)).await;

    let size = (url.len() * 1024) as u64;

    DownloadResult {
        url: url.to_string(),
        size,
        duration_ms: start.elapsed().as_millis() as u64,
    }
}

#[tokio::main]
async fn main() {
    let urls = vec![
        "https://example.com/file1.zip",
        "https://example.com/file2.zip",
        "https://example.com/large-file.zip",
        "https://example.com/small.txt",
    ];

    println!("=== Sequential Downloads ===");
    let start = Instant::now();
    for url in &urls {
        let result = download(url).await;
        println!("Downloaded {} ({} bytes) in {}ms",
            result.url, result.size, result.duration_ms);
    }
    println!("Total time: {:?}\n", start.elapsed());

    println!("=== Parallel Downloads ===");
    let start = Instant::now();

    let handles: Vec<_> = urls.iter()
        .map(|url| {
            let url = url.to_string();
            tokio::spawn(async move {
                download(&url).await
            })
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }

    for result in &results {
        println!("Downloaded {} ({} bytes) in {}ms",
            result.url, result.size, result.duration_ms);
    }
    println!("Total time: {:?}", start.elapsed());

    let total_size: u64 = results.iter().map(|r| r.size).sum();
    println!("\nTotal downloaded: {} bytes", total_size);
}
```

---

## Async Channels

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    // Create a channel
    let (tx, mut rx) = mpsc::channel(32);

    // Producer
    let producer = tokio::spawn(async move {
        for i in 1..=5 {
            println!("Sending: {}", i);
            tx.send(i).await.unwrap();
            sleep(Duration::from_millis(100)).await;
        }
        println!("Producer done");
    });

    // Consumer
    let consumer = tokio::spawn(async move {
        while let Some(value) = rx.recv().await {
            println!("Received: {}", value);
        }
        println!("Consumer done");
    });

    let _ = tokio::join!(producer, consumer);
}
```

---

## Hands-On Exercise 3: Async Worker Pool

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[derive(Debug)]
struct Job {
    id: u32,
    data: String,
}

#[derive(Debug)]
struct JobResult {
    job_id: u32,
    result: String,
}

async fn worker(id: u32, mut rx: mpsc::Receiver<Job>, tx: mpsc::Sender<JobResult>) {
    while let Some(job) = rx.recv().await {
        println!("Worker {} processing job {}", id, job.id);

        // Simulate work
        sleep(Duration::from_millis(200)).await;

        let result = JobResult {
            job_id: job.id,
            result: format!("Processed: {}", job.data.to_uppercase()),
        };

        tx.send(result).await.unwrap();
    }
    println!("Worker {} shutting down", id);
}

#[tokio::main]
async fn main() {
    let num_workers = 3;
    let (job_tx, _) = mpsc::channel::<Job>(100);
    let (result_tx, mut result_rx) = mpsc::channel::<JobResult>(100);

    // Create job channels for each worker
    let mut job_txs = Vec::new();
    let mut worker_handles = Vec::new();

    for id in 0..num_workers {
        let (tx, rx) = mpsc::channel::<Job>(10);
        job_txs.push(tx);

        let result_tx = result_tx.clone();
        let handle = tokio::spawn(worker(id, rx, result_tx));
        worker_handles.push(handle);
    }

    // Drop the original result sender
    drop(result_tx);

    // Submit jobs (round-robin distribution)
    let jobs: Vec<Job> = (1..=9)
        .map(|i| Job {
            id: i,
            data: format!("job data {}", i),
        })
        .collect();

    for (i, job) in jobs.into_iter().enumerate() {
        let worker_id = i % num_workers;
        job_txs[worker_id].send(job).await.unwrap();
    }

    // Close job channels
    drop(job_txs);

    // Collect results
    let mut results = Vec::new();
    while let Some(result) = result_rx.recv().await {
        println!("Got result: {:?}", result);
        results.push(result);
    }

    // Wait for workers
    for handle in worker_handles {
        handle.await.unwrap();
    }

    println!("\nTotal results: {}", results.len());
}
```

---

## Async Mutex

```rust
use tokio::sync::Mutex;
use std::sync::Arc;
use tokio::time::{sleep, Duration};

#[tokio::main]
async fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = Vec::new();

    for i in 0..5 {
        let counter = Arc::clone(&counter);

        let handle = tokio::spawn(async move {
            for j in 0..10 {
                let mut lock = counter.lock().await;
                *lock += 1;
                println!("Task {} increment {}: count = {}", i, j, *lock);

                // Simulate some work while holding lock
                sleep(Duration::from_millis(10)).await;
            }
        });

        handles.push(handle);
    }

    for handle in handles {
        handle.await.unwrap();
    }

    let final_count = *counter.lock().await;
    println!("\nFinal count: {}", final_count);
}
```

---

## Hands-On Exercise 4: Rate Limiter

```rust
use tokio::sync::Semaphore;
use tokio::time::{sleep, Duration, Instant};
use std::sync::Arc;

struct RateLimiter {
    semaphore: Arc<Semaphore>,
    interval: Duration,
}

impl RateLimiter {
    fn new(max_concurrent: usize) -> Self {
        RateLimiter {
            semaphore: Arc::new(Semaphore::new(max_concurrent)),
            interval: Duration::from_millis(100),
        }
    }

    async fn execute<F, T>(&self, f: F) -> T
    where
        F: std::future::Future<Output = T>,
    {
        let _permit = self.semaphore.acquire().await.unwrap();

        let result = f.await;

        // Add delay before releasing
        sleep(self.interval).await;

        result
    }
}

async fn api_call(id: u32) -> String {
    println!("API call {} starting", id);
    sleep(Duration::from_millis(200)).await;
    format!("Response {}", id)
}

#[tokio::main]
async fn main() {
    let limiter = Arc::new(RateLimiter::new(2)); // Max 2 concurrent
    let start = Instant::now();

    let mut handles = Vec::new();

    for i in 1..=6 {
        let limiter = Arc::clone(&limiter);

        let handle = tokio::spawn(async move {
            let result = limiter.execute(api_call(i)).await;
            println!("Got: {}", result);
            result
        });

        handles.push(handle);
    }

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }

    println!("\nAll results: {:?}", results);
    println!("Total time: {:?}", start.elapsed());
}
```

---

## Timeouts and Select

```rust
use tokio::time::{sleep, timeout, Duration};

async fn slow_operation() -> String {
    sleep(Duration::from_secs(5)).await;
    "Slow result".to_string()
}

async fn fast_operation() -> String {
    sleep(Duration::from_millis(100)).await;
    "Fast result".to_string()
}

#[tokio::main]
async fn main() {
    // Timeout example
    println!("=== Timeout ===");
    match timeout(Duration::from_secs(1), slow_operation()).await {
        Ok(result) => println!("Got: {}", result),
        Err(_) => println!("Operation timed out!"),
    }

    // Select - first to complete wins
    println!("\n=== Select ===");
    tokio::select! {
        result = fast_operation() => {
            println!("Fast won: {}", result);
        }
        result = slow_operation() => {
            println!("Slow won: {}", result);
        }
    }

    // Select with timeout
    println!("\n=== Select with Timeout ===");
    tokio::select! {
        _ = sleep(Duration::from_millis(500)) => {
            println!("Timeout!");
        }
        result = slow_operation() => {
            println!("Got result: {}", result);
        }
    }
}
```

---

## Challenge: Async Web Scraper Simulation

```rust
use tokio::time::{sleep, Duration, Instant};
use std::collections::HashMap;

#[derive(Debug)]
struct Page {
    url: String,
    title: String,
    links: Vec<String>,
}

async fn fetch_page(url: &str) -> Result<Page, String> {
    // Simulate network latency
    let delay = (url.len() * 50) as u64;
    sleep(Duration::from_millis(delay)).await;

    // Simulate some pages failing
    if url.contains("error") {
        return Err(format!("Failed to fetch {}", url));
    }

    // Generate fake page data
    let title = format!("Title of {}", url);
    let links = vec![
        format!("{}/page1", url),
        format!("{}/page2", url),
    ];

    Ok(Page { url: url.to_string(), title, links })
}

async fn crawl(start_url: &str, max_depth: u32) -> HashMap<String, Page> {
    let mut visited = HashMap::new();
    let mut to_visit = vec![(start_url.to_string(), 0u32)];

    while let Some((url, depth)) = to_visit.pop() {
        if depth > max_depth || visited.contains_key(&url) {
            continue;
        }

        println!("Fetching {} (depth {})", url, depth);

        match fetch_page(&url).await {
            Ok(page) => {
                // Add links to visit
                for link in &page.links {
                    if !visited.contains_key(link) {
                        to_visit.push((link.clone(), depth + 1));
                    }
                }
                visited.insert(url, page);
            }
            Err(e) => {
                println!("  Error: {}", e);
            }
        }
    }

    visited
}

async fn parallel_crawl(urls: Vec<&str>) -> Vec<Result<Page, String>> {
    let handles: Vec<_> = urls.into_iter()
        .map(|url| {
            let url = url.to_string();
            tokio::spawn(async move {
                fetch_page(&url).await
            })
        })
        .collect();

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }

    results
}

#[tokio::main]
async fn main() {
    let start = Instant::now();

    println!("=== Sequential Crawl ===");
    let pages = crawl("https://example.com", 1).await;
    println!("Crawled {} pages in {:?}\n", pages.len(), start.elapsed());

    let start = Instant::now();

    println!("=== Parallel Fetch ===");
    let urls = vec![
        "https://site1.com",
        "https://site2.com",
        "https://site3.com",
        "https://error.com",
        "https://site4.com",
    ];

    let results = parallel_crawl(urls).await;
    for result in &results {
        match result {
            Ok(page) => println!("OK: {}", page.title),
            Err(e) => println!("Error: {}", e),
        }
    }
    println!("Fetched {} pages in {:?}", results.len(), start.elapsed());
}
```

---

## Key Takeaways

1. **`async fn` defines an asynchronous function**
2. **`.await` suspends execution until ready**
3. **`tokio::join!` runs futures concurrently**
4. **`tokio::spawn` creates independent tasks**
5. **Use `mpsc` channels for async communication**
6. **`tokio::sync::Mutex` for async-safe locking**
7. **`tokio::select!` races multiple futures**

---

## Homework

1. Build an async HTTP client with retry logic
2. Create a parallel file processor
3. Implement an async task scheduler
4. Build a simple async chat server

---

[← Previous: Day 27](day-27.md) | [Next: Day 29 - Mini Project Part 1 →](day-29.md)
