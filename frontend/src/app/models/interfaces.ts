export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'supervisor' | 'company' | 'evaluator' | 'admin';
  language_pref: string;
}

export interface TeamMember {
  name: string;
  role: string;
  email: string;
}

export interface ProjectFile {
  id: number;
  file_name: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
}

export interface Project {
  id: number;
  title: string;
  summary: string;
  problem: string;
  value_proposition: string;
  sector: string;
  team_members: TeamMember[];
  supervisor_id: number;
  technical_outputs: string;
  development_needs: string;
  attachment_url: string;
  readiness_level: 'concept' | 'prototype' | 'pilot_ready';
  status: 'submitted' | 'under_review' | 'incubation' | 'partnership' | 'marketed';
  created_by: number;
  created_at: string;
  updated_at: string;
  files: ProjectFile[];
  dspace_uuid?: string;
  collection?: string;
}

export interface Challenge {
  id: number;
  company_id: number;
  title: string;
  description: string;
  sector: string;
  priorities: string;
  expected_outputs: string;
  budget: number;
  is_public: boolean;
  status: 'open' | 'matched' | 'closed';
  created_at: string;
}

export interface Match {
  id: number;
  project_id: number;
  challenge_id: number;
  similarity_score: number;
  status: 'suggested' | 'accepted' | 'rejected';
  created_at: string;
  project_title?: string;
  project_sector?: string;
  challenge_title?: string;
}

export interface Notification {
  id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface PipelineStage {
  stage: string;
  count: number;
  projects: { id: number; title: string; sector: string; readiness: string }[];
}
