import React, { useEffect, useState } from 'react';

export default function KeyenceStationStep({ onBack, onContinue }) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const kitCode = localStorage.getItem('kit_code');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/stationct/${kitCode}`, { method: 'GET' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setStations(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(`Failed to load stations: ${err.message}`);
        setLoading(false);
      });
  }, []);

  const chooseStation = (station) => {
    localStorage.setItem('Station', String(station.ws_id));
    onContinue();
  };

  if (loading) return <div className="keyence-panel"><p>Loading stations…</p></div>;
  if (error)   return <div className="keyence-panel"><p className="keyence-error">{error}</p></div>;

  return (
    <div className="keyence-panel">
      <h2>Stations</h2>
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
