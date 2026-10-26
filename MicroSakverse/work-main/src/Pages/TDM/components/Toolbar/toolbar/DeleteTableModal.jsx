// pages/tdm/components/toolbar/DeleteTableModal.jsx
import React from 'react';

const DeleteTableModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-5 max-w-sm">
                <h3 className="text-lg font-semibold mb-2">Delete Table</h3>
                <p className="text-gray-600 mb-4">
                    Are you sure you want to delete this table? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700">
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteTableModal;