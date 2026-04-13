import React, { useMemo, useState } from 'react';
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
    localStorage.removeItem('WorkOrder');
    localStorage.removeItem('kit_code');
    localStorage.removeItem('workorder_id');
    localStorage.removeItem('Station');
    localStorage.removeItem('trayLabel');
    localStorage.removeItem('trayNumber');
    localStorage.removeItem('scanSession');
    localStorage.removeItem('Planogram');
    setStep(STEP_WORKORDER);
  };

  return (
    <div className="keyence-shell">
      <header className="keyence-header">
        <div>
          <h1>Keyence Scanner</h1>
          <p>Portrait workflow • 480x800 optimized</p>
        </div>
        <button className="keyence-btn keyence-btn-secondary" onClick={resetToWorkorders}>
          Reset
        </button>
      </header>

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
    </div>
  );
}
