import React, { useEffect, useMemo, useRef, useState } from 'react';

// ─── Barcode parsing ──────────────────────────────────────────────────────────
function parseBarcode(raw) {
  if (!raw) return { upc: '', exp: '', lotNum: '' };
  if (raw.substring(0, 2) === '01') {
    return {
      upc:    raw.substring(4, 16),
      exp:    '20' + raw.substring(18, 24) + '000000',
      lotNum: raw.substring(26),
    };
  }
  if (raw.substring(0, 2) === '17') {
    return {
      upc:    '',
      exp:    '20' + raw.substring(2, 8) + '000000',
      lotNum: raw.substring(10),
    };
  }
  return { upc: '', exp: '', lotNum: '' };
}

// ─── Tray grid helpers ────────────────────────────────────────────────────────
function detectTrayDimensions(rows) {
  if (!rows || rows.length === 0) return { cols: 3, rows: 18 };
  return {
    cols: Math.max(...rows.map((p) => p.pos_col || 0)),
    rows: Math.max(...rows.map((p) => p.pos_row || 0)),
  };
}

function buildTrayGrid(planogramRows, scanInfo) {
  const { cols, rows } = detectTrayDimensions(planogramRows);
  const posMap = {};
  (planogramRows || []).forEach((p) => {
    const key = `${p.pos_col}-${p.pos_row}`;
    if (!posMap[key]) {
      posMap[key] = { col: p.pos_col, row: p.pos_row, lensDesc: p.lens_desc,
                      lensUpc: p.lens_upc, hasLens: true, scannedCount: 0, totalNeeded: 0 };
    }
    posMap[key].totalNeeded += 1;
  });
  (scanInfo || []).forEach((scan) => {
    const found = planogramRows.find((p) => p.lens_desc === scan.lens_desc);
    if (found) {
      const key = `${found.pos_col}-${found.pos_row}`;
      if (posMap[key]) posMap[key].scannedCount += 1;
    }
  });
  const grid = [];
  for (let r = 1; r <= rows; r++) {
    const row = [];
    for (let c = 1; c <= cols; c++) {
      const key = `${c}-${r}`;
      row.push(posMap[key] || { col: c, row: r, hasLens: false, scannedCount: 0, totalNeeded: 0 });
    }
    grid.push(row);
  }
  return { grid, cols, rows };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function KeyenceScanStep({ onBack }) {
  const [planogram,  setPlanogram]  = useState([]);
  const [grid,       setGrid]       = useState([]);
  const [gridDims,   setGridDims]   = useState({ cols: 3, rows: 18 });
  const [scanRaw,    setScanRaw]    = useState('');
  const [upc,        setUpc]        = useState('');
  const [expDate,    setExpDate]    = useState('');
  const [lotNum,     setLotNum]     = useState('');
  const [needsUpc,   setNeedsUpc]   = useState(false);
  const [status,     setStatus]     = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [saveMsg,    setSaveMsg]    = useState('');

  const inputRef    = useRef(null);
  const upcInputRef = useRef(null);

  // ── Read scan session once on mount ─────────────────────────────────────────
  const scanSession = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('scanSession') || '{}'); }
    catch { return {}; }
  }, []);

  // ── Live counts from grid ────────────────────────────────────────────────────
  const totalScanned = useMemo(
    () => grid.flat().filter((c) => c.hasLens).reduce((s, c) => s + c.scannedCount, 0),
    [grid]
  );
  const totalNeeded = useMemo(
    () => grid.flat().filter((c) => c.hasLens).reduce((s, c) => s + c.totalNeeded, 0),
    [grid]
  );

  // ── Completion check ─────────────────────────────────────────────────────────
  const checkCompletion = (g) =>
    g.length > 0 && g.every((row) =>
      row.every((cell) => !cell.hasLens || cell.scannedCount >= cell.totalNeeded)
    );

  // ── Load planogram on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const kitCode    = localStorage.getItem('kit_code');
    const station    = localStorage.getItem('Station');
    const trayNumber = localStorage.getItem('trayNumber');

    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/getstation/${kitCode}/${station}/${trayNumber}`, {
      method: 'GET', headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => {
        const rows = data.data || [];
        setPlanogram(rows);
        localStorage.setItem('Planogram', JSON.stringify(rows));
        const { grid: g, cols, rows: numRows } = buildTrayGrid(rows, scanSession.scanInfo || []);
        setGrid(g);
        setGridDims({ cols, rows: numRows });
        setIsComplete(checkCompletion(g));
      })
      .catch(() => setStatus('Unable to load tray grid.'));
  }, [scanSession.scanInfo]);

  // ── Auto-focus UPC input when needed ────────────────────────────────────────
  useEffect(() => {
    if (needsUpc && upcInputRef.current) upcInputRef.current.focus();
  }, [needsUpc]);

  // ── Auto-focus main input when ready ────────────────────────────────────────
  useEffect(() => {
    if (inputRef.current && !isComplete && !needsUpc) inputRef.current.focus();
  }, [isComplete, needsUpc]);

  // ── Refresh grid from server after each scan ─────────────────────────────────
  const refreshGrid = () => {
    const trayLabel = localStorage.getItem('trayLabel');
    const wsId      = localStorage.getItem('Station');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${trayLabel}/${wsId}`, {
      method: 'GET', headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((resp) => {
        if (resp.success === 1) {
          const payload = resp.data;
          localStorage.setItem('scanSession', JSON.stringify(payload));
          localStorage.setItem('nLens', payload.currentScanCount ?? 0);
          const { grid: g } = buildTrayGrid(planogram, payload.scanInfo || []);
          setGrid(g);
          setIsComplete(checkCompletion(g));
        }
      });
  };

  // ── Core submit — receives values directly to avoid stale-state issues ───────
  const doSubmit = async (submitUpc, submitExp, submitLot, submitRaw) => {
    const kitCode    = localStorage.getItem('kit_code');
    const station    = localStorage.getItem('Station');
    const trayNumber = localStorage.getItem('trayNumber');
    const sanitizedUpc = submitUpc.trim();

    if (!sanitizedUpc) { setStatus('UPC required.'); return; }
    if (!/^\d+$/.test(sanitizedUpc)) { setStatus('UPC must contain digits only.'); return; }
    if (sanitizedUpc.length < 8 || sanitizedUpc.length > 14) {
      setStatus(`Invalid UPC length (${sanitizedUpc.length} digits).`); return;
    }

    setStatus('');
    try {
      const vResp = await fetch(
        `${process.env.REACT_APP_BACKEND_HOST}/api/scan/validate_scan/${sanitizedUpc}/${kitCode}/${trayNumber}/${station}`,
        { method: 'GET' }
      );
      const vData = await vResp.json();
      if (!vResp.ok || vData.success !== 1) {
        setStatus(vData.message || 'UPC not valid for this kit and station.');
        return;
      }

      // Determine grid position (mirrors IKB trackPosByLensUPC)
      let sess = {};
      try { sess = JSON.parse(localStorage.getItem('scanSession') || '{}'); } catch {}
      const existingCount = (sess.scanInfo || []).filter((s) => s.scan_upc === sanitizedUpc).length;
      const planRows      = vData.data || [];
      const posIdx        = Math.min(existingCount, planRows.length - 1);
      const targetPos     = planRows[Math.max(0, posIdx)] || {};

      const body = {
        upc:        sanitizedUpc,
        expir:      submitExp  || '0',
        lotnum:     submitLot  || '0',
        trayID:     localStorage.getItem('trayID'),
        kitcode:    kitCode,
        traynumber: trayNumber,
        station:    station,
        pos:        { row: targetPos.pos_row || 1, col: targetPos.pos_col || 1 },
        unparsed:   submitRaw || sanitizedUpc,
        barcode:    submitRaw || sanitizedUpc,
        upcVerify:  submitRaw.substring(0, 2) === '17' ||
                    (submitRaw.substring(0, 2) === '01' && submitRaw.includes(sanitizedUpc)),
      };

      const sResp = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/submit_scan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!sResp.ok) {
        const fail = await sResp.json();
        setStatus(fail.message || 'Scan rejected.');
        return;
      }

      setStatus('Scan accepted');
      setScanRaw('');
      setUpc('');
      setExpDate('');
      setLotNum('');
      setNeedsUpc(false);
      refreshGrid();
    } catch (err) {
      setStatus(err.message || 'Network error. Check your connection.');
    }
  };

  // ── Called when Enter is pressed on the main barcode input ───────────────────
  // Waits for the full barcode before doing anything.
  const commitBarcode = () => {
    if (!scanRaw) return;
    const parsed = parseBarcode(scanRaw);
    setExpDate(parsed.exp);
    setLotNum(parsed.lotNum);

    if (scanRaw.substring(0, 2) === '01') {
      // Full data barcode — submit immediately, no second scan needed
      setUpc(parsed.upc);
      setNeedsUpc(false);
      doSubmit(parsed.upc, parsed.exp, parsed.lotNum, scanRaw);
    } else {
      // Exp/lot only — show UPC field for second scan
      setUpc('');
      setNeedsUpc(true);
    }
  };

  // ── Called when Enter is pressed on the UPC input ────────────────────────────
  const submitUpcScan = () => {
    doSubmit(upc, expDate, lotNum, scanRaw);
  };

  // ── Cell colour ──────────────────────────────────────────────────────────────
  const getCellClass = (cell) => {
    if (!cell.hasLens)                         return 'keyence-cell-empty';
    if (cell.scannedCount === 0)               return 'keyence-cell-unscanned';
    if (cell.scannedCount >= cell.totalNeeded) return 'keyence-cell-complete';
    return 'keyence-cell-partial';
  };

  // ── Grid pixel height: scales with row count, capped 200–420 px ─────────────
  const gridHeight = Math.min(420, Math.max(200, gridDims.rows * 16));

  // ─────────────────────────────────────────────────────────────────────────────
  if (isComplete) {
    return (
      <div className="keyence-panel">
        <div className="keyence-completion">
          <p style={{ fontSize: '1.3rem', color: '#2D8A72', fontWeight: 'bold', margin: '0 0 8px' }}>
            TRAY COMPLETE
          </p>
          <p style={{ color: '#555', margin: 0 }}>
            All {totalNeeded} lenses scanned.
          </p>
        </div>

        {/* Grid — final state */}
        <div className="keyence-tray-grid-container">
          <div className="keyence-grid-legend">
            <span><span className="legend-swatch empty"></span>No lens</span>
            <span><span className="legend-swatch unscanned"></span>Needed</span>
            <span><span className="legend-swatch complete"></span>Scanned</span>
          </div>
          <div
            className="keyence-tray-grid"
            style={{
              gridTemplateColumns: `repeat(${gridDims.cols}, 1fr)`,
              gridTemplateRows:    `repeat(${gridDims.rows}, 1fr)`,
              height: `${gridHeight}px`,
            }}
          >
            {grid.map((row) =>
              row.map((cell) => (
                <div key={`${cell.col}-${cell.row}`} className={`keyence-grid-cell ${getCellClass(cell)}`} />
              ))
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <button
            className="keyence-btn"
            style={{ marginBottom: 8 }}
            onClick={() => {
              ['trayLabel','trayID','trayNumber','scanSession','Planogram']
                .forEach((k) => localStorage.removeItem(k));
              window.location.href = '/keyence';
            }}
          >
            Next Tray
          </button>
          <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>
            Back to Tray
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="keyence-panel">

      {/* ── Info bar ── */}
      <div className="keyence-scan-info">
        <div>
          <strong>WO:</strong> {localStorage.getItem('WorkOrder') || '—'}&nbsp;&nbsp;
          <strong>Station:</strong> {localStorage.getItem('Station') || '—'}&nbsp;&nbsp;
          <strong>Tray:</strong> {localStorage.getItem('trayLabel') || '—'}
        </div>
        <div>
          <strong>Type:</strong> {gridDims.cols}x{gridDims.rows}&nbsp;&nbsp;
          <strong>{totalScanned}/{totalNeeded}</strong> scanned
        </div>
      </div>

      {/* ── Barcode input (always shown, disabled while waiting for UPC) ── */}
      <label className="keyence-field-label">Contact Barcode</label>
      <input
        ref={inputRef}
        className="keyence-input keyence-input-large"
        value={scanRaw}
        onChange={(e) => setScanRaw(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !needsUpc && commitBarcode()}
        placeholder="Scan contact barcode"
        disabled={needsUpc}
      />

      {/* ── UPC input — only appears for non-01 barcodes ── */}
      {needsUpc && (
        <>
          <label className="keyence-field-label">Scan Contact UPC (12 digits)</label>
          <input
            ref={upcInputRef}
            className="keyence-input keyence-input-large"
            value={upc}
            onChange={(e) => setUpc(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitUpcScan()}
            placeholder="Scan UPC barcode"
          />
        </>
      )}

      {/* ── Status banner ── */}
      {status && (
        <div className={`keyence-scan-banner ${status === 'Scan accepted' ? 'ok' : 'error'}`}>
          {status}
        </div>
      )}
      {!status && (
        <div className="keyence-scan-banner info">
          {needsUpc ? 'Barcode scanned — now scan the UPC label.' : 'Ready to scan.'}
        </div>
      )}

      {/* ── Buttons ── */}
      <div className="keyence-actions" style={{ marginTop: 8 }}>
        <button
          className="keyence-btn"
          onClick={needsUpc ? submitUpcScan : commitBarcode}
        >
          Scan &amp; Register
        </button>
        <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>New Tray</button>
      </div>

      <div style={{ marginTop: 8 }}>
        <button
          className="keyence-btn keyence-btn-secondary"
          style={{ width: '100%' }}
          onClick={() => {
            setSaveMsg('Progress saved.');
            setTimeout(() => setSaveMsg(''), 2000);
          }}
        >
          Save Progress
        </button>
        {saveMsg && <p style={{ textAlign: 'center', color: '#2D8A72', fontSize: '0.85rem', margin: '4px 0 0' }}>{saveMsg}</p>}
      </div>

      {/* ── Tray grid ── */}
      <div className="keyence-tray-grid-container">
        <div className="keyence-tray-grid-label">
          Tray View (Black = no lens &nbsp;|&nbsp; Red = needed &nbsp;|&nbsp; Green = scanned)
        </div>
        <div
          className="keyence-tray-grid"
          style={{
            gridTemplateColumns: `repeat(${gridDims.cols}, 1fr)`,
            gridTemplateRows:    `repeat(${gridDims.rows}, 1fr)`,
            height: `${gridHeight}px`,
          }}
        >
          {grid.map((row) =>
            row.map((cell) => (
              <div
                key={`${cell.col}-${cell.row}`}
                className={`keyence-grid-cell ${getCellClass(cell)}`}
                title={cell.hasLens
                  ? `${cell.lensDesc || 'Lens'} — ${cell.scannedCount}/${cell.totalNeeded}`
                  : 'No lens'}
              />
            ))
          )}
        </div>
      </div>

    </div>
  );
}
