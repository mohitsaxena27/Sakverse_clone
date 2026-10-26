import React, { useState, useEffect } from 'react';
import Accordion from './index';
import EditIcon from '../../../../assets/icons/edit_icon.svg';
import UpdateIcon from '../../../../assets/icons/update_icon.svg';
import showToast from '../../../../items/ToastMessage/toastUtil';
import { useUpdateUserStory, usePublishUserStory } from '../../../../Hooks/Manual/UserData';

const UserStoryAccordion = ({ data, projectId, isOpen, toggle , selectedStoryId ,isPMConnected}) => {
  const [localData, setLocalData] = useState(data?.user_story || {});
  const [editIndex, setEditIndex] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { updateUserStory } = useUpdateUserStory();
  const { publishUserStory, loading: publishing } = usePublishUserStory();

  useEffect(() => {
    setLocalData(data?.user_story || {});
  }, [data]);

  const handleChange = (field, value) => {
    setLocalData(prevData => ({
      ...prevData,
      [field]: value,
    }));
  };

  const handleUpdate = async (field) => {
    const updatedField = {
      id: localData.id || null,
      [field]: Array.isArray(localData[field])
        ? JSON.stringify(localData[field])
        : localData[field],
    };

    try {
      const result = await updateUserStory(updatedField);

      if (result.success) {
        showToast(`Updated ${field} successfully`, 'success');
        setEditIndex(null);
      } else {
        showToast(`Failed to update ${field}`, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showToast(`Error updating ${field}`, 'error');
    }
  };

  const handleEdit = (field) => {
    setEditIndex(prev => (prev === field ? null : field));
  };

  const handleToggle = () => {
    if (!localData || Object.keys(localData).length === 0) {
      alert('User story creation is in progress, please wait.');
      return;
    }
    toggle();
  };

  const handlePublish = async () => {
    const userstory_ref_id = selectedStoryId;

    if (!userstory_ref_id || !projectId) {
      showToast('Missing user story ID or project ID', 'error');
      return;
    }

    try {
      const result = await publishUserStory({
        userstory_ref_id,
        project_id: projectId,
      });

      if (result.success) {
        showToast('User story published successfully', 'success');
      } else {
        showToast(result.error || 'Failed to publish user story', 'error');
      }
    } catch (err) {
      console.error('Publish Error:', err);
      showToast('Error publishing user story frontrnd', 'error');
    }
  };

  const confirmPublish = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmPublish = async () => {
      if (!isPMConnected) {
      showToast('LLM is not connected', 'error');
    return;
  }
    setShowConfirmModal(false);
    await handlePublish();
  };

  const renderValue = (value) => {
    if (typeof value === 'string') {
      return <p className="text-gray-700">{value || 'N/A'}</p>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc ml-5 text-gray-700">
          {value.map((item, index) => (
            <li key={index}>
              {typeof item === 'object' ? renderValue(item) : item}
            </li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <ul className="list-disc ml-5 text-gray-700">
          {Object.entries(value).map(([subKey, subValue], idx) => (
            <li key={idx}>
              <strong className="capitalize">{subKey.replace(/_/g, ' ')}:</strong>{' '}
              {typeof subValue === 'object' ? renderValue(subValue) : subValue}
            </li>
          ))}
        </ul>
      );
    }

    return <p className="text-gray-700">N/A</p>;
  };

  return (
    <Accordion
      title="User Story"
      isOpen={isOpen}
      toggle={handleToggle}
      icon={<span role="img" aria-label="story">📖</span>}
    >
      {localData ? (
        <>
          <div className="space-y-4">
            {Object.entries(localData)
              .filter(([key, value]) => {
                if (key === 'id') return false;
                if (key === 'test_data') {
                  return Array.isArray(value) || (typeof value === 'object' && value !== null && Object.keys(value).length > 1);
                }
                return true;
              })
              .map(([key, value], i) => (
                <div key={i} className="mb-4 border-b pb-4 last:border-none">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-blue-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </p>
                    <div>
                      {editIndex === key ? (
                        <button onClick={() => handleUpdate(key)} className="mr-2">
                          <img src={UpdateIcon} alt="Update" className="h-4 w-6" title="Update" />
                        </button>
                      ) : (
                        <button onClick={() => handleEdit(key)}>
                          <img src={EditIcon} alt="Edit" className="h-4 w-6" title="Edit" />
                        </button>
                      )}
                    </div>
                  </div>

                  {editIndex === key ? (
                    <textarea
                      className="border border-gray-300 p-2 w-full rounded"
                      value={
                        Array.isArray(value)
                          ? value.join('\n')
                          : typeof value === 'object'
                            ? JSON.stringify(value, null, 2)
                            : value || ''
                      }
                      onChange={(e) =>
                        handleChange(
                          key,
                          Array.isArray(value)
                            ? e.target.value.split('\n')
                            : e.target.value
                        )
                      }
                      rows={Array.isArray(value) ? Math.max(value.length, 3) : 3}
                    />
                  ) : (
                    renderValue(value)
                  )}
                </div>
              ))}
          </div>

          {/* Publish Button at Bottom Right */}
{isPMConnected && (
  <div className="flex justify-end mt-8">
    <button
      onClick={confirmPublish}
      disabled={publishing}
      className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition ${
        publishing ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {publishing ? 'Publishing...' : 'Publish User Story'}
    </button>
  </div>
)}


          {/* Confirmation Modal */}
          {showConfirmModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4">Confirm Publish</h3>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to publish this user story?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmPublish}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">User story not available</p>
      )}
    </Accordion>
  );
};

export default UserStoryAccordion;
