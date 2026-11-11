import React, { useState, useEffect } from 'react';
import { User, X, Check } from 'lucide-react';
import { Patient, PatientColor } from '../types';
import { PATIENT_COLORS } from '../utils/helpers';

interface PatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: Partial<Patient>) => void;
  editingPatient: Patient | null;
}

const EMOJI_OPTIONS = ['🧓', '👵', '👨', '👩', '🧑', '👧', '👦', '👶', '❤️', '🩺'];

export const PatientModal: React.FC<PatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPatient,
}) => {
  const [name, setName] = useState('');
  const [ageGroup, setAgeGroup] = useState<'كبير سن' | 'بالغ' | 'طفل' | 'رضيع'>('كبير سن');
  const [colorTheme, setColorTheme] = useState<PatientColor>('emerald');
  const [avatarEmoji, setAvatarEmoji] = useState('🧓');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingPatient) {
      setName(editingPatient.name);
      setAgeGroup(editingPatient.ageGroup);
      setColorTheme(editingPatient.colorTheme);
      setAvatarEmoji(editingPatient.avatarEmoji || '🧓');
      setNotes(editingPatient.notes || '');
    } else {
      setName('');
      setAgeGroup('كبير سن');
      setColorTheme('emerald');
      setAvatarEmoji('🧓');
      setNotes('');
    }
  }, [editingPatient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      ageGroup,
      colorTheme,
      avatarEmoji,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center text-xl">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingPatient ? 'تعديل ملف المريض' : 'إضافة مريض جديد'}
              </h2>
              <p className="text-xs text-slate-500">
                تسجيل مريض جديد لمتابعة جرعاته بدون حساب
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اسم المريض: *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: الوالد (أبو محمد) أو ليلى"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              الفئة العمرية:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['كبير سن', 'بالغ', 'طفل', 'رضيع'] as const).map((group) => (
                <button
                  type="button"
                  key={group}
                  onClick={() => setAgeGroup(group)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    ageGroup === group
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {group}
                </button>
              ))}
            </div>
          </div>

          {/* Emoji Avatar Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              رمز الأفاتار المميز:
            </label>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all shrink-0 ${
                    avatarEmoji === emoji
                      ? 'bg-teal-100 dark:bg-teal-950/60 ring-2 ring-teal-500 scale-105'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Theme Color Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              اللون التعريفي للمريض:
            </label>
            <div className="flex items-center gap-2">
              {(Object.keys(PATIENT_COLORS) as PatientColor[]).map((colorKey) => {
                const c = PATIENT_COLORS[colorKey];
                const isSelected = colorTheme === colorKey;
                return (
                  <button
                    type="button"
                    key={colorKey}
                    onClick={() => setColorTheme(colorKey)}
                    className={`w-8 h-8 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform ${
                      isSelected ? 'ring-3 ring-offset-2 ring-slate-400 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات صحية أو حساسية (اختياري):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: حساسية من البنسلين، يفضل تناول الأدوية صباحاً"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {editingPatient ? 'حفظ التعديلات' : 'إضافة المريض'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
