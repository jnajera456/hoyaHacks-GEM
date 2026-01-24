'use client';

import { useState, useEffect, useRef } from 'react';

interface StudyMaterial {
  type: 'flashcard' | 'summary' | 'concept';
  content: string;
  id: string;
}

interface GeneratedDeck {
  id: string;
  title: string;
  materials: StudyMaterial[];
  generatedAt: string;
}

export default function ResultsPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load deck from sessionStorage
  useEffect(() => {
    const savedDeck = sessionStorage.getItem('currentDeck');
    if (savedDeck) {
      try {
        const parsedDeck = JSON.parse(savedDeck);
        setDeck(parsedDeck);
      } catch {
        // If no deck, use sample data
        const sampleDeck: GeneratedDeck = {
          id: '1',
          title: 'Biology Study Deck',
          materials: [
            {
              type: 'flashcard',
              content: 'What is photosynthesis?The process by which plants convert light energy into chemical energy',
              id: '1'
            },
            {
              type: 'summary',
              content: 'Mitochondria are known as the powerhouse of the cell because they generate most of the cell\'s supply of ATP, which is used as a source of chemical energy.',
              id: '2'
            },
            {
              type: 'concept',
              content: 'DNA (Deoxyribonucleic Acid) is a molecule that carries genetic information. It consists of two strands forming a double helix structure.',
              id: '3'
            },
            {
              type: 'flashcard',
              content: 'What are the four stages of mitosis?Prophase, Metaphase, Anaphase, and Telophase',
              id: '4'
            }
          ],
          generatedAt: new Date().toISOString()
        };
        setDeck(sampleDeck);
      }
    } else {
      // Sample deck if nothing in sessionStorage
      const sampleDeck: GeneratedDeck = {
        id: '1',
        title: 'Biology Study Deck',
        materials: [
          {
            type: 'flashcard',
            content: 'What is photosynthesis?The process by which plants convert light energy into chemical energy',
            id: '1'
          },
          {
            type: 'summary',
            content: 'Mitochondria are known as the powerhouse of the cell because they generate most of the cell\'s supply of ATP, which is used as a source of chemical energy.',
            id: '2'
          },
          {
            type: 'concept',
            content: 'DNA (Deoxyribonucleic Acid) is a molecule that carries genetic information. It consists of two strands forming a double helix structure.',
            id: '3'
          },
          {
            type: 'flashcard',
            content: 'What are the four stages of mitosis?Prophase, Metaphase, Anaphase, and Telophase',
            id: '4'
          }
        ],
        generatedAt: new Date().toISOString()
      };
      setDeck(sampleDeck);
    }
  }, []);

  // Audio playback function
  const playAudio = async () => {
    if (!deck) return;
    
    // Stop current audio if playing
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setAudioPlaying(false);
    }

    setAudioLoading(true);
    
    try {
      const currentMaterial = deck.materials[currentIndex];
      
      // Call audio generation API
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: currentMaterial.content })
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;
      
      audio.onplay = () => setAudioPlaying(true);
      audio.onended = () => {
        setAudioPlaying(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };
      audio.onerror = () => {
        setAudioPlaying(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      await audio.play();
      
    } catch (error) {
      console.error('Audio generation error:', error);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    const diff = touchStartY.current - touchEndY.current;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  const handlePrev = () => {
    if (!deck) return;
    // Stop audio when changing cards
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setAudioPlaying(false);
    }
    setCurrentIndex(prev => prev > 0 ? prev - 1 : deck.materials.length - 1);
    setShowAnswer(false);
  };

  const handleNext = () => {
    if (!deck) return;
    // Stop audio when changing cards
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setAudioPlaying(false);
    }
    setCurrentIndex(prev => prev < deck.materials.length - 1 ? prev + 1 : 0);
    setShowAnswer(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  if (!deck) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: '1.125rem' }}>Loading...</div>
      </div>
    );
  }

  const currentMaterial = deck.materials[currentIndex];
  const isFlashcard = currentMaterial.type === 'flashcard';
  const [question, answer] = isFlashcard ? currentMaterial.content.split('?') : ['', ''];

  // Get title based on type
  const getTitle = () => {
    if (isFlashcard) return '📚 Flashcard';
    if (currentMaterial.type === 'summary') return '📝 Summary';
    return '💡 Key Concept';
  };

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        backgroundColor: '#000',
        overflow: 'hidden'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated gradient background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom right, rgba(88, 28, 135, 0.2), rgba(0, 0, 0, 1), rgba(30, 58, 138, 0.2))'
      }} />
      
      {/* Content container */}
      <div style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 1.5rem'
      }}>
        <div style={{ width: '100%', maxWidth: '32rem' }}>
          {/* Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              color: '#fff',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              {getTitle()}
            </h2>
          </div>

          {/* Content */}
          {isFlashcard ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2rem',
                color: '#fff',
                fontWeight: 'bold',
                lineHeight: '1.3',
                padding: '0 1rem',
                marginBottom: '2rem'
              }}>
                {question}?
              </div>
              
              {showAnswer ? (
                <div style={{
                  fontSize: '1.75rem',
                  color: '#93c5fd',
                  fontWeight: '500',
                  padding: '0 1rem',
                  animation: 'fadeIn 0.3s ease-out'
                }}>
                  {answer || currentMaterial.content}
                </div>
              ) : (
                <button
                  onClick={() => setShowAnswer(true)}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#fff',
                    color: '#000',
                    fontWeight: 'bold',
                    borderRadius: '9999px',
                    fontSize: '1.125rem',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Reveal Answer
                </button>
              )}
            </div>
          ) : (
            <div style={{
              color: '#fff',
              fontSize: '1.75rem',
              fontWeight: '600',
              lineHeight: '1.6',
              padding: '0 1rem',
              textAlign: 'center'
            }}>
              {currentMaterial.content}
            </div>
          )}
        </div>
      </div>

      {/* Top bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingTop: '1rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        zIndex: 10
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#fff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button style={{
              fontSize: '1.5rem',
              background: 'none',
              border: 'none',
              color: '#fff',
              cursor: 'pointer'
            }}>←</button>
            <span style={{ fontWeight: '600' }}>StudyToks</span>
          </div>
          <button style={{
            fontSize: '1.5rem',
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer'
          }}>⋯</button>
        </div>
      </div>

      {/* Navigation buttons - Right side */}
      <div style={{
        position: 'absolute',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        zIndex: 10
      }}>
        {/* Audio button */}
        <button
          onClick={playAudio}
          disabled={audioLoading || audioPlaying}
          style={{
            width: '3.5rem',
            height: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: audioPlaying ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            cursor: audioLoading || audioPlaying ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
            opacity: audioLoading ? 0.5 : 1
          }}
          onMouseEnter={(e) => {
            if (!audioLoading && !audioPlaying) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!audioPlaying) {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {audioLoading ? (
            <svg style={{ width: '1.5rem', height: '1.5rem', color: '#fff', animation: 'spin 1s linear infinite' }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : audioPlaying ? (
            <svg style={{ width: '1.5rem', height: '1.5rem', color: '#22c55e' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg style={{ width: '1.5rem', height: '1.5rem', color: '#fff' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>

        <button
          onClick={handlePrev}
          style={{
            width: '3.5rem',
            height: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg style={{ width: '1.5rem', height: '1.5rem', color: '#fff' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        
        <button
          onClick={handleNext}
          style={{
            width: '3.5rem',
            height: '3.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg style={{ width: '1.5rem', height: '1.5rem', color: '#fff' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Progress indicator */}
      <div style={{
        position: 'absolute',
        bottom: '4rem',
        left: 0,
        right: 0,
        paddingLeft: '1rem',
        paddingRight: '1rem',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {deck.materials.map((_, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                height: '0.125rem',
                borderRadius: '9999px',
                backgroundColor: idx === currentIndex ? '#fff' : idx < currentIndex ? '#9ca3af' : '#4b5563',
                transition: 'all 0.3s'
              }}
            />
          ))}
        </div>
      </div>

      {/* Swipe hint */}
      <div style={{
        position: 'absolute',
        bottom: '1rem',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 10
      }}>
        <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: 0 }}>
          Swipe up for next • {currentIndex + 1}/{deck.materials.length}
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}