import React, { useRef, useState } from 'react';

const InputForm = ({ onSubmit, loading, visible, setVisible }) => {
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...picked]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!text && files.length === 0) return;
    onSubmit(text, files);
    setText('');
    setFiles([]);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
        
        {/* Subtle Sky Blue accent in the corner for "AI" feel */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50/50 blur-3xl rounded-full -mr-16 -mt-16" />

        {/* Text input */}
        <div className="mb-6 relative z-10 text-left">
          <label className="block text-xs font-bold tracking-widest text-sky-600 uppercase mb-3 px-1">
            Business Requirement
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Describe the business requirement or user story idea here..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-sm placeholder-slate-400 rounded-2xl p-5 resize-none focus:outline-none focus:ring-4 focus:ring-sky-500/10 focus:border-sky-400 transition-all duration-300"
          />
        </div>

        {/* File drop zone */}
        <div className="mb-8 relative z-10 text-left">
          <label className="block text-xs font-bold tracking-widest text-sky-600 uppercase mb-3 px-1">
            Attachments (optional)
          </label>
          <div
            onDrop={handleFileDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            className={`group border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              dragOver
                ? 'border-sky-500 bg-sky-50 shadow-inner'
                : 'border-slate-200 hover:border-sky-300 bg-slate-50/30 hover:bg-white hover:shadow-lg hover:shadow-sky-100/50'
            }`}
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📄</div>
            <p className="text-slate-600 text-sm font-semibold">
              {dragOver ? 'Drop to upload' : 'Drag & drop files or click to browse'}
            </p>
            <p className="text-slate-400 text-xs mt-2">PDF, DOCX, TXT, or MP3 supported</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {files.length > 0 && (
            <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {files.map((file, i) => (
                <li key={i} className="flex items-center justify-between bg-sky-50/50 border border-sky-100 rounded-xl px-4 py-3 text-xs text-sky-900 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <span className="truncate max-w-[80%] font-medium">{file.name}</span>
                  <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} className="text-sky-400 hover:text-red-500 transition-colors p-1">
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-5 pt-6 border-t border-slate-100">
          <button
            onClick={() => setVisible(false)}
            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (!text && files.length === 0)}
            className="px-10 py-3.5 bg-sky-500 hover:bg-sky-600 disabled:opacity-30 disabled:grayscale text-white text-sm font-extrabold rounded-2xl transition-all shadow-xl shadow-sky-200 hover:shadow-sky-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processing...
              </span>
            ) : 'Generate User Stories'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputForm;