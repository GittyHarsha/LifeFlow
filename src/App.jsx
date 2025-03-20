// App.jsx
import React, { useState } from 'react';
import FilterForm from './FilterForm';
import GridEditor from './GridEditor';
import ExportImport from './ExportImport';
import TaskTracker from './TaskTracker'; // New task tracker component
import { loadGrid } from './db';
import './index.css';

const themes = [
  'material',
  'dark',
  'vintage',
  'cyberpunk',
  'scandi',
  'retro',
  'pastel',
  'highcontrast',
  'aqua',
  'futuristic',
  'neon',
  'minimal',
  'industrial',
  'pastel2',
  'geometric',
  'organic',
  'space',
  'forest',
  'sunset',
  'ocean'
];

function App() {
  const [filterRange, setFilterRange] = useState({ minDate: '', maxDate: '' });
  const [themeIndex, setThemeIndex] = useState(Math.floor(Math.random() * themes.length));
  const [activeFeature, setActiveFeature] = useState("journal"); // "journal" or "tasks"

  const handleFilter = (range) => {
    setFilterRange(range);
  };

  // This callback can force a refresh of your grid if needed.
  const handleDataChange = (newData) => {
    window.location.reload();
  };

  const cycleTheme = () => {
    setThemeIndex((prevIndex) => (prevIndex + 1) % themes.length);
  };

  return (
    <div className={`app-container theme-${themes[themeIndex]}`}>
      <header style={{ textAlign: 'center', margin: '1rem 0' }}>
        <button onClick={() => setActiveFeature("journal")}>Journal</button>
        <button onClick={() => setActiveFeature("tasks")}>Task Tracker</button>
        <button onClick={cycleTheme}>Switch Theme</button>
        <p>Current Theme: {themes[themeIndex]}</p>
      </header>
      {activeFeature === "journal" && (
        <>
          <ExportImport onDataChange={handleDataChange} />
          <FilterForm onFilter={handleFilter} />
          <GridEditor minDate={filterRange.minDate} maxDate={filterRange.maxDate} />
        </>
      )}
      {activeFeature === "tasks" && <TaskTracker />}
    </div>
  );
}

export default App;
