import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Trash2,
  X,
  Clock,
  Camera,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { MealInstruction, Medication, MedicationFormType, MedicationFrequency, Patient } from '../types';
import {
  calculateScheduleTimes,
  DOSAGE_SUGGESTIONS,
  FREQUENCY_LABELS,
  MEAL_INSTRUCTION_LABELS,
  MED_FORM_LABELS,
  processImageFile,
} from '../utils/helpers';

interface MedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (med: Partial<Medication>) => void;
  editingMedication: Medication | null;
  patients: Patient[];
  defaultPatientId: string;
}

export const MedicationModal: React.FC<MedicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMedication,
  patients,
  defaultPatientId,
}) => {
  const [patientId, setPatientId] = useState(defaultPatientId);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('حبة واحدة');
  const [form, setForm] = useState<MedicationFormType>('pill');
  const [instruction, setInstruction] = useState<MealInstruction>('after_meal');
  const [frequency, setFrequency] = useState<MedicationFrequency>('twice_daily');
  const [firstDoseTime, setFirstDoseTime] = useState('08:00');
  const [times, setTimes] = useState<string[]>(['08:00', '20:00']);
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [stockCount, setStockCount] = useState<number>(30);
  const [lowStockAlert, setLowStockAlert] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (editingMedication) {
      setPatientId(editingMedication.patientId);
      setName(editingMedication.name);
      setDosage(editingMedication.dosage);
      setForm(editingMedication.form);
      setInstruction(editingMedication.instruction);
      setFrequency(editingMedication.frequency || 'twice_daily');
      setFirstDoseTime(editingMedication.times[0] || '08:00');
      setTimes(editingMedication.times.length > 0 ? editingMedication.times : ['08:00', '20:00']);
      setImageUrl(editingMedication.imageUrl);
      setStockCount(editingMedication.stockCount);
      setLowStockAlert(editingMedication.lowStockAlert);
      setNotes(editingMedication.notes || '');
    } else {
      setPatientId(defaultPatientId);
      setName('');
      setDosage('حبة واحدة');
      setForm('pill');
      setInstruction('after_meal');
      setFrequency('twice_daily');
      setFirstDoseTime('08:00');
      setTimes(['08:00', '20:00']);
      setImageUrl(undefined);
      setStockCount(30);
      setLowStockAlert(5);
      setNotes('');
    }
  }, [editingMedication, defaultPatientId, isOpen]);

  if (!isOpen) return null;

  // Whenever frequency or firstDoseTime changes, automatically calculate the subsequent times
  const handleFrequencySelect = (freq: MedicationFrequency) => {
    setFrequency(freq);
    if (freq !== 'custom') {
      const calculated = calculateScheduleTimes(freq, firstDoseTime);
      setTimes(calculated);
    }
  };

  const handleFirstTimeChange = (newTime: string) => {
    setFirstDoseTime(newTime);
    if (frequency !== 'custom') {
      const calculated = calculateScheduleTimes(frequency, newTime);
      setTimes(calculated);
    } else {
      const updated = [...times];
      updated[0] = newTime;
      setTimes(updated);
    }
  };

  const handleRecalculate = () => {
    const calculated = calculateScheduleTimes(frequency, firstDoseTime);
    setTimes(calculated);
  };

  const handleAddTime = () => {
    setTimes([...times, '14:00']);
    setFrequency('custom');
  };

  const handleRemoveTime = (index: number) => {
    if (times.length <= 1) return;
    setTimes(times.filter((_, i) => i !== index));
    setFrequency('custom');
  };

  const handleSpecificTimeChange = (index: number, val: string) => {
    const updated = [...times];
    updated[index] = val;
    setTimes(updated);
    if (index === 0) {
      setFirstDoseTime(val);
    }
  };

  // Form type change updates dosage presets
  const handleFormChange = (newForm: MedicationFormType) => {
    setForm(newForm);
    const presets = DOSAGE_SUGGESTIONS[newForm];
    if (presets && presets.length > 0) {
      setDosage(presets[0]);
    }
  };

  // Handle Box Image capture / upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      const dataUrl = await processImageFile(file, 640);
      setImageUrl(dataUrl);
    } catch (err: any) {
      alert(err.message || 'تعذر تحميل صورة الدواء');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      patientId,
      name: name.trim(),
      dosage: dosage.trim() || 'جرعة واحدة',
      form,
      instruction,
      frequency,
      firstDoseTime,
      times: Array.from(new Set(times)).sort(),
      days: ['daily'],
      imageUrl,
      stockCount: Number(stockCount) || 30,
      lowStockAlert: Number(lowStockAlert) || 5,
      notes: notes.trim(),
      active: editingMedication ? editingMedication.active : true,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center text-xl">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingMedication ? 'تعديل بيانات الدواء والجرعات' : 'إضافة دواء جديد مع الحساب التلقائي'}
              </h2>
              <p className="text-xs text-slate-500">
                حساب مواعيد الجرعات تلقائياً ورفع صورة علبة الدواء للتحقق البصري السريع
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Patient and Medication Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                المريض المعني بالدواء: *
              </label>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatarEmoji || '👤'} {p.name} ({p.ageGroup})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                اسم الدواء (التجاري أو العلمي): *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: أوجمنتين أو كونكور 5 ملغ"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Form Type Pills */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              الشكل الدوائي:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(MED_FORM_LABELS) as MedicationFormType[]).map((key) => {
                const meta = MED_FORM_LABELS[key];
                const isSelected = form === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => handleFormChange(key)}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span>{meta.icon}</span>
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Dosage Presets (حبة واحدة، ملعقة واحدة، إلخ) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              مقدار الجرعة لكل مرة:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(DOSAGE_SUGGESTIONS[form] || ['حبة واحدة', 'حبتان', 'ملعقة واحدة']).map((suggested) => (
                <button
                  type="button"
                  key={suggested}
                  onClick={() => setDosage(suggested)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    dosage === suggested
                      ? 'bg-teal-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {suggested}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
              placeholder="أو اكتب المقدار يدوياً (مثال: ملعقة ونصف أو 2.5 مل)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm mt-1"
            />
          </div>

          {/* AUTOMATIC FREQUENCY & SCHEDULE CALCULATOR */}
          <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-teal-900 dark:text-teal-200">
                  الحساب التلقائي لتكرار الجرعات:
                </h3>
              </div>
              <button
                type="button"
                onClick={handleRecalculate}
                className="text-xs text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1"
                title="إعادة احتساب الأوقات"
              >
                <RefreshCw className="w-3 h-3" />
                <span>إعادة الحساب</span>
              </button>
            </div>

            {/* Frequency selection grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  'once_daily',
                  'twice_daily',
                  'thrice_daily',
                  'four_daily',
                  'every_8h',
                  'custom',
                ] as MedicationFrequency[]
              ).map((freqKey) => {
                const meta = FREQUENCY_LABELS[freqKey];
                const isSelected = frequency === freqKey;
                return (
                  <button
                    type="button"
                    key={freqKey}
                    onClick={() => handleFrequencySelect(freqKey)}
                    className={`p-2.5 rounded-xl border text-right transition-all ${
                      isSelected
                        ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-teal-50/50'
                    }`}
                  >
                    <div className="font-bold text-xs">{meta.label}</div>
                    <div
                      className={`text-[10px] mt-0.5 ${
                        isSelected ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {meta.subtitle}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* First dose time picker (Starting anchor) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-teal-200/60 dark:border-teal-800/40">
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  موعد الجرعة الأولى (نقطة البداية):
                </label>
                <p className="text-[11px] text-slate-500">
                  بمجرد تغيير هذا الوقت، سيتم تلقائياً اقتراح مواعيد الجرعات التالية.
                </p>
              </div>

              <input
                type="time"
                value={firstDoseTime}
                onChange={(e) => handleFirstTimeChange(e.target.value)}
                className="w-36 px-3 py-1.5 rounded-xl border border-teal-300 dark:border-teal-700 bg-white dark:bg-slate-800 font-mono text-sm text-center font-bold dir-ltr"
              />
            </div>

            {/* Calculated suggested times display */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>المواعيد المحسوبة لليوم ({times.length} مرات):</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddTime}
                  className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة وقت مخصص</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {times.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-teal-300 dark:border-teal-700 shadow-xs"
                  >
                    <span className="text-[10px] text-slate-400 font-semibold ml-1">
                      جرعة {idx + 1}:
                    </span>
                    <input
                      type="time"
                      value={t}
                      onChange={(e) => handleSpecificTimeChange(idx, e.target.value)}
                      className="font-mono text-xs font-bold bg-transparent border-none text-teal-800 dark:text-teal-300 dir-ltr text-center"
                    />
                    {times.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveTime(idx)}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                        title="حذف هذا الموعد"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Food Instructions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              إرشادات الطعام والوجبات:
            </label>
            <select
              value={instruction}
              onChange={(e) => setInstruction(e.target.value as MealInstruction)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              {(Object.keys(MEAL_INSTRUCTION_LABELS) as MealInstruction[]).map((key) => {
                const meta = MEAL_INSTRUCTION_LABELS[key];
                return (
                  <option key={key} value={key}>
                    {meta.label} ({meta.desc})
                  </option>
                );
              })}
            </select>
          </div>

          {/* MEDICATION BOX PHOTO / CAMERA UPLOAD */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>صورة علبة الدواء أو الباكيت (للتحقق البصري):</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  تساعد المريض والمرافق على تمييز العلبة الحقيقية عند حلول موعد الجرعة
                </p>
              </div>

              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="text-xs text-rose-600 hover:underline"
                >
                  حذف الصورة
                </button>
              )}
            </div>

            {imageUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={imageUrl}
                  alt="علبة الدواء"
                  className="w-24 h-24 object-cover rounded-xl border-2 border-teal-500 shadow-xs bg-white"
                />
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ تم حفظ صورة العلبة بنجاح
                  </span>
                  <p className="text-[11px] text-slate-500">
                    ستظهر هذه الصورة في إشعار التنبيه وبطاقات جرعات اليوم.
                  </p>
                  <label className="inline-flex items-center gap-1.5 text-xs text-teal-600 font-semibold cursor-pointer hover:underline">
                    <Upload className="w-3.5 h-3.5" />
                    <span>تغيير الصورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {/* Camera capture button (mobile-friendly) */}
                <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-teal-400 dark:border-teal-700 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-teal-50/50 transition-colors">
                  <Camera className="w-4 h-4" />
                  <span>{isProcessingImage ? 'جاري المعالجة...' : 'تصوير العلبة بالكاميرا'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>

                {/* Upload from file */}
                <label className="flex-1 py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span>رفع صورة من الجهاز</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Stock Tracking */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                رصيد العلبة الحالي (عدد الجرعات):
              </label>
              <input
                type="number"
                min="0"
                value={stockCount}
                onChange={(e) => setStockCount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                تنبيه قرب النفاد عند بقاء:
              </label>
              <input
                type="number"
                min="1"
                value={lowStockAlert}
                onChange={(e) => setLowStockAlert(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ملاحظات أو تحذيرات إضافية (اختياري):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: يحفظ في الثلاجة، يرج جيداً قبل الاستعمال"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {editingMedication ? 'حفظ التعديلات' : 'إضافة الدواء الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
