-- =========================================================================
-- ATS (APPLICANT TRACKING SYSTEM) - POSTGRESQL DDL SCHEMA
-- Compatible with Draw.io SQL Import (Arrange -> Insert -> Advanced -> SQL)
-- Standard: PostgreSQL 3NF Normalized Schema with Foreign Key Constraints
-- =========================================================================

-- 1. USERS: Internal system accounts (Admin, HR Recruiter, Hiring Manager)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(30) DEFAULT 'HR',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. JOBS: Job requisitions, requirements, and hiring quotas
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  creator_id INT NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(150) DEFAULT 'Ho Chi Minh',
  employment_type VARCHAR(50) DEFAULT 'Full-time',
  requirements_jd TEXT NOT NULL,
  min_experience_years INT DEFAULT 0,
  required_skills TEXT DEFAULT '[]',
  target_headcount INT DEFAULT 1,
  max_active_interviews INT DEFAULT 3,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT now()
);

-- 3. CANDIDATES: Master applicant directory & deduplication registry
CREATE TABLE candidates (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  cv_extracted_name VARCHAR(255),
  cv_extracted_email VARCHAR(255),
  cv_extracted_phone VARCHAR(50),
  cv_file_hash VARCHAR(64),
  experience_years INT DEFAULT 0,
  parsed_skills TEXT DEFAULT '[]',
  parsed_education TEXT DEFAULT '[]',
  parsed_experience TEXT DEFAULT '[]',
  certificates TEXT DEFAULT '[]',
  cv_file_url VARCHAR(500) NOT NULL,
  cv_text TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. APPLICATIONS: Recruitment pipeline instances, AI match score & Kanban stages
CREATE TABLE applications (
  id SERIAL PRIMARY KEY,
  candidate_id INT NOT NULL REFERENCES candidates(id),
  job_id INT NOT NULL REFERENCES jobs(id),
  source VARCHAR(50) DEFAULT 'CAREER_SITE',
  current_stage VARCHAR(30) DEFAULT 'NEW',
  ai_match_score NUMERIC(5,2),
  ai_match_rationale TEXT,
  ai_matched_skills TEXT DEFAULT '[]',
  ai_missing_skills TEXT DEFAULT '[]',
  stage_updated_at TIMESTAMP DEFAULT now(),
  email_scheduled_at TIMESTAMP,
  is_email_sent BOOLEAN DEFAULT false,
  is_interview_invite_sent BOOLEAN DEFAULT false,
  is_telegram_notified BOOLEAN DEFAULT false,
  repooled_from_id INT,
  is_starred BOOLEAN DEFAULT false,
  is_viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP,
  interview_date TIMESTAMP,
  interview_format VARCHAR(20) DEFAULT 'ONLINE',
  interview_location VARCHAR(255),
  interview_notes TEXT,
  interview_interviewer_notes TEXT,
  interview_post_notes TEXT,
  interview_email_option VARCHAR(30) DEFAULT 'AUTO_N8N',
  custom_email_subject VARCHAR(255),
  custom_email_body TEXT,
  rejection_reason VARCHAR(255),
  contact_mismatch_level VARCHAR(20) DEFAULT 'NONE',
  contact_mismatch_note TEXT,
  duplicate_warning_app_id INT,
  duplicate_warning_note TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 5. EVALUATIONS: Interview Scorecards (Technical 40%, Communication 30%, Culture 30%)
CREATE TABLE evaluations (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications(id),
  evaluator_id INT NOT NULL REFERENCES users(id),
  round VARCHAR(100) DEFAULT 'Round 1 - Technical Interview',
  technical_score INT NOT NULL,
  communication_score INT NOT NULL,
  cultural_fit_score INT NOT NULL,
  overall_score NUMERIC(3,2),
  recommendation VARCHAR(30) DEFAULT 'HIRE',
  level_recommendation VARCHAR(30),
  strengths TEXT,
  weaknesses TEXT,
  technical_notes TEXT,
  communication_notes TEXT,
  culture_notes TEXT,
  hire_reason TEXT,
  comments TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. AUDIT_LOGS: State transitions & system audit trail
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  application_id INT NOT NULL REFERENCES applications(id),
  user_id INT REFERENCES users(id),
  from_stage VARCHAR(30),
  to_stage VARCHAR(30) NOT NULL,
  action VARCHAR(50) NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT now()
);
