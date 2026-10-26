import React from 'react';
import { useAuthContext } from '../../Hooks/Auth/AuthContext';
import useLogout from '../../Components/Common/logout';

const Settings = () => {
  const { authInfo, loading } = useAuthContext();
  const handleLogout = useLogout();

  return (
    <div className="min-h-screen bg-sky-400 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-md p-8 space-y-6">
        <h1 className="text-4xl font-extrabold text-gray-800 text-center">Settings</h1>

        {loading ? (
          <div className="flex justify-center">
            <p className="text-gray-500 animate-pulse">Loading user info...</p>
          </div>
        ) : authInfo ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-lg font-medium text-gray-700">
            Name: <span className="font-semibold text-blue-600">{authInfo.displayName}</span>
            </p>
        
            {authInfo.role && (
              <p className="text-xs text-gray-500 mt-2 italic">Role: {authInfo.role}</p>
            )}
          </div>
        ) : (
          <p className="text-center text-gray-600">No user data available</p>
        )}

        <div className="pt-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-400"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
