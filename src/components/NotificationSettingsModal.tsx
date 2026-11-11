import React, { useState } from 'react';
import {
  Bell,
  Volume2,
  Play,
  Check,
  X,
  Sparkles,
  Users,
  ShieldCheck,
  Sliders,
  Send,
} from 'lucide-react';
import { AppSettings, NotificationSoundType } from '../types';
import { sound, SOUND_DEFINITIONS } from '../services/sound';
import { showBrowserNotification } from '../services/notifications';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [selectedSound, setSelectedSound] = useState<NotificationSoundType>(
    settings.defaultSound || 'tri_tone_alarm'
  );
  const [volume, setVolume] = useState<number>(settings.soundVolume ?? 0.7);
  const [messageTemplate, setMessageTemplate] = useState<string>(
    settings.messageTemplate || 'حان موعد دواء {medication} لـ {patient} ({dosage})'
  );
  const [notifyPrimaryUser, setNotifyPrimaryUser] = useState<boolean>(
    settings.notifyPrimaryUser ?? true
  );
  const [notifyAssignedFollowers, setNotifyAssignedFollowers] = useState<boolean>(
    settings.notifyAssignedFollowers ?? true
  );
  const [advanceMinutes, setAdvanceMinutes] = useState<number>(settings.advanceMinutes ?? 0);
  const [testedMessage, setTestedMessage] = useState(false);

  if (!isOpen) return null;

  // Insert template variable tag
  const handleInsertTag = (tag: string) => {
    setMessageTemplate((prev) => `${prev} ${tag}`);
  };

  // Sample preview of the rendered message
  const previewMessage = messageTemplate
    .replace('{patient}', 'الوالد (أبو أحمد)')
    .replace('{medication}', 'كونكور 5 ملغ')
    .replace('{dosage}', 'حبة واحدة')
    .replace('{time}', '08:00 ص');

  const handleTestNotification = () => {
    sound.playSound(selectedSound, volume);
    showBrowserNotification('🔔 تجربة إشعار مخصص', {
      body: previewMessage,
    });
    setTestedMessage(true);
    setTimeout(() => setTestedMessage(false), 3000);
  };

  const handleSave = () => {
    onSaveSettings({
      defaultSound: selectedSound,
      soundVolume: volume,
      messageTemplate,
      notifyPrimaryUser,
      notifyAssignedFollowers,
      advanceMinutes,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                تخصيص نغمات ورسائل الإشعارات
              </h2>
              <p className="text-xs text-slate-500">
                اختر نغمة التنبيه المفضلة، وصغ نص الإشعار، وحدد إرسال التنبيه للمتابعين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* 1. SOUND SELECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-teal-600" />
                <span>نغمة التنبيه الصوتية (اختر واستمع مباشرة):</span>
              </label>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>مستوى الصوت:</span>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.1"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 accent-teal-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              {(Object.keys(SOUND_DEFINITIONS) as NotificationSoundType[]).map((soundKey) => {
                const meta = SOUND_DEFINITIONS[soundKey];
                const isSelected = selectedSound === soundKey;

                return (
                  <div
                    key={soundKey}
                    onClick={() => setSelectedSound(soundKey)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/70 dark:bg-teal-950/30 border-teal-500 ring-1 ring-teal-500'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-700'
                        }`}
                      >
                        {meta.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {meta.label}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-teal-700 dark:text-teal-400 bg-teal-100 dark:bg-teal-900/60 px-1.5 py-0.2 rounded">
                              المحددة حالياً
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playSound(soundKey, volume);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                      title="تجربة الاستماع لهذه النغمة"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>تجربة</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CUSTOM REMINDER MESSAGE TEMPLATE */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="block text-xs font-bold text-slate-900 dark:text-white">
              صيغة نص رسالة التذكير:
            </label>
            <p className="text-[11px] text-slate-500">
              يمكنك كتابة رسالة مخصصة تظهر في إشعار المتصفح والهاتف. اضغط على الكلمات المتغيرة لإضافتها:
            </p>

            <div className="flex flex-wrap gap-1.5">
              {[
                { tag: '{patient}', label: '+ اسم المريض' },
                { tag: '{medication}', label: '+ اسم الدواء' },
                { tag: '{dosage}', label: '+ الجرعة' },
                { tag: '{time}', label: '+ الوقت' },
              ].map((chip) => (
                <button
                  type="button"
                  key={chip.tag}
                  onClick={() => handleInsertTag(chip.tag)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-300 font-medium hover:border-teal-500 transition-colors"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
            />

            {/* Live Message Preview */}
            <div className="p-3 rounded-xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 text-xs">
              <span className="font-bold text-teal-800 dark:text-teal-300 block mb-1">
                معاينة الإشعار الفعلي:
              </span>
              <p className="text-slate-800 dark:text-slate-200 font-medium">
                {previewMessage}
              </p>
            </div>
          </div>

          {/* 3. RECIPIENT ROUTING (PATIENT & FOLLOWERS) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-600" />
              <span>مستلمو الإشعارات الفورية:</span>
            </label>

            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyPrimaryUser}
                  onChange={(e) => setNotifyPrimaryUser(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    إرسال التنبيه للمريض والمستخدم على هذا الجهاز
                  </span>
                  <span className="text-[11px] text-slate-500">
                    رنين ونافذة منبثقة مع إشعار المتصفح
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAssignedFollowers}
                  onChange={(e) => setNotifyAssignedFollowers(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    إرسال التنبيه للمتابعين والمرافقين المخصصين للمريض
                  </span>
                  <span className="text-[11px] text-slate-500">
                    يتم إشعار كل متابع بالمرضى الذين تم تعيينه للإشراف عليهم فقط
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* 4. ADVANCE TIME NOTIFICATION */}
          <div>
            <label className="block text-xs font-bold text-slate-900 dark:text-white mb-2">
              توقيت إطلاق التنبيه:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { min: 0, label: 'في الموعد تماماً' },
                { min: 5, label: 'قبل 5 دقائق' },
                { min: 10, label: 'قبل 10 دقائق' },
                { min: 15, label: 'قبل 15 دقيقة' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.min}
                  onClick={() => setAdvanceMinutes(opt.min)}
                  className={`py-2 px-2.5 rounded-xl border font-semibold transition-all ${
                    advanceMinutes === opt.min
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live Test Notification Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleTestNotification}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testedMessage ? 'تم إطلاق الإشعار والصوت الآن! 🔔' : 'إرسال إشعار تجريبي فوري للصوت والنص'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
          >
            حفظ إعدادات التنبيهات
          </button>
        </div>
      </div>
    </div>
  );
};
