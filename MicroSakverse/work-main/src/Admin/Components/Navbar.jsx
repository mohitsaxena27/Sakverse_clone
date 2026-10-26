import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faUser } from "@fortawesome/free-solid-svg-icons";
import useLogout from "../../Components/Common/logout";

const Navbar = ({ toggleSidebar }) => {
  const [showLogout, setShowLogout] = useState(false);
  const logout = useLogout();
  const logoutTimeoutRef = useRef(null);

  // -------------------------------
  // 🔹 Auto-close Logic + Hover Control
  // -------------------------------
  const handleProfileClick = () => {
    setShowLogout(!showLogout);

    if (!showLogout) {
      logoutTimeoutRef.current = setTimeout(() => {
        setShowLogout(false);
      }, 5000);
    } else {
      clearTimeout(logoutTimeoutRef.current);
    }
  };

  const handleMouseEnter = () => {
    clearTimeout(logoutTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    logoutTimeoutRef.current = setTimeout(() => {
      setShowLogout(false);
    }, 5000);
  };

  return (
    <nav className="bg-[#0A1A2F] text-white p-4 flex justify-between items-center top-0 sticky shadow-md border-b border-[#0F243D] z-10 ">
      
      <button onClick={toggleSidebar} className="md:hidden text-gray-300 hover:text-yellow-400 transition">
        <FontAwesomeIcon icon={faBars} size="lg" />
      </button>

      <div className="ml-auto flex items-center space-x-4">
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <FontAwesomeIcon
            icon={faUser}
            className="text-white cursor-pointer hover:text-yellow-400 transition"
            onClick={handleProfileClick}
          />

          {/* Logout Dropdown */}
          {showLogout && (
            <div className="absolute right-0 mt-2 bg-[#112B46] text-white border border-[#1A3554] rounded-lg shadow-lg w-44 z-50 animate-fadeIn">
              <button
                onClick={logout}
                className="w-full px-4 py-2 text-sm text-center text-red-400 hover:bg-[#15365A] transition rounded-lg"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
