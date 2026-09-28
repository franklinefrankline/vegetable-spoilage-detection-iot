import { useState, useEffect, useRef } from 'react';

const MAX_HISTORY_POINTS = 30; // Exact 30 points as required in Section 13

/**
 * useSensorHistory Hook
 * Accumulates real sensor readings strictly from actual polling responses.
 * Never generates fake historical data.
 * Maintains FIFO queue of maximum 30 points.
 */
export function useSensorHistory(incomingData) {
  const [history, setHistory] = useState([]);
  const lastTimestampRef = useRef(null);

  useEffect(() => {
    if (!incomingData || !incomingData.lastUpdated) return;

    const dataTimestamp = new Date(incomingData.lastUpdated).getTime();
    if (lastTimestampRef.current === dataTimestamp) {
      return; // Avoid duplicate points
    }
    lastTimestampRef.current = dataTimestamp;

    const timeStr = new Date(incomingData.lastUpdated).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newPoint = {
      time: timeStr,
      timestamp: dataTimestamp,
      temperature: incomingData.temperature,
      humidity: incomingData.humidity,
      gas: incomingData.gasLevel ?? incomingData.gasVOC,
      spoilageRisk: incomingData.spoilageRisk
    };

    setHistory((prev) => {
      const updated = [...prev, newPoint];
      // Keep maximum 30 points: when the 31st arrives, remove the oldest (Section 13)
      if (updated.length > MAX_HISTORY_POINTS) {
        return updated.slice(updated.length - MAX_HISTORY_POINTS);
      }
      return updated;
    });
  }, [incomingData]);

  return {
    history,
    totalPoints: history.length,
    isEmpty: history.length === 0
  };
}
