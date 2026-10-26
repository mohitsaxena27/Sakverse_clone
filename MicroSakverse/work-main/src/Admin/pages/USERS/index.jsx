import React, { useState } from 'react';
import {
  Plus, Search, Filter, Edit, Trash2, Mail, UserCheck, UserX
} from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([
    { id: 1, name: 'John Smith', email: 'john@example.com', role: 'Project Manager', project: 'Alpha Testing', status: 'active', lastLogin: '2024-01-15' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Test Manager', project: 'Beta Release', status: 'active', lastLogin: '2024-01-14' },
    { id: 3, name: 'Mike Chen', email: 'mike@example.com', role: 'Automation Engineer', project: 'Alpha Testing', status: 'inactive', lastLogin: '2024-01-10' },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'Manual Tester', project: 'Gamma Project', status: 'active', lastLogin: '2024-01-15' },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    project: '',
    status: 'active'
  });

  const roles = ['Manual Tester', 'Automation Engineer', 'Test Manager', 'Project Manager'];
  const projects = ['Alpha Testing', 'Beta Release', 'Gamma Project', 'Delta Launch'];

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    const matchesProject = !filterProject || user.project === filterProject;
    return matchesSearch && matchesRole && matchesProject;
  });

  const handleSubmitUser = () => {
    if (newUser.name && newUser.email && newUser.role && newUser.project) {
      if (isEditMode && selectedUser) {
        setUsers(users.map(user =>
          user.id === selectedUser.id ? { ...selectedUser, ...newUser } : user
        ));
      } else {
        const user = {
          id: users.length + 1,
          ...newUser,
          lastLogin: new Date().toISOString().split('T')[0]
        };
        setUsers([...users, user]);
      }

      setNewUser({ name: '', email: '', role: '', project: '', status: 'active' });
      setSelectedUser(null);
      setIsEditMode(false);
      setShowAddModal(false);
    }
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(user =>
      user.id === id
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));
  };

  const deleteUser = (id) => {
    setUsers(users.filter(user => user.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 space-y-6 text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-400">Manage users and their project assignments</p>
        </div>
        <button
          onClick={() => {
            setIsEditMode(false);
            setSelectedUser(null);
            setNewUser({ name: '', email: '', role: '', project: '', status: 'active' });
            setShowAddModal(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 mt-4 md:mt-0 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-black text-white"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg bg-black text-white"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="px-4 py-2 border border-gray-700 rounded-lg bg-black text-white"
          >
            <option value="">All Projects</option>
            {projects.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Filter className="w-4 h-4" />
            <span>{filteredUsers.length} users found</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                {['User', 'Role', 'Project', 'Status', 'Last Login', 'Actions'].map(title => (
                  <th key={title} className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-800">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium">{user.name}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200">{user.role}</span>
                  </td>
                  <td className="px-6 py-4">{user.project}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : 'bg-red-900 text-red-200'
                    }`}>
                      {user.status === 'active' ? <UserCheck className="w-3 h-3 mr-1" /> : <UserX className="w-3 h-3 mr-1" />}
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{user.lastLogin}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setNewUser(user);
                          setIsEditMode(true);
                          setShowAddModal(true);
                        }}
                        className="p-1 rounded-full hover:bg-blue-900 text-blue-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1 rounded-full hover:bg-yellow-900 text-yellow-300"><Mail className="w-4 h-4" /></button>
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`p-1 rounded-full hover:bg-gray-800 ${
                          user.status === 'active' ? 'text-red-300' : 'text-green-300'
                        }`}
                      >
                        {user.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </button>
                      <button onClick={() => deleteUser(user.id)} className="p-1 rounded-full hover:bg-red-900 text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-semibold">{isEditMode ? 'Edit User' : 'Add New User'}</h2>
            </div>
            <div className="p-6 space-y-4">
              {['name', 'email'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    {field === 'name' ? 'Full Name *' : 'Email *'}
                  </label>
                  <input
                    type={field === 'email' ? 'email' : 'text'}
                    value={newUser[field]}
                    onChange={(e) => setNewUser(prev => ({ ...prev, [field]: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-black text-white"
                    placeholder={`Enter ${field}`}
                  />
                </div>
              ))}

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-black text-white"
                >
                  <option value="">Select a role</option>
                  {roles.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              {/* Project */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Project *</label>
                <select
                  value={newUser.project}
                  onChange={(e) => setNewUser(prev => ({ ...prev, project: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-black text-white"
                >
                  <option value="">Select a project</option>
                  {projects.map(project => <option key={project} value={project}>{project}</option>)}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setIsEditMode(false);
                  setNewUser({ name: '', email: '', role: '', project: '', status: 'active' });
                }}
                className="px-4 py-2 text-sm text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUser}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                {isEditMode ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
