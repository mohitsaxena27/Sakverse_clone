// pages/tdm/components/toolbar/CreateTableButton.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

const CreateTableButton = ({ selectedRepoId, onClick }) => {
    if (selectedRepoId) {
        return (
            <button 
                onClick={onClick} 
                className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex-shrink-0"
            >
                <FontAwesomeIcon icon={faPlus} className="mr-2 text-xs" />
                Create Table
            </button>
        );
    }
    
    return (
        <button disabled className="px-3 py-1.5 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed">
            Select Repository First
        </button>
    );
};

export default CreateTableButton;