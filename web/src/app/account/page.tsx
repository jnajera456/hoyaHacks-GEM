"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AccountPage() {
  const [user, setUser] = useState<any>(null);
  const [userDecks, setUserDecks] = useState<any[]>([]);

  // Load user and decks from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('studytoks_user');
    const savedDecks = localStorage.getItem('studytoks_decks');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (savedDecks) {
      setUserDecks(JSON.parse(savedDecks));
    }
  }, []);

  const handleSignIn = () => {
    const demoUser = {
      id: 'demo_' + Date.now(),
      name: 'Demo Student',
      email: 'demo@studytoks.com'
    };
    localStorage.setItem('studytoks_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const handleSignOut = () => {
    localStorage.removeItem('studytoks_user');
    setUser(null);
  };

  const stats = {
    totalCards: userDecks.reduce((sum, deck) => sum + (deck.content?.flashcards?.length || 0), 0),
    totalDecks: userDecks.length,
    studyTime: '12h 30m',
    mastery: 78
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← Back
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
          </div>
          {user && (
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {user ? (
          <div className="space-y-8">
            {/* Profile Section */}
            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
                  <span className="text-white text-2xl">👤</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-600">{user.email}</p>
                  {user.isGuest && (
                    <span className="inline-block mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                      Guest Account
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Study Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{stats.totalCards}</div>
                  <div className="text-gray-600">Total Cards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.totalDecks}</div>
                  <div className="text-gray-600">Saved Decks</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.studyTime}</div>
                  <div className="text-gray-600">Study Time</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{stats.mastery}%</div>
                  <div className="text-gray-600">Mastery</div>
                </div>
              </div>
            </div>

            {/* Saved Decks Section */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Saved Decks ({userDecks.length})</h3>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(userDecks, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `studytoks-decks.json`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Export All
                </button>
              </div>

              {userDecks.length > 0 ? (
                <div className="space-y-4">
                  {userDecks.map((deck) => (
                    <div
                      key={deck.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{deck.title}</h4>
                          <p className="text-gray-600 text-sm mt-1">{deck.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>📊 {deck.content?.flashcards?.length || 0} cards</span>
                            <span>📅 {new Date(deck.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => {
                              localStorage.setItem('current_studytoks_deck', JSON.stringify(deck.content));
                              alert('Deck loaded! Go to home page to study it.');
                            }}
                            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('Delete this deck?')) {
                                const updated = userDecks.filter(d => d.id !== deck.id);
                                setUserDecks(updated);
                                localStorage.setItem('studytoks_decks', JSON.stringify(updated));
                              }
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-gray-500 text-lg">No saved decks yet</p>
                  <p className="text-gray-400 mt-2">
                    Generate some flashcards on the home page and save them here!
                  </p>
                  <Link href="/" className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Go to Home
                  </Link>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Not Signed In View */
          <div className="max-w-md mx-auto">
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-2xl">🔒</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-8">
                Sign in to save your study decks, track progress, and access your materials from any device.
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={handleSignIn}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Sign In with Demo Account
                </button>
                
                <button
                  onClick={() => {
                    const guestUser = {
                      id: 'guest_' + Date.now(),
                      name: 'Guest User',
                      email: 'guest@studytoks.com',
                      isGuest: true
                    };
                    localStorage.setItem('studytoks_user', JSON.stringify(guestUser));
                    setUser(guestUser);
                  }}
                  className="w-full py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50"
                >
                  Continue as Guest
                </button>
                
                <Link href="/" className="block w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  Back to Home
                </Link>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  For demo purposes only. Data is stored in your browser.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-600">StudyToks • AI-Powered Study Cards</p>
        </div>
      </footer>
    </div>
  );
}