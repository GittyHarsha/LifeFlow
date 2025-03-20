// TaskTracker.jsx
import React, { useState, useEffect } from 'react';
import { loadTasks, saveTasks } from './db';
import './TaskTracker.css';

function TaskTracker() {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');

  // Load tasks from IndexedDB on mount
  useEffect(() => {
    async function fetchTasks() {
      try {
        const storedTasks = await loadTasks();
        setTasks(storedTasks || []);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    }
    fetchTasks();
  }, []);

  // Save tasks to IndexedDB whenever tasks change
  useEffect(() => {
    async function persistTasks() {
      try {
        await saveTasks(tasks);
      } catch (error) {
        console.error("Error saving tasks:", error);
      }
    }
    persistTasks();
  }, [tasks]);

  const addTask = () => {
    if (!newTaskText.trim() || !newTaskDue) {
      alert('Please enter both a task description and a due date.');
      return;
    }
    const newTask = {
      id: Date.now(),
      text: newTaskText.trim(),
      dueDate: newTaskDue,
      priority: newTaskPriority,
      completed: false
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskText('');
    setNewTaskDue('');
    setNewTaskPriority('Medium');
  };

  const toggleComplete = (id) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  // Sort tasks by due date
  const sortedTasks = [...tasks].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );
  const now = new Date();

  return (
    <div className="tasktracker-wrapper">
      <div className="tasktracker-container">
        <h2 className="tasktracker-title">Task Tracker</h2>
        <p className="tasktracker-subtitle">
          Stay ahead of deadlines with task management.
        </p>
        <div className="tasktracker-form">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Task description"
            className="tasktracker-input"
          />
          <input
            type="date"
            value={newTaskDue}
            onChange={(e) => setNewTaskDue(e.target.value)}
            className="tasktracker-input"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value)}
            className="tasktracker-input"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>
          <button onClick={addTask} className="tasktracker-add-btn">
            Add Task
          </button>
        </div>
        {sortedTasks.length === 0 ? (
          <p className="tasktracker-no-tasks">No tasks yet. Add one to get started!</p>
        ) : (
          <ul className="tasktracker-list">
            {sortedTasks.map(task => {
              const dueDateObj = new Date(task.dueDate);
              const timeDiff = dueDateObj - now;
              const hoursDiff = timeDiff / (1000 * 60 * 60);
              let statusClass = '';
              if (timeDiff < 0) {
                statusClass = 'overdue';
              } else if (hoursDiff < 24) {
                statusClass = 'due-soon';
              }
              return (
                <li
                  key={task.id}
                  className={`tasktracker-item ${statusClass} ${task.completed ? 'completed' : ''}`}
                >
                  <div className="tasktracker-item-left">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="tasktracker-checkbox"
                    />
                    <div className="tasktracker-details">
                      <span className="tasktracker-text">{task.text}</span>
                      <span className="tasktracker-meta">
                        Due: {task.dueDate} | Priority: {task.priority} {statusClass && `| ${statusClass.replace('-', ' ')}`}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="tasktracker-delete-btn">
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default TaskTracker;
