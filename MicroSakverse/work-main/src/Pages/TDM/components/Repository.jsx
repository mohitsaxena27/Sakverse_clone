// pages/tdm/components/Repository.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faFolder, faTrash, faChevronRight, faDatabase, faSync } from '@fortawesome/free-solid-svg-icons';
import { useTDM } from '../../../Hooks/TDM/tdm';
import ConfirmModal from './ConfirmModal';
import showToast from '../../../items/ToastMessage/toastUtil';

const Repository = ({ onRepoSelect, selectedRepoId, onRefresh, onRepositoriesLoaded }) => {
    const { getRepositories, createRepository, deleteRepository } = useTDM();
    const [repositories, setRepositories] = useState([]);
    const [newRepoName, setNewRepoName] = useState('');
    const [showInput, setShowInput] = useState(false);
    const [error, setError] = useState('');
    const [hoveredRepoId, setHoveredRepoId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [repoToDelete, setRepoToDelete] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const inputRef = useRef(null);

    useEffect(() => {
        fetchRepositories(true);
    }, []);

    useEffect(() => {
        if (selectedRepoId && repositories.length > 0) {
            const selectedRepo = repositories.find(repo => repo.repo_id === selectedRepoId);
            if (selectedRepo) {
                onRepoSelect(
                    selectedRepo.repo_id,
                    selectedRepo.tables,
                    selectedRepo.repo_name
                );
            }
        }
    }, [repositories, selectedRepoId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (inputRef.current && !inputRef.current.contains(event.target)) {
                setShowInput(false);
                setNewRepoName('');
                setError('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchRepositories = async (isInitial = false) => {
        if (isInitial) setInitialLoading(true);
        try {
            const data = await getRepositories();
            setRepositories(data.repositories || []);
            
            // ─── NEW: Pass repositories up to parent ─────────────────────
            if (onRepositoriesLoaded) {
                onRepositoriesLoaded(data.repositories || []);
            }
        } catch {
            showToast('Failed to load repositories', 'error');
        } finally {
            if (isInitial) setInitialLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchRepositories();
        setIsRefreshing(false);
        showToast('Repositories refreshed', 'success');
        if (onRefresh) onRefresh();
    };

    const addRepo = async () => {
        if (!newRepoName.trim()) return setError('Repository name cannot be empty.');
        if (repositories.some(r => r.repo_name?.toLowerCase() === newRepoName.toLowerCase()))
            return setError('Repository name already exists.');

        try {
            await createRepository(newRepoName);
            setNewRepoName('');
            setShowInput(false);
            setError('');
            showToast('Repository created successfully', 'success');
            await fetchRepositories();
        } catch {
            showToast('Failed to create repository', 'error');
        }
    };

    const deleteRepo = async (repoId) => {
        try {
            await deleteRepository(repoId);
            setIsModalOpen(false);
            showToast('Repository deleted successfully', 'success');
            if (selectedRepoId === repoId) onRepoSelect(null, []);
            await fetchRepositories();
        } catch {
            showToast('Failed to delete repository', 'error');
        }
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-3 text-sm text-gray-500">Loading repositories...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Repositories</h2>
                        <p className="text-xs text-gray-400 mt-0.5">{repositories.length} total</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Refresh Repositories"
                        >
                            <FontAwesomeIcon icon={faSync} spin={isRefreshing} size="sm" />
                        </button>
                        <button
                            onClick={() => setShowInput(true)}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Create New Repository"
                        >
                            <FontAwesomeIcon icon={faFolderPlus} size="sm" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-3">
                    {/* Create New Input */}
                    {showInput && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200" ref={inputRef}>
                            <div className="flex items-center space-x-2">
                                <FontAwesomeIcon icon={faFolder} className="text-blue-500 text-sm" />
                                <input
                                    type="text"
                                    value={newRepoName}
                                    onChange={(e) => setNewRepoName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addRepo()}
                                    placeholder="New repository name..."
                                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    autoFocus
                                />
                                <button
                                    onClick={addRepo}
                                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                >
                                    Create
                                </button>
                            </div>
                            {error && <p className="text-xs text-red-600 mt-2 ml-6">{error}</p>}
                        </div>
                    )}

                    {/* Repository List */}
                    <div className="space-y-1">
                        {repositories.map((repo) => (
                            <div
                                key={repo.repo_id}
                                className={`group relative flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150
                                    ${selectedRepoId === repo.repo_id
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                                        : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200'
                                    }`}
                                onMouseEnter={() => setHoveredRepoId(repo.repo_id)}
                                onMouseLeave={() => setHoveredRepoId(null)}
                                onClick={() => onRepoSelect(repo.repo_id, repo.tables, repo.repo_name)}
                            >
                                <div className="flex items-center space-x-3 flex-1 min-w-0">
                                    <FontAwesomeIcon
                                        icon={faFolder}
                                        className={`text-base ${selectedRepoId === repo.repo_id ? 'text-blue-600' : 'text-amber-500'}`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{repo.repo_name}</p>
                                        <p className="text-xs text-gray-400">{repo.tables?.length || 0} tables</p>
                                    </div>
                                    {selectedRepoId === repo.repo_id && (
                                        <FontAwesomeIcon icon={faChevronRight} className="text-xs text-blue-600" />
                                    )}
                                </div>

                                {hoveredRepoId === repo.repo_id && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRepoToDelete(repo.repo_id);
                                            setIsModalOpen(true);
                                        }}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Repository"
                                    >
                                        <FontAwesomeIcon icon={faTrash} size="sm" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {repositories.length === 0 && (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <FontAwesomeIcon icon={faDatabase} className="text-gray-400 text-2xl" />
                            </div>
                            <p className="text-sm font-medium text-gray-600">No repositories</p>
                            <p className="text-xs text-gray-400 mt-1">Click the + button to create one</p>
                        </div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => deleteRepo(repoToDelete)}
                title="Confirm Deletion"
                message="Are you sure you want to delete this repository? This action cannot be undone."
            />
        </div>
    );
};

export default Repository;