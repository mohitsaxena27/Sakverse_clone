// pages/tdm/components/toolbar/RepoInfo.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faFolderOpen, faTable } from '@fortawesome/free-solid-svg-icons';

const RepoInfo = ({ toggleSidebar, selectedRepoId, selectedTable }) => {
    return (
        <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button 
                onClick={toggleSidebar} 
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
            >
                <FontAwesomeIcon icon={faBars} />
            </button>
            
            {selectedRepoId ? (
                <div className="flex items-center space-x-2 text-sm truncate">
                    <FontAwesomeIcon icon={faFolderOpen} className="text-amber-500 flex-shrink-0" />
                    <span className="text-gray-600 flex-shrink-0">Repo:</span>
                    <span className="font-medium truncate">{selectedRepoId}</span>
                    {selectedTable && (
                        <>
                            <span className="text-gray-400 flex-shrink-0">/</span>
                            <FontAwesomeIcon icon={faTable} className="text-blue-500 text-xs flex-shrink-0" />
                            <span className="font-medium truncate">{selectedTable.table_name}</span>
                        </>
                    )}
                </div>
            ) : (
                <span className="text-sm text-gray-400">No repository selected</span>
            )}
        </div>
    );
};

export default RepoInfo;