import { sqliteTable, text, integer, real, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// 1. Offerings catalogue
export const offerings = sqliteTable('offerings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type'),
  price: real('price'),
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 2. Companies / Accounts
export const companies = sqliteTable('companies', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  website: text('website'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  phone: text('phone'),
  email: text('email'),
  industry: text('industry'),
  description: text('description'),
  employees: integer('employees'),
  revenue: text('revenue'),
  founded: text('founded'),
  // Lead management fields
  lead_status: text('lead_status'), // 'prospect', 'qualified', 'opportunity', 'customer', 'lost'
  lead_temperature: text('lead_temperature'), // 'cold', 'warm', 'hot'
  lead_source: text('lead_source'), // 'website', 'referral', 'cold_call', 'trade_show', 'social_media'
  lead_assigned_date: text('lead_assigned_date'),
  lead_owner_id: integer('lead_owner_id'), // FK to users/sales_reps
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 3. Users (login identities)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: text('role'),
  azure_ad_id: text('azure_ad_id'),
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
});

// 4. Sales reps (depends on users)
export const sales_reps = sqliteTable('sales_reps', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  manager_id: integer('manager_id'),
  user_id: integer('user_id').notNull().unique(),
  region: text('region'),
  hire_date: text('hire_date'),
  is_active: integer('is_active', { mode: 'boolean' }).default(true),
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 5. Contacts (depends on companies)
export const contacts = sqliteTable('contacts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  first_name: text('first_name'),
  last_name: text('last_name'),
  email: text('email'),
  phone: text('phone'),
  contact_type: text('contact_type'),
  company_id: integer('company_id'),
  owner_user_id: integer('owner_user_id'),
  address: text('address'),
  city: text('city'),
  state_province: text('state_province'),
  postal_code: text('postal_code'),
  is_primary: integer('is_primary', { mode: 'boolean' }).default(false),
  // Lead management fields
  individual_lead_status: text('individual_lead_status'), // For contacts without company
  is_lead_contact: integer('is_lead_contact', { mode: 'boolean' }).default(false), // Primary contact for company lead
  lead_source: text('lead_source'), // Source of this individual lead
  lead_assigned_date: text('lead_assigned_date'),
  lead_owner_id: integer('lead_owner_id'), // FK to users/sales_reps
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 6. Deals (depends on contacts, companies, sales_reps)
export const deals = sqliteTable('deals', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  amount: real('amount'),
  stage: text('stage'),
  close_date: text('close_date'),
  contact_id: integer('contact_id'),
  company_id: integer('company_id'),
  sales_rep_id: integer('sales_rep_id'),
  offering_id: integer('offering_id'), // Link to products/services
  deal_notes: text('deal_notes'), // Deal notes field
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
});

// Deal Documents table for file uploads
export const deal_documents = sqliteTable('deal_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deal_id: integer('deal_id').notNull(),
  filename: text('filename').notNull(),
  original_name: text('original_name').notNull(),
  file_size: integer('file_size'),
  file_type: text('file_type'),
  file_path: text('file_path').notNull(),
  uploaded_by: integer('uploaded_by'),
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
});

// 7. Communications / touchpoints
export const communications = sqliteTable('communications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  contact_id: integer('contact_id'),
  company_id: integer('company_id'),
  sales_rep_id: integer('sales_rep_id'),
  subject: text('subject'),
  body: text('body'),
  communication_type: text('communication_type'),
  timestamp: text('timestamp'),
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
});

// 8. Deal line‑items (bridge table: deals ↔ offerings)
export const deal_offerings = sqliteTable('deal_offerings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  deal_id: integer('deal_id').notNull(),
  offering_id: integer('offering_id').notNull(),
  quantity: integer('quantity').default(1),
  price: real('price'),
  created_at: text('created_at', { mode: 'text' }).default(sql`(datetime('now'))`),
  updated_at: text('updated_at', { mode: 'text' }),
},
  (table) => ({
    dealOfferingUnique: uniqueIndex('dealOfferingUnique').on(table.deal_id, table.offering_id)
  })
);
