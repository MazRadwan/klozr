import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { contacts } from '@/lib/schema';
import fs from 'fs';
import path from 'path';

export async function POST(_req: NextRequest) {
  try {
    const jsonPath = path.resolve(process.cwd(), 'src/data/contacts.json');
    const fileContents = fs.readFileSync(jsonPath, 'utf-8');
    const data = JSON.parse(fileContents);
    db.delete(contacts).run(); // Clear existing
    db.insert(contacts).values(data).run();
    return NextResponse.json({ status: 'seeded', count: data.length });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: error.message || error.toString() }, { status: 500 });
  }
}
