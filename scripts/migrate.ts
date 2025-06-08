import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../src/lib/db';

migrate(db, { migrationsFolder: './drizzle' });

console.log('Migration completed successfully!');
