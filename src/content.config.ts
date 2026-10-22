import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Content lives in src/content/<collection>/*.md — one file per entry.
 * Frontmatter holds the structured fields; the Markdown body becomes the
 * detail-page text. Set `demo: true` on anything that is placeholder content
 * so the site labels it clearly; remove it once real material is supplied.
 */

const research = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/research' }),
  schema: ({ image }) =>
    z.object({
      year: z.number().int(),
      /** Ordering inside the same year (lower first). Several projects may share a year. */
      order: z.number().default(0),
      title: z.string(),
      image: image(),
      imageAlt: z.string(),
      /** Equipment or experimental context shown in the caption. */
      caption: z.string(),
      location: z.string().optional(),
      /** Optional override; defaults to /research/<id>/ */
      destination: z.string().optional(),
      /** 'contain' shows the whole image (e.g. a wide figure) instead of cropping it to the frame. */
      imageFit: z.enum(['cover', 'contain']).default('cover'),
      demo: z.boolean().default(false),
      /** Chinese translations; any field left out falls back to English. */
      zh: z
        .object({ title: z.string(), caption: z.string(), imageAlt: z.string(), location: z.string(), body: z.string() })
        .partial()
        .optional(),
    }),
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      authors: z.array(z.string()),
      year: z.number().int(),
      venue: z.string(),
      summary: z.string(),
      /** A supplied figure image. When absent, an illustrative placeholder graphic is drawn. */
      figure: image().optional(),
      figureAlt: z.string().optional(),
      /** Placeholder graphic style used when no real figure is supplied. */
      figureKind: z.enum(['decay', 'spectrum', 'rings', 'scatter', 'field']).default('decay'),
      doi: z.string().optional(),
      pdf: z.string().url().optional(),
      preprint: z.string().url().optional(),
      /** Display order in the archive (01, 02, …). */
      order: z.number(),
      demo: z.boolean().default(false),
      /** Chinese translations; any field left out falls back to English (paper titles usually stay in English). */
      zh: z
        .object({ title: z.string(), venue: z.string(), summary: z.string(), figureAlt: z.string(), body: z.string() })
        .partial()
        .optional(),
    }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      location: z.string().optional(),
      cover: image(),
      coverAlt: z.string(),
      /** Focal point used when the photo is cropped (CSS object-position), e.g. "50% 30%". */
      coverPosition: z.string().default('50% 50%'),
      /** Frame number printed on the filmstrip — the explicit frame → note mapping. */
      frame: z.number().int(),
      /** Optional override; defaults to /notes/<id>/ */
      destination: z.string().optional(),
      demo: z.boolean().default(false),
      /** Chinese translations; any field left out falls back to English. */
      zh: z
        .object({ title: z.string(), location: z.string(), coverAlt: z.string(), body: z.string() })
        .partial()
        .optional(),
    }),
});

const profile = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/profile' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    researchField: z.string().optional(),
    affiliation: z.string().optional(),
    /** Short line under the name in the header; falls back to the role. */
    headline: z.string().optional(),
    /** Google Scholar profile URL. */
    scholar: z.string().url().optional(),
    /** CV link, e.g. "/cv.pdf" for a PDF placed in public/. */
    cv: z.string().optional(),
    links: z
      .array(z.object({ label: z.string(), href: z.string() }))
      .default([]),
    demo: z.boolean().default(false),
    /** Chinese translations; any field left out falls back to English. */
    zh: z
      .object({ name: z.string(), role: z.string(), headline: z.string(), researchField: z.string(), affiliation: z.string(), body: z.string() })
      .partial()
      .optional(),
  }),
});

export const collections = { research, publications, notes, profile };
