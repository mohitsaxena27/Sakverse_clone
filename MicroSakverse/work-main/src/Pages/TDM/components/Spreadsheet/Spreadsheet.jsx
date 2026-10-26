import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable } from '@fortawesome/free-solid-svg-icons';
import { useSpreadsheetData } from './hooks/useSpreadsheetData';
import { useTDM } from '../../../../Hooks/TDM/tdm';
import TableHeader from './components/TableHeader';
import TableToolbar from './components/TableToolbar';
import TableBody from './components/TableBody';
import AddColumnModal from './components/AddColumnModal';
import TableLoading from './components/TableLoading';
import showToast from '../../../../items/ToastMessage/toastUtil';

const Spreadsheet = ({ selectedTableId, selectedTableName, onDataChange, repoName }) => {
    const { downloadTable } = useTDM(); // ─── ADD THIS ───
    
    const {
        data,
        headers,
        newRows,
        editingRowIndex,
        editingRowData,
        tableName,
        deleteConfirm,
        isLoading,
        fetchTableData,
        saveRow,
        saveNewRows,
        deleteRow,
        addRow,
        startEdit,
        cancelEdit,
        handleNewRowChange,
        addColumn,
        setDeleteConfirm,
        setEditingRowData
    } = useSpreadsheetData(selectedTableId, selectedTableName, repoName, onDataChange);

    const [showAddColumnModal, setShowAddColumnModal] = useState(false);
    const [newColumn, setNewColumn] = useState({ name: '', type: 'string' });
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false); // ─── ADD THIS ───

    useEffect(() => {
        fetchTableData(true);
    }, [fetchTableData]);

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'Escape') cancelEdit();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [cancelEdit]);

    // useEffect(() => {
    //     if (selectedTableName) {
    //         console.log(`Spreadsheet selectedTableName updated: ${selectedTableName}`);
    //     } else {
    //         console.log('Spreadsheet selectedTableName is empty');
    //     }
    // }, [selectedTableName]);

    // ─── DOWNLOAD FUNCTION ──────────────────────────────────────────────────
    const handleDownload = async () => {
        if (!selectedTableId) {
            showToast('No table selected', 'error');
            return;
        }
        
        setIsDownloading(true);
        try {
            const blob = await downloadTable(selectedTableId);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${tableName || 'table'}_${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            showToast('Downloaded successfully', 'success');
        } catch (error) {
            console.error('Download error:', error);
            showToast('Download failed', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleAddColumn = async () => {
        setIsAddingColumn(true);
        const success = await addColumn(newColumn);
        setIsAddingColumn(false);
        if (success) {
            setShowAddColumnModal(false);
            setNewColumn({ name: '', type: 'string' });
        }
    };

    if (isLoading.initial) {
        return <TableLoading />;
    }

    return (
        <div className="h-full flex flex-col bg-white">
            <TableHeader
                tableName={tableName}
                dataLength={data.length}
                newRowsCount={newRows.length}
                editingRowIndex={editingRowIndex}
                isRefreshing={isLoading.refresh}
                onRefresh={() => fetchTableData(false)}
            />

            <TableToolbar
                onAddRow={addRow}
                onSaveNewRows={saveNewRows}
                onAddColumn={() => setShowAddColumnModal(true)}
                onDownload={handleDownload}
                newRowsCount={newRows.length}
                isDownloading={isDownloading} // ─── PASS DOWNLOADING STATE ───
                selectedTableId={selectedTableId}
                onUploadSuccess={() => fetchTableData(false)}
                isRefreshing={isLoading.refresh}
                isSaving={isLoading.saving}
            />

            <div className="flex-1 overflow-auto spreadsheet-container">
                {headers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <FontAwesomeIcon icon={faTable} className="text-5xl mb-4 text-gray-200" />
                        <p className="font-medium text-gray-500">This table has no columns</p>
                        <p className="text-xs mt-1">Contact your admin to set up the table structure</p>
                    </div>
                ) : (
                    <table className="w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                <th className="border-r border-gray-300 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-28 bg-gray-100">
                                    Actions
                                </th>
                                <th className="border-r border-gray-300 px-3 py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wide w-10 bg-gray-100">
                                    #
                                </th>
                                {headers.map((header, idx) => (
                                    <th key={idx} className="border-r border-gray-300 px-3 py-2.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[150px] bg-gray-100">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <TableBody
                            data={data}
                            headers={headers}
                            newRows={newRows}
                            editingRowIndex={editingRowIndex}
                            editingRowData={editingRowData}
                            deleteConfirm={deleteConfirm}
                            tableName={selectedTableName}
                            onStartEdit={startEdit}
                            onCancelEdit={cancelEdit}
                            onSaveRow={saveRow}
                            onDeleteRow={deleteRow}
                            onNewRowChange={handleNewRowChange}
                            onSaveNewRows={saveNewRows}
                            setDeleteConfirm={setDeleteConfirm}
                            setEditingRowData={setEditingRowData}
                            isLoading={isLoading}
                        />
                    </table>
                )}
            </div>

            <AddColumnModal
                isOpen={showAddColumnModal}
                onClose={() => {
                    setShowAddColumnModal(false);
                    setNewColumn({ name: '', type: 'string' });
                }}
                onAdd={handleAddColumn}
                newColumn={newColumn}
                setNewColumn={setNewColumn}
                headers={headers}
                isAdding={isAddingColumn}
            />
        </div>
    );
};

export default Spreadsheet;