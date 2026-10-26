import React from 'react';

const Chart: React.FC = () => {
  // Mock data for chart visualization
  const data = [65, 78, 90, 81, 56, 85, 95];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxValue = Math.max(...data);

  return (
    <div className="relative">
      <div className="flex items-end justify-between h-64 space-x-2">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-sm transition-all duration-500 hover:opacity-80"
              style={{ height: `${(value / maxValue) * 100}%` }}
            ></div>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
              {labels[index]}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Daily Visits</span>
        </div>
      </div>
    </div>
  );
};

export default Chart;