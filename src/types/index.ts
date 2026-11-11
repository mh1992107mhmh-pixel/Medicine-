export type PatientColor = 'emerald' | 'sky' | 'indigo' | 'amber' | 'rose' | 'teal' | 'purple';

export interface Patient {
  id: string;
  name: string;
  ageGroup: 'كبير سن' | 'بالغ' | 'طفل' | 'رضيع';
  colorTheme: PatientColor;
  avatarEmoji?: string;
  notes?: string;
  isMain?: boolean;
  createdAt: number;
}

export type MedicationFormType =
  | 'pill'       // حبوب
  | 'capsule'    // كبسولة
  | 'liquid'     // شراب
  | 'injection'  // حقنة
  | 'inhaler'    // بخاخ
  | 'drops'      // قطرة
  | 'cream';     // مرهم / دهان

export type MealInstruction =
  | 'before_meal'     // قبل الأكل
  | 'after_meal'      // بعد الأكل
  | 'with_meal'       // مع وجبة الطعام
  | 'empty_stomach'   // على الريق
  | 'anytime';        // في أي وقت

export type MedicationFrequency =
  | 'once_daily'      // مرة واحدة يومياً
  | 'twice_daily'     // مرتان يومياً (كل 12 ساعة)
  | 'thrice_daily'    // 3 مرات يومياً (كل 8 ساعات أو أوقات الاستيقاظ)
  | 'four_daily'      // 4 مرات يومياً (كل 6 ساعات)
  | 'every_4h'        // كل 4 ساعات
  | 'every_6h'        // كل 6 ساعات
  | 'every_8h'        // كل 8 ساعات
  | 'every_12h'       // كل 12 ساعة
  | 'custom';         // مخصص يدوي

export type NotificationSoundType =
  | 'gentle_chime'     // نغمة رنين هادئة
  | 'tri_tone_alarm'   // نغمة طبية ثلاثية منبهة
  | 'marimba_harmony'  // نغمة ماريمبا متناغمة
  | 'pulse_beep'       // نبضات تنبيه إيقاعية
  | 'harp_melody';     // معزوفة قيثارة ناعمة

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage: string;                // e.g. "حبة واحدة" أو "ملعقة واحدة (5 مل)"
  form: MedicationFormType;
  instruction: MealInstruction;
  frequency?: MedicationFrequency;
  firstDoseTime?: string;        // HH:mm المرة الأولى
  times: string[];               // e.g. ["08:00", "14:00", "20:00"]
  days: string[];                // ["daily"] or ["sun", "mon", ...]
  imageUrl?: string;             // صورة علبة الدواء أو الباكيت
  stockCount: number;            // عدد الجرعات المتبقية في العلبة
  lowStockAlert: number;         // حد التنبيه لنفاد الدواء
  reminderSound?: NotificationSoundType; // نغمة التنبيه المخصصة لهذا الدواء
  customReminderMessage?: string; // رسالة التذكير المخصصة لهذا الدواء
  advanceReminderMinutes?: number;// تنبيه مبكر (مثلاً 5 دقائق قبل الموعد)
  active: boolean;
  notes?: string;
  createdAt: number;
}

export type DoseStatus = 'taken' | 'snoozed' | 'skipped' | 'pending';

export interface DoseLog {
  id: string;
  medicationId: string;
  patientId: string;
  scheduledDate: string;        // YYYY-MM-DD
  scheduledTime: string;        // HH:mm
  actualTime?: string;          // HH:mm:ss
  status: DoseStatus;
  snoozedUntil?: number;        // timestamp in ms
  recordedBy: string;           // "المريض نفسه" or follower name
  note?: string;
  timestamp: number;
}

export interface Follower {
  id: string;
  name: string;
  relationship: string;         // "ابن", "ممرض", "طبيب", "أخت"
  role: 'caregiver' | 'supervisor' | 'family';
  phoneOrContact?: string;
  assignedPatientIds: string[]; // المرضى المخصصون لهذا المتابع (['all'] أو معرفات المرضى)
  receiveNotifications: boolean;// استلام التنبيهات الفورية لمواعيد المرضى المخصصين
  shareToken: string;           // رمز المتابعة الآمن التشاركي (مثل: FOL-782-AHMAD)
  createdAt: number;
}

export interface AppStateData {
  patients: Patient[];
  medications: Medication[];
  logs: DoseLog[];
  followers: Follower[];
  syncRoomCode: string;
  lastSyncTimestamp: number;
}

export interface AppSettings {
  activeRole: 'patient' | 'caregiver';
  activePatientId: string;
  activeFollowerId?: string;    // المتابع الحالي (إذا كان الجهاز يعمل بصفة متابع محدد)
  soundEnabled: boolean;
  soundVolume: number;          // 0 to 1
  defaultSound: NotificationSoundType; // النغمة الافتراضية
  messageTemplate: string;      // قالب نص الإشعار الافتراضي
  notifyPrimaryUser: boolean;   // إشعار المستخدم والمريض
  notifyAssignedFollowers: boolean; // إشعار المتابعين المخصصين
  advanceMinutes: number;       // دقائق التنبيه المسبق (0 تعني في الموعد تماماً)
  notificationsEnabled: boolean;
  autoSync: boolean;
}

export interface ActiveDoseAlert {
  medication: Medication;
  patient: Patient;
  scheduledTime: string;
  doseId?: string;
  customMessage?: string;
  notifiedFollowers?: Follower[];
}
