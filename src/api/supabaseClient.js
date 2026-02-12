const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }

  return response.json();
};

export const db = {
  familyMembers: {
    list: async () => {
      try {
        return await apiCall('/members');
      } catch (error) {
        console.error('Error fetching family members:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        return await apiCall('/members', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error creating family member:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        return await apiCall(`/members/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error updating family member:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        return await apiCall(`/members/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting family member:', error);
        throw error;
      }
    }
  },

  familyPhotos: {
    list: async () => {
      try {
        return await apiCall('/photos');
      } catch (error) {
        console.error('Error fetching family photos:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        const formData = new FormData();
        if (data.file) {
          formData.append('file', data.file);
        }
        formData.append('title', data.title || 'Untitled');
        formData.append('taggedMemberIds', JSON.stringify(data.taggedMemberIds || []));
        formData.append('customTags', JSON.stringify(data.customTags || []));
        if (data.memberId) {
          formData.append('memberId', data.memberId);
        }

        const response = await fetch(`${API_BASE_URL}/photos`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        return response.json();
      } catch (error) {
        console.error('Error creating family photo:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        return await apiCall(`/photos/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error updating family photo:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        return await apiCall(`/photos/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting family photo:', error);
        throw error;
      }
    }
  },

  shareLinks: {
    list: async () => {
      try {
        return await apiCall('/share-links');
      } catch (error) {
        console.error('Error fetching share links:', error);
        return [];
      }
    },

    filter: async (filters) => {
      try {
        const queryString = new URLSearchParams(filters).toString();
        return await apiCall(`/share-links?${queryString}`);
      } catch (error) {
        console.error('Error filtering share links:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        return await apiCall('/share-links', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error creating share link:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        return await apiCall(`/share-links/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error updating share link:', error);
        throw error;
      }
    },

    delete: async (id) => {
      try {
        return await apiCall(`/share-links/${id}`, {
          method: 'DELETE'
        });
      } catch (error) {
        console.error('Error deleting share link:', error);
        throw error;
      }
    }
  },

  treeLayouts: {
    list: async () => {
      try {
        return await apiCall('/tree-layouts');
      } catch (error) {
        console.error('Error fetching tree layouts:', error);
        return [];
      }
    },

    create: async (data) => {
      try {
        return await apiCall('/tree-layouts', {
          method: 'POST',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error creating tree layout:', error);
        throw error;
      }
    },

    update: async (id, data) => {
      try {
        return await apiCall(`/tree-layouts/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
      } catch (error) {
        console.error('Error updating tree layout:', error);
        throw error;
      }
    }
  },

  knowledgeDocuments: {
    list: async () => {
      try {
        return await apiCall('/knowledge-documents');
      } catch (error) {
        console.error('Error fetching knowledge documents:', error);
        return [];
      }
    }
  },

  ai: {
    analyzeImage: async (file) => {
      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Analysis failed');
        }

        return response.json();
      } catch (error) {
        console.error('Error analyzing image:', error);
        throw error;
      }
    },

    generatePortrait: async (memberId, description) => {
      try {
        return await apiCall('/ai/generate-portrait', {
          method: 'POST',
          body: JSON.stringify({ memberId, description })
        });
      } catch (error) {
        console.error('Error generating portrait:', error);
        throw error;
      }
    },

    transcribeAudio: async (audioFile) => {
      try {
        const formData = new FormData();
        formData.append('audio', audioFile);

        const response = await fetch(`${API_BASE_URL}/ai/transcribe`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Transcription failed');
        }

        return response.json();
      } catch (error) {
        console.error('Error transcribing audio:', error);
        throw error;
      }
    }
  }
};
