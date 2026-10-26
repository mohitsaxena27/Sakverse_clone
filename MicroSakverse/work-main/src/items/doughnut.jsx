import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function Graph() {
  const data = {
    labels: ['Pass %', 'Fail %'], // Moved labels here
    datasets: [{
      label: 'Poll',
      data: [60, 40],
      backgroundColor: ['#F5821F', '#4199FE'],
      borderColor: ['#F5821F', '#4199FE'],
    }],
  };

  const options = {
    cutout: 90,
    plugins: {
      legend: {
        position: 'bottom', // Set legend position to bottom
        labels: {
          boxWidth: 10, // Width of the square
          boxHeight: 10, // Height of the square
        },
      },
    },
  };

  return (
    <div className="Graph">
      <h1 className='p-[20px]'></h1>
      <div className='h-60 w-60'>
        <Doughnut
          data={data}
          options={options}
        />
      </div>
    </div>
  );
}

export default Graph;
