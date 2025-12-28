# Day 26: Command Line Applications

## Learning Objectives
- Parse command line arguments
- Build interactive CLI tools
- Handle user input and output
- Create helpful CLI interfaces

---

## Basic Argument Parsing

```rust
use std::env;

fn main() {
    // Get all arguments
    let args: Vec<String> = env::args().collect();

    println!("Program: {}", args[0]);
    println!("Arguments: {:?}", &args[1..]);

    // Check argument count
    if args.len() < 2 {
        println!("Usage: {} <name>", args[0]);
        return;
    }

    println!("Hello, {}!", args[1]);
}
```

---

## Hands-On Exercise 1: Simple Calculator CLI

```rust
use std::env;

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() != 4 {
        eprintln!("Usage: {} <num1> <operator> <num2>", args[0]);
        eprintln!("Operators: + - * /");
        std::process::exit(1);
    }

    let num1: f64 = match args[1].parse() {
        Ok(n) => n,
        Err(_) => {
            eprintln!("Error: '{}' is not a valid number", args[1]);
            std::process::exit(1);
        }
    };

    let num2: f64 = match args[3].parse() {
        Ok(n) => n,
        Err(_) => {
            eprintln!("Error: '{}' is not a valid number", args[3]);
            std::process::exit(1);
        }
    };

    let operator = &args[2];

    let result = match operator.as_str() {
        "+" => num1 + num2,
        "-" => num1 - num2,
        "*" => num1 * num2,
        "/" => {
            if num2 == 0.0 {
                eprintln!("Error: Division by zero");
                std::process::exit(1);
            }
            num1 / num2
        }
        _ => {
            eprintln!("Error: Unknown operator '{}'", operator);
            std::process::exit(1);
        }
    };

    println!("{} {} {} = {}", num1, operator, num2, result);
}
```

---

## Reading User Input

```rust
use std::io::{self, Write};

fn read_line(prompt: &str) -> io::Result<String> {
    print!("{}", prompt);
    io::stdout().flush()?;

    let mut input = String::new();
    io::stdin().read_line(&mut input)?;
    Ok(input.trim().to_string())
}

fn read_number(prompt: &str) -> io::Result<f64> {
    loop {
        let input = read_line(prompt)?;
        match input.parse() {
            Ok(n) => return Ok(n),
            Err(_) => println!("Invalid number, please try again."),
        }
    }
}

fn main() -> io::Result<()> {
    let name = read_line("Enter your name: ")?;
    println!("Hello, {}!", name);

    let age = read_number("Enter your age: ")?;
    println!("You are {} years old.", age);

    Ok(())
}
```

---

## Hands-On Exercise 2: Interactive Menu

```rust
use std::io::{self, Write};

fn print_menu() {
    println!("\n=== Task Manager ===");
    println!("1. Add task");
    println!("2. List tasks");
    println!("3. Complete task");
    println!("4. Remove task");
    println!("5. Exit");
    print!("Choose option: ");
    io::stdout().flush().unwrap();
}

fn read_input() -> String {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    input.trim().to_string()
}

struct Task {
    id: usize,
    description: String,
    completed: bool,
}

struct TaskManager {
    tasks: Vec<Task>,
    next_id: usize,
}

impl TaskManager {
    fn new() -> Self {
        TaskManager {
            tasks: Vec::new(),
            next_id: 1,
        }
    }

    fn add(&mut self, description: String) {
        let task = Task {
            id: self.next_id,
            description,
            completed: false,
        };
        println!("Added task #{}", self.next_id);
        self.tasks.push(task);
        self.next_id += 1;
    }

    fn list(&self) {
        if self.tasks.is_empty() {
            println!("No tasks.");
            return;
        }

        println!("\nTasks:");
        for task in &self.tasks {
            let status = if task.completed { "✓" } else { " " };
            println!("  [{}] #{}: {}", status, task.id, task.description);
        }
    }

    fn complete(&mut self, id: usize) {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == id) {
            task.completed = true;
            println!("Completed task #{}", id);
        } else {
            println!("Task #{} not found", id);
        }
    }

    fn remove(&mut self, id: usize) {
        if let Some(pos) = self.tasks.iter().position(|t| t.id == id) {
            self.tasks.remove(pos);
            println!("Removed task #{}", id);
        } else {
            println!("Task #{} not found", id);
        }
    }
}

fn main() {
    let mut manager = TaskManager::new();

    loop {
        print_menu();
        let choice = read_input();

        match choice.as_str() {
            "1" => {
                print!("Enter task description: ");
                io::stdout().flush().unwrap();
                let desc = read_input();
                if !desc.is_empty() {
                    manager.add(desc);
                }
            }
            "2" => manager.list(),
            "3" => {
                print!("Enter task ID to complete: ");
                io::stdout().flush().unwrap();
                if let Ok(id) = read_input().parse() {
                    manager.complete(id);
                }
            }
            "4" => {
                print!("Enter task ID to remove: ");
                io::stdout().flush().unwrap();
                if let Ok(id) = read_input().parse() {
                    manager.remove(id);
                }
            }
            "5" => {
                println!("Goodbye!");
                break;
            }
            _ => println!("Invalid option"),
        }
    }
}
```

---

## Argument Parsing with Pattern Matching

```rust
use std::env;
use std::collections::HashMap;

#[derive(Debug)]
struct Args {
    command: String,
    flags: HashMap<String, bool>,
    options: HashMap<String, String>,
    positional: Vec<String>,
}

impl Args {
    fn parse() -> Self {
        let args: Vec<String> = env::args().skip(1).collect();
        let mut result = Args {
            command: String::new(),
            flags: HashMap::new(),
            options: HashMap::new(),
            positional: Vec::new(),
        };

        let mut i = 0;
        while i < args.len() {
            let arg = &args[i];

            if arg.starts_with("--") {
                let key = arg.trim_start_matches("--");
                if let Some(eq_pos) = key.find('=') {
                    // --key=value
                    let (k, v) = key.split_at(eq_pos);
                    result.options.insert(k.to_string(), v[1..].to_string());
                } else if i + 1 < args.len() && !args[i + 1].starts_with("-") {
                    // --key value
                    result.options.insert(key.to_string(), args[i + 1].clone());
                    i += 1;
                } else {
                    // --flag
                    result.flags.insert(key.to_string(), true);
                }
            } else if arg.starts_with("-") {
                // -f (short flag)
                for c in arg.chars().skip(1) {
                    result.flags.insert(c.to_string(), true);
                }
            } else if result.command.is_empty() {
                result.command = arg.clone();
            } else {
                result.positional.push(arg.clone());
            }

            i += 1;
        }

        result
    }

    fn has_flag(&self, name: &str) -> bool {
        self.flags.get(name).copied().unwrap_or(false)
    }

    fn get_option(&self, name: &str) -> Option<&String> {
        self.options.get(name)
    }
}

fn main() {
    let args = Args::parse();
    println!("Parsed arguments: {:?}", args);

    match args.command.as_str() {
        "help" => {
            println!("Usage: program <command> [options]");
            println!("Commands: help, greet, calc");
        }
        "greet" => {
            let name = args.get_option("name").map(|s| s.as_str()).unwrap_or("World");
            let loud = args.has_flag("loud") || args.has_flag("l");

            let greeting = format!("Hello, {}!", name);
            if loud {
                println!("{}", greeting.to_uppercase());
            } else {
                println!("{}", greeting);
            }
        }
        "" => println!("No command specified. Use 'help' for usage."),
        cmd => println!("Unknown command: {}", cmd),
    }
}
```

---

## Hands-On Exercise 3: File Utility CLI

```rust
use std::env;
use std::fs;
use std::path::Path;
use std::io::{self, Write};

fn print_help() {
    println!("File Utility CLI");
    println!();
    println!("Usage: fileutil <command> [args]");
    println!();
    println!("Commands:");
    println!("  ls <dir>         List directory contents");
    println!("  cat <file>       Display file contents");
    println!("  cp <src> <dst>   Copy file");
    println!("  mv <src> <dst>   Move/rename file");
    println!("  rm <file>        Remove file");
    println!("  mkdir <dir>      Create directory");
    println!("  size <path>      Show size");
    println!("  help             Show this help");
}

fn cmd_ls(path: &str) -> io::Result<()> {
    let dir = Path::new(path);
    if !dir.is_dir() {
        return Err(io::Error::new(io::ErrorKind::NotFound, "Not a directory"));
    }

    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let file_type = if entry.path().is_dir() { "d" } else { "-" };
        let size = entry.metadata()?.len();
        let name = entry.file_name().to_string_lossy().to_string();

        println!("{} {:>10} {}", file_type, size, name);
    }

    Ok(())
}

fn cmd_cat(path: &str) -> io::Result<()> {
    let content = fs::read_to_string(path)?;
    print!("{}", content);
    Ok(())
}

fn cmd_cp(src: &str, dst: &str) -> io::Result<()> {
    fs::copy(src, dst)?;
    println!("Copied {} -> {}", src, dst);
    Ok(())
}

fn cmd_mv(src: &str, dst: &str) -> io::Result<()> {
    fs::rename(src, dst)?;
    println!("Moved {} -> {}", src, dst);
    Ok(())
}

fn cmd_rm(path: &str) -> io::Result<()> {
    print!("Remove {}? [y/N] ", path);
    io::stdout().flush()?;

    let mut input = String::new();
    io::stdin().read_line(&mut input)?;

    if input.trim().to_lowercase() == "y" {
        if Path::new(path).is_dir() {
            fs::remove_dir_all(path)?;
        } else {
            fs::remove_file(path)?;
        }
        println!("Removed {}", path);
    } else {
        println!("Cancelled");
    }

    Ok(())
}

fn cmd_mkdir(path: &str) -> io::Result<()> {
    fs::create_dir_all(path)?;
    println!("Created directory {}", path);
    Ok(())
}

fn cmd_size(path: &str) -> io::Result<()> {
    fn dir_size(path: &Path) -> io::Result<u64> {
        let mut size = 0;
        if path.is_dir() {
            for entry in fs::read_dir(path)? {
                let entry = entry?;
                size += dir_size(&entry.path())?;
            }
        } else {
            size = fs::metadata(path)?.len();
        }
        Ok(size)
    }

    let size = dir_size(Path::new(path))?;
    println!("{}: {} bytes ({:.2} KB)", path, size, size as f64 / 1024.0);
    Ok(())
}

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_help();
        return;
    }

    let result = match args[1].as_str() {
        "help" | "-h" | "--help" => {
            print_help();
            Ok(())
        }
        "ls" => {
            let path = args.get(2).map(|s| s.as_str()).unwrap_or(".");
            cmd_ls(path)
        }
        "cat" => {
            if args.len() < 3 {
                Err(io::Error::new(io::ErrorKind::InvalidInput, "Missing file argument"))
            } else {
                cmd_cat(&args[2])
            }
        }
        "cp" => {
            if args.len() < 4 {
                Err(io::Error::new(io::ErrorKind::InvalidInput, "Missing src and dst"))
            } else {
                cmd_cp(&args[2], &args[3])
            }
        }
        "mv" => {
            if args.len() < 4 {
                Err(io::Error::new(io::ErrorKind::InvalidInput, "Missing src and dst"))
            } else {
                cmd_mv(&args[2], &args[3])
            }
        }
        "rm" => {
            if args.len() < 3 {
                Err(io::Error::new(io::ErrorKind::InvalidInput, "Missing path"))
            } else {
                cmd_rm(&args[2])
            }
        }
        "mkdir" => {
            if args.len() < 3 {
                Err(io::Error::new(io::ErrorKind::InvalidInput, "Missing path"))
            } else {
                cmd_mkdir(&args[2])
            }
        }
        "size" => {
            let path = args.get(2).map(|s| s.as_str()).unwrap_or(".");
            cmd_size(path)
        }
        cmd => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            format!("Unknown command: {}", cmd),
        )),
    };

    if let Err(e) = result {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
```

---

## Progress Indicators

```rust
use std::io::{self, Write};
use std::thread;
use std::time::Duration;

fn print_progress(current: usize, total: usize, width: usize) {
    let percent = (current as f64 / total as f64 * 100.0) as usize;
    let filled = (current as f64 / total as f64 * width as f64) as usize;
    let empty = width - filled;

    print!("\r[{}{}] {:>3}%",
        "█".repeat(filled),
        "░".repeat(empty),
        percent
    );
    io::stdout().flush().unwrap();
}

fn spinner(message: &str, duration_ms: u64) {
    let frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let iterations = duration_ms / 100;

    for i in 0..iterations {
        print!("\r{} {}", frames[i as usize % frames.len()], message);
        io::stdout().flush().unwrap();
        thread::sleep(Duration::from_millis(100));
    }
    println!("\r✓ {}", message);
}

fn main() {
    println!("Progress bar demo:");
    for i in 0..=100 {
        print_progress(i, 100, 40);
        thread::sleep(Duration::from_millis(30));
    }
    println!();

    println!("\nSpinner demo:");
    spinner("Loading...", 2000);
    spinner("Processing...", 1500);
    spinner("Finishing...", 1000);

    println!("\nDone!");
}
```

---

## Hands-On Exercise 4: Password Generator CLI

```rust
use std::env;

struct PasswordConfig {
    length: usize,
    uppercase: bool,
    lowercase: bool,
    numbers: bool,
    symbols: bool,
    count: usize,
}

impl Default for PasswordConfig {
    fn default() -> Self {
        PasswordConfig {
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: false,
            count: 1,
        }
    }
}

fn generate_password(config: &PasswordConfig) -> String {
    use std::collections::HashSet;

    let mut charset = String::new();

    if config.uppercase {
        charset.push_str("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
    }
    if config.lowercase {
        charset.push_str("abcdefghijklmnopqrstuvwxyz");
    }
    if config.numbers {
        charset.push_str("0123456789");
    }
    if config.symbols {
        charset.push_str("!@#$%^&*()_+-=[]{}|;:,.<>?");
    }

    if charset.is_empty() {
        return String::from("Error: No character set selected");
    }

    let chars: Vec<char> = charset.chars().collect();

    // Simple random using time
    let seed = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_nanos();

    let mut password = String::new();
    let mut current = seed;

    for _ in 0..config.length {
        current = current.wrapping_mul(6364136223846793005).wrapping_add(1);
        let index = (current as usize) % chars.len();
        password.push(chars[index]);
    }

    password
}

fn print_help() {
    println!("Password Generator");
    println!();
    println!("Usage: passgen [options]");
    println!();
    println!("Options:");
    println!("  -l, --length <n>   Password length (default: 16)");
    println!("  -c, --count <n>    Number of passwords (default: 1)");
    println!("  --no-upper         Exclude uppercase letters");
    println!("  --no-lower         Exclude lowercase letters");
    println!("  --no-numbers       Exclude numbers");
    println!("  --symbols          Include symbols");
    println!("  -h, --help         Show this help");
}

fn main() {
    let args: Vec<String> = env::args().skip(1).collect();
    let mut config = PasswordConfig::default();

    let mut i = 0;
    while i < args.len() {
        match args[i].as_str() {
            "-h" | "--help" => {
                print_help();
                return;
            }
            "-l" | "--length" => {
                i += 1;
                if i < args.len() {
                    config.length = args[i].parse().unwrap_or(16);
                }
            }
            "-c" | "--count" => {
                i += 1;
                if i < args.len() {
                    config.count = args[i].parse().unwrap_or(1);
                }
            }
            "--no-upper" => config.uppercase = false,
            "--no-lower" => config.lowercase = false,
            "--no-numbers" => config.numbers = false,
            "--symbols" => config.symbols = true,
            _ => {
                eprintln!("Unknown option: {}", args[i]);
                std::process::exit(1);
            }
        }
        i += 1;
    }

    for i in 0..config.count {
        let password = generate_password(&config);
        if config.count > 1 {
            println!("{}: {}", i + 1, password);
        } else {
            println!("{}", password);
        }
    }
}
```

---

## Environment Variables

```rust
use std::env;

fn main() {
    // Get single variable
    match env::var("HOME") {
        Ok(val) => println!("HOME: {}", val),
        Err(_) => println!("HOME not set"),
    }

    // Get with default
    let editor = env::var("EDITOR").unwrap_or_else(|_| "vim".to_string());
    println!("EDITOR: {}", editor);

    // Check if set
    if env::var("DEBUG").is_ok() {
        println!("Debug mode enabled");
    }

    // List all environment variables
    println!("\nAll environment variables:");
    for (key, value) in env::vars().take(5) {
        println!("  {} = {}", key, value);
    }
    println!("  ... and more");

    // Current working directory
    println!("\nCurrent dir: {:?}", env::current_dir().unwrap());

    // Executable path
    println!("Executable: {:?}", env::current_exe().unwrap());
}
```

---

## Key Takeaways

1. **Use `std::env::args()` for command line arguments**
2. **`io::stdin().read_line()` for user input**
3. **Return non-zero exit codes for errors**
4. **Provide helpful error messages and usage info**
5. **Use progress indicators for long operations**
6. **Handle environment variables with `env::var()`**
7. **Flush stdout when printing without newline**

---

## Homework

1. Create a file renaming utility with pattern matching
2. Build a simple HTTP client CLI
3. Implement a text search tool like grep
4. Create a countdown timer with notifications

---

[← Previous: Day 25](day-25.md) | [Next: Day 27 - Working with JSON →](day-27.md)
