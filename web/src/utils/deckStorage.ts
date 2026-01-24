// Simple utility functions for deck storage

export interface StudyMaterial {
  type: 'flashcard' | 'summary' | 'concept';
  content: string;
  explanation?: string;
  tags?: string[];
  id: string;
}

export interface GeneratedDeck {
  id: string;
  title: string;
  materials: StudyMaterial[];
  sourceText?: string;
  generatedAt: string;
}

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