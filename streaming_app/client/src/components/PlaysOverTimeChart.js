import React from 'react';
import { Line } from 'react-chartjs-2';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function PlaysOverTimeChart({ data = [] }) {
  // data: [{ date: '2025-08-01', plays: 3 }, ...]
  const chartData = {
    labels: data.map(d => d.date),
    datasets: [
      {
        label: 'Plays',
        data: data.map(d => d.plays),
        borderColor: '#1DB954',
        backgroundColor: 'rgba(29,185,84,0.2)',
        tension: 0.3,
        fill: true,
        pointRadius: 3,
      },
    ],
  };
  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      x: { grid: { color: '#333' }, ticks: { color: '#aaa' } },
      y: { grid: { color: '#333' }, ticks: { color: '#aaa' }, beginAtZero: true },
    },
  };
  return (
    <div style={{ background: '#23272f', borderRadius: 12, padding: 16, marginBottom: 24 }}>
      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>Plays Over Time</div>
      <Line data={chartData} options={options} height={180} />
    </div>
  );
}
