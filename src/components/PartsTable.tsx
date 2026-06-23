import React, { useState } from "react";
import { Search, Filter, Layers, SlidersHorizontal, CheckSquare, Square, FileCode, Archive, QrCode } from "lucide-react";
import { Part, PartStatus } from "../types";

interface PartsTableProps {
  parts: Part[];
  onChangeStatus: (partId: string, nextStatus: PartStatus) => void;
  onOpenQRResolver?: (type: "part" | "assembly" | "box", id: string) => void;
}

export default function PartsTable({ parts, onChangeStatus, onOpenQRResolver }: PartsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "plates" | "assemblies">("all");
  const [thicknessFilter, setThicknessFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Get list of unique plate thicknesses for dropdown filtration
  const uniqueThicknesses = Array.from(new Set(parts.map(p => p.Thickness))).sort((a, b) => a - b);

  // Filters the steel parts list
  const filteredParts = parts.filter(p => {
    // 1. Text Search matching
    const matchesSearch = 
      p.Part_ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Assembly_Mark.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.RF_BIN && p.RF_BIN.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.RF_STAGE && p.RF_STAGE.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.DXF_Filename && p.DXF_Filename.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Type Filter (Plates vs Columns/Profiles)
    // Plate rule: Part_ID starts with "PL"
    const isPlate = p.Part_ID.toUpperCase().startsWith("PL");
    const matchesType = 
      filterType === "all" ? true :
      filterType === "plates" ? isPlate :
      !isPlate; // Assemblies/Profiles

    // 3. Thickness Filter
    const matchesThickness = 
      thicknessFilter === "all" ? true : 
      p.Thickness.toString() === thicknessFilter;

    // 4. Status Filter
    const matchesStatus = 
      statusFilter === "all" ? true : 
      p.Status === statusFilter;

    return matchesSearch && matchesType && matchesThickness && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search & Dynamic Filters Toolbars */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Text Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Part ID, Assembly, Bin, Stage, or DXF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition shadow-inner font-sans"
            />
          </div>

          {/* Quick Filter: Plates vs Columns */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 self-start md:self-auto shadow-inner">
            <button
              onClick={() => setFilterType("all")}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition ${filterType === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              All Items ({parts.length})
            </button>
            <button
              onClick={() => setFilterType("plates")}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition ${filterType === "plates" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Plates Only (PL-*)
            </button>
            <button
              onClick={() => setFilterType("assemblies")}
              className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition  ${filterType === "assemblies" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
            >
              Profiles / Others
            </button>
          </div>
        </div>

        {/* Detailed Dropdowns filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine filters:</span>
          </div>

          {/* Thickness Selection dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Thickness:</span>
            <select
              value={thicknessFilter}
              onChange={(e) => setThicknessFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="all">All thicknesses</option>
              {uniqueThicknesses.map(t => (
                <option key={t} value={t.toString()}>{t} mm</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-slate-200 bg-white rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Any Status</option>
              <option value="Pending">🕒 Pending (Not Packed)</option>
              <option value="Placed">✔ Placed (In Box)</option>
              <option value="Missing">❌ Missing</option>
              <option value="Exception">⚠ Exception</option>
            </select>
          </div>

          {filteredParts.length !== parts.length && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterType("all");
                setThicknessFilter("all");
                setStatusFilter("all");
              }}
              className="text-indigo-600 hover:text-indigo-700 font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Parts List Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-xs text-slate-500">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-755 font-semibold">
              <tr>
                <th className="px-5 py-3 w-12 text-center">Status</th>
                <th className="px-5 py-3">Part ID</th>
                <th className="px-5 py-3">Assembly Mark</th>
                <th className="px-5 py-3 text-right">Thickness</th>
                <th className="px-5 py-3">Digital Twin Geometry & CAD Profiles</th>
                <th className="px-5 py-3">State Choice</th>
                <th className="px-5 py-3">RF BIN / STAGE</th>
                <th className="px-5 py-3">DXF Draw Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredParts.length > 0 ? (
                filteredParts.map((part) => {
                  const isPlaced = part.Status === "Placed";
                  const isMissing = part.Status === "Missing";
                  const isException = part.Status === "Exception";

                  return (
                    <tr 
                      key={part.Part_ID} 
                      className={`hover:bg-slate-55 transition-colors ${
                        isPlaced
                          ? "bg-emerald-50/20"
                          : isMissing
                          ? "bg-rose-50/15"
                          : isException
                          ? "bg-amber-50/15"
                          : ""
                      }`}
                    >
                      <td className="px-5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => onChangeStatus(part.Part_ID, isPlaced ? "Pending" : "Placed")}
                          className={`p-1.5 rounded-md cursor-pointer transition ${
                            isPlaced 
                              ? "text-emerald-600 bg-emerald-50" 
                              : isMissing
                              ? "text-rose-500 bg-rose-50"
                              : isException
                              ? "text-amber-500 bg-amber-50"
                              : "text-slate-300 hover:text-slate-500 hover:bg-slate-50"
                          }`}
                          title={isPlaced ? "Mark Pending" : "Mark Placed in Box"}
                        >
                          {isPlaced ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-3 font-mono font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5 justify-between">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${part.Part_ID.toUpperCase().startsWith("PL") ? "bg-amber-505" : "bg-indigo-505"}`} title={part.Part_ID.toUpperCase().startsWith("PL") ? "Plate Part" : "Profile Member"} />
                            <span className="truncate">{part.Part_ID}</span>
                          </span>
                          {onOpenQRResolver && (
                            <button
                              onClick={() => onOpenQRResolver("part", part.Part_ID)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                              title="Scan/Resolve Part QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 animate-none">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-slate-755 font-semibold font-mono text-[10px] truncate">
                            {part.Assembly_Mark}
                          </span>
                          {onOpenQRResolver && (
                            <button
                              onClick={() => onOpenQRResolver("assembly", part.Assembly_Mark)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 transition cursor-pointer"
                              title="Scan/Resolve Assembly Member QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-medium text-slate-800">
                        {part.Thickness} mm
                      </td>

                      {/* Live Digital Twin Geometry Profile from CAD DXF parser */}
                      <td className="px-5 py-3">
                        {part.Shape ? (
                          <div className="flex flex-col text-[11px] leading-tight text-slate-500">
                            <span className="font-semibold text-slate-800 hover:text-indigo-600 transition-colors flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-sm bg-indigo-500" />
                              {part.Shape}
                            </span>
                            <span className="font-mono text-indigo-700 mt-0.5">
                              {part.Width} × {part.Height} mm <span className="text-[9.5px] text-slate-400">({part.Area} mm²)</span>
                            </span>
                            {(part.Holes !== "None" || part.Slots !== "None") && (
                              <span className="text-[10px] text-slate-450 mt-0.5">
                                {part.Holes !== "None" ? `Holes: ${part.Holes}` : ""}
                                {part.Holes !== "None" && part.Slots !== "None" ? " • " : ""}
                                {part.Slots !== "None" ? `Slots: ${part.Slots}` : ""}
                              </span>
                            )}
                            {(part.Rotation !== undefined || part.COG) && (
                              <span className="text-[9.5px] font-mono text-slate-400 mt-0.5 italic">
                                Rotation: {part.Rotation ?? 0}° {part.COG ? ` | COG: [${part.COG}]` : ""}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-455 italic font-mono text-[10px]">- procedured fallback -</span>
                        )}
                      </td>

                      {/* Status select field dropdown */}
                      <td className="px-5 py-3">
                        <select
                          value={part.Status}
                          onChange={(e) => onChangeStatus(part.Part_ID, e.target.value as PartStatus)}
                          className={`text-[11px] font-bold px-2 py-1 rounded border transition-colors cursor-pointer focus:outline-none ${
                            isPlaced
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : isMissing
                              ? "bg-rose-50 text-rose-800 border-rose-220 font-extrabold"
                              : isException
                              ? "bg-amber-50 text-amber-800 border-amber-220"
                              : "bg-slate-50 text-slate-600 border-slate-205"
                          }`}
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Placed">✔ Placed</option>
                          <option value="Missing">❌ Missing</option>
                          <option value="Exception">⚠ Exception</option>
                        </select>
                      </td>

                      <td className="px-5 py-3 font-mono text-slate-500">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex flex-col min-w-0">
                            <div className="font-semibold text-slate-705 truncate">BIN: {part.RF_BIN || "-"}</div>
                            <div className="text-[10px] text-slate-450 truncate">{part.RF_STAGE || "-"}</div>
                          </div>
                          {onOpenQRResolver && part.RF_BIN && (
                            <button
                              onClick={() => onOpenQRResolver("box", part.Assembly_Mark)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600 transition cursor-pointer"
                              title="Scan/Resolve Kit Box Container QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-5 py-3 font-mono text-xs flex items-center gap-1 text-slate-500">
                        <FileCode className="w-3.5 h-3.5 text-indigo-505" />
                        {part.DXF_Filename || `${part.Part_ID.toLowerCase()}.dxf`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-slate-400">
                    <Archive className="w-10 h-10 opacity-30 mx-auto mb-2" />
                    <p className="font-medium text-slate-500 text-sm">No steel parts found matching search filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Adjust your parameters or reset to show all items.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-slate-50 px-5 py-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Showing {filteredParts.length} of {parts.length} steel parts</span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/> Plates (PL-*)</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500"/> Profiles / Members</span>
          </div>
        </div>
      </div>
    </div>
  );
}
