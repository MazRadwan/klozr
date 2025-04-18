import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const customers = sqliteTable('customers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  status: text('status', { enum: ['Active', 'Inactive'] }).notNull(),
  createdAt: text('createdAt').notNull(),
  passwordHash: text('passwordHash'), // nullable for federated users
});

export const deals = sqliteTable('deals', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  amount: real('amount').notNull(),
  stage: text('stage').notNull(),
  probability: real('probability').notNull(),
  closeDate: text('closeDate').notNull(),
  customerId: text('customerId').notNull(),
});
