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

- **Node.js**: Version 18 or above (v18, v20, or v22 are recommended and tested)
- **npm**: Version 9 or above (normally bundled automatically with Node.js)
- **Permissions**: Full write permissions to the application root directory (required to initialize the local SQLite database file `workflow_db.sqlite` and the fail-safe backup file `workflow_db.json`).
- **Operating System**: Fully cross-platform (compatible with Windows, macOS, and Linux)

### 1. Installation

Install all package dependencies securely:

```bash
npm install
```

### 2. Run in Development Mode

Starts the local Express backend server and the Vite server together, bound to port `3000`:

```bash
npm run dev
```

Open your browser and navigate to: `http://localhost:3000`

### 3. Build for Production

Compiles the Vite client app to static optimized files inside `/dist`, and bundles the Express backend server (`server.ts`) into a production-ready, standalone CommonJS file at `/dist/server.cjs` using `esbuild`:

```bash
npm run build
```

### 4. Start Production Server

Runs the high-performance compiled standalone full-stack application:

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

---

## ⚠️ Known Limitations & Technical Safeguards

- **Client-Side Local Storage**: The 1D linear nesting settings and cut states are processed in-browser and cached inside `localStorage` for responsive visual calculations. Running the Coates Hire Demo Process automatically resets this storage to a clean, calibrated baseline.
- **Auto-Vector SVG dxf Previews**: Standard web browsers do not natively parse binary CAD files (like `.dxf` or `.dwg`) without heavy, licensing-restricted AutoCAD SDK plugins. The application handles this by dynamically generating interactive SVG vector coordinate layers from raw part coordinates.
- **Fail-Safe Database Fallback**: If SQLite experiences access locks, concurrency blocks, or permission restrictions on serverless or containerized hosts, the Express API instantly activates an optimized local flat-file JSON state engine (`workflow_db.json`) to keep all CRUD operations, inventory counts, and status changes 100% operational.
- **Single-Host Monolith Dev Server**: During local development, the client and server run bound under port `3000` via a unified reverse proxy middleware.

---

## 🔮 Recommended Next Steps & Commercialization

1. **Decoupled Production Backend Architecture**: Transition the current monorepo into a separate, dedicated backend service (such as a separate Express/Node.js microservice or NestJS API) deployed on scalable platforms (e.g., AWS ECS, Google Cloud Run, or Heroku), separating your API logic completely from the static frontend.
2. **Production Database Integration (MongoDB or PostgreSQL)**: Replace the local SQLite database and `workflow_db.json` files with a scalable, fully-managed database. Use **MongoDB** (for flexible, document-based steel part models and nested assembly structures) or **PostgreSQL / Supabase** (for highly relational shipping manifest schema designs with strict foreign keys).
3. **Direct CAD/ERP Integrations**: Add direct REST API webhooks for CAD design software (e.g., Tekla Structures, SDS2, or Autodesk Advanced Steel) to stream nesting CSVs directly to ReadyFab without manual files handling.
4. **Advanced 2D irregular shape Nesting Engine**: Connect a cloud-based 2D nesting API (such as NestLib, Sigmanest, or an open-source SVG packer) to calculate mathematical irregular-shape material usage on sheet plates.
5. **RFID, BLE & IoT Gateways Integration**: Replace screen scanning emulator buttons with physical industrial BLE beacons, RFID readers, or barcode scan tunnels to automatically check-in plates as they move through workshop gantries.
