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

export const DEPARTMENT_ROLE_SUGGESTIONS: Record<Department, string[]> = {
  Architecture: ['architectural designer', 'urban designer', '3d visualizer', 'interior designer'],
  Biotechnology: ['biotech researcher', 'lab analyst', 'bioinformatics learner', 'quality assurance intern'],
  'BRAC Business School': ['product manager', 'business analyst', 'marketing strategist', 'entrepreneur'],
  'BRAC James P Grant School of Public Health': ['public health researcher', 'policy analyst', 'health communicator', 'epidemiology learner'],
  'Computer Science and Engineering': ['software engineer', 'frontend developer', 'backend developer', 'ai/ml engineer'],
  'Economics and Social Sciences': ['economics researcher', 'policy analyst', 'development practitioner', 'data analyst'],
  'Electrical and Electronic Engineering': ['embedded systems engineer', 'robotics builder', 'power systems learner', 'iot developer'],
  'English and Humanities': ['content strategist', 'technical writer', 'communications specialist', 'research assistant'],
  'Mathematics and Natural Sciences': ['data scientist', 'quantitative analyst', 'research assistant', 'math tutor'],
  Microbiology: ['microbiology researcher', 'lab assistant', 'quality control analyst', 'clinical research intern'],
  Pharmacy: ['pharmacy intern', 'clinical researcher', 'drug safety analyst', 'healthcare content writer'],
  'School of Law': ['legal researcher', 'policy advocate', 'compliance analyst', 'legal consultant'],
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
