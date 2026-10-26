// pages/tdm/components/UploadData.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTimes, faFileExcel } from '@fortawesome/free-solid-svg-icons';
import showToast from '../../../items/ToastMessage/toastUtil';

const UploadData = ({ tableId, onUploadSuccess }) => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const APIURL = import.meta.env.VITE_API_URL;
    const PORT = import.meta.env.VITE_BACKEND_PORT;
    const API_BASE = `/sakverse/tdm`;

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        const validTypes = ['.xlsx', '.xls', '.csv'];
        const fileExtension = selectedFile?.name?.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
        
        if (selectedFile && validTypes.includes(fileExtension)) {
            setFile(selectedFile);
        } else {
            showToast("Please select a valid Excel or CSV file", "error");
            e.target.value = '';
        }
    };

    const handleUpload = async () => {
        if (!file) return showToast("Please select a file", "error");
        if (!tableId) return showToast("No table selected", "error");

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("table_id", tableId);

        try {
            const response = await fetch(`${API_BASE}/upload_excel`, {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (response.ok) {
                showToast("File uploaded successfully", "success");
                setFile(null);
                onUploadSuccess?.();
                const fileInput = document.getElementById('file-upload-input');
                if (fileInput) fileInput.value = '';
            } else {
                const error = await response.json();
                throw new Error(error.message || 'Upload failed');
            }
        } catch (error) {
            showToast(error.message || "Upload failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const clearFile = () => {
        setFile(null);
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="relative">
            <label className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 cursor-pointer transition">
                <FontAwesomeIcon icon={faUpload} className="mr-2 text-xs" />
                Excel
                <input id="file-upload-input" type="file" onChange={handleFileChange} accept=".xlsx,.xls,.csv" className="hidden" disabled={uploading} />
            </label>

            {file && (
                <div className="absolute top-full mt-2 right-0 z-20 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[280px]">
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileExcel} className="text-green-600 text-lg" />
                        <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
                        <button onClick={clearFile} className="text-gray-400 hover:text-red-600 transition" disabled={uploading}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                        <button onClick={handleUpload} disabled={uploading} className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 transition">
                            {uploading ? '...' : 'Upload'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadData;