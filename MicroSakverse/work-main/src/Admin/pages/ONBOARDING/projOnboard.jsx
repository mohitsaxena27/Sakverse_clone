import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addProject, addUser, AssignRole } from "./apiService"; // ✅ use addUser (no password on client)
import showToast from "../../../items/ToastMessage/toastUtil";

const ProjOnboard = () => {
  const navigate = useNavigate();

  const [userId, setUserID] = useState();
  const [projectId, setProjectID] = useState();
  const [files, setFiles] = useState([]);

  const [projectFormData, setProjectFormData] = useState({
    name: "",
    description: "",
    manualRepo: "",
    linked: false,
  });

  const [userFormData, setUserFormData] = useState({
    username: "",
    userDisplayName: "",
    apiKey: "",
    role: 2,
    enabled: true,
  });

  const [showUserForm, setShowUserForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleProjectChange = (e) => {
    const { name, value, type } = e.target;
    setProjectFormData({
      ...projectFormData,
      [name]: type === "radio" ? value === "true" : value,
    });
  };

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  const handleClear = () => {
    setProjectFormData({
      name: "",
      description: "",
      manualRepo: "",
      linked: false,
    });
    setUserFormData({
      username: "",
      userDisplayName: "",
      apiKey: "",
      role: 2,
      enabled: true,
    });
    setShowUserForm(false);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!userFormData.username.trim() || !userFormData.userDisplayName.trim()) {
      alert("Please add a user before submitting!");
      setLoading(false);
      return;
    }

    try {
      const projectResponse = await addProject(projectFormData);
      const userResponse = await addUser(userFormData); // ✅ renamed from addUserWithDefaultPassword

      const userId1 = userResponse.userid;
      const projectId1 = projectResponse.projectid;

      if (userId1 && projectId1) {
        await AssignRole({ userId: userId1, projectId: projectId1 });
        // console.log("Role Assigned Successfully");
      } else {
        throw new Error("User ID or Project ID missing");
      }

      setProjectID(projectResponse);
      setUserID(userResponse);
      handleClear();
      setLoading(false);
      alert("Project, User, and Role Assigned Successfully!");
    } catch (error) {
      console.error("Error during submission:", error);
      showToast(error.message || "Submission Failed!", "error");
      setLoading(false);
    }
  };

  const role = () => {
    switch (userFormData.role) {
      case 1:
        return "Admin";
      case 2:
        return "Manual Tester";
      case 3:
        return "Automation Tester";
      case 4:
        return "SDET";
      case 5:
        return "Data Analyst";
      default:
        return "Role Not Assigned";
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-8 text-white flex justify-center">
      <div className="w-full max-w-screen-lg">
        <h1 className="text-3xl text-center font-semibold mb-10">PROJECT & USER ONBOARD</h1>

        <div className="bg-white p-6 md:p-10 rounded-lg shadow-md">
          <form onSubmit={handleFinalSubmit}>
            {/* Project Form */}
            {/* Project Name */}
            <div className="mb-6">
              <label className="text-gray-700 text-sm font-medium">PROJECT NAME</label>
              <input
                type="text"
                name="name"
                value={projectFormData.name}
                onChange={handleProjectChange}
                required
                className="block w-full h-11 px-5 py-2 border text-black rounded-lg mt-1"
                placeholder="Enter project name"
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="text-gray-700 text-sm font-medium">DESCRIPTION</label>
              <textarea
                name="description"
                value={projectFormData.description}
                onChange={handleProjectChange}
                required
                className="block w-full h-32 px-5 py-2 border text-black rounded-lg mt-1"
                placeholder="Please write the project description"
              ></textarea>
            </div>

            {/* Manual Repo */}
            <div className="mb-6">
              <label className="text-gray-700 text-sm font-medium">MANUAL REPOSITORY</label>
              <input
                type="text"
                name="manualRepo"
                value={projectFormData.manualRepo}
                onChange={handleProjectChange}
                className="block w-full h-11 px-5 py-2 border text-black rounded-lg mt-1"
                placeholder="Manual Repository"
              />
            </div>

            {/* Add User Toggle */}
            <div className="flex justify-end mb-4">
              <span className="text-sm text-gray-500 mr-2">Add at least one user:</span>
              <button
                type="button"
                onClick={() => setShowUserForm(!showUserForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full"
              >
                {showUserForm ? "-" : "+"}
              </button>
            </div>

            {/* User Form */}
            {showUserForm && (
              <div className="bg-gray-50 p-4 border rounded-lg mb-6">
                <h2 className="text-lg font-semibold text-black mb-4">User Details</h2>

                <label className="text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={userFormData.username}
                  onChange={handleUserChange}
                  required
                  className="block w-full h-11 px-5 py-2 border text-black rounded-lg mb-4"
                />

                <label className="text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  name="password"
                  disabled
                  value="********" // ✅ password handled on server
                  className="block w-full h-11 px-5 py-2 border text-black rounded-lg mb-4"
                />

                <label className="text-sm font-medium text-gray-700">Display Name</label>
                <input
                  type="text"
                  name="userDisplayName"
                  value={userFormData.userDisplayName}
                  onChange={handleUserChange}
                  required
                  className="block w-full h-11 px-5 py-2 border text-black rounded-lg mb-4"
                />

                <label className="text-sm font-medium text-gray-700">LLM API Key</label>
                <input
                  type="text"
                  name="apiKey"
                  value={userFormData.apiKey}
                  onChange={handleUserChange}
                  className="block w-full h-11 px-5 py-2 border text-black rounded-lg mb-4"
                />

                <label className="text-sm font-medium text-gray-700">Role</label>
                <input
                  type="text"
                  name="role"
                  value={role()}
                  disabled
                  className="block w-full h-11 px-5 py-2 border text-black rounded-lg mb-4"
                />

                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="flex items-center space-x-4 mt-2">
                  <label className="flex items-center text-sm text-gray-700">
                    <input
                      type="radio"
                      name="enabled"
                      value="true"
                      checked={userFormData.enabled}
                      onChange={() => setUserFormData({ ...userFormData, enabled: true })}
                      className="w-4 h-4"
                    />
                    <span className="ml-2">Enabled</span>
                  </label>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                type="button"
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-full"
                onClick={handleClear}
              >
                {loading ? "Clearing..." : "Clear"}
              </button>
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-full"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProjOnboard;
