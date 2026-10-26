import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom"; // <--- import routing
import Navbar from "./Components/Navbar";
import Sidebar from "./Components/Sidebar";
import useLogout from '../Components/Common/logout';

// Import your pages
import Dashboard from "./pages/Dashboard";
import Users from "./pages/USERS";
import Projects from "./pages/PROJECTS/ProjectList";
import ProjectOnboarding from "./pages/PROJECTS/onboarding/index";
import ProjectDetails from "./pages/PROJECTS/ProjectDetails/ProjectDetails";

import Audit from "./pages/AuditLogs/AuditLogs";

import Directory from "./pages/Directory/index";

const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const logout = useLogout();

  return (
    <div className="h-screen flex">
      {/* Sidebar */}

      {/* Main content */}
      <div className="flex-1 flex flex-col ml-0 md:ml-56">
        <Navbar />
      <Sidebar isOpen={isSidebarOpen} closeSidebar={() => setIsSidebarOpen(false)} />

        <div className=" flex-1 overflow-auto ">
          <Routes>
            {/* Default route */}
            {/* <Route path="/Admin" element={<Dashboard />} /> */}
            
            {/* Other routes */}
           <Route path="/Admin/Projects" element={<Projects />} />
           <Route path="/Admin/ProjectsOnboarding" element={<ProjectOnboarding />} />
           <Route path="/Admin/Projects/:projectId" element={<ProjectDetails />} />
            <Route path="/Admin/Users" element={<Users />} />
            <Route path="/Admin/Audit" element={<Audit />} />
            {/* <Route path="/Admin/Onboarding" element={<Onboarding />} /> */}
            <Route path="/Admin/Directory" element={<Directory />} />

            {/* Redirect unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/Admin/Projects" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Admin;
