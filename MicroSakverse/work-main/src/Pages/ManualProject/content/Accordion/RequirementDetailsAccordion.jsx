import React, { useState, useEffect } from 'react';
import Accordion from './index';
import EditIcon from '../../../../assets/icons/edit_icon.svg';
import UpdateIcon from '../../../../assets/icons/update_icon.svg';
import showToast from '../../../../items/ToastMessage/toastUtil';
import { useFetchData } from '../../useFetchData';
import { useUpdateRequirement } from '../../../../Hooks/Manual/UserData';

const RequirementDetailsAccordion = ({ data, selectedStoryId, isOpen, toggle }) => {
  const { error, isLoading } = useFetchData(selectedStoryId);
  const [localData, setLocalData] = useState([]);
  const [editStates, setEditStates] = useState({});
  const [filter, setFilter] = useState('all');
  const [selectedFilters, setSelectedFilters] = useState({});
  const { updateRequirement } = useUpdateRequirement();

  useEffect(() => {
    if (data?.requirement_details) {
      const initialFilters = data.requirement_details.reduce((acc, detail, index) => {
        acc[index] = 'bv';
        return acc;
      }, {});
      setLocalData(data.requirement_details);
      setSelectedFilters(initialFilters);
    }
  }, [data]);

  // ✅ Determine which filters exist dynamically
  const hasFunctional = localData.some((item) => item.type?.toLowerCase() === 'functional');
  const hasNonFunctional = localData.some((item) => item.type?.toLowerCase() === 'non-functional');
 
  // ✅ Filter the data based on current selection
  const filteredData = localData.filter((detail) => {
    if (filter === 'all') return true;
    if (!detail.type) return false;
    return detail.type.toLowerCase() === filter.toLowerCase();
  });

  const handleChange = (index, field, value) => {
    setLocalData((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleUpdate = async (index) => {
    const detail = localData[index];

    const updatedField = {
      id: detail.id,
      detail: detail.detail,
      type: detail.type,
      data: JSON.stringify(detail.data),
      test_steps: JSON.stringify(detail.test_steps),
    };

    try {
      const result = await updateRequirement(updatedField);

      if (result.success) {
        showToast('Requirement updated successfully', 'success');
      } else {
        showToast('Failed to update requirement', 'error');
      }

      setEditStates((prev) => ({ ...prev, [index]: false }));
    } catch (err) {
      console.error('Error updating requirement:', err);
      showToast('Error updating requirement', 'error');
    }
  };

  const handleToggle = () => {
    if (!localData.length) {
      alert('Requirement details creation is in progress, please wait.');
      return;
    }
    toggle();
  };

  const handleFilterChange = (index, filterKey) => {
    setSelectedFilters((prev) => ({ ...prev, [index]: filterKey }));
  };

  const renderValue = (value) => {
    if (typeof value === 'string') {
      return <p className="text-gray-700">{value || 'N/A'}</p>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="list-disc ml-5 text-gray-700">
          {value.map((item, index) => (
            <li key={index}>{typeof item === 'object' ? renderValue(item) : item}</li>
          ))}
        </ul>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <ul className="list-disc ml-5 text-gray-700">
          {Object.entries(value).map(([subKey, subValue], idx) => (
            <h1 key={idx}>
              <strong>
                {subKey.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()).toUpperCase()}:
              </strong>{' '}
              {typeof subValue === 'object' ? renderValue(subValue) : subValue}
            </h1>
          ))}
        </ul>
      );
    }

    return <p className="text-gray-700">N/A</p>;
  };

  const renderDynamicTable = (details, index) => {
    const dataMapping = {
      bv: 'Boundary Values',
      ep: 'Equivalence Partitioning',
      st: 'State Transition',
      dt: 'Decision Table',
      uc: 'Use Cases',
    };

    const availableFilters = Object.keys(dataMapping).filter(
      (key) => details[`${key}_details`] && details[`${key}_details`].length > 0
    );

    if (availableFilters.length === 0) {
      return <p className="text-gray-500"></p>;
    }

    return (
      <div className="flex border border-gray-300 rounded my-10">
        <div className="w-28 bg-gray-100 border-r border-gray-300">
          {availableFilters.map((key) => (
            <button
              key={key}
              className={`block w-28 text-left px-4 py-2 border-b border-gray-300 ${
                selectedFilters[index] === key ? 'bg-blue-500 text-white' : 'hover:bg-gray-200'
              }`}
              onClick={() => handleFilterChange(index, key)}
            >
              {dataMapping[key]}
            </button>
          ))}
        </div>

        <div className="w-full p-4 h-72 overflow-y-auto bg-gray-100">
          {details[`${selectedFilters[index]}_details`] &&
          details[`${selectedFilters[index]}_details`].length > 0 ? (
            details[`${selectedFilters[index]}_details`].map((item, itemIndex) => (
              <div key={itemIndex} className="mb-4">
                <h3 className="font-bold underline mb-2">Attribute : {item.attribute_name}</h3>
                <ul className="list-disc ml-5">
                  {item.techniquedetails.map((technique, techIndex) => (
                    <li key={techIndex} className="mb-1">
                      {technique}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Select a Category</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <Accordion
      title="Features Details"
      isOpen={isOpen}
      toggle={handleToggle}
      icon={<span role="img" aria-label="requirement">📋</span>}
    >
      {/* ✅ Dynamic Filter Dropdown — only shows existing options */}
      {(hasFunctional || hasNonFunctional) && (
        <div className="flex justify-between items-center mb-4">
          <span className="font-bold">Filter by Type:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="all">All</option>
            {hasFunctional && <option value="functional">Functional</option>}
            {hasNonFunctional && <option value="non-functional">Non-Functional</option>}

          </select>
        </div>
      )}

      {isLoading ? (
        <p>Loading requirement details...</p>
      ) : error ? (
        <p>An error occurred: {error}</p>
      ) : filteredData.length ? (
        filteredData.map((detail, index) => (
          <div
            key={index}
            className={`border-t-2 border-black p-4 ${
              detail.type?.toLowerCase() === 'functional'
                ? 'bg-white'
                : detail.type?.toLowerCase() === 'non-functional'
                ? 'bg-orange-200'
                : 'bg-gray-100'
            }`}
          >
            <div className="flex flex-col md:flex-row">
              <div key={index} className="w-full md:w-2/5 pr-10">
                <div>
                  <p className="font-bold text-blue-600">
                    Detail:
                    <button
                      onClick={() =>
                        setEditStates((prev) => ({ ...prev, [index]: !prev[index] }))
                      }
                    >
                      <img src={EditIcon} alt="Edit" className="h-4 w-6" />
                    </button>
                    {editStates[index] && (
                      <button onClick={() => handleUpdate(index)}>
                        <img src={UpdateIcon} alt="Update" className="h-4 w-6" />
                      </button>
                    )}
                  </p>
                  {editStates[index] ? (
                    <textarea
                      className="border p-2 w-full rounded"
                      value={detail.detail}
                      onChange={(e) => handleChange(index, 'detail', e.target.value)}
                    />
                  ) : (
                    <p>{detail.detail}</p>
                  )}
                </div>

                <div>
                  <p className="font-bold text-blue-600">Type:</p>
                  <p>{detail.type || 'Unknown'}</p>
                </div>

                <div>
                  <p className="font-bold text-blue-600">Data:</p>
                  {renderValue(detail.data)}
                </div>

                <div>
                  <p className="font-bold text-blue-600">Test Steps:</p>
                  {renderValue(detail.test_steps)}
                </div>
              </div>

              <div className="w-full md:w-3/5 pl-10">
                {renderDynamicTable(detail, index)}
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500">Requirement details creation in progress...</p>
      )}
    </Accordion>
  );
};

export default RequirementDetailsAccordion;
