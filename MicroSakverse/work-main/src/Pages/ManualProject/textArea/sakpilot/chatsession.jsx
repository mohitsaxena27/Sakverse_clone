import React, { useState, useEffect, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for security and custom options
marked.setOptions({
  breaks: true, // Converts markdown line breaks to <br>
  gfm: true,    // Enables GitHub Flavored Markdown (tables, task lists, etc.)
});

const ChatSession = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Function to safely parse markdown to sanitized HTML
  const parseMarkdown = useCallback((markdownText) => {
    if (!markdownText) return '';
    try {
      // 1. Parse markdown to HTML string using marked
      const rawHtml = marked.parse(markdownText, { async: false });
      // 2. Sanitize the HTML to prevent XSS attacks
      const sanitizedHtml = DOMPurify.sanitize(rawHtml);
      return sanitizedHtml;
    } catch (error) {
      console.error('Markdown parsing error:', error);
      // Fallback: return the original text but escaped to avoid injection
      return DOMPurify.sanitize(markdownText);
    }
  }, []);

  // ✅ Send Message with Streaming
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;

    // Add user + empty bot message together
    setMessages((prev) => [
      ...prev,
      {
        type: 'user',
        text: userText,
      },
      {
        type: 'bot',
        text: '',         // raw markdown text from stream
        html: '',         // formatted HTML for rendering
      },
    ]);

    setInput('');
    setLoading(true);

    try {
      const response = await fetch(
        'https://vm-dev-access.centralindia.cloudapp.azure.com/webhook/lapeyre-github-chat-hook',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userText,
          }),
        }
      );

      if (!response.body) {
        throw new Error('No stream response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let accumulatedText = ''; // raw markdown accumulator
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        // Decode incoming chunk
        buffer += decoder.decode(value, { stream: true });

        // Split stream into lines
        const lines = buffer.split('\n');
        // Keep incomplete line in buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const parsed = JSON.parse(line);

            // Handle stream items only
            if (parsed.type === 'item' && parsed.content) {
              accumulatedText += parsed.content;

              // Convert the accumulated raw markdown to HTML
              const formattedHtml = parseMarkdown(accumulatedText);

              // Live update bot message
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  type: 'bot',
                  text: accumulatedText, // keep raw text for potential debugging
                  html: formattedHtml,    // store HTML for rendering
                };
                return updated;
              });
            }
          } catch (err) {
            console.error('JSON parse error:', err, line);
          }
        }
      }
    } catch (error) {
      console.error('Streaming failed:', error);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          type: 'bot',
          text: 'Error getting response from server.',
          html: '<p class="error-message">⚠️ Error getting response from server.</p>',
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Enter Key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ Auto Scroll
  useEffect(() => {
    const container = document.getElementById('messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <>
      {/* Inject additional styles for markdown elements inside chat bubbles */}
      <style>{`
        .markdown-content {
          font-size: 0.875rem; /* 14px */
          line-height: 1.6;
        }
        .markdown-content h1 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 0.25rem;
        }
        .markdown-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 0.75rem;
          margin-bottom: 0.5rem;
        }
        .markdown-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-top: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .markdown-content p {
          margin-bottom: 0.5rem;
        }
        .markdown-content ul, .markdown-content ol {
          margin-left: 1.25rem;
          margin-bottom: 0.5rem;
          list-style-type: disc;
        }
        .markdown-content ol {
          list-style-type: decimal;
        }
        .markdown-content li {
          margin-bottom: 0.25rem;
        }
        .markdown-content code {
          background-color: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
          font-size: 0.8rem;
          color: #dc2626;
        }
        .markdown-content pre {
          background-color: #1f2937;
          color: #e5e7eb;
          padding: 0.75rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-bottom: 0.75rem;
        }
        .markdown-content pre code {
          background-color: transparent;
          color: inherit;
          padding: 0;
          font-size: 0.8rem;
        }
        .markdown-content blockquote {
          border-left: 3px solid #9ca3af;
          padding-left: 0.75rem;
          color: #4b5563;
          margin: 0.5rem 0;
          font-style: italic;
        }
        .markdown-content a {
          color: #3b82f6;
          text-decoration: underline;
        }
        .markdown-content table {
          border-collapse: collapse;
          width: 100%;
          margin-bottom: 0.75rem;
        }
        .markdown-content th, .markdown-content td {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        .markdown-content th {
          background-color: #f9fafb;
          font-weight: 600;
        }
        .error-message {
          color: #ef4444;
          font-weight: 500;
        }
        /* Override for bot bubble background to ensure readability for code blocks */
        .bg-white .markdown-content pre {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        .bg-white .markdown-content code {
          background-color: #f1f5f9;
          color: #b91c1c;
        }
      `}</style>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
        <div className="w-full max-w-[58rem] bg-white rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[85vh] animate-in slide-in-from-bottom-4 duration-300">

          {/* Header - unchanged */}
          <div className="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Chat Assistant</h2>
                <p className="text-xs text-blue-100">AI-powered support</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white hover:bg-white/10 rounded-lg p-2 transition-all duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Container */}
          <div id="messages-container" className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100">
            {/* Empty State - unchanged */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full space-y-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-gray-700 font-medium text-lg">Welcome to Chat Assistant!</p>
                  <p className="text-gray-500 text-sm mt-2">Ask me anything about your project</p>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className={`flex gap-3 max-w-[80%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar - unchanged */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.type === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-gray-600 to-gray-700'}`}>
                    {msg.type === 'user' ? (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3" />
                      </svg>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`relative px-4 py-2.5 rounded-2xl shadow-sm ${msg.type === 'user' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white' : 'bg-white text-gray-800 border border-gray-200'}`}>
                    {/* Render formatted HTML for bot, plain text for user */}
                    {msg.type === 'bot' ? (
                      <div className="markdown-content" dangerouslySetInnerHTML={{ __html: msg.html || parseMarkdown(msg.text) }} />
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed text-sm">{msg.text}</div>
                    )}
                    
                  </div>
                </div>
              </div>
            ))}

            {/* Loader - unchanged */}
            {loading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-3 max-w-[80%]">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1" />
                    </svg>
                  </div>
                  <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">AI is thinking...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area - unchanged */}
          <div className="p-4 border-t bg-white rounded-b-2xl">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={loading}
                  rows={1}
                  className="w-full border border-gray-300 rounded-2xl px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  style={{ minHeight: '44px', maxHeight: '120px' }}
                  onInput={(e) => {
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                  }}
                />
                {input.trim() && (
                  <div className="absolute right-3 bottom-2 text-xs text-gray-400">Press Enter ↵</div>
                )}
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className={`bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-2xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg ${!input.trim() || loading ? 'opacity-50' : ''}`}
              >
                <span>Send</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatSession;