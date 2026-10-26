import React, { useState, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for optimal document rendering
marked.setOptions({
  breaks: true,      // Convert \n to <br>
  gfm: true,         // GitHub Flavored Markdown
  headerIds: true,   // Add IDs to headers for anchoring
  mangle: false,     // Don't escape HTML
});

const GenerateDoc = ({ projectId, selectedStoryId, onClose, authToken }) => {
  const [loading, setLoading] = useState(false);
  const [doc, setDoc] = useState('');

  // ✅ Parse markdown to sanitized HTML with custom styling
  const parseMarkdownToHtml = useCallback((markdownText) => {
    if (!markdownText) return '';
    
    try {
      // Parse markdown to HTML
      const rawHtml = marked.parse(markdownText, { async: false });
      
      // Sanitize for security
      let sanitizedHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'p', 'br', 'hr',
          'strong', 'em', 'b', 'i', 'u',
          'code', 'pre',
          'ul', 'ol', 'li',
          'blockquote',
          'a',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'div', 'span',
          'img'
        ],
        ALLOWED_ATTR: ['href', 'target', 'src', 'alt', 'class', 'id']
      });
      
      // Wrap in styled container with additional classes
      return `<div class="markdown-document">${sanitizedHtml}</div>`;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      return `<div class="text-red-600 p-4 bg-red-50 rounded-lg">❌ Error formatting document: ${error.message}</div>`;
    }
  }, []);

  // ✅ STREAMING DOC GENERATION with marked.js
  const handleGenerate = async () => {
    setLoading(true);
    setDoc('');

    try {
      const response = await fetch(
        'https://vm-dev-access.centralindia.cloudapp.azure.com/webhook/lapeyre-github-doc-gen-hook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            selectedStoryId,
          }),
        }
      );

      if (!response.body) {
        throw new Error('No streaming response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedText = '';
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');

        // Keep incomplete chunk
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            // Append only item content
            if (parsed.type === 'item' && parsed.content) {
              accumulatedText += parsed.content;
              
              // Convert markdown to HTML in real-time
              const formattedHtml = parseMarkdownToHtml(accumulatedText);
              setDoc(formattedHtml);
            }
          } catch (err) {
            console.error('JSON Parse Error:', err, line);
          }
        }
      }
    } catch (err) {
      console.error('Streaming failed:', err);

      setDoc(`
        <div class="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <div class="flex items-center gap-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 class="font-bold text-lg">Failed to Generate Documentation</h3>
              <p class="text-sm">Please check your connection and try again.</p>
            </div>
          </div>
        </div>
      `);
    } finally {
      setLoading(false);
    }
  };

  // Copy plain text (extract from HTML)
  const handleCopy = () => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = doc;
    const plainText = tempDiv.innerText || tempDiv.textContent;
    
    navigator.clipboard.writeText(plainText).then(() => {
      // Optional: Show toast notification
      console.log('Copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <>
      {/* Enhanced Markdown Styles */}
      <style jsx>{`
        .markdown-document {
          line-height: 1.6;
          color: #1f2937;
        }
        
        /* Headings */
        .markdown-document h1 {
          font-size: 2rem;
          font-weight: 700;
          color: #111827;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 3px solid #10b981;
        }
        
        .markdown-document h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.25rem;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .markdown-document h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #059669;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        
        .markdown-document h4 {
          font-size: 1.1rem;
          font-weight: 600;
          color: #374151;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        
        /* Paragraphs */
        .markdown-document p {
          margin-bottom: 1rem;
          line-height: 1.7;
        }
        
        /* Lists */
        .markdown-document ul, .markdown-document ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .markdown-document ul {
          list-style-type: disc;
        }
        
        .markdown-document ol {
          list-style-type: decimal;
        }
        
        .markdown-document li {
          margin-bottom: 0.25rem;
        }
        
        /* Code */
        .markdown-document code {
          background-color: #f3f4f6;
          color: #dc2626;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        
        .markdown-document pre {
          background-color: #1f2937;
          color: #f3f4f6;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 1rem;
          font-family: 'Courier New', monospace;
          font-size: 0.875rem;
        }
        
        .markdown-document pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: inherit;
        }
        
        /* Blockquotes */
        .markdown-document blockquote {
          border-left: 4px solid #10b981;
          background-color: #f0fdf4;
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #065f46;
        }
        
        /* Tables */
        .markdown-document table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 1rem;
          background-color: white;
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        
        .markdown-document th {
          background-color: #f9fafb;
          padding: 0.75rem;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .markdown-document td {
          padding: 0.75rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .markdown-document tr:last-child td {
          border-bottom: none;
        }
        
        /* Links */
        .markdown-document a {
          color: #059669;
          text-decoration: underline;
          transition: color 0.2s;
        }
        
        .markdown-document a:hover {
          color: #047857;
        }
        
        /* Images */
        .markdown-document img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        
        /* Horizontal Rule */
        .markdown-document hr {
          margin: 1.5rem 0;
          border: none;
          height: 1px;
          background: linear-gradient(to right, transparent, #e5e7eb, transparent);
        }
        
        /* Strong/Bold */
        .markdown-document strong {
          font-weight: 700;
          color: #111827;
        }
        
        /* Emphasis */
        .markdown-document em {
          font-style: italic;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col h-[90vh]">

          {/* Header - Keep original design */}
          <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-green-600 to-teal-600 rounded-t-2xl">
            <div>
              <h2 className="text-white text-xl font-semibold">
                Technical Documentation Generator
              </h2>
              <p className="text-green-100 text-sm">
                AI-powered streaming documentation
              </p>
            </div>

            <button
              onClick={onClose}
              className="text-white hover:bg-white/10 rounded-lg p-2 transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-gray-50">

            {!doc && !loading && (
              <div className="h-full flex flex-col justify-center items-center text-center p-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-5">
                  <svg
                    className="w-12 h-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>

                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  Generate Documentation
                </h3>

                <p className="text-gray-600 max-w-lg">
                  Generate architecture diagrams, API docs, security analysis,
                  deployment guides, and complete repository documentation.
                </p>
              </div>
            )}

            {/* Streaming Loader */}
            {loading && !doc && (
              <div className="h-full flex flex-col justify-center items-center">
                <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>

                <p className="mt-5 text-lg font-medium text-gray-700">
                  Generating documentation...
                </p>

                <p className="text-sm text-gray-500 mt-2">
                  Streaming AI response
                </p>
              </div>
            )}

            {/* Document - with marked.js rendering */}
            {doc && (
              <div className="p-8">
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">

                  <div className="bg-gray-100 px-6 py-4 border-b text-sm text-gray-600 flex justify-between items-center">
                    <span>📄 Technical Documentation • Generated Live</span>
                    <button
                      onClick={handleCopy}
                      className="text-xs bg-white px-3 py-1 rounded-md hover:bg-gray-50 transition"
                    >
                      📋 Copy
                    </button>
                  </div>

                  <div className="p-8">
                    <div dangerouslySetInnerHTML={{ __html: doc }} />
                  </div>

                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-3">

              <button
                onClick={handleGenerate}
                disabled={loading}
                className={`flex-1 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:from-green-600 hover:to-teal-700'
                }`}
              >
                {loading ? 'Generating...' : 'Generate Documentation'}
              </button>

              {doc && (
                <button
                  onClick={handleCopy}
                  className="px-6 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition-all"
                >
                  Copy
                </button>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
              <div
                className={`w-2 h-2 rounded-full ${
                  loading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
                }`}
              ></div>

              <span>
                {loading
                  ? 'Streaming documentation...'
                  : doc
                  ? 'Documentation generated successfully'
                  : 'Ready'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GenerateDoc;