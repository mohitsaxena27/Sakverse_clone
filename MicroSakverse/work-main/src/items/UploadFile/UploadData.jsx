import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import showToast from '../../items/ToastMessage/toastUtil';


const UploadData = ({ tableId, fetchTableData }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            showToast("Please select a file to upload", "error");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("table_id", tableId);

        try {
            const response = await axios.post(`${config.TDMIP}/upload_excel`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.status === 200) {
                showToast("File uploaded successfully", "success");
                setFile(null); // Clear selected file
                fetchTableData(); // Call fetchTableData after successful upload
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            showToast("Failed to upload file", "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <label className="flex items-center cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200">
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                <span></span>
                <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv"
                    style={{ display: 'none' }} // Hide the file input
                />
            </label>
            {file && (
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200">
                    Upload
                </button>
            )}
        </form>
    );
};

export default UploadData;
