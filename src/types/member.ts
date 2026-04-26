export interface Member {
  id: string;
  slug: string;
  name: string;
  student_id?: string;
  member_type?: 'student' | 'alumni';
  joined_semester?: string;
  residential_semester?: string;
  residential_semester_public?: boolean;
  current_semester?: string;
  expected_graduation_semester?: string;
  alumni_work_sector?: 'academia' | 'industry';
  alumni_field_alignment?: 'own_field' | 'other_field';
  email?: string;
  bracu_email?: string;
  website?: string | null;
  department?: string;
  batch?: string;
  roles: string[];
  interests: string[];
  open_to_hire?: boolean;
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

export const ROLE_OPTIONS = [
  // Engineering & Tech
  'software engineer',
  'frontend developer',
  'backend developer',
  'full-stack developer',
  'mobile developer',
  'ai/ml engineer',
  'data scientist',
  'data analyst',
  'devops engineer',
  'cybersecurity analyst',
  'embedded systems engineer',
  'iot developer',
  'robotics engineer',
  'game developer',
  // Design & Creative
  'ui/ux designer',
  'graphic designer',
  'product designer',
  'architectural designer',
  '3d visualizer',
  'content creator',
  'technical writer',
  'communications specialist',
  // Business & Management
  'product manager',
  'project manager',
  'business analyst',
  'marketing strategist',
  'entrepreneur',
  'startup founder',
  // Research & Science
  'researcher',
  'policy analyst',
  'public health researcher',
  'biotech researcher',
  'lab analyst',
  'clinical researcher',
  'quantitative analyst',
  'bioinformatics engineer',
  // Legal & Policy
  'legal researcher',
  'compliance analyst',
  'policy advocate',
  // Other
  'economics researcher',
  'development practitioner',
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

export const DEPARTMENT_ROLE_SUGGESTIONS: Record<Department, string[]> = {
  Architecture: ['architectural designer', '3d visualizer', 'product designer', 'ui/ux designer', 'project manager', 'content creator'],
  Biotechnology: ['biotech researcher', 'lab analyst', 'bioinformatics engineer', 'data analyst', 'clinical researcher', 'public health researcher'],
  'BRAC Business School': ['product manager', 'business analyst', 'marketing strategist', 'entrepreneur', 'startup founder', 'data analyst', 'project manager'],
  'BRAC James P Grant School of Public Health': ['public health researcher', 'policy analyst', 'researcher', 'data analyst', 'communications specialist', 'development practitioner'],
  'Computer Science and Engineering': ['software engineer', 'frontend developer', 'backend developer', 'full-stack developer', 'ai/ml engineer', 'mobile developer', 'data scientist', 'devops engineer', 'cybersecurity analyst', 'game developer', 'product manager'],
  'Economics and Social Sciences': ['economics researcher', 'policy analyst', 'data analyst', 'development practitioner', 'business analyst', 'researcher'],
  'Electrical and Electronic Engineering': ['embedded systems engineer', 'iot developer', 'robotics engineer', 'software engineer', 'data analyst', 'devops engineer'],
  'English and Humanities': ['technical writer', 'content creator', 'communications specialist', 'researcher', 'policy analyst', 'marketing strategist'],
  'Mathematics and Natural Sciences': ['data scientist', 'quantitative analyst', 'researcher', 'ai/ml engineer', 'data analyst', 'bioinformatics engineer'],
  Microbiology: ['lab analyst', 'clinical researcher', 'biotech researcher', 'public health researcher', 'researcher', 'data analyst'],
  Pharmacy: ['clinical researcher', 'lab analyst', 'public health researcher', 'researcher', 'data analyst', 'compliance analyst'],
  'School of Law': ['legal researcher', 'policy advocate', 'compliance analyst', 'policy analyst', 'researcher', 'communications specialist'],
};

export const DEPARTMENT_INTEREST_SUGGESTIONS: Record<Department, string[]> = {
  Architecture: ['sustainable design', 'urban innovation', 'heritage conservation', 'community planning'],
  Biotechnology: ['genomics', 'biomedical innovation', 'synthetic biology', 'public health tech'],
  'BRAC Business School': ['fintech', 'startup growth', 'product strategy', 'business intelligence'],
  'BRAC James P Grant School of Public Health': ['epidemiology', 'health equity', 'health systems', 'community health'],
  'Computer Science and Engineering': ['open source', 'artificial intelligence', 'cybersecurity', 'competitive programming'],
  'Economics and Social Sciences': ['public policy', 'development economics', 'social entrepreneurship', 'data-driven policy'],
  'Electrical and Electronic Engineering': ['robotics & hardware', 'iot', 'renewable energy', 'embedded systems'],
  'English and Humanities': ['digital media', 'storytelling', 'research communication', 'education'],
  'Mathematics and Natural Sciences': ['applied mathematics', 'data modeling', 'scientific computing', 'research methods'],
  Microbiology: ['infectious diseases', 'lab research', 'biotech innovation', 'public health'],
  Pharmacy: ['clinical pharmacy', 'drug development', 'healthcare innovation', 'patient safety'],
  'School of Law': ['human rights', 'tech policy', 'legal tech', 'constitutional law'],
};
