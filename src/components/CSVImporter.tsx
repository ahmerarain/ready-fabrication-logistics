import React, { useState, useRef } from "react";
import { Upload, Clipboard, CheckCircle, Database, AlertCircle, Trash2, Download, FileCode, Hammer } from "lucide-react";
import { Part } from "../types";

interface CSVImporterProps {
  onImportSuccess: () => void;
  onResetToSeeds: () => void;
  onClearAll: () => void;
}

export default function CSVImporter({ onImportSuccess, onResetToSeeds, onClearAll }: CSVImporterProps) {
  const [csvText, setCsvText] = useState("");
  const [previewParts, setPreviewParts] = useState<Partial<Part>[]>([]);
  const [defaultAssemblyMark, setDefaultAssemblyMark] = useState("Column-A6");
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Standard/legacy parts template
  const sampleTemplate = `Part_ID,Assembly_Mark,Thickness,RF_BIN,RF_STAGE,DXF_Filename,Status
PL-501,Column-A12,12,BIN-03,STAGE-2A,PL-501_12mm.dxf,Pending
PL-502,Column-A12,12,BIN-03,STAGE-2A,PL-502_12mm.dxf,Pending
PL-503,Column-A12,16,BIN-04,STAGE-2A,PL-503_16mm.dxf,Pending
PL-504,Column-A12,16,BIN-04,STAGE-2A,PL-504_16mm.dxf,Pending
PL-601,Rafter-R9,10,BIN-15,STAGE-2B,PL-601_10mm.dxf,Pending
PL-602,Rafter-R9,10,BIN-15,STAGE-2B,PL-602_10mm.dxf,Placed`;

  // DXF parser geometry template output (exactly matching: File, Part ID, Shape, W, H, T, Area, Holes, Slots, Qty, Status)
  const dxfGeometryTemplate = `File,Part ID,Shape,W,H,T,Area,Holes,Slots,Qty,Status
PL-101_gusset.dxf,PL-101,Gusset,240,240,10,48000,4x d18mm,None,1,Placed
PL-102_base.dxf,PL-102,Baseplate,300,450,16,135000,6x d20mm,None,2,Pending
PL-103_splice.dxf,PL-103,Splicer Plate,180,360,12,64800,8x d22mm,2x slots,1,Pending
PL-104_end.dxf,PL-104,End Plate,200,300,10,60000,4x d18mm,2x slots,1,Pending
PL-105_bracket.dxf,PL-105,Triangle Bracket,150,150,8,11250,3x d14mm,None,1,Exception`;

  const handleCopyTemplate = (isMohamed: boolean = false) => {
    const template = isMohamed ? dxfGeometryTemplate : sampleTemplate;
    setCsvText(template);
    parseCSVString(template);
  };

  const handleDownloadSample = (isMohamed: boolean = false) => {
    const template = isMohamed ? dxfGeometryTemplate : sampleTemplate;
    const filename = isMohamed ? "dxf_geometry_output_template.csv" : "rf_member_kit_sample_template.csv";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMsg(`${isMohamed ? "DXF geometry output" : "Standard"} CSV template downloaded successfully!`);
  };

  const parseCSVString = (csv: string) => {
    try {
      setError(null);
      setSuccessMsg(null);
      const lines = csv.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        throw new Error("CSV requires a header line and at least one data row.");
      }

      // Check delimiter (support Tab-separated TSV, Comma, or Semicolon)
      let delimiter = ",";
      if (lines[0].includes("\t")) {
        delimiter = "\t";
      } else if (lines[0].includes(";")) {
        delimiter = ";";
      }

      const rawHeaders = lines[0].split(delimiter);
      // Strip brackets, units, spaces, underscores, and lowercase to index accurately
      const headers = rawHeaders.map(h => 
        h.trim()
         .toLowerCase()
         .replace(/[\s_()\-–²³]/g, "")
         .replace(/mm$/, "")
         .replace(/mm$/, "") // double check stripping
      );

      // Map headers
      const partIdIdx = headers.findIndex(h => h === "partid" || h === "part" || h === "id" || h === "filepart");
      const assyIdx = headers.findIndex(h => h === "assemblymark" || h === "assembly" || h === "parent" || h === "member");
      const thickIdx = headers.findIndex(h => h === "thickness" || h === "thick" || h === "mm" || h === "t");
      const binIdx = headers.findIndex(h => h === "rfbin" || h === "bin");
      const stageIdx = headers.findIndex(h => h === "rfstage" || h === "stage");
      const dxfIdx = headers.findIndex(h => h === "dxffilename" || h === "dxf" || h === "filename" || h === "file");
      const statusIdx = headers.findIndex(h => h === "status" || h === "state");

      // Custom DXF parser headers
      const shapeIdx = headers.findIndex(h => h === "shape");
      const widthIdx = headers.findIndex(h => h === "w" || h === "width");
      const heightIdx = headers.findIndex(h => h === "h" || h === "height");
      const areaIdx = headers.findIndex(h => h === "area");
      const holesIdx = headers.findIndex(h => h === "holes" || h === "hole");
      const slotsIdx = headers.findIndex(h => h === "slots" || h === "slot");
      const qtyIdx = headers.findIndex(h => h === "qty" || h === "quantity" || h === "count");

      if (partIdIdx === -1) {
        throw new Error("Missing required Part ID / File Part identifier column.");
      }

      const parsedParts: Partial<Part>[] = [];

      for (let i = 1; i < lines.length; i++) {
        // Safe regex split to respect quotas if needed, simple split first
        const rCols = lines[i].split(delimiter).map(c => c.trim().replace(/^["']|["']$/g, ""));
        if (rCols.length < 1) continue;

        const partId = rCols[partIdIdx] || "";
        if (!partId) continue;

        // Assembly mark: if missing, fall back to default input field
        const assemblyMark = assyIdx !== -1 && rCols[assyIdx] ? rCols[assyIdx] : defaultAssemblyMark;
        
        // Basic parameters
        const thicknessVal = thickIdx !== -1 ? rCols[thickIdx] : "10";
        const thicknessNumeric = parseFloat(thicknessVal || "10") || 10;
        
        // Bin & Stage defaults based on assembly mark to match system staging logic
        let defaultBin = "BIN-01";
        let defaultStage = "STAGE-1";
        if (assemblyMark.toLowerCase().includes("column")) {
          defaultBin = "BIN-21";
          defaultStage = "STAGE-1B";
        } else if (assemblyMark.toLowerCase().includes("rafter")) {
          defaultBin = "BIN-11";
          defaultStage = "STAGE-3A";
        }
        
        const bin = binIdx !== -1 && rCols[binIdx] ? rCols[binIdx] : defaultBin;
        const stage = stageIdx !== -1 && rCols[stageIdx] ? rCols[stageIdx] : defaultStage;
        
        // DXF Filename
        const dxf = dxfIdx !== -1 && rCols[dxfIdx] ? rCols[dxfIdx] : (rCols[partIdIdx].includes(".") ? rCols[partIdIdx] : `${partId.toLowerCase()}.dxf`);
        
        // Status checks
        const initialStatus = statusIdx !== -1 ? rCols[statusIdx] : "Pending";
        let finalStatus = "Pending";
        if (initialStatus.toLowerCase() === "placed" || initialStatus.toLowerCase() === "boxed") {
          finalStatus = "Placed";
        } else if (initialStatus.toLowerCase() === "missing") {
          finalStatus = "Missing";
        } else if (initialStatus.toLowerCase() === "exception") {
          finalStatus = "Exception";
        }

        // DXF parser specific geometry
        const shape = shapeIdx !== -1 && rCols[shapeIdx] ? rCols[shapeIdx] : "Rect";
        const width = widthIdx !== -1 ? parseFloat(rCols[widthIdx] || "0") : 0;
        const height = heightIdx !== -1 ? parseFloat(rCols[heightIdx] || "0") : 0;
        const area = areaIdx !== -1 ? parseFloat(rCols[areaIdx] || "0") : (width && height ? width * height : 0);
        const holes = holesIdx !== -1 ? rCols[holesIdx] : "None";
        const slots = slotsIdx !== -1 ? rCols[slotsIdx] : "None";
        const qty = qtyIdx !== -1 ? parseInt(rCols[qtyIdx] || "1", 10) : 1;

        // In ReadyFab, parts are tracked individually via status and bins. 
        // If Qty > 1, create individual sub-parts (e.g. -A and -B, or separate instances) to support specific serial barcodes!
        if (qty > 1) {
          for (let q = 1; q <= qty; q++) {
            const suffix = `-${q}`;
            const uniquePartId = `${partId}${suffix}`;
            const uniqueDxf = dxf.replace(/\.dxf$/i, `${suffix}.dxf`);
            
            parsedParts.push({
              Part_ID: uniquePartId,
              Assembly_Mark: assemblyMark,
              Thickness: thicknessNumeric,
              RF_BIN: bin,
              RF_STAGE: stage,
              DXF_Filename: uniqueDxf,
              Status: finalStatus as any,
              Shape: shape,
              Width: width || (150 + (thicknessNumeric % 10) * 15), // reasonable procedural fallback
              Height: height || (200 + (thicknessNumeric % 10) * 25),
              Area: area / qty || ((width || 150) * (height || 200)),
              Holes: holes,
              Slots: slots,
              Rotation: Math.floor(Math.random() * 4) * 45, // 0, 45, 90, 135 deg rotation
              COG: `${Math.round((width || 150) / 2)},${Math.round((height || 200) / 2)}`, // centered COG fallback
              Qty: 1
            });
          }
        } else {
          parsedParts.push({
            Part_ID: partId,
            Assembly_Mark: assemblyMark,
            Thickness: thicknessNumeric,
            RF_BIN: bin,
            RF_STAGE: stage,
            DXF_Filename: dxf,
            Status: finalStatus as any,
            Shape: shape,
            Width: width || (150 + (thicknessNumeric % 10) * 15),
            Height: height || (200 + (thicknessNumeric % 10) * 25),
            Area: area || ((width || 150) * (height || 200)),
            Holes: holes,
            Slots: slots,
            Rotation: Math.floor(Math.random() * 4) * 30, // procedural rotation details 
            COG: `${Math.round((width || 150) / 2)},${Math.round((height || 200) / 2)}`,
            Qty: 1
          });
        }
      }

      if (parsedParts.length === 0) {
        throw new Error("No valid steel plate parts records could be parsed.");
      }

      setPreviewParts(parsedParts);
    } catch (err: any) {
      setError(err.message || "Failed to parse CSV input.");
      setPreviewParts([]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    if (text.trim()) {
      parseCSVString(text);
    } else {
      setPreviewParts([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCSVString(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".tsv") || file.name.endsWith(".txt"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setCsvText(text);
        parseCSVString(text);
      };
      reader.readAsText(file);
    } else {
      setError("Please drop a valid .csv or tab-delimited geometry file.");
    }
  };

  const executeImport = async (clearExisting: boolean) => {
    if (previewParts.length === 0) return;

    try {
      setError(null);
      setSuccessMsg(null);
      const response = await fetch("/api/parts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts: previewParts, clearExisting })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to store records on server.");
      }

      setSuccessMsg(`Import successful! ${data.summary?.inserted || 0} inserted, ${data.summary?.updated || 0} updated. Real DXF shape profiles linked to Digital Twins.`);
      setPreviewParts([]);
      setCsvText("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      onImportSuccess();
    } catch (err: any) {
      setError(err.message || "Network error occurred while posting data.");
    }
  };

  return (
    <div className="space-y-6">
      {/* File utility top actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-indigo-600" />
            Geometry CSV Parser & DXF Importer
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Import custom DXF geometry outputs (CSV or tab-separated vectors) directly into ReadyFab's workshop tracking loop.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <button 
            type="button" 
            onClick={() => handleDownloadSample(true)}
            className="px-3 py-2 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md font-medium cursor-pointer transition flex items-center gap-1.5 border border-indigo-100 animate-pulse hover:animate-none"
          >
            <Download className="w-3.5 h-3.5" /> Download DXF Geometry Output Template
          </button>
          <button 
            type="button" 
            onClick={onResetToSeeds}
            className="px-3 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium cursor-pointer transition"
          >
            Reset to Sample Parts
          </button>
          <button 
            type="button" 
            onClick={onClearAll}
            className="px-3 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium cursor-pointer transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Drag & Drop Input Form */}
        <div className="space-y-4">
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="h-44 border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition group"
          >
            <Upload className="w-10 h-10 text-slate-400 group-hover:text-indigo-600 mb-2 transition-colors" />
            <p className="font-semibold text-slate-800 text-sm">Drag and drop CSV / DXF Geometry Output file here</p>
            <p className="text-xs text-slate-400 mt-1">or click to browse local files (.csv, .tsv, .txt)</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv,.tsv,.txt" 
              className="hidden" 
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 block mb-2">Parser Configuration Fallbacks</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-slate-450 block">Missing Assembly Mark Fallback</label>
                <input 
                  type="text" 
                  value={defaultAssemblyMark}
                  onChange={(e) => {
                    setDefaultAssemblyMark(e.target.value);
                    if (csvText.trim()) parseCSVString(csvText);
                  }}
                  placeholder="e.g. Column-A6"
                  className="w-full text-xs border border-slate-205 rounded bg-white p-1.5 focus:outline-hidden focus:border-indigo-550"
                  title="If the DXF spreadsheet does not explicitly outline parent assembly tags, ReadyFab auto-allocates to this member."
                />
              </div>
              <div className="flex items-end justify-start gap-1 py-1">
                <button
                  type="button"
                  onClick={() => handleCopyTemplate(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md transition shadow-xs"
                >
                  <Clipboard className="w-3.5 h-3.5" /> Use DXF Geometry Data Demo
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paste raw vector outputs (Delimited CSV/TSV)</span>
          </div>

          <textarea
            value={csvText}
            onChange={handleTextChange}
            placeholder={`File,Part ID,Shape,W,H,T,Area,Holes,Slots,Qty,Status\nPL-101_gusset.dxf,PL-101,Gusset,240,240,10,48005,4x d18mm,None,1,Placed`}
            className="w-full h-44 p-4 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-550 focus:ring-1 focus:ring-indigo-500 transition shadow-inner"
          />
        </div>

        {/* Right Side: Smart Preview Grid */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col min-h-full shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-500" />
              Incoming Geometry Previews ({previewParts.length} profiles parsed)
            </h3>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg flex items-start gap-2 text-xs">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {previewParts.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="overflow-x-auto max-h-56 border border-slate-100 rounded-lg">
                <table className="w-full text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="px-3 py-2">Part ID</th>
                      <th className="px-3 py-2">Assembly</th>
                      <th className="px-3 py-2">Shape</th>
                      <th className="px-3 py-2">Dimensions (mm)</th>
                      <th className="px-3 py-2">Features</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewParts.slice(0, 8).map((part, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-mono font-medium text-slate-900 flex items-center gap-1">
                          <FileCode className="w-3.5 h-3.5 text-indigo-505" />
                          {part.Part_ID}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-700">{part.Assembly_Mark}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-150 rounded text-[10px] font-medium font-sans">
                            {part.Shape || "Rect"}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-indigo-700">
                          {part.Width} x {part.Height} <span className="text-[9.5px] text-slate-400">({part.Thickness}mm)</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400 text-[10.5px]">
                          {part.Holes !== "None" ? `Holes: ${part.Holes}` : ""}
                          {part.Slots !== "None" ? ` • Slots: ${part.Slots}` : ""}
                          {part.Holes === "None" && part.Slots === "None" ? "-" : ""}
                        </td>
                      </tr>
                    ))}
                    {previewParts.length > 8 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-1.5 bg-slate-50 text-center text-slate-400 font-mono text-[10px]">
                          ... and {previewParts.length - 8} more dynamic plate geometries.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 p-4 bg-indigo-50/40 rounded-lg border border-indigo-150 text-xs">
                <p className="text-slate-650 leading-relaxed font-sans mb-3 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  Ready to link <strong>{previewParts.length} geometry templates</strong> back to physical parts tracking tags?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => executeImport(false)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium text-xs cursor-pointer transition shadow-xs"
                  >
                    Append & Upsert Data
                  </button>
                  <button
                    onClick={() => executeImport(true)}
                    className="flex-1 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-md font-medium text-xs cursor-pointer transition shadow-xs"
                  >
                    Clear & Overwrite Database
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400">
              <Clipboard className="w-8 h-8 opacity-40 mb-2" />
              <p className="text-xs">No geometry spreadsheet loaded yet.</p>
              <p className="text-[11px] text-slate-400 mt-1">Specify columns manually or click "Use DXF Geometry Data Demo" to test.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
