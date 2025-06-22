export interface AudioFile {
  file: File;
  type: "audio" | "transcript";
}

export interface PlanStep {
  id: string;
  label: string;
}

export interface ProcessingStage {
  id: string;
  name: string;
  status: "pending" | "processing" | "completed" | "error";
  progress: number;
  logs: string[];
  startTime?: number;
  endTime?: number;
  isExpanded?: boolean;
  details?: ProcessingDetails;
}

export interface ProcessingDetails {
  currentStep?: string;
  totalSteps?: number;
  currentStepIndex?: number;
  estimatedTimeRemaining?: number;
  intermediateResults?: any;
  metrics?: Record<string, any>;
}

export interface ConversationEvent {
  id: string;
  role: "teacher" | "student" | "system";
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
}

export interface ClassTask {
  id: string;
  name: string;
  description: string;
  startTime: number;
  endTime: number;
  events: ConversationEvent[];
  bloomAnalysis?: BloomAnalysis;
}

export interface BloomAnalysis {
  level:
    | "Remember"
    | "Understand"
    | "Apply"
    | "Analyze"
    | "Evaluate"
    | "Create";
  confidence: number;
  description: string;
  keywords: string[];
}

export interface ClassInfo {
  subject: string;
  level: string;
  knowledgePoints: string[];
  teachingObjectives: string[];
  curriculum: string;
  confidence: number;
}

export interface AnalysisResult {
  id: string;
  title: string;
  duration: number;
  classInfo: ClassInfo;
  tasks: ClassTask[];
  deepAnalysis: Record<string, boolean>;
}

export interface ShareSettings {
  url: string;
  password: string;
  expiresAt?: Date;
  allowDownload: boolean;
}
