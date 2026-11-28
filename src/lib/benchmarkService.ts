import { supabase } from './supabase';

export interface AdmissionBenchmark {
  id: string;
  university_name: string;
  major_code: string;
  major_name: string;
  year: number;
  cutoff_tsa: number | null;
  cutoff_hsa: number | null;
  cutoff_vact: number | null;
  cutoff_thptqg: number | null;
  created_at?: string;
}

export const DEFAULT_SAMPLE_BENCHMARKS: AdmissionBenchmark[] = [
  {
    id: 'sample-hust-ite10',
    university_name: 'ĐH Bách khoa Hà Nội (HUST)',
    major_code: 'IT-E10',
    major_name: 'Khoa học dữ liệu và Trí tuệ nhân tạo',
    year: 2025,
    cutoff_tsa: 78.2,
    cutoff_hsa: null,
    cutoff_vact: null,
    cutoff_thptqg: 28.4,
  },
  {
    id: 'sample-hust-it1',
    university_name: 'ĐH Bách khoa Hà Nội (HUST)',
    major_code: 'IT1',
    major_name: 'Khoa học Máy tính',
    year: 2025,
    cutoff_tsa: 81.5,
    cutoff_hsa: null,
    cutoff_vact: null,
    cutoff_thptqg: 28.9,
  },
  {
    id: 'sample-hust-ee2',
    university_name: 'ĐH Bách khoa Hà Nội (HUST)',
    major_code: 'EE2',
    major_name: 'Kỹ thuật Điều khiển - Tự động hóa',
    year: 2025,
    cutoff_tsa: 72.4,
    cutoff_hsa: null,
    cutoff_vact: null,
    cutoff_thptqg: 27.6,
  },
  {
    id: 'sample-uet-cn1',
    university_name: 'ĐH Công nghệ - ĐHQGHN (UET)',
    major_code: 'CN1',
    major_name: 'Công nghệ Thông tin',
    year: 2025,
    cutoff_tsa: null,
    cutoff_hsa: 112,
    cutoff_vact: null,
    cutoff_thptqg: 27.8,
  },
  {
    id: 'sample-uet-cn8',
    university_name: 'ĐH Công nghệ - ĐHQGHN (UET)',
    major_code: 'CN8',
    major_name: 'Trí tuệ nhân tạo',
    year: 2025,
    cutoff_tsa: null,
    cutoff_hsa: 116,
    cutoff_vact: null,
    cutoff_thptqg: 28.1,
  },
  {
    id: 'sample-neu-ep01',
    university_name: 'ĐH Kinh tế Quốc dân (NEU)',
    major_code: 'EP01',
    major_name: 'Kinh tế Đầu tư',
    year: 2025,
    cutoff_tsa: 68.5,
    cutoff_hsa: 105,
    cutoff_vact: null,
    cutoff_thptqg: 27.4,
  },
  {
    id: 'sample-ftu-nth01',
    university_name: 'ĐH Ngoại thương (FTU)',
    major_code: 'NTH01',
    major_name: 'Kinh tế đối ngoại',
    year: 2025,
    cutoff_tsa: null,
    cutoff_hsa: 108,
    cutoff_vact: null,
    cutoff_thptqg: 28.2,
  },
  {
    id: 'sample-hcmut-106',
    university_name: 'ĐH Bách khoa TP.HCM (HCMUT)',
    major_code: '106',
    major_name: 'Khoa học Máy tính',
    year: 2025,
    cutoff_tsa: null,
    cutoff_hsa: null,
    cutoff_vact: 960,
    cutoff_thptqg: 27.5,
  },
];

const LOCAL_BENCHMARKS_KEY = 'parabol_admission_benchmarks_v1';

function readLocalBenchmarks(): AdmissionBenchmark[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_BENCHMARKS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdmissionBenchmark[]) : null;
  } catch {
    return null;
  }
}

function writeLocalBenchmarks(items: AdmissionBenchmark[]): void {
  try {
    localStorage.setItem(LOCAL_BENCHMARKS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function normalizeRow(row: Record<string, unknown>): AdmissionBenchmark {
  const numOrNull = (v: unknown) =>
    v === null || v === undefined || v === '' || Number.isNaN(Number(v))
      ? null
      : Number(v);

  return {
    id: String(row.id ?? crypto.randomUUID()),
    university_name: String(row.university_name ?? '').trim(),
    major_code: String(row.major_code ?? '').trim(),
    major_name: String(row.major_name ?? '').trim(),
    year: Number(row.year ?? 2025),
    cutoff_tsa: numOrNull(row.cutoff_tsa),
    cutoff_hsa: numOrNull(row.cutoff_hsa),
    cutoff_vact: numOrNull(row.cutoff_vact),
    cutoff_thptqg: numOrNull(row.cutoff_thptqg),
    created_at: typeof row.created_at === 'string' ? row.created_at : undefined,
  };
}

export async function fetchAdmissionBenchmarks(): Promise<{
  benchmarks: AdmissionBenchmark[];
  fromFallback: boolean;
}> {
  try {
    const { data, error } = await supabase
      .from('admission_benchmarks')
      .select('*')
      .order('university_name', { ascending: true })
      .order('major_code', { ascending: true });

    if (error) {
      console.warn('[fetchAdmissionBenchmarks] Supabase fallback:', error.message);
      return {
        benchmarks: readLocalBenchmarks() ?? DEFAULT_SAMPLE_BENCHMARKS,
        fromFallback: true,
      };
    }

    if (!data || data.length === 0) {
      return {
        benchmarks: readLocalBenchmarks() ?? DEFAULT_SAMPLE_BENCHMARKS,
        fromFallback: true,
      };
    }

    const list = (data as Record<string, unknown>[]).map(normalizeRow);
    writeLocalBenchmarks(list);
    return { benchmarks: list, fromFallback: false };
  } catch {
    return {
      benchmarks: readLocalBenchmarks() ?? DEFAULT_SAMPLE_BENCHMARKS,
      fromFallback: true,
    };
  }
}

export async function upsertAdmissionBenchmark(
  payload: Omit<AdmissionBenchmark, 'id' | 'created_at'> & { id?: string }
): Promise<{ ok: boolean; errorMessage?: string }> {
  const id =
    payload.id && !payload.id.startsWith('sample-')
      ? payload.id
      : crypto.randomUUID();
  const row = {
    id,
    university_name: payload.university_name.trim(),
    major_code: payload.major_code.trim(),
    major_name: payload.major_name.trim(),
    year: Number(payload.year || 2025),
    cutoff_tsa: payload.cutoff_tsa,
    cutoff_hsa: payload.cutoff_hsa,
    cutoff_vact: payload.cutoff_vact,
    cutoff_thptqg: payload.cutoff_thptqg,
  };

  // Update local cache immediately
  const current = readLocalBenchmarks() ?? DEFAULT_SAMPLE_BENCHMARKS;
  const existsIdx = current.findIndex((b) => b.id === payload.id || b.id === id);
  const nextLocal = [...current];
  if (existsIdx >= 0) nextLocal[existsIdx] = row;
  else nextLocal.unshift(row);
  writeLocalBenchmarks(nextLocal);

  try {
    const { error } = await supabase
      .from('admission_benchmarks')
      .upsert([row], { onConflict: 'id' });
    if (error) {
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi lưu điểm chuẩn',
    };
  }
}

export async function deleteAdmissionBenchmark(
  id: string
): Promise<{ ok: boolean; errorMessage?: string }> {
  const current = readLocalBenchmarks() ?? DEFAULT_SAMPLE_BENCHMARKS;
  writeLocalBenchmarks(current.filter((b) => b.id !== id));

  if (id.startsWith('sample-')) return { ok: true };

  try {
    const { error } = await supabase
      .from('admission_benchmarks')
      .delete()
      .eq('id', id);
    if (error) {
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi xóa điểm chuẩn',
    };
  }
}

export async function importAdmissionBenchmarksBatch(
  rows: Array<Omit<AdmissionBenchmark, 'id' | 'created_at'>>
): Promise<{ ok: boolean; count: number; errorMessage?: string }> {
  const normalized = rows
    .filter((r) => r.university_name && r.major_name)
    .map((r) => ({
      id: crypto.randomUUID(),
      university_name: r.university_name.trim(),
      major_code: (r.major_code || 'N/A').trim(),
      major_name: r.major_name.trim(),
      year: Number(r.year || 2025),
      cutoff_tsa: r.cutoff_tsa ?? null,
      cutoff_hsa: r.cutoff_hsa ?? null,
      cutoff_vact: r.cutoff_vact ?? null,
      cutoff_thptqg: r.cutoff_thptqg ?? null,
    }));

  if (normalized.length === 0) {
    return { ok: false, count: 0, errorMessage: 'Không có dòng dữ liệu hợp lệ.' };
  }

  const current = readLocalBenchmarks() ?? DEFAULT_SAMPLE_BENCHMARKS;
  writeLocalBenchmarks([...normalized, ...current]);

  try {
    const { error } = await supabase
      .from('admission_benchmarks')
      .insert(normalized);
    if (error) {
      return { ok: false, count: 0, errorMessage: error.message };
    }
    return { ok: true, count: normalized.length };
  } catch (err) {
    return {
      ok: false,
      count: 0,
      errorMessage: err instanceof Error ? err.message : 'Lỗi import điểm chuẩn',
    };
  }
}
