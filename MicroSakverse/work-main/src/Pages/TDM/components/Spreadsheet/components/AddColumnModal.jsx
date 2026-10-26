import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes, faCheck } from '@fortawesome/free-solid-svg-icons';

const AddColumnModal = ({
    isOpen,
    onClose,
    onAdd,
    newColumn,
    setNewColumn,
    headers,
    isAdding
}) => {
    if (!isOpen) return null;

    const isDuplicate = headers.some(h => 
        h.toLowerCase() === newColumn.name.trim().toLowerCase()
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FontAwesomeIcon icon={faPlus} className="text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800">Add New Column</h3>
                            <p className="text-xs text-gray-400">Add a new column to the table</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                        disabled={isAdding}
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Column Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={newColumn.name}
                            onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter column name..."
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors"
                            autoFocus
                            disabled={isAdding}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onAdd();
                                if (e.key === 'Escape') onClose();
                            }}
                        />
                        {isDuplicate && newColumn.name.trim() && (
                            <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                                <FontAwesomeIcon icon={faTimes} className="text-red-400" />
                                A column with this name already exists
                            </p>
                        )}
                    </div>

                    <div className="mt-4 hidden">
                        <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Column Type
                        </label>
                        <select
                            value={newColumn.type}
                            onChange={(e) => setNewColumn(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-colors bg-gray-50 cursor-not-allowed"
                            disabled
                        >
                            <option value="string">String</option>
                        </select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isAdding}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onAdd}
                        disabled={isAdding || !newColumn.name.trim() || isDuplicate}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        {isAdding ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Adding...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faCheck} />
                                Add Column
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddColumnModal;