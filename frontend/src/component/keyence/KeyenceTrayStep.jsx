import React, { useRef, useState } from 'react';

export default function KeyenceTrayStep({ onBack, onContinue }) {
  const [trayLabel, setTrayLabel] = useState(localStorage.getItem('trayLabel') || '');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);

  const submitTray = () => {
    const wsId = localStorage.getItem('Station');
    if (!trayLabel) {
      setMessage('Tray label is required');
      return;
    }

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${trayLabel}/${wsId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success !== 1) {
          setMessage(data.message || 'Tray validation failed');
          return;
        }

        localStorage.setItem('scanSession', JSON.stringify(data));
        localStorage.setItem('trayLabel', trayLabel);
        if (data.trayInfo?.tray_number) {
          localStorage.setItem('trayNumber', data.trayInfo.tray_number);
        }
        if (typeof data.maxTrayQty !== 'undefined') {
          localStorage.setItem('lensGoal', data.maxTrayQty);
        }
        if (typeof data.currentScanCount !== 'undefined') {
          localStorage.setItem('nLens', data.currentScanCount);
        }

        setMessage('Tray loaded. Continue to scan.');
        onContinue();
      })
      .catch((err) => setMessage(err.message || 'Tray validation failed'));
  };

  return (
    <div className="keyence-panel">
      <h2>Scan Tray Label</h2>
      <input
        ref={inputRef}
        className="keyence-input"
        value={trayLabel}
        onChange={(e) => setTrayLabel(e.target.value.trim())}
        onKeyDown={(e) => e.key === 'Enter' && submitTray()}
        placeholder="Scan tray barcode"
        autoFocus
      />
      {message && <p className={message.includes('loaded') ? 'keyence-success' : 'keyence-error'}>{message}</p>}
      <div className="keyence-actions">
        <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>Back</button>
        <button className="keyence-btn" onClick={submitTray}>Continue</button>
      </div>
    </div>
  );
}
