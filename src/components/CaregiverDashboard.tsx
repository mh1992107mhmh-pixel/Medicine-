import React, { useState } from 'react';
import {
  Users,
  Plus,
  Pill,
  Clock,
  AlertTriangle,
  QrCode,
  Share2,
  Trash2,
  Edit3,
  UserPlus,
  HeartHandshake,
  PackageCheck,
  CheckCircle2,
  Bell,
  BellOff,
  Copy,
  Check,
  Key,
  Shield,
  Camera,
  Sliders,
} from 'lucide-react';
import { DoseLog, Follower, Medication, Patient } from '../types';
import {
  formatTimeArabic,
  getTodayDateString,
  MEAL_INSTRUCTION_LABELS,
  MED_FORM_LABELS,
  PATIENT_COLORS,
} from '../utils/helpers';
import { SOUND_DEFINITIONS } from '../services/sound';

interface CaregiverDashboardProps {
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patientId: string) => void;
  onOpenAddPatient: () => void;
  onOpenEditPatient: (patient: Patient) => void;
  onDeletePatient: (patientId: string) => void;
  medications: Medication[];
  onOpenAddMedication: () => void;
  onOpenEditMedication: (medication: Medication) => void;
  onDeleteMedication: (medicationId: string) => void;
  onToggleMedicationActive: (medicationId: string) => void;
  onRefillStock: (medicationId: string, amount: number) => void;
  followers: Follower[];
  onOpenAddFollower: () => void;
  onOpenEditFollower: (follower: Follower) => void;
  onDeleteFollower: (followerId: string) => void;
  onOpenNotificationSettings: () => void;
  logs: DoseLog[];
  syncRoomCode: string;
  onOpenSync: () => void;
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  onOpenAddPatient,
  onOpenEditPatient,
  onDeletePatient,
  medications,
  onOpenAddMedication,
  onOpenEditMedication,
  onDeleteMedication,
  onToggleMedicationActive,
  onRefillStock,
  followers,
  onOpenAddFollower,
  onOpenEditFollower,
  onDeleteFollower,
  onOpenNotificationSettings,
  logs,
  syncRoomCode,
  onOpenSync,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'low_stock'>('all');
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const todayStr = getTodayDateString();

  // Meds for active patient
  const patientMeds = medications.filter((m) => m.patientId === activePatient.id);

  const filteredMeds = patientMeds.filter((m) => {
    if (selectedFilter === 'active') return m.active;
    if (selectedFilter === 'low_stock') return m.stockCount <= m.lowStockAlert;
    return true;
  });

  // Calculate compliance for active patient today
  const patientTodayLogs = logs.filter(
    (l) => l.patientId === activePatient.id && l.scheduledDate === todayStr
  );
  const totalPatientDoseSlots = patientMeds.reduce((acc, m) => acc + (m.active ? m.times.length : 0), 0);
  const takenCount = patientTodayLogs.filter((l) => l.status === 'taken').length;
  const complianceRate =
    totalPatientDoseSlots > 0 ? Math.round((takenCount / totalPatientDoseSlots) * 100) : 100;

  const handleCopyToken = (id: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedTokenId(id);
    setTimeout(() => setCopiedTokenId(null), 2000);
  };

  const patientMap = new Map(patients.map((p) => [p.id, p]));

  return (
    <div className="space-y-8 pb-20">
      {/* Caregiver Welcome & Multi-Patient Header */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-600 dark:text-teal-400">
              <HeartHandshake className="w-4 h-4" />
              <span>لوحة تحكم المرافق والمشرف الصحي</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              إدارة المرضى والمتابعين وجداول العلاج
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              متابعة عدة مرضى، تعيين المتابعين، وتخصيص نغمات الإشعارات بالرموز التشاركية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Notification settings shortcut */}
            <button
              onClick={onOpenNotificationSettings}
              className="px-3.5 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 font-bold text-xs flex items-center gap-2 border border-teal-200 dark:border-teal-800/60 transition-colors"
            >
              <Bell className="w-4 h-4 text-teal-600" />
              <span>تخصيص النغمات والإشعارات</span>
            </button>

            {/* Sync room code */}
            <button
              onClick={onOpenSync}
              className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4 text-teal-600" />
              <span>رمز الغرفة:</span>
              <span className="font-mono bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded dir-ltr text-teal-600">
                {syncRoomCode}
              </span>
            </button>

            <button
              onClick={onOpenAddPatient}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة مريض جديد</span>
            </button>
          </div>
        </div>

        {/* Patients Strip */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              قائمة المرضى ({patients.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {patients.map((patient) => {
              const isSelected = patient.id === activePatient.id;
              const pColor = PATIENT_COLORS[patient.colorTheme] || PATIENT_COLORS.emerald;
              const pMeds = medications.filter((m) => m.patientId === patient.id);
              const pActiveMeds = pMeds.filter((m) => m.active);

              // Followers assigned to this patient
              const assignedFollowers = followers.filter(
                (f) =>
                  f.assignedPatientIds.includes('all') ||
                  f.assignedPatientIds.includes(patient.id)
              );

              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? `${pColor.lightBg} ${pColor.border} border-2 shadow-sm ring-2 ${pColor.ring}`
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-xs">
                        {patient.avatarEmoji || '👤'}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 dark:text-white">
                          {patient.name}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {patient.ageGroup} · {pActiveMeds.length} أدوية نشطة
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenEditPatient(patient)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="تعديل المريض"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      {patients.length > 1 && (
                        <button
                          onClick={() => onDeletePatient(patient.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="حذف المريض"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Assigned Followers Count */}
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-600" />
                      <span>
                        المتابعون: {assignedFollowers.length > 0 ? assignedFollowers.map((f) => f.name.split(' ')[0]).join('، ') : 'لا يوجد'}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="font-bold text-teal-600 dark:text-teal-400">
                        المعروض حالياً ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Followers & Caregivers Management Section */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                المتابعون والمشرفون والرموز التشاركية ({followers.length})
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              يمكن لكل متابع استخدام رمزه التشاركي لمتابعة مواعيد المرضى المخصصين له واستلام إشعاراتهم فورياً دون تسجيل حساب
            </p>
          </div>

          <button
            onClick={onOpenAddFollower}
            className="px-3.5 py-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 border border-teal-200 dark:border-teal-800/60 font-bold text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة متابع جديد</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {followers.map((follower) => {
            // Determine assigned patient names
            const assignedNames = follower.assignedPatientIds.includes('all')
              ? 'جميع المرضى المسجلين'
              : follower.assignedPatientIds
                  .map((id) => patientMap.get(id)?.name)
                  .filter(Boolean)
                  .join('، ') || 'لم يحدد';

            const isCopied = copiedTokenId === follower.id;

            return (
              <div
                key={follower.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {follower.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 font-semibold">
                        {follower.relationship}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {follower.phoneOrContact || 'متابع للتنبيهات والجرعات'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenEditFollower(follower)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                      title="تعديل بيانات المتابع"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {followers.length > 1 && (
                      <button
                        onClick={() => onDeleteFollower(follower.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="حذف المتابع"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Assigned Patients Badge */}
                <div className="text-xs p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-teal-600" />
                      <span>المرضى المخصصون:</span>
                    </span>
                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        follower.receiveNotifications
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {follower.receiveNotifications ? (
                        <>
                          <Bell className="w-3 h-3" />
                          <span>التنبيه نشط</span>
                        </>
                      ) : (
                        <>
                          <BellOff className="w-3 h-3" />
                          <span>التنبيه معطل</span>
                        </>
                      )}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {assignedNames}
                  </p>
                </div>

                {/* Follower Shared Token */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono dir-ltr truncate">
                    <Key className="w-3 h-3 text-amber-500 shrink-0" />
                    <span className="truncate">{follower.shareToken}</span>
                  </div>
                  <button
                    onClick={() => handleCopyToken(follower.id, follower.shareToken)}
                    className="p-1 px-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold text-[10px] flex items-center gap-1 shrink-0 hover:bg-slate-100"
                    title="نسخ رمز المتابع"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{isCopied ? 'تم!' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Medication Management Section for Active Patient */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                أدوية {activePatient.name} ({patientMeds.length})
              </h2>
              <span className="text-xs text-slate-500">
                نسبة الالتزام بالجرعات اليوم: {complianceRate}% ({takenCount} من {totalPatientDoseSlots} جرعات)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddMedication}
              className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دواء جديد</span>
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedFilter === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            الكل ({patientMeds.length})
          </button>
          <button
            onClick={() => setSelectedFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedFilter === 'active'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            النشطة فقط ({patientMeds.filter((m) => m.active).length})
          </button>
          <button
            onClick={() => setSelectedFilter('low_stock')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              selectedFilter === 'low_stock'
                ? 'bg-white dark:bg-slate-700 text-rose-700 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            أوشكت على النفاد ({patientMeds.filter((m) => m.stockCount <= m.lowStockAlert).length})
          </button>
        </div>

        {/* Medication Cards Grid */}
        {filteredMeds.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
            <p>لا توجد أدوية مطابقة لهذا التصنيف.</p>
            <button
              onClick={onOpenAddMedication}
              className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline"
            >
              + إضافة أول دواء لـ {activePatient.name}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMeds.map((med) => {
              const formMeta = MED_FORM_LABELS[med.form];
              const mealMeta = MEAL_INSTRUCTION_LABELS[med.instruction];
              const isLowStock = med.stockCount <= med.lowStockAlert;

              return (
                <div
                  key={med.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    !med.active
                      ? 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : isLowStock
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Box photo thumbnail if available, or form icon */}
                      {med.imageUrl ? (
                        <div
                          onClick={() => setPreviewImage(med.imageUrl || null)}
                          className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-xs shrink-0 relative group"
                        >
                          <img
                            src={med.imageUrl}
                            alt={med.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-2xl shrink-0">
                          {formMeta.icon}
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {med.name}
                          </h3>
                          {!med.active && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              موقوف مؤقتاً
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold mt-0.5">
                          {med.dosage} · {formMeta.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          📌 {mealMeta.label}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onOpenEditMedication(med)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        title="تعديل الدواء"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMedication(med.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="حذف الدواء"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Scheduled Times */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      المواعيد ({med.times.length} مرات):
                    </span>
                    {med.times.map((time) => (
                      <span
                        key={time}
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/50 dark:border-teal-800/40 dir-ltr"
                      >
                        {formatTimeArabic(time)}
                      </span>
                    ))}
                  </div>

                  {/* Stock counter and refill button */}
                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-700/40">
                    <div className="flex items-center gap-1.5">
                      <PackageCheck className="w-4 h-4 text-slate-400" />
                      <span className={isLowStock ? 'font-bold text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}>
                        الرصيد: {med.stockCount} جرعة
                        {isLowStock && ' (يوشك على النفاد!)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRefillStock(med.id, 10)}
                        className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        + إعادة تعبئة 10
                      </button>
                      <button
                        onClick={() => onToggleMedicationActive(med.id)}
                        className={`text-[11px] font-semibold ${
                          med.active ? 'text-amber-600 hover:underline' : 'text-emerald-600 hover:underline'
                        }`}
                      >
                        {med.active ? 'إيقاف مؤقت' : 'تفعيل'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Box Photo Full Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl p-4 overflow-hidden shadow-2xl">
            <img src={previewImage} alt="صورة علبة الدواء المكبرة" className="w-full rounded-2xl object-contain max-h-[75vh]" />
            <div className="text-center mt-3 text-xs text-slate-500 font-semibold">
              انقر في أي مكان للإغلاق
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
