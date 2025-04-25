import { NextRequest } from 'next/server';
import { POST } from '@/app/api/upload/route';
import fs from 'fs/promises';
import path from 'path';

// Mock FormData and File
global.FormData = class FormData {
  private data = new Map();
  
  append(key: string, value: any) {
    this.data.set(key, value);
  }
  
  get(key: string) {
    return this.data.get(key);
  }
};

global.File = class File {
  name: string;
  type: string;
  size: number;
  private content: Buffer;
  
  constructor(bits: BlobPart[], name: string, options?: FilePropertyBag) {
    this.name = name;
    this.type = options?.type || 'image/jpeg';
    this.content = Buffer.from(bits[0] as string);
    this.size = this.content.length;
  }
  
  async arrayBuffer() {
    return this.content.buffer;
  }
};

// Mock fs/promises
jest.mock('fs/promises', () => ({
  writeFile: jest.fn().mockResolvedValue(undefined),
  mkdir: jest.fn().mockResolvedValue(undefined)
}));

describe('Upload API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/upload', () => {
    it('should upload an image file', async () => {
      // Create a mock file
      const file = new File(['test image content'], 'test-image.jpg', { type: 'image/jpeg' });
      
      // Create a mock FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Mock the request.formData() method
      req.formData = jest.fn().mockResolvedValue(formData);
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(201);
      expect(data.url).toMatch(/^\/uploads\/[a-f0-9-]+\.jpg$/);
      
      // Check that writeFile was called
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('/public/uploads/'),
        expect.any(Buffer)
      );
    });

    it('should return 400 if no file is provided', async () => {
      // Create a mock FormData without a file
      const formData = new FormData();
      
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Mock the request.formData() method
      req.formData = jest.fn().mockResolvedValue(formData);
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data.error).toBe('No file received');
      
      // Check that writeFile was not called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should return 400 if file is not an image', async () => {
      // Create a mock file that is not an image
      const file = new File(['test document content'], 'test-doc.txt', { type: 'text/plain' });
      
      // Create a mock FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Mock the request.formData() method
      req.formData = jest.fn().mockResolvedValue(formData);
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data.error).toBe('File must be an image');
      
      // Check that writeFile was not called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });

    it('should return 400 if file is too large', async () => {
      // Create a mock large file (6MB)
      const largeContent = Buffer.alloc(6 * 1024 * 1024).fill('a').toString();
      const file = new File([largeContent], 'large-image.jpg', { type: 'image/jpeg' });
      
      // Create a mock FormData
      const formData = new FormData();
      formData.append('file', file);
      
      // Create a mock request
      const req = new NextRequest('http://localhost:3000/api/upload', {
        method: 'POST',
        body: formData
      });
      
      // Mock the request.formData() method
      req.formData = jest.fn().mockResolvedValue(formData);
      
      // Call the API
      const response = await POST(req);
      const data = await response.json();
      
      // Check the response
      expect(response.status).toBe(400);
      expect(data.error).toBe('File size must be less than 5MB');
      
      // Check that writeFile was not called
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });
});
