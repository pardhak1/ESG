import React, { useEffect, useRef, useState } from 'react';

function parseTray(str) {
  // Extract tray number from label format like "C1DMF2430-UPC-T4" -> "4"
  const match = str.match(/T(\d+)/);
  return match ? match[1] : null;
}

export default function KeyenceTrayStep({ onBack, onContinue }) {
  const [trayLabel, setTrayLabel] = useState(localStorage.getItem('trayLabel') || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus on mount
  useEffect(() => {
    console.log('[Keyence] [TrayStep] Component mounted');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const submitTray = () => {
    const wsId = localStorage.getItem('Station');
    const sanitizedLabel = trayLabel.trim();
    
    // Validate tray label format
    if (!sanitizedLabel) {
      setMessage('Tray label is required. Please scan or enter a tray label.');
      console.error('[Keyence] [TrayStep] Validation: Tray label is empty');
      return;
    }
    
    if (sanitizedLabel.length > 50) {
      setMessage('Tray label too long. Maximum 50 characters.');
      console.error('[Keyence] [TrayStep] Validation: Tray label exceeds 50 characters', { length: sanitizedLabel.length });
      return;
    }
    
    // Check for invalid characters (allow alphanumeric, dash, underscore only)
    if (!/^[a-zA-Z0-9-_]+$/.test(sanitizedLabel)) {
      setMessage('Invalid tray label format. Use only letters, numbers, dash (-), or underscore (_).');
      console.error('[Keyence] [TrayStep] Validation: Invalid characters in tray label', { label: sanitizedLabel });
      return;
    }

    setLoading(true);
    const endpoint = `api/scan/trayid1/${sanitizedLabel}/${wsId}`;
    console.log('[Keyence] [TrayStep] API Call: GET /api/scan/trayid1', { trayLabel: sanitizedLabel, wsId });
    
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((resp) => {
        const payload = resp.data;
        console.log('[Keyence] [TrayStep] API Response:', { success: resp.success, trayInfo: payload?.trayInfo, currentScanCount: payload?.currentScanCount, maxTrayQty: payload?.maxTrayQty });

        if (resp.success !== 1) {
          setMessage(resp.message || 'Tray not found. Please verify the label and try again.');
          console.error('[Keyence] [TrayStep] API returned success=0', { message: resp.message });
          setLoading(false);
          return;
        }

        const storedWoId = parseInt(localStorage.getItem('workorder_id'));
        const trayWoId = payload?.trayInfo?.wo_id;

        if (trayWoId !== storedWoId) {
          setMessage(`Tray is for different work order. Expected WO ${storedWoId}, but tray belongs to WO ${trayWoId}.`);
          console.error('[Keyence] [TrayStep] Workorder mismatch', { expected: storedWoId, actual: trayWoId });
          setTrayLabel('');
          setLoading(false);
          return;
        }

        if (payload?.isFullyPopulated) {
          setMessage(`Tray already complete. Scanned: ${payload.currentScanCount}/${payload.maxTrayQty}. Cannot scan into a fully populated tray.`);
          console.warn('[Keyence] [TrayStep] Tray is fully populated', { currentScanCount: payload.currentScanCount, maxTrayQty: payload.maxTrayQty });
          setTrayLabel('');
          setLoading(false);
          return;
        }

        // Store all required fields matching desktop version
        localStorage.setItem('scanSession', JSON.stringify(payload));
        localStorage.setItem('trayLabel', sanitizedLabel);
        localStorage.setItem('trayID', payload?.trayInfo?.wo_tray_id || '');
        localStorage.setItem('trayNumber', parseTray(sanitizedLabel) || payload?.trayInfo?.tray_number || '');
        localStorage.setItem('lensGoal', payload?.maxTrayQty || 0);
        localStorage.setItem('nLens', payload?.currentScanCount || 0);

        console.log('[Keyence] [TrayStep] Tray validated and loaded', { trayLabel: sanitizedLabel, currentScans: payload?.currentScanCount, goal: payload?.maxTrayQty });

        setLoading(false);
        onContinue();
      })
      .catch((err) => {
        console.error('[Keyence] [TrayStep] Fetch error:', err, { endpoint });
        setMessage(err.message || 'Network error loading tray. Check your connection and try again.');
        setLoading(false);
      });
  };

  return (
    <div className="keyence-panel">
      <h2>Scan Tray Label</h2>
      <input
        ref={inputRef}
        className="keyence-input"
        type="text"
        value={trayLabel}
        onChange={(e) => setTrayLabel(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !loading && submitTray()}
        placeholder="Scan tray barcode"
        disabled={loading}
      />
      {message && (
        <p className={message.includes('Tray already complete') || message.includes('different') ? 'keyence-error' : 'keyence-success'}>
          {message}
        </p>
      )}
      <div className="keyence-actions">
        <button className="keyence-btn keyence-btn-secondary" onClick={onBack} disabled={loading}>
          Back
        </button>
        <button className="keyence-btn" onClick={submitTray} disabled={loading}>
          {loading ? 'Loading...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
