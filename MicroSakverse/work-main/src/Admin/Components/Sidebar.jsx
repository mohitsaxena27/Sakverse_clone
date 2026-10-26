import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faTimes,
  faUsers,
  faDiagramProject,
  faHouse,
  faClipboardList,
  faScroll,
  faPersonCirclePlus,
  faFolderTree,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, closeSidebar }) => {
  return (
    <aside
      className={`bg-[#0A1A2F] text-white w-56 p-5 fixed left-0 h-full shadow-xl 
      transition-transform transform z-50
      ${isOpen ? "translate-x-0" : "-translate-x-64"}
      md:translate-x-0`}
    >
      {/* Close Button - Visible only on Mobile */}
      <button
        className="absolute top-4 right-4 md:hidden text-gray-300 hover:text-yellow-400 transition"
        onClick={closeSidebar}
      >
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>

      <h2 className="text-lg font-bold text-yellow-400 tracking-wide">
        Sakverse Admin
      </h2>

      <ul className="mt-6 space-y-2">

        {/* <li>
          <NavLink
            to="/Admin"
            className="p-2 flex items-center gap-2 rounded bg-gray-700" // force active style
          >
            <FontAwesomeIcon icon={faHouse} /> Dashboard
          </NavLink>
        </li> */}

        <li>
          <NavLink
            to="/Admin/Projects"
            className={({ isActive }) =>
              `p-3 flex items-center gap-3 rounded-lg border-l-4 transition-all ${
                isActive
                  ? "bg-[#112B46] border-yellow-400 text-yellow-300"
                  : "border-transparent hover:bg-[#15365A]"
              }`
            }
          >
            <FontAwesomeIcon icon={faDiagramProject} /> Projects
          </NavLink>
        </li>

        <li>
          <NavLink
            to="/Admin/Users"
            className={({ isActive }) =>
              `p-3 flex items-center gap-3 rounded-lg border-l-4 transition-all ${
                isActive
                  ? "bg-[#112B46] border-yellow-400 text-yellow-300"
                  : "border-transparent hover:bg-[#15365A]"
              }`
            }
          >
            <FontAwesomeIcon icon={faUsers} /> Users
          </NavLink>
        </li>

        {/* <li>
          <NavLink
            to="/Admin/Audit"
            className={({ isActive }) =>
              `p-3 flex items-center gap-3 rounded-lg border-l-4 transition-all ${
                isActive
                  ? "bg-[#112B46] border-yellow-400 text-yellow-300"
                  : "border-transparent hover:bg-[#15365A]"
              }`
            }
          >
            <FontAwesomeIcon icon={faScroll} /> Integration 
          </NavLink>
        </li> */}

        {/* <li>
          <NavLink
            to="/Admin/Audit"
            className={({ isActive }) =>
              `p-3 flex items-center gap-3 rounded-lg border-l-4 transition-all ${
                isActive
                  ? "bg-[#112B46] border-yellow-400 text-yellow-300"
                  : "border-transparent hover:bg-[#15365A]"
              }`
            }
          >
            <FontAwesomeIcon icon={faScroll} /> Audit Logs
          </NavLink>
        </li> */}

        {/* <li>
          <NavLink
            to="/Admin/Onboarding"
            className={({ isActive }) =>
              `p-3 flex items-center gap-3 rounded-lg border-l-4 transition-all ${
                isActive
                  ? "bg-[#112B46] border-yellow-400 text-yellow-300"
                  : "border-transparent hover:bg-[#15365A]"
              }`
            }
          >
            <FontAwesomeIcon icon={faPersonCirclePlus} /> Onboarding
          </NavLink>
        </li> */}

        {/* <li>
          <NavLink
            to="/Admin/Directory"
            className={({ isActive }) =>
              `p-3 flex items-center gap-3 rounded-lg border-l-4 transition-all ${
                isActive
                  ? "bg-[#112B46] border-yellow-400 text-yellow-300"
                  : "border-transparent hover:bg-[#15365A]"
              }`
            }
          >
            <FontAwesomeIcon icon={faFolderTree} /> Directory
          </NavLink>
        </li> */}

      </ul>
    </aside>
  );
};

export default Sidebar;
