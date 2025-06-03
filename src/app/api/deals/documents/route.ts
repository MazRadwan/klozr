import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { db } from '@/lib/db';
import { deal_documents } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const dealId = formData.get('dealId') as string;
    
    if (!file || !dealId) {
      return NextResponse.json({ error: 'File and deal ID are required' }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'public', 'temp', 'deal-documents');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `${dealId}-${timestamp}.${fileExtension}`;
    const filePath = join(uploadDir, filename);
    
    // Convert file to buffer and write to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save file metadata to database
    const documentId = `doc-${timestamp}`;
    const relativePath = `/temp/deal-documents/${filename}`;
    
    const document = {
      id: documentId,
      deal_id: dealId,
      filename: filename,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      file_path: relativePath,
      uploaded_by: 'current-user', // TODO: Get from session
    };

    db.insert(deal_documents).values(document).run();

    return NextResponse.json({ 
      success: true, 
      document,
      message: 'File uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dealId = searchParams.get('dealId');
    
    if (!dealId) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const documents = db
      .select()
      .from(deal_documents)
      .where(eq(deal_documents.deal_id, dealId))
      .all();

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
} 