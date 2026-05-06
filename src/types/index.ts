export type ResourceType = 'link' | 'video' | 'audio' | 'note' | 'ai';
export type ResourceStatus = 'processing' | 'ready';

export interface Resource {
  id: string;
  type: ResourceType;
  url?: string;
  title: string;
  tags: string[];
  note?: string;
  aiSummary?: string;
  keyPoints?: string[];
  createdAt: string;
  status: ResourceStatus;
  projectIds?: string[];
  processed?: boolean; // Flag to mark resources as processed/managed by user
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  resourceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type Tone = 'formal' | 'casual' | 'técnico' | 'persuasivo';

export interface UserProfile {
  name: string;
  company: string;
  industry: string;
  website: string;
  tone: Tone;
  language: string;
  audience: string;
  audiencePains: string;
  preferredFormats: string[];
  preferredLength: 'corto' | 'medio' | 'largo';
  keywords: string[];
  bannedTopics: string[];
  styleExamples: string;
  email?: string; // Optional for backwards compatibility
}

export interface Feedback {
  id: string;
  resourceIds?: string[];
  promptUsed: string;
  output: string;
  contentType: string;
  rating: 'up' | 'down';
  adjustmentNote?: string;
  timestamp: string;
}

export type Theme = 'dark' | 'light';
