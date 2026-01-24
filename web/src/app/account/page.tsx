"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
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
  ExternalLink
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
};

// Keep your existing UserType, StudySession types as they are
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
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState<UserType | null>(null);
  const [userDecks, setUserDecks] = useState<GeneratedDeck[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'decks' | 'history' | 'preferences'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    theme: 'light' as 'light' | 'dark' | 'auto',
    notifications: true,
    dailyReminder: true,
    studyGoal: 30,
    language: 'en'
  });

  // Initialize user from auth context
  useEffect(() => {
    if (authUser) {
      const userData: UserType = {
        id: authUser.id,
        name: authUser.name || 'User',
        email: authUser.email,
        avatarColor: '#7C3AED',
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
      setUser(userData);
      setEditForm({
        name: userData.name,
        email: userData.email,
        theme: 'light',
        notifications: true,
        dailyReminder: true,
        studyGoal: 30,
        language: 'en'
      });
    }
  }, [authUser]);

  // Load decks and study sessions from localStorage
  useEffect(() => {
    const savedDecks = localStorage.getItem('studyDecks');
    
    if (savedDecks) {
      try {
        const decks = JSON.parse(savedDecks);
        setUserDecks(decks);
        
        // Update user stats with deck count
        if (user) {
          const totalFlashcards = decks.reduce((total: number, deck: GeneratedDeck) => 
            total + deck.materials.filter(m => m.type === 'flashcard').length, 0);
          
          const updatedUser: UserType = {
            ...user,
            studyStats: {
              totalStudyTime: user.studyStats?.totalStudyTime || 0,
              daysStudied: user.studyStats?.daysStudied || 0,
              longestStreak: user.studyStats?.longestStreak || 0,
              averageScore: user.studyStats?.averageScore || 0,
              totalDecks: decks.length,
              totalFlashcards: totalFlashcards
            }
          };
          setUser(updatedUser);
        }
      } catch (error) {
        console.error('Error parsing decks:', error);
      }
    }
    
    // Load study sessions
    const savedSessions = localStorage.getItem('studytoks_sessions');
    if (savedSessions) {
      setStudySessions(JSON.parse(savedSessions));
    }
  }, [user]);

  const handleSignOut = async () => {
    await logout();
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

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Are you sure you want to delete this deck? This action cannot be undone.')) {
      const updated = userDecks.filter(d => d.id !== deckId);
      setUserDecks(updated);
      localStorage.setItem('studyDecks', JSON.stringify(updated));
      
      // Update user stats
      if (user) {
        const totalFlashcards = updated.reduce((total: number, deck: GeneratedDeck) => 
          total + deck.materials.filter(m => m.type === 'flashcard').length, 0);
        
        const updatedUser: UserType = {
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
      
      alert('Deck deleted successfully!');
    }
  };

  const handleExportDeck = (deck: GeneratedDeck) => {
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
    // Store the deck in session storage for the results page
    sessionStorage.setItem('currentDeck', JSON.stringify(deck));
    window.location.href = '/results';
  };

  // Calculate stats
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

  // Format time in hours and minutes
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get recent sessions (last 5)
  const recentSessions = studySessions.slice(0, 5);

  // Calculate today's study time (mock for demo)
  const todayStudyTime = 45;

  // Get unique subjects from deck tags
  const getDeckSubjects = (deck: GeneratedDeck) => {
    const allTags = deck.materials.flatMap(m => m.tags || []);
    const uniqueTags = [...new Set(allTags)];
    return uniqueTags.slice(0, 3);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
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
                className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 flex items-center space-x-2 transition-colors"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </header>

      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!user ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Left Sidebar - Profile & Navigation */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
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
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
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
                        className="mt-4 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg flex items-center space-x-2"
                      >
                        <Edit2 size={16} />
                        <span>Edit Profile</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Navigation */}
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

              {/* Quick Stats */}
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

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              {/* Overview Tab */}
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

                  {/* Recent Decks */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <h3 className="font-bold text-gray-900">Recent Decks</h3>
                      <Link href="/" className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                        + Create New
                      </Link>
                    </div>
                    {userDecks.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userDecks.slice(0, 3).map((deck) => (
                          <div key={deck.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900">{deck.title}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <Calendar size={14} className="mr-1" />
                                    {new Date(deck.generatedAt).toLocaleDateString()}
                                  </span>
                                  <span>{deck.materials.length} materials</span>
                                  <span>{deck.materials.filter(m => m.type === 'flashcard').length} flashcards</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <button
                                  onClick={() => handleStudyDeck(deck)}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 text-sm"
                                >
                                  <BookOpen size={14} />
                                  <span>Study</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-6 py-8 text-center text-gray-500">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <p>No study decks yet</p>
                        <p className="text-sm mt-2">Generate study materials on the home page to create your first deck</p>
                        <Link 
                          href="/" 
                          className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
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
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-gray-900">My Study Decks</h3>
                        <p className="text-sm text-gray-600 mt-1">All your generated study materials</p>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleExportAllData}
                          className="px-4 py-2 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 flex items-center space-x-2"
                        >
                          <Download size={18} />
                          <span>Export All</span>
                        </button>
                        <Link
                          href="/"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                        >
                          <BookOpen size={18} />
                          <span>Create New</span>
                        </Link>
                      </div>
                    </div>

                    {userDecks.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userDecks.map((deck) => {
                          const flashcardCount = deck.materials.filter(m => m.type === 'flashcard').length;
                          const summaryCount = deck.materials.filter(m => m.type === 'summary').length;
                          const conceptCount = deck.materials.filter(m => m.type === 'concept').length;
                          const tags = getDeckSubjects(deck);

                          return (
                            <div key={deck.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                      <BookOpen className="text-purple-600" size={20} />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900">{deck.title}</h4>
                                      <p className="text-gray-600 text-sm mt-1">
                                        {deck.sourceText || "Generated from study materials"}
                                      </p>
                                      <div className="flex flex-wrap gap-2 mt-3">
                                        {tags.map((tag, index) => (
                                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                      <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                        <span className="flex items-center">
                                          <FileText size={14} className="mr-1" />
                                          {flashcardCount} flashcards, {summaryCount} summaries, {conceptCount} concepts
                                        </span>
                                        <span className="flex items-center">
                                          <Calendar size={14} className="mr-1" />
                                          {new Date(deck.generatedAt).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col space-y-2 ml-4">
                                  <button
                                    onClick={() => handleStudyDeck(deck)}
                                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2 text-sm font-medium"
                                  >
                                    <BookOpen size={14} />
                                    <span>Study</span>
                                  </button>
                                  <button
                                    onClick={() => handleExportDeck(deck)}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center justify-center space-x-2 text-sm font-medium"
                                  >
                                    <Download size={14} />
                                    <span>Export</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeck(deck.id)}
                                    className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center space-x-2 text-sm font-medium"
                                  >
                                    <Trash2 size={14} />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <BookOpen size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg">No saved decks yet</p>
                        <p className="text-gray-400 mt-2 max-w-md mx-auto">
                          Generate some flashcards on the home page and they'll automatically appear here!
                        </p>
                        <Link 
                          href="/" 
                          className="inline-block mt-6 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                          Go to Home
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Study History</h3>
                      <p className="text-sm text-gray-600 mt-1">Track all your past study sessions</p>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {studySessions.map((session) => (
                        <div key={session.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-start space-x-4">
                              <div className={`p-3 rounded-lg ${session.score >= 80 ? 'bg-green-50' : session.score >= 60 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                                <TrendingUp className={session.score >= 80 ? 'text-green-600' : session.score >= 60 ? 'text-yellow-600' : 'text-red-600'} size={20} />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900">{session.deckTitle}</h4>
                                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <Calendar size={14} className="mr-1" />
                                    {new Date(session.date).toLocaleDateString('en-US', { 
                                      weekday: 'short', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                  <span className="flex items-center">
                                    <Clock size={14} className="mr-1" />
                                    {session.duration} minutes
                                  </span>
                                  <span className="flex items-center">
                                    <FileText size={14} className="mr-1" />
                                    {session.cardsStudied} cards
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-6">
                              <div className="text-right">
                                <div className={`text-2xl font-bold ${session.score >= 80 ? 'text-green-600' : session.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                  {session.score}%
                                </div>
                                <div className="text-xs text-gray-500">Score</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {studySessions.length === 0 && (
                      <div className="px-6 py-12 text-center">
                        <History size={64} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 text-lg">No study history yet</p>
                        <p className="text-gray-400 mt-2 max-w-md mx-auto">
                          Start studying your decks to build your study history and track progress over time.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preferences Tab */}
              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h3 className="font-bold text-gray-900">Preferences</h3>
                      <p className="text-sm text-gray-600 mt-1">Customize your StudyToks experience</p>
                    </div>
                    
                    <div className="p-6 space-y-8">
                      {/* Theme Settings */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Moon size={18} className="mr-2" />
                          Theme Settings
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button
                            onClick={() => setEditForm({...editForm, theme: 'light'})}
                            className={`p-4 border rounded-lg text-center ${editForm.theme === 'light' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            <div className="text-lg mb-2">🌞</div>
                            <div className="font-medium">Light</div>
                          </button>
                          <button
                            onClick={() => setEditForm({...editForm, theme: 'dark'})}
                            className={`p-4 border rounded-lg text-center ${editForm.theme === 'dark' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            <div className="text-lg mb-2">🌙</div>
                            <div className="font-medium">Dark</div>
                          </button>
                          <button
                            onClick={() => setEditForm({...editForm, theme: 'auto'})}
                            className={`p-4 border rounded-lg text-center ${editForm.theme === 'auto' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}
                          >
                            <div className="text-lg mb-2">⚙️</div>
                            <div className="font-medium">Auto</div>
                          </button>
                        </div>
                      </div>

                      {/* Notifications */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Bell size={18} className="mr-2" />
                          Notifications
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Study Reminders</div>
                              <div className="text-sm text-gray-600">Get daily reminders to study</div>
                            </div>
                            <button
                              onClick={() => setEditForm({...editForm, dailyReminder: !editForm.dailyReminder})}
                              className={`w-12 h-6 rounded-full transition-colors ${editForm.dailyReminder ? 'bg-purple-600' : 'bg-gray-300'}`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${editForm.dailyReminder ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">Progress Updates</div>
                              <div className="text-sm text-gray-600">Weekly study progress reports</div>
                            </div>
                            <button
                              onClick={() => setEditForm({...editForm, notifications: !editForm.notifications})}
                              className={`w-12 h-6 rounded-full transition-colors ${editForm.notifications ? 'bg-purple-600' : 'bg-gray-300'}`}
                            >
                              <div className={`w-5 h-5 rounded-full bg-white transform transition-transform ${editForm.notifications ? 'translate-x-7' : 'translate-x-1'} mt-0.5`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Study Goals */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Target size={18} className="mr-2" />
                          Study Goals
                        </h4>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium">Daily Study Goal</div>
                            <div className="text-purple-600 font-medium">{editForm.studyGoal} minutes</div>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="120"
                            step="5"
                            value={editForm.studyGoal}
                            onChange={(e) => setEditForm({...editForm, studyGoal: parseInt(e.target.value)})}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <span>10 min</span>
                            <span>120 min</span>
                          </div>
                        </div>
                      </div>

                      {/* Language */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Globe size={18} className="mr-2" />
                          Language
                        </h4>
                        <select
                          value={editForm.language}
                          onChange={(e) => setEditForm({...editForm, language: e.target.value})}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="pt-6 border-t border-gray-200">
                        <button
                          onClick={handleSavePreferences}
                          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                        >
                          Save Preferences
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Data Management */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <h4 className="font-bold text-gray-900">Data Management</h4>
                    </div>
                    <div className="p-6 space-y-4">
                      <button
                        onClick={handleExportAllData}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <Download size={20} />
                          <div className="text-left">
                            <div className="font-medium">Export All Data</div>
                            <div className="text-sm text-gray-600">Download your decks, history, and settings</div>
                          </div>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to clear all study history? This cannot be undone.')) {
                            setStudySessions([]);
                            localStorage.removeItem('studytoks_sessions');
                          }
                        }}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-between text-red-600"
                      >
                        <div className="flex items-center space-x-3">
                          <Trash2 size={20} />
                          <div className="text-left">
                            <div className="font-medium">Clear Study History</div>
                            <div className="text-sm">Remove all past study sessions</div>
                          </div>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
    </ProtectedRoute>
  );
}