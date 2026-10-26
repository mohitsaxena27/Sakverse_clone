// layouts/MainLayout.jsx
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppHeader from "../Components/AppHeader";
import Sidebar from "../Components/SideMenu";
import { UserDataProvider } from "../Hooks/Manual/UserDataContext";

const MainLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <UserDataProvider>
      <AppHeader
        onToggleSidebar={toggleSidebar}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 ml-0 md:ml-16">
          <Outlet />
        </main>
      </div>
    </UserDataProvider>
  );
};

export default MainLayout;
