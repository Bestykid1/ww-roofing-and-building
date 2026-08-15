import { defineCollection, reference, z } from 'astro:content';
import { file, glob } from 'astro/loaders';

/**
 * Zod schemas double as fabrication controls:
 * - alt text is mandatory and must be descriptive (min 20 chars)
 * - copy-led services cannot render galleries (evidenceLevel)
 * - area pages cannot claim local work until verifiedJobs is true
 * - photos of identifiable people are gated behind peopleVisible
 * - testimonials require a source; the collection ships empty
 */

const photoCategory = z.enum([
  're-roofing',
  'slating',
  'heritage-slating',
  'tiling',
  'extensions',
  'velux',
  'commercial',
  'garden-buildings',
  'membrane-detail',
  'dormers',
]);

const photos = defineCollection({
  loader: file('./src/content/photos/photos.json', {
    parser: (text) => JSON.parse(text).map((p: { slug: string }) => ({ id: p.slug, ...p })),
  }),
  schema: z.object({
    slug: z.string(),
    original: z.string(),
    alt: z.string().min(20),
    orientation: z.enum(['landscape', 'portrait']),
    role: z.enum(['hero', 'grid', 'detail']),
    categories: z.array(photoCategory).min(1),
    peopleVisible: z.boolean(),
    // Required only when peopleVisible is true; the gallery filter checks it.
    consentObtained: z.boolean().default(false),
    project: z.string().optional(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    nav: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().min(70).max(160),
    intro: z.string(),
    heroPhoto: reference('photos').optional(),
    heroVariant: z.enum(['full', 'split', 'offset', 'text']),
    evidenceLevel: z.enum(['photographic', 'copy-led']),
    galleryCategories: z.array(photoCategory).default([]),
    /** For copy-led pages: up to two detail photos shown as an evidence band. */
    detailPhotos: z.array(reference('photos')).max(2).default([]),
    order: z.number(),
    faqs: z
      .array(z.object({ q: z.string(), a: z.string() }))
      .default([]),
    relatedServices: z.array(reference('services')).default([]),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    category: z.string(),
    photos: z.array(reference('photos')).min(1),
    services: z.array(reference('services')).min(1),
    // Only populated once the client verifies the location of the job.
    location: z.string().optional(),
    summary: z.string().min(50),
    featured: z.boolean().default(false),
    order: z.number(),
  }),
});

const areas = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/areas' }),
  schema: z.object({
    title: z.string(),
    metaTitle: z.string().max(60),
    metaDescription: z.string().min(70).max(160),
    serviceEmphasis: z.array(reference('services')).min(1),
    /** Work photo for the sidebar; caption comes from the photo's own alt, so
        no local claim is implied. */
    sidePhoto: reference('photos').optional(),
    // Local property-stock context; every factual sentence needs client sign-off
    // before launch (tracked in CHECKLIST.md).
    propertyStockNote: z.string().min(100),
    verifiedJobs: z.boolean().default(false),
    order: z.number(),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/testimonials' }),
  schema: z.object({
    client: z.string(),
    source: z.enum(['google', 'direct', 'email']),
    date: z.coerce.date(),
    project: reference('projects').optional(),
    service: reference('services').optional(),
  }),
});

export const collections = { photos, services, projects, areas, testimonials };
