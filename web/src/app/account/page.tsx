"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { FileParser } from '@/utils/fileParser';
import { 
  User, BookOpen, Trash2, Settings,
  ChevronRight, LogOut,
  Edit2, Save, X, BarChart3, FileText, Home, Plus
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

type DeckRecord = { id: string; deck: GeneratedDeck };

type UserType = {
  id: string;
  name: string;
  email: string;
  isGuest?: boolean;
  avatarColor?: string;
};

export default function AccountPage() {
  const { user: authUser, loading: authLoading, error: authError, logout } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<UserType | null>(null);
  const [userDecks, setUserDecks] = useState<DeckRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'decks'>('overview');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
  });

  const [showAugmentModal, setShowAugmentModal] = useState(false);
  const [augmentDeckId, setAugmentDeckId] = useState<string | null>(null);
  const [augmentText, setAugmentText] = useState('');
  const [augmentFile, setAugmentFile] = useState<File | null>(null);
  const [augmentLoading, setAugmentLoading] = useState(false);

  const [renamingDeckId, setRenamingDeckId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        // who am I
        const meRes = await fetch('/api/auth/me', { credentials: 'include' });
        if (meRes.ok) {
          const me = await meRes.json();
          setUser({ id: me.user.id, name: me.user.name || '', email: me.user.email });
          setEditForm((prev) => ({
            ...prev,
            name: me.user.name || '',
          }));
        }
        // decks
        const decksRes = await fetch('/api/decks', { credentials: 'include' });
        if (decksRes.ok) {
          const data = await decksRes.json();
          const decks = (data.decks || []).map((d: any) => ({ id: d.id, deck: d.deck }));
          setUserDecks(decks);
        }
      } catch (e) {
        console.error('Failed to load account data', e);
      }
    };
    load();
  }, []);

  const handleSaveProfile = async () => {
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: editForm.name })
      });
      if (res.ok) {
        const updated = await res.json();
        setUser((prev) => prev ? { ...prev, name: updated.name } : prev);
        setIsEditingProfile(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (e) {
      console.error('Error updating profile', e);
    }
  };

  const handleDeleteDeck = async (deckId: string) => {
    if (!confirm('Delete this deck? This cannot be undone.')) return;
    try {
      await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const updated = userDecks.filter(d => d.id !== deckId);
      setUserDecks(updated);
    } catch (e) {
      console.error('Failed to delete deck', e);
    }
  };

  const handleRenameDeck = async (deckId: string, newTitle: string) => {
    if (!newTitle.trim()) {
      alert('Title cannot be empty');
      return;
    }
    try {
      const response = await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title: newTitle.trim() })
      });
      if (response.ok) {
        setUserDecks(prev => prev.map(record => 
          record.id === deckId 
            ? { ...record, deck: { ...record.deck, title: newTitle.trim() } }
            : record
        ));
        setRenamingDeckId(null);
        setRenameValue('');
      } else {
        alert('Failed to rename deck');
      }
    } catch (e) {
      console.error('Failed to rename deck', e);
      alert('Error renaming deck');
    }
  };

  const handleAugmentFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return false;
    }
    setAugmentFile(file);
    return false;
  };

  const handleAugmentSubmit = async () => {
    if (!augmentDeckId) return;
    
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
      const response = await fetch(`/api/decks/${augmentDeckId}/augment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ text: contentToSend, fileName, fileType })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert(`Added ${data.newMaterials.length} materials!`);
        // Update the deck in state
        setUserDecks(prev => prev.map(record => 
          record.id === augmentDeckId 
            ? { ...record, deck: data.deck }
            : record
        ));
        setShowAugmentModal(false);
        setAugmentDeckId(null);
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

  const handleStudyDeck = (record: DeckRecord) => {
    sessionStorage.setItem('currentDeck', JSON.stringify(record.deck));
    sessionStorage.setItem('currentDeckId', record.id);
    window.location.href = `/results?id=${encodeURIComponent(record.id)}`;
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
    totalMaterials: userDecks.reduce((total, record) => total + record.deck.materials.length, 0),
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <BookOpen size={64} className="text-gray-300 mb-4" />
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No Decks Yet</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">
        Start by creating your first study deck from the home page.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-lg bg-[#fa541c] px-6 py-3 text-sm font-medium text-white hover:bg-[#ff7a45] transition-colors"
      >
        <Home size={18} />
        Go to Home
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Global Navbar is rendered via layout; removed duplicate header */}

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
                      style={{ backgroundColor: user.avatarColor || '#fa541c' }}
                    >
                      {user.name.charAt(0)}
                    </div>
                    
                    {isEditingProfile ? (
                      <div className="w-full space-y-4">
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 focus:outline-none"
                          placeholder="Your name"
                        />
                        {/* Email editing disabled: email is immutable */}
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveProfile}
                            className="flex-1 rounded-lg bg-[#fa541c] px-4 py-2 font-medium text-white hover:bg-[#ff7a45] flex items-center justify-center gap-2 transition-colors"
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
                          className="mt-4 flex items-center gap-2 rounded-lg px-4 py-2 text-[#fa541c] hover:bg-orange-50 transition-colors"
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
                      ? 'border-l-4 border-orange-500 bg-orange-50 text-orange-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className={activeTab === 'overview' ? 'text-[#fa541c]' : 'text-gray-400'} />
                    <span className="font-medium">Overview</span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'overview' ? 'text-[#fa541c]' : 'text-gray-400'} />
                </button>
                
                <button
                  onClick={() => setActiveTab('decks')}
                  className={`flex w-full items-center justify-between px-6 py-4 transition-colors hover:bg-gray-50 ${
                    activeTab === 'decks' 
                      ? 'border-l-4 border-orange-500 bg-orange-50 text-orange-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={20} className={activeTab === 'decks' ? 'text-[#fa541c]' : 'text-gray-400'} />
                    <span className="font-medium">My Decks</span>
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {userDecks.length}
                    </span>
                  </div>
                  <ChevronRight size={18} className={activeTab === 'decks' ? 'text-[#fa541c]' : 'text-gray-400'} />
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
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Welcome Banner */}
                  <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 p-8 text-white">
                    <div>
                      <h2 className="text-2xl font-bold">Welcome back, {user.name.split(' ')[0]}! 👋</h2>
                      <p className="mt-2 text-orange-100">
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

                  </div>

                  {/* Recent Decks */}
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Recent Decks</h3>
                        <Link 
                          href="/" 
                          className="text-sm font-medium text-[#fa541c] hover:text-[#ff7a45]"
                        >
                          + Create New
                        </Link>
                      </div>
                    </div>
                    
                    {userDecks.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userDecks.slice(0, 3).map((record) => {
                          const deck = record.deck;
                          const deckStats = getMaterialTypeStats(deck);
                          return (
                            <div key={record.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
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
                                  onClick={() => handleStudyDeck(record)}
                                  className="rounded-lg bg-[#fa541c] px-4 py-2 text-sm font-medium text-white hover:bg-[#ff7a45] flex items-center gap-2 transition-colors"
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
                          className="mt-4 inline-block rounded-lg bg-[#fa541c] px-6 py-2 font-medium text-white hover:bg-[#ff7a45]"
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
                          className="rounded-lg bg-[#fa541c] px-4 py-2 font-medium text-white hover:bg-[#ff7a45] flex items-center gap-2 transition-colors"
                        >
                          <BookOpen size={18} />
                          Create New
                        </Link>
                      </div>
                    </div>

                    {userDecks.length > 0 ? (
                      <div className="divide-y divide-gray-200">
                        {userDecks.map((record) => {
                          const deck = record.deck;
                          const deckStats = getMaterialTypeStats(deck);
                          
                          return (
                            <div key={record.id} className="px-6 py-6 hover:bg-gray-50 transition-colors">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                  <div className="flex items-start gap-4">
                                    <div className="hidden sm:flex">
                                      <div className="rounded-lg bg-orange-50 p-3">
                                        <BookOpen className="text-[#fa541c]" size={20} />
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
                                          <span className="rounded bg-orange-100 px-2 py-1 text-xs text-orange-700">
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
                                    onClick={() => handleStudyDeck(record)}
                                    className="rounded-lg bg-[#fa541c] px-4 py-2 text-sm font-medium text-white hover:bg-[#ff7a45] flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <BookOpen size={14} />
                                    Study
                                  </button>
                                  <button
                                    onClick={() => {
                                      setAugmentDeckId(record.id);
                                      setShowAugmentModal(true);
                                    }}
                                    className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100 flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Plus size={14} />
                                    Add Materials
                                  </button>
                                  <button
                                    onClick={() => {
                                      setRenamingDeckId(record.id);
                                      setRenameValue(deck.title);
                                    }}
                                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                                  >
                                    <Edit2 size={14} />
                                    Rename
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDeck(record.id)}
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
                          className="mt-6 inline-block rounded-lg bg-[#fa541c] px-6 py-3 font-medium text-white hover:bg-[#ff7a45]"
                        >
                          Create Your First Deck
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300">
                <User className="text-white" size={32} />
              </div>
              <h2 className="mb-4 text-2xl font-bold text-gray-900">Welcome!</h2>
              <Link 
                href="/" 
                className="block w-full rounded-lg bg-[#fa541c] py-3 font-medium text-white hover:bg-[#ff7a45] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}

        {/* Augment Deck Modal */}
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
                      setAugmentDeckId(null);
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

        {/* Rename Deck Modal */}
        {renamingDeckId && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">Rename Deck</h2>
                
                <div>
                  <label className="block text-sm font-semibold mb-2">New Deck Title</label>
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleRenameDeck(renamingDeckId, renameValue);
                      } else if (e.key === 'Escape') {
                        setRenamingDeckId(null);
                        setRenameValue('');
                      }
                    }}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Enter new deck title..."
                    autoFocus
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setRenamingDeckId(null);
                      setRenameValue('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRenameDeck(renamingDeckId, renameValue)}
                    className="flex-1 px-4 py-2 bg-[#fa541c] text-white rounded-lg hover:bg-[#ff7a45] transition-colors"
                  >
                    Rename
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}