  import React, { useMemo, useState, useEffect } from "react";
  import {
    Folder,
    Search,
    Plus,
    LayoutGrid,
    Table,
    ChevronRight,
    CheckCircle,
    XCircle,
    Users,
  } from "lucide-react";
  import { Link, useNavigate } from "react-router-dom";
  import useUserData from "../../../Hooks/Manual/UserData";

  const ProjectList = () => {
    const navigate = useNavigate();
    const { projects = [], loading } = useUserData();

    const [search, setSearch] = useState("");
    const [view, setView] = useState("grid");

    /* ---------------- PAGINATION ---------------- */

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9;

    /* ---------------- FILTER + SORT ---------------- */

    const filteredProjects = useMemo(() => {
      return [...projects]
        .filter((p) =>
          p.project_name?.toLowerCase().includes(search.toLowerCase())
        )
        .sort((a, b) => Number(a.project_id) - Number(b.project_id));
    }, [projects, search]);

    /* Reset to page 1 when search changes */
    useEffect(() => {
      setCurrentPage(1);
    }, [search]);

    const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

    const paginatedProjects = useMemo(() => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredProjects.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredProjects, currentPage]);

    const getProjectTypeColor = (type) => {
      const colors = {
        PM: "bg-purple-100 text-purple-700",
        TM: "bg-blue-100 text-blue-700",
        KM: "bg-green-100 text-green-700",
        LLM: "bg-orange-100 text-orange-700",
      };
      return colors[type] || "bg-gray-100 text-gray-700";
    };

    return (
      <div className="min-h-screen bg-gray-50 p-6 md:p-10">
        <div className="max-w-screen-xl mx-auto">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Project Management
              </h1>
              <p className="text-sm text-gray-500">
                View and manage your projects
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              {/* VIEW TOGGLE */}
              <div className="flex bg-white border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setView("grid")}
                  className={`px-4 py-2 text-sm rounded-md ${
                    view === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>

                <button
                  onClick={() => setView("table")}
                  className={`px-4 py-2 text-sm rounded-md ${
                    view === "table"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Table size={16} />
                </button>
              </div>

              {/* CREATE PROJECT */}
              <button
                onClick={() => navigate("/Admin/ProjectsOnboarding")}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
              >
                <Plus size={16} />
                New Project
              </button>
            </div>
          </div>

          {/* SEARCH */}
          <div className="relative max-w-md mb-6">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <h1 className="text-xs text-gray-500 mx-2 my-2">
            {filteredProjects.length} projects found
          </h1>

          {/* LOADING */}
          {loading && (
            <div className="flex justify-center py-20">
              <div className="h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          )}

          {/* GRID VIEW */}
          {!loading && view === "grid" && (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedProjects.map((project) => (
                <Link
                  key={project.project_id}
                  to={`/Admin/Projects/${project.project_id}`}
                  className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Folder size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {project.project_name}
                        </h2>
                        <p className="text-xs text-gray-400">
                          ID: #{project.project_id}
                        </p>
                      </div>
                    </div>

                    {project.linked ? (
                      <CheckCircle size={18} className="text-green-600" />
                    ) : (
                      <XCircle size={18} className="text-red-500" />
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Type</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectTypeColor(
                          project.project_type
                        )}`}
                      >
                        {project.project_type}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-500">Role</span>
                      <span className="flex items-center gap-1 text-gray-700">
                        <Users size={13} className="text-gray-400" />
                        {project.role}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 text-right text-xs text-blue-600 flex items-center justify-end gap-1">
                    View Details <ChevronRight size={12} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* TABLE VIEW */}
          {!loading && view === "table" && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-900 text-white">
                  <tr>
                    <th className="p-4 text-left">Project</th>
                    <th className="p-4 text-center">Type</th>
                    <th className="p-4 text-center">Role</th>
                    <th className="p-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProjects.map((project, index) => (
                    <tr
                      key={project.project_id}
                      onClick={() =>
                        navigate(`/Admin/Projects/${project.project_id}`)
                      }
                      className={`cursor-pointer border-b border-gray-200 transition ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-blue-50`}
                    >
                      <td className="p-4 font-medium text-gray-900">
                        {project.project_name}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectTypeColor(
                            project.project_type
                          )}`}
                        >
                          {project.project_type}
                        </span>
                      </td>

                      <td className="p-4 text-center text-gray-600">
                        {project.role}
                      </td>

                      <td className="p-4 text-center">
                        {project.linked ? (
                          <span className="text-green-600 text-xs font-semibold">
                            Linked
                          </span>
                        ) : (
                          <span className="text-red-500 text-xs font-semibold">
                            Unlinked
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded-md bg-white disabled:opacity-50"
              >
                Previous
              </button>

              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-md border ${
                      currentPage === page
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded-md bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}

          {/* EMPTY */}
          {!loading && filteredProjects.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              No projects found.
            </div>
          )}
        </div>
      </div>
    );
  };

  export default ProjectList;