/**
 * API client for database-first architecture
 * All data comes from MongoDB - localStorage used only as read-through cache for optimization
 * No offline support, no dual-write, no sync logic
 */

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

// Check if we're in browser
const isBrowser = typeof window !== 'undefined';

// No client-side token; we use httpOnly cookies

// Generic API call helper
async function apiCall(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`/api${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (response.status === 401) {
      throw new Error('Unauthorized - session expired');
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

// Authentication - Simplified for hackathon (no strong security hardening)
export const authAPI = {} as const;

// User Profile
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

// Topics - User-created study topics (replaces old Decks)
export const topicAPI = {
  list: async () => {
    const response = await apiCall('/topics');
    return response.topics || [];
  },

  create: async (title: string, description?: string, subject?: string, tags?: string[]) => {
    const response = await apiCall('/topics', {
      method: 'POST',
      body: { title, description, subject, tags },
    });
    return response.topic;
  },

  get: async (topicId: string) => {
    const response = await apiCall(`/topics/${topicId}`);
    return response.topic;
  },

  update: async (topicId: string, updates: any) => {
    const response = await apiCall(`/topics/${topicId}`, {
      method: 'PUT',
      body: updates,
    });
    return response.topic;
  },

  delete: async (topicId: string) => {
    return apiCall(`/topics/${topicId}`, {
      method: 'DELETE',
    });
  },
};

// Uploaded Files - Files uploaded to a topic
export const uploadedFileAPI = {
  listByTopic: async (topicId: string) => {
    const response = await apiCall(`/topics/${topicId}/files`);
    return response.files || [];
  },

  // Create metadata entry for uploaded file
  // Actual file upload happens separately via cloud storage service
  createMetadata: async (topicId: string, fileMetadata: any) => {
    const response = await apiCall(`/topics/${topicId}/files`, {
      method: 'POST',
      body: fileMetadata,
    });
    return response.file;
  },
};

// Generated Content - AI-generated study materials (videos, summaries, flashcards, etc.)
export const generatedContentAPI = {
  listByTopic: async (topicId: string) => {
    const response = await apiCall(`/topics/${topicId}/generated`);
    return response.generatedContent || [];
  },

  create: async (topicId: string, contentData: any) => {
    const response = await apiCall(`/topics/${topicId}/generated`, {
      method: 'POST',
      body: contentData,
    });
    return response.generatedContent;
  },
};

