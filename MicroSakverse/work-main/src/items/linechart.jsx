import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

// Function to generate random numbers
const generateRandomData = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const options = {
  responsive: true,
  plugins: {
    title: {
      display: false, // Hide chart title
    },
    legend: {
      display: true, // Show legend
    },
  },
  scales: {
    y: {
      ticks: {
        display: false, // Hide y-axis ticks
      },
      grid: {
        color: 'white', // Set the background color of the y-axis grid to white
      },
    },
    x: {
      grid: {
        color: 'white', // Set the background color of the x-axis grid to white
      },
    },
  },
};

const labels = [0,10,20,30,40,50,60,70,80,90,100];
const blueLineData = [
    { x: labels[0], y: 0 },
    { x: labels[1], y: 15 },
    { x: labels[2] , y: 30 }, // Add extra point to extend graph
  ];
  
const data = {
  labels,
  datasets: [
    {
      label: 'Dataset 1',
      data: blueLineData,
      borderColor: '#4199FE', // Blue color
      backgroundColor: '#4199FE',
    },
    {
      label: 'Dataset 2',
      data: labels.map(x => ({ x, y: x })), // Linear graph for orange line
      borderColor: '#F5821F', // Orange color
      backgroundColor: '#F5821F',
    },
  ],
};

function LineChart() {
  return (
    <div className="w-full h-full flex items-center">
      <h1 className="text-m font-bold  -mx-8 -ml-16  transform rotate-90 scale-x-[-1] scale-y-[-1]">28/01/2024</h1>
      <Line className="inline-block" options={options} data={data} />
    </div>
  );
}

export default LineChart;
