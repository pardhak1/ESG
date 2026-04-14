# Handheld Scanner Implementation Guide

## Overview
The handheld scanner UI is implemented using the Keyence flow in React. It provides a step-by-step workflow optimized for portrait mode on handheld devices.

## Route
- **URL:** `/keyence`
- **Component:** `frontend/src/component/keyence/KeyencePage.jsx`

## Flow Steps
1. **Step 1: Select Work Order** - Choose from available work orders
2. **Step 2: Select Station** - Choose the workstation for the selected kit
3. **Step 3: Scan Tray Label** - Scan or enter the tray barcode
4. **Step 4: Scan Lenses** - Scan individual lens barcodes and complete the tray

## Key Components
- `KeyencePage.jsx` - Main controller component handling step transitions
- `KeyenceWorkorderStep.jsx` - Select work order UI
- `KeyenceStationStep.jsx` - Select station UI
- `KeyenceTrayStep.jsx` - Scan tray label UI
- `KeyenceScanStep.jsx` - Scan lenses UI with planogram grid

## State Management
All state is stored in localStorage with the following keys:
- `WorkOrder` - Selected work order identifier
- `kit_code` - Selected kit code
- `workorder_id` - Work order ID from backend
- `Station` - Selected station/workstation ID
- `trayLabel` - Scanned tray label
- `trayID` - Tray ID from backend
- `trayNumber` - Tray number extracted from label
- `lensGoal` - Target lens count for tray
- `nLens` - Current scanned lens count
- `scanSession` - Complete scan session data from backend
- `Planogram` - Grid/planogram layout for the tray

## Backend API Endpoints
The handheld scanner uses the same endpoints as the desktop version:

1. **Load Work Orders**
   - `GET /api/scan/getic`
   - Returns: List of work orders

2. **Load Stations**
   - `GET /api/scan/stationct/{kitCode}`
   - Returns: List of stations for a kit

3. **Validate Tray**
   - `GET /api/scan/trayid1/{trayLabel}/{stationId}`
   - Returns: Tray information and current scan status

4. **Load Planogram**
   - `GET /api/scan/getstation/{kitCode}/{stationId}/{trayNumber}`
   - Returns: Plant layout/lens grid data

5. **Validate Scan**
   - `GET /api/scan/validate_scan/{upc}/{kitCode}/{trayNumber}/{stationId}`
   - Returns: Validation result for scanned lens

6. **Submit Scan**
   - `POST /api/scan/submit_scan/`
   - Body: `{ upc, exp, lotnum, trayID, barcode, unparsed, upcVerify }`
   - Returns: Submission result

## UI Features
- **Step Counter** - Shows current step (Step 1/4, 2/4, etc.)
- **Status Cards** - Displays current work order, kit, station, and tray
- **Reset Button** - Clears all state and returns to step 1
- **Auto-focus Inputs** - Ready for barcode scanner input
- **Completion Status** - Shows progress of lens scans with visual indicators
- **Completion Message** - Displays when tray is fully populated
- **Touch-optimized** - Large buttons (52px+ height) for easy touch interaction

## Barcode Parsing
The scanner supports two barcode formats:
1. **01-prefixed (GTIN with serial)**
   - Format: 01{UPC12}{Exp6-digit}...
   - Extracts 12-digit UPC and 6-digit expiration

2. **17-prefixed (Expiration)**
   - Format: 17{Exp6-digit}...
   - Extracts 6-digit expiration and lot number

3. **Fallback (Raw barcode)**
   - Uses raw barcode value as UPC if format doesn't match

## Tray Label Parsing
- Extracts tray number from label format: `T(\d+)`
- Example: "C1DMF2430-UPC-T4" → tray number "4"

## Testing Checklist
- [ ] User can select a work order
- [ ] User can select a station for the chosen kit
- [ ] User can scan a valid tray label
- [ ] Planogram displays correctly with expected lens counts
- [ ] User can scan lens barcodes
- [ ] Barcode is properly parsed and validated
- [ ] Scan count updates after each submission
- [ ] Completion message appears when tray is full
- [ ] Reset button clears all state and returns to step 1
- [ ] Back buttons navigate to previous steps
- [ ] UI is responsive and touch-friendly
- [ ] All error messages are clear and actionable

## Deployment Notes
- Ensure all backend API endpoints are accessible from the frontend
- Set `REACT_APP_BACKEND_HOST` environment variable correctly
- The handheld scanner is accessible to both ADMIN and REGULAR deployment modes
- No additional configuration needed beyond the standard frontend setup

## Common Issues & Solutions

### Tray not found
- Verify the tray label is correct and exists in the system
- Ensure the tray belongs to the selected work order
- Check that the station is correctly selected

### Invalid scan
- Verify the barcode is a valid product UPC
- Check that the lens UPC matches the planogram
- Ensure the barcode format is supported (01-prefix, 17-prefix, or raw)

### Station not showing
- Verify the kit code is correct
- Ensure the selected work order has available stations
- Check backend is returning proper station data

## Future Enhancements
- Add offline scanning capability with local sync
- Implement barcode history for quick re-entry
- Add QR code support for tray and kit identification
- Implement voice feedback for scan success/failure
- Add multi-language support for international warehouses
