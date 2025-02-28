import React, { useEffect, useState } from 'react';
import { loadGrid, saveGrid } from './db';

// The default projects if none in DB
const DEFAULT_PROJECTS = ['main', 'health', 'project', 'finance'];

/**
 * Generate an array of Dates in descending order (newest first),
 * for the user-specified date range or the last 10 days by default.
 */
function generateDaysInRange(minDate, maxDate, defaultDays = 10) {
  if (!minDate && !maxDate) {
    const today = new Date();
    const days = [];
    for (let i = 0; i < defaultDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days.sort((a, b) => b - a); // newest first
  }

  let start = minDate ? new Date(minDate) : null;
  let end = maxDate ? new Date(maxDate) : null;

  if (!start) {
    end = end || new Date();
    start = new Date(end);
    start.setDate(start.getDate() - (defaultDays - 1));
  }
  if (!end) {
    start = start || new Date();
    end = new Date(start);
    end.setDate(end.getDate() + (defaultDays - 1));
  }
  if (start > end) [start, end] = [end, start];

  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days.sort((a, b) => b - a); // newest first
}

/**
 * Format a Date object as YYYY-MM-DD
 */
function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Overlay (modal) component for editing goals of a single project
 */
function GoalsOverlay({ project, goals, onClose, onAddGoal, onRemoveGoal }) {
  const [newGoal, setNewGoal] = useState('');

  const handleAdd = () => {
    if (newGoal.trim()) {
      onAddGoal(newGoal.trim());
      setNewGoal('');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: '#fff',
          color: '#333',
          padding: '1rem',
          borderRadius: '8px',
          minWidth: '300px'
        }}
      >
        <h3>Goals for {project.toUpperCase()}</h3>
        <ul style={{ maxHeight: '200px', overflowY: 'auto', margin: '1rem 0' }}>
          {goals.map((g, i) => (
            <li key={i} style={{ marginBottom: '0.5rem' }}>
              {g}
              <button
                onClick={() => onRemoveGoal(i)}
                style={{
                  marginLeft: '0.5rem',
                  background: 'red',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                X
              </button>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="New Goal"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={handleAdd}>Add</button>
        </div>
        <div style={{ textAlign: 'right', marginTop: '1rem' }}>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/**
 * Main GridEditor component
 */
export default function GridEditor({ minDate, maxDate }) {
  // The entire grid data, including projects, cells, and now goals
  const [grid, setGrid] = useState({
    projects: DEFAULT_PROJECTS,
    cells: {},
    goals: {} // { projectName: [ 'Goal1', 'Goal2', ... ] }
  });

  const [days, setDays] = useState([]);
  const [editingProject, setEditingProject] = useState(null); // which project is open in the goals overlay?

  // Load from IndexedDB on mount
  useEffect(() => {
    (async () => {
      const data = await loadGrid();
      if (data) {
        // Make sure data has 'goals' field
        if (!data.goals) {
          data.goals = {};
        }
        setGrid(data);
      }
    })();
  }, []);

  // Regenerate days array whenever filter changes
  useEffect(() => {
    const dayObjs = generateDaysInRange(minDate, maxDate, 10);
    setDays(dayObjs.map(formatDate));
  }, [minDate, maxDate]);

  // Save grid data to IndexedDB whenever grid changes
  useEffect(() => {
    saveGrid(grid).catch(console.error);
  }, [grid]);

  // Add a new project column (unchanged from your existing logic)
  const handleAddProject = () => {
    const newProj = prompt('Enter new project name:');
    if (!newProj) return;
    if (grid.projects.some((p) => p.toLowerCase() === newProj.toLowerCase())) {
      alert('Project already exists.');
      return;
    }
    setGrid((prev) => ({
      ...prev,
      projects: [...prev.projects, newProj],
      // also init goals array if not present
      goals: {
        ...prev.goals,
        [newProj]: []
      }
    }));
  };

  // Delete a project column
  const handleDeleteProject = (proj) => {
    if (proj.toLowerCase() === 'main') {
      alert('Cannot delete the main project.');
      return;
    }
    if (!window.confirm(`Delete project "${proj}"? This will remove all its cell data.`)) {
      return;
    }
    setGrid((prev) => {
      const newProjects = prev.projects.filter((p) => p !== proj);
      const newCells = { ...prev.cells };
      Object.keys(newCells).forEach((key) => {
        if (key.endsWith(`_${proj}`)) {
          delete newCells[key];
        }
      });
      const newGoals = { ...prev.goals };
      delete newGoals[proj];
      return {
        ...prev,
        projects: newProjects,
        cells: newCells,
        goals: newGoals
      };
    });
  };

  // Handle changes in cell text
  const handleCellChange = (day, proj, value) => {
    setGrid((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [`${day}_${proj}`]: value
      }
    }));
  };

  // =============== GOALS LOGIC ===============

  // Show the overlay for a given project
  const openGoalsOverlay = (proj) => {
    setEditingProject(proj);
  };

  // Close the overlay
  const closeGoalsOverlay = () => {
    setEditingProject(null);
  };

  // Add a new goal to the active project
  const addGoal = (goal) => {
    if (!editingProject) return;
    setGrid((prev) => {
      const oldGoals = prev.goals[editingProject] || [];
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [editingProject]: [...oldGoals, goal]
        }
      };
    });
  };

  // Remove a goal by index
  const removeGoal = (index) => {
    if (!editingProject) return;
    setGrid((prev) => {
      const oldGoals = prev.goals[editingProject] || [];
      const newGoals = [...oldGoals];
      newGoals.splice(index, 1);
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [editingProject]: newGoals
        }
      };
    });
  };

  // ===========================================

  // Ensure grid.goals is present
  if (!grid.goals) {
    grid.goals = {};
  }

  return (
    <div className="grid-container">
      <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
        <button onClick={handleAddProject}>+ Add New Project</button>
      </div>

      {/** Table with date rows and project columns **/}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            {grid.projects.map((proj) => (
              <th key={proj} className="project-header">
                {/* The project name */}
                <span>{proj.toUpperCase()}</span>
                {/* Button to delete project */}
                {proj.toLowerCase() !== 'main' && (
                  <button
                    className="delete-project"
                    onClick={() => handleDeleteProject(proj)}
                  >
                    X
                  </button>
                )}
                {/* Goals Button */}
                <button
                  onClick={() => openGoalsOverlay(proj)}
                  style={{
                    marginLeft: '0.5rem',
                    background: '#555',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.75rem'
                  }}
                >
                  Goals
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr key={day}>
              <td>{day}</td>
              {grid.projects.map((proj) => {
                const cellKey = `${day}_${proj}`;
                return (
                  <td key={proj}>
                    <textarea
                      className="cell-textarea"
                      value={grid.cells[cellKey] || ''}
                      onChange={(e) => handleCellChange(day, proj, e.target.value)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Conditionally render the Goals overlay if editingProject is set */}
      {editingProject && (
        <GoalsOverlay
          project={editingProject}
          goals={grid.goals[editingProject] || []}
          onClose={closeGoalsOverlay}
          onAddGoal={addGoal}
          onRemoveGoal={removeGoal}
        />
      )}
    </div>
  );
}
