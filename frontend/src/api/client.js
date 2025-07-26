// frontend/src/api/client.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================================================
// FEED API
// ============================================================================
export const feedsAPI = {
  getFeeds: () => apiClient.get('/feeds'),
  addFeed: (feed) => apiClient.post('/feeds', feed),
  removeFeed: (feedId) => apiClient.delete(`/feeds/${feedId}`),
  refreshFeeds: () => apiClient.post('/feeds/refresh'),
  getRefreshStatus: () => apiClient.get('/feeds/refresh/status'),
};

// ============================================================================
// ARTICLE API
// ============================================================================
export const articlesAPI = {
  getArticles: (skip = 0, limit = 20) => 
    apiClient.get(`/articles?skip=${skip}&limit=${limit}`),
  getArticleCount: () => apiClient.get('/articles/count'),
  getArticle: (id) => apiClient.get(`/articles/${id}`),
  getRecentArticles: (hours = 24) => 
    apiClient.get(`/articles/recent?hours=${hours}`),
  getArticleIOCs: (articleId) => 
    apiClient.get(`/articles/${articleId}/iocs`),
  getArticleSummaries: (articleId) => 
    apiClient.get(`/articles/${articleId}/summaries`),
  summarizeArticle: (articleId, mode = 'soc') => 
    apiClient.post(`/articles/${articleId}/summarize`, { mode }),
};

// ============================================================================
// IOC API
// ============================================================================
export const iocAPI = {
  getIOCs: (params = {}) => {
    const { skip = 0, limit = 20, ioc_type, min_risk_score } = params;
    const queryParams = new URLSearchParams({ skip, limit });
    
    if (ioc_type) queryParams.append('ioc_type', ioc_type);
    if (min_risk_score !== undefined) queryParams.append('min_risk_score', min_risk_score);
    
    return apiClient.get(`/iocs?${queryParams}`);
  },
  
  getIOCDetails: (iocId) => apiClient.get(`/iocs/${iocId}`),
  
  getHighRiskIOCs: (threshold = 50, limit = 20) => 
    apiClient.get(`/iocs/high-risk?risk_threshold=${threshold}&limit=${limit}`),
  
  getIOCStats: () => apiClient.get('/iocs/stats'),
  
  reprocessArticleIOCs: (articleId) => 
    apiClient.post(`/iocs/reprocess/${articleId}`),
};

// ============================================================================
// DASHBOARD API
// ============================================================================
export const dashboardAPI = {
  getStats: () => apiClient.get('/dashboard/stats'),
  
  getThreatOverview: (hours = 24) => 
    apiClient.get(`/dashboard/threat-overview?hours=${hours}`),
  
  getRecentThreats: (limit = 10, minRiskScore = 25) => 
    apiClient.get(`/dashboard/recent-threats?limit=${limit}&min_risk_score=${minRiskScore}`),
};

// ============================================================================
// SYSTEM API
// ============================================================================
export const systemAPI = {
  getHealth: () => apiClient.get('/health'),
  getProcessingStatus: () => apiClient.get('/status/processing'),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format IOC type for display
 */
export const formatIOCType = (type) => {
  const typeMap = {
    ip: 'IP Address',
    domain: 'Domain',
    url: 'URL',
    hash: 'File Hash'
  };
  return typeMap[type] || type.toUpperCase();
};

/**
 * Get risk level color for UI
 */
export const getRiskColor = (riskScore) => {
  if (riskScore >= 75) return '#dc3545'; // Critical - Red
  if (riskScore >= 50) return '#fd7e14'; // High - Orange
  if (riskScore >= 25) return '#ffc107'; // Medium - Yellow
  return '#28a745'; // Low - Green
};

/**
 * Get risk level text
 */
export const getRiskLevel = (riskScore) => {
  if (riskScore >= 75) return 'Critical';
  if (riskScore >= 50) return 'High';
  if (riskScore >= 25) return 'Medium';
  return 'Low';
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp) => {
  try {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Calculate time ago from timestamp
 */
export const getTimeAgo = (timestamp) => {
  try {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatTimestamp(timestamp);
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Truncate text for display
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Validate IOC value format
 */
export const validateIOC = (value, type) => {
  const patterns = {
    ip: /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/,
    domain: /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/,
    url: /^https?:\/\/[^\s<>"{}|\\^`[\]]+$/,
    hash: /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$|^[a-fA-F0-9]{128}$/
  };
  
  return patterns[type]?.test(value) || false;
};

/**
 * Export data as JSON file
 */
export const exportAsJSON = (data, filename) => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

export default apiClient;