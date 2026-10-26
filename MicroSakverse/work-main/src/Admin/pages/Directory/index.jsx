import { useState, useEffect } from 'react';
import {
  faFolder, faFile, faPlus, faTrashAlt, faDownload,
  faArrowRight, faSave, faFolderOpen,
  faFileCode, faFileAlt, faFileWord,
  faFilePdf, faFileImage, faFileCsv
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  fetchFolderStructure,
  uploadFilesToFolder,
  deleteFileOrFolder
} from './api';

const getFileIcon = (name) => {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'json':
    case 'ts':
    case 'html':
    case 'css':
      return faFileCode;
    case 'pdf':
      return faFilePdf;
    case 'doc':
    case 'docx':
      return faFileWord;
    case 'csv':
    case 'xlsx':
      return faFileCsv;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return faFileImage;
    case 'txt':
      return faFileAlt;
    default:
      return faFile;
  }
};

const formatFileSize = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function App() {
  const [folders, setFolders] = useState([]);
  const [current, setCurrent] = useState(null);
  const [pendingUploads, setPendingUploads] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const data = await fetchFolderStructure();
      setFolders(data);

      // If URL has ?folder=name, auto-open that folder
      const urlParams = new URLSearchParams(window.location.search);
      const folderName = urlParams.get('folder');
      if (folderName) {
        const matched = data.find(f => f.name === folderName);
        if (matched) {
          setCurrent(matched);
        }
      }

    } catch (err) {
      setError('Failed to load folders.');
    } finally {
      setLoading(false);
    }
  };

  const openFolder = folder => {
    setCurrent(folder);
    setPendingUploads([]);
    setSearchTerm('');

    // Update URL to include selected folder
    const url = new URL(window.location);
    url.searchParams.set('folder', folder.name);
    window.history.replaceState(null, '', url);
  };

  const goHome = () => {
    setCurrent(null);
    setSearchTerm('');

    // Remove folder from URL
    const url = new URL(window.location);
    url.searchParams.delete('folder');
    window.history.replaceState(null, '', url);
  };

  const onFileSelect = e => {
    const files = Array.from(e.target.files).filter(f => f.size > 0);
    if (!files.length) return alert('No valid files selected.');
    setPendingUploads(prev => [...prev, ...files]);
  };

  const saveUploads = async () => {
    try {
      await uploadFilesToFolder(current.name, pendingUploads);
      refreshCurrent();
    } catch (err) {
      alert('Upload failed.');
    }
  };

  const deleteFile = async fileName => {
    if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      await deleteFileOrFolder(current.name, fileName);
      refreshCurrent();
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const refreshCurrent = async () => {
    const data = await fetchFolderStructure();
    setFolders(data);
    const updated = current ? data.find(f => f.name === current.name) : null;
    setCurrent(updated);
    setPendingUploads([]);
  };

  const displayedFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create combined files array with proper date objects
  const combinedFiles = current
    ? [
        ...current.children.map(f => ({
          name: f.name,
          size: f.size,
          lastModified: new Date(f.lastModified),
          isNew: false
        })),
        ...pendingUploads.map(f => ({
          name: f.name,
          size: f.size,
          lastModified: new Date(f.lastModified || Date.now()),
          isNew: true
        }))
      ]
    : [];

  // Filter and sort files by lastModified in descending order
  const displayedFiles = combinedFiles
    .filter(file => file.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className="min-h-screen p-4 bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100 font-sans">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-4">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faFolder} className="text-2xl bg-indigo-600 p-2 rounded-lg" />
            <div>
              <h1 className="text-xl font-bold">Sak AI Repository</h1>
              <p className="text-xs text-gray-400">Documents of Projects</p>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder={current ? 'Search files…' : 'Search folders…'}
              className="w-full p-2 pl-9 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
        </div>

        <div className="mb-4 text-gray-400 text-sm flex items-center gap-2">
          <button onClick={goHome} className={current ? 'text-blue-400' : 'cursor-default text-gray-500'}>
            🏠 Home - 
          </button>
          {current && (
            <span className="text-white flex items-center gap-1">
              <FontAwesomeIcon icon={faFolderOpen} /> {current.name}
            </span>
          )}
        </div>

        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading…</div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">{error}</div>
          ) : current ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Files in {current.name}</h2>
                <label className="bg-indigo-600 hover:bg-indigo-700 p-2 rounded-lg cursor-pointer">
                  <FontAwesomeIcon icon={faPlus} />
                  <input type="file" multiple onChange={onFileSelect} className="hidden" />
                </label>
              </div>

              {pendingUploads.length > 0 && (
                <button onClick={saveUploads} className="bg-red-600 hover:bg-red-500 px-3 py-2 rounded-lg mb-4">
                  <FontAwesomeIcon icon={faSave} /> Save Uploaded Files
                </button>
              )}

              {displayedFiles.length === 0 ? (
                <div className="text-center py-6 text-gray-400">No files found.</div>
              ) : (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3 border-b border-gray-600">Name</th>
                        <th className="text-left p-3 border-b border-gray-600">Size</th>
                        <th className="text-left p-3 border-b border-gray-600">Last Modified</th>
                        <th className="text-left p-3 border-b border-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedFiles.map(file => (
                        <tr 
                          key={file.name} 
                          className={`border-b border-gray-600 ${file.isNew ? 'bg-red-600/10' : 'hover:bg-gray-700/50'}`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <FontAwesomeIcon icon={getFileIcon(file.name)} />
                              <span className="truncate max-w-xs">{file.name}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="p-3">
                            {file.isNew ? 'Not yet saved' : file.lastModified.toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button className="p-2 bg-gray-700 rounded-lg hover:bg-gray-600" title="Download">
                                <FontAwesomeIcon icon={faDownload} />
                              </button>
                              <button
                                onClick={() => deleteFile(file.name)}
                                className="p-2 bg-red-600 rounded-lg hover:bg-red-500"
                                title="Delete"
                                disabled={file.isNew}
                              >
                                <FontAwesomeIcon icon={faTrashAlt} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold">Folders</h2>
                <span className="text-gray-400">{displayedFolders.length} folders</span>
              </div>
              {displayedFolders.length === 0 ? (
                <div className="text-center py-6 text-gray-400">No folders match your search</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 bg-gray-700 z-10">
                      <tr>
                        <th className="text-left p-3 border-b border-gray-600">Folder Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedFolders.map(f => (
                        <tr 
                          key={f.name} 
                          onClick={() => openFolder(f)}
                          className="border-b border-gray-600 cursor-pointer hover:bg-gray-700/50"
                        >
                          <td className="p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faFolder} />
                                <span>{f.name}</span>
                              </div>
                              <FontAwesomeIcon icon={faArrowRight} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="text-center text-xs text-gray-500 mt-8">
          © {new Date().getFullYear()} Sak AI. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default App;