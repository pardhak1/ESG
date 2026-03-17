# ESG Keyence Scanner Implementation Guide

**Audience:** ESG IT, ESG Operations, and project teammates  
**Scope:** `/keyence` scanner-first workflow in the React frontend (`frontend/`), including deployment expectations, onsite validation, API dependencies, and rollback.

---

## 1) Implementation Summary (Handoff Note)

A dedicated scanner-first route was added at:

- **`/keyence`**

This route is additive and isolated from normal operator screens. Existing operator flow routes remain in place. The route is registered in the main React router and points to the new Keyence page.

### What was added

- New scanner workflow page/components under `frontend/src/component/keyence/`
- Portrait-first scanner styling tuned for BT-A600 style usage (large touch targets, limited scrolling)
- Visual preview artifacts under `artifacts/keyence-previews/` (mockups)

### Exact files added

#### Frontend workflow
- `frontend/src/component/keyence/KeyencePage.jsx`
- `frontend/src/component/keyence/KeyenceWorkorderStep.jsx`
- `frontend/src/component/keyence/KeyenceStationStep.jsx`
- `frontend/src/component/keyence/KeyenceTrayStep.jsx`
- `frontend/src/component/keyence/KeyenceScanStep.jsx`
- `frontend/src/component/keyence/KeyencePage.scss`

#### Visual previews
- `artifacts/keyence-previews/01-work-order-selection.svg`
- `artifacts/keyence-previews/02-station-selection.svg`
- `artifacts/keyence-previews/03-tray-scan.svg`
- `artifacts/keyence-previews/04-contact-scan.svg`
- `artifacts/keyence-previews/05-resume-saved-scan.svg`
- `artifacts/keyence-previews/README.md`

### Exact files modified

- `frontend/src/App.js` (adds `/keyence` route)

---

## 2) Route and Access

Use this direct route on scanner devices:

- **`https://<frontend-host>/keyence`**

`/keyence` is intentionally separate from legacy paths like `/activeorders`, `/Station`, `/TrayId`, `/wh`.

---

## 3) `/keyence` Flow (How It Works)

The flow is linear and step-based:

1. **Work Order Selection**
   - Loads active/incomplete work orders
   - Operator taps desired work order
   - Stores local keys: `kit_code`, `WorkOrder`, `workorder_id`

2. **Station Selection**
   - Loads station list by selected `kit_code`
   - Operator selects station
   - Stores local key: `Station`

3. **Tray Scan**
   - Operator scans tray label (or types + Enter)
   - Validates tray for current station
   - Saves session/resume keys: `scanSession`, `trayLabel`, `trayNumber`, `lensGoal`, `nLens`

4. **Contact Scan**
   - Loads planogram rows for selected kit/station/tray
   - Parses scanner barcode input into UPC/expiration/lot when possible
   - Validates scan
   - Submits scan
   - Refreshes counts/progress from tray session endpoint

5. **Resume Saved Scan**
   - On re-entry using same tray/station context, existing scan state is loaded from backend and reflected in progress counters.

### Local storage keys used by the Keyence route

- `WorkOrder`
- `kit_code`
- `workorder_id`
- `Station`
- `trayLabel`
- `trayNumber`
- `scanSession`
- `Planogram`
- `nLens`
- `lensGoal`

---

## 4) Keyence BT-A600 Device Setup Instructions

## Browser setup

1. Set a home bookmark/shortcut to `/keyence`.
2. Use portrait mode.
3. Lock zoom/scale behavior if possible to reduce accidental pinch/zoom.

## Scanner input mode

1. Configure scanner to **keyboard wedge mode** (barcode data sent as keyboard text).
2. Configure scanner to append **Enter** suffix after each scan.
3. Validate that Enter submits:
   - Tray input step
   - Contact scan input step

## Power/session behavior

1. Prevent aggressive sleep timeout during active picking/scanning if policy allows.
2. If device sleeps, confirm browser returns to open tab and retained app state.

## Network

1. Ensure scanner can reach frontend host and backend API host.
2. Confirm no captive portal interruptions on warehouse network segments.

---

## 5) Onsite Testing Checklist (ESG Ops + IT)

Use this as an executable checklist.

## A. Open app and route checks

- [ ] Open frontend base URL on BT-A600
- [ ] Navigate directly to `/keyence`
- [ ] Confirm Keyence header renders and screen is usable in portrait
- [ ] Confirm normal legacy routes still function (regression smoke)

## B. Login check (if site requires user login first)

- [ ] Login flow at `/` still works with valid credentials
- [ ] After login, opening `/keyence` is still functional

## C. Functional workflow

### 1) Work order selection
- [ ] Work orders load
- [ ] Selecting a work order moves to station step
- [ ] WO + Kit update in status display

### 2) Station selection
- [ ] Stations load
- [ ] Selecting station moves to tray step
- [ ] Back button returns to work order step

### 3) Tray scan
- [ ] Valid tray label accepted
- [ ] Invalid tray label shows error and does not continue
- [ ] Enter key submits tray input

### 4) Contact scan
- [ ] Valid barcode validates + submits
- [ ] Status message updates to accepted
- [ ] Progress count updates

### 5) Resume saved scan
- [ ] Exit and re-open flow
- [ ] Re-select same WO/station/tray
- [ ] Prior progress restored

## D. Negative/edge tests

- [ ] Invalid scan (wrong UPC for tray/station) is rejected
- [ ] Duplicate scan behavior aligns with backend rules (reject or capped)
- [ ] Wrong tray or wrong station context produces clear failure state

## E. Scanner focus/UX behavior

- [ ] After successful submit, scan field is focused for next scan
- [ ] Scanner behaves as keyboard + Enter without extra taps
- [ ] Buttons/inputs are large enough for gloved/rapid operation
- [ ] Scrolling is limited and manageable on BT-A600

## F. Browser/device checks (BT-A600)

- [ ] No browser crashes/freezes during repeated scans
- [ ] No unexpected keyboard pop-up disruption
- [ ] No orientation shifts that break layout
- [ ] Back button behavior is understood by operators

## G. Suggested test log fields

- Device ID:
- Browser version:
- Frontend URL:
- Backend URL:
- Tester name:
- Date/time:
- Pass/fail notes by section:
- Screenshots/videos captured:

---

## 6) API Dependencies (Backend Contracts)

The Keyence frontend depends on these existing backend routes (no backend changes were introduced):

- `GET /api/scan/getic`
  - Work order list for selection
- `GET /api/scan/stationct/:kit_code`
  - Station list for selected kit
- `GET /api/scan/trayid1/:trayLabel/:ws_id`
  - Tray validation + existing scan session data
- `GET /api/scan/getstation/:kitCode/:station/:trayNumber`
  - Planogram/grid rows for tray context
- `GET /api/scan/validate_scan/:upc/:kitCode/:trayNumber/:station`
  - Validity check before submit
- `POST /api/scan/submit_scan/`
  - Persist accepted scan

### Operational assumption

Backend responses follow the same shape as expected by current operator pages (especially `trayid1`, `getstation`, and scan validation/submit responses).

---

## 7) Risks / Unknowns to Watch

1. **Environment/runtime dependency readiness**
   - If frontend dependencies are incomplete, startup/build may fail.
2. **Backend data-shape drift**
   - Any API response shape change can break parsing/count updates.
3. **Scanner profile differences**
   - Missing Enter suffix or non-keyboard mode will slow operation.
4. **Network quality in warehouse aisles**
   - Latency/timeouts may appear as intermittent scan failures.
5. **Operator navigation mistakes**
   - Browser back button can leave intended flow.

---

## 8) Rollback Instructions

## Option A: Fast feature removal (frontend only)

1. Remove `/keyence` route import/entry from `frontend/src/App.js`.
2. Deploy frontend.

## Option B: Revert by commit

Revert the commits that introduced Keyence workflow and preview artifacts:

- `298948d` (keyence route/components)
- `ae3b585` (visual preview mockups)

## Option C: Keep code but disable access

- Use reverse proxy route controls / app-level navigation policy to hide or block `/keyence` until issues are resolved.

---

## 9) Ownership and Handoff Notes

- **ESG IT:** environment variables, networking, scanner profile setup, deployment/release controls
- **ESG Operations:** workflow validation, ergonomic feedback, edge-case behavior
- **Teammate/dev owner:** bug fixes, API contract coordination, future enhancements

