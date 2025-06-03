import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';

// 1. Offerings catalogue
export const offerings = sqliteTable('offerings', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type'),
  price: real('price'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 2. Companies / Accounts
export const companies = sqliteTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  website: text('website'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  phone: text('phone'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 3. Users (login identities)
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role'),
  azure_ad_id: text('azure_ad_id'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
});

// 4. Sales reps (depends on users)
export const sales_reps = sqliteTable('sales_reps', {
  id: text('id').primaryKey(),
  manager_id: text('manager_id'),
  user_id: text('user_id').notNull().unique(),
  region: text('region'),
  hire_date: text('hire_date'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 5. Contacts (depends on companies)
export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey(),
  first_name: text('first_name'),
  last_name: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  contact_type: text('contact_type'),
  company_id: text('company_id'),
  owner_user_id: text('owner_user_id'),
  address: text('address'),
  city: text('city'),
  state_province: text('state_province'),
  postal_code: text('postal_code'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 6. Deals (depends on contacts, companies, sales_reps)
export const deals = sqliteTable('deals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: real('amount'),
  stage: text('stage'),
  close_date: text('close_date'),
  contact_id: text('contact_id'),
  company_id: text('company_id'),
  sales_rep_id: text('sales_rep_id'),
  offering_id: text('offering_id'), // Link to products/services
  deal_notes: text('deal_notes'), // Deal notes field
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
});

// Deal Documents table for file uploads
export const deal_documents = sqliteTable('deal_documents', {
  id: text('id').primaryKey(),
  deal_id: text('deal_id').notNull(),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_size: integer('file_size'),
  file_type: text('file_type'),
  file_path: text('file_path').notNull(),
  uploaded_by: text('uploaded_by'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
});

// 7. Communications / touchpoints
export const communications = sqliteTable('communications', {
  id: text('id').primaryKey(),
  contact_id: text('contact_id'),
  company_id: text('company_id'),
  sales_rep_id: text('sales_rep_id'),
  subject: text('subject'),
  body: text('body'),
  communication_type: text('communication_type'),
  timestamp: text('timestamp'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 8. Deal line‑items (bridge table: deals ↔ offerings)
export const deal_offerings = sqliteTable('deal_offerings', {
  id: text('id').primaryKey(),
  deal_id: text('deal_id').notNull(),
  offering_id: text('offering_id').notNull(),
  quantity: integer('quantity').default(1),
  price: real('price'),
  created_at: text('created_at', { mode: 'text' }).default("(datetime('now'))"),
  updated_at: text('updated_at', { mode: 'text' }),
},
  (table) => ({
    dealOfferingUnique: uniqueIndex('dealOfferingUnique').on(table.deal_id, table.offering_id)
  })
);
