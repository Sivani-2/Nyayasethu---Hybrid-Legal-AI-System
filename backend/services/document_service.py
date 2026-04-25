import os
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from groq import Groq

# -------------------------
# Config
# -------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
CHUNK_SIZE = 500
CHUNK_OVERLAP = 100

# -------------------------
# Load embedding model
# -------------------------
print("[DOC] Loading embedding model...")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
print("[DOC] Ready.")


# -------------------------
# Extract text
# -------------------------
def extract_text(file_path: str, content_type: str) -> str:
    if not file_path:
        return ""

    text = ""
    ext = file_path.rsplit(".", 1)[-1].lower()

    try:
        if ext == "pdf" or "pdf" in content_type:
            from PyPDF2 import PdfReader
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += (page.extract_text() or "") + "\n"

        elif ext == "docx" or "wordprocessingml" in content_type:
            import docx
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + "\n"

        elif ext == "txt" or "text/plain" in content_type:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

    except Exception:
        return ""

    return text.strip()


# -------------------------
# Chunking
# -------------------------
def chunk_text(text, size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start += size - overlap
    return chunks


# -------------------------
# FAISS
# -------------------------
def build_doc_index(chunks):
    vectors = embed_model.encode(chunks).astype("float32")
    index = faiss.IndexFlatL2(vectors.shape[1])
    index.add(vectors)
    return index


def retrieve_chunks(query, chunks, index, top_k=5):
    q_vec = embed_model.encode([query]).astype("float32")
    _, I = index.search(q_vec, min(top_k, len(chunks)))
    return [chunks[i] for i in I[0]]


# -------------------------
# GROQ LLM
# -------------------------
def call_groq(prompt: str) -> str:
    if not GROQ_API_KEY:
        return "⚠️ GROQ_API_KEY is not set."

    client = Groq(api_key=GROQ_API_KEY)

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    return response.choices[0].message.content


# -------------------------
# MAIN FUNCTION
# -------------------------
def process_document(file_path: str, messages: list, content_type: str) -> str:

    # 🔥 Extract text
    text = extract_text(file_path, content_type or "")
    has_document = bool(text.strip())

    # 🔥 Get latest user query
    latest_query = ""
    for msg in reversed(messages):
        if msg["role"] == "user":
            latest_query = msg["content"]
            break

    # 🔥 Build conversation
    conversation = ""
    for msg in messages:
        conversation += f'{msg["role"].upper()}: {msg["content"]}\n'

    # =========================================
    # 📄 CASE 1: DOCUMENT EXISTS (RAG MODE)
    # =========================================
    if has_document:
        chunks = chunk_text(text)
        if not chunks:
            return "❌ Document is empty."

        doc_index = build_doc_index(chunks)

        search_query = latest_query if latest_query else "Summarize document"

        relevant_chunks = retrieve_chunks(search_query, chunks, doc_index)
        context = "\n\n---\n\n".join(relevant_chunks)

        prompt = f"""
You are a smart legal assistant chatbot.

Rules:
- Be conversational and friendly
- Prefer answers from document
- If not found, use general knowledge
- Keep answers clear

Document Context:
{context}

Conversation:
{conversation}

Answer the latest query:
"""

    # =========================================
    # 🤖 CASE 2: NO DOCUMENT (GENERAL CHATBOT)
    # =========================================
    else:
        prompt = f"""
You are a helpful AI assistant.

- Talk naturally like ChatGPT
- Answer any general questions
- Be friendly and clear

Conversation:
{conversation}

Answer the user:
"""

    return call_groq(prompt)