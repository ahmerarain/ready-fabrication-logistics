# ReadyFab Plate Sorting Software (RF-PSS)
## Technical Handover & Transition Documentation

This document serves as the official technical handover guide for the **ReadyFab Plate Sorting System**, an interactive full-stack digital-twin console designed to trace physical steel nested plates from initial CSV fabrication schedule imports down to completed member container assemblies.

---

## 1. System Architecture Overview

The system is designed with a modern full-stack decoupling paradigm matching the constraints of physical workshop environments:

```
┌────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                      │
│        React SPA (Vite) + Tailwind CSS + Lucide        │
└───────────────────────────┬────────────────────────────┘
                            │ (JSON REST Protocol / Web UI)
┌───────────────────────────▼────────────────────────────┐
│                     BACKEND LAYER                      │
│        Express.js Server (Port: 3000)                  │
└───────────────────────────┬────────────────────────────┘
                            │ (Local Relational SQL Adapter)
┌───────────────────────────▼────────────────────────────┐
│                    PERSISTENCE LAYER                   │
│         SQLite Embedded Database File (`database.sqlite`)│
└────────────────────────────────────────────────────────┘
```

*   **Host Port Compliance**: Strictly configured for **Port 3000** binding on host `0.0.0.0` to route seamlessly through container proxies.
*   **Persistent SQLite Storage**: Uses lightweight relational tracking ensuring plates, boxing structures, operator override memos, and event logs endure hard system power cycles or browser refreshes.

---

## 2. Core Functional Modules

### 2.1. Ingest & Schedule Division (`CSVImporter`, `CuttingGroups`)
*   **CSV Parser**: Translates plate records (part identity, layout lengths, widths, thickness gauges, and parent assembly kits) into structural entity maps.
*   **Material Grouping**: Segregates nested parts by raw plate thickness profiles (e.g., 10mm or 16mm structural grade steel) for batched CNC Laser nesting operations.

### 2.2. Parent Kit Box Containers (`BoxingGroups`)
*   **Packing Engine**: Traces completed, pending, or damaged parts mapped to physical shipping containers (e.g., column structural kits, roof rafters).
*   **Real-time Shipping Weights**: Sums dimensional plate volume metrics directly to display continuous total estimated shipping box weight indicators.
*   **Delivery Docket Exporter**: Generates instant printable shipping papers optimized for driver check-off and sign-on-delivery routines.

### 2.3. Live Cutting State-Machine (`WorkflowSimulator`)
*   **Interactive Laser Bed**: Simulates physical multi-speed laser head trajectories cutting specific plate layout kits in sequence.
*   **Error Prevention Engine**: Blocks packing attempts if an operator selects a part that does not belong to the active destination shipping container. Initiates auditory warning alerts and dynamic safety dialogs.
*   **Run Controllers**: Speed adjustments, real-time laser head coordinates tracker, and complete restart triggers.

### 2.4. End-on-End Digital Thread (`TraceabilityChain`)
*   **Unified Pedigree**: Links raw plate designs to laser sequence statuses, final boxed container targets, and final exceptions overrides.
*   **Cross-Screen Barcoding**: Allows operators to scan or click QR identifiers anywhere in the interface to trigger deep-link traceability inspections instantly.

### 2.5. Overrides Desk (`ExceptionsHub`)
*   **Audible Warnings**: Logs and manages floor abnormalities like unreadable labels or physically skewed sheets.
*   **Interactive Correction**: Operators can update part statuses, apply remedial categories (e.g., Warped, Tag Destroyed), and attach handwritten override memos.

### 2.6. User Onboarding Flow (`ProductTour`)
*   **Interactive Guide**: Step-by-step modal tours highlighting UI tabs with a backdrop lighting mask.
*   **Dynamic States**: Initiates fresh from Step 1 on every manual triggers, automatically switching active tabs in sync with the operator's progression.

---

## 3. Database Schema

The persistent engine stores state records within `database.sqlite` matching these core relational structures:

### Parts Table (`parts`)
*   `id` (TEXT, Primary Key) - The unique component ID.
*   `thickness` (REAL) - Steel metal thickness (mm).
*   `length` / `width` (REAL) - Dimensional values.
*   `box_id` (TEXT) - Parent member assembly kit box ID.
*   `status` (TEXT) - Current floor state (`Pending`, `Placed`, `Missing`, `Exception`).
*   `override_reason` / `operator_note` (TEXT) - Incident logs.

### Boxes Table (`boxes`)
*   `id` (TEXT, Primary Key) - Unique transport container ID.
*   `name` (TEXT) - Container label (e.g., "Steel Column Group A").
*   `target_weight` (REAL) - Estimated weight limitations.

---

## 4. Run & Deployment Commands

### Development Setup
Start Node backend environment concurrently with hot Vite services:
```bash
npm install
npm run dev
```

### Production Build Sequence
Bundles Vite static bundles directly into `/dist`, and compiles `/server.ts` to bundled, single-file CommonJS architecture for fast cloud starts:
```bash
npm run build
npm start
```

---

## 5. Phase 1–4 Completed Feature Checklist

The software successfully achieves all phase objectives to simulate a modern workshop floor flow from source model CAD data down to shipping verification:
*   ✅ **Model / Export Data ingestion (Phase 1)**: Robust parser handles CSV layout structures containing metadata such as part numbers (`Part_ID`), `Assembly_Mark`, `Thickness` gauges, and CAD filename mappings (`DXF_Filename`).
*   ✅ **Thickness-Based Cutting Groups (Phase 1)**: Auto-parses inputs to categorize work schedules into clean groups based on metal thickness (e.g. 10mm, 16mm plates), allowing optimized nested cutting batches.
*   ✅ **Interactive Laser State-Machine (Phase 2)**: Dynamic multi-speed visualizer tracks CNC cutting heads, displaying live laser path sequence markers and coordinates.
*   ✅ **Cut & Pack Confirmation (Phase 2)**: Real-time scan simulations let operators confirm status shifts from `Pending`/`In Progress` directly to `Placed` or flagged as exceptions.
*   ✅ **Wrong-Container Guardrails (Phase 2)**: Built-in safety warnings and sound assets play immediately when an operator attempts to place a part in the wrong member kit shipping container.
*   ✅ **Member Kit Box Assembly (Phase 3)**: Automatic sorting of cut plate states inside structural assembly containers (e.g., Column, Rafter, or Brace groups). Displays running total estimated shipment weights.
*   ✅ **QR Code & Log Traceability Chain (Phase 3)**: Allows cross-tab exploration. Operators click or scan QR code identifiers to immediately trace any plate back to its raw material gauge source.
*   ✅ **Exceptions Desk Overrides (Phase 3)**: An operator console to manage warped plates, missing RFID labels, or double scans. Re-assigns status labels and records handwritten override memos.
*   ✅ **Integrated Interactive Hand-on Walkthrough (Phase 4)**: Live high-fidelity multi-step onboarding guide (`ProductTour`) highlighting tab elements under a spotlight mask to instruct floor personnel.
*   ✅ **High-Fidelity Delivery Dockets (Phase 4)**: Printable logistics manifests listing item compliance parameters, completion ratios, estimated weight metrics, and supervisor signature lines.

---

## 6. Known Limitations of the Current Prototype

During workshops trials, developers should keep these core technical constraints in mind:
*   **Static Local Database**: The SQLite instance is configured for offline-first single-appliance servers. Concurrent operations by multiple tablets simultaneously will require upgrading to a centralized database (e.g. cloud PostgreSQL DB).
*   **Simulated Scanner Input**: The barcode scanner operates via simulated clicking in the visualizer dashboard. It listens to keyboard events, but lacks active TCP/IP raw socket listeners to capture wireless network barcode scanners directly.
*   **Fixed Coordinates Matrix**: The CNC laser trajectory paths utilize approximate geometric centroids derived from part size properties rather than raw `.dxf` shape coordinates.
*   **Client Noise Assets**: Wrong-box audio cues rely on the standard client browser audio engine (`AudioContext`). Hardware alarms on high-noise warehouse floors must be reinforced with external IoT buzzers.

---

## 7. Real CNC Machine & Gantry Integration Path

To transition from the simulated state-machine to direct connection with physical machinery (such as automated gantries, CNC laser heads, or magnetic plate pickers), implement the following communication architecture:

```
┌────────────────────────┐         PLC Protocol         ┌────────────────────────┐
│     ReadyFab Server    │ ───────────────────────────> │ PLC Controller / Modbus│
│   (Express REST/WS)    │ <─────────────────────────── │ (Gantry Active Status) │
└────────────────────────┘          (S7 / OPC-UA)       └────────────────────────┘
            │                                                       │
            │ (Sub-Millisecond Loop)                                │ (Pneumatic IO)
┌───────────▼────────────┐                              ┌───────────▼────────────┐
│ Physical Scanning Gun │                              │ Magnetic Picker Gantry │
│ (Keyboard Wedge USB)   │                              │  (Vac-Lifter Plate)    │
└────────────────────────┘                              └────────────────────────┘
```

1.  **Industrial Protocol Adapters**: Introduce an industrial abstraction gateway (such as **Node-RED** or an **OPC-UA Server**) beside the Node.js server. Use TCP/IP libraries such as `node-snap7` (for Siemens PLC triggers) or `modbus-serial` to bind physical gantry I/O bits directly to Express state transitions.
2.  **Machine Feedback Loop**: Replace simulated CNC execution signals on the `/api/simulator/progress` endpoints with physical PLC binary feedback registers (e.g., "NC Program Running", "Cut Completed", "Gantry In-Travel").
3.  **Automatic Part Tag Alignment**: Map laser cut markers to physical inkjet/label printing modules situated on the cutting arm to stamp physical parts with distinct UUID QR codes as they are sliced.

---

## 8. Crucial Implementation & Workshop Boundaries

When operating the tracking network, respect these architectural bounds:
*   **Physical Box Weight Limits**: The system aggregates absolute plate weights using standard density coefficients ($7850 \text{ kg/m}^3$ for mild steel). While the software lists infinite tolerance, physical containers must enforce strict maximum physical box limits ($2500 \text{ kg}$ per pallet) to prevent structural crane failures.
*   **Relational Isolation Constraint**: Modifying `Part_ID` values midway through fabrication risks breaking the downstream logistics chain. The `Part_ID` must remain a read-only immutable key once a nested sequence starts.
*   **Scaffold Database Sync**: Any direct manual query execution on the local host SQLite database file `database.sqlite` must be sequenced within atomic transactions (`BEGIN EXCLUSIVE TRANSACTION`) to prevent write-lock collisions on single-core embedded computers.

---

## 9. Handover Checklist & Next Steps
1.  **Hardware Scanners Integration**: Replace the simulation triggers in `WorkflowSimulator` with real USB keyboard-wedge barcode scanners targeting standard document focus hooks.
2.  **ERP Data Mapping**: Map the `/api/import` endpoint to ingest raw enterprise JSON datasets in place of standard CSV schedules.
3.  **Physical Printer Deployment**: Wire client print triggers (`window.print()`) directly to mobile thermal lane tag printers for immediate shipment container labeling.
