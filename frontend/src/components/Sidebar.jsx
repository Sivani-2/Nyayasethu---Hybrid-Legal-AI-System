import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Scale, FileText, Activity, Sun, Moon } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ theme, toggleTheme }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>⚖️ CourtApp</h2>
        <p>Legal AI Platform</p>
      </div>
      
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/adhikaar" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Scale size={20} />
          <span>NAYASETHU</span>
        </NavLink>
        
        <NavLink to="/predict" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <Activity size={20} />
          <span>Case Predictor</span>
        </NavLink>
        
        <NavLink to="/document" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
          <FileText size={20} />
          <span>Document Q&A</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-footer">
        <button 
          onClick={toggleTheme} 
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          {theme === 'dark' ? "Light Mode" : "Dark Mode"}
        </button>
        <p style={{ marginTop: '1rem' }}>Powered by AI</p>
      </div>
    </div>
  );
};

export default Sidebar;
