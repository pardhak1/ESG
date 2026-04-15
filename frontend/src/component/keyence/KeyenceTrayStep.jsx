import React, { useEffect, useRef, useState } from 'react';

function parseTray(str) {
  const match = str.match(/T(\d+)/);
  return match ? match[1] : null;
}

export default function KeyenceTrayStep({ onBack, onContinue }) {
  const [trayLabel, setTrayLabel] = useState('');
  const [message,   setMessage]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const submitTray = () => {
    const wsId           = localStorage.getItem('Station');
    const sanitizedLabel = trayLabel.trim();

    if (!sanitizedLabel) {
      setMessage('Please scan or enter a tray label.');
      return;
    }
    if (sanitizedLabel.length > 50) {
      setMessage('Tray label too long (max 50 characters).');
      return;
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(sanitizedLabel)) {
      setMessage('Invalid characters in tray label.');
      return;
    }

    setLoading(true);
    setMessage('');

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${sanitizedLabel}/${wsId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((resp) => {
        const payload = resp.data;

        if (resp.success !== 1) {
          setMessage(resp.message || 'Tray not found. Verify the label and try again.');
          setLoading(false);
          return;
        }

        const storedWoId = parseInt(localStorage.getItem('workorder_id'));
        const trayWoId   = payload?.trayInfo?.wo_id;

        if (trayWoId !== storedWoId) {
          setMessage(`Wrong work order. Expected WO ${storedWoId}, tray belongs to WO ${trayWoId}.`);
          setTrayLabel('');
          setLoading(false);
          if (inputRef.current) inputRef.current.focus();
          return;
        }

        if (payload?.isFullyPopulated) {
          setMessage(`Tray already complete (${payload.currentScanCount}/${payload.maxTrayQty}). Scan a different tray.`);
          setTrayLabel('');
          setLoading(false);
          if (inputRef.current) inputRef.current.focus();
          return;
        }

        localStorage.setItem('scanSession', JSON.stringify(payload));
        localStorage.setItem('trayLabel',   sanitizedLabel);
        localStorage.setItem('trayID',      payload?.trayInfo?.wo_tray_id || '');
        localStorage.setItem('trayNumber',  parseTray(sanitizedLabel) || payload?.trayInfo?.tray_number || '');
        localStorage.setItem('lensGoal',    payload?.maxTrayQty       || 0);
        localStorage.setItem('nLens',       payload?.currentScanCount || 0);

        setLoading(false);
        onContinue();
      })
      .catch((err) => {
        setMessage(err.message || 'Network error. Check your connection and try again.');
        setLoading(false);
      });
  };

  return (
    <div className="keyence-panel">
      <h2>Scan Tray Label</h2>

      <label className="keyence-field-label">Tray Label</label>
      <input
        ref={inputRef}
        className="keyence-input keyence-input-large"
        type="text"
        value={trayLabel}
        onChange={(e) => setTrayLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !loading && submitTray()}
        placeholder="Scan tray barcode"
        disabled={loading}
      />

      {message && (
        <p className="keyence-error">{message}</p>
      )}

      <button
        className="keyence-btn"
        style={{ marginBottom: 8 }}
        onClick={submitTray}
        disabled={loading}
      >
        {loading ? 'Checking…' : 'Start Scan'}
      </button>

      <button className="keyence-btn keyence-btn-secondary" onClick={onBack} disabled={loading}>
        Back
      </button>
    </div>
  );
}
