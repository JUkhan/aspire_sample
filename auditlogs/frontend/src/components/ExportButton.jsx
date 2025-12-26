import { useState } from 'react';
import { exportLogs } from '../services/api';

export function ExportButton({ filters }) {
  const [isExporting, setIsExporting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  async function handleExport(format) {
    setIsExporting(true);
    setShowDropdown(false);

    try {
      await exportLogs(format, filters);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export logs. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="export-button-container">
      <button
        className="export-button"
        onClick={() => setShowDropdown(!showDropdown)}
        disabled={isExporting}
      >
        {isExporting ? (
          'Exporting...'
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="15" y2="3" />
            </svg>
            Export
          </>
        )}
      </button>

      {showDropdown && (
        <div className="export-dropdown">
          <button onClick={() => handleExport('json')}>
            Export as JSON
          </button>
          <button onClick={() => handleExport('csv')}>
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
