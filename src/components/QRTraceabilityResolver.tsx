import React, { useState, useEffect, useMemo } from "react";
import { 
  X, QrCode, FileCode, MapPin, Layers, ShieldCheck, 
  Check, Copy, GitMerge, Package, Layout, Compass, Weight, FileText 
} from "lucide-react";
import { Part, PartStatus } from "../types";

interface QRTraceabilityResolverProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "part" | "assembly" | "box";
  entityId: string; // part ID, assembly mark, or box ID
  parts: Part[];
  onNavigateToTraceability: (partId: string, stepId: number) => void;
  onChangeStatus?: (partId: string, nextStatus: PartStatus) => void;
}

export default function QRTraceabilityResolver({
  isOpen,
  onClose,
  entityType,
  entityId,
  parts,
  onNavigateToTraceability,
  onChangeStatus
}: QRTraceabilityResolverProps) {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  // Stop scanning animation after 800ms to simulate quick barcode decode
  useEffect(() => {
    if (isOpen) {
      setScanning(true);
      const timer = setTimeout(() => {
        setScanning(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [isOpen, entityId, entityType]);

  // Fetch relevant targets based on resolving input
  const resolvedData = useMemo(() => {
    if (entityType === "part") {
      const part = parts.find(p => p.Part_ID === entityId);
      return part ? { 
        part, 
        qrcode: part.QR_Code || `RF-QR-${part.Part_ID}`,
        drawingRef: part.Drawing_Ref || "WD-GEN-REF",
        installPosition: `${part.Grid || "Grid Zone"} • ${part.Level || "Ground Level"} • ${part.Zone || "Zone A"}`
      } : null;
    } 
    
    if (entityType === "assembly") {
      const assemblyParts = parts.filter(p => p.Assembly_Mark === entityId);
      if (assemblyParts.length === 0) return null;
      const refPart = assemblyParts[0];
      const totalWeight = assemblyParts.reduce((acc, p) => acc + (p.Weight_Kg || 0), 0);
      return {
        assemblyMark: entityId,
        parts: assemblyParts,
        qrcode: `RF-QR-ASSY-${entityId.toUpperCase()}`,
        drawingRef: refPart.Drawing_Ref || "WD-ASSY-DWG",
        installPosition: `${refPart.Grid || "Grid Axis"} • ${refPart.Level || "Level L1"} • ${refPart.Site_Location || "Anchor B"}`,
        totalWeight: Number(totalWeight.toFixed(1))
      };
    }

    if (entityType === "box") {
      const boxParts = parts.filter(p => p.Assembly_Mark === entityId || p.Assembly_Mark.replace(/[ _]/g, "").toUpperCase() === entityId.replace("BOX-", "").toUpperCase());
      const assemblyMark = boxParts.length > 0 ? boxParts[0].Assembly_Mark : entityId;
      if (boxParts.length === 0) return null;
      const refPart = boxParts[0];
      
      const placedCount = boxParts.filter(p => p.Status === "Placed").length;
      const totalWeight = boxParts.reduce((acc, p) => acc + (p.Weight_Kg || 0), 0);
      const hasExceptions = boxParts.some(p => p.Status === "Exception" || p.Status === "Missing");
      
      let status = "Packing In Progress";
      if (placedCount === boxParts.length) status = "Sealed / Ready to Ship";
      else if (hasExceptions) status = "Alert / Discrepancy Hold";

      return {
        boxId: `BOX-${assemblyMark.toUpperCase().replace(/[ _]/g, "")}`,
        assemblyMark,
        parts: boxParts,
        qrcode: `RF-QR-BOX-${assemblyMark.toUpperCase()}`,
        drawingRef: refPart.Drawing_Ref || "WD-BOX-REF",
        installPosition: `${refPart.RF_BIN || "BIN-01"} Stage ${refPart.RF_STAGE || "STAGE-1A"}`,
        totalWeight: Number(totalWeight.toFixed(1)),
        placedCount,
        totalCount: boxParts.length,
        status,
        hasExceptions
      };
    }
    return null;
  }, [entityType, entityId, parts]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto no-print">
      {/* Dark backdrop element */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-xl border border-slate-200">
          
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-indigo-600/35 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5 font-sans">
                  Digital Twin QR resolver
                </h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-wide uppercase">
                  READYFAB CONCEPT TRACE LAYOUT
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Resolving View */}
          <div className="p-6 space-y-5">
            {scanning ? (
              /* Laser barcode scan sim */
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative w-28 h-28 bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center justify-center overflow-hidden">
                  {/* Dynamic moving laser scanner bar */}
                  <div className="absolute left-0 right-0 h-0.5 bg-emerald-500 shadow-md shadow-emerald-500 animate-[bounce_1.5s_infinite]" />
                  <div className="grid grid-cols-5 gap-0.5 w-full h-full opacity-35 select-none">
                    {Array.from({ length: 25 }).map((_, i) => (
                      <div key={i} className={`w-full h-full ${i % 3 === 0 || i % 7 === 0 ? 'bg-slate-900' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold font-mono text-slate-700 animate-pulse uppercase tracking-wider">Decoding QR Target Data...</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{entityId}</p>
                </div>
              </div>
            ) : !resolvedData ? (
              <div className="py-10 text-center space-y-2">
                <p className="text-sm font-semibold text-slate-600 font-mono">Failed to resolve barcode reference code.</p>
                <p className="text-xs text-slate-400">The requested entity ID "{entityId}" of type "{entityType}" does not exist in the active SQLite manifest.</p>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Visual Label Banner */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded tracking-wide uppercase bg-indigo-100 text-indigo-805">
                      {entityType === "part" ? " Plate Part Level" : entityType === "assembly" ? " Member Assembly Level" : " Kit Box Layer"}
                    </span>
                    <h4 className="font-black text-slate-800 text-base mt-1.5 truncate">
                      {entityType === "part" && `PLATE ID: ${resolvedData.part?.Part_ID}`}
                      {entityType === "assembly" && `ASSEMBLY MARK: ${resolvedData.assemblyMark}`}
                      {entityType === "box" && `KIT CONTAINER: ${resolvedData.boxId}`}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{resolvedData.qrcode}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(resolvedData.qrcode)}
                    className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-505 shrink-0 transition"
                    title="Copy resolved QR digital pointer"
                  >
                    {copiedText === resolvedData.qrcode ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Main specification tables */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black tracking-wider uppercase font-mono text-slate-400">Trace specifications</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs font-medium">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-indigo-505" /> Drawing Reference
                      </span>
                      <span className="font-mono font-bold text-slate-800 break-all underline decoration-dotted">
                        {resolvedData.drawingRef}
                      </span>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                      <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" /> Install Position
                      </span>
                      <span className="text-slate-800 font-semibold truncate block">
                        {resolvedData.installPosition}
                      </span>
                    </div>
                  </div>

                  {/* SPECIFIC TO ENTITY: Part details */}
                  {entityType === "part" && resolvedData.part && (
                    <div className="p-4 border border-slate-200 bg-white rounded-xl space-y-3 font-mono text-xs text-slate-600">
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Steel Thickness:</span>
                        <span className="font-bold text-slate-900">{resolvedData.part.Thickness} mm</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Physical Weight:</span>
                        <span className="font-bold text-slate-900">{resolvedData.part.Weight_Kg} kg</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Parent Assembly Mark:</span>
                        <span className="font-bold text-indigo-650">{resolvedData.part.Assembly_Mark}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span>Dispatch Bin Coordinate:</span>
                        <span className="font-bold text-slate-900">{resolvedData.part.RF_BIN} (Proj Stage {resolvedData.part.RF_STAGE})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Site Level Zone:</span>
                        <span className="font-sans font-bold text-slate-800">{resolvedData.part.Level} -- {resolvedData.part.Zone}</span>
                      </div>
                    </div>
                  )}

                  {/* SPECIFIC TO ENTITY: Assembly Member details */}
                  {entityType === "assembly" && (
                    <div className="p-4 border border-slate-200 bg-white rounded-xl space-y-3 text-xs">
                      <div className="flex justify-between font-mono border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Total Structural Plates:</span>
                        <span className="font-bold text-slate-900">{resolvedData.parts?.length} pcs</span>
                      </div>
                      <div className="flex justify-between font-mono border-b border-slate-100 pb-2">
                        <span className="text-slate-500">Combined Steel Mass weight:</span>
                        <span className="font-bold text-slate-900">{resolvedData.totalWeight} kg</span>
                      </div>
                      
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Plate Items List</span>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 bg-slate-50 rounded-lg">
                          {resolvedData.parts?.map((p: Part) => (
                            <span 
                              key={p.Part_ID}
                              onClick={() => onNavigateToTraceability(p.Part_ID, 2)}
                              className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border cursor-pointer hover:border-indigo-400 transition ${
                                p.Status === "Placed"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : p.Status === "Missing"
                                  ? "bg-rose-50 text-rose-800 border-rose-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                              title={`Plate ${p.Part_ID}: Click to load trace`}
                            >
                              {p.Part_ID}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SPECIFIC TO ENTITY: Kit Box details */}
                  {entityType === "box" && (
                    <div className="p-4 border border-slate-200 bg-white rounded-xl space-y-3.5 text-xs text-slate-600">
                      <div className="flex justify-between font-mono border-b border-slate-100 pb-2">
                        <span>Box Status Tag:</span>
                        <span className={`font-bold font-sans px-2 rounded-[4px] py-0.5 text-[10px] uppercase leading-none flex items-center justify-center ${
                          resolvedData.placedCount === resolvedData.totalCount
                            ? "bg-emerald-100 text-emerald-800"
                            : resolvedData.hasExceptions
                            ? "bg-amber-100 text-amber-800 font-extrabold animate-pulse"
                            : "bg-slate-200 text-slate-700"
                        }`}>
                          {resolvedData.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3.5 font-mono">
                        <div className="p-2 border rounded-lg bg-slate-50/50">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">CONTAINER WEIGHT</span>
                          <span className="text-sm font-black text-slate-800 block">{resolvedData.totalWeight} kg</span>
                        </div>
                        <div className="p-2 border rounded-lg bg-slate-50/50">
                          <span className="text-[9px] text-slate-400 font-bold block uppercase">VERIFIED PIECES</span>
                          <span className="text-sm font-black text-slate-800 block">
                            {resolvedData.placedCount} / {resolvedData.totalCount} ({Math.round((resolvedData.placedCount / resolvedData.totalCount) * 100)}%)
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase font-mono block">Package inventory Checklist</span>
                        <div className="border border-slate-100 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-24 overflow-y-auto">
                          {resolvedData.parts?.map((p: Part) => (
                            <div key={p.Part_ID} className="p-2 flex items-center justify-between text-[11px] bg-slate-50/20">
                              <span className="font-mono font-bold text-slate-705">{p.Part_ID}</span>
                              <span className="text-slate-400 font-mono text-[10px]">{p.Thickness}mm • {p.Weight_Kg}kg</span>
                              
                              <div className="flex items-center gap-1.5">
                                {onChangeStatus && (
                                  <button
                                    onClick={() => onChangeStatus(p.Part_ID, p.Status === "Placed" ? "Pending" : "Placed")}
                                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase transition select-none cursor-pointer ${
                                      p.Status === "Placed"
                                        ? "bg-emerald-600 text-white"
                                        : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                                    }`}
                                  >
                                    {p.Status === "Placed" ? "Loaded" : "Load"}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* GPS Map Placement anchor */}
                  <div className="p-3 bg-slate-900 text-slate-300 rounded-xl font-mono text-[10px] space-y-0.5">
                    <div className="text-slate-500">// Site Physical Location anchor</div>
                    <div className="flex justify-between">
                      <span>Coordinates:</span>
                      <span className="text-emerald-400">GPS AXIS: 42.1287° S, 147.9220° E</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Authorized Operator:</span>
                      <span className="text-sky-400 font-bold">ReadyFab-System-Secured-Twin</span>
                    </div>
                  </div>
                </div>

                {/* Redirect Button triggers */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={() => {
                      if (entityType === "part") {
                        onNavigateToTraceability(entityId, 2); // Drill down Node 3 (Traceability Sort)
                      } else if (entityType === "assembly") {
                        const firstPart = resolvedData.parts?.[0]?.Part_ID || entityId;
                        onNavigateToTraceability(firstPart, 4); // Node 5 (CAD Drawing)
                      } else if (entityType === "box") {
                        const firstPart = resolvedData.parts?.[0]?.Part_ID || entityId;
                        onNavigateToTraceability(firstPart, 3); // Node 4 (Kit Packaging)
                      }
                      onClose();
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-sans text-xs font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer select-none"
                  >
                    <GitMerge className="w-4 h-4 text-indigo-200" />
                    Open in Traceability Node Map
                  </button>

                  <button
                    onClick={() => {
                      // Simulates printing the barcode sticker tag
                      alert(`Printing Barcode Tag Sticker:\n\nReference: ${resolvedData.qrcode}\nEntity: ${entityId.toUpperCase()}\nDrawing Reference: ${resolvedData.drawingRef}\n\nTag successfully sent to Print Queue for Laser Etch!`);
                    }}
                    className="bg-slate-900 hover:bg-slate-850 text-white border border-slate-950 font-sans text-xs font-bold py-3 px-4 rounded-xl transition cursor-pointer select-none flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-emerald-400" />
                    Send Label to Tag Etch
                  </button>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
