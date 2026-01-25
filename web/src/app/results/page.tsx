'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FileParser } from '@/utils/fileParser';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { AudioFeedback } from '@/utils/audioFeedback';

interface StudyMaterial {
  type: 'flashcard' | 'summary' | 'concept' | 'multiple_choice' | 'visual_example' | 'match_game';
  content?: string;
  explanation?: string;
  id: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  title?: string;
  pairs?: Array<{term: string; definition: string}>;
}

interface GeneratedDeck {
  id: string;
  title: string;
  materials: StudyMaterial[];
  generatedAt: string;
}

function ResultsContent() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deck, setDeck] = useState<GeneratedDeck | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);
  const [selectedDef, setSelectedDef] = useState<number | null>(null);
  const [shuffledTerms, setShuffledTerms] = useState<Array<{term: string; index: number}>>([]);
  const [shuffledDefs, setShuffledDefs] = useState<Array<{definition: string; index: number}>>([]);

  const [audioLoading, setAudioLoading] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const audioFeedback = useRef<AudioFeedback | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastScrollTime = useRef<number>(0);
  const lastScrollDirection = useRef<'up' | 'down' | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

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
      
      // Get text content to speak
      let textToSpeak = '';
      if (currentMaterial.type === 'flashcard' && currentMaterial.content) {
        textToSpeak = currentMaterial.content;
      } else if (currentMaterial.type === 'multiple_choice') {
        textToSpeak = currentMaterial.question || '';
        if (currentMaterial.explanation) {
          textToSpeak += '. ' + currentMaterial.explanation;
        }
      } else {
        textToSpeak = currentMaterial.content || '';
      }
      
      // Call audio generation API
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToSpeak })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Audio API error:', response.status, errorText);
        throw new Error(`Audio generation failed: ${response.status} ${errorText}`);
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
      alert('Failed to generate audio');
    } finally {
      setAudioLoading(false);
    }
  };

  useEffect(() => {
    // Initialize audio feedback if available
    audioFeedback.current = new AudioFeedback();
  }, []);

  useEffect(() => {
    const load = async () => {
      const id = searchParams.get('id');
      if (!id) {
        router.push('/account');
        return;
      }
      try {
        const res = await fetch(`/api/decks/${encodeURIComponent(id)}`, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data?.deck) {
            setDeck(data.deck);
            return;
          }
        }
        if (res.status === 404) {
          alert('This deck was deleted or does not exist.');
          router.push('/account');
          return;
        }
      } catch (e) {
        console.error('Failed to load deck', e);
      }
      router.push('/account');
    };
    load();
  }, [router, searchParams]);

  useEffect(() => {
    if (deck && deck.materials[currentIndex]?.type === 'match_game') {
      const material = deck.materials[currentIndex];
      if (material.pairs) {
        setShuffledTerms(material.pairs.map((p, i) => ({ term: p.term, index: i })));
        setShuffledDefs([...material.pairs.map((p, i) => ({ definition: p.definition, index: i }))].sort(() => Math.random() - 0.5));
        setMatchedPairs([]);
        setSelectedTerm(null);
        setSelectedDef(null);
      }
    }
  }, [currentIndex, deck]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const threshold = 50;
    const diff = touchStartY.current - touchEndY.current;

    if (Math.abs(diff) > threshold && deck) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
  };

  // Handle mouse wheel scroll with advanced debouncing
  const handleWheel = (e: React.WheelEvent) => {
    if (!deck || isTransitioning) return;
    
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTime.current;
    const currentDirection = e.deltaY > 0 ? 'down' : 'up';
    
    // Ignore scroll if:
    // 1. Still in transition animation
    // 2. Same direction scroll within 1200ms (prevents multi-scroll from single gesture)
    // 3. Different direction scroll within 500ms (direction change requires less wait)
    const minWait = lastScrollDirection.current === currentDirection ? 1200 : 500;
    
    if (timeSinceLastScroll < minWait) {
      return;
    }
    
    lastScrollTime.current = now;
    lastScrollDirection.current = currentDirection;
    
    if (e.deltaY > 0) {
      handleNext();
    } else if (e.deltaY < 0) {
      handlePrev();
    }
  };

  const handlePrev = () => {
    if (!deck || isTransitioning) return;
    
    // Stop audio when changing cards
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setAudioPlaying(false);
    }
    
    setDirection('down');
    setIsTransitioning(true);
    resetState();
    setTimeout(() => {
      setCurrentIndex(prev => prev > 0 ? prev - 1 : deck.materials.length - 1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (!deck || isTransitioning) return;
    
    // Stop audio when changing cards
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setAudioPlaying(false);
    }
    
    setDirection('up');
    setIsTransitioning(true);
    resetState();
    setTimeout(() => {
      setCurrentIndex(prev => prev < deck.materials.length - 1 ? prev + 1 : 0);
      setIsTransitioning(false);
    }, 300);
  };

  const resetState = () => {
    setShowAnswer(false);
    setSelectedOption(null);
    setIsCorrect(null);
    setMatchedPairs([]);
    setSelectedTerm(null);
    setSelectedDef(null);
  };

  const handleOptionSelect = (index: number, correctIndex: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);
    const isAnswerCorrect = index === correctIndex;
    setIsCorrect(isAnswerCorrect);
    if (audioFeedback.current) {
      if (isAnswerCorrect) {
        audioFeedback.current.playCorrect();
      } else {
        audioFeedback.current.playIncorrect();
      }
    }
  };

  const handleMatchSelection = (type: 'term' | 'def', index: number) => {
    if (type === 'term') {
      setSelectedTerm(index);
      if (selectedDef !== null) {
        checkMatch(index, selectedDef);
      }
    } else {
      setSelectedDef(index);
      if (selectedTerm !== null) {
        checkMatch(selectedTerm, index);
      }
    }
  };
  
  const checkMatch = (termIdx: number, defIdx: number) => {
    const termOriginalIdx = shuffledTerms[termIdx].index;
    const defOriginalIdx = shuffledDefs[defIdx].index;
    
    if (termOriginalIdx === defOriginalIdx) {
      if (audioFeedback.current) {
        audioFeedback.current.playCorrect();
      }
      setMatchedPairs(prev => [...prev, termOriginalIdx]);
      setSelectedTerm(null);
      setSelectedDef(null);
    } else {
      if (audioFeedback.current) {
        audioFeedback.current.playIncorrect();
      }
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 1000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!deck) return;
      
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [deck, isTransitioning]);

  // Cleanup audio on unmount or when changing cards
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, [currentIndex]);

  // If no deck is available, show loading state (will redirect)
  if (!deck) {
    return (
      <div className="w-full h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fa541c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentMaterial = deck.materials[currentIndex];
  const isFlashcard = currentMaterial.type === 'flashcard';
  const [question, answer] = isFlashcard && currentMaterial.content 
    ? currentMaterial.content.split('?') 
    : ['', ''];

  return (
    <div className="w-full h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Navigation buttons fixed to far right of page */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6">
        {/* Audio button */}
        <button
          onClick={playAudio}
          disabled={audioLoading || audioPlaying}
          className={`w-14 h-14 flex items-center justify-center border-2 rounded-full transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            audioPlaying 
              ? 'bg-[#fa541c] border-orange-400' 
              : 'bg-white border-gray-300 hover:bg-orange-50 hover:border-[#fa541c] hover:scale-105'
          }`}
        >
          {audioLoading ? (
            <svg className="w-6 h-6 text-gray-700 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : audioPlaying ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
        
        <button
          onClick={handlePrev}
          disabled={isTransitioning || !deck}
          className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-orange-50 hover:border-[#fa541c] hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-[#fa541c]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        
        <button
          onClick={handleNext}
          disabled={isTransitioning || !deck}
          className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-orange-50 hover:border-[#fa541c] hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-[#fa541c]" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content area - allows scrolling */}
      <div className="w-full h-full flex items-center justify-center overflow-y-auto">
        {/* Vertical Rectangle with Rounded Corners */}
        <div className="relative w-full max-w-md h-[90vh] bg-white rounded-2xl shadow-md border border-gray-200 my-8">
          {/* Content Container */}
          <div 
            ref={containerRef}
            className="relative h-full w-full overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Main content */}
            <div className={`h-full w-full flex flex-col justify-center items-center px-6 transition-all duration-300 ease-out ${
              isTransitioning 
                ? direction === 'up' 
                  ? 'transform -translate-y-4 opacity-0' 
                  : 'transform translate-y-4 opacity-0'
                : 'transform translate-y-0 opacity-100'
            }`}>

              {/* Multiple Choice */}
              {currentMaterial.type === 'multiple_choice' && (
                <div className="w-full space-y-6 mt-12">
                  <h3 className="text-xl text-gray-900 font-semibold text-center mb-6">
                    {currentMaterial.question}
                  </h3>
                  
                  <div className="space-y-3">
                    {currentMaterial.options?.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const isCorrectOption = index === currentMaterial.correctIndex;
                      const showResult = selectedOption !== null;
                      
                      return (
                        <button
                          key={index}
                          onClick={() => handleOptionSelect(index, currentMaterial.correctIndex!)}
                          disabled={selectedOption !== null}
                          className={`w-full p-4 rounded-lg text-left font-medium transition-all ${
                            !showResult
                              ? 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                              : isSelected
                                ? isCorrect
                                  ? 'bg-green-100 border-2 border-green-500 text-green-900'
                                  : 'bg-red-100 border-2 border-red-500 text-red-900'
                                : isCorrectOption
                                  ? 'bg-green-50 border border-green-300 text-green-900'
                                  : 'bg-gray-50 border border-gray-300 text-gray-600'
                          }`}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  
                  {selectedOption !== null && currentMaterial.explanation && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <MarkdownRenderer content={currentMaterial.explanation} className="text-orange-800 text-sm" />
                    </div>
                  )}
                </div>
              )}

              {/* Visual Example */}
              {currentMaterial.type === 'visual_example' && (
                <div className="w-full text-center space-y-6">
                  <div className="text-xl text-gray-900 font-bold mb-4">
                    {currentMaterial.title}
                  </div>
                  <div className="px-4">
                    <MarkdownRenderer content={currentMaterial.content || ''} className="text-gray-700" />
                  </div>
                </div>
              )}

              {/* Match Game */}
              {currentMaterial.type === 'match_game' && currentMaterial.pairs && (
                <div className="w-full space-y-6">
                  <div className="text-lg text-gray-900 font-bold text-center mb-6">
                    {currentMaterial.title || 'Match Game'}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="text-sm text-[#fa541c] font-semibold mb-2">Terms</div>
                      {shuffledTerms.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleMatchSelection('term', idx)}
                          disabled={matchedPairs.includes(item.index)}
                          className={`w-full p-3 rounded-lg text-sm font-medium transition-all ${
                            matchedPairs.includes(item.index)
                              ? 'bg-green-100 border-2 border-green-500 text-green-900'
                              : selectedTerm === idx
                                ? 'bg-purple-100 border-2 border-purple-500 text-purple-900'
                                : 'bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {item.term}
                        </button>
                      ))}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-pink-600 font-semibold mb-2">Definitions</div>
                      {shuffledDefs.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleMatchSelection('def', idx)}
                          disabled={matchedPairs.includes(item.index)}
                          className={`w-full p-3 rounded-lg text-sm font-medium transition-all ${
                            matchedPairs.includes(item.index)
                              ? 'bg-green-100 border-2 border-green-500 text-green-900'
                              : selectedDef === idx
                                ? 'bg-pink-100 border-2 border-pink-500 text-pink-900'
                                : 'bg-gray-100 border border-gray-300 text-gray-900 hover:bg-gray-200'
                          }`}
                        >
                          {item.definition}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Flashcard */}
              {isFlashcard && (
                <div className="w-full text-center space-y-8 px-4">
                  <div className="text-2xl text-gray-900 font-bold leading-tight">
                    {question}?
                  </div>
                  
                  {showAnswer ? (
                    <div className="text-xl text-[#fa541c] font-semibold">
                      {answer || currentMaterial.content}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="px-8 py-3 bg-[#fa541c] text-white font-bold rounded-lg hover:bg-[#ff7a45]"
                    >
                      Reveal Answer
                    </button>
                  )}
                </div>
              )}

              {/* Concept / Summary */}
              {(currentMaterial.type === 'concept' || currentMaterial.type === 'summary') && (
                <div className="w-full space-y-4 px-4">
                  <MarkdownRenderer content={currentMaterial.content || ''} className="text-gray-900 text-lg" />
                  {currentMaterial.explanation && (
                    <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                      <MarkdownRenderer content={currentMaterial.explanation} className="text-gray-700" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResultsContent />
    </Suspense>
  );
}