"use client";

import { Layout, Typography, Space, Card, Button, Upload, Divider, Input, message, Alert } from "antd";
import { UploadOutlined, SaveOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedDeck, setGeneratedDeck] = useState<any>(null);
  const router = useRouter();

  const handleGenerate = async () => {
    if (!text.trim()) {
      message.error('Please paste some text first!');
      return;
    }

    setLoading(true);
    setGeneratedDeck(null);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        message.success(`Generated ${data.materials?.length || 0} study materials!`);
        
        // Create a deck from the generated materials
        const deckId = `deck_${Date.now()}`;
        const deck = {
          id: deckId,
          title: `Study: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`,
          materials: data.materials,
          sourceText: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
          generatedAt: new Date().toISOString()
        };
        
        setGeneratedDeck(deck);
        
        // Auto-save to account
        saveDeckToAccount(deck);
        
        // Store in session storage for immediate viewing
        sessionStorage.setItem('currentDeck', JSON.stringify(deck));
        
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

  // Function to save deck to account
  const saveDeckToAccount = (deck: any) => {
    try {
      // Load existing decks
      const existingDecks = JSON.parse(localStorage.getItem('studyDecks') || '[]');
      
      // Check if deck already exists (by ID)
      const existingIndex = existingDecks.findIndex((d: any) => d.id === deck.id);
      
      if (existingIndex >= 0) {
        // Update existing deck
        existingDecks[existingIndex] = deck;
      } else {
        // Add new deck
        existingDecks.push(deck);
      }
      
      // Save back to localStorage
      localStorage.setItem('studyDecks', JSON.stringify(existingDecks));
      
      message.success('✅ Deck saved to your account!');
      
      // Update user stats
      updateUserStats(existingDecks);
      
    } catch (error) {
      console.error('Error saving deck:', error);
      message.error('Failed to save deck');
    }
  };

  // Update user study stats
  const updateUserStats = (decks: any[]) => {
    try {
      const user = JSON.parse(localStorage.getItem('studytoks_user') || 'null');
      if (!user) return;
      
      const totalFlashcards = decks.reduce((total: number, deck: any) => 
        total + deck.materials.filter((m: any) => m.type === 'flashcard').length, 0);
      
      user.studyStats = {
        ...user.studyStats,
        totalDecks: decks.length,
        totalFlashcards: totalFlashcards
      };
      
      localStorage.setItem('studytoks_user', JSON.stringify(user));
      
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setText(content);
      message.success('File uploaded successfully!');
    };
    
    reader.readAsText(file);
    return false; // Prevent default upload
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <Title level={4} style={{ color: "white", margin: 0 }}>
          StudyToks - AI Study Assistant
        </Title>
      </Header>

      <Content style={{ padding: 16, maxWidth: 520, width: "100%", margin: "0 auto" }}>
        <Space direction="vertical" size="large" style={{ width: "100%", marginTop: 8 }}>
          <div>
            <Title level={2} style={{ marginBottom: 0 }}>
              Class Notes → Short Form Study
            </Title>
            <Text type="secondary">
              Upload notes or slides and generate topic shorts, flashcards, and quick quizzes.
            </Text>
          </div>

          <Card>
            <Title level={4} style={{ marginTop: 0 }}>Upload</Title>
            <Paragraph type="secondary" style={{ marginTop: 0 }}>
              Start with a PDF of slides or a TXT export of notes.
            </Paragraph>

            <Upload 
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }} 
              maxCount={1} 
              accept=".pdf,.txt"
              showUploadList={false}
            >
              <Button icon={<UploadOutlined />}>Choose file</Button>
            </Upload>

            <Divider>Or paste text:</Divider>

            <TextArea
              rows={6}
              placeholder="Paste lecture notes here... (e.g., Photosynthesis is the process by which plants convert light energy into chemical energy...)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Divider />

            <Space direction="vertical" style={{ width: "100%" }}>
              <Button 
                type="primary" 
                block 
                onClick={handleGenerate}
                loading={loading}
                disabled={!text.trim()}
                size="large"
              >
                {loading ? 'Generating study materials...' : 'Generate study shorts'}
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
                  <span>Generated Study Deck</span>
                </Space>
              }
              style={{ marginTop: 16 }}
            >
              <Alert
                message="Deck Saved Successfully!"
                description={`"${generatedDeck.title}" has been saved to your account.`}
                type="success"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <div style={{ marginTop: 16 }}>
                <Text strong>Preview:</Text>
                <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {generatedDeck.materials.slice(0, 3).map((material: any, index: number) => (
                    <div key={material.id} style={{ 
                      padding: '8px 12px', 
                      marginBottom: 8, 
                      borderLeft: `4px solid ${
                        material.type === 'flashcard' ? '#1890ff' : 
                        material.type === 'summary' ? '#52c41a' : '#722ed1'
                      }`,
                      backgroundColor: '#fafafa',
                      borderRadius: 4
                    }}>
                      <Space align="start">
                        <div style={{ 
                          width: 8, 
                          height: 8, 
                          borderRadius: '50%',
                          backgroundColor: 
                            material.type === 'flashcard' ? '#1890ff' : 
                            material.type === 'summary' ? '#52c41a' : '#722ed1',
                          marginTop: 6
                        }} />
                        <div style={{ flex: 1 }}>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {material.type.toUpperCase()}
                          </Text>
                          <Paragraph style={{ margin: '4px 0 0 0' }} ellipsis={{ rows: 2 }}>
                            {material.type === 'flashcard' 
                              ? material.content.split('?')[0] + '?' 
                              : material.content.substring(0, 80) + (material.content.length > 80 ? '...' : '')
                            }
                          </Paragraph>
                        </div>
                      </Space>
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid #f0f0f0'
                }}>
                  <Button 
                    type="primary"
                    onClick={() => {
                      sessionStorage.setItem('currentDeck', JSON.stringify(generatedDeck));
                      router.push('/results');
                    }}
                  >
                    Open in Study Mode
                  </Button>
                  
                  <Space>
                    <Button 
                      onClick={() => router.push('/account')}
                      icon={<SaveOutlined />}
                    >
                      View Account
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        // Create a copy
                        const newDeck = { ...generatedDeck, id: `deck_${Date.now()}` };
                        saveDeckToAccount(newDeck);
                        message.success('Another copy saved!');
                      }}
                    >
                      Save Another Copy
                    </Button>
                  </Space>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <Title level={5} style={{ marginTop: 0 }}>What you'll get</Title>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>📚 Flashcards with questions and answers</li>
              <li>📝 Concise summaries of key concepts</li>
              <li>💡 Important concepts with explanations</li>
              <li>💾 Auto-saved to your account</li>
              <li>📱 TikTok-style study interface</li>
              <li>📊 Progress tracking</li>
            </ul>
          </Card>
        </Space>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">Private by default • Built for phones • Powered by Gemini AI</Text>
      </Footer>
    </Layout>
  );
}