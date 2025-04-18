import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { customers } from '@/lib/schema';
import fs from 'fs';
import path from 'path';

export async function POST(_req: NextRequest) {
  const jsonPath = path.resolve(process.cwd(), 'src/data/customers.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  db.delete(customers).run(); // Clear existing
  db.insert(customers).values(data).run();
  return NextResponse.json({ status: 'seeded', count: data.length });
}
