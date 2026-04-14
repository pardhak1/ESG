import React, { useEffect, useMemo, useRef, useState } from 'react';

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

// Detect tray dimensions from planogram (3x18, 3x21, 13x25)
function detectTrayDimensions(planogramRows) {
  if (!planogramRows || planogramRows.length === 0) {
    return { cols: 3, rows: 18 };
  }

  const maxCol = Math.max(...planogramRows.map((p) => p.pos_col || 0));
  const maxRow = Math.max(...planogramRows.map((p) => p.pos_row || 0));

  return { cols: maxCol, rows: maxRow };
}

// Build 2D grid with scanned status at each position
function buildTrayGrid(planogramRows, scanInfo) {
  const { cols, rows } = detectTrayDimensions(planogramRows);

  // Create position map
  const positionMap = {};
  (planogramRows || []).forEach((p) => {
    const key = `${p.pos_col}-${p.pos_row}`;
    if (!positionMap[key]) {
      positionMap[key] = {
        col: p.pos_col,
        row: p.pos_row,
        lensDesc: p.lens_desc,
        lensUpc: p.lens_upc,
        hasLens: true,
        scannedCount: 0,
        totalNeeded: 0,
      };
    }
    positionMap[key].totalNeeded += 1;
  });

  // Count scanned items at each position
  (scanInfo || []).forEach((scan) => {
    const foundRow = planogramRows.find((p) => p.lens_desc === scan.lens_desc);
    if (foundRow) {
      const key = `${foundRow.pos_col}-${foundRow.pos_row}`;
      if (positionMap[key]) {
        positionMap[key].scannedCount += 1;
      }
    }
  });

  // Build grid array
  const grid = [];
  for (let r = 1; r <= rows; r++) {
    const rowData = [];
    for (let c = 1; c <= cols; c++) {
      const key = `${c}-${r}`;
      const cellData = positionMap[key] || {
        col: c,
        row: r,
        hasLens: false,
        scannedCount: 0,
        totalNeeded: 0,
      };
      rowData.push(cellData);
    }
    grid.push(rowData);
  }

  return { grid, cols, rows };
}

export default function KeyenceScanStep({ onBack }) {
  const [planogram, setPlanogram] = useState([]);
  const [grid, setGrid] = useState([]);
  const [gridDims, setGridDims] = useState({ cols: 3, rows: 18 });
  const [scanRaw, setScanRaw] = useState('');
  const [upc, setUpc] = useState('');
  const [expDate, setExpDate] = useState('');
  const [lotNum, setLotNum] = useState('');
  const [status, setStatus] = useState('Ready to scan.');
  const [isComplete, setIsComplete] = useState(false);
  const [selectedCell, setSelectedCell] = useState(null);
  const [needsUpc, setNeedsUpc] = useState(false);
  const inputRef = useRef(null);
  const upcInputRef = useRef(null);

  const scanSession = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('scanSession') || '{}');
    } catch (err) {
      return {};
    }
  }, []);

  // Check if tray is complete
  const checkCompletion = () => {
    if (grid.length === 0) return false;
    return grid.every((row) =>
      row.every((cell) => {
        if (!cell.hasLens) return true;
        return cell.scannedCount >= cell.totalNeeded;
      })
    );
  };

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

        const { grid: newGrid, cols, rows: numRows } = buildTrayGrid(rows, scanSession.scanInfo || []);
        setGrid(newGrid);
        setGridDims({ cols, rows: numRows });
        setIsComplete(checkCompletion());
      })
      .catch(() => setStatus('Unable to load tray grid.'));
  }, [scanSession.scanInfo]);

  useEffect(() => {
    if (!scanRaw) return;
    const parsed = parseBarcode(scanRaw);
    setExpDate(parsed.exp);
    setLotNum(parsed.lotNum);
    if (parsed.upc) {
      setUpc(parsed.upc);
      setNeedsUpc(false);
    } else {
      // Non-01 barcode (e.g. 17): has exp/lot but no UPC — prompt user to scan UPC separately
      setUpc('');
      setNeedsUpc(true);
    }
  }, [scanRaw]);

  const refreshSessionCounts = () => {
    const trayLabel = localStorage.getItem('trayLabel');
    const wsId = localStorage.getItem('Station');
    fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/trayid1/${trayLabel}/${wsId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((r) => r.json())
      .then((resp) => {
        if (resp.success === 1) {
          const payload = resp.data;
          localStorage.setItem('scanSession', JSON.stringify(payload));

          const { grid: newGrid } = buildTrayGrid(planogram, payload.scanInfo || []);
          setGrid(newGrid);
          setIsComplete(checkCompletion());

          if (typeof payload.currentScanCount !== 'undefined') {
            localStorage.setItem('nLens', payload.currentScanCount);
          }
        }
      });
  };

  const submitScan = async () => {
    const kitCode = localStorage.getItem('kit_code');
    const station = localStorage.getItem('Station');
    const trayNumber = localStorage.getItem('trayNumber');
    const sanitizedUpc = upc.trim();

    // Validate UPC format before API call
    if (!sanitizedUpc) {
      setStatus('UPC required. Please scan or enter a barcode.');
      console.error('[Keyence] [ScanStep] Validation: UPC is empty');
      return;
    }
    
    if (!/^\d+$/.test(sanitizedUpc)) {
      setStatus('Invalid UPC format. UPC must contain only digits (0-9).');
      console.error('[Keyence] [ScanStep] Validation: UPC contains non-numeric characters', { upc: sanitizedUpc });
      return;
    }
    
    if (sanitizedUpc.length < 8 || sanitizedUpc.length > 14) {
      setStatus(`Invalid UPC length. Expected 8-14 digits, got ${sanitizedUpc.length}.`);
      console.error('[Keyence] [ScanStep] Validation: UPC length out of range', { length: sanitizedUpc.length });
      return;
    }

    try {
      const validateEndpoint = `api/scan/validate_scan/${sanitizedUpc}/${kitCode}/${trayNumber}/${station}`;
      console.log('[Keyence] [ScanStep] API Call: GET /api/scan/validate_scan', { upc: sanitizedUpc, kitCode, trayNumber, station });

      const validateResp = await fetch(
        `${process.env.REACT_APP_BACKEND_HOST}/${validateEndpoint}`,
        { method: 'GET' }
      );
      const validateData = await validateResp.json();

      if (!validateResp.ok || validateData.success !== 1) {
        console.error('[Keyence] [ScanStep] Validation failed:', validateData, { upc: sanitizedUpc, status: validateResp.status });
        setStatus(validateData.message || 'UPC not valid for this kit and station. Verify barcode and try again.');
        return;
      }

      console.log('[Keyence] [ScanStep] Validation passed for UPC:', sanitizedUpc);

      // Determine which planogram slot to fill (matches IKB trackPosByLensUPC logic)
      let currentSession = {};
      try { currentSession = JSON.parse(localStorage.getItem('scanSession') || '{}'); } catch (e) {}
      const existingCount = (currentSession.scanInfo || []).filter((s) => s.scan_upc === sanitizedUpc).length;
      const planogramRows = validateData.data || [];
      const posIdx = Math.min(existingCount, planogramRows.length - 1);
      const targetPos = planogramRows[Math.max(0, posIdx)] || {};

      const submitPayload = {
        upc: sanitizedUpc,
        expir: expDate || '0',
        lotnum: lotNum || '0',
        trayID: localStorage.getItem('trayID'),
        kitcode: kitCode,
        traynumber: trayNumber,
        station: station,
        pos: { row: targetPos.pos_row || 1, col: targetPos.pos_col || 1 },
        unparsed: scanRaw || sanitizedUpc,
        barcode: scanRaw || sanitizedUpc,
        upcVerify: scanRaw.substring(0, 2) === '17' ||
          (scanRaw.substring(0, 2) === '01' && scanRaw.includes(sanitizedUpc)),
      };

      console.log('[Keyence] [ScanStep] API Call: POST /api/scan/submit_scan', { upc: sanitizedUpc, trayID: submitPayload.trayID, pos: submitPayload.pos });

      const submitResp = await fetch(`${process.env.REACT_APP_BACKEND_HOST}/api/scan/submit_scan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitPayload),
      });

      if (!submitResp.ok) {
        const fail = await submitResp.json();
        console.error('[Keyence] [ScanStep] Submit failed:', fail, { upc: sanitizedUpc, status: submitResp.status });
        setStatus(fail.message || 'Scan rejected. Verify barcode is valid for this tray and try again.');
        return;
      }

      console.log('[Keyence] [ScanStep] Scan submitted successfully:', { upc: sanitizedUpc });
      setStatus('Scan accepted');
      setScanRaw('');
      setUpc('');
      setExpDate('');
      setLotNum('');
      setNeedsUpc(false);
      refreshSessionCounts();
      if (inputRef.current) inputRef.current.focus();
    } catch (err) {
      console.error('[Keyence] [ScanStep] Exception during submit:', err, { upc: sanitizedUpc });
      setStatus(err.message || 'Network error submitting scan. Check your connection and try again.');
    }
  };

  const getCellStatus = (cell) => {
    if (!cell.hasLens) return 'empty';
    if (cell.scannedCount === 0) return 'unscanned';
    if (cell.scannedCount >= cell.totalNeeded) return 'complete';
    return 'partial';
  };

  // Auto-focus UPC input when a 17-barcode is scanned
  useEffect(() => {
    if (needsUpc && upcInputRef.current) {
      upcInputRef.current.focus();
    }
  }, [needsUpc]);

  // Auto-focus main barcode input on mount and after each scan (not when waiting for UPC)
  useEffect(() => {
    if (inputRef.current && !isComplete && !needsUpc) {
      inputRef.current.focus();
    }
  }, [isComplete, scanRaw, needsUpc]);

  return (
    <div className="keyence-panel">
      <h2>Scan Lenses - Tray {localStorage.getItem('trayLabel')}</h2>

      {/* 2D Tray Grid - Always visible */}
      <div className="keyence-tray-grid-container">
        <div className="keyence-grid-legend">
          <span><span className="legend-empty"></span> No Lens</span>
          <span><span className="legend-unscanned"></span> Needed</span>
          <span><span className="legend-complete"></span> Scanned</span>
        </div>

        <div
          className="keyence-tray-grid"
          style={{
            gridTemplateColumns: `repeat(${gridDims.cols}, 1fr)`,
            gridTemplateRows: `repeat(${gridDims.rows}, 1fr)`,
            height: `${Math.max(160, Math.min(260, gridDims.rows * 14))}px`,
          }}
        >
          {grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => {
              const status = getCellStatus(cell);
              const key = `${cell.col}-${cell.row}`;

              return (
                <div
                  key={key}
                  className={`keyence-grid-cell keyence-cell-${status}`}
                  title={cell.hasLens ? `Pos ${cell.col}-${cell.row}: ${cell.lensDesc || 'Lens'}\n${cell.scannedCount}/${cell.totalNeeded}` : 'No lens at this position'}
                >
                  {cell.hasLens && <span className="cell-count">{cell.scannedCount}/{cell.totalNeeded}</span>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {!isComplete ? (
        <>
          <p className="keyence-instruction">
            {needsUpc ? 'Barcode scanned. Now scan the UPC label:' : 'Scan lens barcode below:'}
          </p>

          {/* Step 1: main barcode — disabled after scanning a 17-type barcode */}
          <input
            ref={inputRef}
            className="keyence-input keyence-input-large"
            value={scanRaw}
            onChange={(e) => setScanRaw(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !needsUpc && submitScan()}
            placeholder="Scan barcode"
            disabled={needsUpc}
          />

          {/* Step 2: UPC-only input — only shown for non-01 barcodes */}
          {needsUpc && (
            <input
              ref={upcInputRef}
              className="keyence-input keyence-input-large"
              value={upc}
              onChange={(e) => setUpc(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitScan()}
              placeholder="Scan UPC barcode"
            />
          )}

          <p className="keyence-status" style={{ color: status === 'Scan accepted' ? '#22c55e' : status !== 'Ready to scan.' ? '#ef4444' : '#666' }}>
            {status}
          </p>

          <div className="keyence-actions">
            <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>Back to Tray</button>
            <button className="keyence-btn" onClick={submitScan}>Submit Scan</button>
          </div>
        </>
      ) : (
        <div className="keyence-completion">
          <p style={{ fontSize: '1.2rem', color: '#22c55e', fontWeight: 'bold', textAlign: 'center', marginTop: '16px' }}>
            ✓ TRAY COMPLETE
          </p>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '24px' }}>All lenses scanned successfully!</p>
          <div className="keyence-actions">
            <button className="keyence-btn keyence-btn-secondary" onClick={onBack}>Back to Tray</button>
            <button className="keyence-btn keyence-btn-primary" onClick={() => {
              localStorage.removeItem('trayLabel');
              localStorage.removeItem('trayID');
              localStorage.removeItem('trayNumber');
              localStorage.removeItem('scanSession');
              localStorage.removeItem('Planogram');
              window.location.href = '/keyence';
            }}>Done - Next Tray</button>
          </div>
        </div>
      )}
    </div>
  );
}
