import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faRedo, faBars, faHome, faIdCard, faCalendar,
  faComments, faFileAlt, faProjectDiagram, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import showToast from '../../../items/ToastMessage/toastUtil';
import StoryModal from './StoryModal';
import twoStep from './twoStep.jsx';
import DownloadExcel from '../download/DownloadExcel';
// import useUserData from '../../../Hooks/Manual/UserData.js';'
import ChatSession from './sakpilot/chatsession.jsx'
import GenerateDoc from './sakpilot/generateDoc.jsx'
import ImportAnalysis from './sakpilot/impactAnalysis.jsx'
import { useAutomationFlow } from '../../../Hooks/Automation/Automation.js';


import { useUserDataContext } from "../../../Hooks/Manual/UserDataContext";
import DetailModal from './DetailModal';

const API_BASE = `/sakverse`;

const TextArea = ({
  onStorySubmit, selectedStoryId, selectedStoryDetails, selectedReferenceKey,
  setSidebarOpen, projectId, onReloadData, clearSelectedStory, selectedcreated,
  selectedupdated, isLLMConnected, onReloadAll, selectedstatus, selectedstage,
  isStoryCompleted, TMTool, isPMConnected, PMTool, pmCustomId,
  onSuiteClick, isSuiteOpen // New prop to check if suite is open
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [jiraData, setJiraData] = useState(null);
  const { projects } = useUserDataContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDocOpen, setIsDocOpen] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const { executeSuiteParallel } = useAutomationFlow();


  const [suiteMessage, setSuiteMessage] =
    useState('');

  // console.log(pmCustomId, "Received PM Custom ID in TextArea");

  const handleAddStoryClick = async () => {
    if (!isLLMConnected) return showToast('LLM is not connected', 'error');
    setIsModalOpen(true);

    if (!isPMConnected) return setJiraData(null);

    try {
      const res = await fetch(`${API_BASE}/project/externalstories/${projectId}`, {
        method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }
      });
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      setJiraData(await res.json());
    } catch (err) {
      console.error(err);
      showToast('Failed to load stories', 'error');
    }
  };

  const displayUserStoryId = selectedReferenceKey
    ? `External ID - ${selectedReferenceKey}`
    : selectedStoryId
      ? `User Story ID - ${selectedStoryId}`
      : '';

  const formatDateTime = iso => iso ? new Date(iso).toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }) : '';


  const ModalComponent = Number(pmCustomId) === 2 ? twoStep : StoryModal;

  // Handle Suite button click - opens Suite page in parent
  const handleSuiteClick = () => {
    if (onSuiteClick) {
      onSuiteClick(); // Call parent's handler to open Suite page
    } else {
      showToast('Suite page is not available', 'error');
    }
  };

  const loginAndGetToken = async () => {
    try {
      const body = new URLSearchParams({
        grant_type: "",
        username: "Ashwani",
        password: "Ashwan1@Sakpilot",
        scope: "",
        client_id: "",
        client_secret: ""
      });

      const response = await fetch(
        "https://dev-api-aiplatform.saksoftgroup.com/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body
        }
      );

      const data = await response.json();

      const token = data?.access_token; // adjust if needed

      console.log("AUTH TOKEN:", token);

      setAuthToken(token); // ✅ store token

      return token;
    } catch (error) {
      console.error("Login API error:", error);
    }
  };

  /** Sub-components for cleaner JSX **/
  const StoryIdButton = () => displayUserStoryId && !isSuiteOpen && (
    <button
      onClick={() => setIsDetailsModalOpen(true)}
      className="flex items-center text-md text-blue-700 hover:text-blue-500 font-medium"
      title="View Original User Story"
    >
      <FontAwesomeIcon icon={faIdCard} className="mr-1" size="xs" />
      {displayUserStoryId}
    </button>
  );

  const DateBadges = () => (selectedStoryId && selectedcreated && selectedupdated && !isSuiteOpen) && (
    <div className="flex flex-wrap justify-center gap-2 mb-3 sm:mb-0">
      <div className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
        <FontAwesomeIcon icon={faCalendar} className="mr-1" size="xs" />
        <span className="font-medium">Started:</span> <span className="ml-1">{formatDateTime(selectedcreated)}</span>
      </div>
      <div className="flex items-center text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
        <FontAwesomeIcon icon={faCalendar} className="mr-1" size="xs" />
        <span className="font-medium">Updated:</span> <span className="ml-1">{formatDateTime(selectedupdated)}</span>
      </div>
    </div>
  );

  const ActionButtons = () => {
    // If Suite is open, only show the Home button
    if (isSuiteOpen) {
      return (
        <div className="flex items-center space-x-2">
          <button
            onClick={clearSelectedStory}
            className="p-2 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
            title="Go to Home"
          >
            <FontAwesomeIcon icon={faHome} />
          </button>
        </div>
      );
    }

    // Normal view - show all buttons
    return (
      <div className="flex items-center space-x-2">
        {/* SUITE BUTTON - Opens Suite page in parent */}
        <button
          onClick={handleSuiteClick}
          className="p-2 rounded-md bg-indigo-500 hover:bg-indigo-800 transition-colors text-white flex items-center gap-2"
          title="Open Suite Page"
        >
          <FontAwesomeIcon icon={faLayerGroup} />
          Suite
        </button>

        <button
          onClick={async () => {
            if (!isLLMConnected) return showToast('LLM is not connected', 'error');

            let token = authToken;
            if (!token) {
              token = await loginAndGetToken();
            }

            setIsDocOpen(true);
          }}
          className="p-2 rounded-md bg-green-500 hover:bg-green-800 transition-colors text-white flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faFileAlt} />
          {/* Generate Technical Document */}
        </button>


        <button
          onClick={async () => {
            if (!isLLMConnected) return showToast('LLM is not connected', 'error');

            let token = authToken;
            if (!token) {
              token = await loginAndGetToken();
            }

            setIsChatOpen(true);
          }}
          className="p-2 rounded-md bg-blue-500 hover:bg-blue-800 transition-colors text-white flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faComments} />
          {/* Chat Session */}
        </button>

        <button
          onClick={handleAddStoryClick}
          disabled={!isLLMConnected}
          className="p-2 rounded-md hover:bg-green-100 transition-colors text-green-700"
          title="Add a New User Story"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
        
        <button
          onClick={onReloadAll}
          className="p-2 rounded-md hover:bg-gray-300 transition-colors text-yellow-400 "
          title="Reload Data"
        >
          <FontAwesomeIcon icon={faRedo} />
        </button>

        {selectedStoryId && (
          <>
            <button
              onClick={async () => {
                if (!isLLMConnected) return showToast('LLM is not connected', 'error');

                let token = authToken;
                if (!token) {
                  token = await loginAndGetToken();
                }

                setIsImportOpen(true);
              }}
              className="p-2 rounded-md bg-purple-500 hover:bg-purple-800 transition-colors text-white flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faProjectDiagram} />
              {/* Impact Analysis */}
            </button>
            <DownloadExcel
              selectedStoryId={selectedStoryId}
              projectId={projectId}
              selectedstatus={selectedstatus}
              selectedstage={selectedstage}
              isStoryCompleted={isStoryCompleted}
            />
          </>
        )}

        <button
          onClick={clearSelectedStory}
          className="p-2 rounded-md hover:bg-blue-100 transition-colors text-blue-700"
          title="Go to Home"
        >
          <FontAwesomeIcon icon={faHome} />
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between w-full px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center space-x-4 mb-3 sm:mb-0">
        <button
          onClick={() => setSidebarOpen(prev => !prev)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors border border-gray-300"
          title="Toggle Sidebar"
        >
          <FontAwesomeIcon icon={faBars} className="text-gray-700" />
        </button>
        <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
          <StoryIdButton />
        </div>
      </div>

      <DateBadges />
      <ActionButtons />

      <ModalComponent
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStorySubmit={onStorySubmit}
        projectId={projectId}
        onReloadData={onReloadData}
        jiraData={jiraData}
        isPMConnected={isPMConnected}
        PMTool={PMTool}
      />

      <DetailModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        selectedStoryDetails={selectedStoryDetails}
      />

      {isChatOpen && (
        <ChatSession
          projectId={projectId}
          selectedStoryId={selectedStoryId}
          authToken={authToken}   // ✅ pass here
          onClose={() => setIsChatOpen(false)}
        />
      )}
      {isDocOpen && (
        <GenerateDoc
          projectId={projectId}
          selectedStoryId={selectedStoryId}
          authToken={authToken}   // ✅ pass here
          onClose={() => setIsDocOpen(false)}
        />
      )}


      {isImportOpen && (
        <ImportAnalysis
          projectId={projectId}
          selectedStoryId={selectedStoryId}
          authToken={authToken}
          onClose={() => setIsImportOpen(false)}
        />
      )}
    </div>
  );
};

export default TextArea;