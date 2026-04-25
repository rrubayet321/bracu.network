'use client';

import { useMemo, useRef, useState, useTransition } from 'react';
import { submitJoinRequest } from '@/app/join/actions';
import {
  DEPARTMENT_OPTIONS,
  DEPARTMENT_INTEREST_SUGGESTIONS,
  DEPARTMENT_ROLE_SUGGESTIONS,
  type Department,
} from '@/types/member';
import { Upload, CheckCircle2, X } from 'lucide-react';


export default function JoinForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSize, setPhotoSize] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | ''>('');
  const [roles, setRoles] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [roleDraft, setRoleDraft] = useState('');
  const [interestDraft, setInterestDraft] = useState('');
  const [memberType, setMemberType] = useState<'student' | 'alumni' | ''>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const roleSuggestions = useMemo(
    () => (selectedDepartment ? DEPARTMENT_ROLE_SUGGESTIONS[selectedDepartment] : []),
    [selectedDepartment]
  );
  const interestSuggestions = useMemo(
    () => (selectedDepartment ? DEPARTMENT_INTEREST_SUGGESTIONS[selectedDepartment] : []),
    [selectedDepartment]
  );

  if (success) {
    return (
      <div className="success-card" id="join-success">
        <div className="success-icon">🎉</div>
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    setErrors({});
    setGlobalError(null);

    startTransition(async () => {
      const result = await submitJoinRequest(formData);
      if ('success' in result) {
        setSuccess(true);
      } else if (typeof result.error === 'string') {
        setGlobalError(result.error);
      } else {
        setErrors(result.error as Record<string, string[]>);
      }
    });
  }

  function fieldError(field: string) {
    const msgs = errors[field];
    return msgs && msgs.length > 0 ? (
      <span className="form-error">{msgs[0]}</span>
    ) : null;
  }

  function normalizeTag(value: string) {
    return value.trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function addTag(value: string, list: string[], setter: (next: string[]) => void) {
    const normalized = normalizeTag(value);
    if (!normalized || list.includes(normalized)) return;
    setter([...list, normalized]);
  }

  function removeTag(value: string, list: string[], setter: (next: string[]) => void) {
    setter(list.filter((item) => item !== value));
  }

  return (
    <form onSubmit={handleSubmit} id="join-form" noValidate>
      {globalError && (
        <div className="login-error" style={{ marginBottom: 24 }}>
          {globalError}
        </div>
      )}

      {/* ── Required fields ─────────────────────────── */}
      <div className="form-section-card">
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
          required
        />
        {fieldError('name')}
      </div>

      <div className="form-group">
        <label htmlFor="join-website" className="form-label">
          Personal Website <span className="required">*</span>
        </label>
        <input
          id="join-website"
          name="website"
          type="url"
          className="form-input"
          placeholder="https://yoursite.com"
          required
        />
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

      </div>

      {/* ── Optional fields ──────────────────────────── */}
      <div className="form-section-card">
        <p className="form-section-title">Optional</p>

      <div className="form-group">
        <label htmlFor="join-member-type" className="form-label">
          Are you joining as <span className="required">*</span>
        </label>
        <select
          id="join-member-type"
          name="member_type"
          className="form-select"
          value={memberType}
          onChange={(e) => setMemberType(e.target.value as 'student' | 'alumni' | '')}
          required
        >
          <option value="" disabled>Select one</option>
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
          placeholder="2XXXXXXXX"
          required
        />
        {fieldError('student_id')}
      </div>

      <div className="form-group">
        <label htmlFor="join-batch" className="form-label">Joining Semester at BRACU</label>
        <input
          id="join-batch"
          name="batch"
          type="text"
          className="form-input"
          placeholder="Spring 2024"
        />
        <span className="form-hint">This is the semester you started at BRACU.</span>
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
        />
        <span className="form-hint">Format: RS-XX (example: RS-60).</span>
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
            <label htmlFor="join-current-semester" className="form-label">Which semester are you in now?</label>
            <input
              id="join-current-semester"
              name="current_semester"
              type="text"
              className="form-input"
              placeholder="Spring 2026"
            />
            {fieldError('current_semester')}
          </div>

          <div className="form-group">
            <label htmlFor="join-expected-graduation-semester" className="form-label">Expected graduation semester</label>
            <input
              id="join-expected-graduation-semester"
              name="expected_graduation_semester"
              type="text"
              className="form-input"
              placeholder="Fall 2027"
            />
            {fieldError('expected_graduation_semester')}
          </div>
        </>
      )}

      {memberType === 'alumni' && (
        <>
          <div className="form-group">
            <label htmlFor="join-alumni-work-sector" className="form-label">
              Do you work in academia or industry?
            </label>
            <select id="join-alumni-work-sector" name="alumni_work_sector" className="form-select" defaultValue="">
              <option value="" disabled>Select one</option>
              <option value="academia">Academia</option>
              <option value="industry">Industry</option>
            </select>
            {fieldError('alumni_work_sector')}
          </div>

          <div className="form-group">
            <label htmlFor="join-alumni-field-alignment" className="form-label">Are you working in your own field?</label>
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
        />
        {fieldError('email')}
      </div>

      {/* Photo upload */}
      <div className="form-group">
        <label className="form-label">Profile Photo</label>

        {photoPreview ? (
          /* ── Success / preview state ── */
          <div className="file-upload-preview" id="photo-preview-area">
            <img
              src={photoPreview}
              alt="Profile preview"
              className="upload-preview-img"
            />
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
                setPhotoName(null);
                setPhotoPreview(null);
                setPhotoSize(null);
                if (fileRef.current) fileRef.current.value = '';
              }}
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          /* ── Empty / upload state ── */
          <div
            className="file-upload-area"
            onClick={() => fileRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
          >
            <Upload size={20} color="var(--text-muted)" style={{ marginBottom: 8 }} />
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Click to upload a photo
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
            if (!file) return;
            setPhotoName(file.name);
            setPhotoSize(
              file.size >= 1024 * 1024
                ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                : `${Math.round(file.size / 1024)} KB`
            );
            const reader = new FileReader();
            reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
          }}
        />
      </div>

      </div>

      {/* ── Roles & Interests ────────────────────────── */}
      <div className="form-section-card">
        <p className="form-section-title">Roles &amp; Interests</p>
      <div className="form-group">
        <label htmlFor="join-role-input" className="form-label">
          Roles <span className="form-hint">(choose a suggestion or write your own)</span>
        </label>
        <div className="tag-input-row">
          <input
            id="join-role-input"
            list="role-suggestions"
            className="form-input"
            placeholder={selectedDepartment ? 'Type a role and press Add' : 'Select department first'}
            value={roleDraft}
            onChange={(e) => setRoleDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(roleDraft, roles, setRoles);
                setRoleDraft('');
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              addTag(roleDraft, roles, setRoles);
              setRoleDraft('');
            }}
          >
            Add
          </button>
        </div>
        <datalist id="role-suggestions">
          {roleSuggestions.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>
        <div className="tag-chip-list">
          {roles.map((role) => (
            <button
              key={role}
              type="button"
              className="tag-chip"
              onClick={() => removeTag(role, roles, setRoles)}
              title="Remove"
            >
              {role} ×
            </button>
          ))}
        </div>
        {roles.map((role) => (
          <input key={role} type="hidden" name="roles" value={role} />
        ))}
      </div>

      {/* Interests */}
      <div className="form-group">
        <label htmlFor="join-interest-input" className="form-label">
          Interests <span className="form-hint">(choose a suggestion or write your own)</span>
        </label>
        <div className="tag-input-row">
          <input
            id="join-interest-input"
            list="interest-suggestions"
            className="form-input"
            placeholder={selectedDepartment ? 'Type an interest and press Add' : 'Select department first'}
            value={interestDraft}
            onChange={(e) => setInterestDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(interestDraft, interests, setInterests);
                setInterestDraft('');
              }
            }}
          />
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              addTag(interestDraft, interests, setInterests);
              setInterestDraft('');
            }}
          >
            Add
          </button>
        </div>
        <datalist id="interest-suggestions">
          {interestSuggestions.map((interest) => (
            <option key={interest} value={interest} />
          ))}
        </datalist>
        <div className="tag-chip-list">
          {interests.map((interest) => (
            <button
              key={interest}
              type="button"
              className="tag-chip"
              onClick={() => removeTag(interest, interests, setInterests)}
              title="Remove"
            >
              {interest} ×
            </button>
          ))}
        </div>
        {interests.map((interest) => (
          <input key={interest} type="hidden" name="interests" value={interest} />
        ))}
      </div>

      </div>

      {/* ── Social links ─────────────────────────────── */}
      <div className="form-section-card">
        <p className="form-section-title">Social Links</p>

      {[
        { id: 'join-github', name: 'github', label: 'GitHub', placeholder: 'https://github.com/username' },
        { id: 'join-linkedin', name: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/username' },
        { id: 'join-twitter', name: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/username' },
        { id: 'join-instagram', name: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/username' },
      ].map((field) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.id} className="form-label">{field.label}</label>
          <input
            id={field.id}
            name={field.name}
            type="url"
            className="form-input"
            placeholder={field.placeholder}
          />
          {fieldError(field.name)}
        </div>
      ))}

      </div>

      <button
        type="submit"
        className="btn btn-submit"
        disabled={isPending}
        id="join-submit-btn"
      >
        {isPending ? (
          <>
            <span className="btn-spinner" />
            <span>Submitting…</span>
          </>
        ) : (
          <>
            <CheckCircle2 size={15} />
            <span>Submit Application</span>
          </>
        )}
      </button>
    </form>
  );
}
