import React from 'react';
import { Scale, Activity, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="page-container glass-panel" style={{ height: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ textAlign: 'center', padding: '2rem 0' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Welcome to CourtApp</h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
          Your intelligent legal assistant combining cutting-edge AI with Indian law to make justice more accessible, predictable, and understandable.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', transition: 'transform 0.2s ease' }} className="feature-card">
          <Scale size={40} style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }} />
          <h3>NYAYASETHU Legal Chat</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            A multilingual AI legal advisor designed for Indian citizens. Ask complex legal questions in English, Hindi, Telugu, Tamil, and more, and receive simple, structured advice mapped to official Indian Laws.
          </p>
          <Link to="/adhikaar" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%' }}>Launch Chat</button>
          </Link>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', transition: 'transform 0.2s ease' }} className="feature-card">
          <Activity size={40} style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }} />
          <h3>Case Outcome Predictor</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Using advanced Machine Learning (XGBoost & Random Forest) trained on thousands of past cases, instantly gauge your chances of winning your case, receiving partial relief, or losing entirely.
          </p>
          <Link to="/predict" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%' }}>Predict Outcome</button>
          </Link>
        </div>

        <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.5rem', backgroundColor: 'var(--bg-secondary)', transition: 'transform 0.2s ease' }} className="feature-card">
          <FileText size={40} style={{ color: 'var(--accent-gold)', marginBottom: '1rem' }} />
          <h3>Document Q&A</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Upload dense, complex legal documents (PDF, DOCX, TXT) and instantly summarize their core tenets. Ask targeted questions against the document context to find exactly what you're looking for.
          </p>
          <Link to="/document" style={{ textDecoration: 'none' }}>
            <button style={{ width: '100%' }}>Upload Document</button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Home;
