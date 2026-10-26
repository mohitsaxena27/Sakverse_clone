import React from 'react';

const Modal = ({ content, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md flex justify-center items-center z-50">
    <div className="bg-gray-900 text-white p-6 rounded-xl max-w-2xl w-full shadow-xl border border-cyan-600 max-h-[80vh] overflow-y-auto">
      <h2 className="text-xl font-bold mb-4 text-cyan-300">🧾 Original User Input</h2>
      <pre className="text-sm bg-gray-800 p-4 rounded overflow-y-auto max-h-[60vh] whitespace-pre-wrap">
        {content}
      </pre>
      <div className="mt-4 text-right">
        <button
          className="bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 px-4 py-2 rounded text-white shadow"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default Modal;
