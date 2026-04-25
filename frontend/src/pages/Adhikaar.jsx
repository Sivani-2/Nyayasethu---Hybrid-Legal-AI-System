import React, { useState } from "react";
const Adhikaar = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Sample questions
  const sampleQueries = [
    "My landlord is not returning my deposit",
    "My company did not pay my salary",
    "I was fired without notice",
    "Police are not registering my complaint"
  ];

  // ✅ FIXED: Better formatting + clickable links
  const formatResponse = (text) => {
    let formatted = text;

    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert links (works for Telugu + numbered lines)
    formatted = formatted.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" style="color:#4facfe;text-decoration:underline;">$1</a>'
    );

    // Line breaks
    formatted = formatted.replace(/\n/g, "<br/>");

    return formatted;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = { role: "user", content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/adhikaar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });

      const data = await response.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer || data.error || "Error occurred"
        }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Connection error" }
      ]);
    }

    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>⚖️ NYAYASETHU</h2>

      {/* Chat Area */}
      <div style={styles.chatBox}>
        {messages.length === 0 ? (
          <div style={styles.empty}>
            <h3>How can I help you?</h3>

            {sampleQueries.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuery(q)}
                style={styles.sampleBtn}
              >
                {q}
              </button>
            ))}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent:
                  msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "10px"
              }}
            >
              <div
                style={{
                  ...styles.bubble,
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg,#4facfe,#00f2fe)"
                      : "#2c2c2c"
                }}
              >
                {msg.role === "assistant" ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatResponse(msg.content)
                    }}
                  />
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}

        {loading && <p style={{ color: "#aaa" }}>Consulting legal texts...</p>}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={styles.inputBox}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask your legal question..."
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Ask
        </button>
      </form>
    </div>
  );
};

export default Adhikaar;

const styles = {
  container: {
    padding: "20px",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#121212",
    color: "#fff",
    fontFamily: "Arial"
  },

  title: {
    marginBottom: "10px"
  },

  chatBox: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
    border: "1px solid #333",
    borderRadius: "10px",
    marginBottom: "10px"
  },

  empty: {
    textAlign: "center",
    marginTop: "50px"
  },

  sampleBtn: {
    display: "block",
    margin: "5px auto",
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #444",
    background: "#1e1e1e",
    color: "#fff",
    cursor: "pointer"
  },

  bubble: {
    maxWidth: "70%",
    padding: "12px",
    borderRadius: "12px",
    lineHeight: "1.5"
  },

  inputBox: {
    display: "flex",
    gap: "10px"
  },

  input: {
    flex: 1,
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    outline: "none"
  },

  button: {
    padding: "12px 20px",
    borderRadius: "10px",
    border: "none",
    background: "#4facfe",
    color: "#fff",
    cursor: "pointer"
  }
};