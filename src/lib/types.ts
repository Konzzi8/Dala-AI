export type RiskLevel = "high" | "medium" | "low";

export type RiskFlag = {
  id: string;
  level: RiskLevel;
  code: string;
  message: string;
};

export type DocumentSlot = {
  name: string;
  received: boolean;
};

export type ApprovalSlot = {
  type: string;
  received: boolean;
};

export type ArchivedEmail = {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  bodySnippet: string;
};

export type Shipment = {
  id: string;
  reference: string;
  containerNumbers: string[];
  blNumber?: string;
  eta?: string;
  freeTimeEnd?: string;
  clientName?: string;
  origin?: string;
  destination?: string;
  documents: DocumentSlot[];
  approvals: ApprovalSlot[];
  customsStatus?: "cleared" | "held" | "pending" | "unknown";
  rateConfirmed?: boolean;
  notes?: string;
  emails: ArchivedEmail[];
  risks: RiskFlag[];
  priorityScore: number;
  createdAt: string;
  updatedAt: string;
};

export type ParsedEmailExtraction = {
  reference?: string;
  containerNumbers?: string[];
  blNumber?: string;
  eta?: string;
  freeTimeEnd?: string;
  clientName?: string;
  origin?: string;
  destination?: string;
  documents?: { name: string; received?: boolean }[];
  approvals?: { type: string; received?: boolean }[];
  customsStatus?: Shipment["customsStatus"];
  rateConfirmed?: boolean;
  notes?: string;
};

export type StoreShape = {
  shipments: Shipment[];
  lastIngestId: string;
};
