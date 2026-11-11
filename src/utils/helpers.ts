import { MealInstruction, MedicationFormType, MedicationFrequency, PatientColor } from '../types';

export const PATIENT_COLORS: Record<
  PatientColor,
  { bg: string; text: string; border: string; lightBg: string; ring: string }
> = {
  emerald: {
    bg: 'bg-emerald-600',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-300 dark:border-emerald-800',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    ring: 'focus:ring-emerald-500',
  },
  sky: {
    bg: 'bg-sky-600',
    text: 'text-sky-700 dark:text-sky-400',
    border: 'border-sky-300 dark:border-sky-800',
    lightBg: 'bg-sky-50 dark:bg-sky-950/40',
    ring: 'focus:ring-sky-500',
  },
  indigo: {
    bg: 'bg-indigo-600',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-300 dark:border-indigo-800',
    lightBg: 'bg-indigo-50 dark:bg-indigo-950/40',
    ring: 'focus:ring-indigo-500',
  },
  amber: {
    bg: 'bg-amber-600',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-800',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40',
    ring: 'focus:ring-amber-500',
  },
  rose: {
    bg: 'bg-rose-600',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-300 dark:border-rose-800',
    lightBg: 'bg-rose-50 dark:bg-rose-950/40',
    ring: 'focus:ring-rose-500',
  },
  teal: {
    bg: 'bg-teal-600',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-300 dark:border-teal-800',
    lightBg: 'bg-teal-50 dark:bg-teal-950/40',
    ring: 'focus:ring-teal-500',
  },
  purple: {
    bg: 'bg-purple-600',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-800',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40',
    ring: 'focus:ring-purple-500',
  },
};

export const MED_FORM_LABELS: Record<MedicationFormType, { label: string; icon: string }> = {
  pill: { label: 'حبوب / أقراص', icon: '💊' },
  capsule: { label: 'كبسولات', icon: '💊' },
  liquid: { label: 'شراب / سائل', icon: '🧪' },
  injection: { label: 'حقنة / إبرة', icon: '💉' },
  inhaler: { label: 'بخاخ استنشاق', icon: '🫁' },
  drops: { label: 'قطرة (عين/أذن/أنف)', icon: '💧' },
  cream: { label: 'مرهم / كريم', icon: '🧴' },
};

export const FREQUENCY_LABELS: Record<MedicationFrequency, { label: string; subtitle: string; timesCount: number }> = {
  once_daily: { label: 'مرة واحدة يومياً', subtitle: 'جرعة واحدة كل 24 ساعة', timesCount: 1 },
  twice_daily: { label: 'مرتان يومياً', subtitle: 'جرعة كل 12 ساعة (صباحاً ومساءً)', timesCount: 2 },
  thrice_daily: { label: '3 مرات يومياً', subtitle: 'جرعة كل 6-8 ساعات أثناء اليوم', timesCount: 3 },
  four_daily: { label: '4 مرات يومياً', subtitle: 'جرعة كل 4-6 ساعات', timesCount: 4 },
  every_4h: { label: 'كل 4 ساعات', subtitle: '6 جرعات على مدار اليوم', timesCount: 6 },
  every_6h: { label: 'كل 6 ساعات', subtitle: '4 جرعات على مدار اليوم', timesCount: 4 },
  every_8h: { label: 'كل 8 ساعات', subtitle: '3 جرعات على مدار اليوم', timesCount: 3 },
  every_12h: { label: 'كل 12 ساعة', subtitle: 'جرعتان على مدار اليوم', timesCount: 2 },
  custom: { label: 'تحديد يدوي مخصص', subtitle: 'إدخال المواعيد بحرية', timesCount: 1 },
};

export const DOSAGE_SUGGESTIONS: Record<MedicationFormType, string[]> = {
  pill: ['حبة واحدة', 'حبتان', 'نصف حبة', 'ربع حبة', '3 حبات'],
  capsule: ['كبسولة واحدة', 'كبسولتان', '3 كبسولات'],
  liquid: ['ملعقة واحدة (5 مل)', 'ملعقتان (10 مل)', 'نصف ملعقة (2.5 مل)', '15 مل بالمعيار', 'ملعقة طعام كبيرة'],
  injection: ['حقنة واحدة كاملة', 'نصف أمبولة', 'وحدة إنسولين واحدة', 'جرعة تحت الجلد'],
  inhaler: ['بخة واحدة', 'بخّتان', '3 بخات'],
  drops: ['قطرة واحدة', 'قطرتان', '3 قطرات', '4 قطرات', '5 قطرات'],
  cream: ['طبقة رقيقة موضعي', 'مسحة واحدة خفيفة', 'مرتان يومياً موضعي'],
};

export const MEAL_INSTRUCTION_LABELS: Record<MealInstruction, { label: string; desc: string }> = {
  before_meal: { label: 'قبل الأكل', desc: 'يؤخذ قبل تناول الطعام بنصف ساعة' },
  after_meal: { label: 'بعد الأكل', desc: 'يؤخذ مباشرة بعد وجبة الطعام' },
  with_meal: { label: 'مع الأكل', desc: 'يؤخذ أثناء تناول وجبة الطعام' },
  empty_stomach: { label: 'على الريق', desc: 'أول ما يستيقظ المريض مع كأس ماء' },
  anytime: { label: 'في أي وقت', desc: 'لا يرتبط بمواعيد وجبات الطعام' },
};

// Automatic schedule times calculator
export function calculateScheduleTimes(frequency: MedicationFrequency, firstTimeStr: string): string[] {
  if (!firstTimeStr || frequency === 'custom') {
    return [firstTimeStr || '08:00'];
  }

  const [hStr, mStr] = firstTimeStr.split(':');
  const startHour = parseInt(hStr, 10) || 8;
  const startMin = parseInt(mStr, 10) || 0;

  const formatHourMin = (h: number, m: number): string => {
    const wrappedH = ((h % 24) + 24) % 24;
    return `${String(wrappedH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  switch (frequency) {
    case 'once_daily':
      return [formatHourMin(startHour, startMin)];

    case 'twice_daily':
    case 'every_12h':
      return [
        formatHourMin(startHour, startMin),
        formatHourMin(startHour + 12, startMin),
      ].sort();

    case 'thrice_daily':
      // Waking-hours friendly spread (e.g. 08:00 -> 14:00 -> 20:00 with 6-hour spacing)
      return [
        formatHourMin(startHour, startMin),
        formatHourMin(startHour + 6, startMin),
        formatHourMin(startHour + 12, startMin),
      ].sort();

    case 'four_daily':
      // Spread across waking hours (e.g. 08:00, 12:00, 16:00, 20:00)
      return [
        formatHourMin(startHour, startMin),
        formatHourMin(startHour + 4, startMin),
        formatHourMin(startHour + 8, startMin),
        formatHourMin(startHour + 12, startMin),
      ].sort();

    case 'every_8h':
      return [
        formatHourMin(startHour, startMin),
        formatHourMin(startHour + 8, startMin),
        formatHourMin(startHour + 16, startMin),
      ].sort();

    case 'every_6h':
      return [
        formatHourMin(startHour, startMin),
        formatHourMin(startHour + 6, startMin),
        formatHourMin(startHour + 12, startMin),
        formatHourMin(startHour + 18, startMin),
      ].sort();

    case 'every_4h':
      return [
        formatHourMin(startHour, startMin),
        formatHourMin(startHour + 4, startMin),
        formatHourMin(startHour + 8, startMin),
        formatHourMin(startHour + 12, startMin),
        formatHourMin(startHour + 16, startMin),
        formatHourMin(startHour + 20, startMin),
      ].sort();

    default:
      return [firstTimeStr];
  }
}

export function formatTimeArabic(timeStr: string): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  if (isNaN(hours)) return timeStr;

  const isPM = hours >= 12;
  const h12 = hours % 12 || 12;
  const padMin = minutes.toString().padStart(2, '0');
  const period = isPM ? 'م' : 'ص';
  return `${h12}:${padMin} ${period}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatArabicDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const months = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ];
  return `${days[d.getDay()]}، ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function getCountdownToTime(targetTime: string): { text: string; minutesLeft: number; isPast: boolean } {
  const now = new Date();
  const [h, m] = targetTime.split(':').map(Number);
  const target = new Date();
  target.setHours(h, m, 0, 0);

  const diffMs = target.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / 60000);

  if (diffMinutes < -15) {
    return {
      text: `فات موعدها منذ ${Math.abs(diffMinutes)} دقيقة`,
      minutesLeft: diffMinutes,
      isPast: true,
    };
  }

  if (diffMinutes >= -15 && diffMinutes <= 5) {
    return {
      text: 'حان موعدها الآن!',
      minutesLeft: diffMinutes,
      isPast: false,
    };
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (hours === 0) {
    return {
      text: `متبقي ${mins} دقيقة`,
      minutesLeft: diffMinutes,
      isPast: false,
    };
  }

  return {
    text: `متبقي ${hours} ساعة و ${mins} دقيقة`,
    minutesLeft: diffMinutes,
    isPast: false,
  };
}

// Compress and convert image file to high-efficiency data URL
export function processImageFile(file: File, maxDimension = 600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('فشل قراءة ملف الصورة'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('ملف الصورة غير صالح'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Compressed JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
