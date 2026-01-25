'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FileParser } from '@/utils/fileParser';

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

export default function ResultsPage() {
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

  const [showAugmentModal, setShowAugmentModal] = useState(false);
  const [augmentText, setAugmentText] = useState('');
  const [augmentFile, setAugmentFile] = useState<File | null>(null);
  const [augmentLoading, setAugmentLoading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAugmentFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return false;
    }
    setAugmentFile(file);
    return false;
  };

  const handleAugmentSubmit = async () => {
    if (!deck) return;
    
    let contentToSend = '';
    let fileName = '';
    let fileType = '';

    if (augmentFile) {
      try {
        const parsed = await FileParser.parseFile(augmentFile);
        contentToSend = parsed.text;
        fileName = augmentFile.name;
        fileType = augmentFile.type;
      } catch (error: any) {
        alert(`Failed to parse file: ${error.message}`);
        return;
      }
    } else if (augmentText.trim()) {
      contentToSend = augmentText
        .replace(/\r\n/g, '\n')
        .replace(/[ \u00A0]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } else {
      alert('Please upload a file or enter text');
      return;
    }

    if (contentToSend.length < 50) {
      alert('Content too short (min 50 chars)');
      return;
    }

    setAugmentLoading(true);
    try {
      const response = await fetch(`/api/decks/${deck.id}/augment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: contentToSend, fileName, fileType })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert(`✅ Added ${data.newMaterials.length} materials!`);
        setDeck(data.deck);
        setShowAugmentModal(false);
        setAugmentText('');
        setAugmentFile(null);
      } else {
        alert(data.error || 'Failed to augment deck');
      }
    } catch (error: any) {
      console.error('Augment error:', error);
      alert('Error augmenting deck');
    } finally {
      setAugmentLoading(false);
    }
  };

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

  // Handle mouse wheel scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (!deck) return;
    
    if (e.deltaY > 0) {
      handleNext();
    } else if (e.deltaY < 0) {
      handlePrev();
    }
  };

  const handlePrev = () => {
    if (!deck || isTransitioning) return;
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
    setIsCorrect(index === correctIndex);
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
      setMatchedPairs(prev => [...prev, termOriginalIdx]);
      setSelectedTerm(null);
      setSelectedDef(null);
    } else {
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

  // If no deck is available, show loading state (will redirect)
  if (!deck) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
    <div className="w-full h-screen bg-gray-100">
      {/* Add Materials Button */}
      <button
        onClick={() => setShowAugmentModal(true)}
        disabled={!deck}
        className="fixed left-8 top-8 z-40 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        + Add Materials
      </button>

      {/* Augment Modal */}
      {showAugmentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Add Materials to Deck</h2>
              
              <div className="space-y-6">
                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Upload File (PDF/TXT)</label>
                  <label className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition">
                    <input
                      type="file"
                      accept=".pdf,.txt"
                      onChange={(e) => e.target.files && handleAugmentFile(e.target.files[0])}
                      className="hidden"
                    />
                    <span className="text-gray-600">Click to upload</span>
                  </label>
                  {augmentFile && (
                    <div className="mt-2 text-sm text-gray-700">Selected: <strong>{augmentFile.name}</strong></div>
                  )}
                </div>

                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-gray-300"></div>
                  <span className="px-3 text-gray-500 text-sm">OR</span>
                  <div className="flex-grow border-t border-gray-300"></div>
                </div>

                {/* Text Input */}
                <div>
                  <label className="block text-sm font-semibold mb-2">Paste Text</label>
                  <textarea
                    value={augmentText}
                    onChange={(e) => setAugmentText(e.target.value)}
                    placeholder="Paste new material here (min 50 chars)..."
                    className="w-full min-h-[120px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAugmentModal(false);
                    setAugmentText('');
                    setAugmentFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAugmentSubmit}
                  disabled={augmentLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {augmentLoading ? 'Adding...' : 'Add Materials'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation buttons fixed to far right of page */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-6">
        <button
          onClick={handlePrev}
          disabled={isTransitioning || !deck}
          className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        
        <button
          onClick={handleNext}
          disabled={isTransitioning || !deck}
          className="w-14 h-14 flex items-center justify-center bg-white border-2 border-gray-300 rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content area - allows scrolling */}
      <div className="w-full h-full flex items-center justify-center overflow-y-auto">
        {/* Vertical Rectangle with Rounded Corners */}
        <div className="relative w-full max-w-md h-[90vh] bg-white rounded-2xl shadow-lg my-8">
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
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-blue-800 text-sm">
                        {currentMaterial.explanation}
                      </div>
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
                  <div className="text-gray-700 leading-relaxed px-4">
                    {currentMaterial.content}
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
                      <div className="text-sm text-blue-600 font-semibold mb-2">Terms</div>
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
                    <div className="text-xl text-blue-700 font-semibold">
                      {answer || currentMaterial.content}
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAnswer(true)}
                      className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                    >
                      Reveal Answer
                    </button>
                  )}
                </div>
              )}

              {/* Concept / Summary */}
              {(currentMaterial.type === 'concept' || currentMaterial.type === 'summary') && (
                <div className="w-full space-y-4 px-4">
                  <div className="text-gray-900 text-xl font-semibold text-center">
                    {currentMaterial.content}
                  </div>
                  {currentMaterial.explanation && (
                    <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                      <div className="text-gray-700">
                        {currentMaterial.explanation}
                      </div>
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