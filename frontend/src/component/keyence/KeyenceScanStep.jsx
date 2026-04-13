import React, { useEffect, useMemo, useRef, useState } from 'react';

function toCountMap(planogramRows, scanInfo) {
  const expected = {};
  const scanned = {};

  (planogramRows || []).forEach((row) => {
    if (!row.lens_desc) return;
    expected[row.lens_desc] = (expected[row.lens_desc] || 0) + 1;
  });

  (scanInfo || []).forEach((scan) => {
    if (!scan.lens_desc) return;
    scanned[scan.lens_desc] = (scanned[scan.lens_desc] || 0) + 1;
  });

  return { expected, scanned };
}

function parseBarcode(raw) {
  if (!raw) return { upc: '', exp: '', lotNum: '' };
  if (raw.substring(0, 2) === '01') {
    return {
      upc: raw.substring(4, 16),
      exp: '20' + raw.substring(18, 24) + '000000',
      lotNum: raw.substring(26),
    };
  }
  if (raw.substring(0, 2) === '17') {
    return {
      upc: '',
      exp: '20' + raw.substring(2, 8) + '000000',
      lotNum: raw.substring(10),
    };
  }
  return { upc: raw, exp: '', lotNum: '' };
}

export default function KeyenceScanStep({ onBack }) {
  const [planogram, setPlanogram] = useState([]);
  const [counts, setCounts] = useState({ expected: {}, scanned: {} });
  const [scanRaw, setScanRaw] = useState('');
  const [upc, setUpc] = useState('');
  const [expDate, setExpDate] = useState('');
  const [lotNum, setLotNum] = useState('');
  const [status, setStatus] = useState('Ready to scan.');
  const inputRef = useRef(null);

  const scanSession = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('scanSession') || '{}');
    } catch (err) {
      return {};
    }
  }, []);

  useEffect(() => {
    const kitCode = localStorage.getItem('kit_code');
    const station = localStorage.getItem('Station');
    const trayNumber = localStorage.getItem('trayNumber');

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getstation/${kitCode}/${station}/${trayNumber}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => response.json())
      .then((data) => {
        const rows = data.data || [];
        setPlanogram(rows);
        localStorage.setItem('Planogram', JSON.stringify(rows));
        setCounts(toCountMap(rows, scanSession.scanInfo || []));
      })
      .catch(() => setStatus('Unable to load tray grid.'));
  }, [scanSession.scanInfo]);

  useEffect(() => {
    if (!scanRaw) return;
    const parsed = parseBarcode(scanRaw);
    setUpc(parsed.upc);
    setExpDate(parsed.exp);
    setLotNum(parsed.lotNum);
  }, [scanRaw]);

  const refreshSessionCounts = () => {
    const trayLabel = localStorage.getItem('trayLabel');
    const wsId = localStorage.getItem('Station');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${trayLabel}/${wsId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success === 1) {
          localStorage.setItem('scanSession', JSON.stringify(data));
          setCounts(toCountMap(planogram, data.scanInfo || []));
          if (typeof data.currentScanCount !== 'undefined') {
            localStorage.setItem('nLens', data.currentScanCount);
          }
        }
      });
  };

  const submitScan = async () => {
    const kitCode = localStorage.getItem('kit_code');
    const station = localStorage.getItem('Station');
    const trayNumber = localStorage.getItem('trayNumber');

    if (!upc) {
      setStatus('UPC required');
      return;
    }

    try {
      const validateResp = await fetch(
        `${process.env.REACT_APP_BACKEND_HOST}/api/scan/validate_scan/${upc}/${kitCode}/${trayNumber}/${station}`,
        { method: 'GET' }
      );

      if (!validateResp.ok) {
        const fail = await validateResp.json();
        setStatus(fail.message || 'Invalid scan');
        return;
      }

      const payload = {
        upc,
        exp: expDate || '0',
        lotnum: lotNum || '0',
        trayID: localStorage.getItem('trayLabel'),
        barcode: scanRaw || upc,
        unparsed: scanRaw || upc,
        upcVerify: true,
      };

      const submitResp = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/submit_scan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!submitResp.ok) {
        const fail = await submitResp.json();
        setStatus(fail.message || 'Scan submit failed');
        return;
      }

      setStatus('Scan accepted');
      setScanRaw('');
      setUpc('');
      setExpDate('');
      setLotNum('');
      refreshSessionCounts();
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      setStatus(err.message || 'Scan submit failed');
    }
  };

  return (
    <div className="keyence-panel">
      <h2>Scan Lenses</h2>
      <input
        ref={inputRef}
        className="keyence-input"
        value={scanRaw}
        onChange={(e) => setScanRaw(e.target.value.trim())}
        onKeyDown={(e) => e.key === 'Enter' && submitScan()}
        placeholder="Scan barcode"
        autoFocus
      />
      <div className="keyence-grid-2">
        <input className="keyence-input" value={upc} onChange={(e) => setUpc(e.target.value.trim())} placeholder="UPC" />
        <input className="keyence-input" value={expDate} onChange={(e) => setExpDate(e.target.value.trim())} placeholder="Expiration" />
      </div>
      <input className="keyence-input" value={lotNum} onChange={(e) => setLotNum(e.target.value.trim())} placeholder="Lot" />

      <div className="keyence-actions">
        <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>Back</button>
        <button className="keyence-btn" onClick={submitScan}>Submit Scan</button>
      </div>

      <p className="keyence-status">{status}</p>

      <div className="keyence-planogram">
        {Object.keys(counts.expected).map((lensDesc) => {
          const done = counts.scanned[lensDesc] || 0;
          const target = counts.expected[lensDesc] || 0;
          const complete = done >= target && target > 0;
          return (
            <div key={lensDesc} className={`keyence-pill ${complete ? 'complete' : ''}`}>
              <span>{lensDesc}</span>
              <strong>{done}/{target}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}
