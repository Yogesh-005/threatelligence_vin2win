import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { GlobalStyle } from './styles/themes';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ArticleList from './components/ArticleList';
import ArticleDetail from './components/ArticleDetail';
import FeedList from './components/FeedList';
import IOCList from './components/IOCList';
import IOCDetail from './components/IOCDetail';

function App() {
  return (
    <AppProvider>
      <GlobalStyle />
      <Router>
        <div className="App">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/articles" element={<ArticleList />} />
              <Route path="/articles/:id" element={<ArticleDetail />} />
              <Route path="/iocs" element={<IOCList />} />
              <Route path="/iocs/:id" element={<IOCDetail />} />
              <Route path="/feeds" element={<FeedList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AppProvider>
  );
}

export default App;