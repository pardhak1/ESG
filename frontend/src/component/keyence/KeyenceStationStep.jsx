import React, { useEffect, useState } from 'react';

export default function KeyenceStationStep({ onBack, onContinue }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const kitCode = localStorage.getItem('kit_code');
    console.log('[Keyence] [StationStep] Component mounted with kitCode:', kitCode);
    
    const endpoint = `${process.env.REACT_APP_BACKEND_HOST}/api/scan/stationct/${kitCode}`;
    console.log('[Keyence] [StationStep] API Call: GET /api/scan/stationct', { kitCode });
    
    fetch(endpoint, { method: 'GET' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}: Failed to load stations`);
        return response.json();
      })
      .then((data) => {
        const stationCount = (data.data || []).length;
        console.log(`[Keyence] [StationStep] API Response: status=200, ${stationCount} stations loaded`, { kitCode });
        setStations(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[Keyence] [StationStep] Error:', err, { kitCode, endpoint });
        setError(`Failed to load stations for kit ${kitCode}. Check your network connection and try again.`);
        setLoading(false);
      });
  }, []);

  const chooseStation = (station) => {
    console.log('[Keyence] [StationStep] User selected station:', { wsId: station.ws_id });
    localStorage.setItem('Station', String(station.ws_id));
    onContinue();
  };

  return (
    <div className="keyence-panel">
      <h2>Select Station</h2>
      {loading && <p>Loading stations...</p>}
      {error && <p className="keyence-error">{error}</p>}
      <div className="keyence-list">
        {stations.map((s) => (
          <button
            key={s.ws_id}
            className="keyence-btn keyence-list-btn"
            onClick={() => chooseStation(s)}
          >
            Station {s.ws_id}
          </button>
        ))}
      </div>
      <div className="keyence-actions">
        <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>Back</button>
      </div>
    </div>
  );
}
