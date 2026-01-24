'use client';

import { useState } from 'react';
import { Button, Card, Input, message, Typography } from 'antd';

const { TextArea } = Input;
const { Title, Paragraph } = Typography;

export default function TestPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState('');

  const testGemini = async () => {
    if (!text.trim()) {
      message.warning('Please enter some text');
      return;
    }

    setLoading(true);
    setResponse(null);
    setError('');

    try {
      console.log('📤 Sending request to /api/generate...');
      
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      console.log('📥 Response received:', data);

      if (data.success) {
        setResponse(data);
        message.success(`Generated ${data.materials?.length || 0} study materials!`);
      } else {
        setError(data.error || 'Unknown error');
        message.error('Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (err: any) {
      console.error('❌ Fetch error:', err);
      setError(err.message);
      message.error('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>🧪 Gemini API Test</Title>
      <Paragraph>
        Test if your Gemini API is working by pasting lecture text below.
      </Paragraph>

      <Card title="Test Input" style={{ marginBottom: 24 }}>
        <TextArea
          rows={6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste lecture text here... (at least 100 characters for good results)"
          style={{ marginBottom: 16 }}
        />
        
        <Button 
          type="primary" 
          onClick={testGemini}
          loading={loading}
          size="large"
        >
          {loading ? 'Generating...' : 'Test Generate Study Materials'}
        </Button>
      </Card>

      {error && (
        <Card title="❌ Error" style={{ marginBottom: 24, borderColor: '#ff4d4f' }}>
          <pre style={{ color: '#ff4d4f', whiteSpace: 'pre-wrap' }}>
            {error}
          </pre>
        </Card>
      )}

      {response && (
        <Card title="✅ API Response">
          <Title level={4}>Status: {response.success ? 'Success' : 'Failed'}</Title>
          
          {response.rawResponse && (
            <div style={{ marginBottom: 24 }}>
              <Paragraph strong>Raw Gemini Response (first 300 chars):</Paragraph>
              <pre style={{ 
                backgroundColor: '#f6f8fa', 
                padding: 12, 
                borderRadius: 6,
                overflow: 'auto',
                fontSize: 12
              }}>
                {response.rawResponse}
              </pre>
            </div>
          )}

          {response.materials && (
            <div>
              <Paragraph strong>Generated Materials ({response.materials.length}):</Paragraph>
              {response.materials.map((material: any, index: number) => (
                <Card 
                  key={material.id} 
                  size="small" 
                  style={{ marginBottom: 12 }}
                  title={`${index + 1}. ${material.type.toUpperCase()}`}
                >
                  <Paragraph strong>Content:</Paragraph>
                  <Paragraph>{material.content}</Paragraph>
                  
                  {material.explanation && (
                    <>
                      <Paragraph strong>Explanation:</Paragraph>
                      <Paragraph type="secondary">{material.explanation}</Paragraph>
                    </>
                  )}
                  
                  {material.tags && material.tags.length > 0 && (
                    <>
                      <Paragraph strong>Tags:</Paragraph>
                      <div>
                        {material.tags.map((tag: string) => (
                          <span key={tag} style={{
                            backgroundColor: '#e6f7ff',
                            padding: '2px 8px',
                            borderRadius: 4,
                            marginRight: 8,
                            fontSize: 12
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <Button 
              onClick={() => {
                console.log('Full response object:', response);
                alert('Check browser console for full response object');
              }}
            >
              View Full Response in Console
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}