/**
 * Save a deck to localStorage
 */
export function saveDeck(deck: GeneratedDeck): boolean {
  try {
    const decks = JSON.parse(localStorage.getItem('studyDecks') || '[]');
    
    // Remove any existing deck with same ID
    const filteredDecks = decks.filter((d: GeneratedDeck) => d.id !== deck.id);
    filteredDecks.push(deck);
    
    localStorage.setItem('studyDecks', JSON.stringify(filteredDecks));
    return true;
  } catch (error) {
    console.error('Error saving deck:', error);
    return false;
  }
}

/**
 * Get all saved decks
 */
export function getAllDecks(): GeneratedDeck[] {
  try {
    return JSON.parse(localStorage.getItem('studyDecks') || '[]');
  } catch (error) {
    console.error('Error loading decks:', error);
    return [];
  }
}

/**
 * Delete a deck by ID
 */
export function deleteDeck(deckId: string): boolean {
  try {
    const decks = getAllDecks();
    const updatedDecks = decks.filter(deck => deck.id !== deckId);
    localStorage.setItem('studyDecks', JSON.stringify(updatedDecks));
    return true;
  } catch (error) {
    console.error('Error deleting deck:', error);
    return false;
  }
}
// utils/deckStorage.ts (or whatever your file is named)
export interface StudyMaterial {
  type: 'flashcard' | 'summary' | 'concept' | 'multiple_choice' | 'visual_example' | 'match_game';
  content?: string;
  explanation?: string;
  id: string;
  // Multiple choice fields
  question?: string;
  options?: string[];
  correctIndex?: number;
  // Visual example fields
  title?: string;
  // Match game fields
  pairs?: Array<{term: string; definition: string}>;
}

export interface GeneratedDeck {
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
}

// Keep your existing functions but maybe add:
export function getDeck(deckId: string): GeneratedDeck | null {
  try {
    const decks = getAllDecks();
    return decks.find(deck => deck.id === deckId) || null;
  } catch (error) {
    console.error('Error getting deck:', error);
    return null;
  }
}

// Optional: Add user storage functions
export interface UserType {
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
}

export function getUser(): UserType | null {
  try {
    return JSON.parse(localStorage.getItem('studytoks_user') || 'null');
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export function saveUser(user: UserType): boolean {
  try {
    localStorage.setItem('studytoks_user', JSON.stringify(user));
    return true;
  } catch (error) {
    console.error('Error saving user:', error);
    return false;
  }
}