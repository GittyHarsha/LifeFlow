import React, { useRef } from 'react';
import { loadGrid, saveGrid } from './db';

const ExportImport = ({ onDataChange }) => {
  const fileInputRef = useRef(null);

  // Export the current grid data as a JSON file
  const handleExport = async () => {
    try {
      const data = await loadGrid();
      const dataStr = JSON.stringify(data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lifeflow-grid-data.json';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Click the hidden file input when user clicks the 'Import Data' button
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Actually handle the file import when file input changes
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const importedData = JSON.parse(evt.target.result);
        await saveGrid(importedData);
        // Notify parent so it can reload or refresh
        if (onDataChange) {
          onDataChange(importedData);
        }
      } catch (error) {
        console.error('Import failed:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ textAlign: 'center', margin: '1rem' }}>
      {/* Export Button */}
      <button class="button" onClick={handleExport} style={{ marginRight: '1rem' }}>
        Export Data
      </button>

      {/* Import Button (opens hidden file input) */}
      <button class="button" onClick={handleImportClick}>
        Import Data
      </button>

      {/* Hidden file input */}
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleImport}
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ExportImport;
