import React, { useState, useEffect } from 'react';
import { Users, X, Copy, Check, Bell, Shield, Key } from 'lucide-react';
import { Follower, Patient } from '../types';

interface FollowerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (follower: Partial<Follower>) => void;
  editingFollower: Follower | null;
  patients: Patient[];
  syncRoomCode: string;
}

export const FollowerModal: React.FC<FollowerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFollower,
  patients,
  syncRoomCode,
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('ابن / ابنة');
  const [role, setRole] = useState<'caregiver' | 'supervisor' | 'family'>('caregiver');
  const [contact, setContact] = useState('');
  const [assignedPatientIds, setAssignedPatientIds] = useState<string[]>(['all']);
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [shareToken, setShareToken] = useState('');
  const [copiedToken, setCopiedToken] = useState(false);

  useEffect(() => {
    if (editingFollower) {
      setName(editingFollower.name);
      setRelationship(editingFollower.relationship);
      setRole(editingFollower.role);
      setContact(editingFollower.phoneOrContact || '');
      setAssignedPatientIds(editingFollower.assignedPatientIds || ['all']);
      setReceiveNotifications(editingFollower.receiveNotifications !== false);
      setShareToken(editingFollower.shareToken || generateToken(editingFollower.name));
    } else {
      setName('');
      setRelationship('ابن / ابنة');
      setRole('caregiver');
      setContact('');
      setAssignedPatientIds(['all']);
      setReceiveNotifications(true);
      setShareToken(generateToken('NEW'));
    }
  }, [editingFollower, isOpen]);

  if (!isOpen) return null;

  function generateToken(prefix: string): string {
    const cleanPrefix = prefix.replace(/\s+/g, '').slice(0, 5).toUpperCase() || 'FOL';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `TOK-${cleanPrefix}-${syncRoomCode}-${rand}`;
  }

  const handleTogglePatient = (patientId: string) => {
    if (patientId === 'all') {
      setAssignedPatientIds(['all']);
      return;
    }

    let updated = assignedPatientIds.filter((id) => id !== 'all');
    if (updated.includes(patientId)) {
      updated = updated.filter((id) => id !== patientId);
    } else {
      updated.push(patientId);
    }

    if (updated.length === 0) {
      updated = ['all'];
    }
    setAssignedPatientIds(updated);
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(shareToken);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      relationship,
      role,
      phoneOrContact: contact.trim() || 'متابع للتنبيهات',
      assignedPatientIds,
      receiveNotifications,
      shareToken: shareToken || generateToken(name),
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center text-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingFollower ? 'تعديل بيانات المتابع والمريض المخصص' : 'إضافة مرافق أو متابع جديد'}
              </h2>
              <p className="text-xs text-slate-500">
                تخصيص المرضى المعنيين واستلام الإشعارات برمز تشاركي آمن بلا حسابات
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Name & Relation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم المتابع أو المرافق: *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editingFollower) {
                    setShareToken(generateToken(e.target.value));
                  }
                }}
                placeholder="مثال: د. مريم أو الابن خالد"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                الصفة أو صلة القرابة:
              </label>
              <select
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="ابن / ابنة">ابن / ابنة</option>
                <option value="زوج / زوجة">زوج / زوجة</option>
                <option value="أخ / أخت">أخ / أخت</option>
                <option value="ممرض / مرافقة صحية">ممرض / مرافقة صحية</option>
                <option value="طبيب معالج">طبيب معالج</option>
                <option value="صديق / جار">صديق / جار</option>
              </select>
            </div>
          </div>

          {/* Role pill selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              مستوى المسؤولية:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'caregiver', label: 'مرافق مباشر' },
                { key: 'supervisor', label: 'مشرف طبي' },
                { key: 'family', label: 'متابع عائلي' },
              ].map((r) => (
                <button
                  type="button"
                  key={r.key}
                  onClick={() => setRole(r.key as any)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                    role === r.key
                      ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* ASSIGNED PATIENTS CHECKBOXES */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>المرضى المخصصون لهذا المتابع:</span>
              </label>
              <span className="text-[11px] text-teal-700 dark:text-teal-400">
                تحديد المرضى المراد استلام تنبيهاتهم
              </span>
            </div>

            <div className="space-y-1.5">
              {/* Option: All Patients */}
              <label className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedPatientIds.includes('all')}
                  onChange={() => handleTogglePatient('all')}
                  className="w-4 h-4 text-teal-600 rounded"
                />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  جميع المرضى المسجلين (متابعة شاملة)
                </span>
              </label>

              {/* Individual Patients */}
              {patients.map((p) => {
                const isChecked =
                  assignedPatientIds.includes('all') || assignedPatientIds.includes(p.id);

                return (
                  <label
                    key={p.id}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePatient(p.id)}
                      className="w-4 h-4 text-teal-600 rounded"
                    />
                    <span className="text-base">{p.avatarEmoji || '👤'}</span>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {p.name} ({p.ageGroup})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* NOTIFICATION TOGGLE FOR THIS FOLLOWER */}
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-teal-600" />
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    استلام التنبيهات الفورية لمواعيد الجرعات
                  </span>
                  <span className="text-[11px] text-slate-500">
                    إرسال إشعارات صوتية ومرئية عند حلول موعد أدوية المرضى المخصصين
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={receiveNotifications}
                onChange={(e) => setReceiveNotifications(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded"
              />
            </label>
          </div>

          {/* SECURE SHARED TOKEN */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                <span>الرمز التشاركي الآمن للمتابع (Shared Token):</span>
              </label>
            </div>
            <p className="text-[11px] text-amber-800 dark:text-amber-300">
              أعطِ هذا الرمز للمتابع لربط جهازه بملف المريض ومزامنة الجداول تلقائياً دون تسجيل حساب:
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareToken}
                className="flex-1 px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 font-mono text-xs text-amber-900 dark:text-amber-200 text-center font-bold dir-ltr select-all"
              />
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedToken ? 'تم النسخ!' : 'نسخ'}</span>
              </button>
            </div>
          </div>

          {/* Notes or contact */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظة أو رقم التواصل:
            </label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="مثال: يتابع الجرعات المسائية، هاتف: 050xxxx"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          {/* Submit */}
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
              {editingFollower ? 'حفظ التعديلات' : 'إضافة المتابع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
