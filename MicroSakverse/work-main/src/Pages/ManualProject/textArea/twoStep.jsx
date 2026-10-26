import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@fortawesome/free-solid-svg-icons";

import { 
  faTimes, 
  faSearch, 
  faChevronDown, 
  faSpinner,
  faRobot,
  faUserCheck,
  faPaperclip,
  faFileUpload,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";
import { useUserStorySubmit_v2 } from '../../../Hooks/Manual/UserData';

const twoStepStoryModal = ({ isOpen, onClose, onStorySubmit, projectId, jiraData,PMTool ,isPMConnected}) => {
  const [currentStage, setCurrentStage] = useState(0); 
  const [userInput, setUserInput] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
const [isTicketExpanded, setIsTicketExpanded] = useState(false);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const projectLinked = isPMConnected;
  const isJiraLoading = projectLinked && (!jiraData || !jiraData.tickets?.length);
  const { twoStepSubmit: submitUserStory } = useUserStorySubmit_v2();
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  // console.log("TwoStep Modal - PM Tool:", PMTool);


  useEffect(() => {
    if (isOpen) {
      setUserInput("");
      setSelectedTicket(null);
      setIsButtonDisabled(false);
      setShowDropdown(false);
      setSearchTerm("");
      setCurrentStage(0);
      setUploadedFiles([]);
      setChatMessages([]);
    }
  }, [isOpen]);

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type
    }));
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = (message) => {
    if (!message.trim()) return;
    const newMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectId || (projectLinked && !selectedTicket)) {
      alert('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    setIsButtonDisabled(true);

    const files = uploadedFiles.map(f => f.file);

    // ONLY include user-typed messages from stage 2 input
    const additional_context = chatMessages
      .filter(msg => msg.type === 'user' && msg.content.trim())
      .map(msg => msg.content)
      .join('\n') || undefined;

    try {
const res = await submitUserStory(
    projectId,
    projectLinked ? selectedTicket?.description : userInput,
    isAutoPilot, // now correctly passing the toggle state
    selectedTicket?.key,
    additional_context,
    undefined,
    files
);

      localStorage.setItem('request_id', res.request_id);
      onStorySubmit?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit user story.');
    } finally {
      setIsSubmitting(false);
      setIsButtonDisabled(false);
    }
  };

  const handleNextStage = () => {

    if (currentStage === 0) {
      if (projectLinked && !selectedTicket) {
        alert('Please select a  ticket to continue.');
        return;
      }
      if (!projectLinked && !userInput.trim()) {
        alert('Please enter user story description to continue.');
        return;
      }

      if (!projectLinked) {
        setChatMessages([{
          id: Math.random().toString(36).substr(2, 9),
          type: 'user',
          content: userInput.trim(),
          timestamp: new Date()
        }]);
      }
    }
    setCurrentStage(prev => prev + 1);
  };

  const handlePreviousStage = () => {
    setCurrentStage(prev => prev - 1);
  };

  if (!isOpen) return null;

  const filteredTickets = jiraData?.tickets?.filter(
    (t) =>
      (t.key || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.summary || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const renderStageContent = () => {
    switch (currentStage) {
      case 0:
        return (
          projectLinked ? renderJiraDropdown() : renderUserInput()
        );
      case 1:
        return renderFileUploadStage();
      default:
        return null;
    }
  };

  const renderUserInput = () => (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">
        User Story Description
      </label>
      <textarea
        rows="4"
        className="w-full p-2 text-xs border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 shadow-sm"
        placeholder="Describe your user story in detail..."
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        required
      />
    </div>
  );

  const renderJiraDropdown = () => (
    <div className="relative w-full" ref={dropdownRef}>
      {isJiraLoading ? (
        <div className="flex flex-col items-center justify-center h-32">
          <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-xl mb-2" />
          <p className="text-gray-600 text-xs">Fetching ${PMTool} tickets...</p>
        </div>
      ) : (
        <>
          {/* Dropdown button */}
          <button
            type="button"
            onClick={() => setShowDropdown((v) => !v)}
            className="w-full flex justify-between items-center text-left bg-white text-gray-700 px-3 py-2 rounded border border-gray-300 hover:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          >
            <div className="truncate text-sm">
              {selectedTicket ? (
                <div className="flex items-center">
                  <span className="font-medium">{selectedTicket.key}</span>
                  <span className="mx-1 text-gray-400">•</span>
                  <span className="text-gray-700">{selectedTicket.summary}</span>
                </div>
              ) : (
                <span className="text-gray-400">Select a JIRA ticket</span>
              )}
            </div>
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className={`transition-transform ${showDropdown ? 'rotate-180' : ''} text-gray-400`}
              size="xs" 
            />
          </button>

          {/* Dropdown list */}
          {showDropdown && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-hidden flex flex-col">
              <div className="p-2 border-b bg-white sticky top-0">
                <div className="relative">
                  <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size="xs"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search tickets..."
                    className="w-full text-xs pl-7 pr-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="overflow-y-auto">
                {filteredTickets.length === 0 ? (
                  <div className="px-3 py-2 text-gray-500 text-xs text-center">
                    {searchTerm ? "No matching tickets found" : "No tickets available"}
                  </div>
                ) : (
                  <ul className="text-xs divide-y divide-gray-100">
                    {filteredTickets.map((ticket) => (
                      <li
                        key={ticket.id}
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-blue-600">{ticket.key}</div>
                            <div className="text-gray-800 mt-0.5 truncate">{ticket.summary}</div>
                            <div className="flex items-center mt-1 text-gray-500">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded
                                ${ticket.status === "To Do" ? "bg-gray-100 text-gray-800" :
                                  ticket.status === "In Progress" ? "bg-blue-100 text-blue-800" :
                                  ticket.status === "Done" ? "bg-green-100 text-green-800" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                {ticket.status || 'No status'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Ticket preview */}
          {selectedTicket && (
            <div className="rounded border border-gray-200 p-3 bg-gray-50 mt-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-sm font-semibold text-blue-600">{selectedTicket.key}</span>
                  <h3 className="text-xs font-medium text-gray-800 mt-0.5">{selectedTicket.summary}</h3>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    selectedTicket.status === "To Do"
                      ? "bg-gray-100 text-gray-800"
                      : selectedTicket.status === "In Progress"
                      ? "bg-blue-100 text-blue-800"
                      : selectedTicket.status === "Done"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {selectedTicket.status || 'No status'}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-gray-200 text-xs">
                <h4 className="font-medium text-gray-700 mb-1">Description</h4>
                <p className="text-gray-600">
                  {selectedTicket.description || (
                    <span className="text-gray-400">No description available</span>
                  )}
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

const renderFileUploadStage = () => (
  <div className="h-full flex flex-col overflow-hidden">

    {/* Ticket Context (Sticky) */}
    {selectedTicket && (
      <div className="sticky top-0 z-10 bg-blue-50 border-b border-gray-200 rounded-2xl px-2 py-3">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <div className="text-xs text-blue-600 font-semibold truncate">
              {selectedTicket.key}
            </div>
            <div className="text-sm font-medium text-gray-800 truncate">
              {selectedTicket.summary}
            </div>
          </div>

          {selectedTicket.description && (
            <button
              onClick={() => setIsTicketExpanded(prev => !prev)}
              className="ml-2 text-gray-500 hover:text-blue-600 transition shrink-0"
              title={isTicketExpanded ? "Hide description" : "Show description"}
            >
              <FontAwesomeIcon
                icon={isTicketExpanded ? faMinus : faPlus}
                size="xs"
              />
            </button>
          )}
        </div>

        {isTicketExpanded && selectedTicket.description && (
          <p className="text-xs text-gray-600 mt-2 leading-relaxed max-h-32 overflow-y-auto pr-1">
            {selectedTicket.description}
          </p>
        )}
      </div>
    )}

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">

      {/* Chat Messages */}
      <div className="space-y-3">
        {chatMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] sm:max-w-md px-3 py-2 rounded-lg text-xs shadow-sm break-words ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <div>{message.content}</div>
              <div
                className={`text-[10px] mt-1 text-right ${
                  message.type === 'user'
                    ? 'text-blue-200'
                    : 'text-gray-400'
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* File Upload */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">
            Attach files (optional)
          </span>
          <span className="text-[10px] text-gray-500">
            {uploadedFiles.length} attached
          </span>
        </div>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition"
          onClick={() => fileInputRef.current?.click()}
        >
          <FontAwesomeIcon
            icon={faFileUpload}
            className="text-gray-400 text-lg mb-1"
          />
          <p className="text-xs text-gray-600">
            Click or drag files to upload
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between bg-white p-2 rounded border border-gray-200 text-xs"
              >
                <div className="flex items-center space-x-2 min-w-0">
                  <FontAwesomeIcon icon={faPaperclip} className="text-gray-400" />
                  <span className="font-medium truncate">
                    {file.name}
                  </span>
                  <span className="text-gray-400 text-[10px]">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => removeFile(file.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <FontAwesomeIcon icon={faTimes} size="xs" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>

    {/* Chat Input (Sticky Bottom) */}
    <div className="border-t bg-white px-4 py-2 flex items-center space-x-2">
      <input
        type="text"
        placeholder="Add additional details..."
        className="flex-1 text-xs p-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            handleSendMessage(e.target.value);
            e.target.value = '';
          }
        }}
      />
      <button
        onClick={(e) => {
          const input = e.currentTarget.previousElementSibling;
          handleSendMessage(input.value);
          input.value = '';
        }}
        className="px-3 py-2 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Send
      </button>
    </div>

  </div>
);


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md z-50 flex items-center justify-center p-1">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col relative overflow-hidden border border-gray-200">
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            {currentStage > 0 && (
              <button
                onClick={handlePreviousStage}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
              >
                <FontAwesomeIcon icon={faArrowLeft} size="sm" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {currentStage === 0 
                  ? (projectLinked ? `Select ${PMTool} Ticket` : "Create User Story")
                  : "Add Addtional Information Text"
                }
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                {currentStage === 0
                  ? (projectLinked ? `Choose a ${PMTool} ticket to generate user stories` : "Describe your user story requirements")
                  : "Upload files or provide additional information"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
            >
              <FontAwesomeIcon icon={faTimes} size="sm" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {renderStageContent()}
        </div>

      <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
  {/* Left: Auto-Pilot toggle */}
  <div className="flex items-center">
    <span className="text-xs text-gray-700 mr-2">Mode:</span>
    <button
      type="button"
      className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${
        isAutoPilot ? 'bg-blue-600' : 'bg-gray-300'
      }`}
      onClick={() => setIsAutoPilot(!isAutoPilot)}
    >
      <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition-transform ${
        isAutoPilot ? 'translate-x-4' : 'translate-x-0.5'
      }`} />
    </button>
    <div className="ml-2 flex items-center text-xs">
      {isAutoPilot ? (
        <>
          <FontAwesomeIcon icon={faRobot} className="text-blue-600 mr-1" />
          <span className="text-blue-600">Auto-Pilot : ON</span>
        </>
      ) : (
        <>
          <FontAwesomeIcon icon={faUserCheck} className="text-gray-600 mr-1" />
          <span className="text-gray-600">Auto-Pilot : OFF</span>
        </>
      )}
    </div>
    
    {/* Info Button with Tooltip */}
    <div className="relative group ml-2">
      <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      
      {/* Tooltip */}
      <div className="absolute hidden group-hover:block bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs p-3 rounded shadow-lg z-10">
        <div className="font-semibold mb-1">
          {isAutoPilot ? "Auto-Pilot On" : "Auto-Pilot Off"}
        </div>
        <p className="leading-tight">
          {isAutoPilot 
            ? "AI will generate the complete user story without intermediate validation. Best for experienced users who want faster results."
            : "Step-by-step validation with human confirmation at each stage. Recommended for new users or complex requirements."
          }
        </p>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  </div>

  {/* Right: Next / Generate button */}
  {currentStage === 0 ? (
    <button
      onClick={handleNextStage}
      disabled={isButtonDisabled || !projectId || (projectLinked && !selectedTicket) || (!projectLinked && !userInput.trim())}
      className="px-3 py-1.5 text-xs text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  ) : (
    <button
      onClick={handleSubmit}
      disabled={isButtonDisabled}
      className="px-3 py-1.5 text-xs text-white bg-green-600 border border-transparent rounded hover:bg-green-700 focus:ring-1 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Generate'}
    </button>
  )}
</div>

      </div>
    </div>
  );
};

export default twoStepStoryModal;
