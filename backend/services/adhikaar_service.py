import os
import json
import numpy as np
from langdetect import detect
from deep_translator import GoogleTranslator
from sentence_transformers import SentenceTransformer, CrossEncoder
from rank_bm25 import BM25Okapi
import faiss
from groq import Groq

# -------------------------
# Config
# -------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
KNOWLEDGE_BASE_PATH = os.path.join(
    os.path.dirname(__file__),
    "..",
    "knowledge_base_india_legal_100.json"
)
MODEL_NAME = "llama-3.3-70b-versatile"

# -------------------------
# Load Models
# -------------------------
print("[ADHIKAAR] Loading embedding model...")
embed_model = SentenceTransformer("all-MiniLM-L6-v2")
dim = embed_model.get_sentence_embedding_dimension()

print("[ADHIKAAR] Loading cross-encoder...")
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

print("[ADHIKAAR] Loading knowledge base...")
with open(KNOWLEDGE_BASE_PATH, "r", encoding="utf-8") as f:
    knowledge_base = json.load(f)

# -------------------------
# Build Index (FAISS + BM25)
# -------------------------
kb_vectors = []
tokenized_corpus = []

for entry in knowledge_base:
    law_text = entry.get("law", "")
    if isinstance(law_text, list):
        law_text = " ".join(law_text)

    sections_text = entry.get("sections", "")
    if isinstance(sections_text, list):
        sections_text = " ".join(sections_text)

    combined = " | ".join([
        entry.get("issue", ""),
        law_text,
        sections_text,
        entry.get("plain_explanation", ""),
        " ".join(entry.get("steps", []))
    ])

    kb_vectors.append(embed_model.encode(combined))
    tokenized_corpus.append(combined.lower().split())

faiss_index = faiss.IndexFlatL2(dim)
faiss_index.add(np.array(kb_vectors).astype("float32"))

bm25 = BM25Okapi(tokenized_corpus)

print("[ADHIKAAR] Ready.")


# -------------------------
# Retrieval Function
# -------------------------
def retrieve_relevant_docs(query_en, bm25_k=20, faiss_k=10, final_k=5):

    bm25_results = bm25.get_top_n(
        query_en.lower().split(),
        knowledge_base,
        n=bm25_k
    )

    q_vec = embed_model.encode(query_en).reshape(1, -1).astype("float32")
    _, I = faiss_index.search(q_vec, faiss_k)

    faiss_results = [
        knowledge_base[i] for i in I[0]
        if i < len(knowledge_base)
    ]

    # Merge + remove duplicates
    candidate_map = {id(doc): doc for doc in bm25_results + faiss_results}
    candidates = list(candidate_map.values())

    # Cross encoder ranking
    pairs = [
        (query_en, doc.get("issue", "") + " " + doc.get("plain_explanation", ""))
        for doc in candidates
    ]

    scores = cross_encoder.predict(pairs)

    ranked = [
        doc for _, doc in sorted(
            zip(scores, candidates),
            key=lambda x: x[0],
            reverse=True
        )
    ]

    return ranked[:final_k]


# -------------------------
# MAIN FUNCTION
# -------------------------
def get_legal_advice(user_query: str) -> str:

    # 🔍 Detect language
    try:
        detected_lang = detect(user_query)
    except Exception:
        detected_lang = "en"

    # 🌐 Translate to English
    try:
        query_en = GoogleTranslator(source="auto", target="en").translate(user_query)
    except Exception:
        query_en = user_query

    # 📚 Retrieve docs
    docs = retrieve_relevant_docs(query_en)

    # 🧠 Build context
    context = ""

    for d in docs:
        law = d.get("law", "")
        if isinstance(law, list):
            law = ", ".join(law)

        sections = d.get("sections", "")
        if isinstance(sections, list):
            sections = ", ".join(sections)

        # ✅ FIXED: Proper numbered references
        resources = d.get("resources", [])
        if isinstance(resources, list):
            resources = "\n".join([
                f"{i+1}. {link}" for i, link in enumerate(resources)
            ])

        context += (
            f"Issue: {d.get('issue', '')}\n"
            f"Explanation: {d.get('plain_explanation', '')}\n"
            f"Laws: {law}\n"
            f"Sections: {sections}\n"
            f"Actions: {', '.join(d.get('steps', []))}\n"
            f"References:\n{resources}\n\n"
        )

    # 🧾 Prompt
    prompt = f"""
You are NYAYASETHU, a legal assistant for Indian citizens.

Give answers in simple language (no heavy legal terms).

Format STRICTLY like this:

**1. Explanation**
(Simple explanation in 2–3 paragraphs)

**2. Relevant Laws**
(List laws)

**3. Sections Explanation**
(Explain sections clearly)

**4. Suggested Action**
(Step-by-step actions)

**5. References**
(Show links clearly, each on new line)

Context:
{context}

User Query: {query_en}
"""

    # 🔐 API Key check
    if not GROQ_API_KEY:
        return "⚠️ GROQ_API_KEY is not set."

    client = Groq(api_key=GROQ_API_KEY)

    response = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2
    )

    answer = response.choices[0].message.content

    # 🌐 Translate back
    if detected_lang != "en":
        try:
            answer = GoogleTranslator(
                source="auto",
                target=detected_lang
            ).translate(answer)
        except Exception:
            pass

    return answer