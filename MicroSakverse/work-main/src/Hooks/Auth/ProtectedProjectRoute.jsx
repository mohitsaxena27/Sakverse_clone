import React from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthContext } from "./AuthContext";
import ErrorPage from "../../Components/Error";

const ProtectedProjectRoute = ({ children, paramType = "params" }) => {
  const { authInfo, loading } = useAuthContext();

  const params = useParams();
  const [searchParams] = useSearchParams();

  const projectId =
    paramType === "query"
      ? searchParams.get("projectId")
      : params.projectId;

  if (loading) {
    return <div>Checking access...</div>;
  }

if (!projectId) {
  console.warn("No projectId in URL");
  return children; // allow rendering for now
}


  const allowedProjects = authInfo?.allowedProjects || [];
  const id = parseInt(projectId, 10);
  const hasAccess = allowedProjects.includes(id);

  if (!hasAccess) {
    return (
      <ErrorPage
        error={new Error("You are not authorized to access this project")}
        id={403}
      />
    );
  }

  return children;
};

export default ProtectedProjectRoute;
