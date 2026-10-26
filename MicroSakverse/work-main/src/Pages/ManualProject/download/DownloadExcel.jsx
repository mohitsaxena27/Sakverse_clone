import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { useDownloadExcel } from '../../../Hooks/Manual/UserData';
import showToast from '../../../items/ToastMessage/toastUtil';

const DownloadExcel = ({
  projectId,
  selectedStoryId,
  selectedstatus,
  selectedstage,
  isStoryCompleted
}) => {
  const { downloadExcelFile } = useDownloadExcel();

  const handleDownload = async () => {
    if (!isStoryCompleted) {
      showToast('Userstory not yet Completed', 'error');
      return;
    }

    try {
      await downloadExcelFile(projectId, selectedStoryId);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <button
      onClick={handleDownload}
      className="download-button text-green-500"
    >
      {/* ✅ Fixed */}
      <FontAwesomeIcon icon={faDownload} size="lg" />
      {/* OR: className="text-lg" */}
    </button>
  );
};

export default DownloadExcel;
