import React, { useState, useEffect, useCallback } from 'react';
import { useAlerts } from '../context/AlertContext';
import { useDevice } from '../context/DeviceContext';
import { useToast } from '../context/ToastContext';
import { AlertsHeader } from '../components/alerts/AlertsHeader';
import { AlertSummary } from '../components/alerts/AlertSummary';
import { ActiveAlerts } from '../components/alerts/ActiveAlerts';
import { AlertFilters } from '../components/alerts/AlertFilters';
import { AlertList } from '../components/alerts/AlertList';
import { AlertDetails } from '../components/alerts/AlertDetails';
import { AlertError } from '../components/alerts/AlertError';
import { DemoAlertControls } from '../components/alerts/DemoAlertControls';

export function Alerts() {
  const {
    alerts,
    activeAlerts,
    unreadCount,
    summary,
    loading,
    error,
    loadAlerts,
    refreshSummaryAndCount,
    markAsRead,
    markAllAsRead,
    resolveAlert
  } = useAlerts();

  const { device, triggerDemoScenario } = useDevice();
  const { addToast } = useToast();

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [page, setPage] = useState(1);
  const [selectedAlert, setSelectedAlert] = useState(null);

  // Load alerts when filters change
  const fetchFilteredAlerts = useCallback(() => {
    loadAlerts({
      search,
      status: statusFilter,
      severity: severityFilter,
      type: typeFilter,
      sort: sortOption,
      page,
      limit: 50
    });
  }, [loadAlerts, search, statusFilter, severityFilter, typeFilter, sortOption, page]);

  useEffect(() => {
    fetchFilteredAlerts();
  }, [fetchFilteredAlerts]);

  // Action handlers
  const handleMarkAllRead = async () => {
    await markAllAsRead();
    addToast('All alerts marked as read.', 'success');
  };

  const handleMarkRead = async (id) => {
    await markAsRead(id);
    addToast('Alert marked as read.', 'info');
  };

  const handleResolve = async (id) => {
    await resolveAlert(id);
    addToast('Alert resolved successfully.', 'success');
    if (selectedAlert?.id === id) {
      setSelectedAlert(null);
    }
  };

  const handleDemoTest = async (testKey) => {
    if (triggerDemoScenario) {
      await triggerDemoScenario(testKey);
      await refreshSummaryAndCount();
      await fetchFilteredAlerts();
      addToast(`Simulated demo event: ${testKey.replace(/_/g, ' ')}`, 'info');
    }
  };

  const handleResetDemo = async () => {
    if (triggerDemoScenario) {
      await triggerDemoScenario('reset_demo');
      await refreshSummaryAndCount();
      await fetchFilteredAlerts();
      addToast('Demo environment restored to baseline.', 'success');
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Header */}
      <AlertsHeader
        onMarkAllRead={handleMarkAllRead}
        onRefresh={() => {
          fetchFilteredAlerts();
          refreshSummaryAndCount();
        }}
        unreadCount={unreadCount}
      />

      {/* Summary Cards */}
      <AlertSummary summary={summary} />

      {/* Demo Controls (Only when in Demo Mode) */}
      {(device?.isDemo || device?.id === 'ESP32-DEMO-001') && (
        <DemoAlertControls
          isDemo={true}
          onTriggerTest={handleDemoTest}
          onResetDemo={handleResetDemo}
        />
      )}

      {/* Active Alerts Banner / Section */}
      <ActiveAlerts
        activeAlerts={activeAlerts}
        onResolve={handleResolve}
      />

      {/* Filters and Search Bar */}
      <AlertFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        status={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setPage(1);
        }}
        severity={severityFilter}
        onSeverityChange={(val) => {
          setSeverityFilter(val);
          setPage(1);
        }}
        type={typeFilter}
        onTypeChange={(val) => {
          setTypeFilter(val);
          setPage(1);
        }}
        sort={sortOption}
        onSortChange={(val) => {
          setSortOption(val);
          setPage(1);
        }}
      />

      {/* Alerts List or Error State */}
      {error ? (
        <AlertError message={error} onRetry={fetchFilteredAlerts} />
      ) : (
        <AlertList
          alerts={alerts}
          loading={loading}
          pagination={{ page, totalPages: Math.ceil((alerts.length || 0) / 50), total: alerts.length }}
          onPageChange={(newPage) => setPage(newPage)}
          onMarkRead={handleMarkRead}
          onResolve={handleResolve}
          onViewDetails={(alert) => setSelectedAlert(alert)}
        />
      )}

      {/* Alert Details Dialog */}
      {selectedAlert && (
        <AlertDetails
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onResolve={handleResolve}
          onMarkRead={handleMarkRead}
        />
      )}
    </div>
  );
}

export default Alerts;
