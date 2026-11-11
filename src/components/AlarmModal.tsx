import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  XCircle,
  VolumeX,
  AlertTriangle,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ActiveDoseAlert } from '../types';
import { sound } from '../services/sound';
import { formatTimeArabic, MEAL_INSTRUCTION_LABELS, MED_FORM_LABELS } from '../utils/helpers';

interface AlarmModalProps {
  alert: ActiveDoseAlert | null;
  onConfirmTaken: (medicationId: string, patientId: string, time: string) => void;
  onSnooze: (medicationId: string, patientId: string, time: string, minutes: number) => void;
  onSkip: (medicationId: string, patientId: string, time: string, reason: string) => void;
  onClose: () => void;
  soundEnabled: boolean;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  alert,
  onConfirmTaken,
  onSnooze,
  onSkip,
  onClose,
  soundEnabled,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [showSkipReasons, setShowSkipReasons] = useState(false);
  const [skipReason, setSkipReason] = useState('أمر الطبيب بالإيقاف المؤقت');

  useEffect(() => {
    if (alert && soundEnabled && !isMuted) {
      const soundType = alert.medication.reminderSound || 'tri_tone_alarm';
      sound.playSound(soundType, 0.7);

      // Ring again every 8 seconds while open if not muted
      const interval = setInterval(() => {
        if (!isMuted) {
          sound.playSound(soundType, 0.5);
        }
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [alert, soundEnabled, isMuted]);

  if (!alert) return null;

  const handleTaken = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
    sound.playTakenSuccess();
    onConfirmTaken(alert.medication.id, alert.patient.id, alert.scheduledTime);
    onClose();
  };

  const handleSnooze = (mins = 10) => {
    sound.playSnoozeTone();
    onSnooze(alert.medication.id, alert.patient.id, alert.scheduledTime, mins);
    onClose();
  };

  const handleSkipConfirm = () => {
    onSkip(alert.medication.id, alert.patient.id, alert.scheduledTime, skipReason);
    onClose();
  };

  const instructionInfo = MEAL_INSTRUCTION_LABELS[alert.medication.instruction];
  const formInfo = MED_FORM_LABELS[alert.medication.form];

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border-2 border-teal-500/50 dark:border-teal-500/40 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6 relative">
        {/* Urgent header with sound toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 tracking-wide uppercase">
                تنبيه موعد الدواء الآن
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                حان وقت تناول الجرعة
              </h2>
            </div>
          </div>

          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl transition-colors ${
              isMuted
                ? 'bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
            title={isMuted ? 'الصوت مكتوم' : 'كتم رنين التنبيه'}
          >
            <VolumeX className="w-5 h-5" />
          </button>
        </div>

        {/* Patient & Medication Hero Card */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-lg">{alert.patient.avatarEmoji || '👤'}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                المريض: {alert.patient.name}
              </span>
            </div>
            <span className="font-mono font-bold text-teal-600 dark:text-teal-400 text-sm dir-ltr">
              {formatTimeArabic(alert.scheduledTime)}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              {/* Box Photo if uploaded! */}
              {alert.medication.imageUrl ? (
                <img
                  src={alert.medication.imageUrl}
                  alt={alert.medication.name}
                  className="w-16 h-16 rounded-xl object-cover border-2 border-teal-500 shadow-xs bg-white shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-700 flex items-center justify-center text-3xl shadow-xs shrink-0">
                  {formInfo.icon}
                </div>
              )}

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {alert.medication.name}
                </h3>
                <p className="text-sm font-semibold text-teal-700 dark:text-teal-400">
                  الجرعة المطلوبة: {alert.medication.dosage} ({formInfo.label})
                </p>
              </div>
            </div>
          </div>

          {/* Custom reminder message if present */}
          {alert.customMessage && (
            <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs font-medium text-teal-900 dark:text-teal-200">
              💬 {alert.customMessage}
            </div>
          )}

          {/* Meal and Instructions */}
          {instructionInfo && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>{instructionInfo.label}:</strong> {instructionInfo.desc}
              </span>
            </div>
          )}

          {/* Notified Followers Badge */}
          {alert.notifiedFollowers && alert.notifiedFollowers.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
              <Users className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                تم إرسال التنبيه للمتابعين: {alert.notifiedFollowers.map((f) => f.name.split(' ')[0]).join('، ')}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls - Mobile-Optimized Single-Column Flow */}
        {!showSkipReasons ? (
          <div className="space-y-3">
            {/* Primary confirmation button */}
            <button
              onClick={handleTaken}
              className="w-full min-h-[52px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>تم أخذ الدواء الآن</span>
            </button>

            {/* Quick Snooze & Postpone Options (غير متناول الآن) */}
            <div className="space-y-2 pt-1">
              <span className="block text-[11px] font-bold text-slate-500 text-center">
                غير متناول الآن؟ اختر موعد التذكير القادم:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  onClick={() => handleSnooze(5)}
                  className="w-full min-h-[46px] rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 border border-amber-300 dark:border-amber-700/60 transition-colors"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>سأتناوله بعد 5 دقائق</span>
                </button>

                <button
                  onClick={() => handleSnooze(10)}
                  className="w-full min-h-[46px] rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-2 border border-amber-300 dark:border-amber-700/60 transition-colors"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>بعد 10 دقائق (كحد أقصى)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={() => handleSnooze(15)}
                  className="min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-500" />
                  <span>تذكيري لاحقاً (15 د)</span>
                </button>

                <button
                  onClick={() => setShowSkipReasons(true)}
                  className="min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>تخطي الجرعة...</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300">
              يرجى تحديد سبب تخطي الجرعة:
            </h4>
            <div className="space-y-1.5 text-xs">
              {[
                'الدواء غير متوفر حالياً',
                'المريض نائم أو غير متاح',
                'أمر الطبيب بالإيقاف المؤقت',
                'المريض صائم',
                'شعور بأعراض جانبية',
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="skip_reason"
                    checked={skipReason === reason}
                    onChange={() => setSkipReason(reason)}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span className="text-slate-800 dark:text-slate-200">{reason}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSkipConfirm}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                تأكيد التخطي والتسجيل
              </button>
              <button
                onClick={() => setShowSkipReasons(false)}
                className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
              >
                رجوع
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
