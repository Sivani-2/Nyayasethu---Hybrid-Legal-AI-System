# CourtApp - AI Legal Platform

This platform integrates multiple AI services for legal assistance, including a multilingual RAG legal advisor (ADHIKAAR), a constitutional document Q&A summarizer, and a legal case predictor using machine learning.

## Project Structure
- `backend/`: Flask API built with Python to serve the ML models and integrations.
- `frontend/`: React + Vite application for the user interface.

---

## 🚀 Running the Project Locally

### 1. Starting the Backend
The backend runs on Python and uses a virtual environment to manage dependencies.

**Open a terminal and run:**
```cmd
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
> **Note on `.env` file:** Ensure you have your `GROQ_API_KEY` defined in the `backend/.env` file for the ADHIKAAR and Document Q&A services to function correctly.

The API will start running on `http://127.0.0.1:5000`.

### 2. Starting the Frontend
The frontend uses Vite and requires Node.js to be installed.

**Open a separate terminal and run:**
```cmd
cd frontend
npm install
npm run dev
```

The frontend will start running on `http://localhost:5173`. Open this URL in your browser to interact with CourtApp.

---

## Features
- **ADHIKAAR**: A dedicated legal chatbot providing contextual answers utilizing a Retrieval-Augmented Generation (RAG) knowledge base.
- **Predictor**: AI-driven case outcome predictions (Won/Lost/Partially Allowed) and success probabilities fueled by trained XGBoost and RandomForest models hosted on Hugging Face.
- **Document Q&A**: PDF/Docx constitution analysis, semantic search, and document summarization tools.
