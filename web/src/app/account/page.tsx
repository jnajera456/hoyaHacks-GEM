"use client";

import { getAllDecks, getUser, saveUser, deleteDeck as deleteDeckUtil } from '@/utils/deckStorage';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { 
  User, BookOpen, Download, Trash2, Settings,
  ChevronRight, Moon, Target, LogOut,
  Edit2, Save, X, Flame, BarChart3, FileText, Home
} from 'lucide-react';

type StudyMaterial = {
  type: 'flashcard' | 'summary' | 'concept' | 'multiple_choice' | 'visual_example' | 'match_game';
  content?: string;
  question?: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
  title?: string;
  pairs?: Array<{term: string; definition: string}>;
  id: string;
};

type GeneratedDeck = {
  id: string;
  title: string;
  materials: StudyMaterial[];
  sourceText?: string;
  generatedAt: string;
  stats?: {
    totalMaterials: number;
    multipleChoice?: number;
    flashcards?: number;
    concepts?: number;
    visualExamples?: number;
    games?: number;
  };
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

export default function AccountPage() {
  const { user: authUser, loading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [userDecks, setUserDecks] = useState<GeneratedDeck[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'decks' | 'preferences'>('overview');
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

  useEffect(() => {
    const userData = getUser();
    const decks = getAllDecks();
    
    if (userData) {
      setUser(userData);
      setUserDecks(decks);
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
          totalDecks: decks.length,
          totalFlashcards: decks.reduce((total, deck) => total + deck.materials.length, 0)
        }
      };
      saveUser(guestUser);
      setUser(guestUser);
      setUserDecks(decks);
    }
  }, []);

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
    
    saveUser(updatedUser);
    setUser(updatedUser);
    setIsEditingProfile(false);
  };

  const handleDeleteDeck = (deckId: string) => {
    if (confirm('Delete this deck? This cannot be undone.')) {
      const success = deleteDeckUtil(deckId);
      
      if (success) {
        const updated = userDecks.filter(d => d.id !== deckId);
        setUserDecks(updated);
        
        if (user) {
          const updatedUser = {
            ...user,
            studyStats: {
              ...user.studyStats,
              totalDecks: updated.length,
              totalFlashcards: updated.reduce((total, deck) => total + deck.materials.length, 0)
            }
          };
          saveUser(updatedUser);
          setUser(updatedUser);
        }
      }
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

  const handleStudyDeck = (deck: GeneratedDeck) => {
    sessionStorage.setItem('currentDeck', JSON.stringify(deck));
    window.location.href = '/results';
  };

  const getMaterialTypeStats = (deck: GeneratedDeck) => {
    const stats = {
      multipleChoice: 0,
      flashcards: 0,
      concepts: 0,
      visualExamples: 0,
      games: 0
    };

    deck.materials.forEach(m => {
      if (m.type === 'multiple_choice') stats.multipleChoice++;
      else if (m.type === 'flashcard') stats.flashcards++;
      else if (m.type === 'concept') stats.concepts++;
      else if (m.type === 'visual_example') stats.visualExamples++;
      else if (m.type === 'match_game') stats.games++;
    });

    return stats;
  };

  const stats = {
    totalDecks: userDecks.length,
    totalMaterials: userDecks.reduce((total, deck) => total + deck.materials.length, 0),
    studyTime: user?.studyStats?.totalStudyTime || 0,
    streak: user?.studyStats?.longestStreak || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home size={20} />
              <span className="font-medium">Home</span>
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">My Study Decks</h1>
          </div>
          
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-gray-900">{user.name}</span>
                <span className="text-xs text-gray-500">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        {user ? (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Left Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Profile Card */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="p-6">
                  <div className="flex flex-col items-center">
                    <div 
                      className="mb-4 flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold text-white"
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
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          placeholder="Your name"
                        />
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          placeholder="Email"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSavePreferences}
                            className="flex-1 rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
                          >
                            <Save size={18} />
                            Save
                          </button>
                          <button
                            onClick={() => setIsEditingProfile(false)}
                            className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50 transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                        <p className="mt-1 text-sm text-gray-600">{user.email}</p>
                        {user.isGuest && (
                          <span className="mt-2 inline-block rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
                            Guest Account
                          </span>
                        )}
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-purple-600 hover:bg-purple-50 transition-colors"
                        >
                          <Edit2 size={16} />
                          <span className="font-medium">Edit Profile</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 ${
                    activeTab === 'overview' 
                      ? 'border-l-4 border-purple-600 bg-purple-50 text-purple-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className={activeTab === 'overview' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className="font-medium">Overview</span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'overview' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
                
                <button
                  onClick={() => setActiveTab('decks')}
                  className={`flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 ${
                    activeTab === 'decks' 
                      ? 'border-l-4 border-purple-600 bg-purple-50 text-purple-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className={activeTab === 'decks' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className="font-medium">My Decks</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {userDecks.length}
                    </span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'decks' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
                
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 ${
                    activeTab === 'preferences' 
                      ? 'border-l-4 border-purple-600 bg-purple-50 text-purple-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Settings size={20} className={activeTab === 'preferences' ? 'text-purple-600' : 'text-gray-400'} />
                    <span className="font-medium">Preferences</span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'preferences' ? 'text-purple-600' : 'text-gray-400'} />
                </button>
              </div>

              {/* Quick Stats */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Decks</span>
                    <span className="font-bold text-gray-900">{stats.totalDecks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Materials</span>
                    <span className="font-bold text-gray-900">{stats.totalMaterials}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Streak</span>
                    <span className="flex items-center font-bold text-gray-900">
                      <Flame size={16} className="mr-1.5 text-orange-500" />
                      {stats.streak} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome Banner */}
                  <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-8 text-white">
                    <div>
                      <h2 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
                      <p className="mt-2 text-purple-100">
                        {stats.totalDecks > 0 
                          ? `You have ${stats.totalDecks} study decks with ${stats.totalMaterials} materials.`
                          : 'Generate your first study deck to get started!'}
                      </p>
                    </div>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-4">
                        <div className="inline-flex rounded-lg bg-blue-50 p-3">
                          <BookOpen className="text-blue-600" size={24} />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">{stats.totalDecks}</div>
                      <div className="text-gray-600">Study Decks</div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-4">
                        <div className="inline-flex rounded-lg bg-green-50 p-3">
                          <FileText className="text-green-600" size={24} />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">{stats.totalMaterials}</div>
                      <div className="text-gray-600">Total Materials</div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                      <div className="mb-4">
                        <div className="inline-flex rounded-lg bg-orange-50 p-3">
                          <Flame className="text-orange-600" size={24} />
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900">{stats.streak}</div>
                      <div className="text-gray-600">Day Streak</div>
                    </div>
                  </div>

                  {/* Recent Decks */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Recent Decks</h3>
                        <Link 
                          href="/" 
                          className="text-sm font-medium text-purple-600 hover:text-purple-700"
                        >
                          + Create New
                        </Link>
                      </div>
                    </div>
                    
                    {userDecks.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userDecks.slice(0, 3).map((deck) => {
                          const deckStats = getMaterialTypeStats(deck);
                          return (
                            <div key={deck.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium text-gray-900">{deck.title}</h4>
                                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                      📅 {new Date(deck.generatedAt).toLocaleDateString()}
                                    </span>
                                    {deckStats.multipleChoice > 0 && <span>🎯 {deckStats.multipleChoice}</span>}
                                    {deckStats.flashcards > 0 && <span>📚 {deckStats.flashcards}</span>}
                                    {deckStats.visualExamples > 0 && <span>🎨 {deckStats.visualExamples}</span>}
                                    {deckStats.games > 0 && <span>🎮 {deckStats.games}</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleStudyDeck(deck)}
                                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 flex items-center gap-2 transition-colors"
                                >
                                  <BookOpen size={14} />
                                  Study
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-6 py-12 text-center">
                        <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500">No study decks yet</p>
                        <Link 
                          href="/" 
                          className="mt-4 inline-block rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-purple-700"
                        >
                          Create First Deck
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'decks' && (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">My Study Decks</h3>
                          <p className="mt-1 text-sm text-gray-600">All your generated study materials</p>
                        </div>
                        <Link
                          href="/"
                          className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-700 flex items-center gap-2 transition-colors"
                        >
                          <BookOpen size={18} />
                          Create New
                        </Link>
                      </div>
                    </div>

                    {userDecks.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userDecks.map((deck) => {
                          const deckStats = getMaterialTypeStats(deck);
                          
                          return (
                            <div key={deck.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start gap-4">
                                    <div className="hidden sm:flex">
                                      <div className="rounded-lg bg-purple-50 p-3">
                                        <BookOpen className="text-purple-600" size={20} />
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-bold text-gray-900">{deck.title}</h4>
                                      <p className="mt-1 text-sm text-gray-600">
                                        {deck.materials.length} interactive study materials
                                      </p>
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {deckStats.multipleChoice > 0 && (
                                          <span className="rounded bg-pink-100 px-2 py-1 text-xs text-pink-700">
                                            🎯 {deckStats.multipleChoice} Quizzes
                                          </span>
                                        )}
                                        {deckStats.flashcards > 0 && (
                                          <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700">
                                            📚 {deckStats.flashcards} Flashcards
                                          </span>
                                        )}
                                        {deckStats.visualExamples > 0 && (
                                          <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                                            🎨 {deckStats.visualExamples} Examples
                                          </span>
                                        )}
                                        {deckStats.games > 0 && (
                                          <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-700">
                                            🎮 {deckStats.games} Games
                                          </span>
                                        )}
                                        {deckStats.concepts > 0 && (
                                          <span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
                                            💡 {deckStats.concepts} Concepts
                                          </span>
                                        )}
                                      </div>
                                      <div className="mt-3 text-sm text-gray-500">
                                        Created {new Date(deck.generatedAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2 sm:ml-4">
                                  <button
                                    onClick={() => handleStudyDeck(deck)}
                                    className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <BookOpen size={14} />
                                    Study
                                  </button>
                                  <button
                                    onClick={() => handleExportDeck(deck)}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Download size={14} />
                                    Export
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeck(deck.id)}
                                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                    Delete
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
                        <p className="text-lg text-gray-500">No saved decks yet</p>
                        <Link 
                          href="/" 
                          className="mt-6 inline-block rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700"
                        >
                          Create Your First Deck
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
                    </div>
                    
                    <div className="p-6 space-y-8">
                      <div>
                        <h4 className="mb-4 flex items-center text-lg font-medium text-gray-900">
                          <Moon size={20} className="mr-2" />
                          Theme
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          {['light', 'dark', 'auto'].map((theme) => (
                            <button
                              key={theme}
                              onClick={() => setEditForm({...editForm, theme: theme as any})}
                              className={`rounded-lg border p-4 text-center capitalize transition-colors ${
                                editForm.theme === theme 
                                  ? 'border-purple-600 bg-purple-50 text-purple-700' 
                                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-4 flex items-center text-lg font-medium text-gray-900">
                          <Target size={20} className="mr-2" />
                          Daily Goal
                        </h4>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-gray-700">Study Goal</span>
                          <span className="font-medium text-purple-600">{editForm.studyGoal} min</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="120"
                          step="5"
                          value={editForm.studyGoal}
                          onChange={(e) => setEditForm({...editForm, studyGoal: parseInt(e.target.value)})}
                          className="w-full"
                        />
                      </div>

                      <button
                        onClick={handleSavePreferences}
                        className="w-full rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition-colors"
                      >
                        Save Preferences
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600">
                <User className="text-white" size={32} />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Welcome!</h2>
              <Link 
                href="/" 
                className="block w-full rounded-lg bg-purple-600 py-3 font-medium text-white hover:bg-purple-700 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}