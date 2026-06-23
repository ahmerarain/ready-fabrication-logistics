export type PartStatus = 'Pending' | 'Placed' | 'Missing' | 'Exception';

export interface Part {
  Part_ID: string;
  Assembly_Mark: string;
  Thickness: number;
  RF_BIN: string;
  RF_STAGE: string;
  DXF_Filename: string;
  Status: PartStatus;
  
  // Phase 3 fields
  Material?: string;
  Drawing_Ref?: string;
  Grid?: string;
  Level?: string;
  Zone?: string;
  Sequence?: string;
  Site_Location?: string;
  Weight_Kg?: number;
  QR_Code?: string;
  Exception_Type?: string;
  Operator_Note?: string;
  
  // DXF Geometry Integration (Phase 5)
  Shape?: string;
  Width?: number;
  Height?: number;
  Area?: number;
  Holes?: string;
  Slots?: string;
  Rotation?: number;
  COG?: string;
  Qty?: number;
}

export interface BoxProgress {
  Assembly_Mark: string;
  BoxName: string;
  TotalParts: number;
  PlacedParts: number;
  IsCompleted: boolean;
  Parts: Part[];
}

export interface DeliveryDocket {
  DocketNumber: string;
  Assembly_Mark: string;
  BoxName: string;
  DateGenerated: string;
  ReceivedBy?: string;
  Notes?: string;
  Parts: Part[];
}
