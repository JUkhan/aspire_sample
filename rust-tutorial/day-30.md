# Day 30: Mini Project - Task Manager CLI (Part 2)

## Learning Objectives
- Add command-line argument support
- Implement data export features
- Add batch operations
- Polish the application

---

## Enhanced Features

Today we'll add:
1. Command-line arguments for quick actions
2. Export to CSV and Markdown
3. Batch operations
4. Improved display formatting
5. Configuration file support

---

## Updated Cargo.toml

```toml
[package]
name = "task_manager"
version = "0.2.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
dirs = "5.0"
```

---

## Command-Line Arguments (src/args.rs)

```rust
use std::env;

#[derive(Debug)]
pub enum Command {
    Interactive,
    Add { title: String },
    List { filter: Option<String> },
    Complete { id: u32 },
    Delete { id: u32 },
    Search { query: String },
    Export { format: String, output: Option<String> },
    Stats,
    Help,
    Version,
}

pub fn parse_args() -> Command {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.is_empty() {
        return Command::Interactive;
    }

    match args[0].as_str() {
        "add" | "a" => {
            if args.len() < 2 {
                eprintln!("Usage: task add <title>");
                std::process::exit(1);
            }
            Command::Add {
                title: args[1..].join(" "),
            }
        }
        "list" | "ls" | "l" => {
            Command::List {
                filter: args.get(1).cloned(),
            }
        }
        "complete" | "done" | "c" => {
            if args.len() < 2 {
                eprintln!("Usage: task complete <id>");
                std::process::exit(1);
            }
            let id = args[1].parse().unwrap_or_else(|_| {
                eprintln!("Invalid task ID");
                std::process::exit(1);
            });
            Command::Complete { id }
        }
        "delete" | "rm" | "d" => {
            if args.len() < 2 {
                eprintln!("Usage: task delete <id>");
                std::process::exit(1);
            }
            let id = args[1].parse().unwrap_or_else(|_| {
                eprintln!("Invalid task ID");
                std::process::exit(1);
            });
            Command::Delete { id }
        }
        "search" | "s" => {
            if args.len() < 2 {
                eprintln!("Usage: task search <query>");
                std::process::exit(1);
            }
            Command::Search {
                query: args[1..].join(" "),
            }
        }
        "export" | "e" => {
            let format = args.get(1).cloned().unwrap_or_else(|| "json".to_string());
            let output = args.get(2).cloned();
            Command::Export { format, output }
        }
        "stats" => Command::Stats,
        "help" | "-h" | "--help" => Command::Help,
        "version" | "-v" | "--version" => Command::Version,
        _ => {
            eprintln!("Unknown command: {}", args[0]);
            eprintln!("Run 'task help' for usage information.");
            std::process::exit(1);
        }
    }
}

pub fn print_help() {
    println!("Task Manager v{}", env!("CARGO_PKG_VERSION"));
    println!();
    println!("USAGE:");
    println!("    task [COMMAND] [OPTIONS]");
    println!();
    println!("COMMANDS:");
    println!("    (none)              Start interactive mode");
    println!("    add <title>         Add a new task");
    println!("    list [filter]       List tasks (all/pending/completed)");
    println!("    complete <id>       Mark task as complete");
    println!("    delete <id>         Delete a task");
    println!("    search <query>      Search tasks");
    println!("    export <format>     Export tasks (json/csv/md)");
    println!("    stats               Show statistics");
    println!("    help                Show this help message");
    println!("    version             Show version");
    println!();
    println!("EXAMPLES:");
    println!("    task add \"Buy groceries\"");
    println!("    task list pending");
    println!("    task complete 5");
    println!("    task export csv tasks.csv");
}

pub fn print_version() {
    println!("Task Manager v{}", env!("CARGO_PKG_VERSION"));
}
```

---

## Export Functionality (src/export.rs)

```rust
use crate::task::{Task, Status};
use std::fs;
use std::io::{self, Write};

pub fn export_json(tasks: &[Task], output: Option<&str>) -> Result<(), String> {
    let json = serde_json::to_string_pretty(tasks)
        .map_err(|e| format!("Failed to serialize: {}", e))?;

    write_output(&json, output)
}

pub fn export_csv(tasks: &[Task], output: Option<&str>) -> Result<(), String> {
    let mut csv = String::new();

    // Header
    csv.push_str("ID,Title,Description,Priority,Status,Tags,Due Date,Created,Completed\n");

    // Rows
    for task in tasks {
        let description = task.description.as_deref().unwrap_or("");
        let tags = task.tags.join(";");
        let due_date = task.due_date
            .map(|d| d.to_string())
            .unwrap_or_default();
        let created = task.created_at.format("%Y-%m-%d %H:%M").to_string();
        let completed = task.completed_at
            .map(|d| d.format("%Y-%m-%d %H:%M").to_string())
            .unwrap_or_default();

        csv.push_str(&format!(
            "{},\"{}\",\"{}\",{},{},\"{}\",{},{},{}\n",
            task.id,
            escape_csv(&task.title),
            escape_csv(description),
            task.priority,
            task.status,
            tags,
            due_date,
            created,
            completed
        ));
    }

    write_output(&csv, output)
}

pub fn export_markdown(tasks: &[Task], output: Option<&str>) -> Result<(), String> {
    let mut md = String::new();

    md.push_str("# Task List\n\n");

    // Group by status
    let pending: Vec<_> = tasks.iter()
        .filter(|t| t.status == Status::Pending)
        .collect();
    let in_progress: Vec<_> = tasks.iter()
        .filter(|t| t.status == Status::InProgress)
        .collect();
    let completed: Vec<_> = tasks.iter()
        .filter(|t| t.status == Status::Completed)
        .collect();

    if !pending.is_empty() {
        md.push_str("## Pending\n\n");
        for task in pending {
            md.push_str(&format_task_md(task));
        }
        md.push('\n');
    }

    if !in_progress.is_empty() {
        md.push_str("## In Progress\n\n");
        for task in in_progress {
            md.push_str(&format_task_md(task));
        }
        md.push('\n');
    }

    if !completed.is_empty() {
        md.push_str("## Completed\n\n");
        for task in completed {
            md.push_str(&format_task_md(task));
        }
        md.push('\n');
    }

    // Statistics
    md.push_str("---\n\n");
    md.push_str(&format!("*Generated: {}*\n", chrono::Local::now().format("%Y-%m-%d %H:%M")));
    md.push_str(&format!("*Total: {} tasks ({} pending, {} in progress, {} completed)*\n",
        tasks.len(), pending.len(), in_progress.len(), completed.len()));

    write_output(&md, output)
}

fn format_task_md(task: &Task) -> String {
    let checkbox = match task.status {
        Status::Completed => "[x]",
        _ => "[ ]",
    };

    let priority = match task.priority {
        crate::task::Priority::High => " **[HIGH]**",
        crate::task::Priority::Medium => "",
        crate::task::Priority::Low => " *[low]*",
    };

    let due = task.due_date
        .map(|d| format!(" (due: {})", d))
        .unwrap_or_default();

    let tags = if task.tags.is_empty() {
        String::new()
    } else {
        format!(" `{}`", task.tags.join("` `"))
    };

    let mut line = format!("- {} {}{}{}{}\n", checkbox, task.title, priority, due, tags);

    if let Some(desc) = &task.description {
        line.push_str(&format!("  > {}\n", desc));
    }

    line
}

fn escape_csv(s: &str) -> String {
    s.replace('"', "\"\"")
}

fn write_output(content: &str, output: Option<&str>) -> Result<(), String> {
    match output {
        Some(path) => {
            fs::write(path, content)
                .map_err(|e| format!("Failed to write file: {}", e))?;
            println!("Exported to: {}", path);
        }
        None => {
            print!("{}", content);
            io::stdout().flush().unwrap();
        }
    }
    Ok(())
}
```

---

## Batch Operations (src/batch.rs)

```rust
use crate::storage::TaskStore;
use crate::task::{Task, Priority, Status};

pub struct BatchOperations;

impl BatchOperations {
    pub fn complete_all_with_tag(store: &mut TaskStore, tag: &str) -> usize {
        let ids: Vec<u32> = store.by_tag(tag)
            .iter()
            .filter(|t| t.status != Status::Completed)
            .map(|t| t.id)
            .collect();

        for id in &ids {
            if let Some(task) = store.get_mut(*id) {
                task.complete();
            }
        }

        ids.len()
    }

    pub fn delete_completed(store: &mut TaskStore) -> usize {
        let ids: Vec<u32> = store.completed()
            .iter()
            .map(|t| t.id)
            .collect();

        for id in &ids {
            store.remove(*id);
        }

        ids.len()
    }

    pub fn set_priority_by_tag(store: &mut TaskStore, tag: &str, priority: Priority) -> usize {
        let ids: Vec<u32> = store.by_tag(tag)
            .iter()
            .map(|t| t.id)
            .collect();

        for id in &ids {
            if let Some(task) = store.get_mut(*id) {
                task.priority = priority.clone();
            }
        }

        ids.len()
    }

    pub fn add_tag_to_overdue(store: &mut TaskStore, tag: &str) -> usize {
        let ids: Vec<u32> = store.overdue()
            .iter()
            .map(|t| t.id)
            .collect();

        for id in &ids {
            if let Some(task) = store.get_mut(*id) {
                if !task.tags.contains(&tag.to_string()) {
                    task.tags.push(tag.to_string());
                }
            }
        }

        ids.len()
    }
}
```

---

## Display Formatting (src/display.rs)

```rust
use crate::task::{Task, Priority, Status};

pub struct TaskFormatter;

impl TaskFormatter {
    pub fn format_list(tasks: &[&Task], show_details: bool) -> String {
        let mut output = String::new();

        if tasks.is_empty() {
            return "No tasks found.\n".to_string();
        }

        for task in tasks {
            if show_details {
                output.push_str(&Self::format_detailed(task));
            } else {
                output.push_str(&Self::format_line(task));
            }
        }

        output
    }

    pub fn format_line(task: &Task) -> String {
        let status = match task.status {
            Status::Pending => "○",
            Status::InProgress => "◐",
            Status::Completed => "●",
        };

        let priority = task.priority.symbol();

        let mut extras = Vec::new();

        if let Some(due) = task.due_date {
            if task.is_overdue() {
                extras.push(format!("⚠️ OVERDUE ({})", due));
            } else if let Some(days) = task.days_until_due() {
                if days == 0 {
                    extras.push("📅 Today".to_string());
                } else if days == 1 {
                    extras.push("📅 Tomorrow".to_string());
                } else if days <= 7 {
                    extras.push(format!("📅 {} days", days));
                }
            }
        }

        if !task.tags.is_empty() {
            extras.push(format!("[{}]", task.tags.join(", ")));
        }

        let extra_str = if extras.is_empty() {
            String::new()
        } else {
            format!(" {}", extras.join(" "))
        };

        format!("{} {} #{}: {}{}\n", status, priority, task.id, task.title, extra_str)
    }

    pub fn format_detailed(task: &Task) -> String {
        let mut output = format!("━━━ Task #{} ━━━\n", task.id);

        output.push_str(&format!("Title:    {}\n", task.title));
        output.push_str(&format!("Status:   {}\n", Self::format_status(&task.status)));
        output.push_str(&format!("Priority: {}\n", Self::format_priority(&task.priority)));

        if let Some(desc) = &task.description {
            output.push_str(&format!("Desc:     {}\n", desc));
        }

        if !task.tags.is_empty() {
            output.push_str(&format!("Tags:     {}\n", task.tags.join(", ")));
        }

        if let Some(due) = task.due_date {
            let days = task.days_until_due().unwrap();
            let status = if days < 0 {
                format!("OVERDUE by {} days", -days)
            } else if days == 0 {
                "Today".to_string()
            } else {
                format!("{} days left", days)
            };
            output.push_str(&format!("Due:      {} ({})\n", due, status));
        }

        output.push_str(&format!("Created:  {}\n",
            task.created_at.format("%Y-%m-%d %H:%M")));

        if let Some(completed) = task.completed_at {
            output.push_str(&format!("Done:     {}\n",
                completed.format("%Y-%m-%d %H:%M")));
        }

        output.push('\n');
        output
    }

    fn format_status(status: &Status) -> String {
        match status {
            Status::Pending => "○ Pending".to_string(),
            Status::InProgress => "◐ In Progress".to_string(),
            Status::Completed => "● Completed".to_string(),
        }
    }

    fn format_priority(priority: &Priority) -> String {
        match priority {
            Priority::Low => "↓ Low".to_string(),
            Priority::Medium => "→ Medium".to_string(),
            Priority::High => "↑ High".to_string(),
        }
    }

    pub fn format_stats(stats: &crate::storage::TaskStats) -> String {
        let mut output = String::new();

        output.push_str("╔═══════════════════════════╗\n");
        output.push_str("║       TASK STATISTICS     ║\n");
        output.push_str("╠═══════════════════════════╣\n");
        output.push_str(&format!("║ Total:       {:>10}  ║\n", stats.total));
        output.push_str(&format!("║ Pending:     {:>10}  ║\n", stats.pending));
        output.push_str(&format!("║ In Progress: {:>10}  ║\n", stats.in_progress));
        output.push_str(&format!("║ Completed:   {:>10}  ║\n", stats.completed));
        output.push_str(&format!("║ Overdue:     {:>10}  ║\n", stats.overdue));
        output.push_str("╠═══════════════════════════╣\n");

        if stats.total > 0 {
            let rate = (stats.completed as f64 / stats.total as f64) * 100.0;
            output.push_str(&format!("║ Completion:  {:>9.1}%  ║\n", rate));
        }

        output.push_str("╚═══════════════════════════╝\n");

        output
    }
}
```

---

## Updated Main (src/main.rs)

```rust
mod task;
mod storage;
mod cli;
mod args;
mod export;
mod batch;
mod display;

use args::{parse_args, Command, print_help, print_version};
use cli::CLI;
use display::TaskFormatter;
use export::{export_json, export_csv, export_markdown};
use storage::TaskStore;
use std::path::PathBuf;

fn get_data_path() -> PathBuf {
    dirs::data_local_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("task_manager")
        .join("tasks.json")
}

fn ensure_data_dir(path: &PathBuf) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create data directory: {}", e))?;
    }
    Ok(())
}

fn main() {
    let data_path = get_data_path();

    if let Err(e) = ensure_data_dir(&data_path) {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }

    let command = parse_args();

    match command {
        Command::Interactive => {
            match CLI::new(data_path) {
                Ok(mut cli) => cli.run(),
                Err(e) => {
                    eprintln!("Failed to initialize: {}", e);
                    std::process::exit(1);
                }
            }
        }

        Command::Add { title } => {
            let mut store = load_store(&data_path);
            let task = task::Task::new(0, title.clone());
            let id = store.add(task);
            save_store(&store, &data_path);
            println!("✓ Task #{} created: {}", id, title);
        }

        Command::List { filter } => {
            let store = load_store(&data_path);
            let tasks: Vec<&task::Task> = match filter.as_deref() {
                Some("all" | "a") => store.all().iter().collect(),
                Some("completed" | "c" | "done") => store.completed(),
                Some("overdue") => store.overdue(),
                _ => store.pending(),
            };

            if tasks.is_empty() {
                println!("No tasks found.");
            } else {
                print!("{}", TaskFormatter::format_list(&tasks, false));
            }
        }

        Command::Complete { id } => {
            let mut store = load_store(&data_path);
            match store.get_mut(id) {
                Some(task) => {
                    task.complete();
                    save_store(&store, &data_path);
                    println!("✓ Task #{} completed!", id);
                }
                None => {
                    eprintln!("Task #{} not found.", id);
                    std::process::exit(1);
                }
            }
        }

        Command::Delete { id } => {
            let mut store = load_store(&data_path);
            match store.remove(id) {
                Some(_) => {
                    save_store(&store, &data_path);
                    println!("✓ Task #{} deleted.", id);
                }
                None => {
                    eprintln!("Task #{} not found.", id);
                    std::process::exit(1);
                }
            }
        }

        Command::Search { query } => {
            let store = load_store(&data_path);
            let results = store.search(&query);

            if results.is_empty() {
                println!("No tasks found matching '{}'.", query);
            } else {
                println!("Found {} task(s):\n", results.len());
                print!("{}", TaskFormatter::format_list(&results, false));
            }
        }

        Command::Export { format, output } => {
            let store = load_store(&data_path);
            let tasks: Vec<task::Task> = store.all().to_vec();

            let result = match format.to_lowercase().as_str() {
                "json" => export_json(&tasks, output.as_deref()),
                "csv" => export_csv(&tasks, output.as_deref()),
                "md" | "markdown" => export_markdown(&tasks, output.as_deref()),
                _ => {
                    eprintln!("Unknown format: {}. Use json, csv, or md.", format);
                    std::process::exit(1);
                }
            };

            if let Err(e) = result {
                eprintln!("Export failed: {}", e);
                std::process::exit(1);
            }
        }

        Command::Stats => {
            let store = load_store(&data_path);
            let stats = store.stats();
            print!("{}", TaskFormatter::format_stats(&stats));
        }

        Command::Help => print_help(),
        Command::Version => print_version(),
    }
}

fn load_store(path: &PathBuf) -> TaskStore {
    TaskStore::load(path).unwrap_or_else(|e| {
        eprintln!("Failed to load tasks: {}", e);
        std::process::exit(1);
    })
}

fn save_store(store: &TaskStore, path: &PathBuf) {
    if let Err(e) = store.save(path) {
        eprintln!("Warning: Failed to save: {}", e);
    }
}
```

---

## Usage Examples

```bash
# Interactive mode
cargo run

# Quick add
cargo run -- add "Buy groceries"
cargo run -- add "Call mom"

# List tasks
cargo run -- list          # Pending tasks
cargo run -- list all      # All tasks
cargo run -- list completed

# Complete a task
cargo run -- complete 1

# Delete a task
cargo run -- delete 2

# Search
cargo run -- search "groceries"

# Export
cargo run -- export json
cargo run -- export csv tasks.csv
cargo run -- export md tasks.md

# Statistics
cargo run -- stats

# Help
cargo run -- help
```

---

## What We've Accomplished

1. **Command-line interface** with subcommands
2. **Multiple export formats** (JSON, CSV, Markdown)
3. **Batch operations** for efficiency
4. **Beautiful formatting** with Unicode symbols
5. **Complete CRUD operations**
6. **Search and filtering**
7. **Statistics and reporting**

---

## Future Enhancements

- Recurring tasks
- Task dependencies
- Time tracking
- Multiple lists/projects
- Sync with cloud services
- Desktop notifications
- Integration with calendars

---

## Congratulations!

You've completed 30 days of Rust! You now have:

- **Strong foundation** in Rust fundamentals
- **Understanding** of ownership and borrowing
- **Experience** with common patterns
- **A complete project** to show off

---

## Where to Go From Here

1. **The Rust Book** - Read remaining chapters
2. **Rustlings** - Practice exercises
3. **Build projects** - Learn by doing
4. **Contribute** - Open source Rust projects
5. **Explore async** - Tokio, async-std
6. **Web development** - Actix, Axum, Rocket
7. **Systems programming** - Embedded, OS development

---

## Key Takeaways from 30 Days

1. **Ownership is central** to Rust's memory safety
2. **The compiler is your friend** - trust the errors
3. **Iterators and closures** are powerful tools
4. **Error handling** with Result is elegant
5. **Traits** enable polymorphism
6. **Testing** is first-class in Rust
7. **Cargo** makes project management easy

---

## Thank You!

You've made it through 30 days of intensive Rust learning. Keep coding, keep learning, and welcome to the Rust community!

🦀 **Happy Rusting!** 🦀

---

[← Previous: Day 29](day-29.md) | [Back to Day 1 →](day-01.md)
