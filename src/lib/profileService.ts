import { supabase } from './supabase';

export const SUPER_ADMIN_EMAIL =
  (import.meta.env.VITE_SUPER_ADMIN_EMAIL as string | undefined)
    ?.trim()
    .toLowerCase() || 'kienphung15101981@gmail.com';

export interface UserProfile {
  id: string;
  xp: number;
  exams_completed: number;
  full_name?: string | null;
  avatar_url?: string | null;
}

export interface AppAdminRecord {
  id?: string;
  email: string;
  added_by?: string | null;
  created_at?: string;
}

export async function fetchOrCreateProfile(params: {
  userId: string;
  fullName?: string | null;
  avatarUrl?: string | null;
}): Promise<UserProfile> {
  const fallback: UserProfile = {
    id: params.userId,
    xp: 0,
    exams_completed: 0,
    full_name: params.fullName ?? null,
    avatar_url: params.avatarUrl ?? null,
  };

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, xp, exams_completed, full_name, avatar_url')
      .eq('id', params.userId)
      .maybeSingle();

    if (error) {
      console.error('[fetchOrCreateProfile] Supabase error:', error);
      return fallback;
    }

    if (data) {
      return {
        id: data.id,
        xp: Number(data.xp ?? 0),
        exams_completed: Number(data.exams_completed ?? 0),
        full_name: data.full_name ?? params.fullName ?? null,
        avatar_url: data.avatar_url ?? params.avatarUrl ?? null,
      };
    }

    // Create initial profile row if not present
    const { data: inserted, error: insertError } = await supabase
      .from('profiles')
      .upsert(
        [
          {
            id: params.userId,
            xp: 0,
            exams_completed: 0,
            full_name: params.fullName ?? null,
            avatar_url: params.avatarUrl ?? null,
          },
        ],
        { onConflict: 'id' }
      )
      .select('id, xp, exams_completed, full_name, avatar_url')
      .maybeSingle();

    if (insertError) {
      console.error('[fetchOrCreateProfile] Insert error:', insertError);
      return fallback;
    }

    return inserted
      ? {
          id: inserted.id,
          xp: Number(inserted.xp ?? 0),
          exams_completed: Number(inserted.exams_completed ?? 0),
          full_name: inserted.full_name,
          avatar_url: inserted.avatar_url,
        }
      : fallback;
  } catch (err) {
    console.error('[fetchOrCreateProfile] Unexpected error:', err);
    return fallback;
  }
}

export async function awardExamXp(params: {
  userId: string;
  earnedXp: number;
  fullName?: string | null;
  avatarUrl?: string | null;
}): Promise<{
  ok: boolean;
  previousXp: number;
  newXp: number;
  examsCompleted: number;
}> {
  try {
    const current = await fetchOrCreateProfile({
      userId: params.userId,
      fullName: params.fullName,
      avatarUrl: params.avatarUrl,
    });

    const previousXp = current.xp;
    const newXp = previousXp + params.earnedXp;
    const examsCompleted = current.exams_completed + 1;

    const { error } = await supabase.from('profiles').upsert(
      [
        {
          id: params.userId,
          xp: newXp,
          exams_completed: examsCompleted,
          full_name: params.fullName ?? current.full_name ?? null,
          avatar_url: params.avatarUrl ?? current.avatar_url ?? null,
        },
      ],
      { onConflict: 'id' }
    );

    if (error) {
      console.error('[awardExamXp] Supabase error:', error);
      return { ok: false, previousXp, newXp: previousXp, examsCompleted: current.exams_completed };
    }

    return { ok: true, previousXp, newXp, examsCompleted };
  } catch (err) {
    console.error('[awardExamXp] Unexpected error:', err);
    return { ok: false, previousXp: 0, newXp: params.earnedXp, examsCompleted: 1 };
  }
}

export async function fetchProfilesByIds(
  userIds: string[]
): Promise<Record<string, UserProfile>> {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, xp, exams_completed, full_name, avatar_url')
      .in('id', uniqueIds);

    if (error) {
      console.error('[fetchProfilesByIds] Supabase error:', error);
      return {};
    }

    const map: Record<string, UserProfile> = {};
    for (const row of data ?? []) {
      map[row.id] = {
        id: row.id,
        xp: Number(row.xp ?? 0),
        exams_completed: Number(row.exams_completed ?? 0),
        full_name: row.full_name,
        avatar_url: row.avatar_url,
      };
    }
    return map;
  } catch (err) {
    console.error('[fetchProfilesByIds] Unexpected error:', err);
    return {};
  }
}

export async function checkAdminRole(email: string | null | undefined): Promise<{
  isSuperAdmin: boolean;
  isAdmin: boolean;
}> {
  if (!email) return { isSuperAdmin: false, isAdmin: false };
  const normalized = email.trim().toLowerCase();

  if (normalized === SUPER_ADMIN_EMAIL) {
    return { isSuperAdmin: true, isAdmin: true };
  }

  try {
    const { data, error } = await supabase
      .from('app_admins')
      .select('email')
      .ilike('email', normalized)
      .maybeSingle();

    if (error) {
      console.error('[checkAdminRole] Supabase error:', error);
      return { isSuperAdmin: false, isAdmin: false };
    }

    return { isSuperAdmin: false, isAdmin: Boolean(data) };
  } catch (err) {
    console.error('[checkAdminRole] Unexpected error:', err);
    return { isSuperAdmin: false, isAdmin: false };
  }
}

export async function fetchAppAdmins(): Promise<{
  admins: AppAdminRecord[];
  errorMessage?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('app_admins')
      .select('id, email, added_by, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[fetchAppAdmins] Supabase error:', error);
      return { admins: [], errorMessage: error.message };
    }

    return { admins: (data ?? []) as AppAdminRecord[] };
  } catch (err) {
    console.error('[fetchAppAdmins] Unexpected error:', err);
    return {
      admins: [],
      errorMessage: err instanceof Error ? err.message : 'Lỗi tải danh sách QTV',
    };
  }
}

export async function addAppAdmin(
  email: string,
  addedBy?: string | null
): Promise<{ ok: boolean; errorMessage?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) {
    return { ok: false, errorMessage: 'Email không hợp lệ.' };
  }
  if (normalized === SUPER_ADMIN_EMAIL) {
    return { ok: false, errorMessage: 'Email này đã là Super Admin gốc.' };
  }

  try {
    const { error } = await supabase
      .from('app_admins')
      .upsert([{ email: normalized, added_by: addedBy ?? SUPER_ADMIN_EMAIL }], {
        onConflict: 'email',
      });

    if (error) {
      console.error('[addAppAdmin] Supabase error:', error);
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error('[addAppAdmin] Unexpected error:', err);
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi thêm QTV',
    };
  }
}

export async function removeAppAdmin(email: string): Promise<{
  ok: boolean;
  errorMessage?: string;
}> {
  const normalized = email.trim().toLowerCase();
  if (normalized === SUPER_ADMIN_EMAIL) {
    return { ok: false, errorMessage: 'Không thể gỡ quyền Super Admin gốc.' };
  }

  try {
    const { error } = await supabase
      .from('app_admins')
      .delete()
      .ilike('email', normalized);

    if (error) {
      console.error('[removeAppAdmin] Supabase error:', error);
      return { ok: false, errorMessage: error.message };
    }
    return { ok: true };
  } catch (err) {
    console.error('[removeAppAdmin] Unexpected error:', err);
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : 'Lỗi gỡ quyền QTV',
    };
  }
}
