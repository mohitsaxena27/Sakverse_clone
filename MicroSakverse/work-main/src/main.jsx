import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./Hooks/Auth/AuthContext.jsx";
import ErrorPage from "./Components/Error/index.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </BrowserRouter>
);
