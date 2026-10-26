// src/Admin/pages/ONBOARDING/UserOnboard.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addUser } from "./apiService"; // ✅ use only addUser (no password on frontend)

const UserOnboard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    userDisplayName: "",
    apiKey: "Api_Key",
    role: 2,
    enabled: true,
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "radio" ? value === "true" : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addUser(formData); // ✅ password is NOT included
      alert("User added successfully");
      setFormData({
        username: "",
        userDisplayName: "",
        apiKey: "Api_Key",
        role: 2,
        enabled: true,
      });
    } catch (error) {
      console.error("Error adding user:", error);
      alert("Error adding user");
    }
  };

  const handleClear = () => {
    setFormData({
      username: "",
      userDisplayName: "",
      apiKey: "Api_Key",
      role: 2,
      enabled: true,
    });
  };

  const handleDiscard = () => {
    handleClear();
    navigate("/Admin/Onboarding");
  };

  return (
    <div className="m-6 md:m-12">
      <h1 className="flex justify-center text-3xl font-semibold -mt-10 mb-10">
        USER ONBOARD
      </h1>
      <form className="bg-white p-6 md:p-10 shadow-md rounded-lg" onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" placeholder="Enter Username" />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Name</label>
          <input type="text" name="userDisplayName" value={formData.userDisplayName} onChange={handleChange} required className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" placeholder="Name" />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 mb-2 block">API Key</label>
          <input type="text" name="apiKey" disabled value={formData.apiKey} className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" placeholder="API Key" />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Role</label>
          <input type="text" name="role" disabled value={formData.role} className="block w-full h-11 px-5 py-2.5 border border-gray-300 rounded-lg" />
        </div>

        <div className="mb-6">
          <label className="text-sm font-medium text-gray-600 mb-2 block">Enabled</label>
          <div className="flex space-x-6">
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input type="radio" name="enabled" value="true" checked={formData.enabled === true} onChange={handleChange} className="w-4 h-4" />
              <span className="ml-2">True</span>
            </label>
            <label className="flex items-center text-sm font-medium text-gray-700">
              <input type="radio" name="enabled" value="false" checked={formData.enabled === false} onChange={handleChange} className="w-4 h-4" />
              <span className="ml-2">False</span>
            </label>
          </div>
        </div>

        <div className="flex space-x-4">
          <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-full">Add User</button>
          <button type="button" className="px-5 py-2 bg-purple-600 text-white rounded-full" onClick={handleClear}>Clear</button>
          <button type="button" className="px-5 py-2 bg-red-600 text-white rounded-full" onClick={handleDiscard}>Discard</button>
        </div>
      </form>
    </div>
  );
};

export default UserOnboard;
