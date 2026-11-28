import { Edit3, Plus, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import {
  deleteAdmissionBenchmark,
  fetchAdmissionBenchmarks,
  importAdmissionBenchmarksBatch,
  upsertAdmissionBenchmark,
  type AdmissionBenchmark,
} from '../lib/benchmarkService';

export const BenchmarkAdminTab: React.FC = () => {
  const [items, setItems] = useState<AdmissionBenchmark[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [universityName, setUniversityName] = useState('');
  const [majorCode, setMajorCode] = useState('');
  const [majorName, setMajorName] = useState('');
  const [year, setYear] = useState(2025);
  const [cutoffTsa, setCutoffTsa] = useState('');
  const [cutoffHsa, setCutoffHsa] = useState('');
  const [cutoffVact, setCutoffVact] = useState('');
  const [cutoffThptqg, setCutoffThptqg] = useState('');

  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const loadList = useCallback(async () => {
    setLoading(true);
    const res = await fetchAdmissionBenchmarks();
    setItems(res.benchmarks);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const resetForm = () => {
    setEditingId(undefined);
    setUniversityName('');
    setMajorCode('');
    setMajorName('');
    setYear(2025);
    setCutoffTsa('');
    setCutoffHsa('');
    setCutoffVact('');
    setCutoffThptqg('');
  };

  const handleEdit = (b: AdmissionBenchmark) => {
    setEditingId(b.id);
    setUniversityName(b.university_name);
    setMajorCode(b.major_code);
    setMajorName(b.major_name);
    setYear(b.year);
    setCutoffTsa(b.cutoff_tsa !== null ? String(b.cutoff_tsa) : '');
    setCutoffHsa(b.cutoff_hsa !== null ? String(b.cutoff_hsa) : '');
    setCutoffVact(b.cutoff_vact !== null ? String(b.cutoff_vact) : '');
    setCutoffThptqg(b.cutoff_thptqg !== null ? String(b.cutoff_thptqg) : '');
    setMsg(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (!universityName.trim() || !majorName.trim()) {
      setMsg({ type: 'error', text: 'Vui lòng nhập Tên trường và Tên ngành.' });
      return;
    }

    const toNumOrNull = (val: string) =>
      val.trim() === '' || Number.isNaN(Number(val)) ? null : Number(val);

    const res = await upsertAdmissionBenchmark({
      id: editingId,
      university_name: universityName,
      major_code: majorCode || 'N/A',
      major_name: majorName,
      year: Number(year || 2025),
      cutoff_tsa: toNumOrNull(cutoffTsa),
      cutoff_hsa: toNumOrNull(cutoffHsa),
      cutoff_vact: toNumOrNull(cutoffVact),
      cutoff_thptqg: toNumOrNull(cutoffThptqg),
    });

    if (res.ok) {
      setMsg({ type: 'success', text: 'Đã lưu điểm chuẩn thành công!' });
      resetForm();
      await loadList();
    } else {
      setMsg({
        type: 'error',
        text: `Đã lưu cục bộ (Supabase: ${res.errorMessage ?? 'lỗi kết nối'}).`,
      });
      await loadList();
    }
  };

  const handleDelete = async (id: string) => {
    const res = await deleteAdmissionBenchmark(id);
    if (res.ok) {
      setMsg({ type: 'success', text: 'Đã xóa ngành khỏi danh sách điểm chuẩn.' });
    }
    await loadList();
  };

  const handleImport = async () => {
    setMsg(null);
    const trimmed = importText.trim();
    if (!trimmed) return;

    try {
      let parsedRows: Array<Omit<AdmissionBenchmark, 'id' | 'created_at'>> = [];
      if (trimmed.startsWith('[')) {
        parsedRows = JSON.parse(trimmed);
      } else {
        // Parse CSV lines: university_name,major_code,major_name,year,cutoff_tsa,cutoff_hsa,cutoff_vact,cutoff_thptqg
        const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
        for (const line of lines) {
          const cols = line.split(',').map((c) => c.trim());
          if (cols.length < 3 || cols[0].toLowerCase() === 'university_name') continue;
          const num = (v?: string) => (v && !Number.isNaN(Number(v)) ? Number(v) : null);
          parsedRows.push({
            university_name: cols[0],
            major_code: cols[1] || 'N/A',
            major_name: cols[2],
            year: Number(cols[3] || 2025),
            cutoff_tsa: num(cols[4]),
            cutoff_hsa: num(cols[5]),
            cutoff_vact: num(cols[6]),
            cutoff_thptqg: num(cols[7]),
          });
        }
      }

      const res = await importAdmissionBenchmarksBatch(parsedRows);
      setImportOpen(false);
      setImportText('');
      if (res.ok) {
        setMsg({ type: 'success', text: `Đã import ${res.count} ngành thành công!` });
      } else {
        setMsg({ type: 'error', text: res.errorMessage ?? 'Lỗi import dữ liệu.' });
      }
      await loadList();
    } catch {
      setMsg({ type: 'error', text: 'Định dạng JSON/CSV không hợp lệ.' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-medium text-[#2a161b] dark:text-white">
            Quản lý Điểm chuẩn các Trường Đại học
          </h2>
          <p className="text-xs text-[#876870] dark:text-[#c49ba3] mt-0.5">
            Thêm, sửa, xóa hoặc import JSON/CSV điểm chuẩn để học sinh đối chiếu cửa đỗ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="btn btn-pill btn-sm"
          >
            <Upload className="w-3.5 h-3.5 text-crimson" />
            Import JSON/CSV
          </button>
          <button
            type="button"
            onClick={loadList}
            disabled={loading}
            className="btn btn-pill btn-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-crimson ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`rounded-2xl border px-4 py-2.5 text-xs font-medium ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Form Add / Edit */}
      <form
        onSubmit={handleSave}
        className="glass-card rounded-[24px] p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#2a161b]">
            {editingId ? 'Chỉnh sửa điểm chuẩn' : 'Thêm ngành / điểm chuẩn mới'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-medium text-crimson hover:underline cursor-pointer"
            >
              Hủy sửa
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <input
            type="text"
            required
            value={universityName}
            onChange={(e) => setUniversityName(e.target.value)}
            placeholder="Tên trường (VD: ĐH Bách khoa HN)"
            className="sm:col-span-2 rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="text"
            value={majorCode}
            onChange={(e) => setMajorCode(e.target.value)}
            placeholder="Mã ngành (VD: IT-E10)"
            className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            placeholder="Năm (2025)"
            className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-mono text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="text"
            required
            value={majorName}
            onChange={(e) => setMajorName(e.target.value)}
            placeholder="Tên ngành học"
            className="sm:col-span-4 rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            value={cutoffTsa}
            onChange={(e) => setCutoffTsa(e.target.value)}
            placeholder="Điểm chuẩn TSA (/100)"
            className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-mono text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            value={cutoffHsa}
            onChange={(e) => setCutoffHsa(e.target.value)}
            placeholder="Điểm chuẩn HSA (/150)"
            className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-mono text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            value={cutoffVact}
            onChange={(e) => setCutoffVact(e.target.value)}
            placeholder="Điểm chuẩn V-ACT (/1200)"
            className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-mono text-[#2a161b] focus:border-crimson focus:outline-none"
          />
          <input
            type="number"
            step="0.01"
            value={cutoffThptqg}
            onChange={(e) => setCutoffThptqg(e.target.value)}
            placeholder="Điểm chuẩn THPTQG (/30)"
            className="rounded-2xl border border-[var(--line)] bg-white px-3.5 py-2 text-xs font-mono text-[#2a161b] focus:border-crimson focus:outline-none"
          />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn btn-crimson btn-sm">
            {editingId ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {editingId ? 'Cập nhật điểm chuẩn' : 'Thêm điểm chuẩn'}
          </button>
        </div>
      </form>

      {/* Benchmarks Table */}
      <div className="glass-card rounded-[24px] overflow-hidden">
        <div className="divide-y divide-[var(--line)]">
          {items.map((b) => (
            <div
              key={b.id}
              className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[#2a161b]">
                    {b.university_name}
                  </span>
                  <span className="rounded-full bg-[#ffeff1] border border-crimson/20 px-2 py-0.5 text-[10px] font-mono font-bold text-crimson">
                    {b.major_code} · {b.year}
                  </span>
                </div>
                <div className="text-xs text-[#5e4249]">{b.major_name}</div>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#876870]">
                  {b.cutoff_tsa !== null && <span>TSA: {b.cutoff_tsa}</span>}
                  {b.cutoff_hsa !== null && <span>HSA: {b.cutoff_hsa}</span>}
                  {b.cutoff_vact !== null && <span>V-ACT: {b.cutoff_vact}</span>}
                  {b.cutoff_thptqg !== null && <span>THPTQG: {b.cutoff_thptqg}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleEdit(b)}
                  className="btn btn-pill btn-sm"
                >
                  <Edit3 className="w-3.5 h-3.5 text-crimson" />
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(b.id)}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import JSON / CSV Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-xl rounded-[24px] bg-white border border-[var(--line)] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2a161b]">
                Import nhanh Điểm chuẩn (JSON hoặc CSV)
              </h3>
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="p-1 text-[#876870] hover:text-crimson cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#876870]">
              CSV theo thứ tự: <code>university_name,major_code,major_name,year,cutoff_tsa,cutoff_hsa,cutoff_vact,cutoff_thptqg</code>
            </p>
            <textarea
              rows={6}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="ĐH Bách khoa HN,IT1,Khoa học Máy tính,2025,81.5,,,28.9"
              className="w-full rounded-2xl border border-[var(--line)] p-3 text-xs font-mono focus:border-crimson focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setImportOpen(false)}
                className="btn btn-pill btn-sm"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="btn btn-crimson btn-sm"
              >
                Import ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
