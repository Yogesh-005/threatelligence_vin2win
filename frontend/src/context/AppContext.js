import React, { createContext, useContext, useReducer } from 'react';

// Initial state
const initialState = {
  feeds: [],
  articles: [],
  iocs: [],
  loading: false,
  error: null,
  user: null,
  theme: 'dark'
};

// Action types
export const actionTypes = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_FEEDS: 'SET_FEEDS',
  ADD_FEED: 'ADD_FEED',
  REMOVE_FEED: 'REMOVE_FEED',
  UPDATE_FEED: 'UPDATE_FEED',
  SET_ARTICLES: 'SET_ARTICLES',
  ADD_ARTICLE: 'ADD_ARTICLE',
  SET_IOCS: 'SET_IOCS',
  ADD_IOC: 'ADD_IOC',
  SET_USER: 'SET_USER',
  SET_THEME: 'SET_THEME'
};

// Reducer function
function appReducer(state, action) {
  switch (action.type) {
    case actionTypes.SET_LOADING:
      return {
        ...state,
        loading: action.payload
      };
    
    case actionTypes.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case actionTypes.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    case actionTypes.SET_FEEDS:
      return {
        ...state,
        feeds: action.payload,
        loading: false,
        error: null
      };
    
    case actionTypes.ADD_FEED:
      return {
        ...state,
        feeds: [...state.feeds, action.payload],
        loading: false,
        error: null
      };
    
    case actionTypes.REMOVE_FEED:
      return {
        ...state,
        feeds: state.feeds.filter(feed => feed.id !== action.payload),
        loading: false,
        error: null
      };
    
    case actionTypes.UPDATE_FEED:
      return {
        ...state,
        feeds: state.feeds.map(feed => 
          feed.id === action.payload.id ? { ...feed, ...action.payload } : feed
        ),
        loading: false,
        error: null
      };
    
    case actionTypes.SET_ARTICLES:
      return {
        ...state,
        articles: action.payload,
        loading: false,
        error: null
      };
    
    case actionTypes.ADD_ARTICLE:
      return {
        ...state,
        articles: [...state.articles, action.payload],
        loading: false,
        error: null
      };
    
    case actionTypes.SET_IOCS:
      return {
        ...state,
        iocs: action.payload,
        loading: false,
        error: null
      };
    
    case actionTypes.ADD_IOC:
      return {
        ...state,
        iocs: [...state.iocs, action.payload],
        loading: false,
        error: null
      };
    
    case actionTypes.SET_USER:
      return {
        ...state,
        user: action.payload
      };
    
    case actionTypes.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    default:
      return state;
  }
}

// Create context
const AppContext = createContext();

// Context provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}