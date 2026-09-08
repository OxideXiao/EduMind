/**
 * 后端契约字段归一化（《前端接口交接文档》）
 * - 业务状态：小写 draft/published/closed/...
 * - 题型：SINGLE_CHOICE / TRUE_FALSE 等
 * - 前端内部仍用既有大写枚举，在边界转换
 */

const STATUS_UP: Record<string, string> = {
  draft: 'DRAFT',
  published: 'PUBLISHED',
  closed: 'CLOSED',
  active: 'ACTIVE',
  hidden: 'HIDDEN',
  submitted: 'SUBMITTED',
  graded: 'GRADED',
};

const STATUS_DOWN: Record<string, string> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CLOSED: 'closed',
  ACTIVE: 'active',
  HIDDEN: 'hidden',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
};

/** 后端小写状态 → 前端大写 */
export function normalizeStatus<T extends string = string>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  const s = String(raw);
  if (STATUS_UP[s]) return STATUS_UP[s] as T;
  if (STATUS_DOWN[s]) return s as T; // 已是大写
  return (s.toUpperCase() as T) || fallback;
}

/** 前端大写状态 → 后端小写 */
export function toApiStatus(raw: string): string {
  return STATUS_DOWN[raw] ?? raw.toLowerCase();
}

const QTYPE_FROM_API: Record<string, string> = {
  SINGLE_CHOICE: 'SINGLE',
  MULTIPLE_CHOICE: 'MULTIPLE',
  TRUE_FALSE: 'JUDGE',
  FILL_BLANK: 'SHORT',
  SHORT_ANSWER: 'SHORT',
  SINGLE: 'SINGLE',
  JUDGE: 'JUDGE',
  MULTIPLE: 'MULTIPLE',
  SHORT: 'SHORT',
  FILE: 'FILE',
};

const QTYPE_TO_API: Record<string, string> = {
  SINGLE: 'SINGLE_CHOICE',
  JUDGE: 'TRUE_FALSE',
  MULTIPLE: 'MULTIPLE_CHOICE',
  SHORT: 'SHORT_ANSWER',
  FILE: 'SHORT_ANSWER',
};

export function normalizeQuestionType(raw: unknown): 'SINGLE' | 'JUDGE' | 'MULTIPLE' | 'SHORT' | 'FILE' {
  const mapped = QTYPE_FROM_API[String(raw ?? 'SINGLE')];
  return (mapped as 'SINGLE' | 'JUDGE' | 'MULTIPLE' | 'SHORT' | 'FILE') || 'SINGLE';
}

export function toApiQuestionType(raw: string): string {
  return QTYPE_TO_API[raw] ?? raw;
}

const RES_FROM_API: Record<string, 'PDF' | 'VIDEO' | 'LINK' | 'OTHER'> = {
  pdf: 'PDF',
  ppt: 'OTHER',
  video: 'VIDEO',
  document: 'OTHER',
  image: 'OTHER',
  other: 'OTHER',
  link: 'LINK',
  PDF: 'PDF',
  VIDEO: 'VIDEO',
  LINK: 'LINK',
  OTHER: 'OTHER',
};

const RES_TO_API: Record<string, string> = {
  PDF: 'pdf',
  VIDEO: 'video',
  LINK: 'link',
  OTHER: 'other',
};

export function normalizeResourceType(raw: unknown): 'PDF' | 'VIDEO' | 'LINK' | 'OTHER' {
  return RES_FROM_API[String(raw ?? 'other')] ?? 'OTHER';
}

export function toApiResourceType(raw: string): string {
  return RES_TO_API[raw] ?? 'other';
}

const SUBMIT_FROM_API: Record<string, 'ONLINE' | 'FILE' | 'MIXED'> = {
  text: 'ONLINE',
  file: 'FILE',
  text_and_file: 'MIXED',
  TEXT: 'ONLINE',
  FILE: 'FILE',
  TEXT_AND_FILE: 'MIXED',
  ONLINE: 'ONLINE',
  MIXED: 'MIXED',
};

/** 作业提交类型 → 后端 submissionType */
const SUBMIT_TO_API: Record<string, string> = {
  ONLINE: 'TEXT',
  FILE: 'FILE',
  MIXED: 'TEXT_AND_FILE',
};

export function normalizeSubmitType(raw: unknown): 'ONLINE' | 'FILE' | 'MIXED' {
  return SUBMIT_FROM_API[String(raw ?? 'MIXED')] ?? 'MIXED';
}

export function toApiSubmitType(raw: string): string {
  return SUBMIT_TO_API[raw] ?? 'text_and_file';
}

/** 分页或数组解包 */
export function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.list)) return obj.list as T[];
    if (Array.isArray(obj.records)) return obj.records as T[];
  }
  return [];
}

/** Blob 触发浏览器下载 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
