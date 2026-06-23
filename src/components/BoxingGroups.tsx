import React, { useState } from "react";
import { Package, CheckSquare, Square, CheckCircle, Truck, FileText, Printer, ArrowLeft, RefreshCw, UserCheck, MessageSquare, AlertCircle, HelpCircle, XCircle, QrCode, Layers } from "lucide-react";
import { Part, DeliveryDocket, PartStatus } from "../types";
import { SectionPart } from "./SectionNester";

interface BoxingGroupsProps {
  parts: Part[];
  onChangeStatus: (partId: string, nextStatus: PartStatus) => void;
  onToggleBoxStatus: (assemblyMark: string, makeAllPlaced: boolean) => void;
  onOpenQRResolver?: (type: "part" | "assembly" | "box", id: string) => void;
  activeJobName?: string;
  activeJobNumber?: string;
  sectionParts?: SectionPart[];
  onChangeSectionPartStatus?: (partId: string, nextStatus: "Pending" | "Cut" | "Exception") => void;
}

export default function BoxingGroups({ 
  parts, 
  onChangeStatus, 
  onToggleBoxStatus, 
  onOpenQRResolver, 
  activeJobName, 
  activeJobNumber,
  sectionParts = [],
  onChangeSectionPartStatus
}: BoxingGroupsProps) {
  const [selectedAssembly, setSelectedAssembly] = useState<string | null>(null);
  const [currentDocket, setCurrentDocket] = useState<DeliveryDocket | null>(null);
  
  // Custom print-ready state
  const [receivedBy, setReceivedBy] = useState("");
  const [notes, setNotes] = useState("");

  // Group parts by Assembly_Mark
  const groups: { [assembly: string]: Part[] } = {};
  parts.forEach(part => {
    const assy = part.Assembly_Mark;
    if (!groups[assy]) {
      groups[assy] = [];
    }
    groups[assy].push(part);
  });

  const assemblyMarks = Object.keys(groups).sort();

  // Helper to format Box Name
  const getBoxName = (assembly: string) => {
    // E.g. "Column-A6" -> "BOX-A6" or "BOX-Column-A6"
    const cleaned = assembly.replace(/[ _]/g, "");
    return `BOX-${cleaned.toUpperCase()}`;
  };

  const handleOpenDocketGenerator = (assembly: string) => {
    const boxParts = groups[assembly] || [];
    const docketNum = `DK-${assembly.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDocket: DeliveryDocket = {
      DocketNumber: docketNum,
      Assembly_Mark: assembly,
      BoxName: getBoxName(assembly),
      DateGenerated: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      ReceivedBy: receivedBy,
      Notes: notes,
      Parts: boxParts
    };
    setCurrentDocket(newDocket);
  };

  const handlePrintDocket = () => {
    window.print();
  };

  const activeAssembly = selectedAssembly || (assemblyMarks.length > 0 ? assemblyMarks[0] : null);
  const activeBoxParts = activeAssembly ? (groups[activeAssembly] || []) : [];
  const activeBoxSections = activeAssembly ? sectionParts.filter(s => s.Assembly_Mark === activeAssembly) : [];
  const activeBoxPlacedCount = activeBoxParts.filter(p => p.Status === "Placed").length + activeBoxSections.filter(s => s.Status === "Cut").length;
  const activeBoxTotalCount = activeBoxParts.length + activeBoxSections.length;
  const activeBoxProgress = activeBoxTotalCount > 0 ? Math.round((activeBoxPlacedCount / activeBoxTotalCount) * 100) : 0;
  const activeBoxName = activeAssembly ? getBoxName(activeAssembly) : "";

  return (
    <div className="space-y-6">
      {/* If Delivery Docket Preview Modal is Active */}
      {currentDocket && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 no-print">
            <button
              onClick={() => setCurrentDocket(null)}
              className="px-3 py-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Boxing Dashboard
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrintDocket}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Delivery Docket
              </button>
            </div>
          </div>

          {/* PRINT DESIGN DOCKET CONTAINER */}
          <div className="bg-white border-2 border-slate-300 p-8 rounded-lg max-w-4xl mx-auto shadow-sm printable-docket font-sans">
            <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
                  <Truck className="w-6 h-6 text-slate-800" />
                  Steel Dispatch Report
                </h1>
                <p className="text-slate-500 text-xs mt-1">RF Member Kit Box Delivery Docket</p>
                <div className="mt-2 text-[10px] md:text-xs font-semibold text-slate-705 font-mono">
                  Job Reference: <span className="font-extrabold text-indigo-650">{activeJobName || "Sydney Metro Expansion"}</span> <span className="text-slate-300">|</span> ID: <span className="font-extrabold text-slate-600">{activeJobNumber || "RF-2026-HQ-01"}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DOCKET ID NO.</span>
                <p className="font-mono text-lg font-black text-rose-600 tracking-wider mt-0.5">{currentDocket.DocketNumber}</p>
              </div>
            </div>

            {/* Shipment Metadata grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-6 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">MEMBER / ASSEMBLY MARK</span>
                <p className="font-bold text-slate-900 text-sm font-mono mt-1">{currentDocket.Assembly_Mark}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">BOX CONTAINER ID</span>
                <p className="font-bold text-blue-600 text-sm font-mono mt-1">{currentDocket.BoxName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">DISPATCH DATE</span>
                <p className="font-medium text-slate-700 font-mono mt-1">{currentDocket.DateGenerated}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">BOX STATUS</span>
                <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 mt-1 rounded-full ${
                  currentDocket.Parts.every(p => p.Status === 'Placed')
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentDocket.Parts.some(p => p.Status === 'Pending')
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentDocket.Parts.every(p => p.Status === 'Placed')
                    ? "CLOSED & VERIFIED"
                    : currentDocket.Parts.some(p => p.Status === 'Pending')
                    ? "PARTIAL / OPEN"
                    : "CHECKED DISCREPANCIES"}
                </span>
              </div>
            </div>

            {/* Dispatch details inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 no-print">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Received By / Site Contact</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={receivedBy}
                    onChange={(e) => {
                      setReceivedBy(e.target.value);
                      setCurrentDocket(prev => prev ? { ...prev, ReceivedBy: e.target.value } : null);
                    }}
                    placeholder="Enter recipient operator or representative..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Dispatcher Notes & Site Instructions</label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setCurrentDocket(prev => prev ? { ...prev, Notes: e.target.value } : null);
                    }}
                    placeholder="E.g., Fragile plates, Forklift required at unloading bay..."
                    className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Display static notes on actual printed document */}
            {(currentDocket.ReceivedBy || currentDocket.Notes) && (
              <div className="hidden print-only py-4 border-b border-dashed border-slate-200 text-xs">
                {currentDocket.ReceivedBy && (
                  <p className="mb-1"><span className="font-semibold text-slate-500">Destination Site Rep:</span> {currentDocket.ReceivedBy}</p>
                )}
                {currentDocket.Notes && (
                  <p><span className="font-semibold text-slate-500">Dispatch Notes:</span> {currentDocket.Notes}</p>
                )}
              </div>
            )}

            {/* Parts List Table */}
            <div className="mt-6">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">CONSOLIDATED PLATE PARTS MANIFEST</h2>
              <table className="w-full text-left text-[11px] text-slate-500">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-2">Part ID</th>
                    <th className="px-3 py-2 text-right">Thickness</th>
                    <th className="px-3 py-2">Target Storage Bin</th>
                    <th className="px-3 py-2">Project Stage</th>
                    <th className="px-3 py-2">DXF Reference</th>
                    <th className="px-3 py-2 text-center w-24">Loaded State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {currentDocket.Parts.map((p) => (
                    <tr key={p.Part_ID} className={
                      p.Status === "Placed"
                        ? "bg-emerald-50/10"
                        : p.Status === "Missing"
                        ? "bg-rose-50/10"
                        : p.Status === "Exception"
                        ? "bg-amber-50/10"
                        : "bg-slate-50/30"
                    }>
                      <td className="px-3 py-2 font-bold text-slate-900">{p.Part_ID}</td>
                      <td className="px-3 py-2 text-right">{p.Thickness} mm</td>
                      <td className="px-3 py-2">{p.RF_BIN || "-"}</td>
                      <td className="px-3 py-2 font-sans">{p.RF_STAGE || "-"}</td>
                      <td className="px-3 py-2">
                        <div>{p.DXF_Filename}</div>
                        {p.Shape && (
                          <div className="text-[9px] text-slate-400 font-sans font-medium">
                            Shape: {p.Shape} ({p.Width}x{p.Height}mm) • {p.Holes || "0 holes"} / {p.Slots || "0 slots"}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-block text-[10px] px-2 py-0.5 rounded-sm font-bold ${
                          p.Status === "Placed"
                            ? "bg-emerald-50 text-emerald-800"
                            : p.Status === "Missing"
                            ? "bg-rose-50 text-rose-800"
                            : p.Status === "Exception"
                            ? "bg-amber-50 text-amber-850"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {p.Status === "Placed"
                            ? "✔ LOADED"
                            : p.Status === "Missing"
                            ? "✘ MISSING"
                            : p.Status === "Exception"
                            ? "⚠️ ALERT"
                            : "🕒 PENDING"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary details */}
            <div className="mt-6 bg-slate-50 p-4 border border-slate-200 rounded-lg text-xs grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-slate-800">Box Package Checklist Verification</p>
                <p className="text-[11px] text-slate-500 mt-0.5">We hereby attest that the members contained in this dispatch docket correspond exactly with structural drawings and are packed securely.</p>
              </div>
              <div className="text-right flex flex-col justify-center font-mono font-medium space-y-0.5">
                <p>Total Items in Box Manifest: <span className="font-bold text-slate-900">{currentDocket.Parts.length}</span></p>
                <p>Fully Placed/Loaded: <span className="font-bold text-emerald-600">{currentDocket.Parts.filter(p => p.Status === 'Placed').length}</span></p>
                {currentDocket.Parts.filter(p => p.Status === 'Missing').length > 0 && (
                  <p>Missing Items: <span className="font-bold text-rose-600">{currentDocket.Parts.filter(p => p.Status === 'Missing').length}</span></p>
                )}
                {currentDocket.Parts.filter(p => p.Status === 'Exception').length > 0 && (
                  <p>Exception Alerts: <span className="font-bold text-amber-600">{currentDocket.Parts.filter(p => p.Status === 'Exception').length}</span></p>
                )}
              </div>
            </div>

            {/* Signatures Boxes */}
            <div className="grid grid-cols-2 gap-12 mt-12 pt-8 border-t border-dashed border-slate-300">
              <div className="text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-12">DISPATCHING OPERATOR SIGNATURE</span>
                <div className="border-b border-slate-800 w-full h-1 mt-2 mb-2" />
                <p className="text-slate-500">Fabrication Logistics Supervisor</p>
              </div>

              <div className="text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-12">SITE RECEIVER SIGNATURE</span>
                <div className="border-b border-slate-800 w-full h-1 mt-2 mb-2" />
                <p className="text-slate-500">Steel Erector Foreman / General Contractor</p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest mt-12 border-t border-slate-100 pt-4">
              Generated via RF Member Kit Box Workflow System
            </p>
          </div>
        </div>
      )}

      {/* Primary Dashboard Grid if Docket modal is closed */}
      {!currentDocket && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Box List Selection Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-1">Available member Kit Boxes</h3>
            
            {assemblyMarks.length > 0 ? (
              <div className="space-y-3">
                {assemblyMarks.map((assembly) => {
                  const boxParts = groups[assembly] || [];
                  const boxSections = sectionParts.filter(s => s.Assembly_Mark === assembly);
                  
                  const placedParts = boxParts.filter(p => p.Status === "Placed").length + boxSections.filter(s => s.Status === "Cut").length;
                  const missingParts = boxParts.filter(p => p.Status === "Missing").length;
                  const exceptionParts = boxParts.filter(p => p.Status === "Exception").length + boxSections.filter(s => s.Status === "Exception").length;
                  const pendingParts = boxParts.filter(p => p.Status === "Pending").length + boxSections.filter(s => s.Status === "Pending").length;
                  const totalParts = boxParts.length + boxSections.length;
                  const boxName = getBoxName(assembly);
                  const isCompleted = placedParts === totalParts;
                  const isFullyCheckedWithIssues = !isCompleted && pendingParts === 0 && (missingParts > 0 || exceptionParts > 0);
                  const isPartial = !isCompleted && !isFullyCheckedWithIssues && (placedParts > 0 || missingParts > 0 || exceptionParts > 0);
                  const isSelected = activeAssembly === assembly;

                    return (
                      <button
                        key={assembly}
                        type="button"
                        onClick={() => setSelectedAssembly(assembly)}
                        className={`w-full text-left p-4 rounded-xl border transition flex flex-col justify-between items-stretch font-sans cursor-pointer ${
                          isSelected
                            ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                            : "bg-white text-slate-705 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package className={`w-4 h-4 shrink-0 ${isSelected ? "text-indigo-400" : "text-indigo-600"}`} />
                            <span className="font-mono text-sm font-semibold">{boxName}</span>
                          </div>
                          {isCompleted && (
                            <span className="bg-emerald-500 text-white rounded-full p-0.5" title="All parts placed">
                              <CheckCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {isFullyCheckedWithIssues && (
                            <span className="bg-amber-500 text-white rounded-full p-0.5" title="Processed with issues">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {isPartial && (
                            <span className="bg-blue-500 text-white rounded-full p-0.5" title="In progress">
                              <span className="block w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                            </span>
                          )}
                        </div>

                        <div className="mt-3">
                          <span className="text-[11px] font-bold tracking-tight block">
                            Assembly Source: <span className="font-semibold font-mono">{assembly}</span>
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs opacity-90">
                          <span className="font-medium text-[11px]">Check-off Progress</span>
                          <span className="font-mono font-bold text-[11px] font-semibold">{placedParts} / {totalParts} placed</span>
                        </div>

                        {/* Status chip breakdowns */}
                        <div className="mt-2.5 flex flex-wrap gap-1">
                          <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black font-mono leading-none ${placedParts > 0 ? (isSelected ? 'bg-emerald-500/25 text-emerald-300' : 'bg-emerald-500/10 text-emerald-600') : (isSelected ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400')}`}>
                            {placedParts} Placed
                          </span>
                          {missingParts > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black font-mono leading-none ${isSelected ? 'bg-rose-500/25 text-rose-300' : 'bg-rose-500/10 text-rose-600'}`}>
                              {missingParts} Missing
                            </span>
                          )}
                          {exceptionParts > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black font-mono leading-none ${isSelected ? 'bg-amber-500/25 text-amber-300' : 'bg-amber-500/10 text-amber-600'}`}>
                              {exceptionParts} Alert
                            </span>
                          )}
                          {pendingParts > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-[4px] text-[9px] font-black font-mono leading-none ${isSelected ? 'bg-slate-850 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                              {pendingParts} Pending
                            </span>
                          )}
                        </div>

                        {/* Bar indicator */}
                        <div className="w-full bg-slate-205 rounded-full h-1 mt-3">
                          <div 
                            className={`h-1 rounded-full transition-all duration-300 ${isCompleted ? "bg-emerald-400" : isFullyCheckedWithIssues ? "bg-amber-400" : "bg-indigo-600"}`}
                            style={{ width: `${(placedParts / totalParts) * 100}%` }}
                          />
                        </div>
                      </button>
                    );
                })}
              </div>
            ) : (
              <div className="bg-white p-6 border border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                No boxes populated.
              </div>
            )}
          </div>

          {/* Detailed Box Checkout Controls */}
          <div className="lg:col-span-2">
            {activeAssembly ? (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col h-full">
                {/* Detail Panel Header */}
                <div className="p-5 border-b border-slate-150 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Interactive Boxing Deck</span>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-850 border-indigo-100 border rounded text-[10px] font-black font-mono">
                        {activeBoxName}
                      </span>
                      {onOpenQRResolver && (
                        <button
                          onClick={() => onOpenQRResolver("box", activeAssembly)}
                          className="px-2 py-0.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-505 rounded text-[10px] font-mono hover:text-indigo-650 transition flex items-center gap-1 cursor-pointer select-none"
                          title="View Kit Box QR Code"
                        >
                          <QrCode className="w-3 h-3" />
                          Scan Box
                        </button>
                      )}
                    </div>
                    <h2 className="text-xl font-bold font-sans text-slate-905 mt-1 flex items-center gap-2">
                      Assembly Mark: {activeAssembly}
                      {onOpenQRResolver && (
                        <button
                          onClick={() => onOpenQRResolver("assembly", activeAssembly)}
                          className="p-1 border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 rounded hover:text-indigo-650 transition cursor-pointer select-none"
                          title="View Assembly QR code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      )}
                    </h2>
                  </div>

                  <div className="flex gap-2">
                    {/* Bulk tick-off helper */}
                    <button
                      onClick={() => onToggleBoxStatus(activeAssembly, activeBoxPlacedCount !== activeBoxTotalCount)}
                      className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      {activeBoxPlacedCount === activeBoxTotalCount ? "Reset Box (Mark Pending)" : "Pack Box (Placed)"}
                    </button>

                    {/* Report Generator Link */}
                    <button
                      onClick={() => handleOpenDocketGenerator(activeAssembly)}
                      className="px-4 py-2 bg-indigo-600 border border-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow-sm font-sans"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Generate Delivery Docket
                    </button>
                  </div>
                </div>

                {/* Progress bar metrics */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/40 flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1 text-xs text-slate-500">
                      <span className="font-semibold text-slate-705">Packing Progress: {activeBoxPlacedCount}/{activeBoxTotalCount} Elements Placed</span>
                      <span className="font-mono font-bold text-slate-800">{activeBoxProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeBoxProgress === 100 ? "bg-emerald-500" : "bg-indigo-600"}`}
                        style={{ width: `${activeBoxProgress}%` }}
                      />
                    </div>
                  </div>
                  {activeBoxProgress === 100 && (
                    <div className="bg-emerald-100 border border-emerald-200 text-emerald-850 px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold leading-none animate-pulse mt-1">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span>READY TO SHIP</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detailed checklist */}
                <div className="overflow-y-auto flex-1">
                  <table className="w-full text-xs text-left text-slate-500">
                    <thead className="bg-slate-25 border-b border-slate-105 text-slate-705 font-bold tracking-wider text-[10px] uppercase">
                      <tr>
                        <th className="px-5 py-3 w-16 text-center">Placed</th>
                        <th className="px-5 py-3">Part ID</th>
                        <th className="px-5 py-3 text-right">Thickness</th>
                        <th className="px-5 py-3">RF BIN / STAGE</th>
                        <th className="px-5 py-3">Status State</th>
                        <th className="px-5 py-3">DXF drawing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeBoxParts.map((part) => {
                        const isPlaced = part.Status === "Placed";
                        const isMissing = part.Status === "Missing";
                        const isException = part.Status === "Exception";

                        return (
                          <tr 
                            key={part.Part_ID} 
                            className={`hover:bg-slate-50 transition-colors ${
                              isPlaced
                                ? "bg-emerald-50/15"
                                : isMissing
                                ? "bg-rose-50/10"
                                : isException
                                ? "bg-amber-50/15"
                                : ""
                            }`}
                          >
                            <td className="px-5 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => onChangeStatus(part.Part_ID, isPlaced ? "Pending" : "Placed")}
                                className={`p-1.5 rounded-md transition cursor-pointer ${
                                  isPlaced 
                                    ? "text-emerald-600 bg-emerald-50" 
                                    : isMissing
                                    ? "text-rose-500 bg-rose-55"
                                    : isException
                                    ? "text-amber-500 bg-amber-55"
                                    : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                                }`}
                                title={isPlaced ? "Mark Pending" : "Mark Placed"}
                              >
                                {isPlaced ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="px-5 py-3 font-mono font-bold text-slate-900">
                              <div className="flex items-center justify-between gap-1.5 font-sans font-normal">
                                <span className="flex items-center gap-1.5 min-w-0 font-mono font-bold">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${part.Part_ID.toUpperCase().startsWith("PL") ? "bg-amber-500" : "bg-indigo-500"}`} />
                                  <span className="truncate">{part.Part_ID}</span>
                                </span>
                                {onOpenQRResolver && (
                                  <button
                                    onClick={() => onOpenQRResolver("part", part.Part_ID)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-650 transition cursor-pointer"
                                    title="Scan/Resolve Part QR Code"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-semibold text-slate-702">{part.Thickness} mm</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">
                              <div className="flex flex-col">
                                <div className="font-semibold text-slate-700">BIN: {part.RF_BIN || "-"}</div>
                                <div className="text-[10px] text-slate-400">{part.RF_STAGE || "-"}</div>
                              </div>
                            </td>
                            
                            {/* Workflow Status selector dropdown */}
                            <td className="px-5 py-3">
                              <select
                                value={part.Status}
                                onChange={(e) => onChangeStatus(part.Part_ID, e.target.value as PartStatus)}
                                className={`text-[11px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer focus:outline-none ${
                                  isPlaced
                                    ? "bg-emerald-55 text-emerald-800 border-emerald-200"
                                    : isMissing
                                    ? "bg-rose-50 text-rose-800 border-rose-220 font-extrabold"
                                    : isException
                                    ? "bg-amber-50 text-amber-800 border-amber-220"
                                    : "bg-slate-50 text-slate-600 border-slate-205"
                                }`}
                              >
                                <option value="Pending">🕒 Pending</option>
                                <option value="Placed">✔ Placed (Complete)</option>
                                <option value="Missing">❌ Missing</option>
                                <option value="Exception">⚠ Exception</option>
                              </select>
                            </td>
                            
                            <td className="px-5 py-3 font-mono text-slate-5 -overflow-hidden text-ellipsis truncate max-w-[120px]" title={part.DXF_Filename}>
                              {part.DXF_Filename}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Interactive Section Cuts from 1D Nester */}
                      {activeBoxSections.map((sec) => {
                        const isCut = sec.Status === "Cut";
                        const isException = sec.Status === "Exception";

                        return (
                          <tr 
                            key={sec.Part_ID} 
                            className={`hover:bg-slate-50 transition-colors ${
                              isCut
                                ? "bg-indigo-50/15"
                                : isException
                                ? "bg-amber-50/15"
                                : ""
                            }`}
                          >
                            <td className="px-5 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => onChangeSectionPartStatus && onChangeSectionPartStatus(sec.Part_ID, isCut ? "Pending" : "Cut")}
                                className={`p-1.5 rounded-md transition cursor-pointer ${
                                  isCut 
                                    ? "text-indigo-600 bg-indigo-50" 
                                    : isException
                                    ? "text-amber-500 bg-amber-50"
                                    : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                                }`}
                                title={isCut ? "Mark Pending" : "Mark Cut (Complete)"}
                              >
                                {isCut ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="px-5 py-3 font-mono font-bold text-indigo-900 bg-indigo-50/5">
                              <div className="flex items-center justify-between gap-1.5 font-sans font-normal">
                                <span className="flex items-center gap-1.5 min-w-0 font-mono font-bold">
                                  <Layers className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                  <span className="truncate text-indigo-950 font-black">{sec.Part_ID}</span>
                                </span>
                              </div>
                            </td>
                            <td className="px-5 py-3 text-right font-mono font-black text-indigo-800">{sec.Final_Length} mm</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">
                              <div className="flex flex-col">
                                <div className="font-semibold text-indigo-700">PROFILE: {sec.Profile}</div>
                                <div className="text-[10px] text-slate-400">1D Linear Member • {sec.Material}</div>
                              </div>
                            </td>
                            
                            {/* Workflow Status selector dropdown */}
                            <td className="px-5 py-3">
                              <select
                                value={sec.Status}
                                onChange={(e) => onChangeSectionPartStatus && onChangeSectionPartStatus(sec.Part_ID, e.target.value as any)}
                                className={`text-[11px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer focus:outline-none ${
                                  isCut
                                    ? "bg-indigo-50 text-indigo-800 border-indigo-200"
                                    : isException
                                    ? "bg-amber-50 text-amber-800 border-amber-220"
                                    : "bg-slate-50 text-slate-600 border-slate-205"
                                }`}
                              >
                                <option value="Pending">🕒 Pending Cut</option>
                                <option value="Cut">✔ Cut Complete</option>
                                <option value="Exception">⚠ Exception</option>
                              </select>
                            </td>
                            
                            <td className="px-5 py-3 font-mono text-indigo-650 font-bold overflow-hidden text-ellipsis truncate max-w-[120px]" title={sec.Traceability_QR}>
                              QR: {sec.Traceability_QR}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Operator instructional footer */}
                <div className="p-4 bg-indigo-50/70 text-xs text-indigo-900 border-t border-indigo-100/50 leading-relaxed font-medium">
                  <strong>Boxing and Pack-off instructions:</strong> When placing steel plates into physical delivery boxes in the assembly yard, check them off in this terminal. When a box reaches <strong>100% packing progress</strong>, click the <strong>Generate Delivery Docket</strong> button above to render a professional, clean dispatch note suitable for signing.
                </div>
              </div>
            ) : (
              <div className="bg-white p-16 text-center rounded-xl border border-slate-200">
                <Package className="w-12 h-12 text-slate-305 mx-auto opacity-30 mb-2 animate-bounce" />
                <h3 className="text-slate-700 font-bold text-sm">No member groups loaded</h3>
                <p className="text-slate-500 text-xs mt-1">Upload a parts specification CSV file under the Import tab to begin.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
