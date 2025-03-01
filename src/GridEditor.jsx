import React, { useEffect, useState } from 'react';
import { FaTrash, FaArchive, FaBullseye } from 'react-icons/fa';
import { loadGrid, saveGrid } from './db';

// Default projects: now as objects with a name and archived flag.
const DEFAULT_PROJECTS = [
  { name: 'main', archived: false },
  { name: 'health', archived: false },
  { name: 'project', archived: false },
  { name: 'finance', archived: false }
];

/**
 * Generate an array of Date objects in descending order (newest first)
 * for the given date range or the last 10 days by default.
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
    return days.sort((a, b) => b - a);
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
  return days.sort((a, b) => b - a);
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
 * Overlay (modal) component for editing goals of a project.
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
                <FaTrash size={12} />
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
 * Main GridEditor component.
 */
export default function GridEditor({ minDate, maxDate }) {
  // Grid data includes projects, cells, and goals.
  const [grid, setGrid] = useState({
    projects: DEFAULT_PROJECTS,
    cells: {},
    goals: {} // { projectName: [ 'Goal1', 'Goal2', ... ] }
  });
  const [days, setDays] = useState([]);
  const [activeGoalsProj, setActiveGoalsProj] = useState(null);

  // Load grid data from IndexedDB on mount.
  useEffect(() => {
    (async () => {
      const data = await loadGrid();
      if (data) {
        if (!data.goals) data.goals = {};
        setGrid(data);
      }
    })();
  }, []);

  // Regenerate days array whenever filter changes.
  useEffect(() => {
    const dayObjs = generateDaysInRange(minDate, maxDate, 10);
    setDays(dayObjs.map(formatDate));
  }, [minDate, maxDate]);

  // Save grid data to IndexedDB whenever grid changes.
  useEffect(() => {
    saveGrid(grid).catch(console.error);
  }, [grid]);

  // Active (non-archived) projects.
  const activeProjects = grid.projects.filter((p) => !p.archived);
  // Archived projects.
  const archivedProjects = grid.projects.filter((p) => p.archived);

  // Update cell text.
  const handleCellChange = (day, projName, value) => {
    setGrid((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [`${day}_${projName}`]: value
      }
    }));
  };

  // Add a new project (active by default).
  const handleAddProject = () => {
    const newProj = prompt('Enter new project name:');
    if (!newProj) return;
    if (grid.projects.some((p) => p.name.toLowerCase() === newProj.toLowerCase())) {
      alert('Project already exists.');
      return;
    }
    setGrid((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: newProj, archived: false }],
      goals: { ...prev.goals, [newProj]: [] }
    }));
  };

  // Delete a project.
  const handleDeleteProject = (projName) => {
    if (projName.toLowerCase() === 'main') {
      alert('Cannot delete the main project.');
      return;
    }
    if (!window.confirm(`Delete project "${projName}"? This will remove all its cell data.`)) return;
    setGrid((prev) => {
      const newProjects = prev.projects.filter((p) => p.name !== projName);
      const newCells = { ...prev.cells };
      Object.keys(newCells).forEach((key) => {
        if (key.endsWith(`_${projName}`)) {
          delete newCells[key];
        }
      });
      const newGoals = { ...prev.goals };
      delete newGoals[projName];
      return { ...prev, projects: newProjects, cells: newCells, goals: newGoals };
    });
  };

  // Archive a project.
  const handleArchiveProject = (projName) => {
    if (projName.toLowerCase() === 'main') {
      alert('Cannot archive the main project.');
      return;
    }
    setGrid((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.name === projName ? { ...p, archived: true } : p
      )
    }));
  };

  // Unarchive a project.
  const handleUnarchiveProject = (projName) => {
    setGrid((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.name === projName ? { ...p, archived: false } : p
      )
    }));
  };

  // =============== GOALS LOGIC ===============
  // Open goals overlay for a project.
  const openGoalsOverlay = (projName) => {
    setActiveGoalsProj(projName);
  };
  const closeGoalsOverlay = () => {
    setActiveGoalsProj(null);
  };
  // Add a goal for the active project.
  const addGoal = (goal) => {
    if (!activeGoalsProj) return;
    setGrid((prev) => {
      const oldGoals = prev.goals[activeGoalsProj] || [];
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [activeGoalsProj]: [...oldGoals, goal]
        }
      };
    });
  };
  // Remove a goal by index from the active project.
  const removeGoal = (index) => {
    if (!activeGoalsProj) return;
    setGrid((prev) => {
      const oldGoals = prev.goals[activeGoalsProj] || [];
      const newGoals = [...oldGoals];
      newGoals.splice(index, 1);
      return {
        ...prev,
        goals: {
          ...prev.goals,
          [activeGoalsProj]: newGoals
        }
      };
    });
  };
  // ===========================================

  return (
    <div>
      <div className="grid-container">
        <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
          <button onClick={handleAddProject}>+ Add New Project</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              {activeProjects.map((proj) => (
                <th key={proj.name} className="project-header">
                  <span>{proj.name.toUpperCase()}</span>
                  {proj.name.toLowerCase() !== 'main' && (
                    <>
                      <button
                        className="action-button delete-project"
                        onClick={() => handleDeleteProject(proj.name)}
                      >
                        <FaTrash size={12} />
                      </button>
                      <button
                        className="action-button archive-project"
                        onClick={() => handleArchiveProject(proj.name)}
                      >
                        <FaArchive size={12} />
                      </button>
                    </>
                  )}
                  <button
                    className="action-button goals-project"
                    onClick={() => openGoalsOverlay(proj.name)}
                  >
                    <FaBullseye size={12} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <td>{day}</td>
                {activeProjects.map((proj) => {
                  const cellKey = `${day}_${proj.name}`;
                  return (
                    <td key={proj.name}>
                      <textarea
                        className="cell-textarea"
                        value={grid.cells[cellKey] || ''}
                        onChange={(e) => handleCellChange(day, proj.name, e.target.value)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Archived Projects Section */}
      <div className="grid-container" style={{ marginTop: '2rem' }}>
        <h3 style={{ textAlign: 'center' }}>Archived Projects</h3>
        {archivedProjects.length === 0 ? (
          <p style={{ textAlign: 'center' }}>No archived projects.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Unarchive</th>
                <th>Delete</th>
                <th>Goals</th>
              </tr>
            </thead>
            <tbody>
              {archivedProjects.map((proj) => (
                <tr key={proj.name}>
                  <td>{proj.name.toUpperCase()}</td>
                  <td>
                    <button onClick={() => handleUnarchiveProject(proj.name)}>
                      <FaArchive size={12} />
                    </button>
                  </td>
                  <td>
                    <button onClick={() => handleDeleteProject(proj.name)}>
                      <FaTrash size={12} />
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => openGoalsOverlay(proj.name)}
                      className="action-button goals-project"
                    >
                      <FaBullseye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Goals Overlay Modal */}
      {activeGoalsProj && (
        <GoalsOverlay
          project={activeGoalsProj}
          goals={grid.goals[activeGoalsProj] || []}
          onClose={closeGoalsOverlay}
          onAddGoal={addGoal}
          onRemoveGoal={removeGoal}
        />
      )}
    </div>
  );
}
