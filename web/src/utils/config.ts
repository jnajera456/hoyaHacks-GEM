export const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: [
    'application/pdf',
    'text/plain',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.pdf', '.txt', '.mp4', '.mov', '.mp3', '.wav', '.doc', '.docx'],
  
  // AI Configuration
  MAX_TEXT_LENGTH: 3000, // Characters sent to AI
  MIN_TEXT_LENGTH: 50, // Minimum text to process
  
  // UI Configuration
  MAX_UPLOAD_FILES: 3,
  
  // Storage Configuration
  STORAGE_KEYS: {
    DECKS: 'studyDecks',
    USER: 'studytoks_user',
    SESSIONS: 'studytoks_sessions',
    CURRENT_DECK: 'currentDeck'
  }
};