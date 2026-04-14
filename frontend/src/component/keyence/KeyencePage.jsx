import React, { useEffect, useMemo, useState } from 'react';
import KeyenceWorkorderStep from './KeyenceWorkorderStep';
import KeyenceStationStep from './KeyenceStationStep';
import KeyenceTrayStep from './KeyenceTrayStep';
import KeyenceScanStep from './KeyenceScanStep';
import './KeyencePage.scss';

const STEP_WORKORDER = 1;
const STEP_STATION = 2;
const STEP_TRAY = 3;
const STEP_SCAN = 4;

export default function KeyencePage() {
  const [step, setStep] = useState(STEP_WORKORDER);

  // Clear any stale localStorage from a previous session on page load
  useEffect(() => {
    ['WorkOrder', 'kit_code', 'workorder_id', 'Station', 'trayLabel',
     'trayID', 'trayNumber', 'lensGoal', 'nLens', 'scanSession', 'Planogram']
      .forEach((key) => localStorage.removeItem(key));
  }, []);

  const context = useMemo(
    () => ({
      workOrder: localStorage.getItem('WorkOrder') || '',
      kitCode: localStorage.getItem('kit_code') || '',
      station: localStorage.getItem('Station') || '',
      trayLabel: localStorage.getItem('trayLabel') || '',
      trayNumber: localStorage.getItem('trayNumber') || '',
    }),
    [step]
  );

  const resetToWorkorders = () => {
    // Clear all handheld scanner state
    localStorage.removeItem('WorkOrder');
    localStorage.removeItem('kit_code');
    localStorage.removeItem('workorder_id');
    localStorage.removeItem('Station');
    localStorage.removeItem('trayLabel');
    localStorage.removeItem('trayID');
    localStorage.removeItem('trayNumber');
    localStorage.removeItem('lensGoal');
    localStorage.removeItem('nLens');
    localStorage.removeItem('scanSession');
    localStorage.removeItem('Planogram');
    setStep(STEP_WORKORDER);
  };

  return (
    <div className="keyence-shell">
      <header className="keyence-header">
        <div className="keyence-header-content">
          <h1>📱 Scanner</h1>
          <p className="keyence-step-counter">Step {step}/4</p>
        </div>
        {step > 1 && (
          <button className="keyence-btn keyence-btn-reset" onClick={resetToWorkorders}>
            Reset
          </button>
        )}
      </header>

      <main className="keyence-main">
        <section className="keyence-status-cards">
          <div>WO: <strong>{context.workOrder || '-'}</strong></div>
          <div>Kit: <strong>{context.kitCode || '-'}</strong></div>
          <div>Station: <strong>{context.station || '-'}</strong></div>
          <div>Tray: <strong>{context.trayLabel || '-'}</strong></div>
        </section>

        {step === STEP_WORKORDER && (
          <KeyenceWorkorderStep onContinue={() => setStep(STEP_STATION)} />
        )}
        {step === STEP_STATION && (
          <KeyenceStationStep
            onBack={() => setStep(STEP_WORKORDER)}
            onContinue={() => setStep(STEP_TRAY)}
          />
        )}
        {step === STEP_TRAY && (
          <KeyenceTrayStep
            onBack={() => setStep(STEP_STATION)}
            onContinue={() => setStep(STEP_SCAN)}
          />
        )}
        {step === STEP_SCAN && (
          <KeyenceScanStep
            onBack={() => setStep(STEP_TRAY)}
          />
        )}
      </main>
    </div>
  );
}