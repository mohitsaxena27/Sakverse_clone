import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faChevronDown,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import useLogout from "../../Components/Common/logout";
import saksoftLogo from "../../assets/images/sakicon.png";
import { useAuthContext } from "../../Hooks/Auth/AuthContext";
import useUserData from "../../Hooks/Manual/UserData";

const Navbar = ({ toggleSidebar, onProjectSelect, username }) => {
  const [showLogout, setShowLogout] = useState(false);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const logout = useLogout();
  const { user } = useAuthContext();

  const {
    projects = [],
    loading: projectLoading,
    error: projectError,
  } = useUserData();

  useEffect(() => {
    if (!projects || projects.length === 0) {
      setSelectedProject(null);
      onProjectSelect?.(null);
      return;
    }

    if (projects.length === 1) {
      setSelectedProject(projects[0]);
      onProjectSelect?.(projects[0].project_id);
    } else {
      setSelectedProject(null);
      onProjectSelect?.(null);
    }
  }, [projects, onProjectSelect]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setProjectDropdownOpen(false);
    onProjectSelect?.(project.project_id);
  };

  const getProjectDisplayName = () => {
    if (projectLoading) return "Loading...";
    if (projects.length === 0) return "No projects";
    if (!selectedProject) return "Select Project";
    return (
      selectedProject.project_name ||
      `Project ${selectedProject.project_id}`
    );
  };

  return (
    <nav className="bg-sky-800 text-white px-4 py-3 flex flex-wrap items-center justify-between sticky top-0 z-50">
      
      {/* LEFT SECTION */}
      <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">

        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <img
            src={saksoftLogo}
            alt="Saksoft Logo"
            className="h-8 sm:h-9"
          />

          <div>
            <h1 className="text-sm sm:text-lg font-semibold text-yellow-400">
              Intelligent BA Agent
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-100">
              Features | Documentation | UserStories
            </p>
          </div>
        </div>

        {/* PROJECT DROPDOWN */}
        <div className="w-full sm:w-auto">
          {projectLoading ? (
            <div className="text-sm text-gray-300 mt-2 sm:mt-0">
              Loading projects...
            </div>
          ) : projects.length > 0 ? (
            <div className="relative mt-2 sm:mt-0">
              <button
                onClick={() =>
                  setProjectDropdownOpen(!projectDropdownOpen)
                }
                className={`flex items-center justify-between w-full sm:w-64 md:w-80 px-4 py-2 text-sm rounded-lg transition ${
                  selectedProject
                    ? "bg-cyan-600/20 border border-cyan-500/30 text-cyan-300"
                    : "bg-gray-800 border border-gray-700 hover:border-cyan-500/30"
                }`}
              >
                <span className="truncate font-medium">
                  {getProjectDisplayName().toUpperCase()}
                </span>

                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`ml-2 text-xs transition-transform ${
                    projectDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {projectDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProjectDropdownOpen(false)}
                  />

                  <div className="absolute left-0 mt-2 w-full sm:w-64 md:w-80 z-50">
                    <ul className="bg-sky-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      <li className="px-4 py-2 text-xs text-gray-100 border-b border-gray-800">
                        Your Projects ({projects.length})
                      </li>

                      {projects.map((project) => (
                        <li
                          key={project.project_id}
                          onClick={() => handleProjectSelect(project)}
                          className={`flex justify-between px-4 py-3 text-sm cursor-pointer hover:bg-sky-700 ${
                            selectedProject?.project_id ===
                            project.project_id
                              ? "bg-cyan-600/20 text-cyan-300"
                              : "text-gray-300"
                          }`}
                        >
                          <span className="truncate">
                            {project.project_name?.toUpperCase() ||
                              `Project ${project.project_id}`}
                          </span>
                          <span className="text-xs text-gray-400">
                            #{project.project_id}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-900/20 border border-red-800/30 rounded-lg mt-2 sm:mt-0">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-red-400 text-xs"
              />
              <span className="text-xs text-red-300">
                No projects available
              </span>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT SECTION */}
      <div className="ml-auto relative mt-2 md:mt-0">
        <button
          onClick={() => setShowLogout(!showLogout)}
          className="flex items-center space-x-2 hover:bg-gray-800 rounded-lg p-2 transition"
        >
          <FontAwesomeIcon icon={faUser} className="text-lg" />
        </button>

        {showLogout && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowLogout(false)}
            />

            <div className="absolute right-0 mt-2 w-44 z-50">
              <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <p className="text-xs text-gray-400">
                    Signed in as
                  </p>
                  <p className="text-sm truncate">
                    {username}
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="w-full text-left text-sm py-3 px-4 hover:bg-red-600/10 text-red-400"
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;