import React, { useState, useRef, useEffect } from "react";
import { Typewriter } from "react-simple-typewriter";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import styled, { keyframes } from "styled-components";
import Logo from "../../assets/images/saksoft_logo.png";
import { useAuthContext } from "../../Hooks/Auth/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";

// Background Animation
const BackgroundAnimation = keyframes`
  0% { transform: translateY(0); opacity: 0.6; }
  50% { transform: translateY(-20px); opacity: 0.8; }
  100% { transform: translateY(0); opacity: 0.6; }
`;

const AnimatedBackground = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 100% 50%, rgba(0, 107, 139, 0.52), transparent);
  animation: expandingCircle 6s infinite ease-in-out;
  z-index: 0;

  @keyframes expandingCircle {
    0% { background-size: 100%; }
    50% { background-size: 150%; }
    100% { background-size: 100%; }
  }
`;

function Login() {
  const [username, setUsername] = useState("");
  const passwordRef = useRef();
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error, isAuthenticated, authInfo } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    document.title = "SAKSOFT AI SDLC PLATFORM";
  }, []);

  useEffect(() => {
    if (isAuthenticated && location.pathname === "/login") {
      navigate(authInfo?.role === "admin" ? "/Admin/Projects" : "/", { replace: true });
    }
  }, [isAuthenticated, authInfo, navigate, location]);

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const password = passwordRef.current.value;
    await login(username, password);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      if (e.target.placeholder === "Username") {
        document.getElementById("password").focus();
      } else {
        handleSubmit(e);
      }
    }
  };

  return (
    <section className="relative flex flex-col lg:flex-row items-center justify-center min-h-screen bg-gray-950 p-6 overflow-hidden">
      <AnimatedBackground />

      {/* Left Section */}
      <div className="flex flex-col items-center lg:items-start text-center lg:text-left text-white lg:w-1/2 px-6">
        <img src={Logo} alt="Saksoft Logo" className="w-[60vw] md:w-[380px] mb-8 drop-shadow-lg" />
        <p className="text-emerald-400 font-bold uppercase text-sm md:text-base">
          SAKSOFT AI SDLC PLATFORM
        </p>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mt-2">Transforming Software Delivery</h1>
        <div className="mt-4 flex text-lg md:text-2xl font-bold">
          <p className="mr-2">Accelerate every SDLC stage with</p>
          <Typewriter words={["AI-Powered Product Design","Intelligent Code Engineering","Continuous Quality Automation","Predictive Release Intelligence","Faster Production Delivery"]} loop={0} cursor={true} typeSpeed={100} />
        </div>
        <p className="mt-4 text-gray-400 text-sm md:text-lg">
          Bring product design, engineering, testing, and release workflows into one unified AI-powered platform that helps teams build smarter, ship faster, and scale confidently.
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-lg bg-gray-900 p-8 md:p-10 rounded-2xl shadow-lg mt-8 lg:mt-0 lg:ml-16 relative z-10">
        <form className="space-y-6" onSubmit={handleSubmit} autoComplete="off">
          <h1 className="flex text-white justify-center text-xl font-semibold">Log in to Continue</h1>

          {/* Username Field */}
          <div className="relative bg-gray-800 rounded-xl shadow-inner p-2">
            <input
              type="text"
              id="username"
              autoComplete="username"
              className="w-full p-4 bg-transparent text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none shadow-lg"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
              required
            />
          </div>

          {/* Password Field */}
          <div className="relative bg-gray-800 rounded-xl shadow-inner p-2">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="new-password"
              ref={passwordRef}
              className="w-full p-4 bg-transparent text-white rounded-xl focus:ring-2 focus:ring-orange-500 outline-none shadow-lg"
              placeholder="Password"
              onKeyPress={handleKeyPress}
              disabled={loading}
              required
            />
            <span
              className="absolute inset-y-0 right-4 flex items-center cursor-pointer"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
            </span>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-orange-500 text-white font-semibold tracking-wide hover:bg-orange-600 transition duration-200 shadow-lg transform hover:scale-105"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;
