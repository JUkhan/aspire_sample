import { useState, useEffect } from 'react';
import { getFilterOptions } from '../services/api';

export function FilterPanel({ filters, onFilterChange }) {
  const [options, setOptions] = useState({
    actions: [],
    users: [],
    resources: []
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  async function loadFilterOptions() {
    try {
      const data = await getFilterOptions();
      setOptions(data);
    } catch (err) {
      console.error('Failed to load filter options:', err);
    }
  }

  function handleChange(field, value) {
    onFilterChange({
      ...filters,
      [field]: value || undefined
    });
  }

  function handleDateChange(field, value) {
    const dateValue = value ? new Date(value).toISOString() : undefined;
    onFilterChange({
      ...filters,
      [field]: dateValue
    });
  }

  function clearFilters() {
    onFilterChange({});
  }

  const hasActiveFilters = Object.values(filters).some(v => v);

  return (
    <div className="filter-panel">
      <div className="filter-group">
        <label>Start Date</label>
        <input
          type="datetime-local"
          onChange={(e) => handleDateChange('startTime', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>End Date</label>
        <input
          type="datetime-local"
          onChange={(e) => handleDateChange('endTime', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Action</label>
        <select
          value={filters.action || ''}
          onChange={(e) => handleChange('action', e.target.value)}
        >
          <option value="">All Actions</option>
          {options.actions.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>User</label>
        <select
          value={filters.userId || ''}
          onChange={(e) => handleChange('userId', e.target.value)}
        >
          <option value="">All Users</option>
          {options.users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.id})
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Resource</label>
        <select
          value={filters.resource || ''}
          onChange={(e) => handleChange('resource', e.target.value)}
        >
          <option value="">All Resources</option>
          {options.resources.map((resource) => (
            <option key={resource} value={resource}>
              {resource}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button className="clear-filters" onClick={clearFilters}>
          Clear Filters
        </button>
      )}
    </div>
  );
}

export default FilterPanel;
