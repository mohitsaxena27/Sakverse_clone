import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, 
  faSearch, 
  faChevronDown, 
  faSpinner,
  faRobot,
  faUserCheck
} from "@fortawesome/free-solid-svg-icons";
import { useUserStorySubmit } from '../../../Hooks/Manual/UserData';

const StoryModal = ({ isOpen, onClose, onStorySubmit, projectId, jiraData , isPMConnected,PMTool}) => {
  const [userInput, setUserInput] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [timer, setTimer] = useState(5);
  const [isAutoPilot, setIsAutoPilot] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const projectLinked = isPMConnected;
  const isJiraLoading = projectLinked && (!jiraData || !jiraData.tickets?.length);
    const { submitUserStory } = useUserStorySubmit();

  useEffect(() => {
    if (isOpen) {
      setUserInput("");
      setSelectedTicket(null);
      setIsButtonDisabled(false);
      setShowDropdown(false);
      setSearchTerm("");
    }
  }, [isOpen]);

  useEffect(() => {
    let interval;
    if (isSubmitting && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    } else if (timer === 0) {
      setIsSubmitting(false);
      setIsButtonDisabled(false);
      setTimer(5);
    }
    return () => clearInterval(interval);
  }, [isSubmitting, timer]);

  useEffect(() => {
    if (showDropdown && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showDropdown]);

  useEffect(() => {
    function onDocClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

 const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectId || (projectLinked && !selectedTicket)) {
      alert('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    setIsButtonDisabled(true);

    const payload = {
      pr_id: projectId,
      user_input: projectLinked ? selectedTicket?.description : userInput,
      key: selectedTicket?.key || null,
      autopilot: isAutoPilot,
    };

    try {
      const res = await submitUserStory(payload);
      localStorage.setItem('request_id', res.request_id);
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 10000);
      onStorySubmit?.();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to submit user story.');
    }
  };

  if (!isOpen) return null;

  const filteredTickets = jiraData?.tickets?.filter(
    (t) =>
      (t.key || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.summary || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[64vh] flex flex-col relative overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {projectLinked ? `Select ${PMTool} Ticket ` : "Create User Story"}
            </h2>
            <p className="text-xs text-gray-600 mt-1">
              {projectLinked ? "Choose a ticket to generate user stories" : "Describe your user story requirements"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
          >
            <FontAwesomeIcon icon={faTimes} size="sm" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {projectLinked ? (
            <>
              {isJiraLoading ? (
                <div className="flex flex-col items-center justify-center h-32">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500 text-xl mb-2" />
                  <p className="text-gray-600 text-xs">Fetching {PMTool} tickets...</p>
                </div>
              ) : (
                <div className="relative w-full" ref={dropdownRef}>
                  {/* Dropdown Button */}
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
                        <span className="text-gray-400">Select a {PMTool} ticket</span>
                      )}
                    </div>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`transition-transform ${showDropdown ? 'rotate-180' : ''} text-gray-400`}
                      size="xs" 
                    />
                  </button>

                  {/* Dropdown */}
                  {showDropdown && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg max-h-60 overflow-hidden flex flex-col">
                      {/* Search */}
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

                      {/* Ticket List */}
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

                  {/* Ticket Preview */}
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
                </div>
              )}
            </>
          ) : (
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
          )}
        </div>

        {/* Footer with Auto-Pilot Toggle */}
<div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
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

  <div className="flex space-x-2 self-end sm:self-auto">
    {/* <button
      onClick={onClose}
      className="px-3 py-1.5 text-xs text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 transition-colors"
    >
      Cancel
    </button> */}
    <button
      onClick={handleSubmit}
      disabled={isButtonDisabled || !projectId || (projectLinked && !selectedTicket)}
      className="px-3 py-1.5 text-xs text-white bg-blue-600 border border-transparent rounded hover:bg-blue-700 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center transition-colors"
    >
      {isSubmitting ? (
        <>
          <FontAwesomeIcon icon={faSpinner} spin className="mr-1" />
          {timer}s
        </>
      ) : (
        'Generate'
      )}
    </button>
  </div>
</div>

        {showMessage && (
          <div className="absolute bottom-2 left-5 right-5 bg-green-100 text-green-800 px-3 py-1.5 rounded text-xs shadow border border-green-200 flex items-center">
            <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>Story generated. ID: {localStorage.getItem("request_id")}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryModal;