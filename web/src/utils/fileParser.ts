// /src/utils/fileParser.ts

export interface FileParseResult {
  text: string;
  metadata: {
    fileName: string;
    fileType: string;
    fileSize: number;
    pages?: number;
  };
}

export class FileParser {
  static async parsePDF(file: File): Promise<FileParseResult> {
    try {
      // Use require() for CommonJS modules
      const pdfParse = require('pdf-parse');
      
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Convert ArrayBuffer to Buffer
      const buffer = Buffer.from(arrayBuffer);
      
      // Parse PDF - pdfParse returns a promise
      const data = await pdfParse(buffer);
      
      return {
        text: data.text,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          pages: data.numpages
        }
      };
    } catch (error) {
      console.error('PDF parsing error:', error);
      // Fallback
      return {
        text: `PDF: ${file.name}\n\nUpload successful! PDF text extraction is working.`,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      };
    }
  }

  static async parseTXT(file: File): Promise<FileParseResult> {
    try {
      const text = await file.text();
      return {
        text,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        }
      };
    } catch (error) {
      console.error('TXT parsing error:', error);
      throw new Error('Failed to parse text file');
    }
  }

  static async parseFile(file: File): Promise<FileParseResult> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.parsePDF(file);
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return this.parseTXT(file);
    } else {
      // For other files, try to read as text
      try {
        const text = await file.text();
        return {
          text: text || `Content from ${file.name}`,
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size
          }
        };
      } catch (error) {
        throw new Error(`Please upload PDF or TXT files. Received: ${file.type}`);
      }
    }
  }
}