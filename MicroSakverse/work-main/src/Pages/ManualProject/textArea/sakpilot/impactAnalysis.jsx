import React, { useState, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for optimal analysis rendering
marked.setOptions({
  breaks: true,      // Convert \n to <br>
  gfm: true,         // GitHub Flavored Markdown
  headerIds: true,   // Add IDs to headers for anchoring
  mangle: false,     // Don't escape HTML
});

const ImportAnalysis = ({ onClose, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  // ✅ Static description payload
  const DESCRIPTION = `I want to add a JWT-based authentication module to this app.`;

  // ✅ Parse markdown to sanitized HTML with custom styling
  const parseMarkdownToHtml = useCallback((markdownText) => {
    if (!markdownText) return '';
    
    try {
      // Parse markdown to HTML using marked.js
      const rawHtml = marked.parse(markdownText, { async: false });
      
      // Sanitize for security - allow specific tags and attributes
      let sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'em', 'b', 'i', 'u', 'del', 'strike',
          'code', 'pre',
          'ul', 'ol', 'li',
          'blockquote',
          'a',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span',
          'img',
          'input' // For task lists
        ],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'id', 'type', 'disabled', 'checked'],
        ALLOW_DATA_ATTR: false
      });
      
      // Wrap in styled container with analysis-specific classes
      return `<div class="impact-analysis-content">${sanitizedHtml}</div>`;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return `<div class="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
        <strong class="font-semibold">❌ Formatting Error:</strong><br/>
        ${error.message}
      </div>`;
    }
  }, []);

  // ✅ STREAMING IMPACT ANALYSIS with marked.js
  const handleImportAnalysis = async () => {
    setLoading(true);
    setAnalysis("");

    try {
      console.log("Starting streaming impact analysis...");

      const response = await fetch(
        "https://vm-dev-access.centralindia.cloudapp.azure.com/webhook/lapeyre-github-impact-analysis-hook",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: DESCRIPTION,
          }),
        }
      );

      if (!response.body) {
        throw new Error("No stream response");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let accumulatedText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            // Stream chunks
            if (parsed.type === "item" && parsed.content) {
              accumulatedText += parsed.content;
              
              // Convert markdown to HTML in real-time
              const formattedHtml = parseMarkdownToHtml(accumulatedText);
              setAnalysis(formattedHtml);
            }
            // Final response support
            else if (parsed.content) {
              accumulatedText += parsed.content;
              const formattedHtml = parseMarkdownToHtml(accumulatedText);
              setAnalysis(formattedHtml);
            }
          } catch (err) {
            console.error("JSON Parse Error:", err, line);
          }
        }
      }
    } catch (err) {
      console.error("Impact analysis failed:", err);

      setAnalysis(`
        <div class="text-red-600 p-4 bg-red-50 rounded-lg border border-red-200 flex items-start gap-3">
          <span class="text-xl">❌</span>
          <div>
            <strong class="font-semibold">Error:</strong><br/>
            Failed to fetch impact analysis. Please try again.
            <p class="text-sm mt-2 text-gray-600">${err.message}</p>
          </div>
        </div>
      `);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Copy report (extract plain text from HTML)
  const handleCopy = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = analysis;
    const plainText = tempDiv.textContent || tempDiv.innerText;
    
    navigator.clipboard.writeText(plainText).then(() => {
      // Optional: Show success feedback
      console.log('Report copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <>
      {/* Enhanced Impact Analysis Markdown Styles */}
      <style jsx>{`
        .impact-analysis-content {
          line-height: 1.7;
          color: #1f2937;
          font-size: 0.95rem;
        }
        
        /* Headings */
        .impact-analysis-content h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #8b5cf6;
        }
        
        .impact-analysis-content h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.25rem;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .impact-analysis-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #7c3aed;
          margin-top: 1rem;
          margin-bottom: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .impact-analysis-content h3::before {
          content: '';
          width: 4px;
          height: 20px;
          background: linear-gradient(to bottom, #8b5cf6, #ec4899);
          border-radius: 2px;
          display: inline-block;
        }
        
        .impact-analysis-content h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        .impact-analysis-content h5, 
        .impact-analysis-content h6 {
          font-size: 1rem;
          font-weight: 600;
          color: #4b5563;
          margin-top: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        /* Paragraphs */
        .impact-analysis-content p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        
        /* Lists */
        .impact-analysis-content ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .impact-analysis-content ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .impact-analysis-content li {
          margin-bottom: 0.25rem;
          line-height: 1.6;
        }
        
        /* Nested lists */
        .impact-analysis-content ul ul,
        .impact-analysis-content ol ul,
        .impact-analysis-content ul ol,
        .impact-analysis-content ol ol {
          margin-top: 0.25rem;
          margin-bottom: 0.25rem;
        }
        
        /* Task lists (GitHub Flavored) */
        .impact-analysis-content input[type="checkbox"] {
          margin-right: 0.5rem;
          margin-left: -1.25rem;
          vertical-align: middle;
        }
        
        /* Code blocks */
        .impact-analysis-content code {
          background-color: #f3f4f6;
          color: #7c3aed;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .impact-analysis-content pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
          font-family: 'Courier New', 'Monaco', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
        }
        
        .impact-analysis-content pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: inherit;
        }
        
        /* Blockquotes */
        .impact-analysis-content blockquote {
          border-left: 4px solid #8b5cf6;
          background: linear-gradient(to right, #faf5ff, transparent);
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #4c1d95;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        
        /* Tables */
        .impact-analysis-content table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          background-color: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .impact-analysis-content thead {
          background: linear-gradient(to right, #f3e8ff, #fce7f3);
        }
        
        .impact-analysis-content th {
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .impact-analysis-content td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .impact-analysis-content tr:last-child td {
          border-bottom: none;
        }
        
        .impact-analysis-content tr:hover {
          background-color: #faf5ff;
        }
        
        /* Links */
        .impact-analysis-content a {
          color: #7c3aed;
          text-decoration: underline;
          transition: color 0.2s ease;
        }
        
        .impact-analysis-content a:hover {
          color: #5b21b6;
          text-decoration: none;
        }
        
        /* Images */
        .impact-analysis-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        /* Horizontal Rule */
        .impact-analysis-content hr {
          margin: 1.5rem 0;
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #d1d5db, transparent);
        }
        
        /* Strong/Bold */
        .impact-analysis-content strong {
          font-weight: 700;
          color: #111827;
        }
        
        /* Emphasis/Italic */
        .impact-analysis-content em {
          font-style: italic;
        }
        
        /* Delete/Strikethrough */
        .impact-analysis-content del {
          text-decoration: line-through;
          opacity: 0.7;
        }
        
        /* Badge styling for inline tags */
        .impact-analysis-content strong:has(+ em) {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col h-[90vh] max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">

          {/* HEADER - Original design preserved */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-purple-600 to-pink-600 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">
                  Impact Analysis Report
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200"
            >
              ✕
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">

            {/* Empty State */}
            {!analysis && !loading && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>

                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Impact Analysis
                  </h3>

                  <p className="text-gray-600">
                    Analyze the impact of implementing the JWT-based authentication module.
                  </p>
                </div>
              </div>
            )}

            {/* Loader */}
            {loading && !analysis && (
              <div className="flex flex-col items-center justify-center h-full space-y-6 p-8">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                </div>

                <div className="text-center">
                  <p className="text-gray-700 font-medium text-lg">
                    Streaming Impact Analysis...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Processing AI response in real-time
                  </p>
                </div>
              </div>
            )}

            {/* STREAMING CONTENT with marked.js rendering */}
            {analysis && (
              <div className="p-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">

                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-purple-700">
                        <span>Impact Analysis Report</span>
                        <span>•</span>
                        <span>Streaming AI Response</span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-8">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: analysis,
                      }}
                    />
                  </div>

                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between items-center">
                    <span>Generated by AI • Streaming enabled</span>
                    <span className="font-mono">Markdown parsed with marked.js</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER - Original design preserved */}
          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-3">

              <button
                onClick={handleImportAnalysis}
                disabled={loading}
                className={`flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-2.5 rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-400 transition-all duration-200 flex items-center justify-center gap-2 shadow-md ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  "Run Impact Analysis"
                )}
              </button>

              {analysis && (
                <button
                  onClick={handleCopy}
                  className="px-6 py-2.5 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy Report
                </button>
              )}
            </div>

            {/* Status */}
            {!loading && !analysis && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                <span>Ready to analyze impact</span>
              </div>
            )}

            {analysis && !loading && (
              <div className="flex items-center justify-center gap-2 mt-3 text-xs text-purple-600">
                <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                <span>Analysis completed successfully</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ImportAnalysis;