
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSave, faDownload, faEdit, faInfoCircle } from '@fortawesome/free-solid-svg-icons';


const TableToolbar = ({
    onAddRow,
    onSaveNewRows,
    onAddColumn,
    onDownload,
    newRowsCount,
    isDownloading,
    selectedTableId,
    onUploadSuccess,
    isRefreshing,
    isSaving
}) => {
    return (
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-gray-100 bg-white">
            <button
                onClick={onAddRow}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                <FontAwesomeIcon icon={faPlus} /> Add Row
            </button>

            {newRowsCount > 0 && (
                <button
                    onClick={onSaveNewRows}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                >
                    <FontAwesomeIcon icon={faSave} />
                    {isSaving ? 'Saving...' : `Save ${newRowsCount} Row${newRowsCount > 1 ? 's' : ''}`}
                </button>
            )}

            <button
                onClick={onAddColumn}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-xs font-medium rounded-lg hover:bg-yellow-700 transition-colors shadow-sm"
            >
                <FontAwesomeIcon icon={faPlus} /> Add Column
            </button>

            <div className="h-5 border-l border-gray-200 mx-1" />

            <button
                onClick={onDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-xs font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-sm"
            >
                <FontAwesomeIcon icon={faDownload} />
                {isDownloading ? 'Downloading...' : 'Download Excel'}
            </button>

     
            <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400">
                <FontAwesomeIcon icon={faInfoCircle} className="text-gray-300" />
                Click <FontAwesomeIcon icon={faEdit} className="mx-1 text-blue-400" /> to edit a row
            </div>
        </div>
    );
};

export default TableToolbar;