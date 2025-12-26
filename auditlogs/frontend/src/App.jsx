import { useState, useEffect, useCallback } from 'react';
import { AuditLogTable } from './components/AuditLogTable';
import { FilterPanel } from './components/FilterPanel';
import { SearchBar } from './components/SearchBar';
import { ExportButton } from './components/ExportButton';
import { useAuditStream } from './hooks/useAuditStream';
import { getLogs, searchLogs } from './services/api';

function App() {
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ offset: 0, limit: 50, hasMore: false });

  const {
    logs,
    isConnected,
    newLogCount,
    initializeLogs,
    clearNewLogCount
  } = useAuditStream();

  // Load logs when filters change
  useEffect(() => {
    loadLogs();
  }, [filters]);

  async function loadLogs() {
    setLoading(true);
    try {
      const result = await getLogs({ ...filters, limit: 50, offset: 0 });
      initializeLogs(result.logs);
      setPagination({
        offset: result.offset,
        limit: result.limit,
        hasMore: result.hasMore
      });
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      loadLogs();
      return;
    }

    setLoading(true);
    try {
      const result = await searchLogs(query);
      initializeLogs(result.logs);
      setPagination({ offset: 0, limit: 50, hasMore: false });
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [initializeLogs]);

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setSearchQuery('');
    clearNewLogCount();
  }

  async function loadMore() {
    if (!pagination.hasMore || loading) return;

    setLoading(true);
    try {
      const newOffset = pagination.offset + pagination.limit;
      const result = await getLogs({ ...filters, limit: 50, offset: newOffset });
      initializeLogs([...logs, ...result.logs]);
      setPagination({
        offset: newOffset,
        limit: result.limit,
        hasMore: result.hasMore
      });
    } catch (err) {
      console.error('Failed to load more logs:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleRefresh() {
    clearNewLogCount();
    loadLogs();
  }

  return (
    <div className="app">
      <header className="header">
        <h1>Audit Logs Dashboard</h1>
        <div className="header-status">
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
          {newLogCount > 0 && (
            <button className="new-logs-badge" onClick={handleRefresh}>
              {newLogCount} new log{newLogCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </header>

      <div className="toolbar">
        <SearchBar onSearch={handleSearch} />
        <ExportButton filters={filters} />
      </div>

      <FilterPanel filters={filters} onFilterChange={handleFilterChange} />

      <main className="main-content">
        <AuditLogTable logs={logs} loading={loading && logs.length === 0} />

        {pagination.hasMore && !searchQuery && (
          <div className="load-more">
            <button onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Showing {logs.length} audit log entries</p>
      </footer>
    </div>
  );
}

export default App;
