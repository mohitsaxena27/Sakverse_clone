import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRobot, FaChevronDown } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserDataContext } from "../../Hooks/Manual/UserDataContext";

const ProjectDetails = ({ project, onOpen }) => (
  <div className="mt-4 bg-gray-900 border border-gray-700 p-6 rounded-lg grid md:grid-cols-2 gap-6">
    <div>
      <h4 className="text-sm font-medium text-gray-300 mb-2">Project Details</h4>
      {/* <p className="text-sm text-gray-400">ID: {project.project_id}</p> */}
      <p className="text-sm text-gray-400">Type: {project.project_type}</p>
    </div>
    <div>
      <h4 className="text-sm font-medium text-gray-300 mb-2">Integrations</h4>
      {project.integration?.length ? (
        project.integration.map((intg, idx) => (
          <div key={idx} className="flex items-center text-sm text-gray-400">
            <div
              className={`w-2 h-2 rounded-full mr-2 ${intg.enabled ? 'bg-green-500' : 'bg-gray-500'}`}
            ></div>
            {intg.type}: {intg.tool} {!intg.enabled && '(Disabled)'}
          </div>
        ))
      ) : (
        <p className="text-sm text-gray-400">No integrations configured</p>
      )}
    </div>
    <div className="md:col-span-2 mt-4">
        <button
      onClick={() => onOpen(project.project_id)}
      className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors shadow-md"
    >
      Open
    </button>
    </div>

  </div>
);

const ProjectItem = ({ project, expanded, toggleExpand, onOpen }) => (
  <div className="p-6 border-b border-gray-700">
    <div
      className="flex justify-between items-center cursor-pointer"
      onClick={() => toggleExpand(project.project_id)}
    >
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-4 bg-green-500`}></div>
        <h3 className="font-semibold text-lg text-white">{project.project_name}</h3>
      </div>
      <div className="flex items-center">
        <span className="text-sm text-gray-400 mr-3">{project.role}</span>
        <FaChevronDown
          className={`transform transition-transform ${expanded ? 'rotate-180 text-blue-400' : 'text-gray-400'}`}
        />
      </div>
    </div>

    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ProjectDetails project={project} onOpen={onOpen} />
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const WelcomePage = () => {
  const { projects = [], loading, error } = useUserDataContext();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState([]);

  const manualProjects = useMemo(
    () => projects.filter((p) => p.project_type === 'Manual'),
    [projects]
  );

  const toggleExpand = (id) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleOpen = (id) => {
    const project = projects.find((p) => p.project_id === id);
    project ? navigate(`/ManualProject/${id}`) : navigate('/error/unauthorized');
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen text-white bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-xl">Loading your projects...</h1>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="text-center p-8 bg-gray-800 rounded-xl shadow-2xl">
          <h1 className="text-3xl font-bold text-red-400 mb-4">Error Loading Projects</h1>
          <p className="text-lg text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 text-white p-4 md:p-8">
      <div className="max-w-7xl mt-16 mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row items-center justify-between mb-10 p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700"
        >
          <div className="flex items-center mb-4 md:mb-0">
            <FaRobot className="text-5xl text-blue-500 mr-4" />
            <div>
              <h1 className="text-2xl font-bold">AI Test Case Generation</h1>
              <p className="text-gray-400">Streamline Your Testing Process</p>
            </div>
          </div>
          <div className="bg-blue-900/30 px-4 py-2 rounded-lg border border-blue-700">
            <p className="text-sm text-blue-300 font-medium">
             Total Project - {manualProjects.length} 
            </p>
          </div>
        </motion.header>

        {/* Projects List */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold">Projects</h2>
            <p className="text-gray-400 text-sm">Select a project to manage test cases</p>
          </div>

          {manualProjects.length > 0 ? (
            manualProjects.map((project) => (
              <ProjectItem
                key={project.project_id}
                project={project}
                expanded={expanded.includes(project.project_id)}
                toggleExpand={toggleExpand}
                onOpen={handleOpen}
              />
            ))
          ) : (
            <div className="p-6 text-center text-gray-400">
              No projects available. Create a new project to get started.
            </div>
          )}
        </motion.section>
      </div>
    </div>
  );
};

export default WelcomePage;
