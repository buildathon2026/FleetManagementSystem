"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initializeDatabase = initializeDatabase;
exports.closeDatabase = closeDatabase;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = process.env.DATABASE_PATH || path_1.default.join(__dirname, '..', 'fleet.db');
let db;
function getDb() {
    if (!db) {
        db = new better_sqlite3_1.default(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
    }
    return db;
}
function initializeDatabase() {
    const database = getDb();
    database.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      canonical_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS aliases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_id TEXT NOT NULL,
      alias_text TEXT NOT NULL,
      confidence REAL DEFAULT 1.0,
      FOREIGN KEY (entity_id) REFERENCES entities(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      doc_ref TEXT
    );

    CREATE TABLE IF NOT EXISTS revenue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      truck_id TEXT NOT NULL,
      date TEXT NOT NULL,
      amount REAL NOT NULL,
      load_id TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      entity_id TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      date TEXT NOT NULL,
      summary TEXT,
      content TEXT,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now')),
      tool_name TEXT NOT NULL,
      params TEXT,
      result_count INTEGER,
      execution_time_ms INTEGER
    );
  `);
    // Create indexes for performance
    database.exec(`
    CREATE INDEX IF NOT EXISTS idx_expenses_truck_id ON expenses(truck_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
    CREATE INDEX IF NOT EXISTS idx_revenue_truck_id ON revenue(truck_id);
    CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
    CREATE INDEX IF NOT EXISTS idx_documents_entity_id ON documents(entity_id);
    CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
    CREATE INDEX IF NOT EXISTS idx_aliases_entity_id ON aliases(entity_id);
    CREATE INDEX IF NOT EXISTS idx_aliases_alias_text ON aliases(alias_text);
  `);
}
function closeDatabase() {
    if (db) {
        db.close();
    }
}
//# sourceMappingURL=db.js.map