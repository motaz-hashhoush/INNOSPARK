import type { Challenge, Match, Project } from '../src/app/models/interfaces';
import { USERS } from './helpers';

/** A published project supervised by USERS.supervisor, with LLM-generated Arabic copy. */
export const PROJECT: Project = {
  id: 10,
  title: 'Smart Irrigation Controller',
  title_en: 'Smart Irrigation Controller',
  title_ar: 'وحدة تحكم ري ذكية',
  summary: 'IoT irrigation system that cuts water usage by 40%.',
  description_en: 'IoT irrigation system that cuts water usage by 40%.',
  description_ar: 'نظام ري بإنترنت الأشياء يقلل استهلاك المياه بنسبة 40%.',
  problem: 'Farms over-irrigate because soil moisture is not measured.',
  value_proposition: 'Sensor-driven scheduling.',
  sector: 'agriculture',
  team_members: [{ name: 'Lina', role: 'Lead', email: 'lina@stu.najah.edu' }],
  supervisor_id: USERS.supervisor.id,
  technical_outputs: 'ESP32 firmware + dashboard',
  development_needs: 'Field pilot',
  attachment_url: '',
  readiness_level: 'prototype',
  status: 'submitted',
  approval_status: 'approved',
  created_by: USERS.admin.id,
  created_at: '2026-01-10T00:00:00Z',
  updated_at: '2026-01-10T00:00:00Z',
  files: [],
};

export const PENDING_PROJECT: Project = {
  ...PROJECT,
  id: 11,
  title: 'Solar Water Pump',
  title_en: undefined,
  title_ar: undefined,
  description_en: undefined,
  description_ar: undefined,
  approval_status: 'pending',
};

export const CHALLENGE: Challenge = {
  id: 20,
  company_id: USERS.company.id,
  title: 'Reduce water waste on olive farms',
  description: 'We need a low-cost way to schedule irrigation from soil data.',
  sector: 'agriculture',
  priorities: 'Low cost',
  expected_outputs: 'Pilot on 3 farms',
  budget: 0,
  is_public: true,
  status: 'open',
  created_at: '2026-02-01T00:00:00Z',
};

export const MATCH: Match = {
  id: 30,
  project_id: PROJECT.id,
  challenge_id: CHALLENGE.id,
  similarity_score: 0.87,
  match_reason: 'Both target sensor-driven irrigation scheduling on small farms.',
  status: 'suggested',
  created_at: '2026-02-02T00:00:00Z',
  project_title: PROJECT.title,
  project_sector: PROJECT.sector,
  challenge_title: CHALLENGE.title,
};
