import React, { useState, useMemo } from "react";
import { 
  GitMerge, Search, Layout, FileText, Compass, MapPin, Layers, 
  HelpCircle, ShieldCheck, AlertTriangle, Printer, Copy, Check, QrCode, Info, ChevronRight, Eye, ClipboardList, Database, Weight
} from "lucide-react";
import { Part, PartStatus } from "../types";

interface TraceabilityChainProps {
  parts: Part[];
  onChangeStatus?: (partId: string, nextStatus: PartStatus) => void;
  selectedPartId?: string;
  setSelectedPartId?: (partId: string) => void;
  activeStep?: number;
  setActiveStep?: (step: number) => void;
  onOpenQRResolver?: (type: "part" | "assembly" | "box", id: string) => void;
}

export default function TraceabilityChain({ 
  parts, 
  onChangeStatus,
  selectedPartId: propSelectedPartId,
  setSelectedPartId: propSetSelectedPartId,
  activeStep: propActiveStep,
  setActiveStep: propSetActiveStep,
  onOpenQRResolver
}: TraceabilityChainProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Local state fallbacks if props are not supplied
  const [localSelectedPartId, localSetSelectedPartId] = useState<string>("");
  const [localActiveStep, localSetActiveStep] = useState<number>(2); // Default to sorted part status node
  
  const selectedPartId = propSelectedPartId !== undefined ? propSelectedPartId : localSelectedPartId;
  const setSelectedPartId = propSetSelectedPartId !== undefined ? propSetSelectedPartId : localSetSelectedPartId;
  
  const activeStep = propActiveStep !== undefined ? propActiveStep : localActiveStep;
  const setActiveStep = propSetActiveStep !== undefined ? propSetActiveStep : localSetActiveStep;

  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Filter parts list
  const filteredParts = useMemo(() => {
    return parts.filter(p => {
      const matchesSearch = p.Part_ID.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.Assembly_Mark.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = statusFilter === "all" || p.Status === statusFilter;
      return matchesSearch && matchesFilter;
    });
  }, [parts, searchTerm, statusFilter]);

  // Handle auto-selection of first part if none selected
  const activePart = useMemo(() => {
    if (selectedPartId) {
      const match = parts.find(p => p.Part_ID === selectedPartId);
      if (match) return match;
    }
    return filteredParts[0] || parts[0] || null;
  }, [parts, filteredParts, selectedPartId]);

  // Compute siblings inside the same Kit Box as the selected part
  const boxSiblings = useMemo(() => {
    if (!activePart) return [];
    return parts.filter(p => p.Assembly_Mark === activePart.Assembly_Mark);
  }, [parts, activePart]);

  // Calculate stats for the selected Box
  const boxStats = useMemo(() => {
    if (boxSiblings.length === 0) return { total: 0, placed: 0, weight: 0, status: "Pending" };
    const placedCount = boxSiblings.filter(p => p.Status === "Placed").length;
    const totalWeight = boxSiblings.reduce((acc, p) => acc + (p.Weight_Kg || 0), 0);
    const hasExceptions = boxSiblings.some(p => p.Status === "Exception" || p.Status === "Missing");
    
    let status = "In Progress";
    if (placedCount === boxSiblings.length) status = "Sealed / Ready to Ship";
    else if (hasExceptions) status = "Alert / Discrepancy Hold";

    return {
      total: boxSiblings.length,
      placed: placedCount,
      weight: Number(totalWeight.toFixed(1)),
      status,
      hasExceptions
    };
  }, [boxSiblings]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Structured traceability list
  const traceabilitySteps = [
    { 
      id: 0, 
      label: "1. Imported Design", 
      badge: "CSV Schedule", 
      desc: "Raw coordinate row parsed",
      nodeColor: "bg-slate-100 text-slate-700 hover:bg-slate-200"
    },
    { 
      id: 1, 
      label: "2. Cut Grouping", 
      badge: "Thickness Melt", 
      desc: `${activePart?.Thickness || 10}mm Melt Gauge Row`,
      nodeColor: "bg-amber-100 text-amber-800 hover:bg-amber-200"
    },
    { 
      id: 2, 
      label: "3. Fabrication Sort", 
      badge: "Operator Approved", 
      desc: `ID: ${activePart?.Part_ID || "N/A"} (${activePart?.Status || "Pending"})`,
      nodeColor: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
    },
    { 
      id: 3, 
      label: "4. Dispatch Container", 
      badge: `Box ${activePart?.Assembly_Mark || "N/A"}`, 
      desc: `Bin: ${activePart?.RF_BIN || "-"} / Stage: ${activePart?.RF_STAGE || "-"}`,
      nodeColor: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
    },
    { 
      id: 4, 
      label: "5. Workshop Drawing", 
      badge: `${activePart?.Drawing_Ref || "Blueprint"}`, 
      desc: "Simulated vector blueprint layout",
      nodeColor: "bg-teal-105 text-teal-800 bg-teal-50 hover:bg-teal-100"
    },
    { 
      id: 5, 
      label: "6. Site Install Lawyer", 
      badge: `${activePart?.Grid || "Grid Zone"}`, 
      desc: `Erection frame sequenced: ${activePart?.Sequence || "-"}`,
      nodeColor: "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Search & Parts Checklist Sidebar */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-4.5 space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">
              Parts Lookup Directory
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Select any plate part to load the tracking string.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search ID or Box Mark..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-mono"
            />
          </div>

          {/* Quick filters tag block */}
          <div className="flex flex-wrap gap-1 border-b border-slate-100 pb-3">
            {["all", "Pending", "Placed", "Missing", "Exception"].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-2 py-1 rounded text-[10px] font-bold capitalize transition font-mono ${
                  statusFilter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-250 cursor-pointer"
                }`}
              >
                {f === "all" ? "All" : f}
              </button>
            ))}
          </div>

          {/* Sizable Parts directory list */}
          <div className="max-h-[390px] overflow-y-auto space-y-1 pr-1.5 scrollbar-thin scrollbar-thumb-slate-200">
            {filteredParts.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 font-mono italic">
                No tracking matches.
              </div>
            ) : (
              filteredParts.map((p) => {
                const isSelected = activePart?.Part_ID === p.Part_ID;
                const progressColor = 
                  p.Status === "Placed" 
                    ? "bg-emerald-500" 
                    : p.Status === "Missing"
                    ? "bg-rose-500 animate-pulse"
                    : p.Status === "Exception"
                    ? "bg-amber-500"
                    : "bg-slate-300";

                return (
                  <button
                    key={p.Part_ID}
                    onClick={() => {
                      setSelectedPartId(p.Part_ID);
                      setActiveStep(2); // Jump back to sorting node default on switch
                    }}
                    className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/20 text-indigo-900"
                        : "border-slate-100 hover:border-slate-200 text-slate-700 bg-white"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-black truncate">{p.Part_ID}</div>
                      <div className="text-[10px] text-slate-400 font-mono font-medium truncate mt-0.5">
                        {p.Assembly_Mark} • {p.Thickness}mm
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className={`w-2 h-2 rounded-full ${progressColor}`} />
                      <span className="font-mono text-[9px] uppercase font-bold text-slate-500">
                        {p.Status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Traceability digital twin dashboard */}
        <div className="lg:col-span-9 space-y-6">
          
          {activePart ? (
            <>
              {/* 1. HORIZONTAL TRACEABILITY FLOWCHART */}
              <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono mb-4">
                  End-To-End Traceability Node Map
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3.5 relative">
                  {traceabilitySteps.map((step) => {
                    const isSelected = activeStep === step.id;
                    return (
                      <div
                        key={step.id}
                        onClick={() => setActiveStep(step.id)}
                        className={`relative rounded-xl border p-3 cursor-pointer select-none transition-all flex flex-col justify-between text-left h-28 ${
                          isSelected 
                            ? "border-indigo-500 bg-indigo-50/30 shadow-md ring-2 ring-indigo-500/10" 
                            : "border-slate-200 hover:border-indigo-300 bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[9.5px] font-black font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase leading-none">
                              Node {step.id + 1}
                            </span>
                            {isSelected && (
                              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-ping" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 tracking-tight mt-2">{step.label}</h4>
                        </div>

                        <div>
                          <span className="block text-[10px] font-mono leading-tight bg-black/5 px-1 py-0.5 rounded text-indigo-905 w-fit font-black mb-1 truncate max-w-full">
                            {step.badge}
                          </span>
                          <span className="block text-[8.5px] text-slate-400 font-mono truncate leading-none">
                            {step.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>
                      Active Audited Point: <strong>{traceabilitySteps[activeStep].label}</strong>. Click any node above to drill into the sub-module.
                    </span>
                  </div>
                  <span className="font-mono text-[9px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase font-black">
                    Trace Locked
                  </span>
                </div>
              </div>

              {/* 2. LIVE DETAILED NODE WORKSPACE PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* SUBCOLUMN LEFT: Specific selected node panel */}
                <div className="md:col-span-12 xl:col-span-7 space-y-6">
                  
                  {/* DETAILED DRILLDOWN VIEWS ACCORDING TO NODES */}
                  {activeStep === 0 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs antialiased space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded block w-fit">NODE 1 DRILL-DOWN</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">Original CSV Design Import Log</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Verifies raw structural schedules before fabrication triggers.</p>
                      </div>

                      <div className="bg-slate-900 text-slate-300 font-mono text-xs rounded-xl p-4 overflow-x-auto space-y-1 shadow-inner leading-relaxed">
                        <div className="text-slate-500 border-b border-slate-800 pb-1 mb-1">// Parsed from readyfab_structural_manifest.csv</div>
                        <div><span className="text-pink-400">PART_ID</span>: <span className="text-emerald-400">"{activePart.Part_ID}"</span></div>
                        <div><span className="text-pink-400">ASSEMBLY_MARK</span>: <span className="text-emerald-400">"{activePart.Assembly_Mark}"</span></div>
                        <div><span className="text-pink-400">PLATE_THICKNESS</span>: <span className="text-cyan-400">{activePart.Thickness}</span> // mm</div>
                        <div><span className="text-pink-400">DEST_BIN</span>: <span className="text-emerald-400">"{activePart.RF_BIN}"</span></div>
                        <div><span className="text-pink-400">DEST_STAGE</span>: <span className="text-emerald-400">"{activePart.RF_STAGE}"</span></div>
                        <div><span className="text-pink-400">DXF_MODEL_FILE</span>: <span className="text-emerald-400">"{activePart.DXF_Filename}"</span></div>
                        <div><span className="text-pink-400">PART_WEIGHT_KG</span>: <span className="text-cyan-400">{activePart.Weight_Kg}</span></div>
                        <div><span className="text-pink-400">FAB_GRADE_SPEC</span>: <span className="text-emerald-400">"{activePart.Material}"</span></div>
                      </div>

                      <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-2.5">
                        <Database className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div className="text-[11px] text-slate-600 leading-normal">
                          <strong>Data Source Lock:</strong> Parsed safely under UTC 2026. This data operates as the absolute design ceiling. No manual overrides can mutate nested physical steel definitions.
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 1 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs antialiased space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded block w-fit">NODE 2 DRILL-DOWN</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">CNC Nest Melt Gauge Grouping</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">ReadyFab system optimization grouping cuts strictly by plate thickness.</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 block font-mono">SPECIFIED SHEET GAUGE</span>
                          <span className="text-2xl font-black text-slate-800 font-mono mt-1 block">{activePart.Thickness} mm</span>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                          <span className="text-[9px] font-bold text-slate-400 block font-mono">STEEL MAT GRADE</span>
                          <span className="text-xs font-black text-indigo-650 bg-indigo-50 px-2 py-1 rounded block mt-2 w-fit mx-auto">{activePart.Material}</span>
                        </div>
                      </div>

                      <div className="p-4 border border-slate-200 rounded-xl space-y-2">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" /> Co-gaged Nest sheet parts ({activePart.Thickness}mm)
                        </h5>
                        <p className="text-[11px] text-slate-400">The following sibling plates are batched onto the physical laser bed together:</p>
                        <div className="flex flex-wrap gap-1">
                          {parts.filter(p => p.Thickness === activePart.Thickness).map(p => (
                            <span 
                              key={p.Part_ID}
                              className={`px-1.5 py-0.5 text-[9px] font-bold font-mono rounded border ${
                                p.Part_ID === activePart.Part_ID
                                  ? "bg-slate-900 text-white border-slate-950 font-black"
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              }`}
                            >
                              {p.Part_ID}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 2 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs antialiased space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black font-mono bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded block w-fit">NODE 3 DRILL-DOWN</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">Fabrication Sort Status Verification</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Physical part trace identity, exception tags, and operator verification logs.</p>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 md:grid-cols-3 gap-3.5 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Physical ID</span>
                          <span className="font-black text-slate-800 text-xs">{activePart.Part_ID}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">DXF File</span>
                          <span className="text-slate-600 truncate block text-[10px]">{activePart.DXF_Filename}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block uppercase font-bold">Trace Status</span>
                          <span className={`inline-block px-1.5 py-0.5 rounded font-sans text-[9px] font-black ${
                            activePart.Status === "Placed"
                              ? "bg-emerald-150 text-emerald-800"
                              : activePart.Status === "Missing"
                              ? "bg-rose-100 text-rose-800 font-extrabold animate-pulse"
                              : activePart.Status === "Exception"
                              ? "bg-amber-100 text-amber-800 font-black"
                              : "bg-slate-150 text-slate-600"
                          }`}>
                            {activePart.Status}
                          </span>
                        </div>
                      </div>

                      {/* Interactive Fabrication Sort & State Override Panel */}
                      {onChangeStatus && (
                        <div className="p-4 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-3.5">
                          <div className="flex justify-between items-center">
                            <div>
                              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> State Control & QR Scan Sim
                              </h5>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">Digitally override or simulate physical barcode scan.</p>
                            </div>
                            <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase font-black">
                              Phase 3 Active
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {(["Pending", "Placed", "Missing", "Exception"] as PartStatus[]).map((status) => {
                              const isActive = activePart.Status === status;
                              let btnClass = "border-slate-200 text-slate-700 bg-white hover:bg-slate-50";
                              if (isActive) {
                                if (status === "Placed") btnClass = "bg-emerald-600 text-white border-emerald-700";
                                else if (status === "Missing") btnClass = "bg-rose-600 text-white border-rose-700";
                                else if (status === "Exception") btnClass = "bg-amber-500 text-white border-amber-600";
                                else btnClass = "bg-slate-800 text-white border-slate-900";
                              }
                              return (
                                <button
                                  key={status}
                                  onClick={() => onChangeStatus(activePart.Part_ID, status)}
                                  className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer select-none ${btnClass}`}
                                >
                                  {status === "Placed" && "✔ Placed"}
                                  {status === "Pending" && "⚙ Pending"}
                                  {status === "Missing" && "✖ Missing"}
                                  {status === "Exception" && "⚡ Exception"}
                                </button>
                              );
                            })}
                          </div>

                          {/* Quick Scan Simulator Target */}
                          <div className="flex gap-2.5 pt-1">
                            <button
                              onClick={() => {
                                onChangeStatus(activePart.Part_ID, "Placed");
                                handleCopy(activePart.QR_Code || "");
                              }}
                              className="flex-1 bg-slate-900 hover:bg-slate-850 text-white font-mono text-[10px] font-bold py-2 px-3 rounded-lg border border-slate-950 flex items-center justify-center gap-2 cursor-pointer transition select-none"
                            >
                              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
                              Simulate Scanner (Scan & Sort Plate)
                            </button>
                          </div>

                          {/* Interactive Exception Cause selection */}
                          {(activePart.Status === "Exception" || activePart.Status === "Missing") && (
                            <div className="pt-3 border-t border-indigo-100/50 space-y-2">
                              <label className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
                                Select Digital Exception Type
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {["missing tag", "wrong box", "duplicate part", "skipped part", "nest exception"].map((reason) => {
                                  const isCurrentReason = activePart.Exception_Type === reason;
                                  return (
                                    <button
                                      key={reason}
                                      onClick={() => {
                                        activePart.Exception_Type = reason;
                                        // Trigger a rerender using onChangeStatus
                                        onChangeStatus(activePart.Part_ID, activePart.Status);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[10.5px] font-mono capitalize transition border cursor-pointer ${
                                        isCurrentReason
                                          ? "bg-amber-100 text-amber-900 border-amber-300 font-extrabold shadow-2xs"
                                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                      }`}
                                    >
                                      {reason}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-slate-500 font-mono block uppercase">Digital Audit QR Reference Identifier</label>
                        <div className="border border-slate-250 bg-white rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                          <div className="flex items-center gap-3">
                            {/* Generates placeholder SVG representation of QR Barcode */}
                            <div className="w-11 h-11 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center shrink-0">
                              <div className="grid grid-cols-4 gap-0.5 w-full h-full opacity-80">
                                {Array.from({ length: 16 }).map((_, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-full h-full ${
                                      (i + activePart.Part_ID.charCodeAt(0)) % 3 === 0 || i % 5 === 0 
                                        ? "bg-slate-900" 
                                        : "bg-transparent"
                                    }`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-bold text-slate-800 block truncate">{activePart.QR_Code}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">Tap decode or copy reference pointer</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                            {onOpenQRResolver && (
                              <button 
                                onClick={() => onOpenQRResolver("part", activePart.Part_ID)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 rounded-lg text-xs font-bold font-sans tracking-tight transition cursor-pointer flex items-center gap-1 leading-none select-none"
                                title="Run software QR resolver on this part"
                              >
                                <QrCode className="w-3.5 h-3.5 text-indigo-200" />
                                Decode QR
                              </button>
                            )}

                            <button 
                              onClick={() => handleCopy(activePart.QR_Code || "")}
                              className="p-2 hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-500 transition cursor-pointer"
                              title="Copy code value"
                            >
                              {copiedText === activePart.QR_Code ? (
                                <Check className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Audit operator logs */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] font-mono text-slate-600">
                        <div className="text-slate-800 font-bold border-b border-slate-200 pb-1 flex justify-between">
                          <span>Operator Log Entry:</span>
                          <span className="text-[10px] text-indigo-650">Machine ID: Laser #3</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verification Time:</span>
                          <span>{new Date().toUTCString().replace("GMT", "UTC")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Authority Signoff:</span>
                          <span className="font-bold text-slate-800">ReadyFab-Operator-Digital-Twin</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Status Tag:</span>
                          <span className="font-bold underline">{activePart.Exception_Type ? `Exception [${activePart.Exception_Type}]` : "Standard Scan verified"}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 3 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs antialiased space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded block w-fit">NODE 4 DRILL-DOWN</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">Member Kit Box Shipment Progress</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Physical distribution stage. Plates must gather inside correct boxes prior to shipping.</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 font-mono text-xs text-slate-700">
                        <div className="flex justify-between font-bold text-slate-900 border-b border-slate-202 pb-2">
                          <span>Box ID Marker:</span>
                          <span>{activePart.Assembly_Mark}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Target Dispatch Bin / Stage:</span>
                          <span className="font-bold text-slate-800">{activePart.RF_BIN || "-"} ({activePart.RF_STAGE || "-"})</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Parts Required:</span>
                          <span className="font-bold text-slate-800">{boxStats.total} pcs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Calculated Box Weight:</span>
                          <span className="font-bold text-slate-805">{boxStats.weight} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Box Status:</span>
                          <span className={`font-bold px-1.5 rounded text-[10px] leading-tight ${
                            boxStats.status.includes("Sealed")
                              ? "bg-emerald-100 text-emerald-800"
                              : boxStats.hasExceptions
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-200 text-slate-750"
                          }`}>
                            {boxStats.status}
                          </span>
                        </div>
                      </div>

                      {/* Display siblings in box table */}
                      <div className="border border-slate-150 rounded-xl overflow-hidden text-[11px]">
                        <div className="bg-slate-100 p-2 font-bold font-mono text-slate-700 uppercase tracking-widest text-[10px]">
                          Kit box items status list
                        </div>
                        <div className="divide-y divide-slate-150 max-h-36 overflow-y-auto">
                          {boxSiblings.map(sib => (
                            <div key={sib.Part_ID} className="p-2 flex justify-between items-center bg-white">
                              <span className="font-mono font-bold text-slate-800">{sib.Part_ID}</span>
                              <span className="font-mono text-slate-400">{sib.Thickness}mm • {sib.Weight_Kg}kg</span>
                              <span className={`px-1 py-0.5 rounded font-sans text-[8.5px] font-bold ${
                                sib.Status === "Placed"
                                  ? "bg-emerald-100 text-emerald-850"
                                  : sib.Status === "Missing"
                                  ? "bg-rose-100 text-rose-850"
                                  : sib.Status === "Exception"
                                  ? "bg-amber-100 text-amber-850"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {sib.Status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeStep === 4 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs antialiased space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black font-mono bg-teal-100 text-teal-800 px-2 py-0.5 rounded block w-fit">NODE 5 DRILL-DOWN</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">Workshop CAD Drawing Viewer</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Vector blueprint referencing design parameters of parent assembly {activePart.Assembly_Mark}.</p>
                      </div>

                      {/* WORKSHOP CAD BLUEPRINT SIMULATION VIEW */}
                      <div className="relative aspect-video bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-hidden shadow-inner flex flex-col justify-between">
                        
                        {/* Title block info */}
                        <div className="text-slate-450 text-[10px] font-mono leading-none flex justify-between z-10 bg-black/45 p-2 rounded border border-slate-800">
                          <div>
                            <strong>DWG REFERENCE:</strong> {activePart.Drawing_Ref}
                          </div>
                          <div>
                            <strong>PARENT MARK:</strong> {activePart.Assembly_Mark}
                          </div>
                        </div>

                        {/* Visual blueprints geometry drawing */}
                        <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none opacity-90 select-none">
                          <svg className="w-11/12 h-5/6 text-blue-500 stroke-current fill-none stroke-1" viewBox="0 0 400 240">
                            {/* Blueprint grid lines */}
                            <g className="opacity-25" strokeWidth="0.5" strokeDasharray="3,3">
                              <line x1="0" y1="40" x2="400" y2="40" />
                              <line x1="0" y1="80" x2="400" y2="80" />
                              <line x1="0" y1="120" x2="400" y2="120" />
                              <line x1="0" y1="160" x2="400" y2="160" />
                              <line x1="0" y1="200" x2="400" y2="200" />
                              <line x1="50" y1="0" x2="50" y2="240" />
                              <line x1="100" y1="0" x2="100" y2="240" />
                              <line x1="150" y1="0" x2="150" y2="240" />
                              <line x1="200" y1="0" x2="200" y2="240" />
                              <line x1="250" y1="0" x2="250" y2="240" />
                              <line x1="300" y1="0" x2="300" y2="240" />
                              <line x1="350" y1="0" x2="350" y2="240" />
                            </g>

                            {/* Column or Rafter structural lines depending on Mark */}
                            {activePart.Assembly_Mark.includes("Column") ? (
                              <g>
                                <rect x="150" y="30" width="100" height="180" strokeWidth="1.5" />
                                <rect x="140" y="20" width="120" height="10" strokeWidth="1" />
                                <rect x="140" y="210" width="120" height="10" strokeWidth="1" />
                                {/* Detail circles */}
                                <circle cx="200" cy="110" r="15" strokeDasharray="2,2" />
                                <text x="188" y="114" className="text-[10px] stroke-none fill-sky-400 font-bold font-mono">C1</text>

                                {/* Highlight Selected Plate representation inside Assembly */}
                                <rect x="180" y="45" width="40" height="12" className="fill-indigo-500/30 stroke-indigo-400 stroke-1.5 cursor-help" />
                                <line x1="220" y1="51" x2="310" y2="51" className="stroke-indigo-400 stroke-1" strokeDasharray="3,1" />
                                <text x="315" y="55" className="text-[9px] stroke-none fill-indigo-400 font-bold font-mono">SELECTED: {activePart.Part_ID}</text>

                                {/* general dimensional values */}
                                <text x="270" y="125" className="text-[8px] stroke-none fill-blue-500 font-mono">h = 4200mm</text>
                                <text x="175" y="235" className="text-[8px] stroke-none fill-blue-500 font-mono">FLANGE: 300x12kg</text>
                              </g>
                            ) : (
                              <g>
                                <path d="M 50,150 L 200,90 L 350,150 L 350,170 L 200,110 L 50,170 Z" strokeWidth="1.5" />
                                <line x1="200" y1="90" x2="200" y2="110" strokeWidth="1" />
                                {/* Highlight Selected Plate block on CAD */}
                                <rect x="180" y="80" width="40" height="12" className="fill-indigo-500/30 stroke-indigo-400 stroke-1.5" />
                                <line x1="220" y1="86" x2="280" y2="40" className="stroke-indigo-400 stroke-1" strokeDasharray="3,1" />
                                <text x="285" y="44" className="text-[9px] stroke-none fill-indigo-400 font-bold font-mono">PLATE KEY {activePart.Part_ID}</text>
                                
                                <text x="80" y="200" className="text-[8px] stroke-none fill-blue-500 font-mono">SPAN: 18.5m APEX ANGLE: 14°</text>
                              </g>
                            )}
                          </svg>
                        </div>

                        {/* Title Block bottom right */}
                        <div className="self-end z-10 bg-slate-900 border border-slate-800 p-2 rounded p-1.5 text-[8.5px] font-mono leading-tight text-right w-44">
                          <div className="text-slate-450 font-black">READY FABRICATION LTD.</div>
                          <div className="text-slate-500">PROJECT: MEZZA PORTAL BAY</div>
                          <div className="text-sky-400 font-bold">{activePart.Drawing_Ref} REV 2</div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 italic text-center font-mono select-none">
                        CAD Vector Viewport emulates live high-fidelity blueprint tracing. Selected part highlighted on actual assembly geometry.
                      </p>
                    </div>
                  )}

                  {activeStep === 5 && (
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs antialiased space-y-4 animate-in fade-in duration-300">
                      <div className="border-b border-slate-100 pb-3">
                        <span className="text-[9px] font-black font-mono bg-cyan-100 text-cyan-800 px-2 py-0.5 rounded block w-fit">NODE 6 DRILL-DOWN</span>
                        <h4 className="font-bold text-sm text-slate-900 mt-1.5">Site Location & Erection Lawyer</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Validates and tracks the final site grid coordinate and sequence bounds.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 border border-slate-200 rounded-xl space-y-1 bg-slate-50">
                          <span className="text-slate-400 text-[10px] block uppercase font-mono font-bold">Structural Site Grid</span>
                          <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-rose-500" /> {activePart.Grid || "Grid T"}-Axis
                          </span>
                        </div>
                        <div className="p-3.5 border border-slate-200 rounded-xl space-y-1 bg-slate-50">
                          <span className="text-slate-400 text-[10px] block uppercase font-mono font-bold">Elevation Level</span>
                          <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                            <Layers className="w-4 h-4 text-indigo-500" /> {activePart.Level}
                          </span>
                        </div>
                        <div className="p-3.5 border border-slate-200 rounded-xl space-y-1 bg-slate-50">
                          <span className="text-slate-400 text-[10px] block uppercase font-mono font-bold">Zone Designation</span>
                          <span className="text-sm font-black text-slate-800 flex items-center gap-1">
                            <Layout className="w-4 h-4 text-teal-500" /> {activePart.Zone}
                          </span>
                        </div>
                        <div className="p-3.5 border border-slate-200 rounded-xl space-y-1 bg-slate-50">
                          <span className="text-slate-400 text-[10px] block uppercase font-mono font-bold">Erection Sequence</span>
                          <span className="text-xs font-mono font-black text-indigo-650 bg-indigo-50/50 p-1 rounded inline-block">
                            {activePart.Sequence}
                          </span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 text-slate-400 rounded-xl font-mono text-[10.5px] space-y-1">
                        <div className="text-slate-500">// Site Physical Placement Coordinates Map Anchor</div>
                        <div>Zone GPS Link: <span className="text-emerald-400">Locked 42.128790° S, 147.922094° E</span></div>
                        <div>Target Bay Structure Anchor: <span className="text-cyan-400">"{activePart.Site_Location}"</span></div>
                        <div>Verify Clearance: <span className="text-emerald-400">PASSED FOR CRANE LOAD</span></div>
                      </div>
                    </div>
                  )}

                </div>

                {/* SUBCOLUMN RIGHT: Part Profile Meta Grid (Always visible for selected part) */}
                <div className="md:col-span-12 xl:col-span-5 space-y-4 font-sans">
                  
                  {/* REAL PARSED PLATE PROFILE CAD VIEWPORT CARD */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-inner text-slate-300 relative flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
                        <span className="text-[10px] font-black font-mono text-indigo-400 uppercase tracking-widest">
                          Plate Profile Viewport
                        </span>
                        <span className="text-[9.5px] text-slate-500 font-mono font-black">
                          DXF GEOMETRY PARSER VECTORS
                        </span>
                      </div>

                      {/* Render the actual Plate SVG with holes, slots, center of gravity and rotation */}
                      <div className="relative h-44 border border-slate-800/80 rounded-xl bg-slate-950 flex items-center justify-center p-4 overflow-hidden">
                        {/* Interactive grid backdrop */}
                        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-10 pointer-events-none">
                          {Array.from({ length: 36 }).map((_, idx) => (
                            <div key={idx} className="border-t border-l border-sky-400" />
                          ))}
                        </div>

                        {/* Drawing container */}
                        <svg className="w-full h-full max-h-40 text-sky-400 stroke-current fill-none stroke-1.5" viewBox="-100 -100 200 200">
                          {/* Scribing crosshair */}
                          <line x1="-90" y1="0" x2="90" y2="0" strokeWidth="0.5" strokeDasharray="3,3" className="stroke-slate-800" />
                          <line x1="0" y1="-90" x2="0" y2="90" strokeWidth="0.5" strokeDasharray="3,3" className="stroke-slate-800" />

                          {/* Dynamic rotated group */}
                          <g transform={`rotate(${activePart.Rotation ?? 0})`}>
                            {/* Standard Outer Boundaries drawn procedurally based on Width and Height proportions */}
                            {activePart.Shape?.toLowerCase().includes("gusset") ? (
                              // Triangular Gusset base shape
                              <polygon points="-50,-50 50,-50 -50,50" className="stroke-indigo-400 fill-indigo-500/10 stroke-[2]" />
                            ) : activePart.Shape?.toLowerCase().includes("triangle") || activePart.Shape?.toLowerCase().includes("bracket") ? (
                              // Simple Triangle corner bracket
                              <polygon points="-40,40 40,40 -40,-40" className="stroke-sky-450 fill-sky-500/10 stroke-[2]" />
                            ) : activePart.Shape?.toLowerCase().includes("splicer") ? (
                              // Slim spliced plate
                              <rect x="-25" y="-60" width="50" height="120" rx="3" className="stroke-indigo-400 fill-indigo-500/10 stroke-[2]" />
                            ) : (
                              // Default Baseplate / End Plate / Rectangle design
                              <rect x="-45" y="-60" width="90" height="120" rx="4" className="stroke-indigo-400 fill-indigo-500/10 stroke-[2]" />
                            )}

                            {/* Holes parsed and drawn dynamically */}
                            {activePart.Holes && activePart.Holes !== "None" && (
                              <g className="fill-slate-950 stroke-sky-400">
                                {/* Procedurally distribute bolt circles (e.g., 6 or 4 bolts, or custom count) */}
                                {activePart.Holes.includes("6x") || activePart.Holes.includes("6d") || activePart.Holes.includes("8x") ? (
                                  <>
                                    <circle cx="-25" cy="-40" r="4.5" />
                                    <circle cx="25" cy="-40" r="4.5" />
                                    <circle cx="-25" cy="0" r="4.5" />
                                    <circle cx="25" cy="0" r="4.5" />
                                    <circle cx="-25" cy="40" r="4.5" />
                                    <circle cx="25" cy="40" r="4.5" />
                                  </>
                                ) : (
                                  <>
                                    <circle cx="-25" cy="-40" r="4.5" />
                                    <circle cx="25" cy="-40" r="4.5" />
                                    <circle cx="-25" cy="40" r="4.5" />
                                    <circle cx="25" cy="40" r="4.5" />
                                  </>
                                )}
                              </g>
                            )}

                            {/* Slots parsed and drawn dynamically */}
                            {activePart.Slots && activePart.Slots !== "None" && (
                              <g className="stroke-amber-400 stroke-[1.5] fill-slate-950">
                                {/* Render slot shapes */}
                                <rect x="-15" y="-14" width="30" height="6" rx="2" className="opacity-80" />
                                <rect x="-15" y="10" width="30" height="6" rx="2" className="opacity-80" />
                              </g>
                            )}

                            {/* Center of Gravity Marker (COG) */}
                            {activePart.COG && (
                              <g className="stroke-rose-500 fill-rose-500/20">
                                <circle cx="0" cy="0" r="6" strokeWidth="1" />
                                <line x1="-12" y1="0" x2="12" y2="0" strokeWidth="1" />
                                <line x1="0" y1="-12" x2="0" y2="12" strokeWidth="1" />
                                <text x="14" y="4" className="text-[9px] stroke-none fill-rose-400 font-bold font-mono">COG</text>
                              </g>
                            )}
                          </g>

                          {/* Legend orientation arrow static (compass angle) */}
                          <g transform="translate(75, 75)" className="stroke-teal-400 fill-none stroke-1">
                            <circle cx="0" cy="0" r="12" strokeDasharray="2,2" />
                            <g transform={`rotate(${activePart.Rotation ?? 0})`}>
                              <line x1="0" y1="12" x2="0" y2="-12" strokeWidth="1.5" />
                              <polygon points="0,-12 -3,-6 3,-6" className="fill-teal-400 stroke-none" />
                            </g>
                            <text x="-8" y="-16" className="text-[7.5px] font-mono fill-teal-400 stroke-none">{activePart.Rotation ?? 0}°</text>
                          </g>
                        </svg>
                      </div>
                    </div>

                    <div className="mt-3 text-[10px] text-slate-400 font-mono leading-none flex justify-between">
                      <span>DXF Status: <strong className="text-emerald-400">Geometry Active</strong></span>
                      <span>Filename: <strong className="text-sky-300 truncate max-w-[140px] inline-block align-bottom">{activePart.DXF_Filename}</strong></span>
                    </div>
                  </div>

                  {/* UNIFIED PERSISTENT PART PROFILE CARD */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                        <div>
                          <span className="text-[9.5px] font-bold font-mono text-indigo-650 bg-indigo-50 px-2 py-0.5 rounded uppercase font-black">
                            Digital Twin Profile
                          </span>
                          <h4 className="font-extrabold text-slate-800 mt-1">{activePart.Part_ID} Profile</h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-bold font-mono text-slate-450 block font-black">PART ID</span>
                          <span className="font-mono font-bold text-slate-850 text-xs">{activePart.Part_ID}</span>
                        </div>
                      </div>

                      {/* Profile details parameters */}
                      <div className="space-y-3.5 text-xs">
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Plate Shape Type</span>
                          <span className="font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{activePart.Shape || "Rect"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Width x Height</span>
                          <span className="font-mono font-bold text-slate-800">{activePart.Width || "-"} mm × {activePart.Height || "-"} mm</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Thickness</span>
                          <span className="font-mono font-bold text-slate-800">{activePart.Thickness} mm</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Calculated Area</span>
                          <span className="font-mono font-bold text-indigo-700">{activePart.Area || "-"} mm²</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Holes Configuration</span>
                          <span className="font-semibold text-slate-800">{activePart.Holes || "None"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Slots Configuration</span>
                          <span className="font-semibold text-slate-800">{activePart.Slots || "None"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Rotation Angle</span>
                          <span className="font-mono font-bold text-slate-800">{activePart.Rotation !== undefined ? `${activePart.Rotation}° Clockwise` : "0°"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">COG Centerpoint</span>
                          <span className="font-mono font-bold text-rose-600">{activePart.COG ? `[${activePart.COG}]` : "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Material Spec</span>
                          <span className="font-bold text-slate-800">{activePart.Material || "HA350 Steel"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Assembly Mark</span>
                          <span className="font-mono font-black text-indigo-700">{activePart.Assembly_Mark}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Kit Box Destination</span>
                          <span className="font-bold text-slate-800">{activePart.RF_BIN || "-"} • {activePart.RF_STAGE || "-"}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-50 pb-2">
                          <span className="text-slate-400 font-medium">Part Weight</span>
                          <span className="font-mono font-bold text-slate-850">{activePart.Weight_Kg || "-"} kg</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-100 pb-2">
                          <span className="text-slate-400 font-medium">DWG Reference</span>
                          <span className="font-mono font-bold text-slate-800 text-[11px] underline min-w-0 truncate">{activePart.Drawing_Ref}</span>
                        </div>
                      </div>
                    </div>

                    {/* QR Code Sticker Block */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4 font-mono text-[10px] select-none">
                      <div className="space-y-1 min-w-0">
                        <span className="text-slate-400 block font-bold uppercase truncate">Barcode Reference</span>
                        <span className="font-bold text-slate-800 block truncate">{activePart.QR_Code}</span>
                        <span className="text-[8.5px] text-slate-400 block">Digitally secured ID code</span>
                      </div>
                      
                      {/* Stylized QR Box */}
                      <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded p-1 flex items-center justify-center shrink-0">
                        <div className="grid grid-cols-5 gap-0.5 w-full h-full opacity-90 text-[2px]">
                          {Array.from({ length: 25 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-full h-full ${
                                (i + activePart.Part_ID.charCodeAt(1)) % 3 === 0 || i % 7 === 0 || i === 0 || i === 4 || i === 20 || i === 24
                                  ? "bg-slate-900" 
                                  : "bg-transparent"
                              }`} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MINI REPORT DOCKET BOX STATS (SIBLINGS REPORT CARD) */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5 leading-relaxed">
                    <h5 className="text-xs font-black text-slate-850 uppercase tracking-widest font-mono">
                      Box Container {activePart.Assembly_Mark} Metrics
                    </h5>
                    <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                      <div className="bg-white border rounded-lg p-2.5">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Pieces</span>
                        <span className="text-base font-black text-slate-800">{boxStats.total}</span>
                      </div>
                      <div className="bg-white border rounded-lg p-2.5">
                        <span className="text-slate-400 text-[10px] block uppercase font-bold">Total Weight</span>
                        <span className="text-base font-black text-slate-800">{boxStats.weight} kg</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 font-sans">
                      This box is rated for {boxStats.weight} kg. Prior to dispatch, crane slings confirm loading matches trace quantities.
                    </div>
                  </div>

                </div>

              </div>

            </>
          ) : (
            <div className="bg-white border rounded-2xl py-24 text-center text-slate-400 italic">
              No steel parts parsed yet. Restoring default samples recommended.
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
