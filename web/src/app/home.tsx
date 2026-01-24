"use client";

import { Layout, Typography, Space, Card, Button, Upload, Divider, Input, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from 'react';

const { Header, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function Home() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) {
      message.error('Please paste some text first!');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      
      if (response.ok) {
        message.success(`Gemini responded! ${data.inputLength} chars processed`);
        console.log('Gemini raw response:', data.rawResponse);
        
        // For now, just show in console
        // Later you can parse JSON and display results
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

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header style={{ display: "flex", alignItems: "center" }}>
        <Title level={4} style={{ color: "white", margin: 0 }}>
          HoyaHacks GEM
        </Title>
      </Header>

      <Content style={{ padding: 16, maxWidth: 520, width: "100%", margin: "0 auto" }}>
      <Space orientation="vertical" size="large" style={{ width: "100%", marginTop: 8 }}>
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

            <Upload beforeUpload={() => false} maxCount={1} accept=".pdf,.txt">
              <Button icon={<UploadOutlined />}>Choose file</Button>
            </Upload>

            <Divider>Or paste text:</Divider>

            {/* ADDED: Text area for direct input */}
            <TextArea
              rows={4}
              placeholder="Paste lecture notes here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ marginBottom: 16 }}
            />

            <Divider />

            <Space orientation="vertical" style={{ width: "100%" }}>
              {/* MODIFIED: This button now calls Gemini */}
              <Button 
                type="primary" 
                block 
                onClick={handleGenerate}
                loading={loading}
                disabled={!text.trim()}
              >
                {loading ? 'Calling Gemini API...' : 'Generate study shorts'}
              </Button>
              
              <Button block href="/feed">
                View sample feed
              </Button>
            </Space>
          </Card>

          <Card>
            <Title level={5} style={{ marginTop: 0 }}>What you'll get (MVP)</Title>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>3–8 key topics extracted from your upload</li>
              <li>Flashcards per topic</li>
              <li>5-question quiz per topic</li>
              <li>60–90 second "short lesson" script</li>
            </ul>
          </Card>
        </Space>
      </Content>

      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">Private by default • Built for phones</Text>
      </Footer>
    </Layout>
  );
}