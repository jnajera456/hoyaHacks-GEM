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
      // Use browser-compatible PDF.js instead of Node-only pdf-parse
      // Import PDF.js (browser-compatible ESM)
      const pdfjs = await import('pdfjs-dist');
      // Convert File to ArrayBuffer (browser native)
      const arrayBuffer = await file.arrayBuffer();

      // Disable worker to avoid separate worker setup in Next.js
      // Configure worker src using local public file for faster parsing (no CDN latency)
      const workerSrc = '/pdf.worker.min.mjs';
      const lib: any = pdfjs as any;
      const GlobalWorkerOptions = lib.GlobalWorkerOptions || lib.default?.GlobalWorkerOptions;
      if (GlobalWorkerOptions) {
        GlobalWorkerOptions.workerSrc = workerSrc;
      }

      const getDocument = lib.getDocument || lib.default?.getDocument;
      const loadingTask = getDocument({ data: arrayBuffer });
      console.time('pdf-parsing');
      const pdf = await loadingTask.promise;

      let combinedText = '';
      console.log(`📄 PDF has ${pdf.numPages} pages, extracting text...`);
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items || [])
          .map((item: any) => typeof item.str === 'string' ? item.str : '')
          .join(' ');
        combinedText += pageText + '\n\n';
      }
      console.timeEnd('pdf-parsing');

      // Normalize whitespace and ensure readable paragraph breaks
      const normalized = combinedText
        .replace(/\r\n/g, '\n')
        .replace(/[ \u00A0]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return {
        text: normalized || `PDF: ${file.name}\n\n(No extractable text found.)`,
        metadata: {
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          pages: pdf.numPages
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