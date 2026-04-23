'use server';

import { z } from 'zod';
import slugify from 'slugify';
import sharp from 'sharp';
import { getAdminClient } from '@/lib/supabase/admin-server';
import { DEPARTMENT_OPTIONS } from '@/types/member';

const memberSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  website: z
    .string()
    .url('Must be a valid URL')
    .refine((u) => u.startsWith('https://'), 'Website must use HTTPS'),
  department: z.enum(DEPARTMENT_OPTIONS, { error: 'Select a valid department' }),
  batch: z
    .string()
    .regex(/^(Spring|Summer|Fall|Autumn) \d{4}$/, 'Format: Spring 2024')
    .optional()
    .or(z.literal('')),
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
  const admin = getAdminClient();

  // Collect roles and interests (multi-value checkboxes)
  const roles = formData.getAll('roles') as string[];
  const interests = formData.getAll('interests') as string[];

  // Validate text fields
  const raw = Object.fromEntries(formData.entries());
  const parsed = memberSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const data = parsed.data;

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

  // ── Insert via adminClient (bypasses RLS) ─────────────────────────
  const { error: insertError } = await admin.from('members').insert({
    slug,
    name: data.name,
    website: data.website,
    department: data.department,
    batch: data.batch || null,
    email: data.email || null,
    bracu_email: data.bracu_email || null,
    instagram: data.instagram || null,
    twitter: data.twitter || null,
    linkedin: data.linkedin || null,
    github: data.github || null,
    profile_pic: profilePicUrl,
    roles,
    interests,
    connections: [],
    is_approved: false,
  });

  if (insertError?.code === '23505') {
    return { error: 'A member with this website URL already exists.' };
  }

  if (insertError) {
    console.error('Insert error:', insertError);
    return { error: 'Submission failed. Please try again.' };
  }

  return { success: true };
}
