import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Adhikaar from './pages/Adhikaar';
import Predictor from './pages/Predictor';
import DocumentQA from './pages/DocumentQA';

function App() {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/adhikaar" element={<Adhikaar />} />
            <Route path="/predict" element={<Predictor />} />
            <Route path="/document" element={<DocumentQA />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
