import React from 'react';

const TableLoading = () => {
    return (
        <div className="flex items-center justify-center h-full bg-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-3 text-sm text-gray-500 font-medium">Loading table data...</p>
                <p className="text-xs text-gray-400 mt-1">Please wait</p>
            </div>
        </div>
    );
};

export default TableLoading;