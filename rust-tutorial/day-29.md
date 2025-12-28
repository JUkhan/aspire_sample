# Day 29: Mini Project - Task Manager CLI (Part 1)

## Learning Objectives
- Apply concepts learned throughout the tutorial
- Build a complete CLI application
- Implement file-based persistence
- Create a well-structured Rust project

---

## Project Overview

We'll build a feature-rich task manager with:
- Add, list, complete, and delete tasks
- Priority levels and due dates
- Category/tag support
- JSON file persistence
- Search and filter capabilities

---

## Project Setup

```bash
cargo new task_manager
cd task_manager
```

```toml
# Cargo.toml
[package]
name = "task_manager"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
```

---

## Project Structure

```
task_manager/
├── Cargo.toml
└── src/
    ├── main.rs
    ├── task.rs
    ├── storage.rs
    └── cli.rs
```

---

## Task Model (src/task.rs)

```rust
use chrono::{DateTime, Local, NaiveDate};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Priority {
    Low,
    Medium,
    High,
}

impl Default for Priority {
    fn default() -> Self {
        Priority::Medium
    }
}

impl std::fmt::Display for Priority {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Priority::Low => write!(f, "Low"),
            Priority::Medium => write!(f, "Medium"),
            Priority::High => write!(f, "High"),
        }
    }
}

impl Priority {
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "low" | "l" | "1" => Some(Priority::Low),
            "medium" | "med" | "m" | "2" => Some(Priority::Medium),
            "high" | "h" | "3" => Some(Priority::High),
            _ => None,
        }
    }

    pub fn symbol(&self) -> &str {
        match self {
            Priority::Low => "○",
            Priority::Medium => "◐",
            Priority::High => "●",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Status {
    Pending,
    InProgress,
    Completed,
}

impl Default for Status {
    fn default() -> Self {
        Status::Pending
    }
}

impl std::fmt::Display for Status {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Status::Pending => write!(f, "Pending"),
            Status::InProgress => write!(f, "In Progress"),
            Status::Completed => write!(f, "Completed"),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: u32,
    pub title: String,
    pub description: Option<String>,
    pub priority: Priority,
    pub status: Status,
    pub tags: Vec<String>,
    pub due_date: Option<NaiveDate>,
    pub created_at: DateTime<Local>,
    pub completed_at: Option<DateTime<Local>>,
}

impl Task {
    pub fn new(id: u32, title: String) -> Self {
        Task {
            id,
            title,
            description: None,
            priority: Priority::default(),
            status: Status::default(),
            tags: Vec::new(),
            due_date: None,
            created_at: Local::now(),
            completed_at: None,
        }
    }

    pub fn with_priority(mut self, priority: Priority) -> Self {
        self.priority = priority;
        self
    }

    pub fn with_description(mut self, description: String) -> Self {
        self.description = Some(description);
        self
    }

    pub fn with_tags(mut self, tags: Vec<String>) -> Self {
        self.tags = tags;
        self
    }

    pub fn with_due_date(mut self, date: NaiveDate) -> Self {
        self.due_date = Some(date);
        self
    }

    pub fn complete(&mut self) {
        self.status = Status::Completed;
        self.completed_at = Some(Local::now());
    }

    pub fn start(&mut self) {
        self.status = Status::InProgress;
    }

    pub fn is_overdue(&self) -> bool {
        if let Some(due) = self.due_date {
            due < Local::now().date_naive() && self.status != Status::Completed
        } else {
            false
        }
    }

    pub fn days_until_due(&self) -> Option<i64> {
        self.due_date.map(|due| {
            (due - Local::now().date_naive()).num_days()
        })
    }
}
```

---

## Storage Layer (src/storage.rs)

```rust
use crate::task::{Task, Priority, Status};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TaskStore {
    tasks: Vec<Task>,
    next_id: u32,
}

impl TaskStore {
    pub fn new() -> Self {
        TaskStore {
            tasks: Vec::new(),
            next_id: 1,
        }
    }

    pub fn load(path: &Path) -> Result<Self, String> {
        if !path.exists() {
            return Ok(TaskStore::new());
        }

        let content = fs::read_to_string(path)
            .map_err(|e| format!("Failed to read file: {}", e))?;

        let mut store: TaskStore = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        // Ensure next_id is correct
        store.next_id = store.tasks.iter()
            .map(|t| t.id)
            .max()
            .unwrap_or(0) + 1;

        Ok(store)
    }

    pub fn save(&self, path: &Path) -> Result<(), String> {
        let content = serde_json::to_string_pretty(&self)
            .map_err(|e| format!("Failed to serialize: {}", e))?;

        fs::write(path, content)
            .map_err(|e| format!("Failed to write file: {}", e))?;

        Ok(())
    }

    pub fn add(&mut self, mut task: Task) -> u32 {
        task.id = self.next_id;
        self.next_id += 1;
        let id = task.id;
        self.tasks.push(task);
        id
    }

    pub fn get(&self, id: u32) -> Option<&Task> {
        self.tasks.iter().find(|t| t.id == id)
    }

    pub fn get_mut(&mut self, id: u32) -> Option<&mut Task> {
        self.tasks.iter_mut().find(|t| t.id == id)
    }

    pub fn remove(&mut self, id: u32) -> Option<Task> {
        if let Some(pos) = self.tasks.iter().position(|t| t.id == id) {
            Some(self.tasks.remove(pos))
        } else {
            None
        }
    }

    pub fn all(&self) -> &[Task] {
        &self.tasks
    }

    pub fn pending(&self) -> Vec<&Task> {
        self.tasks.iter()
            .filter(|t| t.status != Status::Completed)
            .collect()
    }

    pub fn completed(&self) -> Vec<&Task> {
        self.tasks.iter()
            .filter(|t| t.status == Status::Completed)
            .collect()
    }

    pub fn by_priority(&self, priority: &Priority) -> Vec<&Task> {
        self.tasks.iter()
            .filter(|t| &t.priority == priority)
            .collect()
    }

    pub fn by_tag(&self, tag: &str) -> Vec<&Task> {
        self.tasks.iter()
            .filter(|t| t.tags.iter().any(|t| t.eq_ignore_ascii_case(tag)))
            .collect()
    }

    pub fn search(&self, query: &str) -> Vec<&Task> {
        let query = query.to_lowercase();
        self.tasks.iter()
            .filter(|t| {
                t.title.to_lowercase().contains(&query) ||
                t.description.as_ref()
                    .map_or(false, |d| d.to_lowercase().contains(&query)) ||
                t.tags.iter().any(|tag| tag.to_lowercase().contains(&query))
            })
            .collect()
    }

    pub fn overdue(&self) -> Vec<&Task> {
        self.tasks.iter()
            .filter(|t| t.is_overdue())
            .collect()
    }

    pub fn stats(&self) -> TaskStats {
        let total = self.tasks.len();
        let completed = self.tasks.iter()
            .filter(|t| t.status == Status::Completed)
            .count();
        let pending = self.tasks.iter()
            .filter(|t| t.status == Status::Pending)
            .count();
        let in_progress = self.tasks.iter()
            .filter(|t| t.status == Status::InProgress)
            .count();
        let overdue = self.overdue().len();

        TaskStats {
            total,
            completed,
            pending,
            in_progress,
            overdue,
        }
    }
}

#[derive(Debug)]
pub struct TaskStats {
    pub total: usize,
    pub completed: usize,
    pub pending: usize,
    pub in_progress: usize,
    pub overdue: usize,
}
```

---

## CLI Interface (src/cli.rs)

```rust
use crate::task::{Task, Priority, Status};
use crate::storage::TaskStore;
use chrono::NaiveDate;
use std::io::{self, Write};

pub struct CLI {
    store: TaskStore,
    data_path: std::path::PathBuf,
}

impl CLI {
    pub fn new(data_path: std::path::PathBuf) -> Result<Self, String> {
        let store = TaskStore::load(&data_path)?;
        Ok(CLI { store, data_path })
    }

    fn save(&self) -> Result<(), String> {
        self.store.save(&self.data_path)
    }

    fn prompt(message: &str) -> String {
        print!("{}", message);
        io::stdout().flush().unwrap();

        let mut input = String::new();
        io::stdin().read_line(&mut input).unwrap();
        input.trim().to_string()
    }

    fn prompt_optional(message: &str) -> Option<String> {
        let input = Self::prompt(message);
        if input.is_empty() {
            None
        } else {
            Some(input)
        }
    }

    pub fn run(&mut self) {
        println!("\n=== Task Manager ===\n");
        self.show_summary();

        loop {
            self.print_menu();
            let choice = Self::prompt("\nChoice: ");

            match choice.as_str() {
                "1" | "add" => self.cmd_add(),
                "2" | "list" => self.cmd_list(),
                "3" | "view" => self.cmd_view(),
                "4" | "complete" => self.cmd_complete(),
                "5" | "start" => self.cmd_start(),
                "6" | "delete" => self.cmd_delete(),
                "7" | "search" => self.cmd_search(),
                "8" | "stats" => self.cmd_stats(),
                "9" | "exit" | "quit" | "q" => {
                    println!("Goodbye!");
                    break;
                }
                "help" | "?" => self.print_help(),
                _ => println!("Unknown command. Type 'help' for options."),
            }
        }
    }

    fn print_menu(&self) {
        println!("\n[1] Add   [2] List   [3] View   [4] Complete");
        println!("[5] Start [6] Delete [7] Search [8] Stats [9] Exit");
    }

    fn print_help(&self) {
        println!("\n=== Help ===");
        println!("add      - Add a new task");
        println!("list     - List all tasks");
        println!("view     - View task details");
        println!("complete - Mark task as complete");
        println!("start    - Mark task as in progress");
        println!("delete   - Delete a task");
        println!("search   - Search tasks");
        println!("stats    - Show statistics");
        println!("exit     - Exit the application");
    }

    fn show_summary(&self) {
        let stats = self.store.stats();
        println!("Tasks: {} total, {} pending, {} completed",
            stats.total, stats.pending, stats.completed);

        if stats.overdue > 0 {
            println!("⚠️  {} overdue task(s)!", stats.overdue);
        }
    }

    fn cmd_add(&mut self) {
        println!("\n--- Add New Task ---");

        let title = Self::prompt("Title: ");
        if title.is_empty() {
            println!("Title cannot be empty.");
            return;
        }

        let mut task = Task::new(0, title);

        // Optional description
        if let Some(desc) = Self::prompt_optional("Description (optional): ") {
            task = task.with_description(desc);
        }

        // Priority
        let priority_str = Self::prompt("Priority (low/medium/high) [medium]: ");
        if !priority_str.is_empty() {
            if let Some(priority) = Priority::from_str(&priority_str) {
                task = task.with_priority(priority);
            }
        }

        // Tags
        if let Some(tags_str) = Self::prompt_optional("Tags (comma-separated, optional): ") {
            let tags: Vec<String> = tags_str
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            task = task.with_tags(tags);
        }

        // Due date
        if let Some(date_str) = Self::prompt_optional("Due date (YYYY-MM-DD, optional): ") {
            if let Ok(date) = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d") {
                task = task.with_due_date(date);
            } else {
                println!("Invalid date format, skipping.");
            }
        }

        let id = self.store.add(task);
        if let Err(e) = self.save() {
            println!("Warning: Failed to save: {}", e);
        }

        println!("✓ Task #{} created", id);
    }

    fn cmd_list(&self) {
        println!("\n--- Task List ---");

        let filter = Self::prompt("Filter (all/pending/completed) [pending]: ");

        let tasks: Vec<&Task> = match filter.as_str() {
            "all" | "a" => self.store.all().iter().collect(),
            "completed" | "c" => self.store.completed(),
            _ => self.store.pending(),
        };

        if tasks.is_empty() {
            println!("No tasks found.");
            return;
        }

        for task in tasks {
            self.print_task_line(task);
        }
    }

    fn print_task_line(&self, task: &Task) {
        let status_icon = match task.status {
            Status::Pending => "○",
            Status::InProgress => "◐",
            Status::Completed => "●",
        };

        let priority_icon = task.priority.symbol();

        let overdue = if task.is_overdue() { " ⚠️ OVERDUE" } else { "" };

        let due = task.due_date
            .map(|d| format!(" [Due: {}]", d))
            .unwrap_or_default();

        println!("{} {} #{}: {}{}{}", status_icon, priority_icon, task.id, task.title, due, overdue);
    }

    fn cmd_view(&self) {
        let id_str = Self::prompt("Task ID: ");
        let id: u32 = match id_str.parse() {
            Ok(id) => id,
            Err(_) => {
                println!("Invalid ID.");
                return;
            }
        };

        match self.store.get(id) {
            Some(task) => self.print_task_detail(task),
            None => println!("Task not found."),
        }
    }

    fn print_task_detail(&self, task: &Task) {
        println!("\n--- Task #{} ---", task.id);
        println!("Title:       {}", task.title);
        println!("Status:      {}", task.status);
        println!("Priority:    {}", task.priority);

        if let Some(desc) = &task.description {
            println!("Description: {}", desc);
        }

        if !task.tags.is_empty() {
            println!("Tags:        {}", task.tags.join(", "));
        }

        if let Some(due) = task.due_date {
            let days = task.days_until_due().unwrap();
            let due_text = if days < 0 {
                format!("{} ({} days overdue)", due, -days)
            } else if days == 0 {
                format!("{} (today)", due)
            } else {
                format!("{} ({} days left)", due, days)
            };
            println!("Due Date:    {}", due_text);
        }

        println!("Created:     {}", task.created_at.format("%Y-%m-%d %H:%M"));

        if let Some(completed) = task.completed_at {
            println!("Completed:   {}", completed.format("%Y-%m-%d %H:%M"));
        }
    }

    fn cmd_complete(&mut self) {
        let id_str = Self::prompt("Task ID to complete: ");
        let id: u32 = match id_str.parse() {
            Ok(id) => id,
            Err(_) => {
                println!("Invalid ID.");
                return;
            }
        };

        match self.store.get_mut(id) {
            Some(task) => {
                task.complete();
                if let Err(e) = self.save() {
                    println!("Warning: Failed to save: {}", e);
                }
                println!("✓ Task #{} completed!", id);
            }
            None => println!("Task not found."),
        }
    }

    fn cmd_start(&mut self) {
        let id_str = Self::prompt("Task ID to start: ");
        let id: u32 = match id_str.parse() {
            Ok(id) => id,
            Err(_) => {
                println!("Invalid ID.");
                return;
            }
        };

        match self.store.get_mut(id) {
            Some(task) => {
                task.start();
                if let Err(e) = self.save() {
                    println!("Warning: Failed to save: {}", e);
                }
                println!("✓ Task #{} started!", id);
            }
            None => println!("Task not found."),
        }
    }

    fn cmd_delete(&mut self) {
        let id_str = Self::prompt("Task ID to delete: ");
        let id: u32 = match id_str.parse() {
            Ok(id) => id,
            Err(_) => {
                println!("Invalid ID.");
                return;
            }
        };

        let confirm = Self::prompt(&format!("Delete task #{}? (y/N): ", id));
        if confirm.to_lowercase() != "y" {
            println!("Cancelled.");
            return;
        }

        match self.store.remove(id) {
            Some(_) => {
                if let Err(e) = self.save() {
                    println!("Warning: Failed to save: {}", e);
                }
                println!("✓ Task #{} deleted.", id);
            }
            None => println!("Task not found."),
        }
    }

    fn cmd_search(&self) {
        let query = Self::prompt("Search query: ");
        if query.is_empty() {
            return;
        }

        let results = self.store.search(&query);

        if results.is_empty() {
            println!("No tasks found matching '{}'.", query);
            return;
        }

        println!("\n--- Search Results ({}) ---", results.len());
        for task in results {
            self.print_task_line(task);
        }
    }

    fn cmd_stats(&self) {
        let stats = self.store.stats();

        println!("\n--- Statistics ---");
        println!("Total tasks:     {}", stats.total);
        println!("Pending:         {}", stats.pending);
        println!("In Progress:     {}", stats.in_progress);
        println!("Completed:       {}", stats.completed);
        println!("Overdue:         {}", stats.overdue);

        if stats.total > 0 {
            let completion_rate = (stats.completed as f64 / stats.total as f64) * 100.0;
            println!("Completion rate: {:.1}%", completion_rate);
        }
    }
}
```

---

## Main Entry (src/main.rs)

```rust
mod task;
mod storage;
mod cli;

use cli::CLI;
use std::path::PathBuf;

fn get_data_path() -> PathBuf {
    // Use home directory or current directory
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

    match CLI::new(data_path) {
        Ok(mut cli) => cli.run(),
        Err(e) => {
            eprintln!("Failed to initialize: {}", e);
            std::process::exit(1);
        }
    }
}
```

---

## Adding dirs Dependency

```toml
# Add to Cargo.toml
[dependencies]
dirs = "5.0"
```

---

## Running the Application

```bash
cargo run
```

---

## What We've Built

1. **Task model** with rich attributes
2. **Storage layer** with JSON persistence
3. **CLI interface** with interactive menu
4. **CRUD operations** for tasks
5. **Filtering and search** capabilities
6. **Statistics** reporting

---

## Key Takeaways

1. **Modular architecture** separates concerns
2. **Builder pattern** for flexible task creation
3. **Serde** handles serialization seamlessly
4. **Error handling** throughout the application
5. **User-friendly CLI** with clear prompts

---

## Coming in Part 2

- Command-line argument parsing
- Export to different formats
- Recurring tasks
- Undo/redo functionality
- Improved date handling

---

[← Previous: Day 28](day-28.md) | [Next: Day 30 - Mini Project Part 2 →](day-30.md)
