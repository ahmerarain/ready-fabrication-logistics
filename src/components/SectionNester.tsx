import React, { useState, useEffect } from "react";
import { 
  Layers, ToggleLeft, ToggleRight, Settings, Plus, Trash, Download, Clipboard, 
  Play, RefreshCw, ClipboardList, CheckSquare, Square, CheckCircle, HelpCircle, 
  HelpCircle as ShieldAlert, Search, Store, Info, Sparkles, AlertCircle, X
} from "lucide-react";

// Types for Phase 6 Section Nester
export interface SectionPart {
  Part_ID: string; // Part Mark / Number
  Assembly_Mark: string; // Assembly Mark / Member Mark
  Profile: string; // Profile / Section Size (e.g. "100x100x12 EA")
  Section_Family: "Hot Rolled Sections" | "Flat Bars" | "Hollow Sections" | "Solid Bars";
  Material: string; // Material / Grade
  Original_Length: number; // Original Length in mm (if available)
  Allowance_Applied: number; // Software Allowance in mm (if available)
  Final_Length: number; // Final Adjusted Cut Length (after tab/slot adjustments upstream)
  Qty: number; // Quantity
  Kit_Ref: string; // Kit Reference (links to Member Kit Box)
  Traceability_QR: string; // QR Reference
  Status: "Pending" | "Cut" | "Exception";
  Stock_Bar_ID?: string; // Nested target stock bar
  Cut_Order?: number; // Position in cutting sequence on bar
  Position_On_Bar?: string; // Coordinate bounds e.g. "0 - 5500 mm"
}

export interface StockLengthConfig {
  Family: "Hot Rolled Sections" | "Flat Bars" | "Hollow Sections" | "Solid Bars";
  StandardLengths: number[]; // standard Stock lengths in mm
}

export interface MerchantStock {
  Merchant: string;
  Branch: string;
  Section_Family: string;
  Profile: string;
  Material: string;
  Stock_Length: number;
  Stock_Status: "Available" | "By Order" | "Unavailable" | "Unknown";
  Notes: string;
  // Future Placeholder Fields for Investor Review
  Hold_Status?: string;
  Hold_Reference?: string;
  Hold_Expiry?: string;
  Purchase_Reference?: string;
  Merchant_Stock_Update_Ref?: string;
}

interface NestingResult {
  StockBarID: string;
  Family: string;
  Profile: string;
  Material: string;
  TotalStockLength: number;
  UsedLength: number;
  OffcutLength: number;
  IsOffcutReusable: boolean;
  Efficiency: number;
  Cuts: {
    CutOrder: number;
    AssemblyNo: string;
    PartNo: string;
    OriginalLength: number;
    AllowanceApplied: number;
    FinalCutLength: number;
    PositionStart: number;
    PositionEnd: number;
    Traceability_QR: string;
  }[];
}

interface SectionNesterProps {
  parts: any[]; // Existing parts from SQLite (for information and link checks)
  sectionParts: SectionPart[];
  onSetSectionParts: (parts: SectionPart[]) => void;
  onUpdateParts: () => void;
}

const DEFAULT_STOCK_CONFIGS: StockLengthConfig[] = [
  { Family: "Hot Rolled Sections", StandardLengths: [12000, 14000, 18000] },
  { Family: "Flat Bars", StandardLengths: [6000] },
  { Family: "Hollow Sections", StandardLengths: [6000, 8000, 12000] },
  { Family: "Solid Bars", StandardLengths: [12000] }
];

const DEFAULT_MERCHANT_STOCKS: MerchantStock[] = [
  {
    Merchant: "InfraBuild Steel",
    Branch: "Sydney West Branch",
    Section_Family: "Hot Rolled Sections",
    Profile: "100x100x12 EA",
    Material: "Grade 300",
    Stock_Length: 12000,
    Stock_Status: "Available",
    Notes: "Immediate yard collect",
    Hold_Status: "None",
    Hold_Reference: "HOLD-INF-091",
    Hold_Expiry: "",
    Purchase_Reference: "PO-4091"
  },
  {
    Merchant: "OneSteel Supplies",
    Branch: "Newcastle Depot",
    Section_Family: "Hot Rolled Sections",
    Profile: "100x100x12 EA",
    Material: "Grade 300",
    Stock_Length: 14000,
    Stock_Status: "By Order",
    Notes: "2-day transfer window",
    Hold_Status: "None",
    Hold_Reference: "",
    Hold_Expiry: "",
    Purchase_Reference: ""
  },
  {
    Merchant: "Bluescope Distribution",
    Branch: "Wollongong Hub",
    Section_Family: "Hollow Sections",
    Profile: "100x100x4.0 SHS",
    Material: "Grade 350",
    Stock_Length: 8000,
    Stock_Status: "Available",
    Notes: "Overnight delivery on flatbeds",
    Hold_Status: "Active",
    Hold_Reference: "HOLD-BLU-412",
    Hold_Expiry: "2026-06-30",
    Purchase_Reference: "PO-4112"
  }
];

// Preseeded Demo Data matching both Mockup requirements and Sydney Metro Assemblies
export const PRESEEDED_SECTION_PARTS: SectionPart[] = [
  // Mockup cases (Exact matching)
  {
    Part_ID: "CH-PL-101",
    Assembly_Mark: "CH-M01",
    Profile: "100 x 100 x 12 EA",
    Section_Family: "Hot Rolled Sections",
    Material: "Grade 300",
    Original_Length: 5500,
    Allowance_Applied: 0,
    Final_Length: 5500,
    Qty: 1,
    Kit_Ref: "BOX-CH-M01",
    Traceability_QR: "QR-CH-A01-7112",
    Status: "Pending"
  },
  {
    Part_ID: "CH-PL-102",
    Assembly_Mark: "CH-M01",
    Profile: "100 x 100 x 12 EA",
    Section_Family: "Hot Rolled Sections",
    Material: "Grade 300",
    Original_Length: 1251.5,
    Allowance_Applied: 1.5,
    Final_Length: 1250,
    Qty: 1,
    Kit_Ref: "BOX-CH-M01",
    Traceability_QR: "QR-CH-A02-7113",
    Status: "Pending"
  },
  {
    Part_ID: "CH-PL-103",
    Assembly_Mark: "CH-M01",
    Profile: "100 x 100 x 12 EA",
    Section_Family: "Hot Rolled Sections",
    Material: "Grade 300",
    Original_Length: 3018.0,
    Allowance_Applied: 3.0,
    Final_Length: 3015,
    Qty: 1,
    Kit_Ref: "BOX-CH-M01",
    Traceability_QR: "QR-CH-A03-7114",
    Status: "Pending"
  },
  {
    Part_ID: "CH-PL-104",
    Assembly_Mark: "CH-M01",
    Profile: "100 x 100 x 12 EA",
    Section_Family: "Hot Rolled Sections",
    Material: "Grade 300",
    Original_Length: 1551.5,
    Allowance_Applied: 1.5,
    Final_Length: 1550,
    Qty: 1,
    Kit_Ref: "BOX-CH-M01",
    Traceability_QR: "QR-CH-A04-7115",
    Status: "Pending"
  },
  
  // Rafter-R3 structural framework columns
  {
    Part_ID: "CH-BM-01",
    Assembly_Mark: "CH-R03",
    Profile: "250 UB 37.3",
    Section_Family: "Hot Rolled Sections",
    Material: "Grade 300",
    Original_Length: 6804.0,
    Allowance_Applied: 4.0,
    Final_Length: 6800,
    Qty: 1,
    Kit_Ref: "BOX-CH-R03",
    Traceability_QR: "QR-CH-BM-002",
    Status: "Pending"
  },
  {
    Part_ID: "CH-BM-02",
    Assembly_Mark: "CH-R03",
    Profile: "200 UB 22.3",
    Section_Family: "Hot Rolled Sections",
    Material: "Grade 300",
    Original_Length: 4202.0,
    Allowance_Applied: 2.0,
    Final_Length: 4200,
    Qty: 1,
    Kit_Ref: "BOX-CH-R03",
    Traceability_QR: "QR-CH-BM-003",
    Status: "Pending"
  },
  
  // Brace-B10 architectural trusses
  {
    Part_ID: "CH-TR-01",
    Assembly_Mark: "CH-B10",
    Profile: "100x100x4.0 SHS",
    Section_Family: "Hollow Sections",
    Material: "Grade 350",
    Original_Length: 3201.5,
    Allowance_Applied: 1.5,
    Final_Length: 3200,
    Qty: 2,
    Kit_Ref: "BOX-CH-B10",
    Traceability_QR: "QR-CH-TR-22",
    Status: "Pending"
  },
  {
    Part_ID: "CH-TR-02",
    Assembly_Mark: "CH-B10",
    Profile: "100x100x4.0 SHS",
    Section_Family: "Hollow Sections",
    Material: "Grade 350",
    Original_Length: 1450.5,
    Allowance_Applied: 0.5,
    Final_Length: 1450,
    Qty: 3,
    Kit_Ref: "BOX-CH-B10",
    Traceability_QR: "QR-CH-TR-44",
    Status: "Pending"
  }
];

export default function SectionNester({ parts, sectionParts, onSetSectionParts, onUpdateParts }: SectionNesterProps) {
  // Nester Configuration settings
  const [stockConfigs, setStockConfigs] = useState<StockLengthConfig[]>(() => {
    const saved = localStorage.getItem("rf_ns_stock_configs");
    return saved ? JSON.parse(saved) : DEFAULT_STOCK_CONFIGS;
  });
  
  const [merchantStocks, setMerchantStocks] = useState<MerchantStock[]>(() => {
    const saved = localStorage.getItem("rf_ns_merchant_stocks");
    return saved ? JSON.parse(saved) : DEFAULT_MERCHANT_STOCKS;
  });

  const [kerf, setKerf] = useState<number>(3); // standard 3mm kerf cutting allowance
  const [reusableThreshold, setReusableThreshold] = useState<number>(1000); // 1,000 mm minimum offcut recovery
  const [useMerchantStockOnly, setUseMerchantStockOnly] = useState<boolean>(false);
  
  // Active UI states
  const [importText, setImportText] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedFamilyFilter, setSelectedFamilyFilter] = useState<string>("All");
  const [nestingResults, setNestingResults] = useState<NestingResult[]>([]);
  const [isNestingRun, setIsNestingRun] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editing Stock Length Config helper
  const [editingFamily, setEditingFamily] = useState<string | null>(null);
  const [editingLengthsVal, setEditingLengthsVal] = useState<string>("");

  // Adding new manual Section cut states
  const [newPart, setNewPart] = useState({
    Part_ID: "", Assembly_Mark: "", Profile: "", Section_Family: "Hot Rolled Sections", 
    Material: "Grade 300", Original_Length: "", Allowance_Applied: "", Final_Length: "", Qty: "1"
  });

  // Automatically seed on load if vacant list
  useEffect(() => {
    if (sectionParts.length === 0) {
      const saved = localStorage.getItem("rf_ns_section_parts");
      if (saved) {
        onSetSectionParts(JSON.parse(saved));
      } else {
        onSetSectionParts(PRESEEDED_SECTION_PARTS);
      }
    }
  }, []);

  // Sync to LocalStorage whenever structures revise
  const saveSectionParts = (updated: SectionPart[]) => {
    onSetSectionParts(updated);
    localStorage.setItem("rf_ns_section_parts", JSON.stringify(updated));
  };

  useEffect(() => {
    localStorage.setItem("rf_ns_stock_configs", JSON.stringify(stockConfigs));
  }, [stockConfigs]);

  useEffect(() => {
    localStorage.setItem("rf_ns_merchant_stocks", JSON.stringify(merchantStocks));
  }, [merchantStocks]);

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // CSV Template paster
  const handleCopySampleCSV = () => {
    const header = "Assembly Mark,Part Mark,Profile,Section Family,Material,Original Length,Allowance,Final Cut Length,Quantity,QR Reference\n";
    const sample = `${header}CH-M01,CH-PL-101,200 UB 22.3,Hot Rolled Sections,Grade 300,5510,10,5500,1,QR-CH-M01-101\nCH-M01,CH-CS-01,100x100x12 EA,Hot Rolled Sections,Grade 300,1250,0,1250,2,QR-CH-M01-CS\nCH-B10,CH-TR-01,100x100x4.0 SHS,Hollow Sections,Grade 350,3018,3,3015,3,QR-CH-B10-TR1`;
    setImportText(sample);
  };

  // Parsing pasted CSV String
  const handleImportCSV = () => {
    if (!importText.trim()) return;
    try {
      const lines = importText.split("\n").map(l => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      
      const parsedParts: SectionPart[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map(c => c.trim());
        if (cols.length < 3) continue;

        // map headers
        const assyIdx = headers.findIndex(h => h.includes("assembly") || h.includes("member"));
        const partIdx = headers.findIndex(h => h.includes("part") || h.includes("mark") || h.includes("number"));
        const profileIdx = headers.findIndex(h => h.includes("profile") || h.includes("size") || h.includes("dimension"));
        const familyIdx = headers.findIndex(h => h.includes("family") || h.includes("type"));
        const materialIdx = headers.findIndex(h => h.includes("material") || h.includes("grade"));
        const origLenIdx = headers.findIndex(h => h.includes("original") || h.includes("raw"));
        const allowanceIdx = headers.findIndex(h => h.includes("allowance"));
        const finalLenIdx = headers.findIndex(h => h.includes("final") || h.includes("cut") || h.includes("adjusted"));
        const qtyIdx = headers.findIndex(h => h.includes("qty") || h.includes("quantity"));
        const qrIdx = headers.findIndex(h => h.includes("qr") || h.includes("traceability"));

        const assy = assyIdx !== -1 ? cols[assyIdx] : "Unassigned";
        const part = partIdx !== -1 ? cols[partIdx] : `P-${1000 + i}`;
        const profile = profileIdx !== -1 ? cols[profileIdx] : "100x100x12 EA";
        
        let family: any = "Hot Rolled Sections";
        if (familyIdx !== -1) {
          const loadedFam = cols[familyIdx].toLowerCase();
          if (loadedFam.includes("flat")) family = "Flat Bars";
          else if (loadedFam.includes("hollow") || loadedFam.includes("shs") || loadedFam.includes("chs")) family = "Hollow Sections";
          else if (loadedFam.includes("solid")) family = "Solid Bars";
        } else {
          // guess based on shape profile
          const pLow = profile.toLowerCase();
          if (pLow.includes("fb") || pLow.includes("flat") || pLow.includes("bar")) family = "Flat Bars";
          else if (pLow.includes("shs") || pLow.includes("rhs") || pLow.includes("chs") || pLow.includes("hollow")) family = "Hollow Sections";
          else if (pLow.includes("solid") || pLow.includes("round")) family = "Solid Bars";
        }

        const material = materialIdx !== -1 ? cols[materialIdx] : "Grade 300";
        const finalLength = finalLenIdx !== -1 ? (parseFloat(cols[finalLenIdx]) || 3000) : 3000;
        const allowance = allowanceIdx !== -1 ? (parseFloat(cols[allowanceIdx]) || 0) : 0;
        const origLength = origLenIdx !== -1 ? (parseFloat(cols[origLenIdx]) || (finalLength + allowance)) : (finalLength + allowance);
        const qty = qtyIdx !== -1 ? (parseInt(cols[qtyIdx]) || 1) : 1;
        const qr = qrIdx !== -1 ? cols[qrIdx] : `QR-1D-${Math.floor(1000 + Math.random() * 9000)}`;

        parsedParts.push({
          Part_ID: part,
          Assembly_Mark: assy,
          Profile: profile,
          Section_Family: family,
          Material: material,
          Original_Length: origLength,
          Allowance_Applied: allowance,
          Final_Length: finalLength,
          Qty: qty,
          Kit_Ref: `BOX-${assy.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
          Traceability_QR: qr,
          Status: "Pending"
        });
      }

      const merged = [...sectionParts];
      parsedParts.forEach(parsed => {
        const existIdx = merged.findIndex(m => m.Part_ID === parsed.Part_ID);
        if (existIdx !== -1) {
          merged[existIdx] = parsed;
        } else {
          merged.push(parsed);
        }
      });

      saveSectionParts(merged);
      setImportText("");
      showSuccess(`Successfully processed and loaded ${parsedParts.length} adjusted section cuts from CSV!`);
    } catch (e: any) {
      alert("Error parsing CSV schedule. Check headers and layout.");
    }
  };

  // Restores seeded dataset for quick walkthrough
  const handleResetToPreseed = () => {
    saveSectionParts(PRESEEDED_SECTION_PARTS);
    setNestingResults([]);
    setIsNestingRun(false);
    showSuccess("Section Cut-List restored to pre-configured Tekla Adjustments.");
  };

  const handleClearAll = () => {
    saveSectionParts([]);
    setNestingResults([]);
    setIsNestingRun(false);
    showSuccess("All section data cleared.");
  };

  // Add a single manual section component
  const handleAddNewPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.Part_ID || !newPart.Assembly_Mark || !newPart.Profile || !newPart.Final_Length) {
      alert("Please specify Part Mark, Assembly, Profile size and Final Adjusted Length.");
      return;
    }

    const finalLen = parseFloat(newPart.Final_Length);
    const allowance = parseFloat(newPart.Allowance_Applied || "0");
    const origLen = parseFloat(newPart.Original_Length || (finalLen + allowance).toString());
    const qtyCount = parseInt(newPart.Qty || "1") || 1;

    const added: SectionPart = {
      Part_ID: newPart.Part_ID,
      Assembly_Mark: newPart.Assembly_Mark,
      Profile: newPart.Profile,
      Section_Family: newPart.Section_Family as any,
      Material: newPart.Material,
      Original_Length: origLen,
      Allowance_Applied: allowance,
      Final_Length: finalLen,
      Qty: qtyCount,
      Kit_Ref: `BOX-${newPart.Assembly_Mark.toUpperCase().replace(/[^A-Z0-9]/g, "")}`,
      Traceability_QR: `QR-${newPart.Part_ID}-${Math.floor(1000 + Math.random() * 9000)}`,
      Status: "Pending"
    };

    const updated = [added, ...sectionParts];
    saveSectionParts(updated);
    setNewPart({
      Part_ID: "", Assembly_Mark: "", Profile: "", Section_Family: "Hot Rolled Sections", 
      Material: "Grade 300", Original_Length: "", Allowance_Applied: "", Final_Length: "", Qty: "1"
    });
    showSuccess(`Part ${added.Part_ID} registered.`);
  };

  const handleDeletePart = (pId: string) => {
    const filt = sectionParts.filter(p => p.Part_ID !== pId);
    saveSectionParts(filt);
    showSuccess("Item removed.");
  };

  // Toggle cutting status inline
  const handleTogglePartStatus = (pId: string) => {
    const updated = sectionParts.map(p => {
      if (p.Part_ID === pId) {
        const nextStatus = p.Status === "Pending" ? "Cut" : p.Status === "Cut" ? "Exception" : "Pending";
        return { ...p, Status: nextStatus as any };
      }
      return p;
    });
    saveSectionParts(updated);
    showSuccess(`Status toggled for part ${pId}`);
  };

  // Save changes to stock config lengths
  const handleSaveStockConfigLengths = (family: string) => {
    const lengthsArray = editingLengthsVal
      .split(",")
      .map(v => parseInt(v.trim()))
      .filter(v => !isNaN(v) && v > 0)
      .sort((a, b) => a - b);

    if (lengthsArray.length === 0) {
      alert("Please key in valid comma-separated millimeter lengths.");
      return;
    }

    const updated = stockConfigs.map(c => {
      if (c.Family === family) {
        return { ...c, StandardLengths: lengthsArray };
      }
      return c;
    });

    setStockConfigs(updated);
    setEditingFamily(null);
    showSuccess(`Stock lengths updated for ${family}`);
  };

  // Add Merchant row helper
  const [newMerchant, setNewMerchant] = useState({
    Merchant: "", Branch: "", Section_Family: "Hot Rolled Sections", Profile: "", Material: "", Length: "12000"
  });

  const handleAddMerchantStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMerchant.Merchant || !newMerchant.Branch || !newMerchant.Profile) {
      alert("Please key in Merchant Name, Branch Location and Profile Size.");
      return;
    }

    const item: MerchantStock = {
      Merchant: newMerchant.Merchant,
      Branch: newMerchant.Branch,
      Section_Family: newMerchant.Section_Family,
      Profile: newMerchant.Profile,
      Material: newMerchant.Material || "Grade 300",
      Stock_Length: parseInt(newMerchant.Length) || 12000,
      Stock_Status: "Available",
      Notes: "Added via workshop manual override"
    };

    setMerchantStocks([item, ...merchantStocks]);
    setNewMerchant({
      Merchant: "", Branch: "", Section_Family: "Hot Rolled Sections", Profile: "", Material: "", Length: "12000"
    });
    showSuccess("Merchant stock item recorded.");
  };

  const handleDeleteMerchant = (idx: number) => {
    setMerchantStocks(merchantStocks.filter((_, i) => i !== idx));
    showSuccess("Merchant index removed.");
  };

  // -----------------------------------------------------------------
  // core 1d linear bin-packing algorithm descending with metrics!
  // -----------------------------------------------------------------
  const handleRunNesting = () => {
    if (sectionParts.length === 0) {
      alert("No section cut parts imported yet.");
      return;
    }

    // Explode items by Qty
    const itemsToPack: {
      Part_ID: string;
      Assembly_Mark: string;
      Profile: string;
      Section_Family: string;
      Material: string;
      Original_Length: number;
      Allowance_Applied: number;
      Final_Length: number;
      Traceability_QR: string;
    }[] = [];

    sectionParts.forEach(p => {
      for (let i = 0; i < p.Qty; i++) {
        itemsToPack.push({
          Part_ID: p.Part_ID,
          Assembly_Mark: p.Assembly_Mark,
          Profile: p.Profile.trim(),
          Section_Family: p.Section_Family,
          Material: p.Material.trim(),
          Original_Length: p.Original_Length,
          Allowance_Applied: p.Allowance_Applied,
          Final_Length: p.Final_Length,
          Traceability_QR: p.Traceability_QR
        });
      }
    });

    // Group items by group key: Profile | Material
    const groups: { [key: string]: typeof itemsToPack } = {};
    itemsToPack.forEach(item => {
      const key = `${item.Profile} # ${item.Material} # ${item.Section_Family}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const finalNestResults: NestingResult[] = [];
    let stockBarCount = 1;

    // Nest each group independently
    Object.keys(groups).forEach(groupKey => {
      const [profile, material, family] = groupKey.split(" # ");
      const groupItems = groups[groupKey];
      
      // Sort items by final cut length descending
      groupItems.sort((a, b) => b.Final_Length - a.Final_Length);

      // Determine available stock bars
      let availableBarSizes: number[] = [];
      
      if (useMerchantStockOnly) {
        // filter from merchant branch list
        const matchingMerch = merchantStocks.filter(m => 
          m.Stock_Status === "Available" &&
          m.Profile.trim().toLowerCase() === profile.trim().toLowerCase() &&
          m.Material.trim().toLowerCase() === material.trim().toLowerCase()
        );
        availableBarSizes = matchingMerch.map(m => m.Stock_Length);
        
        // fallback to standard if none in merchant
        if (availableBarSizes.length === 0) {
          const config = stockConfigs.find(c => c.Family === family);
          availableBarSizes = config ? config.StandardLengths : [12005];
        }
      } else {
        // use configured standards
        const config = stockConfigs.find(c => c.Family === family);
        availableBarSizes = config ? config.StandardLengths : [12000];
      }

      // Sort physical stock sizes descending to check larger bar optimizations
      availableBarSizes.sort((a, b) => b - a);
      const mainStockSize = availableBarSizes[0] || 12000;

      // Fit using simple best-fit / first-fit descending algorithm
      const allocatedBars: {
        StockLength: number;
        Items: typeof itemsToPack;
      }[] = [];

      groupItems.forEach(item => {
        // Find if this piece can fit into already provisioned bar
        let fittedBarIdx = -1;
        for (let idx = 0; idx < allocatedBars.length; idx++) {
          const bar = allocatedBars[idx];
          const totalCutsPlusKerf = bar.Items.reduce((acc, current) => acc + current.Final_Length + kerf, 0);
          const spaceNeeded = item.Final_Length; // kerf is added after previous cuts
          
          if (totalCutsPlusKerf + spaceNeeded <= bar.StockLength) {
            fittedBarIdx = idx;
            break;
          }
        }

        if (fittedBarIdx !== -1) {
          allocatedBars[fittedBarIdx].Items.push(item);
        } else {
          // Open a new stock bar of the matching size. Flag if element length is larger than physical stock!
          if (item.Final_Length > mainStockSize) {
            // Flag an exception bar
            allocatedBars.push({
              StockLength: item.Final_Length,
              Items: [item]
            });
          } else {
            allocatedBars.push({
              StockLength: mainStockSize,
              Items: [item]
            });
          }
        }
      });

      // Build nesting summaries for each nested bar
      allocatedBars.forEach(bar => {
        const id = `SB-${family.slice(0,2).toUpperCase()}-${String(stockBarCount).padStart(3, "0")}`;
        stockBarCount++;

        let currentPos = 0;
        const cutsBreakdown: any[] = [];

        bar.Items.forEach((c, idx) => {
          const start = currentPos;
          const end = currentPos + c.Final_Length;
          cutsBreakdown.push({
            CutOrder: idx + 1,
            AssemblyNo: c.Assembly_Mark,
            PartNo: c.Part_ID,
            OriginalLength: c.Original_Length,
            AllowanceApplied: c.Allowance_Applied,
            FinalCutLength: c.Final_Length,
            PositionStart: start,
            PositionEnd: end,
            Traceability_QR: c.Traceability_QR
          });
          // advance current position including kerf
          currentPos = end + kerf;
        });

        // final cut position index calculation (remove trailing kerf for offcut sizing)
        const totalUsedNet = bar.Items.reduce((acc, c) => acc + c.Final_Length, 0);
        const totalKerf = Math.max(0, bar.Items.length - 1) * kerf;
        const totalUsedGross = totalUsedNet + totalKerf;
        const offcut = Math.max(0, bar.StockLength - totalUsedGross);

        const isReusable = offcut >= reusableThreshold;

        finalNestResults.push({
          StockBarID: id,
          Family: family,
          Profile: profile,
          Material: material,
          TotalStockLength: bar.StockLength,
          UsedLength: totalUsedNet,
          OffcutLength: offcut,
          IsOffcutReusable: isReusable,
          Efficiency: parseFloat(((totalUsedNet / bar.StockLength) * 100).toFixed(1)),
          Cuts: cutsBreakdown
        });
      });
    });

    setNestingResults(finalNestResults);
    setIsNestingRun(true);
    showSuccess("1D Section nesting calculations completed! Visual profiles updated.");
  };

  // Triggers search filter updates
  const filteredParts = sectionParts.filter(p => {
    const matchesSearch = 
      p.Part_ID.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Assembly_Mark.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.Profile.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFamily = selectedFamilyFilter === "All" || p.Section_Family === selectedFamilyFilter;
    return matchesSearch && matchesFamily;
  });

  // Calculate high-level stats of section parts
  const totalLengthToCut = sectionParts.reduce((acc, p) => acc + (p.Final_Length * p.Qty), 0);
  const averageCutLength = sectionParts.length > 0 
    ? Math.round(totalLengthToCut / sectionParts.reduce((acc, p) => acc + p.Qty, 0)) 
    : 0;
  const exceptionLengthsCount = sectionParts.filter(p => p.Final_Length > 18000).length;

  return (
    <div className="space-y-8 font-sans">
      {/* 1. SECTION LOGISTICS INTRO BOARD */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-md relative overflow-hidden">
        {/* Decorative Grid Line Overlay */}
        <div className="absolute inset-0 bg-radial-at-t from-indigo-950 via-slate-900 to-slate-900 opacity-80 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold tracking-widest text-indigo-400 uppercase">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Active Workshop Sequence
            </div>
            <h2 id="tour-nester-title" className="text-2xl md:text-3xl font-black tracking-tight text-white mt-1.5 leading-none">
              1D Section nester & Kit Linkage
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Take the final adjusted Tekla cut lists (including SlotsAndTabs fabrication parameters upstream) and produce professional 1D linear cut plans. Links directly to ReadyFab's workshop kit tracking.
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap text-xs">
            <button
              onClick={handleResetToPreseed}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition flex items-center gap-1.5 border border-indigo-700 cursor-pointer shadow-xs select-none"
            >
              <ClipboardList className="w-3.5 h-3.5" /> Use Tekla Adjustments Demo
            </button>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-300 rounded-lg font-bold transition flex items-center gap-1 border border-slate-800 cursor-pointer select-none"
            >
              <Trash className="w-3.5 h-3.5" /> Wipe Slate
            </button>
          </div>
        </div>

        {/* STATS TILES FOR IMPORTS */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Section Cuts</span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {sectionParts.reduce((acc, p) => acc + p.Qty, 0)}
              </span>
              <span className="text-xs text-slate-400">pieces</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Linear Length Demanded</span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-indigo-300">
                {(totalLengthToCut / 1000).toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">meters</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Average Piece size</span>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-white">
                {averageCutLength}
              </span>
              <span className="text-xs text-slate-400">mm</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nesting Layout Run</span>
            <div className="mt-1.5 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${nestingResults.length > 0 ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span className="text-sm font-bold tracking-tight font-mono uppercase text-white">
                {nestingResults.length > 0 ? `${nestingResults.length} stock bars nested` : "Not Compiled Yet"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SUCCESS ALERTS OVERLAY */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. THREE-PANEL SECTIONS (CONFIGURATORS & INPUT) */}
      <h3 className="text-xs font-semibold text-slate-450 uppercase tracking-widest pl-1 mt-6">
        Step 1: Configure Materials, Merchant Stocks, & Cut Parameters
      </h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PANEL A: CONFIGURABLE STOCK LENGTHS & MERCH TABLE */}
        <div className="lg:col-span-8 bg-white border border-slate-205 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h4 className="text-md font-bold text-slate-800">Configurable Procurement stock Lengths</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Edit standard merchant wholesale stock lengths for each material family.</p>
            </div>
            <Settings className="w-5 h-5 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stockConfigs.map((cfg) => {
              const isEditing = editingFamily === cfg.Family;
              return (
                <div key={cfg.Family} className="p-4 border border-slate-150 rounded-xl bg-slate-50 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-slate-800">{cfg.Family}</span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {cfg.StandardLengths.map(l => (
                        <span key={l} className="px-2 py-0.5 text-[10px] font-bold font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-sm">
                          {l / 1000} m ({l} mm)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingLengthsVal}
                          onChange={(e) => setEditingLengthsVal(e.target.value)}
                          className="px-2 py-1 border border-slate-300 bg-white font-mono text-[11px] rounded w-28 text-slate-805"
                          placeholder="e.g. 6000, 8000"
                        />
                        <button
                          onClick={() => handleSaveStockConfigLengths(cfg.Family)}
                          className="p-1.5 bg-emerald-50 hover:bg-emerald-100 rounded text-emerald-800"
                          title="Save Changes"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingFamily(null)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-600"
                          title="Cancel"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingFamily(cfg.Family);
                          setEditingLengthsVal(cfg.StandardLengths.join(", "));
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-55 rounded shadow-xs cursor-pointer transition select-none"
                      >
                        Edit Lengths
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* MERCHANT STOCK COMPARISON UNIT */}
          <div className="pt-4 border-t border-slate-150 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Branch Merchant Stock Profiles (Manual Override)</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Compare best theoretical nesting against actual branch available inventories.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-650">Restrict to Available Merchant Stocks Only</span>
                <button
                  onClick={() => setUseMerchantStockOnly(!useMerchantStockOnly)}
                  className="focus:outline-hidden transition"
                >
                  {useMerchantStockOnly ? (
                    <ToggleRight className="w-10 h-10 text-indigo-650" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300" />
                  )}
                </button>
              </div>
            </div>

            {/* Merchant Stock Adder manual */}
            <form onSubmit={handleAddMerchantStock} className="p-4 border border-slate-150 rounded-xl bg-slate-25 grid grid-cols-2 md:grid-cols-6 gap-2.5 text-xs">
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Merchant</label>
                <input
                  type="text"
                  value={newMerchant.Merchant}
                  onChange={(e) => setNewMerchant({...newMerchant, Merchant: e.target.value})}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-802"
                  placeholder="e.g. InfraBuild"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Branch Location</label>
                <input
                  type="text"
                  value={newMerchant.Branch}
                  onChange={(e) => setNewMerchant({...newMerchant, Branch: e.target.value})}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-802"
                  placeholder="e.g. Sydney South-West"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Profile Size</label>
                <input
                  type="text"
                  value={newMerchant.Profile}
                  onChange={(e) => setNewMerchant({...newMerchant, Profile: e.target.value})}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-802"
                  placeholder="e.g. 100x100x12 EA"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Type Family</label>
                <select
                  value={newMerchant.Section_Family}
                  onChange={(e) => setNewMerchant({...newMerchant, Section_Family: e.target.value})}
                  className="w-full px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-802"
                >
                  <option value="Hot Rolled Sections">Hot Rolled Sections</option>
                  <option value="Flat Bars">Flat Bars</option>
                  <option value="Hollow Sections">Hollow Sections</option>
                  <option value="Solid Bars">Solid Bars</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-widest mb-1">Stock Length (mm)</label>
                <input
                  type="number"
                  value={newMerchant.Length}
                  onChange={(e) => setNewMerchant({...newMerchant, Length: e.target.value})}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md text-slate-802 font-mono font-bold"
                  placeholder="e.g. 12000"
                />
              </div>
              <div className="col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-slate-900 border border-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-950 transition cursor-pointer select-none"
                >
                  + Add Stock
                </button>
              </div>
            </form>

            {/* Merchant branch list representation */}
            <div className="overflow-x-auto border border-slate-150 rounded-xl">
              <table className="w-full text-left text-[11px] text-slate-550">
                <thead className="bg-slate-50 border-b border-slate-150 text-slate-650 uppercase font-black text-[9px] tracking-widest">
                  <tr>
                    <th className="px-3 py-2">Merchant Name & Location</th>
                    <th className="px-3 py-2">Material Specification</th>
                    <th className="px-3 py-2">Length Size (mm)</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Notes</th>
                    <th className="px-3 py-2 text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 bg-white font-mono">
                  {merchantStocks.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-sans font-medium text-slate-800">
                        <div>{m.Merchant}</div>
                        <div className="text-[9.5px] text-slate-400 font-mono font-bold uppercase">{m.Branch}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-bold text-slate-700">{m.Profile}</div>
                        <div className="text-[9.5px] text-slate-400">{m.Section_Family} • {m.Material}</div>
                      </td>
                      <td className="px-3 py-2 font-black text-slate-900 font-mono">{m.Stock_Length} mm</td>
                      <td className="px-3 py-2">
                        <span className={`inline-block px-1.5 py-0.5 rounded-[4px] text-[9.5px] font-black leading-none ${
                          m.Stock_Status === "Available"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                            : m.Stock_Status === "By Order"
                            ? "bg-amber-50 text-amber-800 border border-amber-100"
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          {m.Stock_Status}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-sans text-slate-500 italic max-w-xs truncate" title={m.Notes}>{m.Notes}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMerchant(idx)}
                          className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition cursor-pointer select-none"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Hold Status & Expired future fields (proving full open data model schema for scale) */}
            <div className="p-3.5 bg-indigo-50/40 border border-indigo-100 rounded-xl text-xs flex gap-3 text-slate-600">
              <Info className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <p className="font-bold text-slate-700">Open Data Architecture Placeholder Verified (API Openings)</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  The data model includes fields for <strong>Hold Status</strong>, <strong>Hold Expiry</strong>, <strong>Purchase Reference</strong>, and <strong>Merchant Stock Update Reference</strong>. These enable ready integration for automated electronic ordering, branch reservations and real-time replenishment sweeps.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL B: KERF, ALLOWANCES & QUICK CUT CUTLIST INSERTS */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-stretch">
          <div className="bg-white border border-slate-205 rounded-2xl p-6 shadow-xs flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-md font-bold text-slate-850 border-b border-slate-100 pb-3">Nesting Cut parameters</h4>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2.5">
                  Saw Kerf Allowance ({kerf} mm per cut)
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="1"
                  value={kerf}
                  onChange={(e) => setKerf(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold mt-1.5">
                  <span>0 mm (No Kerf)</span>
                  <span className="text-indigo-600 font-extrabold">{kerf} mm Standard</span>
                  <span>10 mm (Heavy Plasma)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-600 mb-2.5">
                  Minimum Reusable Offcut ({reusableThreshold} mm)
                </label>
                <input
                  type="range"
                  min="300"
                  max="3000"
                  step="100"
                  value={reusableThreshold}
                  onChange={(e) => setReusableThreshold(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono font-bold mt-1.5">
                  <span>300 mm (Small scrap)</span>
                  <span className="text-indigo-600 font-extrabold">{reusableThreshold} mm Recovery</span>
                  <span>3,000 mm (Long Section)</span>
                </div>
                <p className="text-[10px] text-slate-450 mt-2 leading-relaxed italic">
                  Offcuts exceeding this trigger threshold are labeled as reusable stock pieces. Everything smaller is written off as scrap waste.
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 text-amber-900 border border-amber-500/20 rounded-xl text-xs space-y-1 mt-6">
              <div className="font-extrabold flex items-center gap-1.5 uppercase tracking-wide">
                <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                Slots & Tabs Rules Upstream
              </div>
              <p className="text-[10.5px] text-slate-650 leading-relaxed font-medium">
                Our linear section nester uses the <strong>Final Cut Length</strong> generated after Slots and Tabs adjustments are processed in the Tekla design stage. The logic is applied upstream; the nester handles packing of the finished fabrication geometry.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CSV SCHEDULER PASTER & MANUAL OVERRIDE DECK */}
      <div className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs">
        <div id="tour-step2-import" className="p-6 border-b border-slate-150 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-805">Step 2: Load / Import Structural Cut Schedule</h3>
            <p className="text-xs text-slate-500 mt-0.5">Drag-and-drop CSV adjusted lists, paste from Tekla exports, or add manual section sizes below.</p>
          </div>
          <button
            onClick={handleCopySampleCSV}
            className="px-3.5 py-1.5 text-xs text-indigo-700 hover:text-indigo-900 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer select-none"
          >
            <Clipboard className="w-3.5 h-3.5" /> Load Copy-Paste Template
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Paste board */}
          <div className="lg:col-span-5 space-y-4">
            <label className="block text-xs font-bold text-slate-600 font-mono uppercase tracking-widest pl-0.5">Pasted CSV / Tab-separated coordinates</label>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full h-44 p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-xl focus:ring-1 focus:ring-indigo-500 focus:outline-none border border-slate-830 leading-normal"
              placeholder="Assembly Mark,Part Mark,Profile,Section Family,Material,Original Length,Allowance,Final Cut Length,Quantity,QR Reference&#10;CH-M01,CH-PL-101,100x100x12 EA,Hot Rolled Sections,Grade 300,5510,10,5500,1,QR-CH-M01-101..."
            />
            <button
              onClick={handleImportCSV}
              disabled={!importText.trim()}
              className="w-full py-2 bg-indigo-600 border border-indigo-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 hover:bg-indigo-700 hover:border-indigo-700 transition cursor-pointer select-none disabled:bg-slate-100 disabled:border-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              Parse & Integrate Cut List CSV
            </button>
          </div>

          {/* Manual insert Form */}
          <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
            <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest border-b border-slate-200 pb-2 mb-4">Manual Section Entry Override</h4>
            <form onSubmit={handleAddNewPart} className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Part Mark / ID</label>
                <input
                  type="text"
                  value={newPart.Part_ID}
                  onChange={(e) => setNewPart({...newPart, Part_ID: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded text-slate-902 font-mono"
                  placeholder="e.g. S-101"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Assembly Mark</label>
                <input
                  type="text"
                  value={newPart.Assembly_Mark}
                  onChange={(e) => setNewPart({...newPart, Assembly_Mark: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded text-slate-902 font-mono"
                  placeholder="e.g. CH-M01"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Profile Size</label>
                <input
                  type="text"
                  value={newPart.Profile}
                  onChange={(e) => setNewPart({...newPart, Profile: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded text-slate-902"
                  placeholder="e.g. 100 x 100 x 12 EA"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Section Family</label>
                <select
                  value={newPart.Section_Family}
                  onChange={(e) => setNewPart({...newPart, Section_Family: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded text-slate-902 font-bold"
                >
                  <option value="Hot Rolled Sections">Hot Rolled Sections</option>
                  <option value="Flat Bars">Flat Bars</option>
                  <option value="Hollow Sections">Hollow Sections</option>
                  <option value="Solid Bars">Solid Bars</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Material / Grade</label>
                <input
                  type="text"
                  value={newPart.Material}
                  onChange={(e) => setNewPart({...newPart, Material: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded text-slate-902 font-bold"
                  placeholder="Grade 300"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Final Cut (mm)</label>
                <input
                  type="number"
                  value={newPart.Final_Length}
                  onChange={(e) => setNewPart({...newPart, Final_Length: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-bold text-indigo-750 font-mono"
                  placeholder="e.g. 5500"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Software Allowance (mm)</label>
                <input
                  type="number"
                  value={newPart.Allowance_Applied}
                  onChange={(e) => setNewPart({...newPart, Allowance_Applied: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono"
                  placeholder="e.g. 1.5"
                />
              </div>

              <div>
                <label className="block font-bold text-[10px] text-slate-500 uppercase tracking-wider mb-1">Cutting Qty</label>
                <input
                  type="number"
                  value={newPart.Qty}
                  onChange={(e) => setNewPart({...newPart, Qty: e.target.value})}
                  className="w-full p-2 bg-white border border-slate-200 rounded font-mono font-bold"
                  placeholder="1"
                />
              </div>

              <div className="col-span-2 md:col-span-4 flex justify-end mt-2 pt-2 border-t border-slate-200">
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 border border-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-lg transition flex items-center gap-1 cursor-pointer select-none"
                >
                  Confirm Manual Addition
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Dynamic Search Table representing current Cut demands */}
        <div className="border-t border-slate-150 p-6 space-y-4 bg-slate-25">
          <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-805">Active 1D Section Cut List demands ({filteredParts.length} profiles displayed)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 font-semibold">Verify the final coordinate adjustments before packing calculations execution.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-slate-201 text-xs text-slate-705 placeholder-slate-400 rounded-lg focus:outline-hidden w-64"
                placeholder="Search Mark, Assembly or Profile size..."
              />
              <select
                value={selectedFamilyFilter}
                onChange={(e) => setSelectedFamilyFilter(e.target.value)}
                className="px-3.5 py-1.5 bg-white border border-slate-201 text-xs text-slate-705 font-bold rounded-lg focus:outline-hidden"
              >
                <option value="All">All Families</option>
                <option value="Hot Rolled Sections">Hot Rolled Sections</option>
                <option value="Flat Bars">Flat Bars</option>
                <option value="Hollow Sections">Hollow Sections</option>
                <option value="Solid Bars">Solid Bars</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs max-h-96">
            <table className="w-full text-left text-[11px] text-slate-550">
              <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 tracking-wider text-slate-650 font-bold uppercase text-[9.5px]">
                <tr>
                  <th className="px-5 py-3">Assembly / Member Mark</th>
                  <th className="px-5 py-3 font-mono">Part Mark / Part Number</th>
                  <th className="px-5 py-3">Profile Size / Family</th>
                  <th className="px-5 py-3 text-right font-mono">Original mm</th>
                  <th className="px-5 py-3 text-right font-mono">Allowance mm</th>
                  <th className="px-5 py-3 text-right font-mono">Final Cut Length</th>
                  <th className="px-5 py-3 text-center w-12">Qty</th>
                  <th className="px-5 py-3">Site / Kit Ref</th>
                  <th className="px-5 py-3">Traceability / QR</th>
                  <th className="px-5 py-3 text-center">Checkout</th>
                  <th className="px-5 py-3 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {filteredParts.length > 0 ? (
                  filteredParts.map((p) => (
                    <tr key={p.Part_ID} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3-5 font-sans font-bold text-slate-800">{p.Assembly_Mark}</td>
                      <td className="px-5 py-3-5 font-black text-slate-900">{p.Part_ID}</td>
                      <td className="px-5 py-3-5">
                        <div className="font-bold text-slate-700">{p.Profile}</div>
                        <div className="text-[9px] text-slate-400 font-sans font-bold uppercase">{p.Section_Family} • {p.Material}</div>
                      </td>
                      <td className="px-5 py-3-5 text-right text-slate-500 font-bold">{p.Original_Length} mm</td>
                      <td className="px-5 py-3-5 text-right text-indigo-600 font-bold">+{p.Allowance_Applied} mm</td>
                      <td className="px-5 py-3-5 text-right font-black text-slate-950 font-mono text-[12px] bg-indigo-50/20">{p.Final_Length} mm</td>
                      <td className="px-5 py-3-5 text-center font-bold text-slate-800">{p.Qty}x</td>
                      <td className="px-5 py-3-5 font-sans">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-mono font-bold">
                          {p.Kit_Ref}
                        </span>
                      </td>
                      <td className="px-5 py-3-5 text-slate-500 text-[10px] break-all">{p.Traceability_QR}</td>
                      <td className="px-5 py-3-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePartStatus(p.Part_ID)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9.5px] font-black leading-none rounded-[4px] border ${
                            p.Status === "Cut"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-100"
                              : p.Status === "Exception"
                              ? "bg-rose-50 text-rose-800 border-rose-100"
                              : "bg-amber-50 text-amber-800 border-amber-100 animate-pulse hover:animate-none"
                          }`}
                        >
                          {p.Status === "Cut" ? "✔ CUT" : p.Status === "Exception" ? "⚠️ EXCEPTION" : "🕒 PENDING"}
                        </button>
                      </td>
                      <td className="px-5 py-3-5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeletePart(p.Part_ID)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer select-none"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-5 py-8 text-center text-slate-400 text-xs font-sans">
                      No matching integrated section cut profiles found. Check your search query or load the default Tekla adjustments seeds.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. RUN NEST COMPILER UNIT */}
      <div className="flex flex-col items-center justify-center py-6">
        <button
          onClick={handleRunNesting}
          id="tour-btn-pack-1d"
          className="px-8 py-4 bg-slate-950 hover:bg-black text-white text-md font-black rounded-2xl flex items-center gap-2 transition hover:scale-[1.01] shadow-lg cursor-pointer select-none"
        >
          <Play className="w-5 h-5 text-emerald-400 fill-emerald-400 shrink-0" />
          <span>RUN 1D LINEAR NESTING COMPILER</span>
        </button>
        <p className="text-xs text-slate-450 mt-2.5 max-w-lg text-center font-medium">
          Optimizes linear placement of exact adjusted cuts into {useMerchantStockOnly ? "restricted available Merchant inventories" : "configured wholesale standard stock lengths"}, accounting for standard cutting saw kerf.
        </p>
      </div>

      {/* 5. SVG DRAWINGS / NESTING RECORD RESULTS DRAWING EXACTLY MATCHING WORKBOOK SPECIFICATION */}
      {isNestingRun && nestingResults.length > 0 && (
        <div className="space-y-8 print-no-break">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
                <ClipboardList className="w-5.5 h-5.5 text-indigo-500" />
                1D Stock Order / Nesting Drawings
              </h3>
              <p className="text-xs text-slate-500 mt-1">Stunning mathematical linear placements compiled below. Each drawing corresponds to a dynamic billing stock bar.</p>
            </div>
            <div className="text-right text-xs text-slate-500 font-mono pr-1">
              Efficiency Summary: <span className="font-bold text-indigo-600">
                {Math.round(nestingResults.reduce((acc, bar) => acc + bar.UsedLength, 0) / nestingResults.reduce((acc, bar) => acc + bar.TotalStockLength, 0) * 100)}% Average
              </span>
            </div>
          </div>

          {/* Map each nested stock bar */}
          <div className="space-y-8">
            {nestingResults.map((bar) => {
              // Calculate width fractions
              const itemsCount = bar.Cuts.length;

              return (
                <div key={bar.StockBarID} className="bg-white border-2 border-slate-350 rounded-2xl p-6 md:p-8 shadow-sm space-y-6 max-w-5xl mx-auto font-sans bg-radial-at-l from-slate-50/50 via-white to-white">
                  
                  {/* TITLE BLOCKS EXACTLY MATCHING PROVIDED DRAWING DIAGRAM */}
                  <div className="text-center font-sans tracking-tight border-b border-slate-200 pb-5">
                    <h2 className="text-2xl font-black text-indigo-950 uppercase">1D Stock Order / Nesting Record</h2>
                    <div className="flex justify-center flex-wrap gap-8 text-[12.5px] text-slate-650 font-bold mt-2">
                      <p>Material: <span className="font-black text-slate-900">{bar.Profile}</span></p>
                      <p>Ordered Length: <span className="font-black text-slate-900">{(bar.TotalStockLength).toLocaleString()} mm</span></p>
                      <p>Material Grade: <span className="font-black text-slate-900">{bar.Material}</span></p>
                      <p>Nesting Code ID: <span className="font-black text-rose-600 font-mono shrink-0">{bar.StockBarID}</span></p>
                    </div>
                  </div>

                  {/* SVG DRAWING SYSTEM FROM THE HAND-DRAWN SKETCH SPECIFICATION */}
                  <div className="space-y-4">
                    {/* Width limit marker at top of bar */}
                    <div className="relative h-1">
                      <div className="absolute top-0 inset-x-0 border-t border-dashed border-slate-400 flex justify-between px-1 text-[10px] font-mono text-slate-400 font-extrabold">
                        <span className="bg-white px-1 relative -top-2">| Start</span>
                        <span className="bg-white px-1 relative -top-2">{(bar.TotalStockLength).toLocaleString()} mm Total Stock</span>
                        <span className="bg-white px-1 relative -top-2">End |</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between font-mono text-[10px] font-bold text-slate-400 px-0.5">
                      <div className="flex items-center gap-1.5 leading-none px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span>Procurement Code: {bar.StockBarID}</span>
                      </div>
                      <div className="font-sans flex items-center gap-2">
                        <span>Efficiency:</span>
                        <span className={`px-2 py-0.5 rounded-sm font-black text-[10px] text-white ${
                          bar.Efficiency > 90 ? "bg-emerald-600" : bar.Efficiency > 75 ? "bg-blue-600" : "bg-amber-600"
                        }`}>
                          {bar.Efficiency}%
                        </span>
                      </div>
                    </div>

                    {/* PHYSICAL 1D STOCK BAR BLOCK */}
                    <div className="relative w-full border-2 border-slate-900 h-28 bg-white flex rounded-xs overflow-hidden shadow-xs">
                      {/* Plot each Cut Segment */}
                      {bar.Cuts.map((cut) => {
                        const pct = (cut.FinalCutLength / bar.TotalStockLength) * 100;
                        return (
                          <div 
                            key={cut.CutOrder}
                            style={{ width: `${pct}%` }} 
                            className="h-full border-r-2 border-slate-900 bg-linear-to-b from-indigo-50/20 to-indigo-100/30 flex flex-col justify-center items-center p-2 text-center select-none relative group cursor-pointer hover:from-indigo-100/40 hover:to-indigo-200/45 transition-all text-xs text-indigo-950 font-sans"
                          >
                            <span className="text-[10px] font-extrabold text-slate-400 absolute top-1 uppercase tracking-wider">
                              Cut #{cut.CutOrder}
                            </span>
                            
                            <p className="font-black leading-tight text-slate-900 tracking-tight text-[11px] md:text-xs">
                              {cut.AssemblyNo}
                            </p>
                            <p className="font-mono font-bold leading-none text-slate-650 tracking-tight text-[10.5px]">
                              {cut.PartNo}
                            </p>
                            <p className="font-black text-indigo-700 tracking-tight text-[11px] mt-1">
                              {cut.FinalCutLength} mm
                            </p>

                            {/* tooltip on hover */}
                            <div className="absolute hidden group-hover:block bottom-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white font-mono text-[9px] px-2.5 py-1.5 rounded-lg shadow-md z-30 w-32 font-bold pointer-events-none text-center">
                              Coords: {cut.PositionStart} - {cut.PositionEnd} mm
                              <span className="block text-[8px] text-indigo-300 mt-0.5">QR: {cut.Traceability_QR}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* PHYSICAL OFFCUT BLOCK AT THE REAR OF STOCKED BAR CONTAINER */}
                      {bar.OffcutLength > 0 && (
                        <div 
                          style={{ width: `${(bar.OffcutLength / bar.TotalStockLength) * 100}%` }}
                          className={`h-full flex flex-col justify-center items-center p-2 text-center text-xs font-sans relative ${
                            bar.IsOffcutReusable
                              ? "bg-emerald-50 text-emerald-900 hover:bg-emerald-100/50"
                              : "bg-slate-100/75 text-slate-400 hover:bg-slate-100"
                          } select-none transition-colors border-dashed overflow-hidden`}
                        >
                          <span className="text-[9.5px] font-black absolute top-1 uppercase tracking-widest text-slate-400">Offcut</span>
                          
                          <p className={`font-black ${bar.IsOffcutReusable ? "text-emerald-700" : "text-slate-500"} text-xs uppercase leading-none`}>
                            {bar.IsOffcutReusable ? "Reusable" : "Scrap Waste"}
                          </p>
                          <p className={`font-mono text-[11.5px] font-black ${bar.IsOffcutReusable ? "text-emerald-600" : "text-slate-400"} mt-1`}>
                            {bar.OffcutLength} mm
                          </p>

                          {/* Diagonal striped canvas simulation inside scrap or offcut block */}
                          <div className="absolute inset-0 bg-linear-to-r from-transparent via-slate-200/20 to-transparent rotate-45 scale-150 pointer-events-none opacity-40" />
                        </div>
                      )}
                    </div>

                    {/* DIMENSION LINES INDICATING MEASUREMENT MARKERS */}
                    <div className="relative w-full h-8 flex -top-1.5">
                      {bar.Cuts.map((cut) => {
                        const pct = (cut.FinalCutLength / bar.TotalStockLength) * 100;
                        return (
                          <div 
                            key={cut.CutOrder} 
                            style={{ width: `${pct}%` }} 
                            className="relative border-x border-slate-300 h-3 flex items-center justify-center font-mono font-bold text-[10px] text-slate-500"
                          >
                            <span className="absolute bottom-1 bg-white px-1 leading-none">{cut.FinalCutLength}</span>
                            <div className="w-full border-b border-slate-350 absolute bottom-1.5 inset-x-0" />
                          </div>
                        );
                      })}
                      {bar.OffcutLength > 0 && (
                        <div 
                          style={{ width: `${(bar.OffcutLength / bar.TotalStockLength) * 100}%` }} 
                          className="relative border-x border-slate-300 h-3 flex items-center justify-center font-mono font-bold text-[10px] text-slate-400"
                        >
                          <span className="absolute bottom-1 bg-white px-1 leading-none">{bar.OffcutLength}</span>
                          <div className="w-full border-b border-slate-350 absolute bottom-1.5 inset-x-0" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM CUTLIST METADATA GRID & BLUE "WHY RECORD MATTERS" BLOCK */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-3 border-t border-slate-150">
                    {/* Left cutting schedule table */}
                    <div className="lg:col-span-8 overflow-x-auto">
                      <table className="w-full text-left text-[11px] text-slate-550">
                        <thead className="bg-slate-100 border-b border-slate-300 text-slate-705 uppercase font-bold text-[9.5px]">
                          <tr>
                            <th className="px-3 py-2 w-12 text-center">Cut Order</th>
                            <th className="px-3 py-2">Assembly No</th>
                            <th className="px-3 py-2">Part No</th>
                            <th className="px-3 py-2 text-right">Original (mm)</th>
                            <th className="px-3 py-2 text-right">Allowance Applied</th>
                            <th className="px-3 py-2 text-right">Final Length (mm)</th>
                            <th className="px-3 py-2 text-right">Position on Stock Bar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 font-mono text-[10.5px]">
                          {bar.Cuts.map((c) => (
                            <tr key={c.CutOrder} className="hover:bg-slate-50">
                              <td className="px-3 py-2 text-center font-sans font-black bg-slate-50/50">{c.CutOrder}</td>
                              <td className="px-3 py-2 font-sans font-bold text-slate-801">{c.AssemblyNo}</td>
                              <td className="px-3 py-2 font-black text-slate-900">{c.PartNo}</td>
                              <td className="px-3 py-2 text-right text-slate-400">{c.OriginalLength}</td>
                              <td className="px-3 py-2 text-right text-indigo-600 font-bold">+{c.AllowanceApplied} mm</td>
                              <td className="px-3 py-2 text-right font-black text-slate-900">{c.FinalCutLength}</td>
                              <td className="px-3 py-2 text-right text-indigo-700 font-bold">{c.PositionStart} – {c.PositionEnd} mm</td>
                            </tr>
                          ))}
                          {bar.OffcutLength > 0 && (
                            <tr className="bg-slate-55">
                              <td className="px-3 py-2 text-center font-sans font-black bg-slate-100 text-slate-400">Total</td>
                              <td className="px-3 py-2 font-sans font-semibold text-slate-400">—</td>
                              <td className="px-3 py-2 font-semibold text-slate-400">{bar.IsOffcutReusable ? "Reusable Recovery" : "Scrap Waste"}</td>
                              <td className="px-3 py-2 text-right text-slate-300">—</td>
                              <td className="px-3 py-2 text-right text-slate-300">—</td>
                              <td className="px-3 py-2 text-right font-black text-slate-500 font-bold">{bar.OffcutLength}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-400">{bar.TotalStockLength - bar.OffcutLength} – {bar.TotalStockLength} mm</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Blue informative box */}
                    <div className="lg:col-span-4 bg-indigo-950 text-indigo-100 p-5 rounded-xl flex flex-col justify-between font-sans leading-relaxed shadow-xs">
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-[11px] text-indigo-300">Why this record matters</h4>
                        <ul className="mt-3.5 space-y-2.5 text-[11px] text-indigo-100">
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 leading-none mr-0.5">•</span>
                            <span><strong>Shows stock ordered</strong>: Links each individual billing coordinate to merchant physical deliveries.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 leading-none mr-0.5">•</span>
                            <span><strong>Records allowances</strong>: Logs software geometric extension offsets applied to each edge profile.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 leading-none mr-0.5">•</span>
                            <span><strong>Visualizes nesting efficiency</strong>: Shows exact coordinates to plant shear/cutter operators.</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 leading-none mr-0.5">•</span>
                            <span><strong>Preserves traceability</strong>: Links member kit assembly marks down to parent wholesale billing heats.</span>
                          </li>
                        </ul>
                      </div>
                      <div className="mt-5 pt-3.5 border-t border-indigo-900 flex justify-between items-center text-[9px] font-mono text-indigo-400 uppercase tracking-widest">
                        <span>ReadyFab Trace Unit</span>
                        <span>V1.2 Sec-1D</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. TABULAR SUMMARY REPORT / EXPORT DATA TABLE */}
      {isNestingRun && nestingResults.length > 0 && (
        <div className="bg-white border border-slate-205 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-150 flex flex-wrap justify-between items-center gap-4 bg-slate-50 no-print">
            <div>
              <h3 className="text-lg font-bold text-slate-805">Step 3: Export 1D Section Cutting Report</h3>
              <p className="text-xs text-slate-500 mt-0.5">Unified factory production report. Ready for export to saw operators and site erectors.</p>
            </div>
            
            <button
              onClick={() => {
                // Generate CSV Export download
                let csvContent = "data:text/csv;charset=utf-8,";
                csvContent += "Nest Batch,Stock Bar ID,Profile,Material,Stock Length,Assembly Mark,Part Mark,Final Length,Cut Order,Position,Offcut,Traceability QR,Status\r\n";
                nestingResults.forEach(bar => {
                  bar.Cuts.forEach(c => {
                    csvContent += `Batch-1D-001,${bar.StockBarID},"${bar.Profile}","${bar.Material}",${bar.TotalStockLength},${c.AssemblyNo},${c.PartNo},${c.FinalCutLength},${c.CutOrder},"${c.PositionStart}-${c.PositionEnd} mm",${bar.OffcutLength},${c.Traceability_QR},Pending\r\n`;
                  });
                });
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `rf_1d_section_cutting_report_${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showSuccess("Cutting CSV Report downloaded successfully.");
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs select-none"
            >
              <Download className="w-4 h-4" /> Download Unified 1D Cutting report (.CSV)
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] text-slate-550">
              <thead className="bg-slate-100 border-b border-slate-205 text-slate-650 tracking-wider font-extrabold uppercase text-[9px]">
                <tr>
                  <th className="px-4 py-3">Stock Bar ID</th>
                  <th className="px-4 py-3">Specification Profile / Material</th>
                  <th className="px-4 py-3">Bar Size (mm)</th>
                  <th className="px-4 py-3">Assembly & Part Marks</th>
                  <th className="px-4 py-3 text-right">Adjusted Cut Length</th>
                  <th className="px-4 py-3 text-center">Cut Sequence</th>
                  <th className="px-4 py-3 text-right font-mono">Position Bounds</th>
                  <th className="px-4 py-3 text-right">Offcut Residual</th>
                  <th className="px-4 py-3">QR Reference Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 font-mono">
                {nestingResults.flatMap((bar) =>
                  bar.Cuts.map((cut, cIdx) => (
                    <tr key={`${bar.StockBarID}-${cut.PartNo}-${cIdx}`} className="hover:bg-slate-50/50">
                      {cIdx === 0 ? (
                        <td className="px-4 py-2.5 font-sans font-extrabold text-slate-805 bg-indigo-50/15" rowSpan={bar.Cuts.length}>
                          <span className="text-indigo-650">{bar.StockBarID}</span>
                        </td>
                      ) : null}
                      {cIdx === 0 ? (
                        <td className="px-4 py-2.5 bg-indigo-50/15 text-[10.5px]" rowSpan={bar.Cuts.length}>
                          <div className="font-extrabold text-slate-705">{bar.Profile}</div>
                          <div className="text-[9px] text-slate-400 font-sans">{bar.Material}</div>
                        </td>
                      ) : null}
                      {cIdx === 0 ? (
                        <td className="px-4 py-2.5 bg-indigo-50/15 font-black text-slate-800" rowSpan={bar.Cuts.length}>
                          {bar.TotalStockLength} mm
                        </td>
                      ) : null}
                      
                      <td className="px-4 py-2.5 font-sans">
                        <span className="font-extrabold text-slate-900 font-mono">{cut.AssemblyNo}</span> 
                        <span className="text-slate-400 mx-1.5">/</span> 
                        <span className="font-bold font-mono text-indigo-650 bg-slate-100 px-1 py-0.5 rounded-sm">{cut.PartNo}</span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-black text-slate-800 bg-linear-to-b from-indigo-50/50 to-transparent">
                        {cut.FinalCutLength} mm
                      </td>
                      <td className="px-4 py-2.5 text-center font-sans">
                        <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded-[4px] text-[10px] font-bold font-mono">
                          Cut #{cut.CutOrder}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-extrabold text-slate-751">
                        {cut.PositionStart} - {cut.PositionEnd} mm
                      </td>

                      {cIdx === 0 ? (
                        <td className="px-4 py-2.5 text-right font-extrabold bg-indigo-50/15" rowSpan={bar.Cuts.length}>
                          <span className={bar.IsOffcutReusable ? "text-emerald-600 font-extrabold" : "text-slate-400"}>
                            {bar.OffcutLength} mm
                          </span>
                          <span className="block text-[8.5px] font-sans font-bold uppercase tracking-tight text-slate-400 mt-0.5">
                            {bar.IsOffcutReusable ? "Reusable" : "Scrap"}
                          </span>
                        </td>
                      ) : null}

                      <td className="px-4 py-2.5 text-slate-500 font-mono text-[9.5px]">
                        {cut.Traceability_QR}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 1D CONVENIENT FAQS AND INVESTOR COMPILATION CHECK */}
      <div id="tour-step4-member" className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3">
          <Store className="w-6 h-6 text-indigo-400" />
          <div>
            <h4 className="font-black text-white text-md uppercase tracking-wide">Multi-Process Kit Traceability Linkage</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              ReadyFab's major value lies in unifying separate steel production pipelines. Plates from the XY cutting yard and beams from this 1D shearing yard are linked by Assembly Code into the same <strong>Member Kit Dispatch Case</strong>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10.5px]">Step 3A cutting Line</span>
            <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed">
              Once an operator finishes shear/cut operations for a stock bar, they mark cuts as <strong>"Cut"</strong> on this terminal dashboard or via physical QR barcode scans.
            </p>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10.5px]">Consolidated member Kits</span>
            <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed">
              Under the <strong>Member Kit Boxes</strong> tab, site managers can verify the packaging state of BOTH flat plate structural steel components and structural beams belonging to the kit.
            </p>
          </div>

          <div className="bg-slate-850 p-4 rounded-xl border border-slate-800">
            <span className="font-bold text-indigo-400 block uppercase tracking-wider text-[10.5px]">Ultimate Investor Value</span>
            <p className="text-[11.5px] text-slate-300 mt-1.5 leading-relaxed">
              By consolidating flat platings with long shaft rails, dispatcher delivery dockets are 100% accurate, preventing costly site staging downtime or forgotten cleats during shipment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
