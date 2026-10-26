import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faPlus, 
  faTrash, 
  faGripVertical,
  faSave,
  faSpinner,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

const CreateSuiteModal = ({ 
  isOpen, 
  onClose, 
  projectId, 
  onCreateSuite,
  User,
  availableExecutions = [] // Array of available executions to choose from
}) => {
  const [suiteName, setSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [createdBy, setCreatedBy] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Set createdBy from User prop - handle both string and object
  useEffect(() => {
    if (User) {
      // If User is a string, use it directly
      if (typeof User === 'string') {
        setCreatedBy(User);
        console.log('CreatedBy set to (string):', User);
      } 
      // If User is an object with name property
      else if (User.name) {
        setCreatedBy(User.name);
        console.log('CreatedBy set to (object.name):', User.name);
      }
      // If User is an object with username property
      else if (User.username) {
        setCreatedBy(User.username);
        console.log('CreatedBy set to (object.username):', User.username);
      }
    }
  }, [User]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  console.log('CreateSuiteModal User:', User);
  console.log('CreateSuiteModal createdBy:', createdBy);
  
  const resetForm = () => {
    setSuiteName('');
    setDescription('');
    // Handle both string and object for User
    if (User) {
      if (typeof User === 'string') {
        setCreatedBy(User);
      } else if (User.name) {
        setCreatedBy(User.name);
      } else if (User.username) {
        setCreatedBy(User.username);
      }
    }
    setItems([]);
    setErrors({});
    setLoading(false);
  };

  // Add new item
  const addItem = () => {
    const newItem = {
      execution_id: '',
      data_row_id: '',
      execution_order: items.length + 1,
      enabled: true
    };
    setItems([...items, newItem]);
  };

  // Remove item
  const removeItem = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    // Reorder remaining items
    const reorderedItems = updatedItems.map((item, idx) => ({
      ...item,
      execution_order: idx + 1
    }));
    setItems(reorderedItems);
  };

  // Update item field
  const updateItem = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  // Move item up/down
  const moveItem = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    const updatedItems = [...items];
    const temp = updatedItems[index];
    updatedItems[index] = updatedItems[newIndex];
    updatedItems[newIndex] = temp;
    
    // Update execution orders
    updatedItems.forEach((item, idx) => {
      item.execution_order = idx + 1;
    });
    
    setItems(updatedItems);
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!suiteName.trim()) {
      newErrors.suiteName = 'Suite name is required';
    }
    
    if (items.length === 0) {
      newErrors.items = 'At least one test item is required';
    }
    
    items.forEach((item, index) => {
      if (!item.execution_id) {
        newErrors[`item_${index}_execution_id`] = 'Execution ID is required';
      }
      if (!item.data_row_id && item.data_row_id !== 0) {
        newErrors[`item_${index}_data_row_id`] = 'Data Row ID is required';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      const payload = {
        suite_name: suiteName.trim(),
        description: description.trim() || undefined,
        created_by: createdBy,
        project_id: parseInt(projectId),
        items: items.map(item => ({
          execution_id: parseInt(item.execution_id),
          data_row_id: parseInt(item.data_row_id),
          execution_order: parseInt(item.execution_order),
          enabled: item.enabled
        }))
      };
      
      await onCreateSuite(payload);
      onClose();
    } catch (error) {
      console.error('Error creating suite:', error);
      setErrors({ submit: error.message || 'Failed to create suite' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Create Test Suite</h2>
              <p className="text-sm text-gray-500 mt-0.5">Add test cases to build your test suite</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-500 text-lg" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
            {/* Form */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Suite Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={suiteName}
                      onChange={(e) => setSuiteName(e.target.value)}
                      placeholder="Enter suite name"
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        errors.suiteName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500'
                      } focus:ring-2 focus:border-transparent outline-none transition`}
                    />
                    {errors.suiteName && (
                      <p className="mt-1 text-sm text-red-600">{errors.suiteName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Created By
                    </label>
                    <input
                      type="text"
                      value={createdBy}
                      disabled
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed focus:outline-none"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter suite description (optional)"
                    rows="2"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none"
                  />
                </div>
              </div>

              {/* Test Items */}
              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700">Test Items</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Add test cases to include in this suite
                    </p>
                  </div>
                  <button
                    onClick={addItem}
                    className="px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-1.5"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-xs" />
                    <span>Add Item</span>
                  </button>
                </div>

                {errors.items && (
                  <p className="mb-3 text-sm text-red-600">{errors.items}</p>
                )}

                {/* Items List */}
                {items.length > 0 ? (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          {/* Drag handle */}
                          <div className="flex flex-col items-center gap-1 pt-1">
                            <button
                              onClick={() => moveItem(index, -1)}
                              disabled={index === 0}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <FontAwesomeIcon icon={faGripVertical} className="text-gray-300" />
                            <button
                              onClick={() => moveItem(index, 1)}
                              disabled={index === items.length - 1}
                              className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            >
                              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>

                          {/* Item fields */}
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Execution ID <span className="text-red-500">*</span>
                              </label>
                     <input
  type="number"
  min="0"
  value={item.execution_id}
  onChange={(e) => {
    const value = e.target.value;

    if (value === '') {
      updateItem(index, 'execution_id', '');
      return;
    }

    updateItem(
      index,
      'execution_id',
      Math.max(0, parseInt(value, 10) || 0)
    );
  }}
  placeholder="e.g., 372"
  className={`w-full px-3 py-2 text-sm rounded-lg border ${
    errors[`item_${index}_execution_id`] ? 'border-red-300' : 'border-gray-300'
  } focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition`}
/>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Data Row ID <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="number"
                                value={item.data_row_id}
                                onChange={(e) => {
  const value = e.target.value;
  if (value === '') {
    updateItem(index, 'data_row_id', '');
    return;
  }

  updateItem(index, 'data_row_id', Math.max(0, parseInt(value, 10) || 0));
}}
                                placeholder="e.g., 1"
                                className={`w-full px-3 py-2 text-sm rounded-lg border ${
                                  errors[`item_${index}_data_row_id`] ? 'border-red-300' : 'border-gray-300'
                                } focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition`}
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Order #{item.execution_order}
                                </label>
                                <input
                                  type="number"
                                  value={item.execution_order}
                                  onChange={(e) => updateItem(index, 'execution_order', parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                                />
                              </div>
                              <button
                                onClick={() => removeItem(index)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove item"
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-4xl mb-2">📋</div>
                    <p className="text-gray-500 text-sm">No test items added yet</p>
                    <p className="text-gray-400 text-xs mt-1">Click "Add Item" to include test cases</p>
                  </div>
                )}
              </div>

              {/* Error message */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {errors.submit}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  <span>Create Suite</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSuiteModal;