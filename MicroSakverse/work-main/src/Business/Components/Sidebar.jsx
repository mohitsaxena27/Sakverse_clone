import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faUsers,
  faLightbulb,
  faGear,
} from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";

const Sidebar = ({ isOpen, closeSidebar }) => {
  return (
    <aside
      className={`pt-8 bg-blue-950 text-white w-16 md:w-20 p-4 fixed top-0 left-0 h-full shadow-lg z-40 transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "-translate-x-64"
      } md:translate-x-0`}
    >
      {/* Close (Mobile only) */}
      <button
        className="absolute top-4 right-4 text-gray-400 hover:text-white md:hidden"
        onClick={closeSidebar}
      >
        <FontAwesomeIcon icon={faTimes} size="lg" />
      </button>

      {/* Navigation */}
      <ul className="flex flex-col items-center gap-8 mt-10">
        <li className="group relative">
          <NavLink
            to="/Business"
            className={({ isActive }) =>
              `text-xl p-3 rounded-lg hover:bg-gray-800 transition ${
                isActive ? "bg-gray-800 text-blue-400" : "bg-gray-800 text-blue-400"
              }`
            }
          >
            <FontAwesomeIcon icon={faLightbulb} />
          </NavLink>
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
            Ideation
          </span>
        </li>

        {/* Add more icons below
        <li className="group relative">
          <NavLink
            to="/Business/Team"
            className={({ isActive }) =>
              `text-xl p-3 rounded-lg hover:bg-gray-800 transition ${
                isActive ? "bg-gray-800 text-blue-400" : ""
              }`
            }
          >
            <FontAwesomeIcon icon={faUsers} />
          </NavLink>
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
            Team
          </span>
        </li> */}

        {/* <li className="group relative">
          <NavLink
            to="/Business/Settings"
            className={({ isActive }) =>
              `text-xl p-3 rounded-lg hover:bg-gray-800 transition ${
                isActive ? "bg-gray-800 text-blue-400" : ""
              }`
            }
          >
            <FontAwesomeIcon icon={faGear} />
          </NavLink>
          <span className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-xs text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
            Settings
          </span>
        </li> */}
      </ul>
    </aside>
  );
};

export default Sidebar;
