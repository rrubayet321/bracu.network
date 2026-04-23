'use client';

import { useState, useRef, useTransition } from 'react';
import { submitJoinRequest } from '@/app/join/actions';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS, INTEREST_OPTIONS } from '@/types/member';
import { Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function JoinForm() {
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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

  return (
    <form onSubmit={handleSubmit} id="join-form" noValidate>
      {globalError && (
        <div className="login-error" style={{ marginBottom: 24 }}>
          {globalError}
        </div>
      )}

      {/* ── Required fields ─────────────────────────── */}
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
          placeholder="Rubayet Hassan"
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
        <select id="join-department" name="department" className="form-select" required defaultValue="">
          <option value="" disabled>Select your department</option>
          {DEPARTMENT_OPTIONS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        {fieldError('department')}
      </div>

      <hr className="section-divider" />

      {/* ── Optional fields ──────────────────────────── */}
      <p className="form-section-title">Optional</p>

      <div className="form-group">
        <label htmlFor="join-batch" className="form-label">Batch / Year</label>
        <input
          id="join-batch"
          name="batch"
          type="text"
          className="form-input"
          placeholder="Spring 2024"
        />
        <span className="form-hint">Format: Spring 2024, Fall 2023, etc.</span>
        {fieldError('batch')}
      </div>

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
        <div
          className={`file-upload-area ${photoName ? 'has-file' : ''}`}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          <Upload size={20} color="var(--text-muted)" style={{ marginBottom: 8 }} />
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            {photoName ? photoName : 'Click to upload a photo'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            JPG, PNG or WebP · max 5MB · will be cropped to 400×400
          </p>
        </div>
        <input
          ref={fileRef}
          name="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
        />
      </div>

      <hr className="section-divider" />

      {/* Roles */}
      <div className="form-group">
        <label className="form-label">Roles <span className="form-hint">(pick all that apply)</span></label>
        <div className="checkbox-grid">
          {ROLE_OPTIONS.map((r) => (
            <label key={r} className="checkbox-item">
              <input type="checkbox" name="roles" value={r} />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div className="form-group">
        <label className="form-label">Interests / Verticals <span className="form-hint">(pick all that apply)</span></label>
        <div className="checkbox-grid">
          {INTEREST_OPTIONS.map((i) => (
            <label key={i} className="checkbox-item">
              <input type="checkbox" name="interests" value={i} />
              {i}
            </label>
          ))}
        </div>
      </div>

      <hr className="section-divider" />

      {/* Social links */}
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

      <button
        type="submit"
        className="btn btn-primary"
        disabled={isPending}
        id="join-submit-btn"
        style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="spin" /> Submitting...
          </>
        ) : (
          <>
            <CheckCircle2 size={16} /> Submit Application
          </>
        )}
      </button>
    </form>
  );
}
