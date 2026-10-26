import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";
import DashboardIcon from "../../assets/icons/dashboard.svg";
import ManualIcon from "../../assets/icons/manualproject.svg";
import AutomationIcon from "../../assets/icons/automation.svg";
import SettingsIcon from "../../assets/icons/settings.svg";
import { useUserDataContext } from "../../Hooks/Manual/UserDataContext";

function Sidebar({ isSidebarOpen, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedKey, setSelectedKey] = useState("/");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [hovered, setHovered] = useState(false);

  const { projects, loading, error } = useUserDataContext();

  useEffect(() => {
    setSelectedKey(location.pathname);
  }, [location.pathname]);

  const handleClick = (path) => {
    setSelectedKey(path);
    navigate(path);
    if (onClose) onClose();
  };

  const handleProjectClick = (projectId, type) => {
    navigate(`/${type}Project/${projectId}`);
    if (onClose) onClose();
  };

  const handleAutomationProjectClick = (projectId) => {
    navigate(`/automation?projectId=${projectId}`);
    if (onClose) onClose();
  };

  const isOpen = isSidebarOpen || hovered;

  const renderProjects = (type) => {
    if (loading) return <p className="text-sm text-gray-400">Loading...</p>;
    if (error) return <p className="text-sm text-red-400">Error loading projects</p>;

    const filtered = projects.filter(
      (p) => p.project_type === type
    );

    if (filtered.length === 0) {
      return (
        <p className="text-sm text-gray-500">
          No {type.toLowerCase()} projects available
        </p>
      );
    }

    return filtered.map((project) => {
      const isAutomation = type === "Automation";

      return (
        <button
          key={project.project_id}
          onClick={() =>
            isAutomation
              ? handleAutomationProjectClick(project.project_id)
              : handleProjectClick(project.project_id, type)
          }
          className="block w-full text-left px-2 py-1 text-sm rounded-md 
                     text-gray-300 hover:bg-gray-700 hover:text-yellow-400 transition"
        >
          {project.project_name}
        </button>
      );
    });
  };

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`fixed left-0 top-0 h-full bg-[#0f172a]  border-yellow-600/20
      transition-all duration-300 z-40 mt-14 flex flex-col
      ${isOpen ? "w-64" : "w-0 overflow-hidden md:w-16"}`}
    >
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">

        {/* Dashboard */}
        <button
          onClick={() => handleClick("/")}
          className={`flex items-center w-full px-3 py-2 rounded-lg transition
          ${selectedKey === "/" 
            ? "bg-yellow-500 text-black shadow-md" 
            : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"}`}
        >
          <img src={DashboardIcon} className="w-6 h-6" />
          {isOpen && <span className="ml-3">Dashboard</span>}
        </button>

        {/* Manual Projects */}
        <div>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "manual" ? null : "manual")
            }
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition
            ${selectedKey.includes("/ManualProject") 
              ? "bg-yellow-500 text-black shadow-md" 
              : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"}`}
          >
            <div className="flex items-center">
              <img src={ManualIcon} className="w-6 h-6" />
              {isOpen && <span className="ml-3">Manual Projects</span>}
            </div>
            {isOpen &&
              (openDropdown === "manual" ? <FaChevronDown /> : <FaChevronRight />)}
          </button>

          {isOpen && openDropdown === "manual" && (
            <div className="ml-10 mt-1 space-y-1">
              {renderProjects("Manual")}
            </div>
          )}
        </div>

        {/* Data Projects */}
        {/* <div>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "Data" ? null : "Data")
            }
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg
            ${selectedKey.includes("/automation") ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}
          >
            <div className="flex items-center">
              <img src={AutomationIcon} className="w-6 h-6" />
              {isOpen && <span className="ml-3">Data Projects</span>}
            </div>
            {isOpen &&
              (openDropdown === "Data" ? <FaChevronDown /> : <FaChevronRight />)}
          </button>

          {isOpen && openDropdown === "Data" && (
            <div className="ml-10 mt-1 space-y-1">
              {renderProjects("Data")}
            </div>
          )}
        </div> */}

        {/* Automation Projects */}
        {/* <div>
          <button
            onClick={() =>
              setOpenDropdown(openDropdown === "automation" ? null : "automation")
            }
            className={`flex items-center justify-between w-full px-3 py-2 rounded-lg
            ${selectedKey.includes("/automation") ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"}`}
          >
            <div className="flex items-center">
              <img src={AutomationIcon} className="w-6 h-6" />
              {isOpen && <span className="ml-3">Automation Projects</span>}
            </div>
            {isOpen &&
              (openDropdown === "automation" ? <FaChevronDown /> : <FaChevronRight />)}
          </button>

          {isOpen && openDropdown === "automation" && (
            <div className="ml-10 mt-1 space-y-1">
              {renderProjects("Automation")}
            </div>
          )}
        </div> */}

        {/* Settings */}
        <button
          onClick={() => handleClick("/Settings")}
          className={`flex items-center w-full px-3 py-2 rounded-lg transition
          ${selectedKey === "/Settings" 
            ? "bg-yellow-500 text-black shadow-md" 
            : "text-gray-300 hover:bg-gray-800 hover:text-yellow-400"}`}
        >
          <img src={SettingsIcon} className="w-6 h-6" />
          {isOpen && <span className="ml-3">Settings</span>}
        </button>

      </nav>
    </aside>
  );
}

export default Sidebar;