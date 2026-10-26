import { Routes, Route, Navigate, useLocation } from "react-router-dom";

import Dashboard from "../Pages/Dashboard";
import Settings from "../Pages/Settings";
import Login from "../Pages/Auth/Login";
import Automation from "../Pages/Automation";
import Suite from "../Pages/ManualProject/Suite/index";
import ManualProject from "../Pages/ManualProject";
import TDM from "../Pages/TDM";
import TestCasePage from "../Pages/ManualProject/testcase/testcase";
import Admin from "../Admin";
import ErrorPage from "../Components/Error";
import SakVerseDocumentation from "../Components/AppHeader/Documentation";

import MainLayout from "../layouts/MainLayout";
import ProtectedProjectRoute from "../Hooks/Auth/ProtectedProjectRoute";
import { useAuthContext } from "../Hooks/Auth/AuthContext";

const AppRoutes = () => {
  const { isAuthenticated, authInfo, loading } = useAuthContext();
  const location = useLocation();

  const isAdmin = authInfo?.role === 1;

  if (loading) {
    return <div>Loading authentication...</div>;
  }

  return (
    <Routes>
      {/* 🔹 Login */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={isAdmin ? "/admin" : "/"} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* 🔹 Authenticated Routes */}
      {isAuthenticated ? (
        <>
          {/* 🔹 Routes with Layout */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documentation" element={<SakVerseDocumentation />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/testcase" element={<TestCasePage />} />

            <Route
              path="/ManualProject/:projectId"
              element={
                <ProtectedProjectRoute paramType="params">
                  <ManualProject />
                </ProtectedProjectRoute>
              }
            />
<Route
  path="/ManualProject/testsuite/:projectId"
  element={
    <ProtectedProjectRoute paramType="params">
      <ManualProject showSuite={true} />
    </ProtectedProjectRoute>
  }
/>
          </Route>

          {/* 🔹 Routes without Layout */}
          <Route
            path="/automation"
            element={
              <ProtectedProjectRoute paramType="query">
                <Automation />
              </ProtectedProjectRoute>
            }
          />
            <Route
            path="/testDataManagement"
            element={
              <ProtectedProjectRoute paramType="query">
                <TDM />
              </ProtectedProjectRoute>
            }
          />

          {/* 🔹 Admin Routes */}
          {isAdmin ? (
            <Route path="/admin/*" element={<Admin />} />
          ) : (
            <Route
              path="/admin/*"
              element={<Navigate to="/login" replace state={{ from: location }} />}
            />
          )}
        </>
      ) : (
        <Route
          path="*"
          element={<Navigate to="/login" replace state={{ from: location }} />}
        />
      )}

      {/* 🔹 404 */}
      <Route
        path="*"
        element={<ErrorPage error={new Error("Page Not Found")} id={404} />}
      />
    </Routes>
  );
};

export default AppRoutes;
