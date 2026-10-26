import { useState } from "react";
import Navbar from "./Components/Navbar";
import UserStoryFlow from "./IdeationAgent/US_Creator";
import useLogout from '../Components/Common/logout';
import { useAuthContext } from "../Hooks/Auth/AuthContext";
import Sidebar from "./Components/Sidebar";

const Admin = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const logout = useLogout();
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const { user } = useAuthContext();

  const username = user.displayName

  return (
    <div className="flex h-screen overflow-hidden">
      
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <Navbar
          onProjectSelect={setSelectedProjectId}
          username={username}
        />

        {/* ✅ PROJECT LIST */}
       

        {/* ✅ MAIN CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <UserStoryFlow 
          selectedProjectId={selectedProjectId}
          />
        </div>
      </div>
    </div>
  );
};

export default Admin;