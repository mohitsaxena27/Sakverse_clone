// src/components/HtmlPreviewer.jsx

import React, { useState } from "react";

const defaultHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Web Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a simple HTML paragraph.</p>
    <a href="https://www.google.com">Click here for a link</a>
</body>
</html>`;

export default function HtmlPreviewer() {
  const [htmlCode, setHtmlCode] = useState(defaultHtml);

  // Download HTML File
  const handleDownload = () => {
    const blob = new Blob([htmlCode], { type: "text/html" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "page.html";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      {/* Navbar */}
      <div style={styles.navbar}>
        <h2 style={styles.logo}>HTML Previewer</h2>

        <button style={styles.button} onClick={handleDownload}>
          Download HTML
        </button>
      </div>

      {/* Preview */}
      <div style={styles.previewContainer}>
        <iframe
          title="HTML Preview"
          srcDoc={htmlCode}
          style={styles.iframe}
        />
      </div>


    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#f4f4f4",
    fontFamily: "Arial, sans-serif",
  },

  navbar: {
    height: "60px",
    background: "#111827",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 20px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
  },

  logo: {
    margin: 0,
  },

  button: {
    background: "#2563eb",
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },

  previewContainer: {
    flex: 1,
    padding: "10px",
    background: "#fff",
  },

  iframe: {
    width: "100%",
    height: "100%",
    border: "1px solid #ddd",
    borderRadius: "10px",
    background: "white",
  },

  editorContainer: {
    height: "40%",
    background: "#ffffff",
    borderTop: "1px solid #ddd",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
  },

  textarea: {
    flex: 1,
    width: "100%",
    resize: "none",
    padding: "10px",
    fontSize: "14px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontFamily: "monospace",
    outline: "none",
  },
};