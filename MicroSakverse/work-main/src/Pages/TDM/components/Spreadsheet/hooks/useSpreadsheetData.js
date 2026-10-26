import { useState, useCallback, useRef } from 'react';
import { useTDM } from '../../../../../Hooks/TDM/tdm';
import showToast from '../../../../../items/ToastMessage/toastUtil';

export const useSpreadsheetData = (selectedTableId, selectedTableName, repoName, onDataChange) => {
    const { getTableData, createDataRecord, updateDataRecord, deleteDataRecord, downloadTable, addTableColumn } = useTDM();

    const [data, setData] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [newRows, setNewRows] = useState([]);
    const [editingRowIndex, setEditingRowIndex] = useState(null);
    const [editingRowData, setEditingRowData] = useState({});
    const [tableName, setTableName] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [isLoading, setIsLoading] = useState({ initial: true, refresh: false, saving: false });
    const isMounted = useRef(true);

    const fetchTableData = useCallback(async (isInitial = false) => {
        if (!selectedTableId) return;
        setIsLoading(prev => ({ ...prev, initial: isInitial, refresh: !isInitial }));

        try {
            const response = await getTableData(selectedTableId);
            if (!isMounted.current) return;

            const tableData = response.data || [];
            const tableHeader = response.header?.properties || {};
            const view = response.header?.view;
            const name = response.header?.table_name || `Table ${selectedTableId}`;

            setTableName(name);
            setHeaders(view?.length ? view : Object.keys(tableHeader));
            setData(tableData.map(item => ({ ...item.content, data_id: item.data_id })));
        } catch {
            if (isMounted.current) showToast('Failed to fetch table data', 'error');
        } finally {
            if (isMounted.current) {
                setIsLoading(prev => ({ ...prev, initial: false, refresh: false }));
            }
        }
    }, [selectedTableId, getTableData]);

    const saveRow = async (rowIndex) => {
        const row = data[rowIndex];
        if (!row?.data_id) return;

        setIsLoading(prev => ({ ...prev, saving: true }));
        try {
            const rowNumber = rowIndex + 1;
            for (const header of headers) {
                if (editingRowData[header] !== row[header]) {
                    await updateDataRecord(repoName, selectedTableName, rowNumber, header, editingRowData[header]);
                }
            }

            showToast('Row updated successfully', 'success');
            setData(prev => {
                const copy = [...prev];
                copy[rowIndex] = { ...copy[rowIndex], ...editingRowData };
                return copy;
            });

            setEditingRowIndex(null);
            setEditingRowData({});
            onDataChange?.();
        } catch {
            showToast('Failed to update row', 'error');
        } finally {
            setIsLoading(prev => ({ ...prev, saving: false }));
        }
    };

    const saveNewRows = async () => {
        if (!selectedTableId) return showToast('No table selected', 'error');
        const hasEmpty = newRows.some(row => headers.some(h => !row[h]?.toString().trim()));
        if (hasEmpty) return showToast('Please fill in all fields before saving', 'warning');

        try {
            for (const row of newRows) {
                await createDataRecord({ table_id: selectedTableId, data: row });
            }
            showToast(`${newRows.length} row(s) saved successfully`, 'success');
            setNewRows([]);
            await fetchTableData(false);
            onDataChange?.();
        } catch {
            showToast('Failed to save rows', 'error');
        }
    };

    const deleteRow = async (rowIndex, isNewRow = false) => {
        if (isNewRow) {
            setNewRows(prev => prev.filter((_, i) => i !== rowIndex));
            return;
        }
        try {
            await deleteDataRecord(data[rowIndex].data_id);
            showToast('Row deleted successfully', 'success');
            setDeleteConfirm(null);
            if (editingRowIndex === rowIndex) {
                setEditingRowIndex(null);
                setEditingRowData({});
            }
            await fetchTableData(false);
            onDataChange?.();
        } catch {
            showToast('Failed to delete row', 'error');
        }
    };

    const addRow = () => {
        const emptyRow = {};
        headers.forEach(h => emptyRow[h] = '');
        setNewRows(prev => [...prev, emptyRow]);
        setEditingRowIndex(null);
    };

    const startEdit = (rowIndex) => {
        setEditingRowIndex(rowIndex);
        setEditingRowData({ ...data[rowIndex] });
        setDeleteConfirm(null);
    };

    const cancelEdit = () => {
        setEditingRowIndex(null);
        setEditingRowData({});
    };

    const handleNewRowChange = (rowIndex, header, value) => {
        setNewRows(prev => {
            const copy = [...prev];
            copy[rowIndex] = { ...copy[rowIndex], [header]: value };
            return copy;
        });
    };

    const addColumn = async (columnData) => {
        if (!selectedTableId) {
            showToast('No table selected', 'error');
            return false;
        }

        try {
            await addTableColumn(selectedTableId, columnData);
            showToast('Column added successfully', 'success');
            await fetchTableData(false);
            onDataChange?.();
            return true;
        } catch (error) {
            console.error('Error adding column:', error);
            showToast('Failed to add column', 'error');
            return false;
        }
    };

    return {
        data,
        headers,
        newRows,
        editingRowIndex,
        editingRowData,
        tableName,
        deleteConfirm,
        isLoading,
        isMounted,
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
    };
};