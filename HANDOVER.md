# ReadyFab Logistics Handover Pack

This document outlines the architecture, sample files, and execution guidelines for demonstrating the **ReadyFab Logistics Platform** with the master **Coates Hire Sydney Yard Assembly (CH-2026-SYD)** walkthrough.

---

## 1. The One-Click Coates Hire Demo Process

To ensure you can present the software reliably without manually rebuilding structures or fighting with CSV files:

1. Open the application preview.
2. You will land directly on the **Coates Storybook** tab (customized in violet).
3. Click the dark button: **`LOAD COATES HIRE DEMO PROCESS`** at the top right.
4. This instantly executes the following automated workflow:
   - Truncates and resets the backend SQLite database with fresh Coates Hire plate parts.
   - Clears and populates the client-side `localStorage` with Coates Hire 1D linear section beams (`CH-M01`, `CH-R03`, `CH-B10`).
   - Rebinds the top-level workshop indicators and registry metadata to **Coates Hire Yard Assembly - Sydney (CH-2026-SYD)**.
   - Synchronizes stats on-the-fly and loads the interactive 12-step slide sequence.

---

## 2. Coates Hire Sample Data Files

Below are the exact CSV file templates pre-loaded by the demo process. You can copy these and use them in the **Import CSV Schedule** tab to demonstrate custom parsing.

### A. Flat Plate Geometry & Bin Routing Schedule

```csv
Part_ID,Assembly_Mark,Thickness,RF_BIN,RF_STAGE,DXF_Filename,Status
PL-101,CH-M01,10,BIN-21,STAGE-1B,PL-101_10mm.dxf,Pending
PL-102,CH-M01,10,BIN-21,STAGE-1B,PL-102_10mm.dxf,Pending
PL-103,CH-M01,12,BIN-22,STAGE-1B,PL-103_12mm.dxf,Placed
PL-104,CH-M01,12,BIN-22,STAGE-1B,PL-104_12mm.dxf,Pending
PL-105,CH-M01,16,BIN-25,STAGE-1B,PL-105_16mm.dxf,Pending
PL-201,CH-M02,10,BIN-21,STAGE-2A,PL-201_10mm.dxf,Placed
PL-202,CH-M02,10,BIN-21,STAGE-2A,PL-202_10mm.dxf,Placed
PL-203,CH-M02,20,BIN-29,STAGE-2A,PL-203_20mm.dxf,Placed
PL-204,CH-M02,20,BIN-29,STAGE-2A,PL-204_20mm.dxf,Placed
PL-301,CH-R03,8,BIN-11,STAGE-3A,PL-301_8mm.dxf,Missing
PL-302,CH-R03,8,BIN-11,STAGE-3A,PL-302_8mm.dxf,Pending
PL-303,CH-R03,8,BIN-12,STAGE-3A,PL-303_8mm.dxf,Pending
PL-304,CH-R03,12,BIN-23,STAGE-3A,PL-304_12mm.dxf,Pending
PL-305,CH-R03,12,BIN-23,STAGE-3A,PL-305_12mm.dxf,Pending
PL-306,CH-R03,12,BIN-24,STAGE-3A,PL-306_12mm.dxf,Pending
PL-401,CH-B10,6,BIN-05,STAGE-1A,PL-401_6mm.dxf,Placed
PL-402,CH-B10,6,BIN-05,STAGE-1A,PL-402_6mm.dxf,Exception
```

### B. 1D Linear Structural Beam Cut List

```csv
Assembly Mark,Part Mark,Profile,Section Family,Material,Original Length,Allowance,Final Cut Length,Quantity,QR Reference
CH-M01,CH-PL-101,200 UB 22.3,Hot Rolled Sections,Grade 300,5510,10,5500,1,QR-CH-M01-101
CH-M01,CH-CS-01,100x100x12 EA,Hot Rolled Sections,Grade 300,1250,0,1250,2,QR-CH-M01-CS
CH-B10,CH-TR-01,100x100x4.0 SHS,Hollow Sections,Grade 350,3018,3,3015,3,QR-CH-B10-TR1
```

---

## 3. Visual Storybook Sequence

The **Coates Storybook** includes 12 visual interactive slides to walk investors through the unified workflow:

1. **Coates Hire Job Loaded**: Active job registry binds all screens to a single consistent project.
2. **Imported Project Data**: Demonstrates automated parsing of model CSV text streams into SQLite tables.
3. **Plate Parts Grouped**: Groups flat parts by material thickness (e.g. 10mm, 12mm) to organize XY cutting sheets.
4. **DXF/Geometry Linked**: Previews CAD metrics, slots, drill holes, and COG offsets in-browser.
5. **Plate Cutting & Sorting**: Real-time interactive status changes as parts move from laser sheets to sorting.
6. **Member Kit Boxes Created**: Gathers finished elements into wooden shipping boxes grouped by assembly code.
7. **Section Cut List Loaded**: Shows the high-tensile structural columns and rafter beams.
8. **1D Section Nesting in Action**: Allocates rafter/column cuts to commercial stock bars considering cut allowances.
9. **Stock Bar Nesting Record**: Renders a clear 1D layout map of each wholesale bar showing scrap yields.
10. **Member Kit Completion View**: Checks-in plate pieces and section beams into the same shipping kit box.
11. **QR & Traceability Chain**: Scans tracking barcodes, resolving records down to the parent billing heat certificate.
12. **Reports, Exports & Dispatch**: Generates raw CSV schedules for section cutting stations and digital shipping dockets for drivers.

---

## 4. Build & Run Instructions

### Development Environment

To launch the server and frontend in a local development environment:

```bash
# Install package dependencies
npm install

# Start the tsx express server with integrated vite middleware
npm run dev
```

### Production Build

To compile the static React assets and bundle the TypeScript server into a production-safe self-contained package:

```bash
# Bundle static files and compile server.ts to dist/server.cjs
npm run build

# Boot the bundled production environment
npm run start
```

---

## 5. Known Limitations & Technical Safeguards

- **Local Storage Sandbox**: The 1D linear nesting settings and list states are stored inside client-side `localStorage` to allow fast browser calculations. Triggering `LOAD COATES HIRE DEMO PROCESS` resets this storage to a safe, clean baseline.
- **Mock DXF Preview**: Since standard web browsers cannot parse heavy binary DWG/DXF files natively without bulky AutoCAD plugins, DXF contours are dynamically drawn using high-performance vector SVG layers based on coordinate profiles.
- **Double SQLite / JSON Fallback**: If SQLite experiences locks or write failures on the sandboxed server host, the application automatically switches to an optimized local JSON-flat-file state engine to ensure the presentation remains 100% active and fail-safe.

---

## 6. Recommended Next Steps for Commercialization

1. **Decoupled Production Backend Architecture**: Transition the current integrated Express setup into a separate, dedicated backend service (such as a separate Node.js/Express repository or NestJS API) deployed on scalable cloud infrastructure (AWS ECS, Google Cloud Run, etc.). This ensures modular separation of static React assets from dynamic backend endpoints.
2. **Enterprise Database Integration (MongoDB or PostgreSQL)**: Migrate the lightweight local SQLite/JSON fallback setup to a scalable cloud database. Choose **MongoDB** (highly scalable, document-oriented, perfect for nested steel plate assemblies and variable dimensions) or **PostgreSQL / Supabase** (exceptional relational features for rigid tracking manifests, heat-number lineages, and multi-user transactional consistency).
3. **Direct Tekla API Webhooks**: Integrate Tekla/Trimble direct webhooks to bypass CSV importing entirely and pull design models live into the shop floor.
4. **True 2D Nesting Engine (Bin Packing)**: Connect an external nesting web API (e.g., NestLib or Sigmanest) to perform true irregular shape packing geometry on raw metal sheets.
5. **RFID & IoT Gateways**: Replace mock QR code clicks with physical BLE (Bluetooth Low Energy) or RFID industrial gateways to track components automatically as they cross gantry sensors.
