'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  Button, 
  Tag, 
  Typography, 
  Space,
  message,
  Progress,
  Divider,
  Tooltip,
  Modal,
  Input,
  Switch
} from 'antd';
import {
  LeftOutlined,
  RightOutlined,
  SaveOutlined,
  ShareAltOutlined,
  SoundOutlined,
  CopyOutlined,
  HeartOutlined,
  HeartFilled,
  ArrowUpOutlined,
  HomeOutlined,
  CloseOutlined,
  EditOutlined,
  CheckOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  RedoOutlined
} from '@ant-design/icons';
import './results.css';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface StudyMaterial {
  type: 'flashcard' | 'summary' | 'concept';
  content: string;
  explanation?: string;
  tags?: string[];
  id: string;
}

interface GeneratedDeck {
  id: string;
  title: string;
  materials: StudyMaterial[];
  sourceText?: string;
  generatedAt: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [liked, setLiked] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(10);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Load deck from session storage
  useEffect(() => {
    const savedDeck = sessionStorage.getItem('currentDeck');
    if (savedDeck) {
      try {
        const parsedDeck = JSON.parse(savedDeck);
        setDeck(parsedDeck);
        setEditedTitle(parsedDeck.title);
        console.log('📦 Loaded deck:', parsedDeck);
        
        // Check if already saved
        const savedDecks = JSON.parse(localStorage.getItem('studyDecks') || '[]');
        const isAlreadySaved = savedDecks.some((d: GeneratedDeck) => d.id === parsedDeck.id);
        setIsSaved(isAlreadySaved);
      } catch (error) {
        console.error('Error loading deck:', error);
        message.error('Error loading deck');
        router.push('/');
      }
    } else {
      // Try to load from URL parameter
      const params = new URLSearchParams(window.location.search);
      const deckId = params.get('deckId');
      
      if (deckId) {
        const savedDecks = JSON.parse(localStorage.getItem('studyDecks') || '[]');
        const foundDeck = savedDecks.find((d: GeneratedDeck) => d.id === deckId);
        if (foundDeck) {
          setDeck(foundDeck);
          setEditedTitle(foundDeck.title);
          setIsSaved(true);
        } else {
          message.error('Deck not found');
          router.push('/account');
        }
      } else {
        router.push('/');
      }
    }
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!deck) return;
      
      if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setCurrentIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setCurrentIndex(deck.materials.length - 1);
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleShuffle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, currentIndex]);

  // Auto-advance
  useEffect(() => {
    if (!deck || !autoAdvance) return;
    
    const timer = setInterval(() => {
      handleNext();
    }, autoAdvanceSeconds * 1000);

    return () => clearInterval(timer);
  }, [deck, autoAdvance, autoAdvanceSeconds, currentIndex]);

  const handlePrev = () => {
    if (!deck) return;
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : deck.materials.length - 1));
    setShowAnswer(false);
  };

  const handleNext = useCallback(() => {
    if (!deck) return;
    setCurrentIndex(prev => (prev < deck.materials.length - 1 ? prev + 1 : 0));
    setShowAnswer(false);
  }, [deck]);

  const handleSaveDeck = () => {
    if (!deck) return;
    
    const decks = JSON.parse(localStorage.getItem('studyDecks') || '[]');
    
    // Check if already saved
    if (decks.some((d: GeneratedDeck) => d.id === deck.id)) {
      message.info('Deck already saved');
      return;
    }
    
    decks.push(deck);
    localStorage.setItem('studyDecks', JSON.stringify(decks));
    setIsSaved(true);
    message.success('Deck saved to your account!');
  };

  const handleUpdateTitle = () => {
    if (!deck) return;
    
    const updatedDeck = { ...deck, title: editedTitle };
    setDeck(updatedDeck);
    
    // Update in session storage
    sessionStorage.setItem('currentDeck', JSON.stringify(updatedDeck));
    
    // Update in localStorage if saved
    if (isSaved) {
      const decks = JSON.parse(localStorage.getItem('studyDecks') || '[]');
      const updatedDecks = decks.map((d: GeneratedDeck) => 
        d.id === deck.id ? updatedDeck : d
      );
      localStorage.setItem('studyDecks', JSON.stringify(updatedDecks));
    }
    
    setIsEditingTitle(false);
    message.success('Title updated!');
  };

  const toggleLike = (materialId: string) => {
    setLiked(prev => 
      prev.includes(materialId) 
        ? prev.filter(id => id !== materialId)
        : [...prev, materialId]
    );
  };

  const handleTextToSpeech = (text: string) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      speechSynthesis.speak(utterance);
    } else {
      message.warning('Text-to-speech not supported in your browser');
    }
  };

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard!');
  };

  const handleShuffle = () => {
    if (!deck) return;
    
    const shuffledMaterials = [...deck.materials]
      .sort(() => Math.random() - 0.5)
      .map((material, index) => ({
        ...material,
        id: `shuffled_${Date.now()}_${index}`
      }));
    
    const shuffledDeck = {
      ...deck,
      materials: shuffledMaterials,
      id: `shuffled_${Date.now()}`
    };
    
    setDeck(shuffledDeck);
    setCurrentIndex(0);
    sessionStorage.setItem('currentDeck', JSON.stringify(shuffledDeck));
    message.success('Deck shuffled!');
  };

  const handleMarkAsStudied = () => {
    if (!deck) return;
    
    // Log study session
    const sessions = JSON.parse(localStorage.getItem('studytoks_sessions') || '[]');
    const newSession = {
      id: `session_${Date.now()}`,
      deckId: deck.id,
      deckTitle: deck.title,
      date: new Date().toISOString(),
      duration: Math.floor(deck.materials.length * 0.5), // 30 seconds per card
      score: 85, // Default score
      cardsStudied: deck.materials.length
    };
    
    sessions.unshift(newSession);
    localStorage.setItem('studytoks_sessions', JSON.stringify(sessions));
    
    message.success('Study session logged!');
  };

  if (!deck) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 20
      }}>
        <Progress type="circle" percent={100} status="active" />
        <Text type="secondary">Loading study deck...</Text>
        <Button onClick={() => router.push('/')}>
          Go Back Home
        </Button>
      </div>
    );
  }

  const currentMaterial = deck.materials[currentIndex];

  return (
    <div className="results-container" ref={containerRef}>
      {/* Header */}
      <div className="results-header">
        <Button 
          icon={<HomeOutlined />} 
          onClick={() => router.push('/')}
          type="text"
          size="large"
        >
          Home
        </Button>
        
        <Space>
          <Tooltip title="Settings">
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => setShowSettings(true)}
              type="text"
              size="large"
            />
          </Tooltip>
          
          <Text type="secondary">
            {currentIndex + 1} / {deck.materials.length}
          </Text>
          
          {!isSaved && (
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveDeck}
              size="middle"
            >
              Save Deck
            </Button>
          )}
          
          {isSaved && (
            <Tag color="green" icon={<CheckOutlined />}>
              Saved
            </Tag>
          )}
          
          <Button 
            icon={<ShareAltOutlined />}
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/results?deckId=${deck.id}`);
              message.success('Link copied to clipboard!');
            }}
          >
            Share
          </Button>
        </Space>
      </div>

      {/* Main Content */}
      <div className="tiktok-container">
        {/* Left Side - Content Card */}
        <div className="content-card">
          <Card className={`material-card ${currentMaterial.type}`}>
            {/* Progress Indicator */}
            <div className="progress-indicator">
              {deck.materials.map((_, idx) => (
                <div 
                  key={idx}
                  className={`progress-bar ${idx === currentIndex ? 'active' : ''} ${idx < currentIndex ? 'viewed' : ''}`}
                  style={{ width: `${100 / deck.materials.length}%` }}
                />
              ))}
            </div>

            {/* Deck Title */}
            <div className="deck-title-section">
              {isEditingTitle ? (
                <div className="title-edit">
                  <Input
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    onPressEnter={handleUpdateTitle}
                    autoFocus
                  />
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<CheckOutlined />}
                      onClick={handleUpdateTitle}
                      size="small"
                    />
                    <Button 
                      icon={<CloseOutlined />}
                      onClick={() => {
                        setIsEditingTitle(false);
                        setEditedTitle(deck.title);
                      }}
                      size="small"
                    />
                  </Space>
                </div>
              ) : (
                <div className="title-display">
                  <Title level={4} style={{ margin: 0 }}>
                    {deck.title}
                  </Title>
                  <Button 
                    icon={<EditOutlined />}
                    onClick={() => setIsEditingTitle(true)}
                    type="text"
                    size="small"
                  />
                </div>
              )}
            </div>

            {/* Material Content */}
            <div className="material-content">
              <div className="material-header">
                <Tag color={
                  currentMaterial.type === 'flashcard' ? 'blue' :
                  currentMaterial.type === 'summary' ? 'green' : 'purple'
                } className="material-type-tag">
                  {currentMaterial.type.toUpperCase()}
                </Tag>
                <Text type="secondary">
                  • Card {currentIndex + 1} of {deck.materials.length}
                  {autoAdvance && ` • Auto-advance in ${autoAdvanceSeconds}s`}
                </Text>
              </div>

              <div className="main-text">
                {currentMaterial.type === 'flashcard' ? (
                  <>
                    <div className="flashcard-section">
                      <Title level={3} className="flashcard-question">
                        {currentMaterial.content.split('?')[0]}?
                      </Title>
                      
                      <Divider />
                      
                      {showAnswer ? (
                        <div className="flashcard-answer">
                          <Paragraph className="answer-text">
                            {currentMaterial.content.split('?')[1] || currentMaterial.explanation || 'No answer provided'}
                          </Paragraph>
                          <Button 
                            type="dashed"
                            onClick={() => setShowAnswer(false)}
                            style={{ marginTop: 16 }}
                          >
                            Hide Answer
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          type="primary"
                          onClick={() => setShowAnswer(true)}
                          size="large"
                          block
                        >
                          Show Answer
                        </Button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-content">
                    <Paragraph className="material-text">
                      {currentMaterial.content}
                    </Paragraph>
                    
                    {currentMaterial.explanation && (
                      <div className="explanation">
                        <Divider orientation="left">
                          <Text strong>Why this matters:</Text>
                        </Divider>
                        <Paragraph type="secondary">
                          {currentMaterial.explanation}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tags */}
              {currentMaterial.tags && currentMaterial.tags.length > 0 && (
                <div className="tags-container">
                  <Divider orientation="left">Tags</Divider>
                  <div className="tags-list">
                    {currentMaterial.tags.map((tag, index) => (
                      <Tag key={index} color="default" className="content-tag">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <Tooltip title="Previous (↑ Arrow)">
                <Button 
                  shape="circle" 
                  icon={<LeftOutlined />}
                  onClick={handlePrev}
                  size="large"
                  className="nav-button"
                />
              </Tooltip>
              
              <Space direction="vertical" className="side-actions">
                <Tooltip title="Listen">
                  <Button 
                    shape="circle" 
                    icon={<SoundOutlined />}
                    onClick={() => handleTextToSpeech(currentMaterial.content)}
                    size="large"
                  />
                </Tooltip>
                
                <Tooltip title="Copy">
                  <Button 
                    shape="circle" 
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyContent(currentMaterial.content)}
                    size="large"
                  />
                </Tooltip>
                
                <Tooltip title={liked.includes(currentMaterial.id) ? "Unlike" : "Like"}>
                  <Button 
                    shape="circle" 
                    icon={liked.includes(currentMaterial.id) ? <HeartFilled /> : <HeartOutlined />}
                    onClick={() => toggleLike(currentMaterial.id)}
                    size="large"
                    type={liked.includes(currentMaterial.id) ? 'primary' : 'default'}
                    danger={liked.includes(currentMaterial.id)}
                  />
                </Tooltip>
              </Space>

              <Tooltip title="Next (↓ Arrow or Space)">
                <Button 
                  shape="circle" 
                  icon={<RightOutlined />}
                  onClick={handleNext}
                  size="large"
                  className="nav-button"
                />
              </Tooltip>
            </div>
          </Card>
        </div>

        {/* Right Side - Deck Overview */}
        <div className="deck-overview">
          <Card 
            title="Deck Overview" 
            bordered={false}
            extra={
              <Tooltip title="Shuffle">
                <Button 
                  icon={<RedoOutlined />}
                  onClick={handleShuffle}
                  type="text"
                  size="small"
                />
              </Tooltip>
            }
          >
            <Paragraph type="secondary">
              <ClockCircleOutlined /> Created: {new Date(deck.generatedAt).toLocaleDateString()}
            </Paragraph>
            
            <Divider />
            
            <div className="deck-stats">
              <div className="stat-item">
                <div className="stat-value">{deck.materials.length}</div>
                <div className="stat-label">Total Materials</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {deck.materials.filter(m => m.type === 'flashcard').length}
                </div>
                <div className="stat-label">Flashcards</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">
                  {deck.materials.filter(m => m.type === 'summary').length}
                </div>
                <div className="stat-label">Summaries</div>
              </div>
            </div>
            
            <Divider />
            
            <Title level={5}>Study Materials</Title>
            <div className="materials-list">
              {deck.materials.map((material, idx) => (
                <div 
                  key={material.id}
                  className={`material-item ${idx === currentIndex ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setShowAnswer(false);
                  }}
                >
                  <Space>
                    <div className={`item-type ${material.type}`} />
                    <Text ellipsis style={{ maxWidth: 200 }}>
                      {material.type === 'flashcard' 
                        ? material.content.split('?')[0] + '?'
                        : material.content.substring(0, 40)}...
                    </Text>
                  </Space>
                  {idx < currentIndex && (
                    <Tag color="green" size="small">✓</Tag>
                  )}
                </div>
              ))}
            </div>
            
            <Divider />
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary"
                onClick={handleMarkAsStudied}
                block
              >
                Mark as Studied
              </Button>
              
              <Button 
                onClick={() => router.push('/account')}
                block
              >
                Back to Account
              </Button>
            </Space>
          </Card>
        </div>
      </div>

      {/* Navigation Tips */}
      <div className="navigation-tips">
        <Space>
          <ArrowUpOutlined />
          <Text type="secondary">
            Use ↑↓ arrows, Space, or swipe to navigate • R to shuffle • Click cards on right to jump
          </Text>
        </Space>
      </div>

      {/* Settings Modal */}
      <Modal
        title="Study Settings"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowSettings(false)}>
            Close
          </Button>
        ]}
      >
        <div className="settings-content">
          <div className="setting-item">
            <div className="setting-label">
              <Text strong>Auto-advance</Text>
              <Text type="secondary">Automatically go to next card</Text>
            </div>
            <Switch 
              checked={autoAdvance}
              onChange={setAutoAdvance}
            />
          </div>
          
          {autoAdvance && (
            <div className="setting-item">
              <div className="setting-label">
                <Text strong>Seconds per card</Text>
                <Text type="secondary">Time before auto-advancing</Text>
              </div>
              <Input
                type="number"
                min="3"
                max="60"
                value={autoAdvanceSeconds}
                onChange={(e) => setAutoAdvanceSeconds(parseInt(e.target.value) || 10)}
                style={{ width: 100 }}
              />
            </div>
          )}
          
          <Divider />
          
          <div className="setting-item">
            <div className="setting-label">
              <Text strong>Keyboard Shortcuts</Text>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <kbd>↑</kbd> <span>Previous card</span>
              </div>
              <div className="shortcut-item">
                <kbd>↓</kbd> or <kbd>Space</kbd> <span>Next card</span>
              </div>
              <div className="shortcut-item">
                <kbd>Home</kbd> <span>First card</span>
              </div>
              <div className="shortcut-item">
                <kbd>End</kbd> <span>Last card</span>
              </div>
              <div className="shortcut-item">
                <kbd>R</kbd> <span>Shuffle deck</span>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}