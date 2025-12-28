# Day 25: File I/O

## Learning Objectives
- Read and write files
- Work with paths and directories
- Handle file errors gracefully
- Use buffered I/O for efficiency

---

## Reading Files

```rust
use std::fs;

fn main() -> std::io::Result<()> {
    // Read entire file to string
    let content = fs::read_to_string("example.txt")?;
    println!("Content:\n{}", content);

    // Read file to bytes
    let bytes = fs::read("example.txt")?;
    println!("Bytes: {:?}", &bytes[..20.min(bytes.len())]);

    Ok(())
}
```

---

## Writing Files

```rust
use std::fs;

fn main() -> std::io::Result<()> {
    // Write string to file (creates or overwrites)
    fs::write("output.txt", "Hello, World!")?;

    // Write bytes
    let data = vec![72, 101, 108, 108, 111];  // "Hello"
    fs::write("binary.dat", &data)?;

    println!("Files written successfully");
    Ok(())
}
```

---

## Hands-On Exercise 1: File Copy Utility

```rust
use std::fs;
use std::io::{self, Read, Write};

fn copy_file(source: &str, dest: &str) -> io::Result<u64> {
    let mut source_file = fs::File::open(source)?;
    let mut dest_file = fs::File::create(dest)?;

    let mut buffer = Vec::new();
    source_file.read_to_end(&mut buffer)?;
    dest_file.write_all(&buffer)?;

    Ok(buffer.len() as u64)
}

fn copy_file_buffered(source: &str, dest: &str) -> io::Result<u64> {
    use std::io::{BufReader, BufWriter};

    let source_file = fs::File::open(source)?;
    let dest_file = fs::File::create(dest)?;

    let mut reader = BufReader::new(source_file);
    let mut writer = BufWriter::new(dest_file);

    let mut total = 0u64;
    let mut buffer = [0u8; 8192];

    loop {
        let bytes_read = reader.read(&mut buffer)?;
        if bytes_read == 0 {
            break;
        }
        writer.write_all(&buffer[..bytes_read])?;
        total += bytes_read as u64;
    }

    writer.flush()?;
    Ok(total)
}

fn main() -> io::Result<()> {
    // Create a test file
    fs::write("source.txt", "This is the source file content.\nLine 2.\nLine 3.")?;

    // Copy it
    let bytes = copy_file_buffered("source.txt", "dest.txt")?;
    println!("Copied {} bytes", bytes);

    // Verify
    let original = fs::read_to_string("source.txt")?;
    let copied = fs::read_to_string("dest.txt")?;
    println!("Files match: {}", original == copied);

    // Cleanup
    fs::remove_file("source.txt")?;
    fs::remove_file("dest.txt")?;

    Ok(())
}
```

---

## File Handle with More Control

```rust
use std::fs::{File, OpenOptions};
use std::io::{self, Read, Write, Seek, SeekFrom};

fn main() -> io::Result<()> {
    // Open for reading
    let mut file = File::open("example.txt")?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;

    // Create new file
    let mut file = File::create("new_file.txt")?;
    file.write_all(b"New content")?;

    // Open with options
    let mut file = OpenOptions::new()
        .read(true)
        .write(true)
        .create(true)
        .append(false)
        .open("data.txt")?;

    file.write_all(b"Initial content\n")?;

    // Seek to beginning
    file.seek(SeekFrom::Start(0))?;

    let mut buffer = String::new();
    file.read_to_string(&mut buffer)?;
    println!("Content: {}", buffer);

    Ok(())
}
```

---

## Appending to Files

```rust
use std::fs::OpenOptions;
use std::io::Write;

fn main() -> std::io::Result<()> {
    // Create initial file
    std::fs::write("log.txt", "=== Log Start ===\n")?;

    // Append to file
    let mut file = OpenOptions::new()
        .append(true)
        .open("log.txt")?;

    for i in 1..=5 {
        writeln!(file, "Log entry {}", i)?;
    }

    // Read and display
    let content = std::fs::read_to_string("log.txt")?;
    println!("{}", content);

    // Cleanup
    std::fs::remove_file("log.txt")?;

    Ok(())
}
```

---

## Hands-On Exercise 2: Simple Logger

```rust
use std::fs::{File, OpenOptions};
use std::io::{self, Write, BufWriter};
use std::time::SystemTime;

struct Logger {
    writer: BufWriter<File>,
}

impl Logger {
    fn new(path: &str) -> io::Result<Self> {
        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(path)?;

        Ok(Logger {
            writer: BufWriter::new(file),
        })
    }

    fn log(&mut self, level: &str, message: &str) -> io::Result<()> {
        let timestamp = SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs();

        writeln!(self.writer, "[{}] [{}] {}", timestamp, level, message)?;
        self.writer.flush()?;
        Ok(())
    }

    fn info(&mut self, message: &str) -> io::Result<()> {
        self.log("INFO", message)
    }

    fn warn(&mut self, message: &str) -> io::Result<()> {
        self.log("WARN", message)
    }

    fn error(&mut self, message: &str) -> io::Result<()> {
        self.log("ERROR", message)
    }
}

fn main() -> io::Result<()> {
    let mut logger = Logger::new("app.log")?;

    logger.info("Application started")?;
    logger.info("Loading configuration")?;
    logger.warn("Configuration file not found, using defaults")?;
    logger.info("Processing data")?;
    logger.error("Failed to connect to database")?;
    logger.info("Application shutdown")?;

    // Display log contents
    println!("Log contents:");
    println!("{}", std::fs::read_to_string("app.log")?);

    // Cleanup
    std::fs::remove_file("app.log")?;

    Ok(())
}
```

---

## Reading Lines

```rust
use std::fs::File;
use std::io::{self, BufRead, BufReader};

fn main() -> io::Result<()> {
    // Create test file
    std::fs::write("data.txt", "Line 1\nLine 2\nLine 3\nLine 4\nLine 5")?;

    // Read lines
    let file = File::open("data.txt")?;
    let reader = BufReader::new(file);

    println!("All lines:");
    for (i, line) in reader.lines().enumerate() {
        println!("  {}: {}", i + 1, line?);
    }

    // Read with filter
    let file = File::open("data.txt")?;
    let reader = BufReader::new(file);

    println!("\nEven lines:");
    for (i, line) in reader.lines().enumerate() {
        if (i + 1) % 2 == 0 {
            println!("  {}: {}", i + 1, line?);
        }
    }

    // Cleanup
    std::fs::remove_file("data.txt")?;

    Ok(())
}
```

---

## Working with Paths

```rust
use std::path::{Path, PathBuf};

fn main() {
    // Create paths
    let path = Path::new("/home/user/documents/file.txt");

    // Path components
    println!("Full path: {:?}", path);
    println!("File name: {:?}", path.file_name());
    println!("Extension: {:?}", path.extension());
    println!("Parent: {:?}", path.parent());
    println!("Stem: {:?}", path.file_stem());

    // Check properties
    println!("Is absolute: {}", path.is_absolute());
    println!("Exists: {}", path.exists());

    // Build paths
    let mut path_buf = PathBuf::from("/home/user");
    path_buf.push("documents");
    path_buf.push("file.txt");
    println!("Built path: {:?}", path_buf);

    // Join paths
    let base = Path::new("/home/user");
    let full = base.join("documents").join("file.txt");
    println!("Joined: {:?}", full);

    // With extension
    let mut file_path = PathBuf::from("data");
    file_path.set_extension("txt");
    println!("With extension: {:?}", file_path);
}
```

---

## Hands-On Exercise 3: Directory Walker

```rust
use std::fs;
use std::path::Path;
use std::io;

fn walk_dir(path: &Path, indent: usize) -> io::Result<()> {
    if path.is_dir() {
        for entry in fs::read_dir(path)? {
            let entry = entry?;
            let path = entry.path();
            let name = entry.file_name();
            let name = name.to_string_lossy();

            let prefix = "  ".repeat(indent);

            if path.is_dir() {
                println!("{}📁 {}/", prefix, name);
                walk_dir(&path, indent + 1)?;
            } else {
                let size = entry.metadata()?.len();
                println!("{}📄 {} ({} bytes)", prefix, name, size);
            }
        }
    }
    Ok(())
}

fn find_files(dir: &Path, extension: &str) -> io::Result<Vec<std::path::PathBuf>> {
    let mut results = Vec::new();

    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_dir() {
                results.extend(find_files(&path, extension)?);
            } else if path.extension().map_or(false, |ext| ext == extension) {
                results.push(path);
            }
        }
    }

    Ok(results)
}

fn main() -> io::Result<()> {
    // Create test directory structure
    fs::create_dir_all("test_dir/subdir1")?;
    fs::create_dir_all("test_dir/subdir2")?;
    fs::write("test_dir/file1.txt", "content")?;
    fs::write("test_dir/file2.rs", "fn main() {}")?;
    fs::write("test_dir/subdir1/file3.txt", "more content")?;
    fs::write("test_dir/subdir2/file4.txt", "even more")?;

    println!("Directory tree:");
    walk_dir(Path::new("test_dir"), 0)?;

    println!("\n.txt files:");
    for file in find_files(Path::new("test_dir"), "txt")? {
        println!("  {:?}", file);
    }

    // Cleanup
    fs::remove_dir_all("test_dir")?;

    Ok(())
}
```

---

## Directory Operations

```rust
use std::fs;

fn main() -> std::io::Result<()> {
    // Create directory
    fs::create_dir("new_dir")?;

    // Create nested directories
    fs::create_dir_all("parent/child/grandchild")?;

    // Read directory
    for entry in fs::read_dir(".")? {
        let entry = entry?;
        let path = entry.path();
        let metadata = entry.metadata()?;

        let type_str = if metadata.is_dir() { "DIR" } else { "FILE" };
        println!("{}: {:?}", type_str, path.file_name().unwrap());
    }

    // Remove directory (must be empty)
    fs::remove_dir("new_dir")?;

    // Remove directory recursively
    fs::remove_dir_all("parent")?;

    // Rename/move
    fs::create_dir("old_name")?;
    fs::rename("old_name", "new_name")?;
    fs::remove_dir("new_name")?;

    Ok(())
}
```

---

## Hands-On Exercise 4: File Statistics

```rust
use std::fs;
use std::path::Path;
use std::io;
use std::collections::HashMap;

struct FileStats {
    total_files: usize,
    total_dirs: usize,
    total_size: u64,
    extensions: HashMap<String, usize>,
    largest_file: Option<(String, u64)>,
}

impl FileStats {
    fn new() -> Self {
        FileStats {
            total_files: 0,
            total_dirs: 0,
            total_size: 0,
            extensions: HashMap::new(),
            largest_file: None,
        }
    }

    fn analyze(&mut self, path: &Path) -> io::Result<()> {
        if path.is_dir() {
            self.total_dirs += 1;

            for entry in fs::read_dir(path)? {
                let entry = entry?;
                self.analyze(&entry.path())?;
            }
        } else {
            self.total_files += 1;

            let metadata = fs::metadata(path)?;
            let size = metadata.len();
            self.total_size += size;

            // Track extension
            if let Some(ext) = path.extension() {
                let ext = ext.to_string_lossy().to_string();
                *self.extensions.entry(ext).or_insert(0) += 1;
            }

            // Track largest file
            let path_str = path.to_string_lossy().to_string();
            if self.largest_file.as_ref().map_or(true, |(_, s)| size > *s) {
                self.largest_file = Some((path_str, size));
            }
        }

        Ok(())
    }

    fn report(&self) {
        println!("=== File Statistics ===");
        println!("Total directories: {}", self.total_dirs);
        println!("Total files: {}", self.total_files);
        println!("Total size: {} bytes ({:.2} KB)",
            self.total_size,
            self.total_size as f64 / 1024.0
        );

        if !self.extensions.is_empty() {
            println!("\nFiles by extension:");
            let mut sorted: Vec<_> = self.extensions.iter().collect();
            sorted.sort_by(|a, b| b.1.cmp(a.1));
            for (ext, count) in sorted {
                println!("  .{}: {}", ext, count);
            }
        }

        if let Some((path, size)) = &self.largest_file {
            println!("\nLargest file: {} ({} bytes)", path, size);
        }
    }
}

fn main() -> io::Result<()> {
    // Create test structure
    fs::create_dir_all("stats_test/sub")?;
    fs::write("stats_test/file1.txt", "Hello")?;
    fs::write("stats_test/file2.txt", "World! This is longer.")?;
    fs::write("stats_test/code.rs", "fn main() {}")?;
    fs::write("stats_test/sub/data.json", r#"{"key": "value"}"#)?;

    let mut stats = FileStats::new();
    stats.analyze(Path::new("stats_test"))?;
    stats.report();

    // Cleanup
    fs::remove_dir_all("stats_test")?;

    Ok(())
}
```

---

## Temporary Files

```rust
use std::io::{self, Write, Read};
use std::fs::File;

fn main() -> io::Result<()> {
    // Create temp file manually
    let temp_path = std::env::temp_dir().join("my_temp_file.txt");
    println!("Temp file: {:?}", temp_path);

    // Write to temp file
    let mut file = File::create(&temp_path)?;
    writeln!(file, "Temporary data")?;

    // Read it back
    let mut file = File::open(&temp_path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    println!("Content: {}", content);

    // Clean up
    std::fs::remove_file(&temp_path)?;

    Ok(())
}
```

---

## Challenge: File Sync Tool

```rust
use std::fs;
use std::path::Path;
use std::io;
use std::collections::HashSet;

fn get_files(dir: &Path) -> io::Result<HashSet<String>> {
    let mut files = HashSet::new();

    if dir.is_dir() {
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();

            if path.is_file() {
                if let Some(name) = path.file_name() {
                    files.insert(name.to_string_lossy().to_string());
                }
            }
        }
    }

    Ok(files)
}

fn sync_directories(source: &Path, dest: &Path) -> io::Result<SyncResult> {
    let mut result = SyncResult::default();

    // Ensure destination exists
    fs::create_dir_all(dest)?;

    let source_files = get_files(source)?;
    let dest_files = get_files(dest)?;

    // Copy new and updated files
    for file in &source_files {
        let src_path = source.join(file);
        let dst_path = dest.join(file);

        let should_copy = if dst_path.exists() {
            let src_modified = fs::metadata(&src_path)?.modified()?;
            let dst_modified = fs::metadata(&dst_path)?.modified()?;
            src_modified > dst_modified
        } else {
            true
        };

        if should_copy {
            fs::copy(&src_path, &dst_path)?;
            if dest_files.contains(file) {
                result.updated += 1;
                println!("Updated: {}", file);
            } else {
                result.copied += 1;
                println!("Copied: {}", file);
            }
        } else {
            result.skipped += 1;
        }
    }

    // Find files only in destination (orphans)
    for file in &dest_files {
        if !source_files.contains(file) {
            result.orphans.push(file.clone());
            println!("Orphan: {}", file);
        }
    }

    Ok(result)
}

#[derive(Default)]
struct SyncResult {
    copied: usize,
    updated: usize,
    skipped: usize,
    orphans: Vec<String>,
}

fn main() -> io::Result<()> {
    // Setup test directories
    fs::create_dir_all("source")?;
    fs::create_dir_all("dest")?;

    fs::write("source/file1.txt", "Content 1")?;
    fs::write("source/file2.txt", "Content 2")?;
    fs::write("dest/file1.txt", "Old content")?;
    fs::write("dest/orphan.txt", "Orphan file")?;

    println!("Syncing source -> dest\n");
    let result = sync_directories(Path::new("source"), Path::new("dest"))?;

    println!("\n=== Sync Summary ===");
    println!("Copied: {}", result.copied);
    println!("Updated: {}", result.updated);
    println!("Skipped: {}", result.skipped);
    println!("Orphans: {}", result.orphans.len());

    // Cleanup
    fs::remove_dir_all("source")?;
    fs::remove_dir_all("dest")?;

    Ok(())
}
```

---

## Key Takeaways

1. **`fs::read_to_string` and `fs::write` for simple operations**
2. **Use `File` and `OpenOptions` for more control**
3. **`BufReader` and `BufWriter` for efficiency**
4. **`Path` and `PathBuf` for cross-platform paths**
5. **Always handle I/O errors with `Result`**
6. **Use `?` operator for error propagation**
7. **`fs::read_dir` for directory iteration**

---

## Homework

1. Create a file search tool that finds files by name/content
2. Build a simple backup utility with compression
3. Implement a config file watcher that detects changes
4. Create a log file rotator

---

[← Previous: Day 24](day-24.md) | [Next: Day 26 - CLI Applications →](day-26.md)
