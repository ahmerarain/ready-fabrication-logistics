import React, { useState } from "react";
import { 
  BookOpen, ChevronRight, Play, Database, Sparkles, CheckCircle2, 
  Layers, Package, Scissors, GitMerge, FileText, Upload, RefreshCw, Info, HelpCircle
} from "lucide-react";

interface CoatesStorybookProps {
  setActiveTab: (tab: string) => void;
  onLoadDemoData: () => void;
  activeJobName: string;
  activeJobNumber: string;
}

export default function CoatesStorybook({ 
  setActiveTab, 
  onLoadDemoData, 
  activeJobName, 
  activeJobNumber 
}: CoatesStorybookProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      id: 1,
      title: "Coates Hire Job Loaded",
      badge: "Step 1 of 12",
      icon: BookOpen,
      workspace: "simulation",
      what: "The software initializes the Master Coates Hire Yard Assembly job (CH-2026-SYD) in Sydney.",
      why: "Investors can see a single, consistent project identity throughout the entire platform, avoiding mixed project codes and ensuring absolute commercial clarity.",
      details: "Top KPI cards dynamically bind to SQLite to display total steel parts count, dispatch kit container counts, and real-time packing progress status.",
      actionText: "Open Flow Simulator Workspace",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 text-slate-100 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider block">Active Job Registry</span>
              <h4 className="text-sm font-bold text-white font-sans mt-0.5">{activeJobName}</h4>
            </div>
            <span className="text-xs bg-slate-800 text-slate-300 font-mono py-1 px-2.5 rounded-md border border-slate-700">ID: {activeJobNumber}</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase block">Total Steel Pieces</span>
              <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">17 Loaded</span>
            </div>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-[9px] text-slate-500 uppercase block">Dispatch Kits</span>
              <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">4 Assemblies</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Imported Project Data",
      badge: "Step 2 of 12",
      icon: Upload,
      workspace: "import",
      what: "Raw Tekla Structures or SDS/2 structural schedules are imported via standard CSV or direct upload.",
      why: "Bypasses the need for tedious manual data reentry, converting pure model text rows into high-fidelity physical fabrication workstations instantly.",
      details: "The importer parses Part ID numbers, thickness, target Assembly/Member marks, bin routing, and linkable DXF shape files.",
      actionText: "Go to CSV Importer",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono">
            <Database className="w-4 h-4 animate-pulse" />
            <span>SQLite Database Raw Ingestion</span>
          </div>
          <div className="font-mono text-[10px] bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-400 leading-relaxed overflow-x-auto">
            Part_ID,Assembly_Mark,Thickness,RF_BIN,RF_STAGE,DXF_Filename,Status<br />
            PL-101,CH-M01,10,BIN-21,STAGE-1B,PL-101_10mm.dxf,Pending<br />
            PL-103,CH-M01,12,BIN-22,STAGE-1B,PL-103_12mm.dxf,Placed<br />
            PL-301,CH-R03,8,BIN-11,STAGE-3A,PL-301_8mm.dxf,Missing
          </div>
          <div className="text-center py-1">
            <span className="text-xs bg-indigo-950 text-indigo-300 font-semibold px-3 py-1 rounded-full border border-indigo-900">
              ✓ Database synchronized successfully
            </span>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Plate Parts Identified & Grouped",
      badge: "Step 3 of 12",
      icon: Scissors,
      workspace: "cutting",
      what: "Raw flat plates are automatically clustered by material thickness tags.",
      why: "Enables operators to route items of identical thicknesses to the same sheet stock plates, reducing physical handling times at the cutting lasers.",
      details: "Identifies 6mm, 8mm, 10mm, 12mm, 16mm, and 20mm structural plates, calculating the combined area and count of parts per sheet.",
      actionText: "Inspect Cutting Groups",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <h4 className="text-xs font-bold font-sans uppercase tracking-wider text-slate-400">Structural Plate Thickness Clusters</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-xs font-bold font-mono">10mm Mild Steel (2 Parts)</span>
              <span className="text-[10px] bg-slate-800 text-indigo-300 py-0.5 px-2 rounded">60,000 mm² Total</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-xs font-bold font-mono">12mm High-Tensile (3 Parts)</span>
              <span className="text-[10px] bg-slate-800 text-indigo-300 py-0.5 px-2 rounded">221,400 mm² Total</span>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-950 rounded-lg border border-slate-850">
              <span className="text-xs font-bold font-mono">20mm Gusset Grade (2 Parts)</span>
              <span className="text-[10px] bg-slate-800 text-indigo-300 py-0.5 px-2 rounded">100,000 mm² Total</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "DXF/Geometry Linked",
      badge: "Step 4 of 12",
      icon: Layers,
      workspace: "simulation",
      what: "Individual parts link dynamically to 2D vector CAD shapes (DXF files).",
      why: "Gives shop floor operators immediate visual confirmation of dimensions, drilling holes, bevels, and slot configurations before cutting starts.",
      details: "Calculates precise width, height, surface area, center-of-gravity (COG) offsets, and rotational angles on-the-fly.",
      actionText: "Verify DXF Geometry on Simulator",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 flex flex-col items-center justify-center space-y-4">
          <div className="w-full max-w-[240px] h-[130px] border border-dashed border-indigo-500 bg-slate-950 rounded-lg flex flex-col items-center justify-center relative p-3 overflow-hidden">
            <div className="absolute top-2 left-2 text-[8px] font-mono text-slate-500">DXF: PL-103_12mm.dxf</div>
            <div className="w-16 h-24 border border-indigo-400 bg-indigo-950/20 rounded relative flex items-center justify-center">
              <span className="text-[10px] text-indigo-400 font-mono">Baseplate</span>
              <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full border border-indigo-400 bg-slate-900" />
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-indigo-400 bg-slate-900" />
              <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full border border-indigo-400 bg-slate-900" />
              <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-indigo-400 bg-slate-900" />
            </div>
            <div className="text-[9px] font-mono text-indigo-400 mt-2">COG: 150, 225 | 6x Hole Slots</div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "Plate Cutting & Sorting Workflow",
      badge: "Step 5 of 12",
      icon: Scissors,
      workspace: "simulation",
      what: "Nesting sheet cutting loops are executed, and finished parts are routed into target packaging buffers.",
      why: "Tracks components in real-time during physical fabrication, giving managers instant visibility over work-in-progress (WIP).",
      details: "Shows interactive placement triggers. Operators scan QR references to transition individual flat plate steel items to 'Placed' (Packed) statuses.",
      actionText: "Mock Cut plates in Simulator",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-400">Interactive Fabrication Queue</span>
            <span className="font-mono text-emerald-400">9 / 12 Cut</span>
          </div>
          <div className="space-y-1.5">
            <div className="p-2 bg-emerald-950/30 text-emerald-300 border border-emerald-900 rounded text-xs flex justify-between items-center font-mono">
              <span>PL-103 (12mm Baseplate)</span>
              <span className="bg-emerald-900 px-1.5 py-0.5 rounded text-[9px] text-white">PLACED / PACKED</span>
            </div>
            <div className="p-2 bg-slate-950 text-slate-400 border border-slate-850 rounded text-xs flex justify-between items-center font-mono animate-pulse">
              <span>PL-101 (10mm Bracket)</span>
              <span className="bg-amber-600 px-1.5 py-0.5 rounded text-[9px] text-white">CUTTING ACTIVE</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 6,
      title: "Member Kit Boxes Created",
      badge: "Step 6 of 12",
      icon: Package,
      workspace: "boxing",
      what: "Individual structural elements are consolidated into wooden shipping kit boxes based on assembly mark values.",
      why: "Ensures all miscellaneous fittings, bracing brackets, and plate connectors are packaged cleanly alongside main columns, preventing site delivery shortages.",
      details: "Each distinct Tekla Assembly Code has its own shipping box (e.g. CH-M01, CH-R03) that acts as a secure checklist containment case.",
      actionText: "Open Member Kit Boxes",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <h4 className="text-xs font-mono font-bold">Assembly Box CASE: CH-M01</h4>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 bg-slate-950 rounded border border-slate-850 flex justify-between">
              <span>Plates (5 total)</span>
              <span className="text-amber-400 font-mono">3 / 5 Packed</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-850 flex justify-between">
              <span>Section Beams (4 total)</span>
              <span className="text-emerald-400 font-mono">4 / 4 Complete</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 7,
      title: "Section Cut List Loaded",
      badge: "Step 7 of 12",
      icon: Layers,
      workspace: "nester",
      what: "Heavy linear structural beams, hollow section braces, and rafters are loaded into the 1D Section workstation.",
      why: "Isolates long steel sections into a separate specialized shearing yard workspace with dedicated raw material stocks.",
      details: "Each linear element is assigned an Assembly Mark, Part number, profile size (e.g. 200 UB 22.3), and final length.",
      actionText: "Review 1D Section cut List",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <h4 className="text-xs font-sans font-bold uppercase tracking-wider text-slate-400">Coates Hire Heavy Section Beam Registry</h4>
          <div className="space-y-1.5 font-mono text-[10px]">
            <div className="p-2 bg-slate-950 rounded border border-slate-850 flex justify-between">
              <span>CH-BM-01 (CH-R03)</span>
              <span>250 UB 37.3 | L: 6800 mm</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-850 flex justify-between">
              <span>CH-TR-01 (CH-B10)</span>
              <span>100x100x4.0 SHS | L: 3200 mm</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      title: "1D Section Nesting in Action",
      badge: "Step 8 of 12",
      icon: Scissors,
      workspace: "nester",
      what: "The linear 1D nesting algorithm allocates beam cut requirements to commercial wholesale merchant stock bars.",
      why: "Minimizes structural steel scrap waste, directly reducing material procurement costs for contractors.",
      details: "Calculates precise layouts considering standard merchant lengths (e.g. 12m), cut allowances, and reusable offcut scrap limits.",
      actionText: "Run 1D linear Nesting Compiler",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-slate-950 rounded border border-slate-850 text-center">
              <span className="text-[8px] text-slate-500 uppercase block">Cut Allowance</span>
              <span className="text-xs font-bold font-mono">3 mm</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-850 text-center">
              <span className="text-[8px] text-slate-500 uppercase block">Merchant Length</span>
              <span className="text-xs font-bold font-mono">12,000 mm</span>
            </div>
            <div className="p-2 bg-slate-950 rounded border border-slate-850 text-center">
              <span className="text-[8px] text-slate-500 uppercase block">Min Offcut Salvage</span>
              <span className="text-xs font-bold font-mono">1,000 mm</span>
            </div>
          </div>
          <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold tracking-wider uppercase">
            Run 1D nesting compiler
          </button>
        </div>
      )
    },
    {
      id: 9,
      title: "Stock Bar Nesting Record",
      badge: "Step 9 of 12",
      icon: Layers,
      workspace: "nester",
      what: "A high-fidelity visual layout map displays how cuts fit onto each stock bar, including waste margins.",
      why: "Gives section cutting operators an explicit cut guide, showing cut order, dimensions, and scrap lengths directly on their tablet.",
      details: "Visualizes individual bars. For example, a 12m bar accommodates a 6800mm beam and a 4200mm beam, yielding 91.6% material efficiency.",
      actionText: "Inspect Nesting Bars",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono font-bold text-slate-400">Stock Bar #1 Layout (12,000 mm)</span>
            <span className="text-xs text-emerald-400 font-mono font-bold">91.6% Efficiency</span>
          </div>
          {/* Visual Bar representation */}
          <div className="h-10 w-full bg-slate-950 rounded-lg border border-slate-800 flex overflow-hidden font-mono text-[10px]">
            <div className="bg-indigo-900 border-r border-slate-900 h-full flex items-center justify-center text-white" style={{ width: "56.6%" }}>
              <span>6800mm</span>
            </div>
            <div className="bg-slate-700 border-r border-slate-900 h-full flex items-center justify-center text-white" style={{ width: "35%" }}>
              <span>4200mm</span>
            </div>
            <div className="bg-rose-950/60 h-full flex items-center justify-center text-rose-300" style={{ width: "8.4%" }}>
              <span>Scrap</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 10,
      title: "Member Kit Completion View",
      badge: "Step 10 of 12",
      icon: Package,
      workspace: "boxing",
      what: "The final quality audit screen verifies that plates (XY yard) and section columns (1D yard) have merged successfully.",
      why: "Ensures 100% complete assemblies are shipped, preventing costly construction site delays caused by missing plates or wrong-sized rafters.",
      details: "A box cannot be signed off, marked 'Ready to Dispatch', or have its transport docket locked until all sub-items are packed.",
      actionText: "Go to Kit Completion status",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold font-sans">Dispatch Container CH-M02 LOCKED & LOADED</span>
          </div>
          <div className="text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-850 text-slate-300 space-y-2">
            <div className="flex justify-between">
              <span>PLATES (PL-201, 202, 203, 204)</span>
              <span className="text-emerald-400">✓ ALL PLACED</span>
            </div>
            <div className="flex justify-between">
              <span>SECTION CUTS (CH-BM-01, 02)</span>
              <span className="text-emerald-400">✓ ALL CUT</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 11,
      title: "QR Code & Reference Traceability",
      badge: "Step 11 of 12",
      icon: GitMerge,
      workspace: "traceability",
      what: "Scanning any QR reference resolves the component’s entire birth certificate in the SQLite backend.",
      why: "Provides comprehensive compliance tracking, enabling immediate structural engineer sign-off on safety certifications.",
      details: "Links assembly codes, operator notes, mill heat raw plate numbers (e.g. HS-101-COL), and spatial packing dimensions.",
      actionText: "Verify QR Traceability Chain",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            {/* Mock QR SVG */}
            <div className="w-12 h-12 bg-white p-1 rounded-md shrink-0">
              <svg className="w-full h-full text-slate-950" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2,2 H8 V8 H2 Z M4,4 H6 V6 H4 Z M16,2 H22 V8 H16 Z M18,4 H20 V6 H18 Z M2,16 H8 V22 H2 Z M4,18 H6 V20 H4 Z M11,11 H13 V13 H11 Z M11,2 H13 V5 H11 Z M16,16 H19 V19 H16 Z M19,19 H22 V22 H19 Z" />
              </svg>
            </div>
            <div className="text-xs">
              <span className="font-mono text-indigo-400 block font-bold">QR-CH-A01-7112</span>
              <p className="text-slate-400 mt-1">Traceability resolved down to wholesale billet certified heat #HS-33829-X.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 12,
      title: "Reports, Exports & Dispatch",
      badge: "Step 12 of 12",
      icon: FileText,
      workspace: "nester",
      what: "Generates high-contrast packing slips, linear cut spreadsheets, and CSV files for CNC cutting equipment.",
      why: "Ensures smooth handoffs to delivery drivers and CNC mill operators, making dispatch transactions fully digital and paperless.",
      details: "Outputs complete shipping reports detailing total dispatch weight, packing progress, and exceptions logging.",
      actionText: "Generate Dispatch reports",
      visualization: (
        <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-slate-100 text-center space-y-3">
          <FileText className="w-10 h-10 text-indigo-400 mx-auto animate-bounce" />
          <h4 className="text-xs font-bold font-mono">CH-2026-SYD_DispatchSummary.csv</h4>
          <span className="text-[10px] bg-indigo-950 text-indigo-300 py-1 px-3 rounded-full border border-indigo-900">
            Export ready for CNC Cutting & Transport
          </span>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-6">
      {/* HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-150 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold tracking-tight text-slate-850 font-sans">
              Coates Hire Master Storybook Demo
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-xl font-medium">
            This interactive walk-through shows investors and structural partners exactly how the ReadyFab fabrication-tracking workflow runs.
          </p>
        </div>

        {/* ONE-CLICK SEED DEMO PROCESS BUTTON */}
        <button
          onClick={() => {
            onLoadDemoData();
            setCurrentStep(0);
          }}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm shrink-0 uppercase tracking-wider"
          title="Instantly resets and seeds SQLite database and client states with Coates Hire test data."
        >
          <RefreshCw className="w-4 h-4 text-indigo-400" />
          <span>Load Coates Hire Demo Process</span>
        </button>
      </div>

      {/* CORE STORYBOOK GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: STEP LIST */}
        <div className="lg:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-3 px-2">
            Storybook Walkthrough Sequence
          </div>
          {steps.map((s, idx) => {
            const IconComponent = s.icon;
            const isSelected = idx === currentStep;
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(idx)}
                className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer select-none ${
                  isSelected 
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                    : "bg-slate-50 text-slate-700 border-slate-150 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-6 h-6 rounded-lg text-[10px] font-bold font-mono flex items-center justify-center ${
                    isSelected ? "bg-indigo-750 text-white" : "bg-slate-200 text-slate-600"
                  }`}>
                    {s.id}
                  </span>
                  <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`} />
                  <span className="truncate">{s.title}</span>
                </div>
                <ChevronRight className={`w-4 h-4 shrink-0 transition ${isSelected ? "text-white opacity-100 translate-x-0.5" : "text-slate-300 opacity-0 group-hover:opacity-100"}`} />
              </button>
            );
          })}
        </div>

        {/* RIGHT COLUMN: DETAILED VIEW OF ACTIVE STEP */}
        <div className="lg:col-span-7 bg-slate-50 border border-slate-150 rounded-2xl p-6 md:p-8 flex flex-col justify-between space-y-6">
          
          {/* STEP HEADER & DESCRIPTION */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] bg-indigo-100 text-indigo-750 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {currentStepData.badge}
              </span>
              <span className="text-xs text-slate-400 font-mono font-medium">ReadyFab Workflow Module</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight font-sans">
                {currentStepData.id}. {currentStepData.title}
              </h3>
              
              <div className="space-y-3 pt-1">
                <div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">What is happening:</span>
                  <p className="text-xs text-slate-650 font-medium leading-relaxed mt-0.5">
                    {currentStepData.what}
                  </p>
                </div>

                <div>
                  <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Why it matters to investors:</span>
                  <p className="text-xs text-indigo-850 font-medium bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/50 leading-relaxed mt-0.5">
                    💡 {currentStepData.why}
                  </p>
                </div>

                {currentStepData.details && (
                  <div className="text-slate-400 text-[11px] leading-relaxed italic">
                    Note: {currentStepData.details}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* DYNAMIC COMPONENT MOCK / VISUALIZATION */}
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-2">Live Demonstration Visual:</span>
            {currentStepData.visualization}
          </div>

          {/* WORKSPACE DEEP LINK ACTION */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
            <button
              onClick={() => setActiveTab(currentStepData.workspace)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{currentStepData.actionText}</span>
            </button>
            
            {currentStep < steps.length - 1 && (
              <button
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

        </div>

      </div>

      {/* FOOTER INVESTOR CALLOUT */}
      <div className="p-4 bg-emerald-50/60 border border-emerald-150 rounded-xl flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-850 font-medium leading-relaxed">
          <strong className="text-emerald-950 font-bold block mb-0.5">Proof of Workflow Demonstration</strong>
          This storybook validates that ReadyFab is not just an idea. Each tab contains genuine SQLite integration, state managers, linear optimization equations, and compliance resolvers that run natively in the browser.
        </div>
      </div>
    </div>
  );
}
