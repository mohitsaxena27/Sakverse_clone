import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';

const ExecutionModal = ({ isOpen, onClose, onExecute, suiteName, suiteId, loading }) => {
  const [maxParallel, setMaxParallel] = useState(1);
  if (!isOpen) return null;

  const handleSubmit = () => {
    onExecute(suiteId, maxParallel);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Execute Test Suite</h3>
              <p className="text-sm text-gray-500 mt-0.5">{suiteName || 'Suite'}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <FontAwesomeIcon icon={faTimes} className="text-gray-500" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Parallel Executions
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={maxParallel}
                  onChange={(e) => setMaxParallel(Number(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="w-12 h-12 flex items-center justify-center bg-indigo-50 rounded-lg border-2 border-indigo-200">
                  <span className="text-xl font-bold text-indigo-600">{maxParallel}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1 (Min)</span>
                <span>6 (Max)</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                ⚡ {maxParallel} test(s) will run in parallel. Higher values may improve execution
                time but require more resources.
              </p>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Suite ID</span>
              <span className="font-mono">#{suiteId}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faPlay} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Executing...' : 'Execute Suite'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionModal;