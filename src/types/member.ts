export interface Member {
  id: string;
  slug: string;
  name: string;
  email?: string;
  bracu_email?: string;
  website: string;
  department?: string;
  batch?: string;
  roles: string[];
  interests: string[];
  profile_pic?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  connections: string[];
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  fromId: string;
  toId: string;
}

export const ROLE_OPTIONS = [
  'engineering',
  'design',
  'product',
  'ai/ml',
  'research',
  'data science',
  'cybersecurity',
  'mobile dev',
  'game dev',
  'entrepreneurship',
  'content creation',
] as const;

export type Role = (typeof ROLE_OPTIONS)[number];

export const DEPARTMENT_OPTIONS = [
  'Architecture',
  'Biotechnology',
  'BRAC Business School',
  'BRAC James P Grant School of Public Health',
  'Computer Science and Engineering',
  'Economics and Social Sciences',
  'Electrical and Electronic Engineering',
  'English and Humanities',
  'Mathematics and Natural Sciences',
  'Microbiology',
  'Pharmacy',
  'School of Law',
] as const;

export type Department = (typeof DEPARTMENT_OPTIONS)[number];

export const INTEREST_OPTIONS = [
  'social impact & ngos',
  'robotics & hardware',
  'space & aerospace',
  'public health',
  'sustainability & climate',
  'fintech',
  'edtech',
  'artificial intelligence',
  'competitive programming',
  'hackathons',
  'open source',
  'debating & mun',
  'community service',
  'saas',
  'web3 & blockchain',
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number];
