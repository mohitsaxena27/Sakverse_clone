import React, { useState, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDatabase,
    faTimes,
    faPlus,
    faTrash,
    faCode,
    faTable,
    faSpinner,
    faWandMagicSparkles,
} from '@fortawesome/free-solid-svg-icons';
import { useData } from '../../../Hooks/DataSynthesize/Data';
import showToast from '../../../items/ToastMessage/toastUtil';

const DEFAULT_ROW = {};

const GenerateDataModal = ({ isOpen, onClose, repoId, onSuccess }) => {
    const { generateSyntheticData, loading } = useData();

    // ─── Mode: 'json' or 'table' ────────────────────────────────────────
    const [mode, setMode] = useState('table');

    // ─── Table name ─────────────────────────────────────────────────────
    const [tableName, setTableName] = useState('');

    // ─── Number of rows to generate ─────────────────────────────────────
    const [numRows, setNumRows] = useState(10);

    // ─── JSON mode raw text ─────────────────────────────────────────────
    const [rawJson, setRawJson] = useState(
        JSON.stringify(
            [
                { customer_id: 1, name: 'Aarav Sharma', age: 28, city: 'Mumbai' },
            ],
            null,
            2
        )
    );

    // ─── Table mode: columns + rows ─────────────────────────────────────
    const [columns, setColumns] = useState(['customer_id', 'name', 'age', 'city']);
    const [rows, setRows] = useState([
        { customer_id: 1, name: 'Aarav Sharma', age: 28, city: 'Mumbai' },
        { customer_id: 2, name: 'Priya Kapoor', age: 34, city: 'Bengaluru' },
    ]);

    // ─── Derived preview of real_data ──────────────────────────────────
    const parsedRealData = useMemo(() => {
        if (mode === 'json') {
            try {
                const parsed = JSON.parse(rawJson);
                if (!Array.isArray(parsed)) return { error: 'Root must be an array' };
                if (parsed.length === 0) return { error: 'Array is empty' };
                return { data: parsed };
            } catch (e) {
                return { error: `Invalid JSON: ${e.message}` };
            }
        }
        // table mode
        if (columns.length === 0) return { error: 'No columns defined' };
        if (rows.length === 0) return { error: 'No rows added' };
        return { data: rows };
    }, [mode, rawJson, columns, rows]);

    // ─── Column / row handlers ─────────────────────────────────────────
    const addColumn = () => {
        const name = prompt('Enter column name:');
        if (!name || columns.includes(name)) return;
        setColumns((prev) => [...prev, name]);
        setRows((prev) => prev.map((r) => ({ ...r, [name]: '' })));
    };

    const removeColumn = (col) => {
        setColumns((prev) => prev.filter((c) => c !== col));
        setRows((prev) =>
            prev.map((r) => {
                const { [col]: _, ...rest } = r;
                return rest;
            })
        );
    };

    const addRow = () => {
        const empty = {};
        columns.forEach((c) => (empty[c] = ''));
        setRows((prev) => [...prev, empty]);
    };

    const removeRow = (idx) => {
        setRows((prev) => prev.filter((_, i) => i !== idx));
    };

    const updateCell = (idx, col, value) => {
        setRows((prev) =>
            prev.map((r, i) => (i === idx ? { ...r, [col]: value } : r))
        );
    };

    // ─── Reset form on close ───────────────────────────────────────────
    const resetAndClose = () => {
        if (loading) return;
        setTableName('');
        setNumRows(10);
        setMode('table');
        onClose();
    };

    // ─── Submit ────────────────────────────────────────────────────────
  const handleGenerate = async () => {
        if (!tableName.trim()) {
            showToast('Please enter a table name', 'error');
            return;
        }
        if (!repoId) {
            showToast('Repository not selected', 'error');
            return;
        }
        if (parsedRealData.error) {
            showToast(parsedRealData.error, 'error');
            return;
        }
        if (!numRows || numRows < 1) {
            showToast('Number of rows must be at least 1', 'error');
            return;
        }

        const trimmedTableName = tableName.trim();
        const payload = {
            real_data: parsedRealData.data,
            num_rows: Number(numRows),
            repo_id: repoId,
            table_name: trimmedTableName,
        };

        try {
            await generateSyntheticData(payload);
            showToast('Synthetic data generated successfully', 'success');

            // Close first — a slow/failed refresh should never keep the modal open
            resetAndClose();

            // Fire-and-forget refresh; errors are handled inside onSuccess itself
            onSuccess?.(trimmedTableName);
        } catch (err) {
            showToast(err.message || 'Failed to generate data', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={resetAndClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faDatabase} className="text-green-600" />
                        <h2 className="text-lg font-semibold text-gray-800">
                            Generate Synthetic Data
                        </h2>
                    </div>
                    <button
                        onClick={resetAndClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                {/* Body (scrollable) */}
                <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">
                    {/* ─── Table Name ─────────────────────────────────── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Table Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={tableName}
                            onChange={(e) => setTableName(e.target.value)}
                            placeholder="e.g. synthetic_customers"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>

                    {/* ─── Mode Toggle ────────────────────────────────── */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Real Data (Source Sample) <span className="text-red-500">*</span>
                            </label>
                            <div className="flex bg-gray-100 rounded-lg p-0.5">
                                <button
                                    onClick={() => setMode('table')}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition ${
                                        mode === 'table'
                                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faTable} />
                                    Table
                                </button>
                                <button
                                    onClick={() => setMode('json')}
                                    className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition ${
                                        mode === 'json'
                                            ? 'bg-white text-blue-600 shadow-sm font-medium'
                                            : 'text-gray-600 hover:text-gray-800'
                                    }`}
                                >
                                    <FontAwesomeIcon icon={faCode} />
                                    JSON
                                </button>
                            </div>
                        </div>

                        {/* ─── Table Editor ─────────────────────────── */}
                        {mode === 'table' && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-sm border-collapse">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 w-8 border-b border-r">
                                                    #
                                                </th>
                                                {columns.map((col) => (
                                                    <th
                                                        key={col}
                                                        className="px-2 py-2 text-left text-xs font-medium text-gray-600 border-b border-r whitespace-nowrap group"
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            <span>{col}</span>
                                                            <button
                                                                onClick={() => removeColumn(col)}
                                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition"
                                                                title="Remove column"
                                                            >
                                                                <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                                                            </button>
                                                        </div>
                                                    </th>
                                                ))}
                                                <th className="px-2 py-2 w-10 border-b">
                                                    <button
                                                        onClick={addColumn}
                                                        className="text-blue-600 hover:text-blue-800 transition"
                                                        title="Add column"
                                                    >
                                                        <FontAwesomeIcon icon={faPlus} className="text-xs" />
                                                    </button>
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rows.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-2 py-1 text-xs text-gray-400 border-b border-r text-center">
                                                        {idx + 1}
                                                    </td>
                                                    {columns.map((col) => (
                                                        <td
                                                            key={col}
                                                            className="border-b border-r p-0"
                                                        >
                                                            <input
                                                                value={row[col] ?? ''}
                                                                onChange={(e) =>
                                                                    updateCell(idx, col, e.target.value)
                                                                }
                                                                className="w-full px-2 py-1.5 text-sm outline-none focus:bg-blue-50 min-w-[80px]"
                                                            />
                                                        </td>
                                                    ))}
                                                    <td className="border-b text-center">
                                                        <button
                                                            onClick={() => removeRow(idx)}
                                                            className="text-red-400 hover:text-red-600 transition p-1"
                                                            title="Remove row"
                                                        >
                                                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t">
                                    <button
                                        onClick={addRow}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                        <FontAwesomeIcon icon={faPlus} />
                                        Add Row
                                    </button>
                                    <span className="text-xs text-gray-500">
                                        {rows.length} rows · {columns.length} columns
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* ─── JSON Editor ──────────────────────────── */}
                        {mode === 'json' && (
                            <textarea
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                rows={12}
                                spellCheck={false}
                                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        )}

                        {/* ─── Validation Message ───────────────────── */}
                        {parsedRealData.error && (
                            <p className="text-xs text-red-500 mt-1.5">
                                {parsedRealData.error}
                            </p>
                        )}
                        {!parsedRealData.error && (
                            <p className="text-xs text-gray-400 mt-1.5">
                                {parsedRealData.data.length} sample row
                                {parsedRealData.data.length !== 1 ? 's' : ''} ready
                            </p>
                        )}
                    </div>

                    {/* ─── Number of Rows ─────────────────────────────── */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Number of Rows to Generate{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={numRows}
                            onChange={(e) => setNumRows(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end items-center gap-2 px-6 py-4 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={resetAndClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !!parsedRealData.error}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <FontAwesomeIcon icon={faSpinner} spin />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={faWandMagicSparkles} />
                                Generate Data
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GenerateDataModal;