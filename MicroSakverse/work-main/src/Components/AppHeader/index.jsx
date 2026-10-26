import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaBars, FaUser } from "react-icons/fa";
import saksoftLogo from "../../assets/images/sakicon.png";
import useLogout from "../Common/logout";

function Navbar({ onToggleSidebar }) {
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = useLogout();
  const logoutTimeoutRef = useRef(null);

  const goToHome = () => {
    window.location.reload();
  };

  // ✅ NEW: check route
  const isTCG = location.pathname.includes("/ManualProject/2");

  // ✅ NEW: dynamic title
  const mainTitle = isTCG
    ? "Intelligent Test Case Generator"
    : "SAK AI";

  const subTitle = isTCG
    ? "Queries | UserStory | Test Cases"
    : "AI Powered SDLC Platform";

  useEffect(() => {
    document.title = mainTitle;
  }, [mainTitle]);

  const handleProfileClick = () => {
    setShowLogout(!showLogout);

    if (!showLogout) {
      logoutTimeoutRef.current = setTimeout(() => {
        setShowLogout(false);
      }, 4000);
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
    }, 4000);
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-[#0f172a] text-white shadow-lg z-50 border-b border-yellow-600/20">
      <div className="flex items-center justify-between px-6 py-3">

        {/* LEFT */}
        <div className="flex items-center gap-4 shadow-2xl ">
          <button
            className="p-2 text-gray-300 hover:text-yellow-500 transition"
            onClick={onToggleSidebar}
          >
            <FaBars className="h-6 w-6" />
          </button>

          <img
            src={saksoftLogo}
            alt="Saksoft Logo"
            className="h-9 cursor-pointer hover:scale-105 transition "
            onClick={goToHome}
          />

          <div>
            {/* ✅ UPDATED */}
            <h1 className="text-lg font-semibold text-yellow-400">
              {mainTitle}
            </h1>

            {/* ✅ UPDATED */}
            <p className="text-xs text-gray-100">
              {subTitle}
            </p>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-6">

          <button
            onClick={() => navigate("/Documentation")}
            className="text-sm px-4 py-1.5 border border-yellow-500 text-yellow-400 rounded-md 
                       hover:bg-yellow-500 hover:text-black transition duration-300"
          >
            Documentation
          </button>

          <span className="text-sm text-gray-300">
            {sessionStorage.getItem("username")}
          </span>

          {/* PROFILE */}
          <div className="relative">
            <FaUser
              className="text-gray-300 cursor-pointer hover:text-yellow-500 transition"
              onClick={handleProfileClick}
            />

            {showLogout && (
              <div
                className="absolute right-0 mt-3 w-40 bg-[#1e293b] border border-gray-700 
                           rounded-lg shadow-xl overflow-hidden animate-fadeIn"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-left text-red-400 
                             hover:bg-gray-700 transition"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;