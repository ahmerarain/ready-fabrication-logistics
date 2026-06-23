import React, { useState, useEffect } from "react";
import { Package, Table, Scissors, Upload, Hammer, Database, RefreshCw, Layers, CheckCircle, GitMerge, ShieldAlert, Award, FileText, Edit2, Check, X, HelpCircle, Sparkles } from "lucide-react";
import { Part, PartStatus } from "./types";
import CSVImporter from "./components/CSVImporter";
import PartsTable from "./components/PartsTable";
import CuttingGroups from "./components/CuttingGroups";
import BoxingGroups from "./components/BoxingGroups";
import WorkflowSimulator from "./components/WorkflowSimulator";
import TraceabilityChain from "./components/TraceabilityChain";
import ExceptionsHub from "./components/ExceptionsHub";
import { enrichPartsList } from "./utils/traceabilityHelper";
import QRTraceabilityResolver from "./components/QRTraceabilityResolver";
import ProductTour from "./components/ProductTour";
import SectionNester, { SectionPart } from "./components/SectionNester";

type TabID = "simulation" | "traceability" | "boxing" | "cutting" | "inventory" | "import" | "exceptions" | "nester";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabID>("simulation");
  const [parts, setParts] = useState<Part[]>([]);
  const [sectionParts, setSectionParts] = useState<SectionPart[]>([]);
  const [stats, setStats] = useState({
    totalParts: 0,
    totalPlaced: 0,
    totalBoxes: 0,
    completedBoxes: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Dynamic Active Job Properties
  const [activeJobName, setActiveJobName] = useState<string>("Coates Hire Yard Assembly - Sydney");
  const [activeJobNumber, setActiveJobNumber] = useState<string>("CH-2026-SYD");
  const [isEditingJob, setIsEditingJob] = useState<boolean>(false);
  const [tempJobName, setTempJobName] = useState<string>("");
  const [tempJobNumber, setTempJobNumber] = useState<string>("");
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Unified QR scanner state and step navigation state for deep-links
  const [selectedPartId, setSelectedPartId] = useState<string>("");
  const [activeStep, setActiveStep] = useState<number>(2);
  const [resolvedQR, setResolvedQR] = useState<{
    isOpen: boolean;
    entityType: "part" | "assembly" | "box";
    entityId: string;
  }>({
    isOpen: false,
    entityType: "part",
    entityId: ""
  });

  const handleOpenQRResolver = (type: "part" | "assembly" | "box", id: string) => {
    setResolvedQR({
      isOpen: true,
      entityType: type,
      entityId: id
    });
  };

  const handleNavigateToTraceability = (partId: string, stepId: number) => {
    setSelectedPartId(partId);
    setActiveStep(stepId);
    setActiveTab("traceability");
  };

  // Fetch all parts and stats from express backend
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [partsRes, statsRes] = await Promise.all([
        fetch("/api/parts"),
        fetch("/api/stats")
      ]);

      if (partsRes.ok && statsRes.ok) {
        const partsData = await partsRes.json();
        const statsData = await statsRes.json();
        setParts(enrichPartsList(partsData));
        setStats(statsData);
      }
    } catch (error) {
      console.error("Failed to load dashboard data from SQLite API:", error);
      showTemporaryStatus("Failed to synchronize with server. Using offline values.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showTemporaryStatus = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Change single part status (Pending, Placed, Missing, Exception)
  const handleChangePartStatus = async (partId: string, nextStatus: PartStatus) => {
    // Optimistic state update in local React state for buttery-smooth UX
    const updatedParts = parts.map(p => {
      if (p.Part_ID === partId) {
        return { ...p, Status: nextStatus };
      }
      return p;
    });
    setParts(updatedParts);

    try {
      const res = await fetch(`/api/parts/${partId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: nextStatus })
      });

      if (!res.ok) {
        throw new Error("Server rejected status update.");
      }
      
      // Update official statistics
      fetchDashboardData();
    } catch (err) {
      // Revert optimistic state on failure
      setParts(parts);
      console.error(err);
      showTemporaryStatus(`Error syncing item ${partId} to SQLite.`);
    }
  };

  // Persistent Exception & Operator Note Logging Action
  const handleUpdateExceptionDetails = async (partId: string, exceptionType: string, operatorNote: string, status: PartStatus) => {
    // Optimistic state update in local React state for quick response
    const updatedParts = parts.map(p => {
      if (p.Part_ID === partId) {
        return { ...p, Exception_Type: exceptionType, Operator_Note: operatorNote, Status: status };
      }
      return p;
    });
    setParts(updatedParts);

    try {
      const res = await fetch(`/api/parts/${partId}/exception`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Exception_Type: exceptionType,
          Operator_Note: operatorNote,
          Status: status
        })
      });

      if (!res.ok) {
        throw new Error("Server rejected exception update payload.");
      }

      await fetchDashboardData();
    } catch (err) {
      setParts(parts); // Revert to previous safe values
      console.error(err);
      showTemporaryStatus(`Failed to persist override parameters details in SQLite.`);
      throw err;
    }
  };

  const handleChangeSectionPartStatus = (partId: string, nextStatus: "Pending" | "Cut" | "Exception") => {
    const updated = sectionParts.map(p => {
      if (p.Part_ID === partId) {
        return { ...p, Status: nextStatus };
      }
      return p;
    });
    setSectionParts(updated);
    localStorage.setItem("rf_ns_section_parts", JSON.stringify(updated));
    showTemporaryStatus(`Section part ${partId} status updated to ${nextStatus}.`);
  };

  // Toggle packing status for a WHOLE BOX at once (pack / unpack all items)
  const handleToggleBoxStatus = async (assemblyMark: string, makeAllPlaced: boolean) => {
    const nextStatus = makeAllPlaced ? "Placed" : "Pending";

    // Optimistically update React state
    const updatedParts = parts.map(p => {
      if (p.Assembly_Mark === assemblyMark) {
        return { ...p, Status: nextStatus };
      }
      return p;
    });
    setParts(updatedParts);

    try {
      const res = await fetch(`/api/parts/box/${assemblyMark}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Status: nextStatus })
      });

      if (!res.ok) {
        throw new Error("Server rejected box bulk update.");
      }

      fetchDashboardData();
      showTemporaryStatus(`Successfully updated all parts of assembly ${assemblyMark}.`);
    } catch (err) {
      setParts(parts);
      console.error(err);
      showTemporaryStatus(`Failed to update assembly pack state on backend SQLite.`);
    }
  };

  // Seed sample structures
  const handleRestoreSampleSeeds = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parts/seed", { method: "POST" });
      if (res.ok) {
        await fetchDashboardData();
        showTemporaryStatus("Database reset and seeded with standard fabrication samples.");
        setActiveTab("boxing");
      }
    } catch (error) {
      console.error(error);
      showTemporaryStatus("Failed to restore default datasets.");
    } finally {
      setLoading(false);
    }
  };

  // Truncate SQLite tables
  const handleClearAllSQLite = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/parts/reset", { method: "POST" });
      if (res.ok) {
        setParts([]);
        setStats({ totalParts: 0, totalPlaced: 0, totalBoxes: 0, completedBoxes: 0 });
        showTemporaryStatus("Database successfully wiped. Ready for new CSV uploads.");
        setActiveTab("import");
      }
    } catch (error) {
      console.error(error);
      showTemporaryStatus("Database wipe request failed.");
    } finally {
      setLoading(false);
    }
  };

  const overallProgressPercentage = stats.totalParts > 0 
    ? Math.round((stats.totalPlaced / stats.totalParts) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start text-slate-900">
      {/* Dynamic Network / Toast Messages Overlay */}
      {statusMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white border border-slate-800 px-5 py-3 rounded-xl shadow-lg text-xs flex items-center gap-2.5 max-w-sm pointer-events-none no-print">
          <Database className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span className="font-semibold">{statusMessage}</span>
        </div>
      )}

      {/* TOP DESCRIPTOR BAR (Not displayed during browser Print) */}
      <header className="h-16 border-b border-slate-200 bg-white shadow-xs flex items-center justify-between px-6 md:px-8 shrink-0 no-print">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            {isEditingJob ? (
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <input
                  type="text"
                  value={tempJobName}
                  onChange={(e) => setTempJobName(e.target.value)}
                  className="bg-slate-55 border border-slate-300 px-2 py-0.5 text-xs text-slate-850 font-bold rounded"
                  placeholder="Job Name"
                />
                <input
                  type="text"
                  value={tempJobNumber}
                  onChange={(e) => setTempJobNumber(e.target.value)}
                  className="bg-slate-55 border border-slate-300 px-2 py-0.5 text-xs text-slate-850 font-bold rounded w-28"
                  placeholder="Job ID"
                />
                <button
                  type="button"
                  onClick={() => {
                    setActiveJobName(tempJobName || "Sydney Metro Expansion");
                    setActiveJobNumber(tempJobNumber || "RF-2026-HQ-01");
                    setIsEditingJob(false);
                    showTemporaryStatus("Active Production Job Updated successfully.");
                  }}
                  className="p-1 bg-emerald-100 hover:bg-emerald-200 rounded text-emerald-800 font-bold"
                  title="Save revisions"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingJob(false)}
                  className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                  title="Discard changes"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div id="tour-job-info" className="flex items-center gap-2">
                <div>
                  <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-800 font-sans leading-none flex items-center gap-1.5 font-bold">
                    {activeJobName} 
                    <span className="text-xs font-mono text-indigo-600 block sm:inline font-bold">({activeJobNumber})</span>
                  </h1>
                  <p className="text-[9px] text-slate-400 font-semibold font-mono uppercase tracking-wider mt-0.5 block">
                    ACTIVE PRODUCTION WORKSHOP SCHEDULE RUN
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTempJobName(activeJobName);
                    setTempJobNumber(activeJobNumber);
                    setIsEditingJob(true);
                  }}
                  className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-950 rounded transition cursor-pointer"
                  title="Edit Active Job Registry"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTourOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-indigo-700"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Live Tour
          </button>
        </div>
      </header>

      {/* DYNAMIC TOP LOGISTICS STATS KPI BAR */}
      <section className="bg-slate-50 border-b border-slate-200 no-print py-6 px-6 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Steel Parts</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800 font-mono">{stats.totalParts}</span>
              <span className="text-xs text-slate-500">items loaded</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispatch Kit Boxes</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-800 font-mono">{stats.totalBoxes}</span>
              <span className="text-xs text-slate-500">assemblies</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Packed & Boxed Status</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-indigo-600 font-mono">{stats.totalPlaced}</span>
              <span className="text-xs text-slate-500">/ {stats.totalParts} ({overallProgressPercentage}%)</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 bg-indigo-600`} 
                style={{ width: `${overallProgressPercentage}%` }}
              />
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-xl shadow-xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Closed Boxes READY FOR SHIP</span>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-emerald-600 font-mono">{stats.completedBoxes}</span>
              <span className="text-xs text-slate-500">/ {stats.totalBoxes} full kits</span>
            </div>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION CONTROLS */}
      <nav className="bg-white border-b border-slate-200 no-print px-6 md:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex gap-1.5 overflow-x-auto scrollbar-none">
          <button
            id="tour-tab-simulation"
            onClick={() => setActiveTab("simulation")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "simulation"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <RefreshCw className="w-4 h-4 text-slate-500" /> Flow Simulator
          </button>

          <button
            id="tour-tab-traceability"
            onClick={() => setActiveTab("traceability")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "traceability"
                ? "bg-slate-950 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <GitMerge className="w-4 h-4 text-indigo-500" /> Traceability Chain
          </button>

          <button
            id="tour-tab-boxing"
            onClick={() => setActiveTab("boxing")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "boxing"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Package className="w-4 h-4" /> Member Kit Boxes
          </button>

          <button
            id="tour-tab-cutting"
            onClick={() => setActiveTab("cutting")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "cutting"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Scissors className="w-4 h-4" /> Cutting Groups
          </button>

          <button
            id="tour-tab-nester"
            onClick={() => setActiveTab("nester")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "nester"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-4 h-4" /> 1D Linear Nester
          </button>

          <button
            id="tour-tab-inventory"
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "inventory"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Table className="w-4 h-4" /> Master Parts Inventory
          </button>

          <button
            id="tour-tab-import"
            onClick={() => setActiveTab("import")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "import"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Upload className="w-4 h-4" /> Import CSV Schedule
          </button>

          <button
            id="tour-tab-exceptions"
            onClick={() => setActiveTab("exceptions")}
            className={`px-4 py-2 text-xs font-bold rounded-lg capitalize transition flex items-center gap-2 cursor-pointer ${
              activeTab === "exceptions"
                ? "bg-rose-600 text-white shadow-xs"
                : "text-rose-600 hover:text-rose-900 hover:bg-rose-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Exceptions Hub
          </button>
        </div>
      </nav>

      {/* CORE WORKFLOW AREA */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-xs font-medium font-sans">Connecting to SQLite Database on server...</p>
          </div>
        ) : (
          <div className="animated-view">
            {activeTab === "simulation" && (
              <WorkflowSimulator 
                parts={parts} 
                onChangeStatus={handleChangePartStatus} 
                onOpenQRResolver={handleOpenQRResolver}
              />
            )}

            {activeTab === "traceability" && (
              <TraceabilityChain 
                parts={parts} 
                onChangeStatus={handleChangePartStatus} 
                selectedPartId={selectedPartId}
                setSelectedPartId={setSelectedPartId}
                activeStep={activeStep}
                setActiveStep={setActiveStep}
              />
            )}

            {activeTab === "import" && (
              <CSVImporter 
                onImportSuccess={fetchDashboardData}
                onResetToSeeds={handleRestoreSampleSeeds}
                onClearAll={handleClearAllSQLite}
              />
            )}

            {activeTab === "inventory" && (
              <PartsTable 
                parts={parts} 
                onChangeStatus={handleChangePartStatus} 
                onOpenQRResolver={handleOpenQRResolver}
              />
            )}

            {activeTab === "cutting" && (
              <CuttingGroups 
                parts={parts} 
                onChangeStatus={handleChangePartStatus} 
                onOpenQRResolver={handleOpenQRResolver}
              />
            )}

            {activeTab === "nester" && (
              <SectionNester 
                parts={parts}
                sectionParts={sectionParts}
                onSetSectionParts={setSectionParts}
                onUpdateParts={fetchDashboardData}
              />
            )}

            {activeTab === "boxing" && (
              <BoxingGroups 
                parts={parts} 
                onChangeStatus={handleChangePartStatus}
                onToggleBoxStatus={handleToggleBoxStatus}
                onOpenQRResolver={handleOpenQRResolver}
                activeJobName={activeJobName}
                activeJobNumber={activeJobNumber}
                sectionParts={sectionParts}
                onChangeSectionPartStatus={handleChangeSectionPartStatus}
              />
            )}

            {activeTab === "exceptions" && (
              <ExceptionsHub 
                parts={parts}
                onUpdateException={handleUpdateExceptionDetails}
                onOpenQRResolver={handleOpenQRResolver}
              />
            )}
          </div>
        )}
      </main>

      {/* Global QR and Reference Code Resolver overlay popup */}
      <QRTraceabilityResolver
        isOpen={resolvedQR.isOpen}
        onClose={() => setResolvedQR(prev => ({ ...prev, isOpen: false }))}
        entityType={resolvedQR.entityType}
        entityId={resolvedQR.entityId}
        parts={parts}
        onNavigateToTraceability={handleNavigateToTraceability}
        onChangeStatus={handleChangePartStatus}
      />

      {/* Interactive Tour Guide Overlay */}
      <ProductTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        setActiveTab={setActiveTab}
      />

      {/* SIMPLE PERSISTENT FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 tracking-tight no-print">
        <p>© 2026 Ready Fabrication Logistics. All rights reserved.</p>
        <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-[10px]">
          <Database className="w-3.5 h-3.5 text-slate-400" />
          SQLite State: Connected & Synchronized
        </p>
      </footer>
    </div>
  );
}
