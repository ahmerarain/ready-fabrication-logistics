import React, { useState, useEffect, useRef } from "react";
import { 
  Scissors, Play, Pause, RotateCcw, Box, ArrowRight, ShieldAlert, CheckCircle2, 
  HelpCircle, Sparkles, FileText, Ban, AlertCircle, RefreshCw, Layers, Printer, Check, QrCode
} from "lucide-react";
import { Part, PartStatus } from "../types";

interface WorkflowSimulatorProps {
  parts: Part[];
  onChangeStatus: (partId: string, nextStatus: PartStatus) => void;
  onOpenQRResolver?: (type: "part" | "assembly" | "box", id: string) => void;
}

interface SimLog {
  id: string;
  time: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

export default function WorkflowSimulator({ parts, onChangeStatus, onOpenQRResolver }: WorkflowSimulatorProps) {
  // Only deal with plate parts (prefixed with PL)
  const plateParts = parts.filter(p => p.Part_ID.toUpperCase().startsWith("PL"));

  // Thickness group options
  const thicknesses = Array.from(new Set(plateParts.map(p => p.Thickness))).sort((a, b) => a - b);
  const [selectedThickness, setSelectedThickness] = useState<number>(thicknesses[0] || 10);

  // Filter parts for the active nested sheet thickness
  const activeThicknessParts = plateParts.filter(p => p.Thickness === selectedThickness);

  // Local simulator tracking
  const [activePartIndex, setActivePartIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(2000); // ms per stage
  const [simStage, setSimStage] = useState<"idle" | "cutting" | "cut-complete" | "sorting" | "placed">("idle");
  const [laserProgress, setLaserProgress] = useState<number>(0);
  const [movementOffset, setMovementOffset] = useState({ x: 0, y: 0 }); // for visual flight animation!
  
  // Kit Box Selector to display summary reports
  const kitBoxes = Array.from(new Set(parts.map(p => p.Assembly_Mark))).filter(Boolean);
  const [selectedBoxMark, setSelectedBoxMark] = useState<string>(kitBoxes[0] || "");

  // Exceptions / warnings modals & simulator feedback states
  const [logs, setLogs] = useState<SimLog[]>([]);
  const [errorNotice, setErrorNotice] = useState<{ title: string; desc: string; type: "warning" | "error" | "info" } | null>(null);
  const [wrongBoxTarget, setWrongBoxTarget] = useState<string | null>(null);
  const [showSummaryReport, setShowSummaryReport] = useState<boolean>(false);

  // Time stamp helper
  const getUtcTimestamp = () => {
    const now = new Date();
    return now.toISOString().replace("T", " ").substring(0, 19);
  };

  // Add event log message
  const addLog = (message: string, type: "info" | "success" | "warning" | "error" = "info") => {
    setLogs(prev => [
      {
        id: Math.random().toString(),
        time: getUtcTimestamp().split(" ")[1],
        message,
        type
      },
      ...prev.slice(0, 24) // limit to recent 25 logs
    ]);
  };

  // Select active part safe check
  const activePart = activeThicknessParts[activePartIndex] || activeThicknessParts[0] || null;

  // Initialize logs
  useEffect(() => {
    if (plateParts.length > 0) {
      addLog("Workflow simulator initialized. Nesting datasets loaded into PLC memory.", "info");
      addLog(`Detached ${thicknesses.length} raw plate profiles grouped by metal gauges.`, "info");
    } else {
      addLog("No plate parts (prefixed with 'PL-') available. Please import standard CSV or click 'Restore Seeds'.", "warning");
    }
  }, []);

  // Sync active part index if selection changes
  useEffect(() => {
    setActivePartIndex(0);
    setSimStage("idle");
    setLaserProgress(0);
  }, [selectedThickness]);

  // Simulation timer loop
  useEffect(() => {
    let intervalId: any = null;
    let animFrame: any = null;

    if (isPlaying && activePart) {
      intervalId = setInterval(() => {
        // Core state machine transitions
        setSimStage(prev => {
          if (prev === "idle") {
            // Start cutting
            addLog(`CNC Laser Head starting profile scan on ${activePart.Part_ID} (${selectedThickness}mm)...`, "info");
            
            // Fast laser tracking progress animation
            let progress = 0;
            const animateLaser = () => {
              progress += 5;
              setLaserProgress(progress);
              if (progress < 100) {
                animFrame = requestAnimationFrame(animateLaser);
              }
            };
            animateLaser();

            return "cutting";
          } 
          
          if (prev === "cutting") {
            // Cut complete
            addLog(`Thermal cut complete for member plate ${activePart.Part_ID}. Spark output extinguished.`, "success");
            // Set part status temporarily to indicate Cut on the bed ready for routing
            return "cut-complete";
          } 
          
          if (prev === "cut-complete") {
            // Direct/Route to Box automatically in auto-mode
            addLog(`Routing ${activePart.Part_ID} dynamically to dispatch bin ${activePart.RF_BIN} (Mark: ${activePart.Assembly_Mark}).`, "info");
            
            // Visual float flight translation animation trigger
            setMovementOffset({ x: 150, y: 150 });
            setTimeout(() => setMovementOffset({ x: 0, y: 0 }), 600);

            // Write status change to global state
            onChangeStatus(activePart.Part_ID, "Placed");
            addLog(`Operator verified: ${activePart.Part_ID} loaded into Member Kit Box [${activePart.Assembly_Mark}].`, "success");

            return "placed";
          } 
          
          if (prev === "placed") {
            // Prepare next part on the bed sheet
            const nextIdx = activePartIndex + 1;
            if (nextIdx < activeThicknessParts.length) {
              setActivePartIndex(nextIdx);
              setLaserProgress(0);
              return "idle";
            } else {
              // End of nested sheet
              setIsPlaying(false);
              addLog(`CNC Nest Sheet of ${selectedThickness}mm finished. Operator, please load another gauge!`, "success");
              setErrorNotice({
                title: "Gauge Nest Finished",
                desc: `All ${activeThicknessParts.length} parts of ${selectedThickness}mm have been cut & placed. Switch thickness to continue!`,
                type: "info"
              });
              return "idle";
            }
          }

          return "idle";
        });
      }, simSpeed);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [isPlaying, activePartIndex, activeThicknessParts, simSpeed, selectedThickness, activePart]);

  // Handle Manual Actions
  const handleManualCut = () => {
    if (!activePart) return;
    setIsPlaying(false);
    setSimStage("cutting");
    addLog(`Manual Overide: Activating laser torch for part ${activePart.Part_ID}.`, "info");
    
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 10;
      setLaserProgress(progress);
      if (progress >= 100) {
        clearInterval(progressInterval);
        setSimStage("cut-complete");
        addLog(`Torch offline. ${activePart.Part_ID} ready for collection.`, "success");
      }
    }, 150);
  };

  const handleManualSort = (targetBoxMark: string) => {
    if (!activePart) return;
    setIsPlaying(false);

    // Human confirmation validation checks
    if (targetBoxMark !== activePart.Assembly_Mark) {
      // WRONG BOX ATTEMPTED! Visual warning and log
      addLog(`CRITICAL OPERATOR DISCREPANCY: Tried to place ${activePart.Part_ID} into incorrect container [${targetBoxMark}]! Target is [${activePart.Assembly_Mark}].`, "error");
      setErrorNotice({
        title: "Discrepancy: Wrong Box Placement!",
        desc: `You tried to drop plate ${activePart.Part_ID} into Box ${targetBoxMark}. However, structural design guides place this plate inside Column/Rafter box ${activePart.Assembly_Mark}.`,
        type: "error"
      });
      return;
    }

    setSimStage("sorting");
    // Trigger motion flight coordinate toward targeted box
    setMovementOffset({ x: 200, y: 120 });
    
    setTimeout(() => {
      onChangeStatus(activePart.Part_ID, "Placed");
      setSimStage("placed");
      setMovementOffset({ x: 0, y: 0 });
      addLog(`Operator manually confirmed & packed ${activePart.Part_ID} into designated container [${targetBoxMark}].`, "success");
      
      // Advance to next part automatically
      const nextIdx = activePartIndex + 1;
      if (nextIdx < activeThicknessParts.length) {
        setActivePartIndex(nextIdx);
        setLaserProgress(0);
        setSimStage("idle");
      }
    }, 450);
  };

  // Flag manual exceptions
  const handleSimulateException = (type: "Missing" | "Exception" | "Duplicate" | "Skip") => {
    if (!activePart) return;
    setIsPlaying(false);

    if (type === "Missing") {
      onChangeStatus(activePart.Part_ID, "Missing");
      addLog(`Exception Registered: Plate ${activePart.Part_ID} declared MISSING at station. RF tag unresolved.`, "warning");
      setErrorNotice({
        title: "Missing Tag Exception",
        desc: `Plate ${activePart.Part_ID} was flagged on the floor. It is excluded from current dispatch weight reports and listed as missing.`,
        type: "warning"
      });
    } else if (type === "Exception") {
      onChangeStatus(activePart.Part_ID, "Exception");
      addLog(`Nest Exception: Plate ${activePart.Part_ID} suffered high scale deformation. Marked defective.`, "error");
      setErrorNotice({
        title: "Nest / Bevel Defect",
        desc: `Structural bevel bounds are out of CNC limits for ${activePart.Part_ID}. Re-nest job queued in Tekla.`,
        type: "error"
      });
    } else if (type === "Duplicate") {
      addLog(`Security Alert: Duplicate copy of ${activePart.Part_ID} scanner match requested! Blocked by database lock.`, "warning");
      setErrorNotice({
        title: "Duplicate Barcode Scan Deflected",
        desc: `A plate with Part ID ${activePart.Part_ID} has already been registered in this production run. Prevented duplicate placement in Box ${activePart.Assembly_Mark}.`,
        type: "warning"
      });
    } else if (type === "Skip") {
      addLog(`Sequence Skipped: Operator bypassed plate ${activePart.Part_ID} sequencing.`, "info");
      const nextIdx = activePartIndex + 1;
      if (nextIdx < activeThicknessParts.length) {
        setActivePartIndex(nextIdx);
        setLaserProgress(0);
        setSimStage("idle");
      }
    }
  };

  const handleResetSimulation = () => {
    setIsPlaying(false);
    setActivePartIndex(0);
    setLaserProgress(0);
    setSimStage("idle");
    setErrorNotice(null);
    addLog("Operator reset the CNC sequencing cycle and emptied the buffer.", "info");
  };

  // Calculate box details for report summary
  const getBoxPartsSummary = (boxMark: string) => {
    const boxParts = parts.filter(p => p.Assembly_Mark === boxMark);
    const placed = boxParts.filter(p => p.Status === "Placed");
    const pending = boxParts.filter(p => p.Status === "Pending");
    const missing = boxParts.filter(p => p.Status === "Missing");
    const exceptions = boxParts.filter(p => p.Status === "Exception");

    // Calculate simulated total weight (approximate: count of parts * thickness * 2.8 kg scale factor)
    const estWeight = boxParts.reduce((acc, p) => acc + (p.Thickness * 2.85), 0).toFixed(1);
    const completedWeight = placed.reduce((acc, p) => acc + (p.Thickness * 2.85), 0).toFixed(1);

    return {
      total: boxParts.length,
      placed: placed.length,
      pending: pending.length,
      missing: missing.length,
      exceptions: exceptions.length,
      parts: boxParts,
      isCompleted: placed.length === boxParts.length && boxParts.length > 0,
      hasExceptions: missing.length > 0 || exceptions.length > 0,
      estWeight,
      completedWeight
    };
  };

  const selectedBoxStats = getBoxPartsSummary(selectedBoxMark);

  return (
    <div className="space-y-6">
      {/* Exception Notification Alert Overlay */}
      {errorNotice && (
        <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all animate-in fade-in slide-in-from-top-4 ${
          errorNotice.type === "error" 
            ? "bg-rose-50/90 border-rose-200 text-rose-900" 
            : errorNotice.type === "warning"
            ? "bg-amber-50/90 border-amber-200 text-amber-900"
            : "bg-blue-50/90 border-blue-200 text-blue-900"
        }`}>
          <div className="mt-0.5 shrink-0">
            {errorNotice.type === "error" ? (
              <ShieldAlert className="w-5 h-5 text-rose-550 animate-bounce" />
            ) : errorNotice.type === "warning" ? (
              <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm tracking-tight">{errorNotice.title}</h4>
            <p className="text-xs mt-1 leading-relaxed opacity-90">{errorNotice.desc}</p>
          </div>
          <button 
            type="button" 
            onClick={() => setErrorNotice(null)}
            className="text-xs font-extrabold hover:underline select-none cursor-pointer self-start opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Thickness gauge & Controller Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 p-4.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mr-1">Load Steel Gauge:</span>
            {thicknesses.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedThickness(t)}
                className={`px-3 py-1.5 rounded-lg text-xs leading-none font-bold font-mono transition cursor-pointer ${
                  selectedThickness === t
                    ? "bg-slate-900 text-white shadow"
                    : "bg-white hover:bg-slate-100 border border-slate-200 text-slate-600"
                }`}
              >
                {t}mm Sheet ({plateParts.filter(p => p.Thickness === t).length} pcs)
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSummaryReport(!showSummaryReport)}
              className={`px-3.5 py-2 border font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                showSummaryReport
                  ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                  : "bg-white hover:bg-slate-55 border-slate-200 text-slate-750"
              }`}
              title="Toggle Box Assembly Reports"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              {showSummaryReport ? "Hide Kit Reports" : "View Kit Summaries"}
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={activeThicknessParts.length === 0}
              className={`px-4 py-2 border font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isPlaying 
                  ? "bg-rose-50 text-rose-700 border-rose-220 hover:bg-rose-100" 
                  : "bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-750 disabled:opacity-50"
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? "Pause PLC Simulation" : "Run Auto CNC Simulator"}
            </button>

            <button
              onClick={handleResetSimulation}
              className="p-2 bg-white hover:bg-slate-55 border border-slate-200 rounded-xl text-slate-500 transition cursor-pointer"
              title="Reset Run"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT: Cutting bed layout workspace */}
          <div className="lg:col-span-7 p-6 border-r border-slate-100 flex flex-col justify-between">
            <div>
              {/* Active Part Sorting Workflow Track */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 select-none animate-in fade-in duration-300">
                <div className="flex justify-between items-center mb-2.5">
                  <h4 className="text-xs font-bold text-slate-700 tracking-tight uppercase font-mono">
                    Active Part Sorting Workflow Track
                  </h4>
                  {activePart ? (
                    <span className="font-mono text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">
                      {activePart.Part_ID} ({activePart.Thickness}mm)
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded">
                      No part loaded
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono select-none">
                  <div className={`p-2 rounded-lg border transition-all ${
                    activePart && activePart.Status === "Pending" && simStage === "idle"
                      ? "bg-slate-900 text-white border-slate-950 font-bold shadow-xs"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}>
                    <div className="font-black text-xs">1</div>
                    <span className="block truncate">Pending</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${
                    activePart && (simStage === "cutting")
                      ? "bg-amber-500 text-white border-amber-600 font-bold shadow-xs animate-pulse"
                      : activePart && (simStage === "cut-complete" || simStage === "sorting" || simStage === "placed" || activePart.Status === "Placed")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}>
                    <div className="font-black text-xs">2</div>
                    <span className="block truncate">Cut</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${
                    activePart && (simStage === "cut-complete")
                      ? "bg-indigo-600 text-white border-indigo-700 font-semibold shadow-xs"
                      : activePart && (simStage === "sorting" || simStage === "placed" || activePart.Status === "Placed")
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}>
                    <div className="font-black text-xs">3</div>
                    <span className="block truncate">Ready Sort</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${
                    activePart && (activePart.Status === "Placed" || simStage === "placed")
                      ? "bg-emerald-600 text-white border-emerald-700 font-bold shadow-xs"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}>
                    <div className="font-black text-xs">4</div>
                    <span className="block truncate">Placed</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${
                    activePart && (activePart.Status === "Missing" || activePart.Status === "Exception")
                      ? "bg-rose-600 text-white border-rose-700 font-bold shadow-xs"
                      : "bg-white text-slate-400 border-slate-200"
                  }`}>
                    <div className="font-black text-xs">⚠️</div>
                    <span className="block truncate">Exception</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">1. Virtual Steel Nest Sheet Workspace</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Displays how plates are organized for optimized cuts. Active sequence targets the yellow-framed item.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">LASER STATUS</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isPlaying ? "bg-amber-500 animate-ping" : simStage === "cutting" ? "bg-amber-500 animate-pulse" : "bg-slate-350"}`} />
                    <span className="font-mono text-[10px] font-bold text-slate-710">
                      {isPlaying ? `AUTOMATIC @ ${(1000/simSpeed).toFixed(1)}Hz` : simStage === "cutting" ? "CNC ACTIVE" : "CNC READY"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical cutting bed visual canvas display */}
              <div className="relative w-full min-h-[220px] bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden flex flex-wrap gap-4 items-center justify-center shadow-inner">
                {/* Visual heat sparks grid animation background */}
                <div className="absolute inset-0 grid grid-cols-12 divide-x divide-slate-900/40 divide-y divide-slate-900/40 pointer-events-none opacity-20">
                  {Array.from({ length: 144 }).map((_, i) => (
                    <div key={i} className="h-6" />
                  ))}
                </div>

                {activeThicknessParts.length === 0 ? (
                  <div className="text-slate-505 text-center text-xs relative z-10 font-mono py-12">
                    <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    PLC Buffer Empty! No plates matching gauge {selectedThickness}mm.
                  </div>
                ) : (
                  activeThicknessParts.map((part, index) => {
                    const isSequenceTarget = activePartIndex === index;
                    const isPartPlaced = part.Status === "Placed";
                    const isPartMissing = part.Status === "Missing";
                    const isPartException = part.Status === "Exception";
                    
                    // Assign semi-realistic dimensions for plates based on its ID numbers
                    const widthScale = 100 + (parseInt(part.Part_ID.match(/\d+/)?.[0] || "50") % 40);
                    const heightScale = 50 + (parseInt(part.Part_ID.match(/\d+/)?.[0] || "50") % 25);

                    return (
                      <div
                        key={part.Part_ID}
                        onClick={() => {
                          setActivePartIndex(index);
                          setSimStage("idle");
                          setLaserProgress(0);
                        }}
                        style={{
                          width: `${widthScale}px`,
                          height: `${heightScale}px`,
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          transform: isSequenceTarget && simStage === "sorting" 
                            ? `translate(${movementOffset.x}px, ${movementOffset.y}px) scale(0.85)` 
                            : "none"
                        }}
                        className={`relative rounded-lg p-2 flex flex-col justify-between border select-none cursor-pointer text-left group overflow-hidden ${
                          isSequenceTarget
                            ? simStage === "cutting"
                              ? "bg-amber-950/80 border-2 border-amber-400 text-amber-300 ring-4 ring-amber-500/10"
                              : simStage === "cut-complete"
                              ? "bg-indigo-950 border-2 border-indigo-400 text-indigo-300 ring-4 ring-indigo-505/10"
                              : "bg-slate-900 border-2 border-yellow-500 text-white"
                            : isPartPlaced
                            ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-500/80 opacity-60 hover:opacity-100"
                            : isPartMissing
                            ? "bg-rose-950/40 border-rose-900 text-rose-400"
                            : isPartException
                            ? "bg-amber-950/40 border-amber-900 text-amber-400"
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        {/* Laser focus indicator cursor overlay */}
                        {isSequenceTarget && simStage === "cutting" && (
                          <div 
                            className="absolute bg-amber-400 rounded-full w-2.5 h-2.5 shadow-lg shadow-amber-500 animate-ping pointer-events-none"
                            style={{ 
                              top: `${40 + Math.sin(laserProgress / 10) * 15}%`, 
                              left: `${laserProgress}%` 
                            }} 
                          />
                        )}

                        <div className="flex justify-between items-start leading-none gap-1">
                          <span className="font-mono text-xs font-black tracking-tight">{part.Part_ID}</span>
                          <span className="font-mono text-[9px] opacity-70 font-semibold">{part.Thickness}mm</span>
                        </div>

                        {/* Real-time laser cut completion percentage or target box preview */}
                        <div className="mt-1 pb-1">
                          {isSequenceTarget && simStage === "cutting" ? (
                            <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                              <div className="bg-amber-400 h-1 transition-all" style={{ width: `${laserProgress}%` }} />
                            </div>
                          ) : (
                            <span className="font-mono text-[9px] block bg-black/30 px-1 py-0.5 rounded leading-none text-slate-300 text-center uppercase font-black truncate">
                              👉 {part.RF_BIN || "-"} / {part.Assembly_Mark}
                            </span>
                          )}
                        </div>

                        {/* Dynamic status sticker absolute label bottom-right */}
                        <div className="flex justify-between items-center text-[8px] tracking-widest font-bold uppercase select-none leading-none">
                          <span className="opacity-60">{part.RF_STAGE || "A"}</span>
                          <span>
                            {isPartPlaced ? "✔ PACKED" : isPartMissing ? "✘ MISSING" : isPartException ? "⚠️ DEFECT" : isSequenceTarget ? (simStage === "cutting" ? "⚙ CUTTING" : simStage === "cut-complete" ? "📦 STAGED" : "🕒 ACTIVE") : "🕒 IDLE"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sequence steps & Manual overrides */}
            <div className="mt-6 bg-slate-50 border border-slate-205 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-700">Sequence Action Controller</h4>
                  {activePart ? (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Selected: <span className="font-mono font-bold text-slate-700">{activePart.Part_ID}</span> target <span className="font-mono font-bold text-slate-700">{activePart.Assembly_Mark}</span>. Status is <span className="font-bold">{activePart.Status}</span>.
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-0.5">Please select or load steel sheets.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5 justify-end">
                  <button
                    disabled={!activePart || isPlaying || simStage === "cutting"}
                    onClick={handleManualCut}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 text-xs font-semibold rounded-lg transition"
                  >
                    1. Simulate Laser Cut
                  </button>

                  <div className="relative group">
                    <button
                      disabled={!activePart || isPlaying || (simStage !== "cut-complete" && activePart.Status !== "Pending")}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-55 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      2. Confirm Sort Box <ArrowRight className="w-3 h-3" />
                    </button>
                    {/* Hover dropdown list of available boxes for routing */}
                    {activePart && !isPlaying && (
                      <div className="absolute right-0 bottom-full mb-1 z-30 bg-white border border-slate-200 rounded-lg shadow-xl p-1.5 hidden group-hover:block w-48">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest p-1 border-b border-slate-100 mb-1">
                          SELECT TARGET BOX:
                        </p>
                        {kitBoxes.map(mark => (
                          <button
                            key={mark}
                            onClick={() => handleManualSort(mark)}
                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-50 hover:text-indigo-650 transition flex justify-between items-center font-semibold text-slate-700"
                          >
                            <span>{mark}</span>
                            {mark === activePart.Assembly_Mark && (
                              <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded uppercase font-black">Design Match</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Floor Exception Testing Panel */}
              <div className="mt-3.5 pt-3 border-t border-slate-200">
                <p className="text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-2">Simulate Assembly Floor Exceptions</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    disabled={!activePart || isPlaying}
                    onClick={() => handleSimulateException("Missing")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white text-rose-650 border border-slate-200 hover:border-rose-200 rounded-md transition"
                    title="Simulate damaged or missing barcode tag"
                  >
                    ❌ Missing Tag Exception
                  </button>
                  <button
                    disabled={!activePart || isPlaying}
                    onClick={() => handleSimulateException("Exception")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white text-amber-650 border border-slate-200 hover:border-amber-200 rounded-md transition"
                    title="CNC Nest defect or high scale deform raw sheet"
                  >
                    ⚠️ Nest / Scale Exception
                  </button>
                  <button
                    disabled={!activePart || isPlaying}
                    onClick={() => handleSimulateException("Duplicate")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white text-slate-600 border border-slate-200 hover:border-indigo-200 rounded-md transition"
                    title="Operator double-scanning already loaded items"
                  >
                    🔄 Barcode Duplication
                  </button>
                  <button
                    disabled={!activePart || isPlaying}
                    onClick={() => handleSimulateException("Skip")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-slate-500 border border-slate-200 rounded-md transition"
                    title="Skip current part index tracking"
                  >
                    ⏭ Skip Sequential Frame
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Real-time visual activity log */}
          <div className="lg:col-span-5 p-6 flex flex-col justify-between self-stretch">
            {/* Live Floor Gantry Conveyor */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5 shadow-xs animate-in fade-in duration-300">
              <div className="flex justify-between items-center mb-2.5">
                <h4 className="text-xs font-bold text-slate-700 tracking-tight font-mono uppercase">Live Floor Gantry Conveyor</h4>
                <span className="font-mono text-[9px] bg-indigo-50 text-indigo-750 px-1.5 rounded uppercase font-black font-sans">STAGING LINE</span>
              </div>
              
              {activePart ? (
                <div className="relative bg-white border border-slate-205 rounded-lg p-3.5 h-20 flex items-center justify-between overflow-hidden shadow-inner">
                  {/* Laser Bed Source Icon */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono mt-1 uppercase">NEST BED</span>
                  </div>

                  {/* Animated Conveyor Belt Path */}
                  <div className="flex-1 mx-3 relative flex items-center">
                    <div className="w-full bg-slate-100 h-2 rounded-full border border-slate-200 overflow-hidden relative">
                      {/* Roller conveyor bars representation */}
                      <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-40">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div key={i} className="w-0.5 bg-slate-400 h-full" />
                        ))}
                      </div>
                      {/* Shimmer/moving animation bar when state indicates active sort */}
                      {(simStage === "cutting" || simStage === "sorting") && (
                        <div className="bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-full w-20 animate-infinite-slide absolute" />
                      )}
                    </div>

                    {/* Traveling Part Avatar */}
                    <div 
                      className={`absolute w-14 p-1 rounded border text-slate-100 font-mono text-[8px] font-black text-center shadow-md transition-all duration-500 ${
                        simStage === "idle" || simStage === "cutting"
                          ? "bg-slate-900 border-slate-950 left-0"
                          : simStage === "cut-complete"
                          ? "bg-indigo-905 border-indigo-700 left-1/3"
                          : simStage === "sorting"
                          ? "bg-yellow-500 border-yellow-600 text-slate-950 left-2/3"
                          : "bg-emerald-600 border-emerald-700 left-full -translate-x-full"
                      }`}
                      style={{
                        transition: "all 0.6s cubic-bezier(0.25, 1, 0.5, 1)"
                      }}
                    >
                      {activePart.Part_ID}
                    </div>
                  </div>

                  {/* Target Box Destination Icon */}
                  <div className="flex flex-col items-center z-10">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-150 flex items-center justify-center text-emerald-600">
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono mt-1 uppercase">Box {activePart.Assembly_Mark}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-5 text-center text-xs text-slate-400 font-mono italic">
                  Load steel thickness gauge to active conveyor loop.
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-800">2. Real-Time Station Activity Log</h3>
                <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500 font-mono select-none">
                  PLC TELEMETRY
                </span>
              </div>

              {/* Logs terminal box */}
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-slate-350 min-h-[200px] max-h-[290px] overflow-y-auto space-y-2 select-text">
                {logs.length === 0 ? (
                  <div className="text-slate-500 text-center py-12 text-[11px]">
                    Telemetry idle. Run simulation to stream sequence feedback.
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="leading-relaxed border-b border-slate-950 pb-1.5 last:border-0 flex items-start gap-1.5">
                      <span className="text-slate-500 shrink-0 text-[10px]">{log.time}</span>
                      <span className={`text-[11px] ${
                        log.type === "success" 
                          ? "text-emerald-400" 
                          : log.type === "warning" 
                          ? "text-amber-400 font-bold" 
                          : log.type === "error" 
                          ? "text-rose-400 font-bold" 
                          : "text-slate-300"
                      }`}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 font-extrabold text-[10px] shrink-0 font-mono">
                P2
              </div>
              <p className="leading-snug">
                <strong>Sim Operator Alert:</strong> Standard workflow routes plates downstream immediately upon clean cuts. Exceptions flag items into temporary hold bays so shipping is never stalled.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Target Dispatch Boxes Panel */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">3. Target Member Dispatch Kit Boxes</h3>
            <p className="text-xs text-slate-500 mt-1">
              Live status gauges for kit boxes receiving plates from the cutting nest. Select any Box to inspect and preview shipping docket summaries.
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Complete
            </span>
            <span className="flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 font-bold px-2 py-0.5 rounded border border-amber-200">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Exceptions
            </span>
          </div>
        </div>

        {/* Live Grid layout container for Kit boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kitBoxes.map(mark => {
            const sumData = getBoxPartsSummary(mark);
            const percentWidth = sumData.total > 0 ? (sumData.placed / sumData.total) * 100 : 0;
            const isSelected = selectedBoxMark === mark;

            // Compute theme styling depending on status
            const cardStyles = isSelected
              ? "ring-2 ring-indigo-500 border-indigo-500 bg-indigo-50/15"
              : sumData.isCompleted
              ? "border-emerald-205 bg-emerald-50/5 hover:bg-emerald-50/10"
              : sumData.hasExceptions
              ? "border-rose-220 bg-rose-50/5 hover:bg-rose-10.5"
              : "border-slate-200 hover:border-slate-310 hover:bg-slate-50";

            return (
              <div
                key={mark}
                onClick={() => setSelectedBoxMark(mark)}
                className={`p-4.5 rounded-xl border-1.5 transition cursor-pointer flex flex-col justify-between h-44 ${cardStyles}`}
              >
                <div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Box className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-600 animate-pulse" : sumData.isCompleted ? "text-emerald-600" : "text-slate-400"}`} />
                      <span className="font-mono text-sm font-black text-slate-900 truncate">{mark}</span>
                      {onOpenQRResolver && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQRResolver("box", mark);
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
                          title="Scan Box Container QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <span className="shrink-0">
                      {sumData.isCompleted ? (
                        <span className="bg-emerald-500 text-white rounded-full p-0.5 inline-block" title="Ready to Ship">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : sumData.hasExceptions ? (
                        <span className="bg-rose-500 text-slate-105 font-bold px-1.5 rounded text-[8px] leading-tight select-none border border-rose-600">
                          ALERT
                        </span>
                      ) : (
                        <span className="bg-blue-500 w-1.5 h-1.5 rounded-full animate-ping inline-block" />
                      )}
                    </span>
                  </div>

                  {/* Weight stats and gauges */}
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between text-[11px] font-medium text-slate-600">
                      <span>Total weight scale</span>
                      <span className="font-mono text-slate-800 font-semibold">{sumData.estWeight} kg</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-slate-500">
                      <span>Kit items placed</span>
                      <span className="font-mono font-bold text-slate-800">{sumData.placed} / {sumData.total} items</span>
                    </div>
                  </div>
                </div>

                <div>
                  {/* Status pills counters */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    <span className="px-1 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] font-bold">
                      {sumData.placed} Placed
                    </span>
                    {sumData.pending > 0 && (
                      <span className="px-1 py-0.5 bg-slate-100 text-slate-600 rounded text-[8px] font-bold">
                        {sumData.pending} Pending
                      </span>
                    )}
                    {sumData.missing > 0 && (
                      <span className="px-1 py-0.5 bg-rose-50 text-rose-700 border border-rose-100 rounded text-[8px] font-bold">
                        {sumData.missing} Lost
                      </span>
                    )}
                    {sumData.exceptions > 0 && (
                      <span className="px-1 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[8px] font-bold">
                        {sumData.exceptions} Defect
                      </span>
                    )}
                  </div>

                  {/* Progress completion bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-300 ${sumData.isCompleted ? "bg-emerald-500" : sumData.hasExceptions ? "bg-rose-500" : "bg-indigo-600"}`}
                      style={{ width: `${percentWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED MEMBER KIT BOX REPORT (CLIENT SPECIAL HIGHLIGHT) */}
      {(showSummaryReport || selectedBoxMark) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden animate-in zoom-in-95 leading-relaxed">
          <div className="flex justify-between items-start border-b border-slate-100 pb-4 mb-4 flex-wrap gap-4">
            <div>
              <span className="text-[10px] font-black font-mono tracking-widest text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase leading-none">
                SIMULATED SHIPMENT SUMMARY
              </span>
              <h3 className="text-base font-black mt-1.5 tracking-tight text-slate-900">
                Structural Delivery Docket Verification: Box {selectedBoxMark}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Printable layout containing the complete list of dispatch dockets, missing tags warnings, and exception holds.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-slate-90 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-slate-705 text-xs font-semibold tracking-tight transition flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print Manifest
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* BOX STATISTICS SUMMARY DOCKET */}
            <div className="md:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4.5 font-mono text-xs">
              <div className="flex justify-between items-center text-slate-900 font-bold border-b border-slate-200 pb-2 mb-2 gap-2">
                <span className="truncate">DOCKET #RF-{selectedBoxMark.toUpperCase()}</span>
                {onOpenQRResolver && (
                  <button
                    onClick={() => onOpenQRResolver("box", selectedBoxMark)}
                    className="p-1 flex items-center hover:bg-slate-200 rounded text-slate-500 hover:text-emerald-600 transition cursor-pointer"
                    title="Scan digital twins of target Kit Box container"
                  >
                    <QrCode className="w-4 h-4 animate-bounce text-indigo-650" />
                  </button>
                )}
                <span className="text-[10px] bg-slate-800 text-slate-100 px-1.5 py-0.5 rounded leading-none shrink-0">DRAFT P2</span>
              </div>
              
              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Assembly Code:</span>
                  <span className="font-bold text-slate-900">{selectedBoxMark}</span>
                </div>
                <div className="flex justify-between">
                  <span>Est Payload Weight:</span>
                  <span className="font-bold text-slate-900">{selectedBoxStats.estWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivered Weight:</span>
                  <span className="font-extrabold text-indigo-600">{selectedBoxStats.completedWeight} kg / {selectedBoxStats.estWeight} kg</span>
                </div>
                <div className="flex justify-between">
                  <span>Manifest Status:</span>
                  <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] uppercase leading-none ${
                    selectedBoxStats.isCompleted 
                      ? "bg-emerald-100 text-emerald-800" 
                      : selectedBoxStats.hasExceptions 
                      ? "bg-rose-100 text-rose-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {selectedBoxStats.isCompleted 
                      ? "RELEASED / SEALED" 
                      : selectedBoxStats.hasExceptions 
                      ? "HOLD FOR DISCREPANCIES" 
                      : "STAGE ONE LOAD"}
                  </span>
                </div>
              </div>

              {/* Status checklist metrics */}
              <div className="mt-4 pt-3.5 border-t border-slate-200 grid grid-cols-4 gap-1 text-center font-bold text-[10px]">
                <div className="bg-emerald-100 text-emerald-800 p-1.5 rounded-md leading-tight">
                  <div className="text-sm font-black leading-none mb-1">{selectedBoxStats.placed}</div>
                  Placed
                </div>
                <div className="bg-slate-200 text-slate-700 p-1.5 rounded-md leading-tight">
                  <div className="text-sm font-black leading-none mb-1">{selectedBoxStats.pending}</div>
                  Pending
                </div>
                <div className="bg-rose-100 text-rose-800 p-1.5 rounded-md leading-tight">
                  <div className="text-sm font-black leading-none mb-1">{selectedBoxStats.missing}</div>
                  Missing
                </div>
                <div className="bg-amber-100 text-amber-900 p-1.5 rounded-md leading-tight">
                  <div className="text-sm font-black leading-none mb-1">{selectedBoxStats.exceptions}</div>
                  Alert
                </div>
              </div>
            </div>

            {/* BOX COMPONENT CHECKLIST TABLE */}
            <div className="md:col-span-8 bg-white border border-slate-20 w-full overflow-hidden text-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-500 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-800">
                      <th className="px-4 py-2">Part ID</th>
                      <th className="px-4 py-2 text-right">Thickness</th>
                      <th className="px-4 py-2 text-right">Est Weight</th>
                      <th className="px-4 py-2">Install Position</th>
                      <th className="px-4 py-2">QR Reference</th>
                      <th className="px-4 py-2">Live Status State</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 font-mono">
                    {selectedBoxStats.parts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          Empty dispatch list for assembly {selectedBoxMark}. Load seeds or upload CSV parts database.
                        </td>
                      </tr>
                    ) : (
                      selectedBoxStats.parts.map(part => (
                        <tr 
                          key={part.Part_ID} 
                          className={
                            part.Status === "Placed"
                              ? "bg-emerald-50/10"
                              : part.Status === "Missing"
                              ? "bg-rose-50/10 hover:bg-rose-50/20"
                              : part.Status === "Exception"
                              ? "bg-amber-50/10 hover:bg-amber-50/20"
                              : ""
                          }
                        >
                          <td className="px-4 py-2.5 font-bold text-slate-900 text-[11px]">
                            <div className="flex items-center justify-between gap-1.5">
                              <span>{part.Part_ID}</span>
                              {onOpenQRResolver && (
                                <button
                                  type="button"
                                  onClick={() => onOpenQRResolver("part", part.Part_ID)}
                                  className="p-1 hover:bg-slate-150 rounded text-slate-400 hover:text-indigo-650 transition cursor-pointer select-none"
                                  title="Scan Part QR Code"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{part.Thickness} mm</td>
                          <td className="px-4 py-2.5 text-right text-slate-600">{part.Weight_Kg || "8.5"} kg</td>
                          <td className="px-4 py-2.5 font-sans text-[11.5px] font-semibold text-slate-700">{part.Grid || "Grid D-2"}</td>
                          <td className="px-4 py-2.5 text-slate-400 text-[10px]">
                            <div className="flex items-center justify-between gap-1">
                              <span className="truncate max-w-24 select-all">{part.QR_Code || "N/A"}</span>
                              {onOpenQRResolver && (
                                <button
                                  type="button"
                                  onClick={() => onOpenQRResolver("part", part.Part_ID)}
                                  className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-650 transition cursor-pointer shrink-0"
                                  title="Resolve QR Reference Code"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-black ${
                              part.Status === "Placed"
                                ? "bg-emerald-100 text-emerald-800"
                                : part.Status === "Missing"
                                ? "bg-rose-100/90 text-rose-800 font-extrabold"
                                : part.Status === "Exception"
                                ? "bg-amber-100 text-amber-850"
                                : "bg-slate-105 text-slate-500"
                            }`}>
                              {part.Status === "Placed"
                                ? "✔ LOADED IN BOX"
                                : part.Status === "Missing"
                                ? "✘ MISSING DISCREPANCY"
                                : part.Status === "Exception"
                                ? "⚠ CNC NEST DEFECT"
                                : "🕒 PENDING CUT RUN"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
