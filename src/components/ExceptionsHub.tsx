import React, { useState } from "react";
import { ShieldAlert, HelpCircle, FileText, CheckCircle2, RotateCcw, AlertTriangle, MessageSquare, PlayCircle, Save, QrCode } from "lucide-react";
import { Part, PartStatus } from "../types";

interface ExceptionsHubProps {
  parts: Part[];
  onUpdateException: (partId: string, exceptionType: string, operatorNote: string, nextStatus: PartStatus) => Promise<void>;
  onOpenQRResolver?: (type: "part" | "assembly" | "box", id: string) => void;
}

export default function ExceptionsHub({ parts, onUpdateException, onOpenQRResolver }: ExceptionsHubProps) {
  const [filterType, setFilterType] = useState<"all" | "missing" | "exception" | "resolved">("all");
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [formExceptionType, setFormExceptionType] = useState<string>("");
  const [formOperatorNote, setFormOperatorNote] = useState<string>("");
  const [formStatus, setFormStatus] = useState<PartStatus>("Exception");
  const [isSaving, setIsSaving] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  // Filter parts
  const exceptionParts = parts.filter(p => {
    if (filterType === "missing") return p.Status === "Missing";
    if (filterType === "exception") return p.Status === "Exception";
    if (filterType === "resolved") return p.Status === "Placed";
    // "all" returns parts with an active exception status or existing notes/exception values
    return p.Status === "Exception" || p.Status === "Missing" || p.Exception_Type || p.Operator_Note;
  });

  const handleEditClick = (part: Part) => {
    setEditingPart(part);
    setFormExceptionType(part.Exception_Type || "damaged plate");
    setFormOperatorNote(part.Operator_Note || "");
    setFormStatus(part.Status);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;

    try {
      setIsSaving(true);
      await onUpdateException(editingPart.Part_ID, formExceptionType, formOperatorNote, formStatus);
      setLocalMessage(`Successfully logged exception parameters for Part ${editingPart.Part_ID}`);
      setEditingPart(null);
      setTimeout(() => setLocalMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save exception details to backend SQLite.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearException = async (part: Part) => {
    if (confirm(`Clear all exceptions for plate ${part.Part_ID} and set status back to 'Pending'?`)) {
      try {
        setIsSaving(true);
        await onUpdateException(part.Part_ID, "", "", "Pending");
        setLocalMessage(`Exceptions reset to standard workflow for Part ${part.Part_ID}`);
        setTimeout(() => setLocalMessage(null), 3000);
      } catch (err) {
        console.error(err);
        alert("Failed to reset part to standard workflow state.");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const exceptionOptions = [
    { value: "missing tag", label: "Missing Tag (Plate unread by conveyor laser sensor)" },
    { value: "damaged plate", label: "Damaged Plate (Scratched, heat buckled, or warped)" },
    { value: "wrong kit box", label: "Wrong Kit Box (Target container discrepancy override)" },
    { value: "duplicate part", label: "Duplicate Part (Double barcode scanning locked)" },
    { value: "geometry mismatch", label: "Geometry Mismatch (CAD drawing bounds threshold alert)" },
    { value: "manual override", label: "Manual Override (Operator verified placement)" }
  ];

  return (
    <div className="space-y-6">
      {/* LOCAL ALERTS ROW */}
      {localMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2.5 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{localMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VIEW / EDIT ACTION PANEL */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Exception Editor</h3>
          
          {editingPart ? (
            <form onSubmit={handleSave} className="bg-white border-2 border-slate-900 rounded-xl p-5 shadow-xs space-y-4 font-sans animate-in zoom-in-95 duration-200">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono block">EDITING PLATE REFERENCE</span>
                  <p className="text-sm font-black text-slate-800 font-mono">{editingPart.Part_ID}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingPart(null)}
                  className="text-xs text-slate-500 hover:text-slate-900 font-bold"
                >
                  Cancel
                </button>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Current Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["Pending", "Placed", "Exception", "Missing"] as PartStatus[]).filter(x => x !== "Pending").map((statusOpt) => (
                    <button
                      key={statusOpt}
                      type="button"
                      onClick={() => setFormStatus(statusOpt)}
                      className={`py-1.5 text-[10px] font-black uppercase rounded border select-none ${
                        formStatus === statusOpt
                          ? statusOpt === "Placed"
                            ? "bg-emerald-600 border-emerald-700 text-white"
                            : statusOpt === "Missing"
                            ? "bg-rose-600 border-rose-700 text-white"
                            : "bg-amber-500 border-amber-600 text-white"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {statusOpt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exception Reasons Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Exception Category / Type</label>
                <select
                  value={formExceptionType}
                  onChange={(e) => setFormExceptionType(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg focus:outline-hidden focus:bg-white text-slate-800 font-semibold"
                >
                  <option value="">-- Select No Category --</option>
                  {exceptionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Operator Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase">Operator / Inspector Notes</label>
                <textarea
                  value={formOperatorNote}
                  onChange={(e) => setFormOperatorNote(e.target.value)}
                  rows={4}
                  placeholder="Enter custom bevel mismatch bounds, heat deformation comments, barcode tracking warnings, etc..."
                  className="w-full text-xs font-mono p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white text-slate-800"
                />
              </div>

              {/* Submit Buttons */}
              <button
                type="submit"
                disabled={isSaving}
                className="w-full bg-slate-900 hover:bg-slate-850 text-white font-semibold text-xs py-3 rounded-lg transition overflow-hidden flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving changes..." : "Commit Exception Record"}
              </button>
            </form>
          ) : (
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-5 text-center min-h-60 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <AlertTriangle className="w-8 h-8 text-slate-300 animate-pulse" />
              <p className="text-xs font-semibold text-slate-500 font-sans">No plate selected for override</p>
              <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed">
                Click the edit button (✏️) on any active item in the table to load its properties, assign errors, or add custom maintenance comments.
              </p>
            </div>
          )}
        </div>

        {/* LOGS TABLE AND FILTERS */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Workshop Exception Log</h3>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[10px] font-black uppercase">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1 rounded-md transition select-none ${
                  filterType === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                All Flags
              </button>
              <button
                onClick={() => setFilterType("missing")}
                className={`px-3 py-1 rounded-md transition select-none ${
                  filterType === "missing" ? "bg-rose-600 text-white shadow-xs" : "text-rose-600 hover:bg-rose-50"
                }`}
              >
                Missing Only
              </button>
              <button
                onClick={() => setFilterType("exception")}
                className={`px-3 py-1 rounded-md transition select-none ${
                  filterType === "exception" ? "bg-amber-500 text-white shadow-xs" : "text-amber-600 hover:bg-amber-50"
                }`}
              >
                Failed Nest
              </button>
              <button
                onClick={() => setFilterType("resolved")}
                className={`px-3 py-1 rounded-md transition select-none ${
                  filterType === "resolved" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Override Resolved
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex-1">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-500">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">
                  <tr>
                    <th className="px-4 py-3">Plate Reference</th>
                    <th className="px-4 py-3">Assembly Mark</th>
                    <th className="px-4 py-3">Type Assigned</th>
                    <th className="px-4 py-3">QC Comments / Notes</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right w-28">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {exceptionParts.length > 0 ? (
                    exceptionParts.map((p) => (
                      <tr 
                        key={p.Part_ID} 
                        className={`hover:bg-slate-50/50 transition cursor-pointer ${
                          editingPart?.Part_ID === p.Part_ID ? "bg-indigo-50/20" : ""
                        }`}
                        onClick={() => handleEditClick(p)}
                      >
                        <td className="px-4 py-3 text-slate-900 font-bold flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-505" />
                          {p.Part_ID}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700">{p.Assembly_Mark}</td>
                        <td className="px-4 py-3">
                          {p.Exception_Type ? (
                            <span className="px-2 py-0.5 rounded-sm bg-slate-900 text-[10px] font-bold text-white uppercase block w-fit">
                              {p.Exception_Type}
                            </span>
                          ) : (
                            <span className="text-slate-400">Gen Override</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 max-w-xs font-sans text-[11px] leading-relaxed truncate" title={p.Operator_Note}>
                          {p.Operator_Note ? (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {p.Operator_Note}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic">No technician note recorded</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold uppercase leading-none ${
                            p.Status === "Placed"
                              ? "bg-emerald-100 text-emerald-800"
                              : p.Status === "Missing"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {p.Status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenQRResolver && (
                              <button
                                onClick={() => onOpenQRResolver("part", p.Part_ID)}
                                className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-600 transition"
                                title="Resolve QR Digit"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEditClick(p)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded text-[10px] font-bold uppercase transition"
                              title="Edit override configurations"
                            >
                              Edit
                            </button>
                            {(p.Status === "Exception" || p.Status === "Missing" || p.Exception_Type || p.Operator_Note) && (
                              <button
                                onClick={() => handleClearException(p)}
                                className="p-1 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 rounded transition"
                                title="Clear exception configuration tags"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-slate-450 font-sans">
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                          <p className="text-xs font-semibold text-slate-600">No discrepancies active!</p>
                          <p className="text-[10px] text-slate-400 max-w-sm font-sans">
                            All loaded workshop plates are running smoothly through the logistics lines under target constraints. Nice work!
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
