import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Add useNavigate and useLocation
import Stories from './userStories/userStories';
import TextArea from './textArea/textArea';
import Content from './content/content';
import { useUserDataContext } from "../../Hooks/Manual/UserDataContext";
import { useUserStoriesData , useFetchData } from './useFetchData';
import Charts from './widgets/allCharts';
import RequirementTable from './widgets/RequirementTable';
import Home from './Home/Home';
import Suite from './Suite/index.jsx';
import { ToastContainer } from 'react-toastify';
import Footer from './footer';
import { useAuthContext } from '../../Hooks/Auth/AuthContext';

const Index = ({ showSuite = false }) => { // Accept showSuite prop from route
  const { projectId } = useParams();
  const navigate = useNavigate(); // Add navigate
  const location = useLocation(); // Add location to check current path
  const { authInfo, loading: authLoading } = useAuthContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  
  // Initialize showSuite from prop or from URL path
  const [showSuiteState, setShowSuiteState] = useState(() => {
    // Check if we're on the testsuite route
    return location.pathname.includes('/testsuite/') || showSuite;
  });
  
  const { projects, loading, error } = useUserDataContext();
  const { userStories, loading: storiesLoading, refetch } = useUserStoriesData(projectId);
  const { data: content, GetUpdate  } = useFetchData( selectedStory?.id ,projectId);
  const [reloadContent, setReloadContent] = useState(false);

  const APIRELOAD = () => {
    refetch();
    GetUpdate();
    setReloadContent(prev => !prev);
  };

  const UpdateGetUpdate = () => {
    GetUpdate();
  }

  const linked = projects.find(p => p.project_id === Number(projectId))?.linked

  const currentProject = projects.find(
    (project) => project.project_id === Number(projectId)
  );
  const User = authInfo.displayName;

  const isStoryCompleted = selectedStory?.stage === 4 && selectedStory?.status?.toLowerCase() === 'completed';

  const LLM = currentProject?.integration.find(
    (item) => item.type === 'LLM'
  );
  const TM = currentProject?.integration.find(
    (item) => item.type === 'TM'
  );
  const PM = currentProject?.integration.find(
    (item) => item.type === 'PM'
  );

  const pmCustomId = currentProject?.integration?.find(i => i.type === "PM")?.config?.customid;
  const tmCustomId = currentProject?.integration?.find(i => i.type === "TM")?.config?.customid;

  const isLLMConnected = LLM?.enabled === true;
  const isTMConnected = TM?.enabled === true;
  const isPMConnected = PM?.enabled === true; 
  const TMTool = TM?.tool || '';
  const PMTool = PM?.tool || '';

  // Handler to open Suite page with URL update
  const handleOpenSuite = () => {
    setShowSuiteState(true);
    // Navigate to the testsuite route
    navigate(`/ManualProject/testsuite/${projectId}`);
  };

  // Handler to close Suite page with URL update
  const handleCloseSuite = () => {
    setShowSuiteState(false);
    // Navigate back to the main manual project page
    navigate(`/ManualProject/${projectId}`);
  };

  // Sync showSuite prop with state
  useEffect(() => {
    const isSuiteRoute = location.pathname.includes('/testsuite/');
    if (isSuiteRoute !== showSuiteState) {
      setShowSuiteState(isSuiteRoute);
    }
  }, [location.pathname, showSuiteState]);

  useEffect(() => {
    if (currentProject) {
      const pmIntegration = currentProject.integration.find(
        (item) => item.type === 'PM'
      );

      const toolName = pmIntegration?.tool || '';

      document.title = currentProject.linked
        ? `SAKSOFT AI SDLC Platform${toolName ? ` (${toolName})` : ''}`
        : 'SAKSOFT AI SDLC Platform';
    }
  }, [currentProject]);

  // Sync selectedStory with latest userStories
  useEffect(() => {
    if (!selectedStory || userStories.length === 0) return;

    const updated = userStories.find((story) => story._id === selectedStory.id);
    if (updated) {
      const updatedPayload = {
        id: updated._id,
        detail: updated.detail || '',
        referenceKey: updated.reference_key,
        status: updated.status,
        stage: updated.stage || '',
        created: updated.created || '',
        updated: updated.updated || '',
      };

      const fieldsChanged =
        selectedStory.detail !== updatedPayload.detail ||
        selectedStory.referenceKey !== updatedPayload.referenceKey ||
        selectedStory.status !== updatedPayload.status ||
        selectedStory.stage !== updatedPayload.stage ||
        selectedStory.created !== updatedPayload.created ||
        selectedStory.updated !== updatedPayload.updated;

      if (fieldsChanged) {
        setSelectedStory(updatedPayload);
      }
    }
  }, [userStories, selectedStory?.id, projectId]);

  const handleStorySelect = (story) => {
    setSelectedStory(story);
    // If suite is open, close it when selecting a story
    if (showSuiteState) {
      handleCloseSuite();
    }
  };

  const clearSelectedStory = () => {
    setSelectedStory(null);
    // If suite is open, close it when going home
    if (showSuiteState) {
      handleCloseSuite();
    }
    localStorage.removeItem(`selectedStory_${projectId}`);
  };

  const handleReloadContent = () => {
    setReloadContent((prev) => !prev);
    refetch();
  };

  const handleReloadStories = () => {
    refetch();
  };

  useEffect(() => {
    setSelectedStory(null);
    // Only close suite if we're changing projects and not on suite route
    if (!location.pathname.includes('/testsuite/')) {
      setShowSuiteState(false);
    }
  }, [projectId]);

  if (loading || storiesLoading) return <div>Loading project data...</div>;
  if (error) return <div>Error loading projects: {error}</div>;

  return (
    <div className="flex flex-col h-screen ">
      <ToastContainer />
      
      {/* Main Content Area - Takes remaining height */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
    <div
  className={`h-[calc(100%-5rem)] mt-[4rem] transition-all duration-300 ease-in-out overflow-hidden ${
    sidebarOpen ? 'w-[14rem]' : 'w-0'
  }`}
>
          {sidebarOpen && (
            <Stories
              userStories={userStories}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              setSelectedStory={handleStorySelect}
              currentProject={currentProject}
              projectId={projectId}
            />
          )}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TextArea - Fixed at top */}
          <div className="flex-shrink-0 mt-[4.5rem]">
            <TextArea
              onStorySubmit={handleReloadStories}
              selectedStoryId={selectedStory?.id}
              selectedStoryDetails={selectedStory?.detail}
              selectedReferenceKey={selectedStory?.referenceKey}
              selectedstatus={selectedStory?.status}
              selectedstage={selectedStory?.stage}
              selectedcreated={selectedStory?.created}
              selectedupdated={selectedStory?.updated}
              setSidebarOpen={setSidebarOpen}
              projectId={projectId}
              clearSelectedStory={clearSelectedStory}
              isStoryCompleted={isStoryCompleted}
              isPMConnected={isPMConnected}
              isLLMConnected={isLLMConnected}
              TMTool={TMTool}
              PMTool={PMTool}
              onReloadAll={APIRELOAD} 
              pmCustomId={pmCustomId}
              onSuiteClick={handleOpenSuite}
              isSuiteOpen={showSuiteState} // Pass the suite state
            />
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto  pb-0">
            {showSuiteState ? (
              <Suite 
                onClose={handleCloseSuite}
                projectId={projectId}
                User={User}
              />
            ) : (
              <>
                {!selectedStory ? (
                  <Home
                    projectId={projectId}
                    setSelectedStory={handleStorySelect}
                    userStories={userStories}
                    currentProject={currentProject}
                  />
                ) : (
                  <div className="pt-2 pb-10 bg-blue-50">
                    {selectedStory.status === 'Completed' && (
                      <>
                        <Charts
                          projectId={projectId}
                          selectedStoryId={selectedStory.id}
                        />
                        <RequirementTable
                          projectId={projectId}
                          selectedStoryId={selectedStory.id}
                        />
                      </>
                    )}
                   <Content
                      selectedStoryId={selectedStory?.id || null}
                      selectedStoryDetails={selectedStory?.detail || null}
                      selectedReferenceKey={selectedStory?.referenceKey || null}
                      selectedStatus={selectedStory?.status || null}
                      selectedstage={selectedStory?.stage || null}
                      projectId={projectId}
                      isTMConnected={isTMConnected}
                      isPMConnected={isPMConnected}
                      TMTool={TMTool}
                      onReloadAll={APIRELOAD} 
                      UpdateGetUpdate={UpdateGetUpdate}
                      key={selectedStory?.id || 'empty'}
                      data={content}
                      linkedStatus={linked}
                      onReloadStories={handleReloadStories}
                      tmCustomId={tmCustomId}
                    />
                   
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <Footer />
    </div>
  );
};

export default Index;