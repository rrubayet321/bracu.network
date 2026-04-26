'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { submitJoinRequest } from '@/app/join/actions';
import {
  DEPARTMENT_OPTIONS,
  DEPARTMENT_INTEREST_SUGGESTIONS,
  DEPARTMENT_ROLE_SUGGESTIONS,
  type Department,
} from '@/types/member';
import { Upload, CheckCircle2, X, Check } from 'lucide-react';

const STORAGE_KEY = 'bracu_join_form_draft';
const MAX_TAG_LEN = 60;
const RATE_LIMIT_SECONDS = 60;

const SOCIAL_FIELDS = [
  {
    id: 'join-github',
    name: 'github' as const,
    label: 'GitHub',
    placeholder: 'https://github.com/username',
    validate: (v: string) => v.includes('github.com'),
  },
  {
    id: 'join-linkedin',
    name: 'linkedin' as const,
    label: 'LinkedIn',
    placeholder: 'https://linkedin.com/in/username',
    validate: (v: string) => v.includes('linkedin.com'),
  },
  {
    id: 'join-twitter',
    name: 'twitter' as const,
    label: 'X / Twitter',
    placeholder: 'https://x.com/username',
    validate: (v: string) => v.includes('x.com') || v.includes('twitter.com'),
  },
  {
    id: 'join-instagram',
    name: 'instagram' as const,
    label: 'Instagram',
    placeholder: 'https://instagram.com/username',
    validate: (v: string) => v.includes('instagram.com'),
  },
];

const STEPS = ['Required', 'About You', 'Roles & Interests', 'Social Links'];

function isValidUrl(value: string) {
  try { return Boolean(new URL(value)); } catch { return false; }
}

export default function JoinForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  // Form field state
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');
  const [memberType, setMemberType] = useState<'student' | 'alumni' | ''>('');
  const [studentId, setStudentId] = useState('');
  const [batch, setBatch] = useState('');
  const [residentialSemester, setResidentialSemester] = useState('');
  const [currentSemester, setCurrentSemester] = useState('');
  const [expectedGrad, setExpectedGrad] = useState('');
  const [bracuEmail, setBracuEmail] = useState('');
  const [email, setEmail] = useState('');
  const [socialValues, setSocialValues] = useState<Record<string, string>>({
    github: '', linkedin: '', twitter: '', instagram: '',
  });

  // Photo
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Tags
  const [roles, setRoles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [roleDraft, setRoleDraft] = useState('');
  const [interestDraft, setInterestDraft] = useState('');

  const formRef = useRef<HTMLFormElement>(null);

  // ── LocalStorage persistence ──────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.name) setName(d.name);
      if (d.website) setWebsite(d.website);
      if (d.selectedDepartment) setSelectedDepartment(d.selectedDepartment);
      if (d.memberType) setMemberType(d.memberType);
      if (d.studentId) setStudentId(d.studentId);
      if (d.batch) setBatch(d.batch);
      if (d.residentialSemester) setResidentialSemester(d.residentialSemester);
      if (d.currentSemester) setCurrentSemester(d.currentSemester);
      if (d.expectedGrad) setExpectedGrad(d.expectedGrad);
      if (d.bracuEmail) setBracuEmail(d.bracuEmail);
      if (d.email) setEmail(d.email);
      if (d.socialValues) setSocialValues(d.socialValues);
      if (d.roles) setRoles(d.roles);
      if (d.interests) setInterests(d.interests);
    } catch { /* ignore corrupt storage */ }
  }, []);

  useEffect(() => {
    if (success) { localStorage.removeItem(STORAGE_KEY); return; }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        name, website, selectedDepartment, memberType, studentId, batch,
        residentialSemester, currentSemester, expectedGrad, bracuEmail,
        email, socialValues, roles, interests,
      }));
    } catch { /* ignore storage errors */ }
  }, [name, website, selectedDepartment, memberType, studentId, batch,
    residentialSemester, currentSemester, expectedGrad, bracuEmail,
    email, socialValues, roles, interests, success]);

  // ── Rate limit countdown ──────────────────────────────────────────
  useEffect(() => {
    if (rateLimitCountdown <= 0) return;
    const id = setTimeout(() => setRateLimitCountdown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [rateLimitCountdown]);

  // ── Suggestions ──────────────────────────────────────────────────
  const roleSuggestions = useMemo(
    () => (selectedDepartment ? DEPARTMENT_ROLE_SUGGESTIONS[selectedDepartment] : []),
    [selectedDepartment],
  );
  const interestSuggestions = useMemo(
    () => (selectedDepartment ? DEPARTMENT_INTEREST_SUGGESTIONS[selectedDepartment] : []),
    [selectedDepartment],
  );

  // ── Photo helpers ─────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPhotoName(file.name);
    setPhotoSize(
      file.size >= 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`,
    );
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  // ── Tag helpers ───────────────────────────────────────────────────
  function normalizeTag(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, MAX_TAG_LEN);
  }

  function addTag(value: string, list: string[], setter: (next: string[]) => void) {
    const normalized = normalizeTag(value);
    if (!normalized || list.includes(normalized)) return;
    setter([...list, normalized]);
  }

  function removeTag(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.filter((item) => item !== value));
  }

  // ── Clear form ────────────────────────────────────────────────────
  function clearForm() {
    setName(''); setWebsite(''); setSelectedDepartment(''); setMemberType('');
    setStudentId(''); setBatch(''); setResidentialSemester(''); setCurrentSemester('');
    setExpectedGrad(''); setBracuEmail(''); setEmail('');
    setSocialValues({ github: '', linkedin: '', twitter: '', instagram: '' });
    setRoles([]); setInterests([]); setRoleDraft(''); setInterestDraft('');
    setPhotoName(null); setPhotoPreview(null); setPhotoSize(null);
    if (fileRef.current) fileRef.current.value = '';
    setErrors({}); setGlobalError(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Submit ────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rateLimitCountdown > 0) return;
    const form = e.currentTarget;
    const formData = new FormData(form);

    setErrors({});
    setGlobalError(null);

    startTransition(async () => {
      const result = await submitJoinRequest(formData);
      if ('success' in result) {
        setSuccess(true);
      } else if (typeof result.error === 'string') {
        if (result.error.toLowerCase().includes('too many')) {
          setRateLimitCountdown(RATE_LIMIT_SECONDS);
        }
        setGlobalError(result.error);
      } else {
        const fieldErrors = result.error as Record<string, string[]>;
        setErrors(fieldErrors);
        // Scroll to first error
        setTimeout(() => {
          const firstKey = Object.keys(fieldErrors)[0];
          if (!firstKey) return;
          const el =
            document.querySelector(`[name="${firstKey}"]`) ??
            document.querySelector(`#join-${firstKey.replace(/_/g, '-')}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
      }
    });
  }

  function fieldError(field: string) {
    const msgs = errors[field];
    return msgs && msgs.length > 0 ? (
      <span className="form-error">{msgs[0]}</span>
    ) : null;
  }

  function updateSocial(name: string, value: string) {
    setSocialValues((prev) => ({ ...prev, [name]: value }));
  }

  if (success) {
    return (
      <div className="success-card" id="join-success">
        <div className="success-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="24" cy="24" r="23" stroke="rgba(94,106,210,0.3)" strokeWidth="1.5" />
            <circle cx="24" cy="24" r="17" stroke="rgba(94,106,210,0.15)" strokeWidth="1" />
            {/* Node dots */}
            <circle cx="24" cy="8"  r="2.5" fill="#5e6ad2" opacity="0.9" />
            <circle cx="38" cy="18" r="2.5" fill="#5e6ad2" opacity="0.7" />
            <circle cx="38" cy="34" r="2.5" fill="#5e6ad2" opacity="0.5" />
            <circle cx="24" cy="40" r="2.5" fill="#5e6ad2" opacity="0.7" />
            <circle cx="10" cy="34" r="2.5" fill="#5e6ad2" opacity="0.5" />
            <circle cx="10" cy="18" r="2.5" fill="#5e6ad2" opacity="0.7" />
            {/* Edges */}
            <line x1="24" y1="8"  x2="38" y2="18" stroke="rgba(94,106,210,0.35)" strokeWidth="1" />
            <line x1="38" y1="18" x2="38" y2="34" stroke="rgba(94,106,210,0.35)" strokeWidth="1" />
            <line x1="38" y1="34" x2="24" y2="40" stroke="rgba(94,106,210,0.35)" strokeWidth="1" />
            <line x1="24" y1="40" x2="10" y2="34" stroke="rgba(94,106,210,0.35)" strokeWidth="1" />
            <line x1="10" y1="34" x2="10" y2="18" stroke="rgba(94,106,210,0.35)" strokeWidth="1" />
            <line x1="10" y1="18" x2="24" y2="8"  stroke="rgba(94,106,210,0.35)" strokeWidth="1" />
            {/* Center checkmark */}
            <circle cx="24" cy="24" r="7" fill="rgba(94,106,210,0.12)" stroke="#5e6ad2" strokeWidth="1.2" />
            <polyline points="20.5,24 23,26.5 27.5,21.5" stroke="#5e6ad2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
        </div>
        <h2 className="success-title">You&apos;re on the list!</h2>
        <p className="success-text">
          Your application has been submitted successfully.
          <br />
          We usually review within <strong>24–48 hours</strong>.
          <br />
          Once approved, you&apos;ll appear on bracu.network.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} ref={formRef} id="join-form" noValidate>

      {/* ── Progress steps ───────────────────────────── */}
      <div className="form-progress">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`form-progress-step${i === currentStep ? ' active' : i < currentStep ? ' done' : ''}`}
            onClick={() => setCurrentStep(i)}
            aria-label={`Go to ${label}`}
          >
            <span className="form-progress-dot">
              {i < currentStep ? <Check size={10} /> : i + 1}
            </span>
            <span className="form-progress-label">{label}</span>
          </button>
        ))}
        <div className="form-progress-bar">
          <div
            className="form-progress-fill"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Global error ─────────────────────────────── */}
      {globalError && (
        <div className="login-error" style={{ marginBottom: 24 }}>
          {rateLimitCountdown > 0
            ? `Too many submissions. Try again in ${rateLimitCountdown}s.`
            : globalError}
        </div>
      )}

      {/* ── Section 0: Required ──────────────────────── */}
      <div
        className={`form-section-card form-step-panel${currentStep === 0 ? ' active' : ''}`}
        id="form-step-0"
      >
        <p className="form-section-title">Required</p>

        <div className="form-group">
          <label htmlFor="join-name" className="form-label">
            Full Name <span className="required">*</span>
          </label>
          <input
            id="join-name"
            name="name"
            type="text"
            className="form-input"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {fieldError('name')}
        </div>

        <div className="form-group">
          <label htmlFor="join-website" className="form-label">
            Personal Website <span className="required">*</span>
          </label>
          <div className="form-input-with-icon">
            <input
              id="join-website"
              name="website"
              type="url"
              className="form-input"
              placeholder="https://yoursite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              required
            />
            {isValidUrl(website) && website.startsWith('https://') && (
              <Check size={14} className="form-valid-icon" />
            )}
          </div>
          <span className="form-hint">Must be a working HTTPS URL</span>
          {fieldError('website')}
        </div>

        <div className="form-group">
          <label htmlFor="join-department" className="form-label">
            Department <span className="required">*</span>
          </label>
          <select
            id="join-department"
            name="department"
            className="form-select"
            required
            value={selectedDepartment}
            onChange={(e) => {
              const next = e.target.value as Department | '';
              setSelectedDepartment(next);
              setRoles([]);
              setInterests([]);
            }}
          >
            <option value="" disabled>Select your department</option>
            {DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          {fieldError('department')}
        </div>

        <div className="form-group">
          <label htmlFor="join-member-type" className="form-label">
            Joining as <span className="required">*</span>
          </label>
          <select
            id="join-member-type"
            name="member_type"
            className="form-select"
            value={memberType}
            onChange={(e) => setMemberType(e.target.value as 'student' | 'alumni' | '')}
            required
          >
            <option value="" disabled>Current student or alumni?</option>
            <option value="student">Current student</option>
            <option value="alumni">Alumni</option>
          </select>
          {fieldError('member_type')}
        </div>

        <div className="form-group">
          <label htmlFor="join-student-id" className="form-label">
            Student ID <span className="required">*</span>
          </label>
          <input
            id="join-student-id"
            name="student_id"
            type="text"
            className="form-input"
            placeholder="e.g. 20301234"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            required
          />
          <span className="form-hint">Must start with 2 (e.g. 20301234)</span>
          {fieldError('student_id')}
        </div>

        <div className="form-step-nav">
          <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(1)}>
            Next →
          </button>
        </div>
      </div>

      {/* ── Section 1: About You ─────────────────────── */}
      <div
        className={`form-section-card form-step-panel${currentStep === 1 ? ' active' : ''}`}
        id="form-step-1"
      >
        <p className="form-section-title">About You</p>

        <div className="form-group">
          <label htmlFor="join-batch" className="form-label">Joining Semester at BRACU</label>
          <input
            id="join-batch"
            name="batch"
            type="text"
            className="form-input"
            placeholder="Spring 2024"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
          />
          <span className="form-hint">Semester you started at BRACU — format: Spring / Summer / Fall YYYY</span>
          {fieldError('batch')}
        </div>

        <div className="form-group">
          <label htmlFor="join-residential-semester" className="form-label">Current Residential Semester</label>
          <input
            id="join-residential-semester"
            name="residential_semester"
            type="text"
            className="form-input"
            placeholder="RS-60"
            value={residentialSemester}
            onChange={(e) => setResidentialSemester(e.target.value)}
          />
          <span className="form-hint">Format: RS-XX (e.g. RS-60)</span>
          {fieldError('residential_semester')}
        </div>

        <div className="form-group" style={{ marginTop: -8 }}>
          <label className="checkbox-item">
            <input type="checkbox" name="residential_semester_public" value="true" />
            I allow my residential semester to be shown publicly.
          </label>
        </div>

        {memberType === 'student' && (
          <>
            <div className="form-group">
              <label htmlFor="join-current-semester" className="form-label">
                Which semester are you in now? <span className="required">*</span>
              </label>
              <input
                id="join-current-semester"
                name="current_semester"
                type="text"
                className="form-input"
                placeholder="Spring 2026"
                value={currentSemester}
                onChange={(e) => setCurrentSemester(e.target.value)}
              />
              {fieldError('current_semester')}
            </div>

            <div className="form-group">
              <label htmlFor="join-expected-graduation-semester" className="form-label">
                Expected graduation semester <span className="required">*</span>
              </label>
              <input
                id="join-expected-graduation-semester"
                name="expected_graduation_semester"
                type="text"
                className="form-input"
                placeholder="Fall 2027"
                value={expectedGrad}
                onChange={(e) => setExpectedGrad(e.target.value)}
              />
              {fieldError('expected_graduation_semester')}
            </div>
          </>
        )}

        {memberType === 'alumni' && (
          <>
            <div className="form-group">
              <label htmlFor="join-alumni-work-sector" className="form-label">
                Do you work in academia or industry? <span className="required">*</span>
              </label>
              <select id="join-alumni-work-sector" name="alumni_work_sector" className="form-select" defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="academia">Academia</option>
                <option value="industry">Industry</option>
              </select>
              {fieldError('alumni_work_sector')}
            </div>

            <div className="form-group">
              <label htmlFor="join-alumni-field-alignment" className="form-label">
                Are you working in your own field? <span className="required">*</span>
              </label>
              <select id="join-alumni-field-alignment" name="alumni_field_alignment" className="form-select" defaultValue="">
                <option value="" disabled>Select one</option>
                <option value="own_field">Own field</option>
                <option value="other_field">Other field</option>
              </select>
              {fieldError('alumni_field_alignment')}
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="join-bracu-email" className="form-label">
            BRACU Email <span className="form-hint">(not displayed publicly)</span>
          </label>
          <input
            id="join-bracu-email"
            name="bracu_email"
            type="email"
            className="form-input"
            placeholder="your.name@g.bracu.ac.bd"
            value={bracuEmail}
            onChange={(e) => setBracuEmail(e.target.value)}
          />
          <span className="form-hint">Must end in @g.bracu.ac.bd or @bracu.ac.bd</span>
          {fieldError('bracu_email')}
        </div>

        <div className="form-group">
          <label htmlFor="join-email" className="form-label">
            Personal Email <span className="form-hint">(not displayed publicly)</span>
          </label>
          <input
            id="join-email"
            name="email"
            type="email"
            className="form-input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldError('email')}
        </div>

        {/* Photo upload */}
        <div className="form-group">
          <label className="form-label">Profile Photo</label>

          {photoPreview ? (
            <div className="file-upload-preview" id="photo-preview-area">
              <img src={photoPreview} alt="Profile preview" className="upload-preview-img" />
              <div className="upload-preview-info">
                <div className="upload-preview-badge">
                  <CheckCircle2 size={13} />
                  Photo ready
                </div>
                <p className="upload-preview-name">{photoName}</p>
                <p className="upload-preview-size">{photoSize}</p>
              </div>
              <button
                type="button"
                className="upload-remove-btn"
                aria-label="Remove photo"
                onClick={(e) => {
                  e.stopPropagation();
                  setPhotoName(null); setPhotoPreview(null); setPhotoSize(null);
                  if (fileRef.current) fileRef.current.value = '';
                }}
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className={`file-upload-area${isDragging ? ' dragging' : ''}`}
              onClick={() => fileRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Upload profile photo"
              onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) processFile(file);
              }}
            >
              <Upload size={20} color="var(--text-muted)" style={{ marginBottom: 8 }} />
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {isDragging ? 'Drop to upload' : 'Click or drag a photo here'}
              </p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                JPG, PNG or WebP · max 5MB · will be cropped to 400×400
              </p>
            </div>
          )}

          <input
            ref={fileRef}
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              if (file) processFile(file);
            }}
          />
        </div>

        <div className="form-step-nav">
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(0)}>← Back</button>
          <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(2)}>Next →</button>
        </div>
      </div>

      {/* ── Section 2: Roles & Interests ─────────────── */}
      <div
        className={`form-section-card form-step-panel${currentStep === 2 ? ' active' : ''}`}
        id="form-step-2"
      >
        <p className="form-section-title">Roles &amp; Interests</p>

        <div className="form-group">
          <label htmlFor="join-role-input" className="form-label">
            Roles <span className="form-hint">(choose a suggestion or write your own)</span>
          </label>
          <div className="tag-input-row">
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                id="join-role-input"
                list="role-suggestions"
                className="form-input"
                placeholder={selectedDepartment ? 'Type a role and press Add' : 'Select department first (step 1)'}
                value={roleDraft}
                maxLength={MAX_TAG_LEN}
                onChange={(e) => setRoleDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(roleDraft, roles, setRoles); setRoleDraft(''); }
                }}
              />
              {roleDraft.length > 0 && (
                <span className="char-counter">{roleDraft.length}/{MAX_TAG_LEN}</span>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => { addTag(roleDraft, roles, setRoles); setRoleDraft(''); }}>
              Add
            </button>
          </div>
          <datalist id="role-suggestions">
            {roleSuggestions.map((role) => <option key={role} value={role} />)}
          </datalist>
          <div className="tag-chip-list">
            {roles.map((role) => (
              <button key={role} type="button" className="tag-chip" onClick={() => removeTag(role, roles, setRoles)} title="Remove">
                {role} ×
              </button>
            ))}
          </div>
          {roles.map((role) => <input key={role} type="hidden" name="roles" value={role} />)}
        </div>

        <div className="form-group">
          <label htmlFor="join-interest-input" className="form-label">
            Interests <span className="form-hint">(choose a suggestion or write your own)</span>
          </label>
          <div className="tag-input-row">
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                id="join-interest-input"
                list="interest-suggestions"
                className="form-input"
                placeholder={selectedDepartment ? 'Type an interest and press Add' : 'Select department first (step 1)'}
                value={interestDraft}
                maxLength={MAX_TAG_LEN}
                onChange={(e) => setInterestDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); addTag(interestDraft, interests, setInterests); setInterestDraft(''); }
                }}
              />
              {interestDraft.length > 0 && (
                <span className="char-counter">{interestDraft.length}/{MAX_TAG_LEN}</span>
              )}
            </div>
            <button type="button" className="btn btn-secondary" onClick={() => { addTag(interestDraft, interests, setInterests); setInterestDraft(''); }}>
              Add
            </button>
          </div>
          <datalist id="interest-suggestions">
            {interestSuggestions.map((interest) => <option key={interest} value={interest} />)}
          </datalist>
          <div className="tag-chip-list">
            {interests.map((interest) => (
              <button key={interest} type="button" className="tag-chip" onClick={() => removeTag(interest, interests, setInterests)} title="Remove">
                {interest} ×
              </button>
            ))}
          </div>
          {interests.map((interest) => <input key={interest} type="hidden" name="interests" value={interest} />)}
        </div>

        <div className="form-step-nav">
          <button type="button" className="btn btn-secondary" onClick={() => setCurrentStep(1)}>← Back</button>
          <button type="button" className="btn btn-primary" onClick={() => setCurrentStep(3)}>Next →</button>
        </div>
      </div>

      {/* ── Section 3: Social Links ───────────────────── */}
      <div
        className={`form-section-card form-step-panel${currentStep === 3 ? ' active' : ''}`}
        id="form-step-3"
      >
        <p className="form-section-title">Social Links</p>

        {SOCIAL_FIELDS.map((field) => {
          const val = socialValues[field.name] ?? '';
          const isValid = val.length > 0 && isValidUrl(val) && field.validate(val);
          const isError = val.length > 0 && !isValid;
          return (
            <div key={field.name} className="form-group">
              <label htmlFor={field.id} className="form-label">{field.label}</label>
              <div className="form-input-with-icon">
                <input
                  id={field.id}
                  name={field.name}
                  type="url"
                  className={`form-input${isError ? ' input-error' : ''}`}
                  placeholder={field.placeholder}
                  value={val}
                  onChange={(e) => updateSocial(field.name, e.target.value)}
                />
                {isValid && <Check size={14} className="form-valid-icon" />}
              </div>
              {isError && (
                <span className="form-error">Enter a valid {field.label} URL</span>
              )}
              {fieldError(field.name)}
            </div>
          );
        })}

        {/* Submit + Clear */}
        <div className="form-step-nav" style={{ flexDirection: 'column', gap: 12 }}>
          <button
            type="submit"
            className="btn btn-submit"
            disabled={isPending || rateLimitCountdown > 0}
            id="join-submit-btn"
          >
            {isPending ? (
              <><span className="btn-spinner" /><span>Submitting…</span></>
            ) : rateLimitCountdown > 0 ? (
              <span>Try again in {rateLimitCountdown}s</span>
            ) : (
              <><CheckCircle2 size={15} /><span>Submit Application</span></>
            )}
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setCurrentStep(2)}>
              ← Back
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1, color: 'var(--text-muted)' }}
              onClick={() => { if (confirm('Clear all form data?')) clearForm(); }}
            >
              Clear form
            </button>
          </div>
        </div>
      </div>

    </form>
  );
}
