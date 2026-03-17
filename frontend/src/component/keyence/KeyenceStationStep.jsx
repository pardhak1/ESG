import React, { useEffect, useState } from 'react';

export default function KeyenceStationStep({ onBack, onContinue }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const kitCode = localStorage.getItem('kit_code');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/stationct/${kitCode}`, { method: 'GET' })
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load stations');
        return response.json();
      })
      .then((data) => {
        setStations(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load stations');
        setLoading(false);
      });
  }, []);

  const chooseStation = (station) => {
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
      <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>Back</button>
    </div>
  );
}
