import React, { useState } from "react";
import { Scissors, CheckSquare, Square, Flame, FileCode, QrCode } from "lucide-react";
import { Part, PartStatus } from "../types";

interface CuttingGroupsProps {
  parts: Part[];
  onChangeStatus: (partId: string, nextStatus: PartStatus) => void;
  onOpenQRResolver?: (type: "part" | "assembly" | "box", id: string) => void;
}

export default function CuttingGroups({ parts, onChangeStatus, onOpenQRResolver }: CuttingGroupsProps) {
  // Extract all parts classified as "Plates" (starting with "PL")
  const plateParts = parts.filter(p => p.Part_ID.toUpperCase().startsWith("PL"));
  
  // Group plates by Thickness
  const groupedData: { [thickness: number]: Part[] } = {};
  plateParts.forEach(part => {
    const t = part.Thickness;
    if (!groupedData[t]) {
      groupedData[t] = [];
    }
    groupedData[t].push(part);
  });

  // Convert to sorted thickness array
  const sortedThicknesses = Object.keys(groupedData)
    .map(key => parseFloat(key))
    .sort((a, b) => a - b);

  // Set initial selected thickness
  const [selectedThickness, setSelectedThickness] = useState<number | null>(
    sortedThicknesses.length > 0 ? sortedThicknesses[0] : null
  );

  // If previous selection is no longer valid, automatically point to first available
  const activeThickness = (selectedThickness && sortedThicknesses.includes(selectedThickness))
    ? selectedThickness 
    : (sortedThicknesses.length > 0 ? sortedThicknesses[0] : null);

  const activeParts = activeThickness ? groupedData[activeThickness] : [];
  const completedCount = activeParts.filter(p => p.Status === "Placed").length;
  const isAllGroupsDone = plateParts.length > 0 && plateParts.every(p => p.Status === "Placed");

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Nesting & Plate Cutting Groups</h2>
            <p className="text-sm text-slate-500 mt-1">
              Grouped dynamically by raw plate steel thickness (mm) for single-run plasma/laser cutting efficiency.
            </p>
          </div>
        </div>
      </div>

      {sortedThicknesses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Thickness Sidebar Tabs */}
          <div className="md:col-span-1 space-y-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pl-2 mb-3">Thickness Selection</h3>
            <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible gap-2 pb-2 md:pb-0">
              {sortedThicknesses.map((thickness) => {
                const groupParts = groupedData[thickness];
                const placedPartsCount = groupParts.filter(p => p.Status === "Placed").length;
                const totalPartsCount = groupParts.length;
                const percentDone = Math.round((placedPartsCount / totalPartsCount) * 100);
                const isSelected = activeThickness === thickness;

                return (
                  <button
                    key={thickness}
                    type="button"
                    onClick={() => setSelectedThickness(thickness)}
                    className={`flex-1 md:flex-initial text-left p-3.5 rounded-xl border text-sm transition font-sans cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-slate-950 text-white border-slate-950 shadow-sm"
                        : "bg-white text-slate-705 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-base">{thickness}mm</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm ${isSelected ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
                        PLATE
                      </span>
                    </div>
                    {/* Progress details */}
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[11px] opacity-80 font-medium">
                        <span>Cut/Placed</span>
                        <span className="font-mono">{placedPartsCount}/{totalPartsCount}</span>
                      </div>
                      <div className="w-full bg-slate-205 rounded-full h-1.5 mt-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${isSelected ? "bg-emerald-450" : "bg-indigo-600"}`} 
                          style={{ width: `${percentDone}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Focused Thickness Plate Parts Table */}
          <div className="md:col-span-3">
            {activeThickness && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col h-full">
                {/* Active Group Header */}
                <div className="p-5 border-b border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Currently active cut bed</span>
                    <h3 className="text-xl font-bold text-slate-800 font-sans mt-0.5">{activeThickness}mm Raw Steel Plate Series</h3>
                  </div>
                  <div className="bg-white border border-slate-205 px-4 py-2 rounded-lg text-xs flex items-center gap-3">
                    <span className="text-slate-500">Group Progress:</span>
                    <span className="font-mono font-bold text-slate-900">{completedCount} / {activeParts.length} Parts Cut</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${completedCount === activeParts.length ? "bg-emerald-100 text-emerald-800" : "bg-indigo-50 text-indigo-805 border border-indigo-100"}`}>
                      {completedCount === activeParts.length ? "READY" : "IN-PROGRESS"}
                    </span>
                  </div>
                </div>

                {/* Grid Table */}
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-xs text-left text-slate-500">
                    <thead className="bg-slate-100/50 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="px-5 py-3 w-12 text-center">Status</th>
                        <th className="px-5 py-3">Part ID</th>
                        <th className="px-5 py-3">Target Assembly Mark</th>
                        <th className="px-5 py-3">Cutting Status State</th>
                        <th className="px-5 py-3">Location BIN / STAGE</th>
                        <th className="px-5 py-3">DXF Nest Drawing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeParts.map((part) => {
                        const isPlaced = part.Status === "Placed";
                        const isMissing = part.Status === "Missing";
                        const isException = part.Status === "Exception";

                        return (
                          <tr 
                            key={part.Part_ID} 
                            className={`hover:bg-slate-50 transition-colors ${
                              isPlaced
                                ? "bg-emerald-50/10"
                                : isMissing
                                ? "bg-rose-50/10"
                                : isException
                                ? "bg-amber-50/15"
                                : ""
                            }`}
                          >
                            <td className="px-5 py-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => onChangeStatus(part.Part_ID, isPlaced ? "Pending" : "Placed")}
                                className={`p-1.5 rounded-md transition cursor-pointer ${
                                  isPlaced 
                                    ? "text-emerald-600 bg-emerald-50" 
                                    : isMissing
                                    ? "text-rose-500 bg-rose-50"
                                    : isException
                                    ? "text-amber-500 bg-amber-50"
                                    : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                                }`}
                                title={isPlaced ? "Mark Pending" : "Mark Placed"}
                              >
                                {isPlaced ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                              <div className="flex items-center justify-between gap-1.5">
                                <span>{part.Part_ID}</span>
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
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-700 font-semibold font-mono text-[10px]">
                                  {part.Assembly_Mark}
                                </span>
                                {onOpenQRResolver && (
                                  <button
                                    onClick={() => onOpenQRResolver("assembly", part.Assembly_Mark)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-650 transition cursor-pointer"
                                    title="Scan/Resolve Assembly Member QR Code"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>

                            {/* Status State selector badge */}
                            <td className="px-5 py-3.5">
                              <select
                                value={part.Status}
                                onChange={(e) => onChangeStatus(part.Part_ID, e.target.value as PartStatus)}
                                className={`text-[11px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer focus:outline-none ${
                                  isPlaced
                                    ? "bg-emerald-50 text-emerald-855 border-emerald-200"
                                    : isMissing
                                    ? "bg-rose-50 text-rose-800 border-rose-225 font-extrabold"
                                    : isException
                                    ? "bg-amber-50 text-amber-800 border-amber-220"
                                    : "bg-slate-50 text-slate-600 border-slate-205"
                                }`}
                              >
                                <option value="Pending">🕒 Pending Cut</option>
                                <option value="Placed">✔ Cut (Confirm)</option>
                                <option value="Missing">❌ Missing Tag</option>
                                <option value="Exception">⚠ Exception Nest</option>
                              </select>
                            </td>

                            <td className="px-5 py-3.5 font-mono text-slate-500">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex flex-col text-xs">
                                  <div>BIN: {part.RF_BIN || "-"}</div>
                                  <div className="text-[10px] text-slate-400">{part.RF_STAGE || "-"}</div>
                                </div>
                                {onOpenQRResolver && part.RF_BIN && (
                                  <button
                                    onClick={() => onOpenQRResolver("box", part.Assembly_Mark)}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-605 transition cursor-pointer"
                                    title="Scan/Resolve Kit Box Container QR Code"
                                  >
                                    <QrCode className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                            
                            <td className="px-5 py-3.5 font-mono text-xs text-slate-500 flex items-center gap-1">
                              <FileCode className="w-3.5 h-3.5 text-indigo-650" />
                              {part.DXF_Filename}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-indigo-50/70 border-t border-indigo-100/50 flex items-start gap-3 text-xs text-indigo-900">
                  <Scissors className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <span className="font-semibold">Workshop tip for cutting:</span> Ticking off parts in this view updates their storage state to <strong>Placed</strong> directly inside SQLite. These parts will immediately show up as packed/boxed in the Member assemblies kit list!
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <Flame className="w-12 h-12 text-slate-350 mx-auto opacity-30 mb-2" />
          <h3 className="text-slate-700 font-semibold text-sm">No Steel Plate Parts available</h3>
          <p className="text-slate-500 text-xs mt-1">Upload a parts schedule CSV file or seed sample items to enable thickness-based cutting workflows.</p>
        </div>
      )}
    </div>
  );
}
