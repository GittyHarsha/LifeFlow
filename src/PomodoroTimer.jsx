// PomodoroTimer.jsx
import React, { useState, useEffect, useRef } from 'react';
import './PomodoroTimer.css';

const sessionDurations = {
  Work: 25 * 60,       // 25 minutes
  'Short Break': 5 * 60,  // 5 minutes
  'Long Break': 15 * 60   // 15 minutes
};

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

const PomodoroTimer = () => {
  const [sessionType, setSessionType] = useState('Work');
  const [timeLeft, setTimeLeft] = useState(sessionDurations['Work']);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);

  // Update timer whenever session type changes
  useEffect(() => {
    setTimeLeft(sessionDurations[sessionType]);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, [sessionType]);

  // Countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(intervalRef.current);
    } else if (timeLeft === 0) {
      setIsRunning(false);
      clearInterval(intervalRef.current);
      alert(`${sessionType} session ended!`);
    }
  }, [isRunning, timeLeft, sessionType]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(sessionDurations[sessionType]);
  };

  return (
    <div className="pomodoro-container">
      <h2 className="pomodoro-title">Pomodoro Timer</h2>
      <div className="pomodoro-display">{formatTime(timeLeft)}</div>
      <div className="pomodoro-controls">
        {isRunning ? (
          <button onClick={handlePause} className="pomodoro-btn">Pause</button>
        ) : (
          <button onClick={handleStart} className="pomodoro-btn">Start</button>
        )}
        <button onClick={handleReset} className="pomodoro-btn">Reset</button>
      </div>
      <div className="pomodoro-session">
        <label htmlFor="session-select">Session: </label>
        <select
          id="session-select"
          value={sessionType}
          onChange={(e) => setSessionType(e.target.value)}
        >
          {Object.keys(sessionDurations).map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PomodoroTimer;
