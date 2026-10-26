// pages/tdm/index.jsx
import React, { useState, useEffect } from 'react';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import Repository from './components/Repository';
import Toolbar from './components/Toolbar/Toolbar';
import Spreadsheet from './components/Spreadsheet/Spreadsheet';
import saksoftLogo from "../../assets/images/sakicon.png";

const TDM = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [selectedRepoId, setSelectedRepoId] = useState(null);
    const [selectedRepoName, setSelectedRepoName] = useState('');
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedTableName, setSelectedTableName] = useState('');

    const [selectedTables, setSelectedTables] = useState([]);
    const [spreadsheetKey, setSpreadsheetKey] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    // ─── NEW: Store all repositories for search ──────────────────────────
    const [allRepositories, setAllRepositories] = useState([]);

    // Profile dropdown state
    const [showLogout, setShowLogout] = useState(false);

    // -----------------------------
    const handleProfileClick = () => {
        setShowLogout((prev) => !prev);
    };

    const handleMouseEnter = () => setShowLogout(true);
    const handleMouseLeave = () => setShowLogout(false);

    const handleLogout = () => {
        localStorage.clear();
        showToast('Logged out successfully', 'success');
        window.location.reload();
    };

    // -----------------------------
    // Load saved state
    // -----------------------------
    useEffect(() => {
        const savedRepoId = localStorage.getItem('tdm_selected_repo_id');
        const savedTableId = localStorage.getItem('tdm_selected_table_id');
        const savedSidebarState = localStorage.getItem('tdm_sidebar_open');

        if (savedRepoId) setSelectedRepoId(Number(savedRepoId));
        if (savedTableId) setSelectedTableId(Number(savedTableId));
        if (savedSidebarState !== null) {
            setIsSidebarOpen(savedSidebarState === 'true');
        }
    }, []);

    // -----------------------------
    // Persist state
    // -----------------------------
    useEffect(() => {
        if (selectedRepoId) {
            localStorage.setItem('tdm_selected_repo_id', selectedRepoId);
        } else {
            localStorage.removeItem('tdm_selected_repo_id');
        }
    }, [selectedRepoId]);

    useEffect(() => {
        if (selectedTableId) {
            localStorage.setItem('tdm_selected_table_id', selectedTableId);
        } else {
            localStorage.removeItem('tdm_selected_table_id');
        }
    }, [selectedTableId]);

    useEffect(() => {
        localStorage.setItem('tdm_sidebar_open', isSidebarOpen);
    }, [isSidebarOpen]);

    // -----------------------------
    // Handlers
    // -----------------------------
    const handleTableSelect = (tableId) => {
        setSelectedTableId(tableId);
        const selectedTable = selectedTables.find((table) => table.table_id === tableId);
        if (selectedTable) {
            setSelectedTableName(selectedTable.table_name);
        }
    };

    const handleRepoSelect = (repoId, tables, repoName) => {
        setSelectedRepoId(repoId);
        setSelectedRepoName(repoName || '');
        setSelectedTables(tables || []);
        setSelectedTableId(null);
        setSelectedTableName('');
        localStorage.removeItem('tdm_selected_table_id');
    };

    const handleTableDelete = (deletedTableId) => {
        setSelectedTables((prevTables) =>
            prevTables.filter((table) => table.table_id !== deletedTableId)
        );

        if (selectedTableId === deletedTableId) {
            setSelectedTableId(null);
            localStorage.removeItem('tdm_selected_table_id');
        }

        setSpreadsheetKey((prevKey) => prevKey + 1);
    };

    const handleRefreshData = () => {
        setSpreadsheetKey((prevKey) => prevKey + 1);
    };

    const handleReloadAllData = async () => {
        setIsLoading(true);
        try {
            setSpreadsheetKey((prevKey) => prevKey + 1);
            showToast('Data refreshed successfully', 'success');
        } catch (error) {
            showToast('Failed to refresh data', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // ─── NEW: Handle repositories loaded from Repository component ──────
    const handleRepositoriesLoaded = (repos) => {
        setAllRepositories(repos);
    };

    // -----------------------------
    // UI
    // -----------------------------
    return (
        <div className="h-screen flex flex-col">
            <ToastContainer />
            {/* Header */}
            <header className="bg-sky-800 border-b border-gray-800">
                <div className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 shadow-2xl">
                        <img
                            src={saksoftLogo}
                            alt="Saksoft Logo"
                            className="h-9 cursor-pointer hover:scale-105 transition"
                        />
                        <div>
                            <h1 className="text-lg font-semibold text-yellow-400">
                                TDM - Test Data Management
                            </h1>
                            <p className="text-xs text-gray-100">
                                Repository & Table Management
                            </p>
                        </div>
                    </div>

                    {/* Profile */}
                    <div className="relative">
                        <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-800"
                            onClick={handleProfileClick}
                        >
                            <FaUser className="text-white text-lg" />
                        </div>

                        {showLogout && (
                            <div
                                className="absolute right-0 mt-2 bg-gray-100 rounded-lg shadow-xl w-48 z-50 overflow-hidden"
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                            >
                                <button
                                    onClick={handleLogout}
                                    className="w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-300 hover:text-black flex items-center gap-2"
                                >
                                    <FaSignOutAlt />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Layout */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div
                    className={`bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarOpen ? 'w-72' : 'w-0'
                        } overflow-hidden`}
                >
                    {isSidebarOpen && (
                        <Repository
                            onRepoSelect={handleRepoSelect}
                            selectedRepoId={selectedRepoId}
                            onRefresh={handleReloadAllData}
                            onRepositoriesLoaded={handleRepositoriesLoaded} // ─── NEW ───
                        />
                    )}
                </div>

                {/* Main */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
                    <Toolbar
                        toggleSidebar={() =>
                            setIsSidebarOpen(!isSidebarOpen)
                        }
                        repoData={selectedTables}
                        selectedRepoId={selectedRepoId}
                        onTableSelect={handleTableSelect}
                        onTableDelete={handleTableDelete}
                        selectedTableId={selectedTableId}
                        setSelectedTablename={setSelectedTableName}
                        onRefresh={handleReloadAllData}
                        repositories={allRepositories} // ─── NEW ───
                        onRepoSelect={handleRepoSelect} // ─── NEW ───
                        
                    />

                    <div className="flex-1 overflow-auto bg-white">
                        {selectedTableId ? (
                            <Spreadsheet
                                key={`spreadsheet-${spreadsheetKey}-${selectedTableId}`}
                                selectedTableId={selectedTableId}
                                selectedTableName={selectedTableName}
                                onDataChange={handleRefreshData}
                                selectedRepoId={selectedRepoId}
                                repoName={selectedRepoName}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-10 h-10 text-gray-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-medium text-gray-700">
                                        No Table Selected
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Select a table from the repository to view data
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TDM;