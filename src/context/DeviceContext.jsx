import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DeviceContext = createContext(null);

const INITIAL_VEGETABLES = [
  { id: 'v1', name: 'Tomato', variety: 'Roma / Cherry', quantity: '12 kg', temp: '28.5°C', humidity: '72%', risk: 18, status: 'FRESH', optimalTemp: '20-25°C', shelfLife: '14 days' },
  { id: 'v2', name: 'Potato', variety: 'Russet', quantity: '25 kg', temp: '18.2°C', humidity: '65%', risk: 12, status: 'FRESH', optimalTemp: '12-16°C', shelfLife: '30 days' },
  { id: 'v3', name: 'Onion', variety: 'Red & Yellow', quantity: '30 kg', temp: '20.1°C', humidity: '58%', risk: 14, status: 'FRESH', optimalTemp: '15-20°C', shelfLife: '45 days' },
  { id: 'v4', name: 'Carrot', variety: 'Nantes', quantity: '15 kg', temp: '24.3°C', humidity: '70%', risk: 19, status: 'FRESH', optimalTemp: '18-22°C', shelfLife: '21 days' },
  { id: 'v5', name: 'Cabbage', variety: 'Savoy Green', quantity: '18 kg', temp: '22.0°C', humidity: '76%', risk: 24, status: 'WARNING', optimalTemp: '10-15°C', shelfLife: '10 days' },
  { id: 'v6', name: 'Bell Pepper', variety: 'Tricolor', quantity: '10 kg', temp: '26.1°C', humidity: '74%', risk: 21, status: 'FRESH', optimalTemp: '18-24°C', shelfLife: '12 days' }
];

const INITIAL_ALERTS = [
  { id: 'a1', title: 'High Humidity Detected', message: 'Storage bay #04 relative humidity exceeded the configured safety threshold (76%).', category: 'warning', time: '14 mins ago', read: false },
  { id: 'a2', title: 'Temperature Stable', message: 'Storage temperature normalized to 28.5°C within optimal vegetable preservation limits.', category: 'info', time: '1 hour ago', read: false },
  { id: 'a3', title: 'VOC Volatiles Within Limits', message: 'MQ-135 sensor calibrated: no abnormal ethylene gas accumulation detected.', category: 'info', time: '3 hours ago', read: true },
  { id: 'a4', title: 'ESP32 Wi-Fi Telemetry Re-synced', message: 'Microcontroller gateway successfully renewed dynamic IP lease at 192.168.1.105.', category: 'info', time: 'Yesterday', read: true }
];

const INITIAL_HISTORY = [
  { time: '00:00', temp: 27.8, humidity: 70, gas: 395, risk: 15 },
  { time: '03:00', temp: 27.2, humidity: 71, gas: 405, risk: 16 },
  { time: '06:00', temp: 28.0, humidity: 73, gas: 412, risk: 17 },
  { time: '09:00', temp: 28.8, humidity: 74, gas: 428, risk: 20 },
  { time: '12:00', temp: 29.2, humidity: 75, gas: 435, risk: 22 },
  { time: '15:00', temp: 28.7, humidity: 72, gas: 422, risk: 19 },
  { time: '18:00', temp: 28.5, humidity: 72, gas: 420, risk: 18 }
];

export function DeviceProvider({ children }) {
  const [isConnected, setIsConnected] = useState(true);
  const [device, setDevice] = useState({
    id: 'ESP32-001',
    ip: '192.168.1.105',
    status: 'Connected',
    signal: 'Strong',
    wifi: 'AgriNet-IoT-2.4G',
    firmware: 'v2.4.1',
    uptime: '14h 28m'
  });

  const [sensorData, setSensorData] = useState({
    temperature: 28.5,
    humidity: 72,
    gasVOC: 420,
    spoilageRisk: 18,
    status: 'FRESH',
    storageCondition: 'Stable',
    lastUpdated: new Date()
  });

  const [vegetables, setVegetables] = useState(INITIAL_VEGETABLES);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [thresholds, setThresholds] = useState({
    maxTemp: 30,
    maxHumidity: 78,
    maxGas: 500
  });

  // Micro jitter simulation to keep live charts and telemetry alive
  useEffect(() => {
    if (!isConnected) return;

    const interval = setInterval(() => {
      setSensorData((prev) => {
        const tempJitter = Number(((Math.random() - 0.5) * 0.4).toFixed(1));
        const humJitter = Math.round((Math.random() - 0.5) * 1.5);
        const gasJitter = Math.round((Math.random() - 0.5) * 6);

        const newTemp = Number(Math.max(26, Math.min(32, prev.temperature + tempJitter)).toFixed(1));
        const newHum = Math.max(65, Math.min(82, prev.humidity + humJitter));
        const newGas = Math.max(380, Math.min(480, prev.gasVOC + gasJitter));

        // Spoilage calculation estimate
        let riskScore = 14;
        if (newTemp > 29) riskScore += 4;
        if (newHum > 75) riskScore += 5;
        if (newGas > 440) riskScore += 6;

        const status = riskScore > 35 ? 'HIGH RISK' : riskScore > 22 ? 'MONITOR' : 'FRESH';
        const condition = riskScore > 35 ? 'Critical' : riskScore > 22 ? 'Caution' : 'Stable';

        return {
          temperature: newTemp,
          humidity: newHum,
          gasVOC: newGas,
          spoilageRisk: riskScore,
          status,
          storageCondition: condition,
          lastUpdated: new Date()
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const connectDevice = useCallback((ip) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setDevice((prev) => ({
          ...prev,
          ip: ip || '192.168.1.105',
          status: 'Connected',
          signal: 'Strong'
        }));
        setIsConnected(true);
        resolve(true);
      }, 800);
    });
  }, []);

  const disconnectDevice = useCallback(() => {
    setIsConnected(false);
    setDevice((prev) => ({ ...prev, status: 'Not Connected', signal: 'None' }));
  }, []);

  const addVegetableBatch = useCallback((newBatch) => {
    setVegetables((prev) => [
      {
        ...newBatch,
        id: 'v_' + Date.now(),
        temp: '28.5°C',
        humidity: '72%',
        risk: 18,
        status: 'FRESH'
      },
      ...prev
    ]);
  }, []);

  const markAlertsAsRead = useCallback(() => {
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  }, []);

  const unreadAlertsCount = alerts.filter((a) => !a.read).length;

  const updateThresholds = useCallback((newSettings) => {
    setThresholds((prev) => ({ ...prev, ...newSettings }));
  }, []);

  const value = {
    isConnected,
    device,
    sensorData,
    vegetables,
    alerts,
    history,
    thresholds,
    connectDevice,
    disconnectDevice,
    addVegetableBatch,
    markAlertsAsRead,
    unreadAlertsCount,
    updateThresholds
  };

  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>;
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within a DeviceProvider');
  }
  return context;
}
