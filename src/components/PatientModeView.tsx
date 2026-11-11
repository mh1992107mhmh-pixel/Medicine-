import React from 'react';
import {
  CheckCircle2,
  Clock,
  Heart,
  AlertCircle,
  HelpCircle,
  Calendar,
  Check,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DoseLog, Medication, Patient } from '../types';
import { sound } from '../services/sound';
import {
  formatArabicDate,
  formatTimeArabic,
  getCountdownToTime,
  getTodayDateString,
  MEAL_INSTRUCTION_LABELS,
  MED_FORM_LABELS,
  PATIENT_COLORS,
} from '../utils/helpers';

interface PatientModeViewProps {
  patients: Patient[];
  activePatient: Patient;
  onSelectPatient: (patientId: string) => void;
  medications: Medication[];
  logs: DoseLog[];
  onMarkTaken: (medicationId: string, patientId: string, scheduledTime: string) => void;
  onSnooze: (medicationId: string, patientId: string, scheduledTime: string, minutes: number) => void;
  onUndoTaken: (logId: string) => void;
  onOpenSync: () => void;
  onSwitchToCaregiver: () => void;
}

export const PatientModeView: React.FC<PatientModeViewProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  medications,
  logs,
  onMarkTaken,
  onSnooze,
  onUndoTaken,
  onOpenSync,
  onSwitchToCaregiver,
}) => {
  const todayStr = getTodayDateString();

  // Filter meds belonging to active patient
  const patientMeds = medications.filter((m) => m.patientId === activePatient.id && m.active);

  // Flatten all today's dose slots for this patient
  interface DoseSlot {
    time: string;
    medication: Medication;
    status: 'taken' | 'snoozed' | 'skipped' | 'pending';
    log?: DoseLog;
  }

  const doseSlots: DoseSlot[] = [];
  patientMeds.forEach((med) => {
    med.times.forEach((time) => {
      // Find if there is a log for today + this med + this time
      const matchingLog = logs.find(
        (l) =>
          l.patientId === activePatient.id &&
          l.medicationId === med.id &&
          l.scheduledDate === todayStr &&
          l.scheduledTime === time
      );

      doseSlots.push({
        time,
        medication: med,
        status: matchingLog ? matchingLog.status : 'pending',
        log: matchingLog,
      });
    });
  });

  // Sort slots chronologically
  doseSlots.sort((a, b) => a.time.localeCompare(b.time));

  // Determine next pending dose
  const nextPendingDose = doseSlots.find((s) => s.status === 'pending');
  const totalDoses = doseSlots.length;
  const takenCount = doseSlots.filter((s) => s.status === 'taken').length;
  const progressPercent = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 100;
  const allCompleted = totalDoses > 0 && takenCount === totalDoses;

  const handleQuickTake = (slot: DoseSlot) => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.65 },
      });
    } catch {
      // ignore
    }
    sound.playTakenSuccess();
    onMarkTaken(slot.medication.id, activePatient.id, slot.time);
  };

  const patientColor = PATIENT_COLORS[activePatient.colorTheme] || PATIENT_COLORS.emerald;

  return (
    <div className="space-y-6 pb-20">
      {/* Patient Header & Quick Selector */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-14 h-14 rounded-2xl ${patientColor.lightBg} ${patientColor.border} border-2 flex items-center justify-center text-3xl shadow-inner`}
            >
              {activePatient.avatarEmoji || '🧓'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {activePatient.ageGroup}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {patientMeds.length} أدوية مجدولة
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {activePatient.name}
              </h1>
            </div>
          </div>

          {/* If there are multiple patients, show fast switcher tabs */}
          {patients.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-slate-500 whitespace-nowrap hidden lg:inline">
                التبديل بين المرضى:
              </span>
              {patients.map((p) => {
                const isActive = p.id === activePatient.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPatient(p.id)}
                    className={`px-3 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{p.avatarEmoji || '👤'}</span>
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Date and Daily Progress Bar */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>{formatArabicDate(todayStr)}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-36 sm:w-48 bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {takenCount} من {totalDoses} جرعات اليوم ({progressPercent}%)
            </span>
          </div>
        </div>
      </section>

      {/* Next Dose Hero Card */}
      {nextPendingDose ? (
        <section className="bg-gradient-to-br from-teal-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 border-2 border-teal-500/30 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-600 text-white shadow-xs">
                  <Clock className="w-3.5 h-3.5" />
                  الجرعة القادمة التالية
                </span>
                <span className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                  {getCountdownToTime(nextPendingDose.time).text}
                </span>
              </div>

              <div className="flex items-start gap-4">
                {nextPendingDose.medication.imageUrl ? (
                  <img
                    src={nextPendingDose.medication.imageUrl}
                    alt={nextPendingDose.medication.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-teal-500 shadow-sm bg-white shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center text-4xl shrink-0">
                    {MED_FORM_LABELS[nextPendingDose.medication.form].icon}
                  </div>
                )}

                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    {nextPendingDose.medication.name}
                  </h2>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                    الجرعة: {nextPendingDose.medication.dosage} ({MED_FORM_LABELS[nextPendingDose.medication.form].label})
                  </p>
                  <p className="text-sm text-teal-800 dark:text-teal-300 font-medium">
                    📌 {MEAL_INSTRUCTION_LABELS[nextPendingDose.medication.instruction].label} -{' '}
                    {MEAL_INSTRUCTION_LABELS[nextPendingDose.medication.instruction].desc}
                  </p>
                  {nextPendingDose.medication.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                      {nextPendingDose.medication.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Huge Touch Action Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0 lg:w-64">
              <div className="text-center p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-teal-200 dark:border-slate-700">
                <span className="text-xs text-slate-500 dark:text-slate-400">الموعد المحدد</span>
                <div className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono dir-ltr">
                  {formatTimeArabic(nextPendingDose.time)}
                </div>
              </div>

              <button
                onClick={() => handleQuickTake(nextPendingDose)}
                className="w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base sm:text-lg flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/30 active:scale-[0.98] transition-all"
              >
                <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                <span>تم أخذ الدواء الآن</span>
              </button>

              {/* Quick Snooze & Postpone (غير متناول الآن) */}
              <div className="space-y-1.5 w-full">
                <span className="block text-[11px] font-bold text-slate-500 text-center">
                  غير متناول الآن؟ اختر التذكير:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playSnoozeTone();
                      onSnooze(nextPendingDose.medication.id, activePatient.id, nextPendingDose.time, 5);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1 border border-amber-300 dark:border-amber-700"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>بعد 5 دقائق</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playSnoozeTone();
                      onSnooze(nextPendingDose.medication.id, activePatient.id, nextPendingDose.time, 10);
                    }}
                    className="py-2.5 px-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1 border border-amber-300 dark:border-amber-700"
                  >
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>بعد 10 د كحد أقصى</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : allCompleted ? (
        <section className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-3xl p-6 sm:p-8 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Heart className="w-8 h-8 fill-emerald-500 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-emerald-900 dark:text-emerald-200">
            أحسنت! اكتملت جميع جرعات اليوم
          </h2>
          <p className="text-sm text-emerald-800 dark:text-emerald-300 max-w-md mx-auto">
            تم تناول جميع الأدوية المجدولة لـ {activePatient.name} بنجاح والتزام تام. نتمنى لك دوام الصحة والعافية!
          </p>
        </section>
      ) : (
        <section className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 text-center space-y-2">
          <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
            لا توجد أدوية مضافة لهذا المريض اليوم
          </h2>
          <p className="text-xs text-slate-500">
            يمكنك الانتقال إلى وضع المرافق لإضافة وتعديل الأدوية ومواعيدها.
          </p>
          <button
            onClick={onSwitchToCaregiver}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-semibold text-xs hover:bg-teal-700 transition-colors"
          >
            الانتقال لإضافة دواء
          </button>
        </section>
      )}

      {/* Today's Full Schedule Timeline */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            جدول جرعات اليوم ({doseSlots.length} مواعيد)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            اضغط على الجرعة لتأكيدها أو إلغائها
          </span>
        </div>

        {doseSlots.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            لا توجد جرعات مجدولة اليوم
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doseSlots.map((slot, index) => {
              const isTaken = slot.status === 'taken';
              const isSkipped = slot.status === 'skipped';
              const formMeta = MED_FORM_LABELS[slot.medication.form];

              return (
                <div
                  key={`${slot.medication.id}-${slot.time}-${index}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    isTaken
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60'
                      : isSkipped
                      ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-400'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {slot.medication.imageUrl && !isTaken ? (
                      <img
                        src={slot.medication.imageUrl}
                        alt={slot.medication.name}
                        className="w-12 h-12 rounded-xl object-cover border border-teal-400 shadow-xs bg-white shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                          isTaken
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {isTaken ? <Check className="w-6 h-6 stroke-[3]" /> : formMeta.icon}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white dir-ltr">
                          {formatTimeArabic(slot.time)}
                        </span>
                        {isTaken && (
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            تم التناول ({slot.log?.actualTime?.slice(0, 5) || ''})
                          </span>
                        )}
                        {isSkipped && (
                          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400">
                            تم التخطي
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {slot.medication.name}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        الجرعة: {slot.medication.dosage} · {MEAL_INSTRUCTION_LABELS[slot.medication.instruction].label}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isTaken ? (
                      <button
                        onClick={() => slot.log && onUndoTaken(slot.log.id)}
                        title="تراجع عن تأكيد الجرعة"
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            sound.playSnoozeTone();
                            onSnooze(slot.medication.id, activePatient.id, slot.time, 5);
                          }}
                          title="غير متناول الآن: تذكير بعد 5 دقائق"
                          className="py-2 px-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 hover:bg-amber-100 font-bold text-[11px] border border-amber-300 dark:border-amber-700/60 transition-colors whitespace-nowrap"
                        >
                          بعد 5د
                        </button>
                        <button
                          onClick={() => handleQuickTake(slot)}
                          className="py-2.5 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all whitespace-nowrap"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>أخذت</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Patient Emergency / Fast Caregiver Help Bar */}
      <section className="bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
          <HelpCircle className="w-4 h-4 text-teal-600 shrink-0" />
          <span>
            هل تحتاج إلى تعديل المواعيد أو إضافة دواء جديد؟ يمكنك استخدام وضع المرافق أو مزامنة الجهاز مع مرافقيك.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSync}
            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition-colors"
          >
            المزامنة والـ QR
          </button>
          <button
            onClick={onSwitchToCaregiver}
            className="px-3 py-1.5 rounded-lg bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors"
          >
            إدارة المرضى والأدوية
          </button>
        </div>
      </section>
    </div>
  );
};
