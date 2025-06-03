import React from 'react';
import ReactDOM from 'react-dom/client';
import SurvivorRankings from './components/SurvivorRankings';
import './index.css'; // You would need to create this file for Tailwind CSS
import './styles/imageOptimizations.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <SurvivorRankings />
  </React.StrictMode>
);