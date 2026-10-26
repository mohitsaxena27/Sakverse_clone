import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faSave, faTimes, faCheck, faCopy,faTable } from '@fortawesome/free-solid-svg-icons';

const TableBody = ({
    data,
    headers,
    newRows,
    editingRowIndex,
    editingRowData,
    deleteConfirm,
    tableName,
    onStartEdit,
    onCancelEdit,
    onSaveRow,
    onDeleteRow,
    onNewRowChange,
    onSaveNewRows,
    setDeleteConfirm,
    setEditingRowData,
    isLoading
}) => {

// console.log('Tablename:',tableName)

    return (
        <tbody>
            {/* Existing rows */}
            {data.map((row, rowIdx) => {
                const isEditing = editingRowIndex === rowIdx;
                const isDeleting = deleteConfirm === rowIdx;

                return (
                    <tr
                        key={row.data_id || rowIdx}
                        className={`border-b border-gray-100 transition-colors
                            ${isEditing ? 'bg-orange-50 ring-1 ring-inset ring-orange-300' : ''}
                            ${isDeleting && !isEditing ? 'bg-red-50' : ''}
                            ${!isEditing && !isDeleting ? 'hover:bg-blue-50/20' : ''}
                        `}
                    >
                        {/* Action buttons */}
                        <td className="border-r border-gray-200 px-2 py-2">
                            {isEditing ? (
                                <div className="flex items-center gap-1 justify-center">
                                    <button
                                        onClick={() => onSaveRow(rowIdx)}
                                        disabled={isLoading.saving}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition disabled:opacity-60"
                                    >
                                        {isLoading.saving
                                            ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                                            : <FontAwesomeIcon icon={faSave} />
                                        }
                                        Save
                                    </button>
                                    <button
                                        onClick={onCancelEdit}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            ) : isDeleting ? (
                                <div className="flex items-center gap-1 justify-center">
                                    <button
                                        onClick={() => onDeleteRow(rowIdx, false)}
                                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition"
                                    >
                                        <FontAwesomeIcon icon={faCheck} /> Yes
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 justify-center">
                                    <button
                                        onClick={() => onStartEdit(rowIdx)}
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 border border-blue-200 rounded hover:bg-blue-50 transition"
                                    >
                                        <FontAwesomeIcon icon={faEdit} /> Edit
                                    </button>
                                    <button
                                        onClick={() => setDeleteConfirm(rowIdx)}
                                        className="px-2 py-1 text-xs text-red-400 border border-red-100 rounded hover:bg-red-50 hover:text-red-600 transition"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </div>
                            )}
                        </td>

                        {/* Row number */}
                        <td className="border-r border-gray-200 px-3 py-2 text-center text-xs text-gray-400 font-mono">
                            {rowIdx + 1}
                        </td>

                        {/* Data cells */}
                        {headers.map((header, colIdx) => (
                            <td key={colIdx} className="border-r border-gray-100 px-0 py-0">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editingRowData[header] ?? ''}
                                        onChange={(e) =>
                                            setEditingRowData(prev => ({ ...prev, [header]: e.target.value }))
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') onSaveRow(rowIdx);
                                            if (e.key === 'Escape') onCancelEdit();
                                        }}
                                        className="w-full px-3 py-2 border-0 border-b-2 border-orange-400 focus:outline-none focus:border-blue-500 bg-transparent text-sm text-gray-800"
                                        autoFocus={colIdx === 0}
                                    />
                                ) : (
                                    <div className="group px-3 py-2 min-h-[38px] flex items-center justify-between gap-2">
                                        <span className={
                                            row[header] != null && row[header] !== ''
                                                ? 'text-gray-800'
                                                : 'text-gray-300 italic text-xs'
                                        }>
                                            {row[header] != null && row[header] !== ''
                                                ? String(row[header])
                                                : '—'
                                            }
                                        </span>
                                        <button
                                            onClick={() => {
                                                const address = `{${tableName}.${rowIdx + 1}.${header}}`;
                                                navigator.clipboard.writeText(address);
                                                

                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <FontAwesomeIcon icon={faCopy} size="xs" />
                                        </button>
                                    </div>
                                )}
                            </td>
                        ))}
                    </tr>
                );
            })}

            {/* New rows */}
            {newRows.map((row, rowIdx) => (
                <tr key={`new-${rowIdx}`} className="border-b border-blue-100 bg-blue-50/60">
                    <td className="border-r border-gray-200 px-2 py-2 text-center">
                        <button
                            onClick={() => onDeleteRow(rowIdx, true)}
                            className="px-2 py-1 text-xs text-red-400 border border-red-100 rounded hover:bg-red-50 hover:text-red-600 transition"
                        >
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </td>
                    <td className="border-r border-gray-200 px-2 py-2 text-center">
                        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded font-medium">
                            NEW
                        </span>
                    </td>
                    {headers.map((header, colIdx) => (
                        <td key={colIdx} className="border-r border-blue-100 px-2 py-1.5">
                            <input
                                type="text"
                                value={row[header] || ''}
                                onChange={(e) => onNewRowChange(rowIdx, header, e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onSaveNewRows()}
                                className="w-full px-2 py-1.5 text-sm border border-blue-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-white"
                                placeholder={`Enter ${header}...`}
                                autoFocus={rowIdx === newRows.length - 1 && colIdx === 0}
                            />
                        </td>
                    ))}
                </tr>
            ))}

            {/* Empty state */}
            {data.length === 0 && newRows.length === 0 && (
                <tr>
                    <td colSpan={headers.length + 2} className="py-16 text-center">
                        <div className="flex flex-col items-center text-gray-400">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                <FontAwesomeIcon icon={faTable} className="text-2xl text-gray-300" />
                            </div>
                            <p className="font-medium text-gray-500 text-sm">No data yet</p>
                            <p className="text-xs mt-1 text-gray-400">
                                Click <strong className="text-blue-500">Add Row</strong> to add your first entry,
                                or <strong className="text-purple-500">Upload Excel</strong> to import data.
                            </p>
                        </div>
                    </td>
                </tr>
            )}
        </tbody>
    );
};

export default TableBody;