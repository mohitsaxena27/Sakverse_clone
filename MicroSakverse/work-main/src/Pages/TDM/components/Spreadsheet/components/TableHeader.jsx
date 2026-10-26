import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable, faSync } from '@fortawesome/free-solid-svg-icons';

const TableHeader = ({ tableName, dataLength, newRowsCount, editingRowIndex, isRefreshing, onRefresh }) => {
    return (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FontAwesomeIcon icon={faTable} className="text-blue-600 text-sm" />
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-gray-800">{tableName}</h3>
                    <p className="text-xs text-gray-400">
                        {dataLength} row{dataLength !== 1 ? 's' : ''}
                        {newRowsCount > 0 && (
                            <span className="ml-2 text-blue-500 font-medium">
                                + {newRowsCount} unsaved
                            </span>
                        )}
                        {editingRowIndex !== null && (
                            <span className="ml-2 text-orange-500 font-medium">
                                • Editing row {editingRowIndex + 1}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-gray-200"
            >
                <FontAwesomeIcon icon={faSync} spin={isRefreshing} className="text-xs" />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
        </div>
    );
};

export default TableHeader;