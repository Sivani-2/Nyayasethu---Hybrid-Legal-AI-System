import React, { useState, useRef, useEffect } from "react";

const DocumentQA = () => {
  const [file, setFile] = useState(null);
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const newMessages = [...messages, { role: "user", content: query }];
    setMessages(newMessages);
    setQuery("");
    setLoading(true);

    const formData = new FormData();
    if (file) formData.append("file", file);
    formData.append("messages", JSON.stringify(newMessages));

    try {
      const res = await fetch("http://localhost:5000/api/document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.result },
      ]);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <h2 style={{ marginBottom: "20px" }}>🤖 Legal AI</h2>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ marginBottom: "20px" }}
        />

        <div style={styles.fileBox}>
          {file ? `📄 ${file.name}` : "No file uploaded"}
        </div>
      </div>

      {/* Chat Section */}
      <div style={styles.chatSection}>
        <div style={styles.chatHeader}>
          <h3>AI Chat Assistant</h3>
        </div>

        {/* Messages */}
        <div style={styles.chatBox}>
          {messages.length === 0 && (
            <div style={styles.emptyState}>
              <p>👋 Hi! Ask anything or upload a document.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                ...styles.messageRow,
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  ...styles.messageBubble,
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #4facfe, #00f2fe)"
                      : "#2c2c2c",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && <p style={{ color: "#aaa" }}>Typing...</p>}
          <div ref={chatEndRef}></div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} style={styles.inputBox}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your message..."
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default DocumentQA;

const styles = {
  container: {
    display: "flex",
    height: "100vh",
    fontFamily: "Arial, sans-serif",
    background: "#121212",
    color: "#fff",
  },

  sidebar: {
    width: "250px",
    background: "#1e1e1e",
    padding: "20px",
    borderRight: "1px solid #333",
  },

  fileBox: {
    padding: "10px",
    background: "#2c2c2c",
    borderRadius: "8px",
    fontSize: "14px",
  },

  chatSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },

  chatHeader: {
    padding: "15px",
    borderBottom: "1px solid #333",
    background: "#1e1e1e",
  },

  chatBox: {
    flex: 1,
    padding: "20px",
    overflowY: "auto",
  },

  messageRow: {
    display: "flex",
    marginBottom: "10px",
  },

  messageBubble: {
    maxWidth: "60%",
    padding: "12px",
    borderRadius: "12px",
    lineHeight: "1.5",
  },

  inputBox: {
    display: "flex",
    padding: "15px",
    borderTop: "1px solid #333",
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
    marginRight: "10px",
  },

  button: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    background: "#4facfe",
    color: "#fff",
    cursor: "pointer",
  },

  emptyState: {
    textAlign: "center",
    color: "#aaa",
    marginTop: "50px",
  },
};