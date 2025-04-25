import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    console.log('POST /api/upload - Starting');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('POST /api/upload - No file received');
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }
    
    console.log(`POST /api/upload - File received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      console.log(`POST /api/upload - Invalid file type: ${file.type}`);
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      console.log(`POST /api/upload - File too large: ${file.size} bytes`);
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }
    
    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = join(process.cwd(), 'public', 'uploads', fileName);
    
    console.log(`POST /api/upload - Saving file to: ${filePath}`);
    
    // Convert the file to a Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Write the file to disk
    await writeFile(filePath, buffer);
    
    console.log(`POST /api/upload - File saved successfully`);
    
    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${fileName}`;
    return NextResponse.json({ url: fileUrl }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}
