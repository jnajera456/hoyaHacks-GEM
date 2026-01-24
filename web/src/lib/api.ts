/**
 * API client with hybrid storage strategy
 * Falls back to localStorage when MongoDB is unavailable
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  token?: string | null;
}

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// Get token from localStorage
function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem('auth_token');
}

// Set token in localStorage
function setToken(token: string | null) {
  if (!isBrowser) return;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

async function apiCall(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, token } = options;
  const authToken = token || getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (response.status === 401) {
      // Token expired or invalid
      setToken(null);
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API error');
    }

    return data;
  } catch (error) {
    console.error(`API call failed: ${endpoint}`, error);
    throw error;
  }
}

// Authentication
export const authAPI = {
  signup: async (email: string, password: string, name: string) => {
    const data = await apiCall('/auth', {
      method: 'POST',
      body: { action: 'signup', email, password, name },
    });
    setToken(data.token);
    return data.user;
  },

  signin: async (email: string, password: string) => {
    const data = await apiCall('/auth', {
      method: 'POST',
      body: { action: 'signin', email, password },
    });
    setToken(data.token);
    return data.user;
  },

  guestLogin: async () => {
    const data = await apiCall('/auth', {
      method: 'POST',
      body: { action: 'guest' },
    });
    setToken(data.token);
    return data.user;
  },

  logout: () => {
    setToken(null);
  },
};

// User
export const userAPI = {
  getProfile: async () => {
    return apiCall('/users');
  },

  updateProfile: async (userData: any) => {
    return apiCall('/users', {
      method: 'PUT',
      body: userData,
    });
  },
};

// Decks
export const deckAPI = {
  getDecks: async () => {
    return apiCall('/decks');
  },

  createDeck: async (deckData: any) => {
    return apiCall('/decks', {
      method: 'POST',
      body: deckData,
    });
  },

  updateDeck: async (deckId: string, deckData: any) => {
    return apiCall(`/decks/${deckId}`, {
      method: 'PUT',
      body: deckData,
    });
  },

  deleteDeck: async (deckId: string) => {
    return apiCall(`/decks/${deckId}`, {
      method: 'DELETE',
    });
  },
};

// Study Sessions
export const sessionAPI = {
  getSessions: async () => {
    return apiCall('/sessions');
  },

  createSession: async (sessionData: any) => {
    return apiCall('/sessions', {
      method: 'POST',
      body: sessionData,
    });
  },
};

// Hybrid storage strategy - tries DB first, falls back to localStorage
export const hybridStorage = {
  /**
   * Get user from DB or localStorage
   */
  async getUser() {
    try {
      return await userAPI.getProfile();
    } catch (error) {
      // Fall back to localStorage
      if (isBrowser) {
        const saved = localStorage.getItem('studytoks_user');
        if (saved) return JSON.parse(saved);
      }
      throw error;
    }
  },

  /**
   * Get decks from DB or localStorage
   */
  async getDecks() {
    try {
      return await deckAPI.getDecks();
    } catch (error) {
      // Fall back to localStorage
      if (isBrowser) {
        const saved = localStorage.getItem('studytoks_decks');
        if (saved) return JSON.parse(saved);
      }
      return [];
    }
  },

  /**
   * Get sessions from DB or localStorage
   */
  async getSessions() {
    try {
      return await sessionAPI.getSessions();
    } catch (error) {
      // Fall back to localStorage
      if (isBrowser) {
        const saved = localStorage.getItem('studytoks_sessions');
        if (saved) return JSON.parse(saved);
      }
      return [];
    }
  },

  /**
   * Save user to both DB and localStorage (dual-write for consistency)
   */
  async saveUser(user: any) {
    // Save to localStorage immediately for offline support
    if (isBrowser) {
      localStorage.setItem('studytoks_user', JSON.stringify(user));
    }

    try {
      // Sync to MongoDB in background
      await userAPI.updateProfile(user);
    } catch (error) {
      console.warn('Failed to sync user to DB, using localStorage fallback', error);
    }

    return user;
  },

  /**
   * Save deck to both DB and localStorage
   */
  async saveDeck(deck: any) {
    // Save to localStorage immediately
    if (isBrowser) {
      const existingDecks = await this.getDecks();
      const decks = Array.isArray(existingDecks)
        ? existingDecks.map((d: any) => (d.id === deck.id ? deck : d))
        : [deck];
      localStorage.setItem('studytoks_decks', JSON.stringify(decks));
    }

    try {
      // Sync to MongoDB
      if (deck.id && deck.id.startsWith('deck_')) {
        await deckAPI.updateDeck(deck.id, deck);
      } else {
        await deckAPI.createDeck(deck);
      }
    } catch (error) {
      console.warn('Failed to sync deck to DB, using localStorage fallback', error);
    }

    return deck;
  },

  /**
   * Delete deck from both DB and localStorage
   */
  async deleteDeck(deckId: string) {
    // Delete from localStorage immediately
    if (isBrowser) {
      const existingDecks = await this.getDecks();
      const decks = Array.isArray(existingDecks)
        ? existingDecks.filter((d: any) => d.id !== deckId)
        : [];
      localStorage.setItem('studytoks_decks', JSON.stringify(decks));
    }

    try {
      // Delete from MongoDB
      await deckAPI.deleteDeck(deckId);
    } catch (error) {
      console.warn('Failed to delete deck from DB, using localStorage fallback', error);
    }
  },

  /**
   * Save session to both DB and localStorage
   */
  async saveSession(session: any) {
    // Save to localStorage immediately
    if (isBrowser) {
      const existingSessions = await this.getSessions();
      const sessions = Array.isArray(existingSessions)
        ? [session, ...existingSessions]
        : [session];
      localStorage.setItem('studytoks_sessions', JSON.stringify(sessions));
    }

    try {
      // Sync to MongoDB
      await sessionAPI.createSession(session);
    } catch (error) {
      console.warn('Failed to sync session to DB, using localStorage fallback', error);
    }

    return session;
  },
};

/**
 * Feature flag for storage mode
 * Set to 'db' to use MongoDB, 'local' to use localStorage only
 * Default: 'hybrid' tries DB first, falls back to localStorage
 */
export const STORAGE_MODE: 'db' | 'local' | 'hybrid' =
  (process.env.NEXT_PUBLIC_STORAGE_MODE as any) || 'hybrid';
