// pages/tdm/components/ConfirmModal.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title = "Confirm Action", message = "Are you sure you want to proceed?" }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-600 text-xl" />
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                        {title}
                    </h3>
                    
                    <p className="text-gray-600 text-center mb-6">
                        {message}
                    </p>
                    
                    <div className="flex justify-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;