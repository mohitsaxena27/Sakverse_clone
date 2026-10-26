// FileViewer.js
import { useEffect } from 'react';

export default function FileViewer({ file, folderName, onClose }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  if (!file) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
      <div className="bg-gray-900 rounded-xl p-4 w-[90vw] max-w-md h-[80vh] relative shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-white text-lg hover:text-red-500"
        >
          ✖
        </button>
        <h3 className="text-sm text-white mb-2 truncate">{file}</h3>
        <iframe
          src={`/api/view-file/${encodeURIComponent(folderName)}/${encodeURIComponent(file)}`}
          title="File Viewer"
          className="w-full h-full border rounded-lg"
        />
      </div>
    </div>
  );
}
