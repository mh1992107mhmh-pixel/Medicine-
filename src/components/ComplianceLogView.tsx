import React, { useState, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  PieChart as PieChartIcon,
  RotateCcw,
  Calendar,
  TrendingUp,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DoseLog, Medication, Patient } from '../types';
import { formatArabicDate, formatTimeArabic, PATIENT_COLORS } from '../utils/helpers';

interface ComplianceLogViewProps {
  logs: DoseLog[];
  patients: Patient[];
  medications: Medication[];
  onUndoTaken: (logId: string) => void;
}

export const ComplianceLogView: React.FC<ComplianceLogViewProps> = ({
  logs,
  patients,
  medications,
  onUndoTaken,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chart' | 'history'>('chart');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const patientMap = useMemo(() => new Map(patients.map((p) => [p.id, p])), [patients]);
  const medMap = useMemo(() => new Map(medications.map((m) => [m.id, m])), [medications]);

  // Compute logs for the past 7 days
  const pastSevenDaysLogs = useMemo(() => {
    const sevenDaysAgo = Date.now() - 7 * 86400000;
    return logs.filter((log) => {
      const logTime = log.timestamp || new Date(log.scheduledDate).getTime();
      return logTime >= sevenDaysAgo;
    });
  }, [logs]);

  // Filter logs for the selected patient
  const targetWeeklyLogs = useMemo(() => {
    if (selectedPatientId === 'all') return pastSevenDaysLogs;
    return pastSevenDaysLogs.filter((l) => l.patientId === selectedPatientId);
  }, [pastSevenDaysLogs, selectedPatientId]);

  // Calculate statistics for the pie chart
  const weeklyStats = useMemo(() => {
    const taken = targetWeeklyLogs.filter((l) => l.status === 'taken').length;
    const snoozed = targetWeeklyLogs.filter((l) => l.status === 'snoozed').length;
    const skipped = targetWeeklyLogs.filter((l) => l.status === 'skipped').length;
    const total = taken + snoozed + skipped;

    const complianceRate = total > 0 ? Math.round((taken / total) * 100) : 100;

    return { taken, snoozed, skipped, total, complianceRate };
  }, [targetWeeklyLogs]);

  // Recharts data format
  const chartData = useMemo(() => {
    const data = [
      { name: 'مأخوذ في الموعد', value: weeklyStats.taken, color: '#10b981' }, // emerald-500
      { name: 'متأخر / تم تأجيله', value: weeklyStats.snoozed, color: '#f59e0b' }, // amber-500
      { name: 'تم تخطيه', value: weeklyStats.skipped, color: '#f43f5e' }, // rose-500
    ];
    // If all are zero, provide empty placeholder
    if (weeklyStats.total === 0) {
      return [{ name: 'لا توجد بيانات مسجلة', value: 1, color: '#94a3b8' }];
    }
    return data.filter((d) => d.value > 0);
  }, [weeklyStats]);

  // Filter for the detailed history list
  const filteredHistoryLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedPatientId !== 'all' && log.patientId !== selectedPatientId) return false;
      if (selectedStatus !== 'all' && log.status !== selectedStatus) return false;
      return true;
    });
  }, [logs, selectedPatientId, selectedStatus]);

  // Custom Tooltip for Mobile-Friendly Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent =
        weeklyStats.total > 0
          ? Math.round((data.value / weeklyStats.total) * 100)
          : 0;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-xl shadow-lg text-xs space-y-1 dir-rtl text-right">
          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.payload.color }}
            />
            {data.name}
          </p>
          <p className="text-slate-600 dark:text-slate-300 font-mono">
            {data.value} جرعة ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-full space-y-5 pb-24 overflow-x-hidden">
      {/* Header with Title and Mode Switcher */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <PieChartIcon className="w-4 h-4" />
              <span>سجل الأداء والالتزام الدوائي</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
              إحصائيات وسجل تناول الجرعات
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              رسم بياني دائري (Recharts) لنسب التزام المرضى خلال الأسبوع الماضي وتفاصيل كل جرعة
            </p>
          </div>

          {/* Patient Quick Selector */}
          <div className="w-full sm:w-auto">
            <label className="block text-[11px] font-bold text-slate-500 mb-1 sm:hidden">
              اختر المريض:
            </label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              <option value="all">📊 جميع المرضى (نظرة شاملة)</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.avatarEmoji || '👤'} {p.name} ({p.ageGroup})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sub-Tabs: Pie Chart View vs Detailed History Feed */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full sm:w-fit">
          <button
            onClick={() => setActiveSubTab('chart')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'chart'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <PieChartIcon className="w-4 h-4" />
            <span>التقرير الأسبوعي (رسم دائري)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 sm:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'history'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>السجل التفصيلي ({filteredHistoryLogs.length})</span>
          </button>
        </div>
      </section>

      {/* SUBTAB 1: RECHARTS PIE CHART & WEEKLY COMPLIANCE VIEW */}
      {activeSubTab === 'chart' && (
        <div className="space-y-5">
          {/* Main Pie Chart Card */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-600" />
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  نسبة الالتزام خلال آخر 7 أيام:
                  <span className="text-teal-600 dark:text-teal-400 mr-1">
                    {selectedPatientId === 'all'
                      ? 'لكافة المرضى'
                      : patientMap.get(selectedPatientId)?.name}
                  </span>
                </h2>
              </div>

              {/* Weekly Compliance Percentage Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">معدل الالتزام:</span>
                <span
                  className={`text-sm sm:text-base font-black px-3 py-1 rounded-full ${
                    weeklyStats.complianceRate >= 80
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                      : weeklyStats.complianceRate >= 60
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                  }`}
                >
                  {weeklyStats.complianceRate}%
                </span>
              </div>
            </div>

            {/* Recharts Circular Diagram Canvas (Responsive for mobile) */}
            <div className="w-full h-64 sm:h-72 my-2 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mx-1">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 text-center pointer-events-none">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                  {weeklyStats.total}
                </span>
                <span className="block text-[10px] text-slate-400 font-semibold">
                  إجمالي الجرعات
                </span>
              </div>
            </div>

            {/* 3 Metric Cards for Mobile (Taken, Delayed/Snoozed, Skipped) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>مأخوذ</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1 font-mono">
                  {weeklyStats.taken}
                </div>
                <div className="text-[10px] text-emerald-600/80">
                  {weeklyStats.total > 0
                    ? `${Math.round((weeklyStats.taken / weeklyStats.total) * 100)}%`
                    : '0%'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>متأخر / مؤجل</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-1 font-mono">
                  {weeklyStats.snoozed}
                </div>
                <div className="text-[10px] text-amber-600/80">
                  {weeklyStats.total > 0
                    ? `${Math.round((weeklyStats.snoozed / weeklyStats.total) * 100)}%`
                    : '0%'}
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-rose-800 dark:text-rose-300">
                  <XCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>تم تخطيه</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-700 dark:text-rose-300 mt-1 font-mono">
                  {weeklyStats.skipped}
                </div>
                <div className="text-[10px] text-rose-600/80">
                  {weeklyStats.total > 0
                    ? `${Math.round((weeklyStats.skipped / weeklyStats.total) * 100)}%`
                    : '0%'}
                </div>
              </div>
            </div>
          </section>

          {/* Breakdown Per Patient Cards (Comparison on Mobile) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              <span>مقارنة الالتزام لجميع المرضى (خلال الأسبوع الماضي):</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {patients.map((patient) => {
                const patientLogs = pastSevenDaysLogs.filter((l) => l.patientId === patient.id);
                const pTaken = patientLogs.filter((l) => l.status === 'taken').length;
                const pSnoozed = patientLogs.filter((l) => l.status === 'snoozed').length;
                const pSkipped = patientLogs.filter((l) => l.status === 'skipped').length;
                const pTotal = pTaken + pSnoozed + pSkipped;
                const pRate = pTotal > 0 ? Math.round((pTaken / pTotal) * 100) : 100;

                const pColor = PATIENT_COLORS[patient.colorTheme] || PATIENT_COLORS.emerald;

                return (
                  <div
                    key={patient.id}
                    onClick={() => setSelectedPatientId(patient.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedPatientId === patient.id
                        ? `${pColor.lightBg} ${pColor.border} border-2 shadow-sm`
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{patient.avatarEmoji || '👤'}</span>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            {patient.name}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {patient.ageGroup} · {pTotal} جرعات مجدولة
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-full ${
                          pRate >= 80
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {pRate}%
                      </span>
                    </div>

                    {/* Compact Horizontal Stack Bar for Mobile */}
                    <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 flex overflow-hidden">
                      <div
                        style={{ width: `${pTotal > 0 ? (pTaken / pTotal) * 100 : 100}%` }}
                        className="bg-emerald-500 h-full"
                        title="مأخوذ"
                      />
                      <div
                        style={{ width: `${pTotal > 0 ? (pSnoozed / pTotal) * 100 : 0}%` }}
                        className="bg-amber-500 h-full"
                        title="متأخر / مؤجل"
                      />
                      <div
                        style={{ width: `${pTotal > 0 ? (pSkipped / pTotal) * 100 : 0}%` }}
                        className="bg-rose-500 h-full"
                        title="تم تخطيه"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2">
                      <span className="text-emerald-600 font-semibold">✓ {pTaken} مأخوذ</span>
                      <span className="text-amber-600 font-semibold">⏱️ {pSnoozed} متأخر</span>
                      <span className="text-rose-600 font-semibold">✕ {pSkipped} تخطي</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* SUBTAB 2: DETAILED HISTORY FEED */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">تصفية الحالة:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
              >
                <option value="all">الكل</option>
                <option value="taken">تم التناول فقط ✅</option>
                <option value="snoozed">مؤجل / متأخر ⏱️</option>
                <option value="skipped">تم التخطي ❌</option>
              </select>
            </div>
            <span className="text-slate-400 font-mono">
              {filteredHistoryLogs.length} سجل
            </span>
          </div>

          {filteredHistoryLogs.length === 0 ? (
            <div className="p-10 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
              <p className="text-sm font-semibold">لا توجد سجلات مطابقة لهذا الفلتر</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredHistoryLogs.map((log) => {
                const patient = patientMap.get(log.patientId);
                const med = medMap.get(log.medicationId);
                const isTaken = log.status === 'taken';
                const isSkipped = log.status === 'skipped';
                const isSnoozed = log.status === 'snoozed';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          isTaken
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                            : isSkipped
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-600'
                        }`}
                      >
                        {isTaken && <CheckCircle2 className="w-5 h-5" />}
                        {isSkipped && <XCircle className="w-5 h-5" />}
                        {isSnoozed && <Clock className="w-5 h-5" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {med ? med.name : 'دواء'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            لـ {patient ? patient.name : 'المريض'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>الموعد: {formatTimeArabic(log.scheduledTime)}</span>
                          {log.actualTime && (
                            <>
                              <span>·</span>
                              <span>التناول الفعلي: {log.actualTime}</span>
                            </>
                          )}
                          <span>·</span>
                          <span>بواسطة: {log.recordedBy}</span>
                        </div>

                        {log.note && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 italic mt-0.5">
                            السبب: {log.note}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                        {log.scheduledDate}
                      </span>
                      {isTaken && (
                        <button
                          onClick={() => onUndoTaken(log.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="تراجع عن التأكيد"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
