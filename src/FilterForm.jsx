import React, { useState } from 'react';

export default function FilterForm({ onFilter }) {
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({ minDate, maxDate });
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '1rem', display: 'flex', gap: '1rem' }}>
      <label>
        Min Date:
        <input
          type="date"
          value={minDate}
          onChange={(e) => setMinDate(e.target.value)}
          style={{ marginLeft: '4px' }}
        />
      </label>
      <label>
        Max Date:
        <input
          type="date"
          value={maxDate}
          onChange={(e) => setMaxDate(e.target.value)}
          style={{ marginLeft: '4px' }}
        />
      </label>
      <button type="submit">Apply Filter</button>
    </form>
  );
}
