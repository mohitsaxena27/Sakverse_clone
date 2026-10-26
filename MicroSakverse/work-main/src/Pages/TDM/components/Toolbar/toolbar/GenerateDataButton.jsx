import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase } from '@fortawesome/free-solid-svg-icons';

const GenerateDataButton = ({ selectedRepoId, onClick }) => {
    if (selectedRepoId) {
        return (
            <button 
                onClick={onClick} 
                className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex-shrink-0"
            >
                <FontAwesomeIcon icon={faDatabase} className="mr-2 text-xs" />
                Generate Data
            </button>
        );
    }
    
    return (
        <button disabled className="px-3 py-1.5 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed">
            Select Repository First
        </button>
    );
};

export default GenerateDataButton;