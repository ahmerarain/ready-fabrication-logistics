import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Seed sample/mock parts include some default geometry for baseline and DXF parser output datasets
const sampleParts = [
  { Part_ID: "PL-101", Assembly_Mark: "CH-M01", Thickness: 10, RF_BIN: "BIN-21", RF_STAGE: "STAGE-1B", DXF_Filename: "PL-101_10mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Rect", Width: 200, Height: 300, Area: 60000, Holes: "4x d18mm", Slots: "None", Rotation: 0, COG: "100,150", Qty: 1 },
  { Part_ID: "PL-102", Assembly_Mark: "CH-M01", Thickness: 10, RF_BIN: "BIN-21", RF_STAGE: "STAGE-1B", DXF_Filename: "PL-102_10mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Rect", Width: 200, Height: 300, Area: 60000, Holes: "4x d18mm", Slots: "None", Rotation: 0, COG: "100,150", Qty: 1 },
  { Part_ID: "PL-103", Assembly_Mark: "CH-M01", Thickness: 12, RF_BIN: "BIN-22", RF_STAGE: "STAGE-1B", DXF_Filename: "PL-103_12mm.dxf", Status: "Placed", Exception_Type: "", Operator_Note: "", Shape: "Baseplate", Width: 300, Height: 450, Area: 135000, Holes: "6x d20mm", Slots: "None", Rotation: 90, COG: "150,225", Qty: 1 },
  { Part_ID: "PL-104", Assembly_Mark: "CH-M01", Thickness: 12, RF_BIN: "BIN-22", RF_STAGE: "STAGE-1B", DXF_Filename: "PL-104_12mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Baseplate", Width: 300, Height: 450, Area: 135000, Holes: "6x d20mm", Slots: "None", Rotation: 90, COG: "150,225", Qty: 1 },
  { Part_ID: "PL-105", Assembly_Mark: "CH-M01", Thickness: 16, RF_BIN: "BIN-25", RF_STAGE: "STAGE-1B", DXF_Filename: "PL-105_16mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Splicer Plate", Width: 180, Height: 360, Area: 64800, Holes: "8x d22mm", Slots: "2x slots", Rotation: 0, COG: "90,180", Qty: 1 },

  // Case study: CH-M02 is fully placed (for completed kit box demo item)
  { Part_ID: "PL-201", Assembly_Mark: "CH-M02", Thickness: 10, RF_BIN: "BIN-21", RF_STAGE: "STAGE-2A", DXF_Filename: "PL-201_10mm.dxf", Status: "Placed", Exception_Type: "", Operator_Note: "Gantry confirmed placement.", Shape: "Rect", Width: 160, Height: 240, Area: 38400, Holes: "4x d14mm", Slots: "None", Rotation: 0, COG: "80,120", Qty: 1 },
  { Part_ID: "PL-202", Assembly_Mark: "CH-M02", Thickness: 10, RF_BIN: "BIN-21", RF_STAGE: "STAGE-2A", DXF_Filename: "PL-202_10mm.dxf", Status: "Placed", Exception_Type: "", Operator_Note: "Gantry confirmed placement.", Shape: "Rect", Width: 160, Height: 240, Area: 38400, Holes: "4x d14mm", Slots: "None", Rotation: 0, COG: "80,120", Qty: 1 },
  { Part_ID: "PL-203", Assembly_Mark: "CH-M02", Thickness: 20, RF_BIN: "BIN-29", RF_STAGE: "STAGE-2A", DXF_Filename: "PL-203_20mm.dxf", Status: "Placed", Exception_Type: "", Operator_Note: "Manual override verified.", Shape: "Gusset", Width: 250, Height: 250, Area: 50000, Holes: "5x d18mm", Slots: "None", Rotation: 45, COG: "125,125", Qty: 1 },
  { Part_ID: "PL-204", Assembly_Mark: "CH-M02", Thickness: 20, RF_BIN: "BIN-29", RF_STAGE: "STAGE-2A", DXF_Filename: "PL-204_20mm.dxf", Status: "Placed", Exception_Type: "", Operator_Note: "Manual override verified.", Shape: "Gusset", Width: 250, Height: 250, Area: 50000, Holes: "5x d18mm", Slots: "None", Rotation: 45, COG: "125,125", Qty: 1 },

  // Case study: PL-301 in CH-R03 is "Missing" with operator note
  { Part_ID: "PL-301", Assembly_Mark: "CH-R03", Thickness: 8, RF_BIN: "BIN-11", RF_STAGE: "STAGE-3A", DXF_Filename: "PL-301_8mm.dxf", Status: "Missing", Exception_Type: "missing tag", Operator_Note: "Conveyor scanner tag read fault. Sent manual pick dispatch.", Shape: "End Plate", Width: 200, Height: 300, Area: 60000, Holes: "4x d18mm", Slots: "2x slots", Rotation: 15, COG: "100,150", Qty: 1 },
  { Part_ID: "PL-302", Assembly_Mark: "CH-R03", Thickness: 8, RF_BIN: "BIN-11", RF_STAGE: "STAGE-3A", DXF_Filename: "PL-302_8mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "End Plate", Width: 200, Height: 300, Area: 60000, Holes: "4x d18mm", Slots: "2x slots", Rotation: 15, COG: "100,150", Qty: 1 },
  { Part_ID: "PL-303", Assembly_Mark: "CH-R03", Thickness: 8, RF_BIN: "BIN-12", RF_STAGE: "STAGE-3A", DXF_Filename: "PL-303_8mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Triangle", Width: 150, Height: 150, Area: 11250, Holes: "3x d14mm", Slots: "None", Rotation: 0, COG: "50,50", Qty: 1 },
  { Part_ID: "PL-304", Assembly_Mark: "CH-R03", Thickness: 12, RF_BIN: "BIN-23", RF_STAGE: "STAGE-3A", DXF_Filename: "PL-304_12mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Rect", Width: 180, Height: 240, Area: 43200, Holes: "4x d16mm", Slots: "None", Rotation: 0, COG: "90,120", Qty: 1 },
  { Part_ID: "PL-305", Assembly_Mark: "CH-R03", Thickness: 12, RF_BIN: "BIN-23", RF_STAGE: "STAGE-3A", DXF_Filename: "PL-305_12mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Rect", Width: 180, Height: 240, Area: 43200, Holes: "4x d16mm", Slots: "None", Rotation: 0, COG: "90,120", Qty: 1 },
  { Part_ID: "PL-306", Assembly_Mark: "CH-R03", Thickness: 12, RF_BIN: "BIN-24", RF_STAGE: "STAGE-3A", DXF_Filename: "PL-306_12mm.dxf", Status: "Pending", Exception_Type: "", Operator_Note: "", Shape: "Rect", Width: 180, Height: 240, Area: 43200, Holes: "4x d16mm", Slots: "None", Rotation: 0, COG: "90,120", Qty: 1 },

  // Case study: PL-402 in CH-B10 has exception with notes
  { Part_ID: "PL-401", Assembly_Mark: "CH-B10", Thickness: 6, RF_BIN: "BIN-05", RF_STAGE: "STAGE-1A", DXF_Filename: "PL-401_6mm.dxf", Status: "Placed", Exception_Type: "", Operator_Note: "", Shape: "Rect", Width: 120, Height: 180, Area: 21600, Holes: "4x d14mm", Slots: "None", Rotation: 0, COG: "60,90", Qty: 1 },
  { Part_ID: "PL-402", Assembly_Mark: "CH-B10", Thickness: 6, RF_BIN: "BIN-05", RF_STAGE: "STAGE-1A", DXF_Filename: "PL-402_6mm.dxf", Status: "Exception", Exception_Type: "damaged plate", Operator_Note: "Conveyor drag buckle deform. Marked for QC scrap review.", Shape: "Rect", Width: 120, Height: 180, Area: 21600, Holes: "4x d14mm", Slots: "None", Rotation: 0, COG: "60,90", Qty: 1 },
];

let useFallback = false;
let db: any = null;
let fallbackParts: any[] = [];
const fallbackDbPath = path.resolve(process.cwd(), "workflow_db.json");

// Helper to save fallback JSON
async function saveFallback() {
  try {
    await fs.writeFile(fallbackDbPath, JSON.stringify(fallbackParts, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing fallback JSON database file:", err);
  }
}

// Helper to load fallback JSON
async function loadFallback() {
  try {
    const data = await fs.readFile(fallbackDbPath, "utf-8");
    const trimmed = data.trim();
    if (!trimmed) {
      throw new SyntaxError("Fallback JSON file is empty");
    }
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      throw new SyntaxError("Fallback JSON must be an array");
    }
    fallbackParts = parsed;
    console.log(`Loaded ${fallbackParts.length} records from fallback JSON database.`);
  } catch (err: any) {
    console.warn("Fallback JSON unavailable or invalid, re-seeding defaults:", err.message || err);
    fallbackParts = JSON.parse(JSON.stringify(sampleParts));
    await saveFallback();
  }
}

// Dynamically import sqlite3 safely
let sqlite3: any = null;

async function initFallbackDb() {
  useFallback = true;
  await loadFallback();
  console.log("JSON database engine online and synchronized.");
}

async function initializeDatabase() {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS parts (
        Part_ID TEXT PRIMARY KEY,
        Assembly_Mark TEXT NOT NULL,
        Thickness REAL NOT NULL,
        RF_BIN TEXT,
        RF_STAGE TEXT,
        DXF_Filename TEXT,
        Status TEXT NOT NULL DEFAULT 'Pending',
        Exception_Type TEXT DEFAULT '',
        Operator_Note TEXT DEFAULT '',
        Shape TEXT DEFAULT 'Rect',
        Width REAL DEFAULT 0,
        Height REAL DEFAULT 0,
        Area REAL DEFAULT 0,
        Holes TEXT DEFAULT 'None',
        Slots TEXT DEFAULT 'None',
        Rotation REAL DEFAULT 0,
        COG TEXT DEFAULT '',
        Qty INTEGER DEFAULT 1
      )
    `);
    console.log("Database table 'parts' verified/created.");

    // Migrate existing DB if needed to add new columns
    const colsToMigrate = [
      "ALTER TABLE parts ADD COLUMN Exception_Type TEXT DEFAULT ''",
      "ALTER TABLE parts ADD COLUMN Operator_Note TEXT DEFAULT ''",
      "ALTER TABLE parts ADD COLUMN Shape TEXT DEFAULT 'Rect'",
      "ALTER TABLE parts ADD COLUMN Width REAL DEFAULT 0",
      "ALTER TABLE parts ADD COLUMN Height REAL DEFAULT 0",
      "ALTER TABLE parts ADD COLUMN Area REAL DEFAULT 0",
      "ALTER TABLE parts ADD COLUMN Holes TEXT DEFAULT 'None'",
      "ALTER TABLE parts ADD COLUMN Slots TEXT DEFAULT 'None'",
      "ALTER TABLE parts ADD COLUMN Rotation REAL DEFAULT 0",
      "ALTER TABLE parts ADD COLUMN COG TEXT DEFAULT ''",
      "ALTER TABLE parts ADD COLUMN Qty INTEGER DEFAULT 1"
    ];

    for (const colSql of colsToMigrate) {
      try {
        await run(colSql);
      } catch (e) {
        // column may already exist
      }
    }

    // Seed database if it's currently empty
    const countRow = await get("SELECT COUNT(*) as count FROM parts");
    if (countRow?.count === 0) {
      console.log("Database empty. Seeding with default dataset...");
      for (const p of sampleParts) {
        await run(`
          INSERT INTO parts (
            Part_ID, Assembly_Mark, Thickness, RF_BIN, RF_STAGE, DXF_Filename, Status, Exception_Type, Operator_Note,
            Shape, Width, Height, Area, Holes, Slots, Rotation, COG, Qty
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          p.Part_ID, p.Assembly_Mark, p.Thickness, p.RF_BIN, p.RF_STAGE, p.DXF_Filename, p.Status, p.Exception_Type, p.Operator_Note,
          p.Shape, p.Width, p.Height, p.Area, p.Holes, p.Slots, p.Rotation, p.COG, p.Qty
        ]);
      }
      console.log(`Seeded ${sampleParts.length} sample records.`);
    }
  } catch (error) {
    console.error("Error setting up database table / seeds:", error);
  }
}

// Promisified SQL DB queries with inline JS processing emulating SQL queries if useFallback = true
const run = async (sql: string, params: any[] = []): Promise<any> => {
  if (useFallback) {
    const sqlNormalized = sql.replace(/\s+/g, " ").trim();
    if (sqlNormalized.includes("DELETE FROM parts")) {
      fallbackParts = [];
      await saveFallback();
      return { changes: 1 };
    }
    if (sqlNormalized.includes("UPDATE parts SET Assembly_Mark") || sqlNormalized.includes("UPDATE parts SET Assembly_Mark = ?")) {
      const partId = params[params.length - 1];
      const index = fallbackParts.findIndex(p => p.Part_ID === partId);
      if (index !== -1) {
        fallbackParts[index] = {
          ...fallbackParts[index],
          Assembly_Mark: params[0],
          Thickness: Number(params[1]) || 0,
          RF_BIN: params[2] || "",
          RF_STAGE: params[3] || "",
          DXF_Filename: params[4] || "",
          Status: params[5] || "Pending",
          Exception_Type: params[6] || "",
          Operator_Note: params[7] || "",
          Shape: params[8] !== undefined ? params[8] : (fallbackParts[index].Shape || "Rect"),
          Width: params[9] !== undefined ? Number(params[9]) : (fallbackParts[index].Width || 0),
          Height: params[10] !== undefined ? Number(params[10]) : (fallbackParts[index].Height || 0),
          Area: params[11] !== undefined ? Number(params[11]) : (fallbackParts[index].Area || 0),
          Holes: params[12] !== undefined ? params[12] : (fallbackParts[index].Holes || "None"),
          Slots: params[13] !== undefined ? params[13] : (fallbackParts[index].Slots || "None"),
          Rotation: params[14] !== undefined ? Number(params[14]) : (fallbackParts[index].Rotation || 0),
          COG: params[15] !== undefined ? params[15] : (fallbackParts[index].COG || ""),
          Qty: params[16] !== undefined ? Number(params[16]) : (fallbackParts[index].Qty || 1)
        };
        await saveFallback();
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (sqlNormalized.includes("INSERT INTO parts")) {
      const partId = params[0];
      const index = fallbackParts.findIndex(p => p.Part_ID === partId);
      const rowData = {
        Part_ID: partId,
        Assembly_Mark: params[1],
        Thickness: Number(params[2]) || 0,
        RF_BIN: params[3] || "",
        RF_STAGE: params[4] || "",
        DXF_Filename: params[5] || "",
        Status: params[6] || "Pending",
        Exception_Type: params[7] || "",
        Operator_Note: params[8] || "",
        Shape: params[9] !== undefined ? params[9] : "Rect",
        Width: params[10] !== undefined ? Number(params[10]) : 0,
        Height: params[11] !== undefined ? Number(params[11]) : 0,
        Area: params[12] !== undefined ? Number(params[12]) : 0,
        Holes: params[13] !== undefined ? params[13] : "None",
        Slots: params[14] !== undefined ? params[14] : "None",
        Rotation: params[15] !== undefined ? Number(params[15]) : 0,
        COG: params[16] !== undefined ? params[16] : "",
        Qty: params[17] !== undefined ? Number(params[17]) : 1
      };
      if (index === -1) {
        fallbackParts.push(rowData);
      } else {
        fallbackParts[index] = { ...fallbackParts[index], ...rowData };
      }
      await saveFallback();
      return { lastID: partId, changes: 1 };
    }
    if (sqlNormalized.includes("UPDATE parts SET Status") && sqlNormalized.includes("WHERE Part_ID")) {
      const [status, partId] = params;
      const index = fallbackParts.findIndex(p => p.Part_ID === partId);
      if (index !== -1) {
        fallbackParts[index].Status = status;
        await saveFallback();
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (sqlNormalized.includes("UPDATE parts SET Exception_Type") && sqlNormalized.includes("WHERE Part_ID")) {
      const [exceptionType, operatorNote, status, partId] = params;
      const index = fallbackParts.findIndex(p => p.Part_ID === partId);
      if (index !== -1) {
        fallbackParts[index].Exception_Type = exceptionType;
        fallbackParts[index].Operator_Note = operatorNote;
        fallbackParts[index].Status = status;
        await saveFallback();
        return { changes: 1 };
      }
      return { changes: 0 };
    }
    if (sqlNormalized.includes("UPDATE parts SET Status") && sqlNormalized.includes("WHERE Assembly_Mark")) {
      const [status, assemblyMark] = params;
      let changed = 0;
      fallbackParts.forEach(p => {
        if (p.Assembly_Mark === assemblyMark) {
          p.Status = status;
          changed++;
        }
      });
      if (changed > 0) {
        await saveFallback();
      }
      return { changes: changed };
    }
    return { changes: 0 };
  }

  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err: any) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

const all = async (sql: string, params: any[] = []): Promise<any[]> => {
  if (useFallback) {
    const sqlNormalized = sql.replace(/\s+/g, " ").trim();
    if (sqlNormalized.includes("SELECT * FROM parts")) {
      return [...fallbackParts].sort((a, b) => a.Part_ID.localeCompare(b.Part_ID));
    }
    if (sqlNormalized.includes("SELECT Assembly_Mark") || sqlNormalized.includes("GROUP BY Assembly_Mark")) {
      const groups: { [key: string]: { Assembly_Mark: string; count: number; placedCount: number } } = {};
      fallbackParts.forEach(p => {
        if (!groups[p.Assembly_Mark]) {
          groups[p.Assembly_Mark] = { Assembly_Mark: p.Assembly_Mark, count: 0, placedCount: 0 };
        }
        groups[p.Assembly_Mark].count++;
        if (p.Status === "Placed") {
          groups[p.Assembly_Mark].placedCount++;
        }
      });
      return Object.values(groups);
    }
    return [];
  }

  return new Promise((resolve, reject) => {
    db.all(sql, params, (err: any, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const get = async (sql: string, params: any[] = []): Promise<any> => {
  if (useFallback) {
    const sqlNormalized = sql.replace(/\s+/g, " ").trim();
    if (sqlNormalized.includes("COUNT(*) as count FROM parts")) {
      return { count: fallbackParts.length };
    }
    if (sqlNormalized.includes("SELECT COUNT(*) as totalParts") || sqlNormalized.includes("totalPlaced")) {
      const totalParts = fallbackParts.length;
      const totalPlaced = fallbackParts.filter(p => p.Status === "Placed").length;
      const distinctAssemblies = new Set(fallbackParts.map(p => p.Assembly_Mark));
      const totalBoxes = distinctAssemblies.size;
      return { totalParts, totalPlaced, totalBoxes };
    }
    if (sqlNormalized.includes("WHERE Part_ID")) {
      const partId = params[0];
      const item = fallbackParts.find(p => p.Part_ID === partId);
      return item || null;
    }
    return null;
  }

  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: any, row: any) => {
      if (err) reject(err);
      resolve(row);
    });
  });
};

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get all parts
app.get("/api/parts", async (req, res) => {
  try {
    const parts = await all("SELECT * FROM parts ORDER BY Part_ID ASC");
    res.json(parts);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to retrieve parts list", details: err.message });
  }
});

// 2. Import CSV data as JSON
app.post("/api/parts/import", async (req, res) => {
  try {
    const { parts, clearExisting } = req.body;
    if (!parts || !Array.isArray(parts)) {
      return res.status(400).json({ error: "Invalid payload: 'parts' must be an array" });
    }

    if (clearExisting) {
      await run("DELETE FROM parts");
      console.log("Cleared existing parts due to clearExisting instruction.");
    }

    let inserted = 0;
    let updated = 0;

    for (const part of parts) {
      if (!part.Part_ID) continue;
      
      const parsedThickness = parseFloat(part.Thickness) || 0;
      const binRef = part.RF_BIN || "";
      const stageInfo = part.RF_STAGE || "";
      const dxfFile = part.DXF_Filename || "";
      const exceptionType = part.Exception_Type || "";
      const operatorNote = part.Operator_Note || "";
      const allowedStatuses = ["Pending", "Placed", "Missing", "Exception"];
      const defaultStatus = allowedStatuses.includes(part.Status) ? part.Status : "Pending";

      const existing = await get("SELECT Assembly_Mark, Status, Exception_Type, Operator_Note FROM parts WHERE Part_ID = ?", [part.Part_ID]);
      
      if (existing) {
        // Update part parameters but preserve Status and Assembly_Mark if not explicitly supplied
        const preservedAssemblyMark = (part.Assembly_Mark !== undefined && part.Assembly_Mark !== "") ? part.Assembly_Mark : (existing.Assembly_Mark || "Unassigned");
        const preservedStatus = part.Status && allowedStatuses.includes(part.Status) ? part.Status : existing.Status;
        const preservedException = part.Exception_Type !== undefined ? part.Exception_Type : (existing.Exception_Type || "");
        const preservedNote = part.Operator_Note !== undefined ? part.Operator_Note : (existing.Operator_Note || "");
        
        await run(`
          UPDATE parts 
          SET Assembly_Mark = ?, Thickness = ?, RF_BIN = ?, RF_STAGE = ?, DXF_Filename = ?, Status = ?, 
              Exception_Type = ?, Operator_Note = ?, Shape = ?, Width = ?, Height = ?, Area = ?, 
              Holes = ?, Slots = ?, Rotation = ?, COG = ?, Qty = ?
          WHERE Part_ID = ?
        `, [
          preservedAssemblyMark, 
          parsedThickness, 
          binRef, 
          stageInfo, 
          dxfFile, 
          preservedStatus, 
          preservedException, 
          preservedNote,
          part.Shape || "Rect",
          part.Width || 0,
          part.Height || 0,
          part.Area || 0,
          part.Holes || "None",
          part.Slots || "None",
          part.Rotation || 0,
          part.COG || "",
          part.Qty || 1,
          part.Part_ID
        ]);
        updated++;
      } else {
        // Insert new part with "Unassigned" default Assembly_Mark if omitted
        const fallbackAssemblyMark = part.Assembly_Mark || "Unassigned";
        await run(`
          INSERT INTO parts (
            Part_ID, Assembly_Mark, Thickness, RF_BIN, RF_STAGE, DXF_Filename, Status, 
            Exception_Type, Operator_Note, Shape, Width, Height, Area, Holes, Slots, Rotation, COG, Qty
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          part.Part_ID, 
          fallbackAssemblyMark, 
          parsedThickness, 
          binRef, 
          stageInfo, 
          dxfFile, 
          defaultStatus, 
          exceptionType, 
          operatorNote,
          part.Shape || "Rect",
          part.Width || 0,
          part.Height || 0,
          part.Area || 0,
          part.Holes || "None",
          part.Slots || "None",
          part.Rotation || 0,
          part.COG || "",
          part.Qty || 1
        ]);
        inserted++;
      }
    }

    res.json({
      success: true,
      message: `Parsed parts: inserted ${inserted}, updated ${updated}.`,
      summary: { inserted, updated }
    });
  } catch (err: any) {
    console.error("Error during CSV JSON import:", err);
    res.status(500).json({ error: "Failed to import csv parts list", details: err.message });
  }
});

// 3. Update single part status
app.patch("/api/parts/:partId/status", async (req, res) => {
  try {
    const { partId } = req.params;
    const { Status } = req.body;

    const allowed = ["Pending", "Placed", "Missing", "Exception"];
    if (!allowed.includes(Status)) {
      return res.status(400).json({ error: "Status must be 'Pending', 'Placed', 'Missing', or 'Exception'" });
    }

    const result = await run("UPDATE parts SET Status = ? WHERE Part_ID = ?", [Status, partId]);
    if (result.changes === 0) {
      return res.status(404).json({ error: `Part with ID ${partId} not found` });
    }

    res.json({ success: true, partId, updatedStatus: Status });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update part status", details: err.message });
  }
});

// 3.5. Update single part exceptions and operator notes
app.patch("/api/parts/:partId/exception", async (req, res) => {
  try {
    const { partId } = req.params;
    const { Exception_Type, Operator_Note, Status } = req.body;

    const allowed = ["Pending", "Placed", "Missing", "Exception"];
    const targetStatus = Status && allowed.includes(Status) ? Status : "Exception";

    const result = await run(
      "UPDATE parts SET Exception_Type = ?, Operator_Note = ?, Status = ? WHERE Part_ID = ?",
      [Exception_Type || "", Operator_Note || "", targetStatus, partId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: `Part with ID ${partId} not found` });
    }

    res.json({ 
      success: true, 
      partId, 
      updatedExceptionType: Exception_Type || "", 
      updatedOperatorNote: Operator_Note || "",
      updatedStatus: targetStatus
    });
  } catch (err: any) {
    console.error("Error setting part exception parameters:", err);
    res.status(500).json({ error: "Failed to update part exception logging details", details: err.message });
  }
});

// 4. Update status for all parts of a whole Assembly (Box)
app.patch("/api/parts/box/:assemblyMark/status", async (req, res) => {
  try {
    const { assemblyMark } = req.params;
    const { Status } = req.body;

    const allowed = ["Pending", "Placed", "Missing", "Exception"];
    if (!allowed.includes(Status)) {
      return res.status(400).json({ error: "Status must be 'Pending', 'Placed', 'Missing', or 'Exception'" });
    }

    const result = await run("UPDATE parts SET Status = ? WHERE Assembly_Mark = ?", [Status, assemblyMark]);
    res.json({ success: true, assemblyMark, updatedStatus: Status, countAffected: result.changes });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update box state", details: err.message });
  }
});

// 5. Reset all parts to system sample seeds
app.post("/api/parts/seed", async (req, res) => {
  try {
    await run("DELETE FROM parts");
    for (const p of sampleParts) {
      await run(`
        INSERT INTO parts (Part_ID, Assembly_Mark, Thickness, RF_BIN, RF_STAGE, DXF_Filename, Status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [p.Part_ID, p.Assembly_Mark, p.Thickness, p.RF_BIN, p.RF_STAGE, p.DXF_Filename, p.Status]);
    }
    const currentParts = await all("SELECT * FROM parts ORDER BY Part_ID ASC");
    res.json({ success: true, message: "Database reset and seeded with default parts.", data: currentParts });
  } catch (err: any) {
    res.status(500).json({ error: "Database seeding failed", details: err.message });
  }
});

// 6. Clear all parts
app.post("/api/parts/reset", async (req, res) => {
  try {
    await run("DELETE FROM parts");
    res.json({ success: true, message: "All parts have been deleted. Database is clear." });
  } catch (err: any) {
    res.status(500).json({ error: "Database reset failed", details: err.message });
  }
});

// 7. Core KPIs stats
app.get("/api/stats", async (req, res) => {
  try {
    const counts = await get(`
      SELECT 
        COUNT(*) as totalParts,
        SUM(CASE WHEN Status = 'Placed' THEN 1 ELSE 0 END) as totalPlaced,
        COUNT(DISTINCT Assembly_Mark) as totalBoxes
      FROM parts
    `);

    // Fetch and calculate how many boxes are fully placed
    const boxes = await all(`
      SELECT Assembly_Mark, 
             COUNT(*) as count,
             SUM(CASE WHEN Status = 'Placed' THEN 1 ELSE 0 END) as placedCount
      FROM parts
      GROUP BY Assembly_Mark
    `);

    const completedBoxes = boxes.filter(b => b.count === b.placedCount).length;

    res.json({
      totalParts: counts?.totalParts || 0,
      totalPlaced: counts?.totalPlaced || 0,
      totalBoxes: counts?.totalBoxes || 0,
      completedBoxes
    });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to query system live stats", details: err.message });
  }
});

// Vite Middleware for development (port 3000 is externally bound)
async function setupViteServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated with Express.");
  } else {
    const distPath = path.resolve(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
    console.log("Serving static build files from /dist context.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`RF Member Kit Workflow server running on http://0.0.0.0:${PORT}`);
  });
}

async function startApp() {
  // Dynamically import sqlite3 safely inside an async startup scope
  try {
    const sqliteImport = await import("sqlite3");
    sqlite3 = sqliteImport.default || sqliteImport;
  } catch (e) {
    console.warn("sqlite3 could not be loaded. Switching seamlessly to high-compatibility JSON storage fallback.");
    useFallback = true;
  }

  // Initialize SQLite or Fallback Database
  if (!useFallback && sqlite3) {
    const dbPath = path.resolve(process.cwd(), "workflow.db");
    db = new sqlite3.Database(dbPath, async (err: any) => {
      if (err) {
        console.error("Error opening SQLite database, falling back to JSON storage:", err.message);
        await initFallbackDb();
      } else {
        console.log("Connected to the SQLite database at:", dbPath);
        await initializeDatabase();
      }
    });
  } else {
    await initFallbackDb();
  }

  // Set up Vite server and start listening
  await setupViteServer();
}

startApp();
