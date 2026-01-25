"use client";
import { Layout, Typography, Space, Card, Button, Upload, Divider, Input, message, Alert, Progress, Tag } from "antd";
import { UploadOutlined, FilePdfOutlined, VideoCameraOutlined, FileTextOutlined, CloseOutlined, CheckCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FileParser, FileParseResult } from '@/utils/fileParser';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface UploadedFile {
  file: File;
  parsedContent?: FileParseResult;
  status: 'uploading' | 'parsing' | 'ready' | 'error';
  progress?: number;
}

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [generatedDeck, setGeneratedDeck] = useState<any>(null);
  const router = useRouter();

  const handleFileUpload = async (file: File) => {
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      message.error('File size must be less than 10MB');
      return false;
    }

    // Add file to state
    const uploadedFile: UploadedFile = {
      file,
      status: 'uploading'
    };
    
    setUploadedFiles(prev => [...prev, uploadedFile]);

    // Parse file content
    try {
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'parsing', progress: 25 } : f)
      );

      const parsedContent = await FileParser.parseFile(file);

      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { 
          ...f, 
          parsedContent, 
          status: 'ready', 
          progress: 100 
        } : f)
      );

      message.success(`Successfully processed ${file.name}`);
      
      // NO AUTO-SWITCH to text tab - files stay separate

    } catch (error: any) {
      console.error('File parsing error:', error);
      setUploadedFiles(prev => 
        prev.map(f => f.file === file ? { ...f, status: 'error' } : f)
      );
      message.error(`Failed to process ${file.name}: ${error.message}`);
    }
    
    return false;
  };

  const removeFile = (fileToRemove: File) => {
    setUploadedFiles(prev => prev.filter(f => f.file !== fileToRemove));
  };

  const handleGenerate = async () => {
    // Determine source: uploaded file OR text input
    let contentToSend = '';
    let fileName = '';
    let fileType = '';

    // Priority: Use uploaded file if available, otherwise use text
    const readyFile = uploadedFiles.find(f => f.status === 'ready');
    
    if (readyFile && readyFile.parsedContent) {
      // Use file content (already normalized by parser)
      contentToSend = readyFile.parsedContent.text;
      fileName = readyFile.file.name;
      fileType = readyFile.file.type;
    } else if (text.trim()) {
      // Use text input (normalize it for consistency with file parsing)
      contentToSend = text
        .replace(/\r\n/g, '\n')        // CRLF → LF
        .replace(/[ \u00A0]+/g, ' ')   // Collapse repeated spaces
        .replace(/\n{3,}/g, '\n\n')    // Collapse 3+ newlines to 2
        .trim();
    } else {
      message.error('Please upload a file or paste some text first!');
      return;
    }

    // Validate content length before sending to Gemini
    const MAX_CONTENT_LENGTH = 10000;
    if (contentToSend.length > MAX_CONTENT_LENGTH) {
      message.warning(`Content exceeds ${MAX_CONTENT_LENGTH} characters. Truncating...`);
      contentToSend = contentToSend.substring(0, MAX_CONTENT_LENGTH) + '\n... [truncated]';
    }

    if (contentToSend.length < 50) {
      message.error('Content is too short. Please provide at least 50 characters.');
      return;
    }

    console.log('📤 Sending to Gemini:', {
      source: readyFile ? `File: ${fileName}` : 'Text input',
      contentLength: contentToSend.length,
      pageCount: readyFile?.parsedContent?.metadata.pages
    });

    setLoading(true);
    setGeneratedDeck(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: contentToSend,
          fileName,
          fileType
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const sourceType = readyFile ? `file "${fileName}"` : 'text';
        message.success(`✅ Generated ${data.materials?.length || 0} study materials from ${sourceType}!`);
        
        // Create deck from response
        const deck = data.deck || {
          id: `deck_${Date.now()}`,
          title: readyFile 
            ? `Study: ${fileName}`
            : `Study: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
          materials: data.materials,
          sourceText: contentToSend.substring(0, 500) + (contentToSend.length > 500 ? '...' : ''),
          sourceFile: readyFile ? { name: fileName, type: fileType } : undefined,
          generatedAt: new Date().toISOString()
        };
        
        setGeneratedDeck(deck);
        // Store for immediate viewing
        sessionStorage.setItem('currentDeck', JSON.stringify(deck));
        if (data.savedDeckId) {
          sessionStorage.setItem('currentDeckId', data.savedDeckId);
        }
        
      } else {
        message.error(`API error: ${data.error || response.status}`);
      }
    } catch (error) {
      message.error('Network error - check console');
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Persistence handled server-side in /api/generate
  const saveDeckToAccount = (_deck: any) => {};


  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    if (fileType.includes('video')) return <VideoCameraOutlined style={{ color: '#1890ff' }} />;
    if (fileType.includes('audio')) return <VideoCameraOutlined style={{ color: '#52c41a' }} />;
    return <FileTextOutlined />;
  };

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: "100vh" }}>
        <Content style={{ padding: 16, maxWidth: 520, width: "100%", margin: "0 auto" }}>
        <Space orientation="vertical" size="large" style={{ width: "100%", marginTop: 8 }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>
              Upload & Generate Study Materials
            </Title>
            <Text type="secondary">
              Upload files or paste text to create study decks, flashcards, and summaries.
            </Text>
          </div>

          <Card>
            {/* File Upload Section */}
            <div style={{ marginBottom: 24 }}>
              <Title level={4} style={{ marginTop: 0 }}>Upload File</Title>
              <Paragraph type="secondary">
                Upload PDF, TXT, video, or audio files.
              </Paragraph>

              <Upload 
                beforeUpload={handleFileUpload}
                maxCount={1}
                accept=".pdf,.txt,.mp4,.mov,.mp3,.wav"
                showUploadList={false}
              >
                <div style={{ 
                  border: '2px dashed #d9d9d9',
                  borderRadius: 8,
                  padding: 32,
                  textAlign: 'center',
                  cursor: 'pointer',
                  marginBottom: 16,
                  backgroundColor: '#fafafa'
                }}>
                  <UploadOutlined style={{ fontSize: 32, color: '#1890ff', marginBottom: 8 }} />
                  <div>
                    <Text strong>Click to upload file</Text>
                    <Paragraph type="secondary" style={{ margin: '4px 0 0 0' }}>
                      PDF, TXT, MP4, MP3 (max 10MB)
                    </Paragraph>
                  </div>
                </div>
              </Upload>

              {/* Uploaded Files List - Single file only */}
              {uploadedFiles.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong>Uploaded File:</Text>
                  <div style={{ marginTop: 8 }}>
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div 
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid #f0f0f0',
                          borderRadius: 6,
                          backgroundColor: '#fafafa'
                        }}
                      >
                        <div style={{ marginRight: 12 }}>
                          {getFileIcon(uploadedFile.file.type)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Text strong>{uploadedFile.file.name}</Text>
                            <Tag color={
                              uploadedFile.status === 'ready' ? 'success' :
                              uploadedFile.status === 'error' ? 'error' :
                              'processing'
                            }>
                              {uploadedFile.status}
                            </Tag>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {(uploadedFile.file.size / 1024).toFixed(1)} KB
                            </Text>
                            <Button 
                              type="text" 
                              size="small"
                              onClick={() => removeFile(uploadedFile.file)}
                              style={{ padding: 0, height: 'auto' }}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Divider>OR</Divider>

            {/* Text Input Section */}
            <div style={{ marginBottom: 24 }}>
              <Title level={4}>Paste Text</Title>
              <Paragraph type="secondary">
                Or paste your lecture notes, transcripts, or study material text.
              </Paragraph>

              <TextArea
                rows={6}
                placeholder="Paste your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ marginBottom: 16 }}
              />
            </div>

            <Divider />

            {/* Generate Button */}
            <Space orientation="vertical" style={{ width: "100%" }}>
              <Button 
                type="primary" 
                block 
                onClick={handleGenerate}
                loading={loading}
                disabled={!text.trim() && uploadedFiles.length === 0}
                size="large"
              >
                {loading ? 'Generating study materials...' : 'Generate Study Materials'}
              </Button>
              
              <Button block onClick={() => router.push('/account')}>
                View My Decks
              </Button>
            </Space>
          </Card>

          {/* Results Display */}
          {generatedDeck && (
            <Card 
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  <span>Study Materials Generated!</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <Alert
                message="Generation Complete!"
                description="Your study deck has been saved to your account."
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <div style={{ marginTop: 16 }}>
                <Text strong>What next?</Text>
                <div style={{ marginTop: 8 }}>
                  <Button 
                    type="primary"
                    block
                    onClick={() => {
                      sessionStorage.setItem('currentDeck', JSON.stringify(generatedDeck));
                      const id = sessionStorage.getItem('currentDeckId');
                      if (id) {
                        router.push(`/results?id=${encodeURIComponent(id)}`);
                      } else {
                        router.push('/results');
                      }
                    }}
                    style={{ marginBottom: 8 }}
                  >
                    Start Studying Now
                  </Button>
                  
                  <Button 
                    block
                    onClick={() => router.push('/account')}
                  >
                    Go to My Decks
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <Title level={5} style={{ marginTop: 0 }}>How it works</Title>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li><Text strong>Upload a file</Text> (PDF, TXT, video, audio) <strong>OR</strong> <Text strong>paste text</Text></li>
              <li>Click <Text strong>Generate Study Materials</Text></li>
              <li>Get flashcards, summaries, and concepts</li>
              <li>Study with TikTok-style interface</li>
              <li>All decks saved automatically</li>
            </ol>
          </Card>
        </Space>
      </Content>

        <Footer style={{ textAlign: "center" }}>
          <Text type="secondary">
            Upload files or paste text • Powered by Gemini AI
          </Text>
        </Footer>
      </Layout>
    </ProtectedRoute>
  );
}