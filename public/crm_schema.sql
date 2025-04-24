-- CRM Database schema for SQLite
-- Run with PRAGMA foreign_keys=ON to enforce relationships
PRAGMA foreign_keys = ON;

-- =======================================================
-- 1. Offerings catalogue
-- =======================================================
CREATE TABLE offerings (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    description  TEXT,
    type         TEXT,
    price        REAL,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT
);

-- =======================================================
-- 2. Companies / Accounts
-- =======================================================
CREATE TABLE companies (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    industry    TEXT,
    website     TEXT,
    address     TEXT,
    city        TEXT,
    state       TEXT,
    country     TEXT,
    phone       TEXT,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT
);

-- =======================================================
-- 3. Users (login identities)
-- =======================================================
CREATE TABLE users (
    id            TEXT PRIMARY KEY,
    username      TEXT UNIQUE NOT NULL,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT,
    azure_ad_id   TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT,
    is_active     INTEGER DEFAULT 1 CHECK (is_active IN (0,1))
);

-- =======================================================
-- 4. Sales reps (depends on users)
-- =======================================================
CREATE TABLE sales_reps (
    id          TEXT PRIMARY KEY,
    manager_id  TEXT,
    user_id     TEXT NOT NULL UNIQUE,
    region      TEXT,
    hire_date   TEXT,
    is_active   INTEGER DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT,
    FOREIGN KEY (manager_id) REFERENCES sales_reps(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id)    REFERENCES users(id)      ON DELETE CASCADE
);

CREATE INDEX idx_sales_reps_region  ON sales_reps(region);
CREATE INDEX idx_sales_reps_manager ON sales_reps(manager_id);

-- =======================================================
-- 5. Contacts (depends on companies)
-- =======================================================
CREATE TABLE contacts (
    id            TEXT PRIMARY KEY,
    first_name    TEXT,
    last_name     TEXT,
    email         TEXT,
    phone         TEXT,
    contact_type  TEXT,
    company_id    TEXT,
    owner_user_id TEXT,
    address       TEXT,
    city          TEXT,
    state_province TEXT,
    postal_code   TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    updated_at    TEXT,
    FOREIGN KEY (company_id)   REFERENCES companies(id) ON DELETE SET NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_contacts_company ON contacts(company_id);

-- =======================================================
-- 6. Deals (depends on contacts, companies, sales_reps)
-- =======================================================
CREATE TABLE deals (
    id           TEXT PRIMARY KEY,
    title        TEXT,
    amount       REAL,
    stage        TEXT,
    close_date   TEXT,
    contact_id   TEXT,
    company_id   TEXT,
    sales_rep_id TEXT,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT,
    FOREIGN KEY (contact_id)   REFERENCES contacts(id)    ON DELETE SET NULL,
    FOREIGN KEY (company_id)   REFERENCES companies(id)   ON DELETE SET NULL,
    FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id)  ON DELETE SET NULL
);

CREATE INDEX idx_deals_company   ON deals(company_id);
CREATE INDEX idx_deals_sales_rep ON deals(sales_rep_id);

-- =======================================================
-- 7. Communications / touchpoints
-- =======================================================
CREATE TABLE communications (
    id                  TEXT PRIMARY KEY,
    contact_id          TEXT,
    company_id          TEXT,
    sales_rep_id        TEXT,
    subject             TEXT,
    body                TEXT,
    communication_type  TEXT,
    timestamp           TEXT,
    created_at          TEXT DEFAULT (datetime('now')),
    updated_at          TEXT,
    FOREIGN KEY (contact_id)   REFERENCES contacts(id)   ON DELETE SET NULL,
    FOREIGN KEY (company_id)   REFERENCES companies(id)  ON DELETE SET NULL,
    FOREIGN KEY (sales_rep_id) REFERENCES sales_reps(id) ON DELETE SET NULL
);

CREATE INDEX idx_comm_timestamp ON communications(timestamp);

-- =======================================================
-- 8. Deal line‑items (bridge table: deals ↔ offerings)
-- =======================================================
CREATE TABLE deal_offerings (
    id           TEXT PRIMARY KEY,
    deal_id      TEXT NOT NULL,
    offering_id  TEXT NOT NULL,
    quantity     INTEGER DEFAULT 1 CHECK (quantity > 0),
    price        REAL,
    created_at   TEXT DEFAULT (datetime('now')),
    updated_at   TEXT,
    FOREIGN KEY (deal_id)     REFERENCES deals(id)     ON DELETE CASCADE,
    FOREIGN KEY (offering_id) REFERENCES offerings(id) ON DELETE RESTRICT,
    UNIQUE (deal_id, offering_id)
);

CREATE INDEX idx_deal_offerings_deal ON deal_offerings(deal_id);

-- =======================================================
-- End of schema
-- =======================================================
