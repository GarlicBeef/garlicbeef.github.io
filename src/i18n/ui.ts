/**
 * Interface text in English and Chinese.
 * Content (titles, captions, summaries…) is translated in each entry's own Markdown file
 * under a `zh:` block; this file holds only the site's fixed wording.
 */
export const locales = ['en', 'zh'] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    htmlLang: 'en',
    skip: 'Skip to content',
    navLabel: 'Primary',
    home: 'home',
    nav: { research: 'Research', publications: 'Publications', about: 'About', notes: 'Field Notes' },
    switchTo: '中文',
    switchLabel: '阅读中文版',
    footer: 'Research / Films / Everyday observations',
    sections: {
      research: '01 — Research',
      publications: '02 — Publications',
      about: '03 — About',
      notes: '04 — Field Notes',
    },
    intros: {
      publications: 'Selected papers & ongoing questions',
      about: 'Background, and where the work happens',
      notes: 'Fragments from life, and after the screening',
    },
    research: {
      aside: 'Selected experiments, over time',
      newer: '← Newer',
      older: 'Older →',
      inYear: (i: number, n: number) => `${i} of ${n} this year`,
      open: 'open project',
      wheel: 'Research by year — use the arrow keys to choose a year',
      project: 'Project',
      setup: 'Setup',
      location: 'Location',
      year: 'Year',
      back: '← Back to research',
      backEnd: 'Back to research →',
    },
    archive: {
      file: 'File',
      selected: 'Selected publications',
      intro: 'Papers kept as an archive. Point at a file, or use the index, to read its label.',
      hint: 'Click or press Enter to open',
      viewAll: 'View all publications ↗',
      indexLabel: 'Selected publications',
    },
    publications: {
      title: 'Publications',
      indexTitle: 'Publication index',
      year: 'Year',
      venue: 'Venue',
      links: 'Links',
      toBeSupplied: 'To be supplied',
      preprint: 'Preprint',
      details: 'Details',
      illustrative: 'Illustrative placeholder graphic — not research data.',
      backToArchive: '← Back to the archive',
      index: 'Publication index →',
    },
    notes: {
      title: 'Field Notes',
      all: 'All field notes',
      allLink: 'All field notes ↗',
      frame: (n: string) => `Frame ${n}`,
      back: '← Back to field notes',
      allNext: 'All field notes →',
      strip: 'Field notes, as a filmstrip',
      drag: 'Drag to explore',
      pause: 'Pause ❙❙',
      resume: 'Resume ▸',
    },
    about: {
      title: 'About',
      role: 'Role',
      field: 'Field',
      affiliation: 'Affiliation',
      scholar: 'Google Scholar',
      cv: 'CV',
      scholarLink: 'Profile ↗',
      cvLink: 'Download (PDF) ↗',
      links: 'Links',
      toBeSupplied: '— to be supplied',
      continue: ['Continue to', 'Research', 'Publications', 'or', 'Field Notes'],
      descSuffix: 'Research, publications and field notes.',
    },
    notFound: { title: 'Not found', heading: 'This room is not part of the exhibition.', back: 'Return to the entrance' },
  },
  zh: {
    htmlLang: 'zh-CN',
    skip: '跳到正文',
    navLabel: '主导航',
    home: '首页',
    nav: { research: '研究', publications: '论文', about: '关于', notes: '札记' },
    switchTo: 'EN',
    switchLabel: 'Read in English',
    footer: '研究 / 电影 / 日常观察',
    sections: {
      research: '01 — 研究',
      publications: '02 — 论文',
      about: '03 — 关于',
      notes: '04 — 札记',
    },
    intros: {
      publications: '论文选辑，与仍在思考的问题',
      about: '背景，以及工作发生的地方',
      notes: '生活片段，以及散场之后',
    },
    research: {
      aside: '实验选辑，按时间排列',
      newer: '← 较新',
      older: '较早 →',
      inYear: (i: number, n: number) => `本年 ${i} / ${n}`,
      open: '打开项目',
      wheel: '按年份浏览研究，可用方向键选择年份',
      project: '项目',
      setup: '装置',
      location: '地点',
      year: '年份',
      back: '← 返回研究',
      backEnd: '返回研究 →',
    },
    archive: {
      file: '档案',
      selected: '论文选辑',
      intro: '论文以档案的形式保存。指向某份档案或使用索引，即可查看它的标签。',
      hint: '点击或按回车键打开',
      viewAll: '查看全部论文 ↗',
      indexLabel: '论文选辑',
    },
    publications: {
      title: '论文',
      indexTitle: '论文索引',
      year: '年份',
      venue: '发表于',
      links: '链接',
      toBeSupplied: '待补充',
      preprint: '预印本',
      details: '详情',
      illustrative: '示意图，并非研究数据。',
      backToArchive: '← 返回档案',
      index: '论文索引 →',
    },
    notes: {
      title: '札记',
      all: '全部札记',
      allLink: '全部札记 ↗',
      frame: (n: string) => `第 ${n} 帧`,
      back: '← 返回札记',
      allNext: '全部札记 →',
      strip: '以胶片形式呈现的札记',
      drag: '拖动浏览',
      pause: '暂停 ❙❙',
      resume: '继续 ▸',
    },
    about: {
      title: '关于',
      role: '职位',
      field: '研究领域',
      affiliation: '所属机构',
      scholar: 'Google Scholar',
      cv: '简历',
      scholarLink: '个人主页 ↗',
      cvLink: '下载（PDF）↗',
      links: '链接',
      toBeSupplied: '— 待补充',
      continue: ['继续浏览', '研究', '论文', '或', '札记'],
      descSuffix: '研究、论文与札记。',
    },
    notFound: { title: '未找到页面', heading: '这个展厅不在本次展览之中。', back: '返回入口' },
  },
} as const;

export type UI = (typeof ui)[Lang];
export const t = (lang: Lang): UI => ui[lang] as UI;

/** Prefix a site path for a language: ('zh', '/notes/') → '/zh/notes/'. */
export function localePath(lang: Lang, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (lang === defaultLang) return clean;
  return clean === '/' ? `/${lang}/` : `/${lang}${clean}`;
}

/** The same page in the other language. */
export function alternatePath(lang: Lang, pathname: string): { lang: Lang; href: string } {
  if (lang === 'zh') {
    const rest = pathname.replace(/^\/zh(?=\/|$)/, '') || '/';
    return { lang: 'en', href: rest };
  }
  return { lang: 'zh', href: localePath('zh', pathname) };
}

/** Fill {name} placeholders. */
export const fmt = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

export const langFromUrl = (url: URL): Lang => (url.pathname === '/zh' || url.pathname.startsWith('/zh/') ? 'zh' : 'en');

/** Pick a translated field from an entry's `zh` block, falling back to the English value. */
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  data: T & { zh?: Partial<Record<K, unknown>> },
  key: K,
  lang: Lang,
): T[K] {
  if (lang === 'zh') {
    const v = data.zh?.[key];
    if (v !== undefined && v !== null && v !== '') return v as T[K];
  }
  return data[key];
}
