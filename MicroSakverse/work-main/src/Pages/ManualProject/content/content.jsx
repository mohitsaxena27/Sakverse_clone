import React, { useState, useEffect } from 'react';
import QueriesAccordion from './Accordion/QueriesAccordion';
import UserStoryAccordion from './Accordion/userStories';
import RequirementDetailsAccordion from './Accordion/RequirementDetailsAccordion';
import TestCasesAccordion from './Accordion/TestCasesAccordion';
import { useFetchData } from '../useFetchData';
import inprogressGif from '../../../assets/GIF/progressAI1.gif';
import play from '../../../assets/icons/play.jpg';
import complete from '../../../assets/icons/tick.svg';
import errorIcon from '../../../assets/icons/eror.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const APIURL = import.meta.env.VITE_API_URL;
const PORT = import.meta.env.VITE_BACKEND_PORT;

// Correct template literal
const API_BASE = `/sakverse`;

const getAccordionName = (key) => {
  const names = {
    queries: 'QUERY MASTER',
    userStory: 'STORY BUILDER',
    requirementDetails: 'REQUIREMENT ANALYZER',
    testCases: 'TEST DESIGNER',
  };
  return names[key] || key;
};

const stageMap = {
  queries: 1,
  userStory: 2,
  requirementDetails: 3,
  testCases: 4,
};

const Content = ({
  selectedStoryId,
  selectedStoryDetails,
  selectedReferenceKey,
  projectId,
  selectedStatus,
  selectedstage,
  reload,
  onReloadStories,
  data,
  isLoading,
  refetchContent,
  isTMConnected,
  isPMConnected,
  onReloadAll,
  TMTool,
  linkedStatus,
  UpdateGetUpdate,
  tmCustomId
}) => {
  const [openAccordions, setOpenAccordions] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [localStage, setLocalStage] = useState(selectedstage);
  const [localStatus, setLocalStatus] = useState(selectedStatus);

  useEffect(() => {
    setRefreshKey(prev => prev + 1);
    setLocalStage(selectedstage);
    setLocalStatus(selectedStatus);
    setOpenAccordions({});
  }, [selectedStoryId, selectedstage, selectedStatus]);



  useEffect(() => {
    if (reload) {
      refetchContent();
      setRefreshKey(prev => prev + 1);
    }
  }, [reload, refetchContent]);

  useEffect(() => {
    if (localStatus !== 'in-progress') return;

    const interval = setInterval(() => {
      // console.log('⏱ Polling GetUpdate (in-progress)...');
      onReloadAll();
    }, 120000);

    return () => clearInterval(interval);
  }, [localStatus, onReloadAll]);

const getIconForStage = (currentStage) => {
  if (localStatus === 'Completed') {
    return 'Completed';
  }

  if (localStatus === 'Error') {
    if (currentStage < localStage) return 'Completed';
    if (currentStage === localStage) return 'play';     // show play to retry
    return 'notStarted';
  }

  if (localStatus === 'Hold') {
    if (currentStage < localStage) return 'Completed';
    if (currentStage === localStage) return 'Completed';
    if (currentStage === localStage + 1) return 'play';  // show play to start next
    return 'notStarted';
  }

  if (localStatus === 'in-progress') {
    if (currentStage < localStage) return 'Completed';
    if (currentStage === localStage) return 'inprogress';
    return 'notStarted';
  }

  return 'notStarted';
};



const handlePlayClick = async (stageKey) => {
  if (!selectedStoryId) return;

  const nextStage = stageMap[stageKey];

  // 🔁 Optimistically update UI before waiting for API response
  if (localStatus === 'Hold' || localStatus === 'Error') {
    setLocalStatus('in-progress');
    setLocalStage(nextStage); // UI shows in-progress instantly
  }

  try {
    const response = await fetch(
      `${API_BASE}/project/nextStep/${selectedStoryId}`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      }
    );

    if (!response.ok) throw new Error(`Error: ${response.status}`);
    await response.json();

    toast.success('Next step started successfully!');

    // ✅ Wait 2 seconds after successful 200 response before reloading
    await new Promise((resolve) => setTimeout(resolve, 1500));
    onReloadAll?.();

  } catch (error) {
    console.error('Failed to trigger next step:', error);
    toast.error('Failed to start next step.');
  }
};




  const StatusIcon = ({ iconType, accordionName, onPlayClick }) => {
    const icons = {
      Completed: (
        <img src={complete} alt="Completed" className="w-8 h-8" title={`Completed: ${accordionName}`} />
      ),
      inprogress: (
        <img src={inprogressGif} alt="In Progress" className="w-10 h-10" title={`In Progress: ${accordionName}`} />
      ),
      play: (
        <img
          src={play}
          alt="Next Stage"
          className="w-10 h-10 cursor-pointer"
          title={`Start: ${accordionName}`}
          onClick={onPlayClick}
        />
      ),
      Error: (
        <img src={errorIcon} alt="Error" className="w-6 h-6" title={`Error: ${accordionName}`} />
      ),
      notStarted: (
        <span className="text-gray-500 text-xs font-bold" title={`Not Started: ${accordionName}`}>
          ✖
        </span>
      ),
    };
    return icons[iconType] || icons.notStarted;
  };
  // console.log('Content component rendered with:', { selectedStoryId,selectedStatus, selectedstage, localStage, localStatus  });

  const renderAccordion = (key, Component) => {
    const stage = stageMap[key];
    const iconStatus = getIconForStage(stage);


    // only show accordion when in-progress or completed
    if (!['inprogress', 'Completed'].includes(iconStatus)) return null;

    return (
      <Component
        key={`${key}-${refreshKey}`}
        data={data}
        projectId={projectId}
        selectedStoryId={selectedStoryId}
        selectedStatus={selectedStatus}
        isOpen={openAccordions[key]}
        toggle={() => setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))}
        editIndex={editIndex}
        setEditIndex={setEditIndex}
        selectedStoryDetails={selectedStoryDetails}
        selectedReferenceKey={selectedReferenceKey}
        isTMConnected={isTMConnected}
        isPMConnected={isPMConnected}
        TMTool={TMTool}
        linkedStatus={linkedStatus}
        tmCustomId={tmCustomId}
      />
    );
  };

  if (isLoading) {
    return <div className="p-6 pt-24 text-center">Loading...</div>;
  }

  if (!selectedStoryId) {
    return (
      <div className="p-2 pt-20 text-center">
        No user story selected. Please{' '}
        <span className="text-red-500 cursor-pointer">select an existing story</span> or{' '}
        <span className="text-red-500 cursor-pointer">add a new story</span> to view details.
      </div>
    );
  }

  return (
    <div className="pl-2">
      <ToastContainer />
      <div className="flex items-center py-4">
        {Object.keys(stageMap).map((key, index) => {
          const stageNumber = stageMap[key];
          const iconStatus = getIconForStage(stageNumber);
            return (
            <div key={key} className="flex items-center space-x-1">
              <div className="flex items-center space-x-1 border-2 border-black rounded-lg p-1 md:p-2 bg-white -mr-1">
              <div className="text-xs md:text-sm text-gray-700 font-bold  decoration-2">
                {getAccordionName(key)}
              </div>
              <StatusIcon
                iconType={iconStatus}
                accordionName={getAccordionName(key)}
                onPlayClick={() => { if (iconStatus === 'play') handlePlayClick(key); }}
              />
              </div>
              {index < Object.keys(stageMap).length - 1 && (
              <div className={`h-1 w-8 md:w-12 ${iconStatus === 'Completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
              )}
            </div>
            );
        })}
      </div>

      {renderAccordion('queries', QueriesAccordion)}
      {renderAccordion('userStory', UserStoryAccordion)}
      {renderAccordion('requirementDetails', RequirementDetailsAccordion)}
      {renderAccordion('testCases', TestCasesAccordion)}
    </div>
  );
};

export default Content;
