'use server';

import { z } from 'zod';
import slugify from 'slugify';
import sharp from 'sharp';
import { headers } from 'next/headers';
import { getAdminClient } from '@/lib/supabase/admin-server';
import { DEPARTMENT_OPTIONS } from '@/types/member';
import { rateLimit } from '@/lib/rate-limit';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  member_type: z.enum(['student', 'alumni'], { error: 'Select whether you are a student or alumni' }),
  student_id: z
    .string()
    .regex(/^2/, 'Student ID must start with 2'),
  website: z
    .string()
    .url('Must be a valid URL')
    .refine((u) => u.startsWith('https://'), 'Website must use HTTPS')
    .optional()
    .or(z.literal('')),
  department: z.enum(DEPARTMENT_OPTIONS, { error: 'Select a valid department' }),
  batch: z
    .string()
    .regex(/^(Spring|Summer|Fall|Autumn) \d{4}$/, 'Format: Spring 2024')
    .optional()
    .or(z.literal('')),
  residential_semester: z
    .string()
    .regex(/^RS-\d{2,3}$/i, 'Format: RS-XX (example: RS-60)')
    .optional()
    .or(z.literal('')),
  residential_semester_public: z.enum(['true']).optional(),
  current_semester: z
    .string()
    .regex(/^(Spring|Summer|Fall|Autumn) \d{4}$/, 'Format: Spring 2026')
    .optional()
    .or(z.literal('')),
  expected_graduation_semester: z
    .string()
    .regex(/^(Spring|Summer|Fall|Autumn) \d{4}$/, 'Format: Fall 2027')
    .optional()
    .or(z.literal('')),
  alumni_work_sector: z.enum(['academia', 'industry']).optional().or(z.literal('')),
  alumni_field_alignment: z.enum(['own_field', 'other_field']).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  bracu_email: z
    .string()
    .email('Invalid email')
    .refine((e) => e.endsWith('@g.bracu.ac.bd') || e.endsWith('@bracu.ac.bd'), 'Must be a valid BRACU email')
    .optional()
    .or(z.literal('')),
  instagram: z
    .string()
    .url()
    .refine((u) => u.includes('instagram.com'), 'Must be an Instagram URL')
    .optional()
    .or(z.literal('')),
  twitter: z
    .string()
    .url()
    .refine((u) => u.includes('x.com') || u.includes('twitter.com'), 'Must be an X/Twitter URL')
    .optional()
    .or(z.literal('')),
  linkedin: z
    .string()
    .url()
    .refine((u) => u.includes('linkedin.com'), 'Must be a LinkedIn URL')
    .optional()
    .or(z.literal('')),
  github: z
    .string()
    .url()
    .refine((u) => u.includes('github.com'), 'Must be a GitHub URL')
    .optional()
    .or(z.literal('')),
});

export type JoinActionResult =
  | { success: true }
  | { error: string | Record<string, string[]> };

export async function submitJoinRequest(formData: FormData): Promise<JoinActionResult> {
  try {
  // ── Rate limiting (defence-in-depth — also enforced in middleware) ────
  const headersList = await headers();
  const ip =
    headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headersList.get('x-real-ip') ??
    'anonymous';

  const rl = rateLimit(`join-action:${ip}`, { limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return { error: 'Too many submissions. Please wait a moment and try again.' };
  }

  const admin = getAdminClient();

  // Collect roles and interests — sanitize: cap count, cap length, strip whitespace
  const MAX_TAGS = 10;
  const MAX_TAG_LEN = 60;
  const sanitizeTag = (t: unknown) =>
    typeof t === 'string' ? t.trim().slice(0, MAX_TAG_LEN) : null;

  const roles = (formData.getAll('roles') as string[])
    .slice(0, MAX_TAGS)
    .map(sanitizeTag)
    .filter((t): t is string => !!t && t.length > 0);

  const interests = (formData.getAll('interests') as string[])
    .slice(0, MAX_TAGS)
    .map(sanitizeTag)
    .filter((t): t is string => !!t && t.length > 0);

  // Validate text fields
  const raw = Object.fromEntries(formData.entries());
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;
  if (data.member_type === 'student') {
    if (!data.current_semester) {
      return { error: { current_semester: ['Please provide your current semester'] } };
    }
    if (!data.expected_graduation_semester) {
      return { error: { expected_graduation_semester: ['Please provide expected graduation semester'] } };
    }
  }
  if (data.member_type === 'alumni') {
    if (!data.alumni_work_sector) {
      return { error: { alumni_work_sector: ['Please select academia or industry'] } };
    }
    if (!data.alumni_field_alignment) {
      return { error: { alumni_field_alignment: ['Please select own field or other field'] } };
    }
  }

  // ── Photo upload ───────────────────────────────────────────────────
  let profilePicUrl: string | null = null;
  const photoFile = formData.get('photo') as File | null;

  if (photoFile && photoFile.size > 0) {
    if (photoFile.size > 5 * 1024 * 1024) {
      return { error: 'Photo must be under 5MB' };
    }

    // 🔴 Magic bytes MIME validation — cannot be spoofed by renaming file
    const buffer = Buffer.from(await photoFile.arrayBuffer());
    const isPng  = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8;
    const isWebp = buffer.slice(8, 12).toString('ascii') === 'WEBP';

    if (!isPng && !isJpeg && !isWebp) {
      return { error: 'Only JPG, PNG, or WebP images are allowed' };
    }

    // Resize to 400x400, strip EXIF (removes GPS coords from phone photos)
    const sanitized = await sharp(buffer)
      .resize(400, 400, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const fileName = `${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await admin.storage
      .from('profile-photos')
      .upload(fileName, sanitized, { contentType: 'image/jpeg' });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return { error: 'Photo upload failed. Please try again.' };
    }

    const { data: urlData } = admin.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    profilePicUrl = urlData.publicUrl;
  }

  // ── Slug generation ────────────────────────────────────────────────
  const baseSlug = slugify(data.name, { lower: true, strict: true, locale: 'en' });
  let slug = baseSlug;

  const { data: existing } = await admin
    .from('members')
    .select('slug')
    .eq('slug', baseSlug)
    .single();

  if (existing) {
    // Append a 4-char random suffix to avoid enumerable increments
    slug = `${baseSlug}-${crypto.randomUUID().slice(0, 4)}`;
  }

  const primaryWebsite =
    data.website || data.linkedin || data.github || data.instagram || data.twitter || null;

  // ── Insert via adminClient (bypasses RLS) ─────────────────────────
  const insertPayload = {
    slug,
    name: data.name,
    student_id: data.student_id,
    member_type: data.member_type,
    website: primaryWebsite,
    department: data.department,
    batch: data.batch || null,
    residential_semester: data.residential_semester || null,
    residential_semester_public: data.residential_semester_public === 'true',
    current_semester: data.current_semester || null,
    expected_graduation_semester: data.expected_graduation_semester || null,
    ...(data.alumni_work_sector ? { alumni_work_sector: data.alumni_work_sector } : {}),
    ...(data.alumni_field_alignment ? { alumni_field_alignment: data.alumni_field_alignment } : {}),
    email: data.email || null,
    bracu_email: data.bracu_email || null,
    instagram: data.instagram || null,
    twitter: data.twitter || null,
    linkedin: data.linkedin || null,
    github: data.github || null,
    profile_pic: profilePicUrl,
    roles,
    interests,
    is_approved: false,
  };

  const { error: insertError } = await admin.from('members').insert(insertPayload);

  if (insertError) {
    console.error('Insert error details:', insertError);
    if (insertError.code === '23505') {
      return { error: 'A member with this student ID or slug already exists.' };
    }
    return { error: 'Submission failed. Please try again.' };
  }

  return { success: true };
  } catch (err) {
    console.error('Unexpected error in submitJoinRequest:', err);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
