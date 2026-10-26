import React, { useState, useEffect } from 'react';
import Accordion from './index';
import Edit from '../../../../assets/icons/edit_icon.svg';
import Update from '../../../../assets/icons/update_icon.svg';
import showToast from '../../../../items/ToastMessage/toastUtil';
import { useUpdateQueries } from '../../../../Hooks/Manual/UserData';

const QueriesAccordion = ({ data, isOpen, toggle }) => {
  const [editIndex, setEditIndex] = useState(null);
  const [editId, setEditId] = useState(null);
  const [localData, setLocalData] = useState(data?.qna || []);
  const [filter, setFilter] = useState('all');
  const { updateQueries, loading, error } = useUpdateQueries();

  useEffect(() => {
    setLocalData(data?.qna || []);
  }, [data]);

  const hasNullKnowledge = localData.some(
    (detail) => detail.knowledge_exist === null || detail.knowledge_exist === undefined
  );

  const hasKnowledgeMissing = localData.some((item) => item.knowledge_exist === 0);
  const hasKnowledgeExists = localData.some((item) => item.knowledge_exist === 1);

  useEffect(() => {
    if (filter !== 'all' && hasNullKnowledge) {
      showToast('Some queries are still being processed. Please wait...', 'info');
    }
  }, [filter, hasNullKnowledge]);

  const filteredData = localData.filter((detail) => {
    if (filter === 'all') return true;
    if (detail.knowledge_exist === null || detail.knowledge_exist === undefined) return false;
    return detail.knowledge_exist.toString() === filter;
  });

  const handleChange = (index, value) => {
    const updatedQueries = [...localData];
    updatedQueries[index].assumptions = value;
    setLocalData(updatedQueries);
  };

  const handleUpdate = async () => {
    setEditIndex(null);
    setEditId(null);

    const updatedItem = localData.find((item) => item.id === editId);
    const assumptions = updatedItem?.assumptions || '';

    const postData = {
      id: editId,
      answer: assumptions,
    };

    try {
      await updateQueries(postData);
      showToast('Clarification updated successfully', 'success');
    } catch {
      showToast('Update failed', 'error');
    }
  };

  const handleEdit = (index, id) => {
    if (editIndex === index) {
      setEditIndex(null);
      setEditId(null);
    } else {
      setEditIndex(index);
      setEditId(id);
    }
  };

  const handleToggle = () => {
    if (typeof toggle !== 'function') return;
    if (!localData || localData.length === 0) {
      alert('Queries creation is in progress, please wait.');
      return;
    }
    toggle();
  };

  return (
    <Accordion
      title="Queries"
      isOpen={isOpen}
      toggle={handleToggle}
      icon={<span role="img" aria-label="query">❓</span>}
    >
      {/* Conditionally show filter if any valid options exist */}
      {(hasKnowledgeMissing || hasKnowledgeExists) && (
        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm font-bold">Filter by Type:</div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 p-2 rounded"
            disabled={hasNullKnowledge}
          >
            <option value="all">All</option>
            {hasKnowledgeMissing && <option value="0">Knowledge Missing</option>}
            {hasKnowledgeExists && <option value="1">Knowledge Exists</option>}
          </select>
        </div>
      )}

      {/* Query List */}
      {filteredData.length > 0 ? (
        filteredData.map((item, index) => (
          <div
            key={index}
            className={`px-4 border-b border-black py-5 last:border-none ${
              item.knowledge_exist === 0
                ? 'bg-red-100'
                : item.knowledge_exist === 1
                ? 'bg-green-100'
                : 'bg-white'
            }`}
          >
            <p className="font-bold text-blue-600">Query:</p>
            <p className="text-gray-700">{item.query}</p>
            <p className="font-bold text-green-600">Why:</p>
            <p className="text-gray-700">{item.why}</p>
            <p className="font-bold text-red-600 pt-4">
              Clarification:
              <button onClick={() => handleEdit(index, item.id)}>
                <img src={Edit} className="h-4 w-6" title="Edit" alt="Edit Icon" />
              </button>
              {editIndex === index && (
                <button onClick={handleUpdate}>
                  <img src={Update} className="h-4 w-6" title="Update" alt="Update Icon" />
                </button>
              )}
            </p>

            {editIndex === index ? (
              <textarea
                className="border border-gray-300 p-2 w-full rounded"
                value={item.assumptions || ''}
                onChange={(e) => handleChange(index, e.target.value)}
                rows={item.assumptions ? item.assumptions.split('\n').length : 3}
              />
            ) : (
              <p className="text-gray-700">{item.assumptions}</p>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-500">Queries creation in progress...</p>
      )}
    </Accordion>
  );
};

export default QueriesAccordion;
