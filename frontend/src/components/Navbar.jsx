import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Scale, FileText, Activity, Sun, Moon } from 'lucide-react';
import './Navbar.css';

const Navbar = ({ theme, toggleTheme }) => {
  return (
    <header className="navbar">
      <div className="navbar-logo">
        <NavLink to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h2>⚖️ CourtApp</h2>
        </NavLink>
      </div>
      
      <nav className="navbar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
          <Home size={18} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/adhikaar" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Scale size={18} />
          <span>NYAYASETHU</span>
        </NavLink>
        
        <NavLink to="/predict" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Activity size={18} />
          <span>Case Predictor</span>
        </NavLink>
        
        <NavLink to="/document" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FileText size={18} />
          <span>Document Q&A</span>
        </NavLink>
      </nav>
      
      <div className="navbar-actions">
        <button 
          onClick={toggleTheme} 
          className="theme-toggle-btn"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
