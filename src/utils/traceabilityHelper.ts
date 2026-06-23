import { Part } from "../types";

export function enrichPartWithPhase3(part: Part): Part {
  // Ensure we don't clobber any existing manually set properties
  const material = part.Material || "Grade 350 Structural Steel";
  
  // Design intelligent defaults depending on the Assembly Mark
  const assy = part.Assembly_Mark || "";
  let drawingRef = part.Drawing_Ref;
  if (!drawingRef) {
    if (assy.includes("A6")) {
      drawingRef = "WD-COL-A6";
    } else if (assy.includes("B1")) {
      drawingRef = "WD-COL-B1";
    } else if (assy.includes("R3")) {
      drawingRef = "WD-RAF-R3";
    } else if (assy.includes("B10")) {
      drawingRef = "WD-BRC-B10";
    } else {
      drawingRef = "WD-GEN-REF";
    }
  }

  let grid = part.Grid;
  if (!grid) {
    if (assy.includes("A6")) grid = "A6-Row 4";
    else if (assy.includes("B1")) grid = "B1-Row 1";
    else if (assy.includes("R3")) grid = "C4-Truss Row 2";
    else if (assy.includes("B10")) grid = "A4-X Bracing";
    else grid = "D2-Girt Frame";
  }

  let level = part.Level;
  if (!level) {
    if (assy.includes("Rafter") || assy.includes("R3")) {
      level = "Roof Level (L2)";
    } else if (assy.includes("Brace") || assy.includes("B10")) {
      level = "Mezzanine Level (L1.5)";
    } else {
      level = "Ground Floor (L1)";
    }
  }

  let zone = part.Zone;
  if (!zone) {
    if (assy.includes("Column")) {
      zone = "Zone A (Heavy Portal Frames)";
    } else if (assy.includes("Rafter")) {
      zone = "Zone B (Apex Rafter Spans)";
    } else {
      zone = "Zone C (Wind Girts & Bracing)";
    }
  }

  let sequence = part.Sequence;
  if (!sequence) {
    if (assy.includes("A6")) sequence = "SEQ-01 (Primary Anchored Columns)";
    else if (assy.includes("B1")) sequence = "SEQ-02 (Perimeter Framing)";
    else if (assy.includes("R3")) sequence = "SEQ-03 (Roof Structural Apex)";
    else sequence = "SEQ-04 (Braced Stabilizers)";
  }

  let siteLocation = part.Site_Location;
  if (!siteLocation) {
    if (assy.includes("Column")) {
      siteLocation = "East Portal Bay Axis-A";
    } else if (assy.includes("Rafter")) {
      siteLocation = "Central Roof Truss Connection";
    } else {
      siteLocation = "West Portal Cross Bracing Assembly";
    }
  }

  let weightKg = part.Weight_Kg;
  if (!weightKg) {
    // Generate weight based on thickness with a semi-random physical coordinate modifier
    const numericSuffix = parseInt(part.Part_ID.replace(/\D/g, "")) || 100;
    const factor = (numericSuffix % 5) + 3; // 3 to 7
    weightKg = Number((part.Thickness * factor * 0.42).toFixed(1));
  }

  const qrCode = part.QR_Code || `RF-QR-${part.Part_ID}-${assy.toUpperCase()}`;

  // If status is Exception, assign standard Exception types requested: missing tag, wrong box, duplicate part, skipped part, nest exception
  let exceptionType = part.Exception_Type;
  if (part.Status === "Missing" && !exceptionType) {
    exceptionType = "missing tag";
  } else if (part.Status === "Exception" && !exceptionType) {
    exceptionType = "nest exception";
  }

  return {
    ...part,
    Material: material,
    Drawing_Ref: drawingRef,
    Grid: grid,
    Level: level,
    Zone: zone,
    Sequence: sequence,
    Site_Location: siteLocation,
    Weight_Kg: weightKg,
    QR_Code: qrCode,
    Exception_Type: exceptionType,
  };
}

export function enrichPartsList(parts: Part[]): Part[] {
  return parts.map(enrichPartWithPhase3);
}
