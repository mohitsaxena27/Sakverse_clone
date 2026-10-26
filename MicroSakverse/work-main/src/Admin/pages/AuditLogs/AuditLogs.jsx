import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Search,
  User,
  FolderPlus,
  Settings,
  UserPlus
} from 'lucide-react';

const AuditLogs = () => {
  const [logs] = useState([
    {
      id: 1,
      timestamp: '2024-01-15 14:30:22',
      user: 'Admin',
      action: 'Created Project',
      target: 'Alpha Testing',
      details: 'New project created with initial configuration',
      type: 'project'
    },
    {
      id: 2,
      timestamp: '2024-01-15 14:25:11',
      user: 'John Smith',
      action: 'User Login',
      target: 'Authentication',
      details: 'Successful login from IP 192.168.1.100',
      type: 'security'
    },
    {
      id: 3,
      timestamp: '2024-01-15 14:20:05',
      user: 'Admin',
      action: 'Added User',
      target: 'Sarah Johnson',
      details: 'User assigned to Beta Release project as Test Manager',
      type: 'user'
    },
    {
      id: 4,
      timestamp: '2024-01-15 14:15:33',
      user: 'System',
      action: 'Configuration Update',
      target: 'LLM Settings',
      details: 'Updated default model to GPT-4',
      type: 'system'
    },
    {
      id: 5,
      timestamp: '2024-01-15 14:10:17',
      user: 'Mike Chen',
      action: 'Document Upload',
      target: 'Alpha Testing',
      details: 'Uploaded test specification document (2.3MB)',
      type: 'project'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateRange, setDateRange] = useState('today');

  const getTypeIcon = (type) => {
    switch (type) {
      case 'user':
        return <UserPlus className="w-4 h-4" />;
      case 'project':
        return <FolderPlus className="w-4 h-4" />;
      case 'system':
        return <Settings className="w-4 h-4" />;
      case 'security':
        return <User className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'user':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
      case 'project':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'system':
        return 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200';
      case 'security':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.target.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = !filterType || log.type === filterType;

    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Track all system activities and changes
          </p>
        </div>
        <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
          <Download className="w-4 h-4" />
          <span>Export Logs</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">All Types</option>
            <option value="user">User Actions</option>
            <option value="project">Project Changes</option>
            <option value="system">System Updates</option>
            <option value="security">Security Events</option>
          </select>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>

          {/* Count */}
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Filter className="w-4 h-4" />
            <span>{filteredLogs.length} entries found</span>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-left">
              <tr>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{log.timestamp}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-white">
                    {log.user}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    {log.target}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(
                        log.type
                      )}`}
                    >
                      {getTypeIcon(log.type)}
                      <span className="ml-1 capitalize">{log.type}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 max-w-xs break-words text-gray-500 dark:text-gray-400">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
