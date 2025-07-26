import styled, { createGlobalStyle } from 'styled-components';

// Global styles
export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #0d1117;
    color: #e0e0e0;
    line-height: 1.6;
  }

  code {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  a {
    color: #58a6ff;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  /* Scrollbar styling */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  ::-webkit-scrollbar-thumb {
    background: #444444;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #555555;
  }

  .App {
    min-height: 100vh;
    background-color: #0d1117;
  }

  main {
    min-height: calc(100vh - 64px);
    padding: 30px 0;
  }
`;

// Theme colors
export const theme = {
  colors: {
    background: '#0d1117',
    surface: '#161b22',
    card: '#1a1a1a',
    border: '#30363d',
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
      muted: '#8b949e'
    },
    accent: {
      primary: '#f093fb',
      secondary: '#f5576c'
    },
    status: {
      success: '#28a745',
      warning: '#ffc107',
      error: '#dc3545',
      info: '#17a2b8'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  borderRadius: '6px',
  transitions: {
    default: 'all 0.2s ease'
  }
};

// Container component
export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  width: 100%;
`;

// Card component
export const Card = styled.div`
  background-color: ${theme.colors.card};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius};
  padding: 20px;
  transition: ${theme.transitions.default};

  &:hover {
    border-color: #555555;
  }
`;

// Button component
export const Button = styled.button`
  background-color: ${props => {
    switch (props.variant) {
      case 'danger':
        return theme.colors.status.error;
      case 'success':
        return theme.colors.status.success;
      case 'warning':
        return theme.colors.status.warning;
      case 'secondary':
        return '#6c757d';
      default:
        return '#555555';
    }
  }};
  color: white;
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'danger':
        return theme.colors.status.error;
      case 'success':
        return theme.colors.status.success;
      case 'warning':
        return theme.colors.status.warning;
      case 'secondary':
        return '#6c757d';
      default:
        return '#777777';
    }
  }};
  padding: 10px 20px;
  border-radius: ${theme.borderRadius};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: ${theme.transitions.default};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;

  &:hover {
    background-color: ${props => {
      switch (props.variant) {
        case 'danger':
          return '#c82333';
        case 'success':
          return '#218838';
        case 'warning':
          return '#e0a800';
        case 'secondary':
          return '#5a6268';
        default:
          return '#666666';
      }
    }};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Input component
export const Input = styled.input`
  background-color: #2a2a2a;
  color: ${theme.colors.text.primary};
  border: 1px solid #444444;
  padding: 10px 12px;
  border-radius: ${theme.borderRadius};
  font-size: 14px;
  width: 100%;
  transition: ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: #666666;
    background-color: #333333;
  }

  &::placeholder {
    color: ${theme.colors.text.muted};
  }
`;

// Select component
export const Select = styled.select`
  background-color: #2a2a2a;
  color: ${theme.colors.text.primary};
  border: 1px solid #444444;
  padding: 10px 12px;
  border-radius: ${theme.borderRadius};
  font-size: 14px;
  width: 100%;
  cursor: pointer;
  transition: ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: #666666;
    background-color: #333333;
  }

  option {
    background-color: #2a2a2a;
    color: ${theme.colors.text.primary};
  }
`;

// Loading spinner component
export const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Error message component
export const ErrorMessage = styled.div`
  background-color: #2c1810;
  color: #f8d7da;
  border: 1px solid #721c24;
  border-radius: ${theme.borderRadius};
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  
  &::before {
    content: '⚠️ ';
    margin-right: 8px;
  }
`;

// Success message component
export const SuccessMessage = styled.div`
  background-color: #0f2419;
  color: #d4edda;
  border: 1px solid #155724;
  border-radius: ${theme.borderRadius};
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  
  &::before {
    content: '✅ ';
    margin-right: 8px;
  }
`;

// Info message component
export const InfoMessage = styled.div`
  background-color: #1a2a3a;
  color: #d1ecf1;
  border: 1px solid #0c5460;
  border-radius: ${theme.borderRadius};
  padding: 15px;
  margin-bottom: 20px;
  font-size: 14px;
  
  &::before {
    content: 'ℹ️ ';
    margin-right: 8px;
  }
`;

// Badge component
export const Badge = styled.span`
  background-color: ${props => props.color || '#6c757d'};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  display: inline-block;
`;

// Responsive utilities
export const breakpoints = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
};

export const media = {
  mobile: `@media (max-width: ${breakpoints.mobile})`,
  tablet: `@media (max-width: ${breakpoints.tablet})`,
  desktop: `@media (min-width: ${breakpoints.desktop})`
};