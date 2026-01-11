import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
    if (!db) {
        db = await Database.load("sqlite:prompter.db");
        await initializeSchema();
    }
    return db;
}

async function initializeSchema() {
    if (!db) return;

    // Categories table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Tags table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#F97316',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Prompts table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      is_deleted INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Prompt-Tag relation
    await db.execute(`
    CREATE TABLE IF NOT EXISTS prompt_tags (
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (prompt_id, tag_id)
    )
  `);

    // Versions table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      version_name TEXT,
      is_starred INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Migration: Add is_starred column if it doesn't exist
    try {
        await db.execute(`ALTER TABLE versions ADD COLUMN is_starred INTEGER DEFAULT 0`);
    } catch {
        // Column already exists, ignore
    }

    // Test History table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS test_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_id INTEGER NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
      input_variables TEXT,
      output TEXT,
      model TEXT,
      tokens_used INTEGER,
      duration_ms INTEGER,
      tested_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

    // Settings table
    await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

    // Note: "未分类" is a virtual group for prompts with category_id = NULL
    // Do NOT create a real category for it
}

// Type definitions
export interface Prompt {
    id: number;
    title: string;
    content: string;
    category_id: number | null;
    is_deleted: number;
    created_at: string;
    updated_at: string;
}

export interface Category {
    id: number;
    name: string;
    parent_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: number;
    name: string;
    color: string;
    created_at: string;
}

export interface Version {
    id: number;
    prompt_id: number;
    content: string;
    version_name: string | null;
    is_starred: number;
    created_at: string;
}

// CRUD operations for Prompts
export async function createPrompt(
    title: string,
    content: string = "",
    categoryId: number | null = 1
): Promise<number> {
    const database = await getDb();
    const result = await database.execute(
        "INSERT INTO prompts (title, content, category_id) VALUES (?, ?, ?)",
        [title, content, categoryId]
    );
    return result.lastInsertId!;
}

export async function getPrompts(includeDeleted = false): Promise<Prompt[]> {
    const database = await getDb();
    const query = includeDeleted
        ? "SELECT * FROM prompts ORDER BY updated_at DESC"
        : "SELECT * FROM prompts WHERE is_deleted = 0 ORDER BY updated_at DESC";
    return await database.select<Prompt[]>(query);
}

export async function getPromptById(id: number): Promise<Prompt | null> {
    const database = await getDb();
    const results = await database.select<Prompt[]>(
        "SELECT * FROM prompts WHERE id = ?",
        [id]
    );
    return results.length > 0 ? results[0] : null;
}

export async function updatePrompt(
    id: number,
    title: string,
    content: string
): Promise<void> {
    const database = await getDb();
    await database.execute(
        "UPDATE prompts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [title, content, id]
    );
}

export async function updatePromptCategory(
    id: number,
    categoryId: number | null
): Promise<void> {
    const database = await getDb();
    await database.execute(
        "UPDATE prompts SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [categoryId, id]
    );
}

export async function deletePrompt(id: number, hard = false): Promise<void> {
    const database = await getDb();
    if (hard) {
        await database.execute("DELETE FROM prompts WHERE id = ?", [id]);
    } else {
        await database.execute(
            "UPDATE prompts SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [id]
        );
    }
}

// CRUD operations for Categories
export async function getCategories(): Promise<Category[]> {
    const database = await getDb();
    return await database.select<Category[]>(
        "SELECT * FROM categories ORDER BY name"
    );
}

export async function createCategory(
    name: string,
    parentId: number | null = null
): Promise<number> {
    const database = await getDb();
    const result = await database.execute(
        "INSERT INTO categories (name, parent_id) VALUES (?, ?)",
        [name, parentId]
    );
    return result.lastInsertId!;
}

export async function updateCategory(
    id: number,
    name: string
): Promise<void> {
    const database = await getDb();
    await database.execute(
        "UPDATE categories SET name = ? WHERE id = ?",
        [name, id]
    );
}

export async function deleteCategory(id: number): Promise<void> {
    const database = await getDb();
    // Move all prompts in this category to uncategorized
    await database.execute(
        "UPDATE prompts SET category_id = NULL WHERE category_id = ?",
        [id]
    );
    // Delete the category
    await database.execute("DELETE FROM categories WHERE id = ?", [id]);
}

// CRUD operations for Tags
export async function getTags(): Promise<Tag[]> {
    const database = await getDb();
    return await database.select<Tag[]>("SELECT * FROM tags ORDER BY name");
}

export async function createTag(
    name: string,
    color: string = "#F97316"
): Promise<number> {
    const database = await getDb();
    const result = await database.execute(
        "INSERT INTO tags (name, color) VALUES (?, ?)",
        [name, color]
    );
    return result.lastInsertId!;
}

// Version operations
export async function createVersion(
    promptId: number,
    content: string,
    versionName?: string
): Promise<number> {
    const database = await getDb();
    const result = await database.execute(
        "INSERT INTO versions (prompt_id, content, version_name) VALUES (?, ?, ?)",
        [promptId, content, versionName ?? null]
    );
    return result.lastInsertId!;
}

export async function getVersions(promptId: number): Promise<Version[]> {
    const database = await getDb();
    return await database.select<Version[]>(
        "SELECT * FROM versions WHERE prompt_id = ? ORDER BY created_at DESC",
        [promptId]
    );
}

export async function toggleVersionStar(versionId: number, isStarred: boolean): Promise<void> {
    const database = await getDb();
    await database.execute(
        "UPDATE versions SET is_starred = ? WHERE id = ?",
        [isStarred ? 1 : 0, versionId]
    );
}

export async function renameVersion(versionId: number, name: string): Promise<void> {
    const database = await getDb();
    await database.execute(
        "UPDATE versions SET version_name = ? WHERE id = ?",
        [name || null, versionId]
    );
}

// Settings operations
export async function getSetting(key: string): Promise<string | null> {
    const database = await getDb();
    const results = await database.select<{ value: string }[]>(
        "SELECT value FROM settings WHERE key = ?",
        [key]
    );
    return results.length > 0 ? results[0].value : null;
}

export async function setSetting(key: string, value: string): Promise<void> {
    const database = await getDb();
    await database.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [key, value]
    );
}
