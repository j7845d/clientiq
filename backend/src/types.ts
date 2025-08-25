
export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
}

export interface CompetitorReport {
  text: string;
  sources: GroundingChunk[];
}

export interface PitchContent {
    text: string;
}

export interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  status: 'New Lead' | 'Contacted' | 'Follow-up Needed' | 'Proposal Sent' | 'Closed - Won' | 'Closed - Lost';
  value: number;
  lastContact: string; // ISO date string
  userId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
}

export interface EmailValidationResult {
    status: 'Valid' | 'Invalid Syntax' | 'Risky - Disposable' | 'Risky - Role-based' | string;
    reason: string;
}

export interface RowValidationResult {
    originalIndex: number;
    isValid: boolean;
    issues: string[];
}
