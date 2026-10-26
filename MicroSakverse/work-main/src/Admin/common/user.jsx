import React from "react";

const UserForm = ({ formData, handleChange, handleSubmit, handleClear, handleDiscard }) => {
  return (
    <form className="bg-white p-6 md:p-10  rounded-lg" onSubmit={handleSubmit}>
      <div className="mb-6">
        <label className="flex items-center mb-2 text-gray-600 text-sm font-medium">Username</label>
        <input type="text" name="username" value={formData.username} onChange={handleChange} required className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" placeholder="Enter Username" />
      </div>
      <div className="mb-6">
        <label className="flex items-center mb-2 text-gray-600 text-sm font-medium">Name</label>
        <input type="text" name="userDisplayName" value={formData.userDisplayName} onChange={handleChange} required className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" placeholder="Name" />
      </div>

      <div className="mb-6">
        <label className="flex items-center mb-2 text-gray-600 text-sm font-medium">API Key</label>
        <input type="text" name="apiKey" value={formData.apiKey} onChange={handleChange} required className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" placeholder="Please enter API key" />
      </div>

      <div className="mb-6">
        <label className="flex items-center mb-2 text-gray-600 text-sm font-medium">Role</label>
        <input disabled type="text" name="role" value={formData.role} className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" />
      </div>

      <div className="mb-6">
        <label className="flex items-center mb-2 text-gray-600 text-sm font-medium">Enabled</label>
        <div className="flex space-x-6">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <input type="radio" name="enabled" value="true" checked={formData.enabled} onChange={() => handleChange({ target: { name: "enabled", value: true } })} className="w-4 h-4" />
            <span className="ml-2">True</span>
          </label>
          <label className="flex items-center text-sm font-medium text-gray-700">
            <input disabled type="radio" name="enabled" value="false" checked={!formData.enabled} onChange={() => handleChange({ target: { name: "enabled", value: false } })} className="w-4 h-4" />
            <span className="ml-2">False</span>
          </label>
        </div>
      </div>

    </form>
  );
};

export default UserForm;
