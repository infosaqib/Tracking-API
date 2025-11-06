export interface AgentSession {
  id: string;
  createdAt: number;
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
  sampleSow: string;
  serviceName: string;
  serviceDescription: string;
  phase: 'review' | 'interview' | 'summary' | 'complete';
  collectedInfo: Record<string, string>;
}

export interface StartResponse {
  id: string;
  questionKey: string;
  question: string;
  remaining: number;
  sampleSow: string;
}

export interface AnswerRequest {
  id: string;
  questionKey: string;
  answer: string;
}

export interface AnswerResponse {
  id: string;
  done: boolean;
  next?: {
    questionKey: string;
    question: string;
    remaining: number;
  };
}

export interface GenerateResponse {
  id: string;
  markdown: string;
}

export interface InterviewDecision {
  done: boolean;
  question?: string;
}
