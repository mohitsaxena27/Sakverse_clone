// pages/tdm/components/CreateTableModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useTDM } from '../../../Hooks/TDM/tdm';
import showToast from '../../../items/ToastMessage/toastUtil';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

const CreateTableModal = ({ isOpen, onClose, repoId, onTableCreate }) => {
    const { createTable } = useTDM();
    const [tableName, setTableName] = useState('');
    const [columns, setColumns] = useState(['']);
    const [loading, setLoading] = useState(false);
    const scrollContainerRef = useRef(null);

    const handleAddColumn = () => {
        setColumns([...columns, '']);
    };

    const handleColumnChange = (index, value) => {
        const newColumns = [...columns];
        newColumns[index] = value;
        setColumns(newColumns);
    };

    const handleRemoveColumn = (index) => {
        if (columns.length > 1) {
            setColumns(columns.filter((_, i) => i !== index));
        } else {
            showToast("At least one column is required", 'error');
        }
    };

    const handleSubmit = async () => {
        if (!tableName.trim()) {
            showToast('Table name is required', 'error');
            return;
        }

        const validColumns = columns.filter(col => col.trim());
        if (validColumns.length === 0) {
            showToast('At least one valid column name is required', 'error');
            return;
        }

        const payload = {
            repo_id: repoId,
            table_name: tableName.trim(),
            columns: validColumns.join(",")
        };

        setLoading(true);
        try {
            await createTable(payload);
            showToast("Table Created Successfully", 'success');
            onTableCreate();
            handleClose();
        } catch (error) {
            console.error('Error creating table:', error);
            showToast(error.message || "Table Creation Failed", 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setTableName('');
        setColumns(['']);
        onClose();
    };

    useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
    }, [columns]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg" style={{ width: '40rem' }}>
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-800">Create New Table</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FontAwesomeIcon icon={faTimes} size="lg" />
                    </button>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <label className="block font-semibold text-gray-700 mb-2">
                            Table Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="Enter table name"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block font-semibold text-gray-700 mb-2">
                            Columns <span className="text-red-500">*</span>
                        </label>
                        
                        <div 
                            ref={scrollContainerRef} 
                            className="max-h-64 overflow-y-auto space-y-2 mb-3"
                        >
                            {columns.map((column, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder={`Column ${index + 1} name`}
                                        value={column}
                                        onChange={(e) => handleColumnChange(index, e.target.value)}
                                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {columns.length > 1 && (
                                        <button
                                            onClick={() => handleRemoveColumn(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors p-2"
                                            title="Remove column"
                                        >
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleAddColumn}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors text-sm font-medium"
                        >
                            <FontAwesomeIcon icon={faPlus} />
                            Add Column
                        </button>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating...' : 'Create Table'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateTableModal;