# ReadyFab - RF Plate Sorting System

Welcome to the **ReadyFab RF Plate Sorting Software** prototype. This application is an industrial-grade logistic tracker and workflow simulation designed specifically for structural steel fabrication workshops.

The application allows operators to import raw CSV nested plate schedules, automatically group plates by material thickness, track their structural parent kit box dockets, view an interactive workflow simulator of the fabrication line, run end-to-end traceability queries, manage floor manufacturing exceptions, and follow a live interactive walkthrough.

---

## 🛠️ Key Features & Completed Scope

### Phase 1: Core Logistics Foundation
1. **CSV Ingestion**: Upload steel nesting schedules. The system automatically populates part records, layout dimensions, and assembly linkages.
2. **Thickness-Based Cutting Groups**: Plates are grouped and structured by raw metal gauges (e.g., 10mm or 16mm steel) for optimized CNC laser division.
3. **Parent Member / Kit Box Hierarchy**: Every physical steel part is traced back to its parent assembly container (e.g., Column or Rafter shipping kits).
4. **Operator Packing Actions**: Mark items as Pending, Placed, Missing, or Exception.
5. **Member Kit Box Summary**: Real-time assembly dockets, completed weight estimations, status progress indicators, and printable shipping manifests.

### Phase 2: Flow & Exception Simulator
1. **Visual CNC Laser Bed**: Immersive simulated visualization of physical nested parts on a metal plate layout.
2. **Laser Sequencing State Machine**: Multi-speed laser dividing simulation with real-time active head path coordinates tracking.
3. **Floor Discrepancy Emulators**: Simulate real-world workshop issues like missing RFID tags, nesting sheet defects, or double scans.
4. **Operator Wrong-Box Prevention**: Instant auditory cues and warning dialogs to prevent placing a part into the wrong shipping assembly box.
5. **Printable Delivery Dockets**: High-fidelity delivery manifests optimized for quick physical printing and signing on the warehouse floor.

### Phase 3: Guide, Refine & Polishing Features
1. **Interactive Live Product Tour**: A comprehensive, step-by-step interactive manual with overlay backdrop spotlighting, guiding operators through every single tab from Ingestion to Exceptions.
2. **Robust State Tracking**: Smart page/tab switching as the operator clicks "Next" during the product tour, and instant restart to Step 1 each time "Live Tour" is triggered.
3. **Aesthetic Spatial Optimization**: Removed heavy administrative banners and redundant dark layout cards from the **Flow Simulator**, **Traceability Chain**, and **Exceptions Hub** pages to present a clean, high-contrast, space-efficient data workspace.
4. **End-to-End Digital Thread**: Enhanced inventory stock metrics and interactive QR traceability linkages that allow quick deep-links into specific parts simply by clicking search indexes anywhere in the application.

### Phase 4: End-to-End Workflow Demo Interlock
1. **Unified Pipeline Loop**: Synthesized all structural phases into a single continuous verification stream:
   `CAD Model/CSV Export Data ➔ Raw Plate Profiles ➔ Thickness Categories ➔ CNC Cutting & QR/Barcode Scan Confirmation ➔ Member Kit Shipping Boxes ➔ Pedigree Traceability Database ➔ Production Delivery Docket Reports`.
2. **Live Step-by-Step Walkthrough Sync**: Upgraded structural tour spotlights to synchronize live tabs automatically along this exact flow sequence, ensuring zero disconnects for physical workshop trainees.
3. **Traceability Anchor Nodes**: Configured clickable QR/Barcode identifiers on all screens so operators can instantly inspect the complete digital thread of any plate part directly in the traceability screen.
4. **High-Fidelity Dispatch Delivery Dockets**: Added printable dockets to the container/member kit section containing job summaries, completion indices, estimated weight calculations, item checklists, and formal sign-off sections.

---

## 💻 Tech Stack
- **Frontend SPA**: React (Vite) + Tailwind CSS + Lucide Icons + Motion Layout animations.
- **Backend Server**: Node.js + Express + SQLite (persistent relational DB stored locally).
- **Build Utilities**: esbuild compiler + tsx (TypeScript execute runtime).

---

## 🚀 Simple Run & Build Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (Version 18 or above recommended)
- [npm](https://www.npmjs.com/) (normally bundled with Node)

### 1. Installation
Install all package dependencies securely:
```bash
npm install
```

### 2. Run in Development Mode
Starts the local express backend server and the hot-reloading Vite server bound to port `3000`:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### 3. Build for Production
Compiles the Vite client app to static files inside `/dist`, and bundles the Express server file (`server.ts`) into a production-ready CJS file at `/dist/server.cjs`:
```bash
npm run build
```

### 4. Start Production Server
Runs the high-performance compiled standalone app:
```bash
npm start
```

---

## 📂 Key Source Code Structure
- `/src/App.tsx`: Central application shell, tabs switcher, state synchronization, and live UTC system ticker.
- `/src/components/ProductTour.tsx`: The interactive manual guiding users across steps with live element highlights and auto-tab switches.
- `/src/components/WorkflowSimulator.tsx`: Live CNC laser tracking, wrong-container guardrails, and mock scanning controls.
- `/src/components/TraceabilityChain.tsx`: The complete plate pedigree view, searchable material logs, and barcode deep-links.
- `/src/components/ExceptionsHub.tsx`: Operator override console to recover lost or damaged steel plates.
- `/src/components/CSVImporter.tsx`: Handles CSV ingestion, default seed restoration, and DB resets.
- `/src/components/BoxingGroups.tsx`: Manages shipping boxes, assembly status checklists, and printable freight dockets.
- `/src/components/CuttingGroups.tsx`: Grouping layouts and steel dimensional metadata categorizations.
- `/src/types.ts`: Strictly typed core logistics and state schemas.
- `/server.ts`: Built-in SQLite Express REST server api endpoints.
