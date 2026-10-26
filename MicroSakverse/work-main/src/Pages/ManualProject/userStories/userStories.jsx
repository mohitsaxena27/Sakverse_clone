import React, { useState, useEffect, useCallback } from "react";
import inprogress from "../../../assets/icons/inprogress.svg";
import hold from "../../../assets/icons/hold.svg";
import completed from "../../../assets/icons/tick.svg";
import errorIcon from "../../../assets/icons/eror.svg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { useUserStoriesData } from "../useFetchData";

const UserStories = ({ userStories,setSelectedStory, projectId, currentProject, onRefetchAvailable }) => {
  const {  loading, refetch } = useUserStoriesData(projectId);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStories, setFilteredStories] = useState([]);
  const [containerHeight, setContainerHeight] = useState(window.innerHeight * 0.89);
  const [selectedStoryId, setSelectedStoryId] = useState(null); // ✅ dynamic selection

  useEffect(() => {
    if (onRefetchAvailable) {
      onRefetchAvailable(refetch);
    }
  }, [refetch, onRefetchAvailable]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 1200000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return completed;
      case "in-progress":
        return inprogress;
      case "hold":
        return hold;
      default:
        return errorIcon;
    }
  };

const getDisplayKey = useCallback(
  (story) => {
    if (currentProject?.linked && story.reference_key) {
      return story.reference_key;
    }
    return `USER STORY - ${story._id}`;
  },
  [currentProject?.linked]
);

  const updateDisplayedStories = useCallback(() => {
    if (!userStories || userStories.length === 0) return;
    const filtered = userStories.filter((story) =>
      getDisplayKey(story)?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStories(filtered);
  }, [userStories, searchTerm, getDisplayKey]);

  useEffect(() => {
    updateDisplayedStories();
  }, [userStories, searchTerm, updateDisplayedStories]);

  useEffect(() => {
    const handleResize = () => setContainerHeight(window.innerHeight * 0.89);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSearchChange = (e) => setSearchTerm(e.target.value.trim());

  const handleStoryClick = (id) => {
    const selectedStory = userStories.find((story) => story._id === id);
    if (selectedStory) {
      const payload = {
        id: selectedStory._id,
        detail: selectedStory.detail || "",
        referenceKey: selectedStory.reference_key,
        status: selectedStory.status,
        stage: selectedStory.stage || "",
        created: selectedStory.created || "",
        updated: selectedStory.updated || "",
      };
      setSelectedStory(payload);
      setSelectedStoryId(id); // ✅ updates selection state
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 p-2">Loading stories...</div>;
  }

return (
  <div className="h-full flex flex-col bg-white shadow-md border-2 p-4">
    <h1 className="text-left text-xl font-bold mb-4 shrink-0">
      USER STORIES
    </h1>

    {/* Search */}
    <div className="flex items-center space-x-2 shrink-0">
      <FontAwesomeIcon icon={faSearch} className="text-gray-500 text-sm" />
      <input
        type="text"
        value={searchTerm}
        onChange={handleSearchChange}
        placeholder="Search by ID..."
        className="border border-gray-300 rounded-lg pl-2 focus:outline-none w-full py-1 text-sm"
      />
    </div>

    {/* Scrollable list */}
    <div className="flex-1 min-h-0 overflow-y-auto mt-3 custom-scrollbar">
      <ul className="space-y-2">
        {filteredStories.length === 0 ? (
          <p className="text-center text-sm text-gray-500">
            No stories found.
          </p>
        ) : (
          filteredStories.map((story) => {
            const isSelected = selectedStoryId === story._id;

            return (
              <li
                key={story._id}
                onClick={() => handleStoryClick(story._id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "bg-blue-100 text-black font-semibold border border-blue-500 shadow-sm"
                    : "hover:bg-blue-50"
                }`}
              >
                <span className="text-[13px]">
                  {getDisplayKey(story)}
                </span>
                <img
                  src={getStatusIcon(story.status)}
                  alt={story.status}
                  className="h-4 w-4"
                />
              </li>
            );
          })
        )}
      </ul>
    </div>
  </div>
);
};

export default UserStories;
