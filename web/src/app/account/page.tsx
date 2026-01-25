"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  BookOpen, 
  Clock, 
  Star, 
  Download, 
  Trash2, 
  Settings, 
  History, 
  TrendingUp, 
  ChevronRight,
  Bell,
  Moon,
  Globe,
  Calendar,
  Target,
  LogOut,
  Edit2,
  Save,
  X,
  Flame,
  BarChart3,
  FileText,
  Share2,
  ExternalLink,
  MoreVertical,
  Info,
  ImageIcon
} from 'lucide-react';

// Updated types to match what Gemini generates
type StudyMaterial = {
  type: 'flashcard' | 'summary' | 'concept';
  content: string;
  explanation?: string;
  tags?: string[];
  id: string;
};

type GeneratedDeck = {
  id: string;
  title: string;
  materials: StudyMaterial[];
  sourceText?: string;
  generatedAt: string;
  coverImage?: string; // Add cover image field
};

type UserType = {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
  avatarColor?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    notifications: boolean;
    dailyReminder: boolean;
    studyGoal: number;
    language: string;
  };
  studyStats?: {
    totalStudyTime: number;
    daysStudied: number;
    longestStreak: number;
    averageScore: number;
    totalDecks?: number;
    totalFlashcards?: number;
  };
};

type StudySession = {
  id: string;
  deckId: string;
  deckTitle: string;
  date: string;
  duration: number;
  score: number;
  cardsStudied: number;
};

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [userDecks, setUserDecks] = useState<GeneratedDeck[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'decks' | 'history' | 'preferences'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showInfoId, setShowInfoId] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState<{ [key: string]: boolean }>({});
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    theme: 'light' as 'light' | 'dark' | 'auto',
    notifications: true,
    dailyReminder: true,
    studyGoal: 30,
    language: 'en'
  });

  // Default notebook image URL (using Unsplash as example)
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&auto=format&fit=crop&q=80";
  // Alternative: Use Pexels direct image
  // const DEFAULT_IMAGE = "https://images.pexels.com/photos/8932609/pexels-photo-8932609.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop";

  useEffect(() => {
    const savedUser = localStorage.getItem('studytoks_user');
    const savedDecks = localStorage.getItem('studyDecks');
    
    // ✅ ADD MIGRATION CODE FOR DECKS
    if (savedDecks) {
      try {
        const decks = JSON.parse(savedDecks);
        
        // MIGRATION: Ensure all decks have coverImage property
        const migratedDecks = decks.map((deck: GeneratedDeck) => {
          // If deck has no coverImage but should have one from API
          if (!deck.coverImage) {
            // You can add a default image or leave it undefined
            // The DeckCard component will handle undefined with DEFAULT_IMAGE
            return {
              ...deck,
              coverImage: deck.coverImage || DEFAULT_IMAGE
            };
          }
          return deck;
        });
        
        setUserDecks(migratedDecks);
        
        // Save migrated decks back to localStorage
        if (migratedDecks.length > 0) {
          localStorage.setItem('studyDecks', JSON.stringify(migratedDecks));
        }
        
        console.log('✅ Decks loaded:', migratedDecks.length);
        
      } catch (error) {
        console.error('Error parsing decks:', error);
        setUserDecks([]);
      }
    } else {
      setUserDecks([]);
    }
    
    // ✅ KEEP YOUR EXISTING USER CODE
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setEditForm({
        name: userData.name,
        email: userData.email,
        theme: userData.preferences?.theme || 'light',
        notifications: userData.preferences?.notifications !== false,
        dailyReminder: userData.preferences?.dailyReminder !== false,
        studyGoal: userData.preferences?.studyGoal || 30,
        language: userData.preferences?.language || 'en'
      });
    } else {
      const guestUser: UserType = {
        id: 'guest_' + Date.now(),
        name: 'Guest User',
        email: 'guest@studytoks.com',
        isGuest: true,
        avatarColor: '#6B7280',
        preferences: {
          theme: 'light',
          notifications: true,
          dailyReminder: true,
          studyGoal: 30,
          language: 'en'
        },
        studyStats: {
          totalStudyTime: 0,
          daysStudied: 0,
          longestStreak: 0,
          averageScore: 0,
          totalDecks: 0,
          totalFlashcards: 0
        }
      };
      localStorage.setItem('studytoks_user', JSON.stringify(guestUser));
      setUser(guestUser);
      setEditForm({
        name: guestUser.name,
        email: guestUser.email,
        theme: 'light',
        notifications: true,
        dailyReminder: true,
        studyGoal: 30,
        language: 'en'
      });
    }
    
    // ✅ KEEP YOUR SESSIONS CODE
    const savedSessions = localStorage.getItem('studytoks_sessions');
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions));
    }
  }, []);

  const generateCoverImage = async (deckId: string, deckTitle: string) => {
    setImageLoading(prev => ({ ...prev, [deckId]: true }));
    
    try {
      // Call your image generation API
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: `Study materials for ${deckTitle}, educational, notebook, clean aesthetic` 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const imageUrl = data.imageUrl;
        
        // Update the deck with the new image
        const updatedDecks = userDecks.map(deck => 
          deck.id === deckId ? { ...deck, coverImage: imageUrl } : deck
        );
        setUserDecks(updatedDecks);
        localStorage.setItem('studyDecks', JSON.stringify(updatedDecks));
        
        return imageUrl;
      }
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setImageLoading(prev => ({ ...prev, [deckId]: false }));
    }
    
    return DEFAULT_IMAGE;
  };

  const handleSignIn = () => {
    const demoUser: UserType = {
      id: 'demo_' + Date.now(),
      name: 'Demo Student',
      email: 'demo@studytoks.com',
      avatarColor: '#7C3AED',
      preferences: {
        theme: 'light',
        notifications: true,
        dailyReminder: true,
        studyGoal: 30,
        language: 'en'
      },
      studyStats: {
        totalStudyTime: 1250,
        daysStudied: 45,
        longestStreak: 14,
        averageScore: 82,
        totalDecks: userDecks.length,
        totalFlashcards: userDecks.reduce((total, deck) => 
          total + deck.materials.filter(m => m.type === 'flashcard').length, 0)
      }
    };
    localStorage.setItem('studytoks_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const handleSignOut = () => {
    localStorage.removeItem('studytoks_user');
    setUser(null);
  };

  const handleSavePreferences = () => {
    if (!user) return;
    
    const updatedUser: UserType = {
      ...user,
      name: editForm.name,
      email: editForm.email,
      preferences: {
        theme: editForm.theme,
        notifications: editForm.notifications,
        dailyReminder: editForm.dailyReminder,
        studyGoal: editForm.studyGoal,
        language: editForm.language
      }
    };
    
    localStorage.setItem('studytoks_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditingProfile(false);
  };

  const handleDeleteDeck = (deckId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      const updated = userDecks.filter(d => d.id !== deckId);
      setUserDecks(updated);
      localStorage.setItem('studyDecks', JSON.stringify(updated));
      
      if (user) {
        const totalFlashcards = updated.reduce((total: number, deck: GeneratedDeck) => 
          total + deck.materials.filter(m => m.type === 'flashcard').length, 0);
        
        const updatedUser = {
          ...user,
          studyStats: {
            totalStudyTime: user.studyStats?.totalStudyTime || 0,
            daysStudied: user.studyStats?.daysStudied || 0,
            longestStreak: user.studyStats?.longestStreak || 0,
            averageScore: user.studyStats?.averageScore || 0,
            totalDecks: updated.length,
            totalFlashcards: totalFlashcards
          }
        };
        setUser(updatedUser);
        localStorage.setItem('studytoks_user', JSON.stringify(updatedUser));
      }
      
      setOpenMenuId(null);
      alert('Deck deleted successfully!');
    }
  };

  const handleExportDeck = (deck: GeneratedDeck, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dataStr = JSON.stringify(deck, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studytoks-${deck.title.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setOpenMenuId(null);
  };

  const handleExportAllData = () => {
    const userData = {
      user,
      decks: userDecks,
      studySessions,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studytoks-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStudyDeck = (deck: GeneratedDeck) => {
    sessionStorage.setItem('currentDeck', JSON.stringify(deck));
    router.push('/results');
  };

  const toggleMenu = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === deckId ? null : deckId);
  };

  const toggleInfo = (deckId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoId(showInfoId === deckId ? null : deckId);
    setOpenMenuId(null);
  };

  const stats = {
    totalDecks: userDecks.length,
    totalFlashcards: userDecks.reduce((total, deck) => 
      total + deck.materials.filter(m => m.type === 'flashcard').length, 0),
    totalMaterials: userDecks.reduce((total, deck) => total + deck.materials.length, 0),
    studyTime: user?.studyStats?.totalStudyTime || 0,
    mastery: user?.studyStats?.averageScore || 78,
    streak: user?.studyStats?.longestStreak || 0,
    daysStudied: user?.studyStats?.daysStudied || 0
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDeckSubjects = (deck: GeneratedDeck) => {
    const allTags = deck.materials.flatMap(m => m.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.slice(0, 3);
  };

  // Deck Card Component (TikTok-style with image)
  const DeckCard = ({ deck }: { deck: GeneratedDeck }) => {
    const flashcardCount = deck.materials.filter(m => m.type === 'flashcard').length;
    const summaryCount = deck.materials.filter(m => m.type === 'summary').length;
    const conceptCount = deck.materials.filter(m => m.type === 'concept').length;
    const tags = getDeckSubjects(deck);
    const isMenuOpen = openMenuId === deck.id;
    const isInfoOpen = showInfoId === deck.id;
    const isLoading = imageLoading[deck.id];

    return (
      <div className="relative">
        <div
          onClick={() => handleStudyDeck(deck)}
          className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer overflow-hidden group"
        >
          {/* Cover Image */}
          <div className="h-48 relative overflow-hidden bg-gray-100">
            {deck.coverImage || DEFAULT_IMAGE ? (
              <img 
                src={deck.coverImage || DEFAULT_IMAGE}
                alt={deck.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  // Silently fall back to default image without console.error
                  (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                  // Optional: mark the deck as needing a new image
                  if (deck.coverImage && deck.coverImage.includes('unsplash')) {
                    // This Unsplash URL format is problematic, we should generate a new one
                    console.log('⚠️ Problematic Unsplash image, consider regenerating');
                  }
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <BookOpen size={48} className="text-white/50" />
              </div>
            )}
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
            
            {/* Three-dot menu button */}
            <div className="absolute top-3 right-3">
              <button
                onClick={(e) => toggleMenu(deck.id, e)}
                className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
              >
                <MoreVertical size={18} className="text-gray-700" />
              </button>
            </div>

            {/* Generate Image button (if no custom image) */}
            {!deck.coverImage && (
              <div className="absolute top-3 left-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    generateCoverImage(deck.id, deck.title);
                  }}
                  disabled={isLoading}
                  className="p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                  title="Generate custom cover image"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <ImageIcon size={18} className="text-purple-600" />
                  )}
                </button>
              </div>
            )}
            
            {/* Title overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h3 className="text-white font-bold text-lg line-clamp-2 drop-shadow-lg">{deck.title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
              <FileText size={14} />
              <span>{flashcardCount} cards</span>
              <span>•</span>
              <Calendar size={14} />
              <span>{new Date(deck.generatedAt).toLocaleDateString()}</span>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-50 text-purple-600 text-xs rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-purple-600/0 group-hover:bg-purple-600/5 transition-colors pointer-events-none"></div>
        </div>

        {/* Dropdown Menu */}
        {isMenuOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setOpenMenuId(null)}
            ></div>
            <div className="absolute right-0 top-12 z-50 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
              <button
                onClick={(e) => toggleInfo(deck.id, e)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
              >
                <Info size={16} className="text-gray-600" />
                <span>View Details</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  generateCoverImage(deck.id, deck.title);
                  setOpenMenuId(null);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
              >
                <ImageIcon size={16} className="text-gray-600" />
                <span>Generate Cover</span>
              </button>
              <button
                onClick={(e) => handleExportDeck(deck, e)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-sm"
              >
                <Download size={16} className="text-gray-600" />
                <span>Export Deck</span>
              </button>
              <button
                onClick={(e) => handleDeleteDeck(deck.id, e)}
                className="w-full px-4 py-2 text-left hover:bg-red-50 flex items-center space-x-3 text-sm text-red-600"
              >
                <Trash2 size={16} />
                <span>Delete Deck</span>
              </button>
            </div>
          </>
        )}

        {/* Info Modal */}
        {isInfoOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowInfoId(null)}
            >
              <div 
                className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{deck.title}</h3>
                  <button
                    onClick={() => setShowInfoId(null)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Cover image preview */}
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img 
                    src={deck.coverImage || DEFAULT_IMAGE}
                    alt={deck.title}
                    className="w-full h-32 object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Source</p>
                    <p className="text-sm text-gray-900">{deck.sourceText || "Generated from study materials"}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Materials</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">Flashcards</span>
                        <span className="font-medium">{flashcardCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">Summaries</span>
                        <span className="font-medium">{summaryCount}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm">Concepts</span>
                        <span className="font-medium">{conceptCount}</span>
                      </div>
                    </div>
                  </div>

                  {tags.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag, index) => (
                          <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-1">Created</p>
                    <p className="text-sm text-gray-900">
                      {new Date(deck.generatedAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowInfoId(null);
                    handleStudyDeck(deck);
                  }}
                  className="w-full mt-6 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                >
                  Start Studying
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Keep all the existing header, sidebar, and other content the same */}
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 px-4 py-4 shadow-sm sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900 flex items-center">
              <span className="mr-2">←</span> Back to Home
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Study Decks</h1>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center justify-center space-x-2 transition-colors"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {user ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card - keep existing */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-24 h-24 rounded-full flex items-center justify-center mb-4 text-white text-3xl font-bold"
                    style={{ backgroundColor: user.avatarColor || '#7C3AED' }}
                  >
                    {user.name.charAt(0)}
                  </div>
                  {isEditingProfile ? (
                    <div className="w-full space-y-4">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Your name"
                      />
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Email"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSavePreferences}
                          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                        >
                          <Save size={18} />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={() => setIsEditingProfile(false)}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                      <p className="text-gray-600 text-sm mt-1">{user.email}</p>
                      {user.isGuest && (
                        <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                          Guest Account
                        </span>
                      )}
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="mt-4 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg flex items-center justify-center space-x-2"
                      >
                        <Edit2 size={16} />
                        <span>Edit Profile</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation - keep existing */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${activeTab === 'overview' ? 'bg-purple-50 border-l-4 border-purple-600' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <BarChart3 size={20} className={activeTab === 'overview' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className={activeTab === 'overview' ? 'font-medium text-purple-700' : 'text-gray-700'}>Overview</span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'overview' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
                
                <button
                  onClick={() => setActiveTab('decks')}
                  className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${activeTab === 'decks' ? 'bg-purple-50 border-l-4 border-purple-600' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen size={20} className={activeTab === 'decks' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className={activeTab === 'decks' ? 'font-medium text-purple-700' : 'text-gray-700'}>My Decks</span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {userDecks.length}
                    </span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'decks' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
                
                <button
                  onClick={() => setActiveTab('history')}
                  className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${activeTab === 'history' ? 'bg-purple-50 border-l-4 border-purple-600' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <History size={20} className={activeTab === 'history' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className={activeTab === 'history' ? 'font-medium text-purple-700' : 'text-gray-700'}>Study History</span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'history' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
                
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${activeTab === 'preferences' ? 'bg-purple-50 border-l-4 border-purple-600' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <Settings size={20} className={activeTab === 'preferences' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className={activeTab === 'preferences' ? 'font-medium text-purple-700' : 'text-gray-700'}>Preferences</span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'preferences' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
              </div>

              {/* Quick Stats - keep existing */}
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Total Decks</span>
                    <span className="font-medium">{stats.totalDecks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Flashcards</span>
                    <span className="font-medium">{stats.totalFlashcards}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Study Time</span>
                    <span className="font-medium">{formatTime(stats.studyTime)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Current Streak</span>
                    <span className="font-medium flex items-center">
                      <Flame size={14} className="text-orange-500 mr-1" />
                      {stats.streak} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content - Overview & Decks tabs use DeckCard */}
            <div className="lg:col-span-3">
              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Welcome Card */}
                  <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2 leading-tight">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
                        <p className="text-purple-100">
                          {stats.totalDecks > 0 
                            ? `You have ${stats.totalDecks} study decks with ${stats.totalFlashcards} flashcards.`
                            : 'Generate your first study deck to get started!'}
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div className="text-center">
                          <div className="text-4xl font-bold">{stats.mastery}%</div>
                          <div className="text-purple-200">Mastery Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <BookOpen className="text-blue-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalDecks}</div>
                      <div className="text-gray-600">Total Decks</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                          <FileText className="text-green-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalFlashcards}</div>
                      <div className="text-gray-600">Flashcards</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-purple-50 rounded-lg">
                          <Star className="text-purple-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.mastery}%</div>
                      <div className="text-gray-600">Average Mastery</div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-orange-50 rounded-lg">
                          <Flame className="text-orange-600" size={24} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stats.streak}</div>
                      <div className="text-gray-600">Day Streak</div>
                    </div>
                  </div>

                  {/* Recent Decks with Images */}
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-900">Recent Decks</h3>
                      <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-medium flex items-center space-x-1">
                        <span>+ Create New</span>
                      </Link>
                    </div>
                    {userDecks.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {userDecks.slice(0, 3).map((deck) => (
                          <DeckCard key={deck.id} deck={deck} />
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-2">No study decks yet</p>
                        <p className="text-sm text-gray-400 mb-6">Generate study materials on the home page to create your first deck</p>
                        <Link 
                          href="/" 
                          className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                          Go to Home
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Decks Tab */}
              {activeTab === 'decks' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">My Study Decks</h3>
                      <p className="text-sm text-gray-600 mt-1">All your generated study materials</p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={handleExportAllData}
                        className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center space-x-2"
                      >
                        <Download size={18} />
                        <span>Export All</span>
                      </button>
                      <Link
                        href="/"
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
                      >
                        <BookOpen size={18} />
                        <span>Create New</span>
                      </Link>
                    </div>
                  </div>

                  {userDecks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {userDecks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                      <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg mb-2">No saved decks yet</p>
                      <p className="text-gray-400 mb-6 max-w-md mx-auto">
                        Generate some flashcards on the home page and they automatically appear here!
                      </p>
                      <Link 
                        href="/" 
                        className="inline-block px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                      >
                        Go to Home
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* History and Preferences tabs remain the same - truncated for brevity */}
              {/* ... keep all existing history and preferences code ... */}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
                <User className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to StudyToks!</h2>
              <p className="text-gray-600 mb-8">
                Sign in to save your study decks, track progress across devices, and unlock personalized features.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleSignIn}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 font-medium flex items-center justify-center space-x-2"
                >
                  <User size={20} />
                  <span>Sign In with Demo Account</span>
                </button>
                
                <button
                  onClick={() => {
                    const guestUser: UserType = {
                      id: 'guest_' + Date.now(),
                      name: 'Guest User',
                      email: 'guest@studytoks.com',
                      isGuest: true,
                      avatarColor: '#6B7280',
                      preferences: {
                        theme: 'light',
                        notifications: true,
                        dailyReminder: true,
                        studyGoal: 30,
                        language: 'en'
                      },
                      studyStats: {
                        totalStudyTime: 0,
                        daysStudied: 0,
                        longestStreak: 0,
                        averageScore: 0,
                        totalDecks: 0,
                        totalFlashcards: 0
                      }
                    };
                    localStorage.setItem('studytoks_user', JSON.stringify(guestUser));
                    setUser(guestUser);
                  }}
                  className="w-full py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center justify-center space-x-2"
                >
                  <span>Continue as Guest</span>
                </button>
                
                <Link 
                  href="/" 
                  className="block w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
                >
                  Back to Home
                </Link>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  Data is stored locally in your browser. Sign in to access from multiple devices.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 px-6 py-8 mt-12">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">StudyToks • AI-Powered Study Cards • Version 2.0</p>
          <div className="flex justify-center space-x-6 mt-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-900">Home</Link>
            <span>•</span>
            <Link href="/account" className="hover:text-gray-900">Account</Link>
            <span>•</span>
            <button className="hover:text-gray-900" onClick={() => alert('Contact: support@studytoks.com')}>
              Support
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}