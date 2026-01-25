export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'text/plain',
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.txt'],
  
  // AI Configuration
  MAX_TEXT_LENGTH: 3000, // Characters sent to AI
  MIN_TEXT_LENGTH: 50, // Minimum text to process
  
  // UI Configuration
  MAX_UPLOAD_FILES: 3,
  
  // Storage Configuration
  STORAGE_KEYS: {
    DECKS: 'studyDecks',
    USER: 'reelstudy_user',
    SESSIONS: 'reelstudy_sessions',
    CURRENT_DECK: 'currentDeck'
  }
};