import { AppSettings, AppStateData, DoseLog, Follower, Medication, Patient } from '../types';

const STORAGE_KEY = 'dawaei_app_data_v1';
const SETTINGS_KEY = 'dawaei_app_settings_v1';

// Initial realistic default state to make testing immediately rewarding
export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-1',
    name: 'الوالد (أبو أحمد)',
    ageGroup: 'كبير سن',
    colorTheme: 'emerald',
    avatarEmoji: '🧓',
    notes: 'يعاني من ضغط الدم ويفضل التذكير الصوتي الواضح',
    isMain: true,
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'pat-2',
    name: 'سارة',
    ageGroup: 'طفل',
    colorTheme: 'rose',
    avatarEmoji: '👧',
    notes: 'مضاد حيوي وفيتامينات - متابعة من الأم والوالد',
    isMain: false,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'pat-3',
    name: 'خالد (أنا)',
    ageGroup: 'بالغ',
    colorTheme: 'sky',
    avatarEmoji: '🧑',
    notes: 'أدوية الحساسية الموسمية والفيتامين اليومي',
    isMain: false,
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: 'med-1',
    patientId: 'pat-1',
    name: 'كونكور (Concor 5mg)',
    dosage: 'حبة واحدة',
    form: 'pill',
    instruction: 'before_meal',
    times: ['08:00'],
    days: ['daily'],
    stockCount: 24,
    lowStockAlert: 5,
    active: true,
    notes: 'دواء ضغط الدم - يؤخذ صباحاً على الريق مع كأس ماء',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'med-2',
    patientId: 'pat-1',
    name: 'جلوكوفاج (Glucophage 500mg)',
    dosage: 'حبة واحدة',
    form: 'pill',
    instruction: 'after_meal',
    times: ['13:30', '20:30'],
    days: ['daily'],
    stockCount: 42,
    lowStockAlert: 8,
    active: true,
    notes: 'منظم السكر - يؤخذ مباشرة بعد وجبة الغداء والعشاء',
    createdAt: Date.now() - 86400000 * 8,
  },
  {
    id: 'med-3',
    patientId: 'pat-2',
    name: 'شراب أوجمنتين (Augmentin)',
    dosage: '5 مل بالسرنجة',
    form: 'liquid',
    instruction: 'with_meal',
    times: ['09:00', '21:00'],
    days: ['daily'],
    stockCount: 14,
    lowStockAlert: 4,
    active: true,
    notes: 'مضاد حيوي - يجب حفظه في الثلاجة ورجه جيداً قبل الاستعمال',
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'med-4',
    patientId: 'pat-3',
    name: 'فيتامين د3 (Vitamin D3)',
    dosage: 'قطرتان (أو كبسولة)',
    form: 'drops',
    instruction: 'with_meal',
    times: ['10:00'],
    days: ['daily'],
    stockCount: 50,
    lowStockAlert: 10,
    active: true,
    notes: 'لدعم المناعة وصحة العظام',
    createdAt: Date.now() - 86400000 * 2,
  },
];

export const INITIAL_FOLLOWERS: Follower[] = [
  {
    id: 'fol-1',
    name: 'أحمد (الابن المشرف)',
    relationship: 'ابن',
    role: 'caregiver',
    phoneOrContact: 'مسؤول عن شراء الأدوية وتأكيد الجرعات',
    assignedPatientIds: ['pat-1', 'pat-2'], // يتابع الوالد وسارة
    receiveNotifications: true,
    shareToken: 'TOK-AHMAD-782',
    createdAt: Date.now() - 86400000 * 10,
  },
  {
    id: 'fol-2',
    name: 'أم أحمد (المرافقة المنزلية)',
    relationship: 'زوجة / أم',
    role: 'caregiver',
    phoneOrContact: 'تتابع الجرعات اليومية في المنزل',
    assignedPatientIds: ['all'], // تتابع جميع المرضى في المنزل
    receiveNotifications: true,
    shareToken: 'TOK-OMAHMAD-915',
    createdAt: Date.now() - 86400000 * 9,
  },
  {
    id: 'fol-3',
    name: 'د. طارق (طبيب الأسرة)',
    relationship: 'طبيب متابع',
    role: 'supervisor',
    phoneOrContact: 'متابعة تقارير الالتزام الدوري وضغط الدم',
    assignedPatientIds: ['pat-1'], // يتابع الوالد فقط
    receiveNotifications: false,
    shareToken: 'TOK-DRTAREQ-432',
    createdAt: Date.now() - 86400000 * 5,
  },
];

export const generateWeeklyLogs = (): DoseLog[] => {
  const logs: DoseLog[] = [];
  const now = new Date();

  // Generate logs for past 7 days
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    // Patient 1 (الوالد) - 2 doses daily
    logs.push({
      id: `log-p1-m1-d${i}`,
      medicationId: 'med-1',
      patientId: 'pat-1',
      scheduledDate: dateStr,
      scheduledTime: '08:00',
      actualTime: i === 2 ? '08:14:00' : '08:03:00',
      status: i === 4 ? 'skipped' : i === 2 ? 'snoozed' : 'taken',
      note: i === 4 ? 'المريض كان صائماً' : i === 2 ? 'تأخر 10 دقائق بعد الإفطار' : 'في الموعد',
      recordedBy: 'الوالد (أبو أحمد)',
      timestamp: d.getTime() - 86400000 * i,
    });

    logs.push({
      id: `log-p1-m2-d${i}`,
      medicationId: 'med-2',
      patientId: 'pat-1',
      scheduledDate: dateStr,
      scheduledTime: '13:30',
      actualTime: '13:35:00',
      status: i === 6 ? 'snoozed' : 'taken',
      recordedBy: 'أحمد (الابن المشرف)',
      timestamp: d.getTime() - 86400000 * i,
    });

    // Patient 2 (سارة) - 1 dose daily
    logs.push({
      id: `log-p2-m3-d${i}`,
      medicationId: 'med-3',
      patientId: 'pat-2',
      scheduledDate: dateStr,
      scheduledTime: '09:00',
      actualTime: '09:05:00',
      status: i === 3 ? 'skipped' : i === 5 ? 'snoozed' : 'taken',
      note: i === 3 ? 'جرعة الصباح أثناء السفر' : undefined,
      recordedBy: 'أم أحمد (المرافقة المنزلية)',
      timestamp: d.getTime() - 86400000 * i,
    });

    // Patient 3 (خالد) - 1 dose daily
    logs.push({
      id: `log-p3-m4-d${i}`,
      medicationId: 'med-4',
      patientId: 'pat-3',
      scheduledDate: dateStr,
      scheduledTime: '10:00',
      actualTime: '10:10:00',
      status: i === 1 || i === 5 ? 'snoozed' : i === 3 ? 'skipped' : 'taken',
      recordedBy: 'خالد (المريض نفسه)',
      timestamp: d.getTime() - 86400000 * i,
    });
  }

  return logs;
};

export const INITIAL_LOGS: DoseLog[] = generateWeeklyLogs();

export const DEFAULT_SETTINGS: AppSettings = {
  activeRole: 'patient',
  activePatientId: 'pat-1',
  soundEnabled: true,
  soundVolume: 0.7,
  defaultSound: 'tri_tone_alarm',
  messageTemplate: 'حان موعد دواء {medication} لـ {patient} ({dosage})',
  notifyPrimaryUser: true,
  notifyAssignedFollowers: true,
  advanceMinutes: 0,
  notificationsEnabled: true,
  autoSync: true,
};

// Generate 6-digit friendly room code e.g. MED-842 or 6 digits
export function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'MED-';
  for (let i = 0; i < 3; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function loadAppState(): AppStateData {
  if (typeof window === 'undefined') {
    return {
      patients: INITIAL_PATIENTS,
      medications: INITIAL_MEDICATIONS,
      logs: INITIAL_LOGS,
      followers: INITIAL_FOLLOWERS,
      syncRoomCode: 'MED-782',
      lastSyncTimestamp: Date.now(),
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: AppStateData = {
        patients: INITIAL_PATIENTS,
        medications: INITIAL_MEDICATIONS,
        logs: INITIAL_LOGS,
        followers: INITIAL_FOLLOWERS,
        syncRoomCode: generateRoomCode(),
        lastSyncTimestamp: Date.now(),
      };
      saveAppState(initial);
      return initial;
    }
    const parsed = JSON.parse(raw);
    const parsedFollowers = Array.isArray(parsed.followers)
      ? parsed.followers.map((f: any, idx: number) => ({
          ...f,
          assignedPatientIds: Array.isArray(f.assignedPatientIds) ? f.assignedPatientIds : ['all'],
          receiveNotifications: f.receiveNotifications !== false,
          shareToken: f.shareToken || `TOK-FOL-${idx + 1}-${Math.floor(100 + Math.random() * 900)}`,
        }))
      : INITIAL_FOLLOWERS;

    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : INITIAL_PATIENTS,
      medications: Array.isArray(parsed.medications) ? parsed.medications : INITIAL_MEDICATIONS,
      logs: Array.isArray(parsed.logs) ? parsed.logs : INITIAL_LOGS,
      followers: parsedFollowers,
      syncRoomCode: parsed.syncRoomCode || generateRoomCode(),
      lastSyncTimestamp: parsed.lastSyncTimestamp || Date.now(),
    };
  } catch (e) {
    console.error('Failed to load local app state:', e);
    return {
      patients: INITIAL_PATIENTS,
      medications: INITIAL_MEDICATIONS,
      logs: INITIAL_LOGS,
      followers: INITIAL_FOLLOWERS,
      syncRoomCode: 'MED-782',
      lastSyncTimestamp: Date.now(),
    };
  }
}

export function saveAppState(state: AppStateData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    // Broadcast change to other open tabs
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('dawaei_sync_channel');
      bc.postMessage({ type: 'STATE_UPDATED', payload: state });
      bc.close();
    }
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

export function loadAppSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveAppSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}
