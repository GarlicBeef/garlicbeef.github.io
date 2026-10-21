import { getCollection, type CollectionEntry } from 'astro:content';
import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import { localePath, type Lang } from '@/i18n/ui';

export type Research = CollectionEntry<'research'>;
export type Publication = CollectionEntry<'publications'>;
export type Note = CollectionEntry<'notes'>;

export const researchHref = (e: Research, lang: Lang = 'en') => e.data.destination ?? localePath(lang, `/research/${e.id}/`);
export const noteHref = (e: Note, lang: Lang = 'en') => e.data.destination ?? localePath(lang, `/notes/${e.id}/`);
export const publicationHref = (e: Publication, lang: Lang = 'en') => localePath(lang, `/publications/${e.id}/`);

/** Most recent first; inside one year, by `order`. */
export async function getResearch() {
  const all = await getCollection('research');
  return all.sort((a, b) => b.data.year - a.data.year || a.data.order - b.data.order);
}

export async function getPublications() {
  const all = await getCollection('publications');
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Newest first. */
export async function getNotes() {
  const all = await getCollection('notes');
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getProfile() {
  const [profile] = await getCollection('profile');
  if (!profile) throw new Error('Missing src/content/profile/profile.md');
  return profile;
}

export interface ResponsiveImage {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

/** Optimised WebP with a srcset, ready to hand to a React island. */
export async function responsive(
  src: ImageMetadata,
  widths: number[] = [640, 960, 1280, 1600, 2000],
): Promise<ResponsiveImage> {
  const usable = widths.filter((w) => w <= src.width);
  const img = await getImage({ src, widths: usable.length ? usable : [src.width], format: 'webp', quality: 82 });
  return { src: img.src, srcSet: img.srcSet.attribute, width: src.width, height: src.height };
}

const dateFmt = {
  en: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  zh: new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
};
export const formatDate = (d: Date, lang: Lang = 'en') => dateFmt[lang].format(d);

/** Plain-text paragraphs (separated by blank lines) → array, for translated bodies kept in frontmatter. */
export const paragraphs = (text?: string) => (text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
export const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Minimal inline Markdown for translated paragraphs: escapes HTML, then **bold**, *italic* and `code`. */
export function inlineMd(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
