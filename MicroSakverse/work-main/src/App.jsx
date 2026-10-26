import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Components/AppHeader";
import Sidebar from "./Components/SideMenu";
import Login from "./Pages/Auth/Login";
import { ErrorBoundary } from "react-error-boundary";
import PageContent from "./Components/PageContent";
import AdminDashboard from "./Admin/index";
import BusinessDashboard from "./Business/index"
import { useAuthContext } from "./Hooks/Auth/AuthContext.jsx";
import Automation from "./Pages/Automation/index.jsx";

function App() {
  const location = useLocation();
  const {
    isAuthenticated,
    authInfo,
    loading: authLoading,
  } = useAuthContext();

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  if (authLoading) return <div className="text-white p-6">Loading...</div>;

// console.log("This is from ENV file: ", import.meta.env.VITE_API_URL , import.meta.env.VITE_BACKEND_PORT, import.meta.env.VITE_FRONTEND_PORT);


  return (
<div className="App">
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <div role="alert" className="p-6 text-red-500">
          <p>Something went wrong:</p>
          <pre>{error.message}</pre>
          <button
            onClick={resetErrorBoundary}
            className="mt-2 bg-orange-500 text-white px-4 py-2 rounded"
          >
            Try again
          </button>
        </div>
      )}
    >
      {!isAuthenticated ? (
        <Login />
      ) : authInfo?.role === 1 ? (
        <AdminDashboard />
      ) : authInfo?.role === 3 ? (
        <Automation />
      ): authInfo?.role === 5 ? (
        <BusinessDashboard />
      ) : (
        <>
        <PageContent
            Role={authInfo?.role} 
        />
        </>
      )}
    </ErrorBoundary>
  </div>
  );
}

export default App;
