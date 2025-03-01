import React, { useState } from 'react';
import FilterForm from './FilterForm';
import GridEditor from './GridEditor';
import './index.css';
import ExportImport from './ExportImport';
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

  const handleFilter = (range) => {
    setFilterRange(range);
  };
  
  // This callback can force a refresh of your grid if needed.
  const handleDataChange = (newData) => {
    // Option 1: Force a reload
    window.location.reload();
    // Option 2: If GridEditor listens to props or state changes, update your state here.
  };
  const cycleTheme = () => {
    setThemeIndex((prevIndex) => (prevIndex + 1) % themes.length);
  };

  return (
    <div className={`app-container theme-${themes[themeIndex]}`}>
      <div style={{ textAlign: 'center', margin: '1rem' }}>
        <button onClick={cycleTheme}>Switch Theme</button>
        <p>Current Theme: {themes[themeIndex]}</p>
      </div>
      <ExportImport onDataChange={handleDataChange} />
      <FilterForm onFilter={handleFilter} />
      <GridEditor minDate={filterRange.minDate} maxDate={filterRange.maxDate} />
    </div>
  );
}

export default App;
