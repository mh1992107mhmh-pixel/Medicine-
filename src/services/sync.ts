import QRCode from 'qrcode';
import { AppStateData } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  data?: AppStateData;
  updatedAt?: number;
}

// 1. Live 6-Digit Room API Synchronization
export async function pushStateToSyncRoom(roomCode: string, state: AppStateData): Promise<SyncResult> {
  const code = roomCode.toUpperCase().trim();
  try {
    const res = await fetch(`/api/sync/${encodeURIComponent(code)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: state }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errJson.message || 'تعذر الاتصال بخادم المزامنة',
      };
    }

    const json = await res.json();
    return {
      success: true,
      message: 'تم تحديث الغرفة التشاركية ومزامنة البيانات بنجاح',
      updatedAt: json.updatedAt,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'تعذر الاتصال بالشبكة للمزامنة الفورية، سيتم الاعتماد على الذاكرة المحلية',
    };
  }
}

export async function pullStateFromSyncRoom(roomCode: string): Promise<SyncResult> {
  const code = roomCode.toUpperCase().trim();
  try {
    const res = await fetch(`/api/sync/${encodeURIComponent(code)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        success: false,
        message: err.message || `لم يتم العثور على الغرفة التشاركية (${code})`,
      };
    }

    const json = await res.json();
    if (!json.data) {
      return {
        success: false,
        message: 'بيانات الغرفة غير صالحة أو فارغة',
      };
    }

    return {
      success: true,
      message: `تم جلب بيانات الغرفة (${code}) بنجاح`,
      data: json.data,
      updatedAt: json.updatedAt,
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'حدث خطأ في الاتصال أثناء جلب بيانات الغرفة التشاركية',
    };
  }
}

// 2. QR Code Generation for Direct Sync & Deep Link
export async function generateQrDataUrl(content: string): Promise<string> {
  try {
    return await QRCode.toDataURL(content, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  } catch (err) {
    console.error('Failed to generate QR code:', err);
    return '';
  }
}

export function createShareableUrl(roomCode: string): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.hash = `join=${roomCode}`;
  return url.toString();
}

// 3. Encrypted / Safe JSON Export and Import
export function exportStateToJson(state: AppStateData): string {
  const payload = {
    app: 'Dawaei-Med-Reminder',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadBackupFile(state: AppStateData): void {
  if (typeof window === 'undefined') return;
  const jsonStr = exportStateToJson(state);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];
  const a = document.createElement('a');
  a.href = url;
  a.download = `dawaei-backup-${state.syncRoomCode}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseAndValidateImport(
  rawInput: string,
  currentState: AppStateData,
  mode: 'merge' | 'replace' = 'merge'
): { success: boolean; state?: AppStateData; error?: string } {
  try {
    let parsed: any;
    try {
      parsed = JSON.parse(rawInput);
    } catch {
      // Try base64 decode if user pasted base64
      const decoded = atob(rawInput);
      parsed = JSON.parse(decoded);
    }

    const stateToApply: AppStateData = parsed.state || parsed;

    if (!Array.isArray(stateToApply.patients) || !Array.isArray(stateToApply.medications)) {
      return {
        success: false,
        error: 'الملف أو الرمز لا يحتوي على بنية بيانات صحيحة لتطبيق دوائي',
      };
    }

    if (mode === 'replace') {
      return {
        success: true,
        state: {
          patients: stateToApply.patients,
          medications: stateToApply.medications,
          logs: stateToApply.logs || [],
          followers: stateToApply.followers || [],
          syncRoomCode: stateToApply.syncRoomCode || currentState.syncRoomCode,
          lastSyncTimestamp: Date.now(),
        },
      };
    }

    // Merge mode: combine unique IDs
    const patientMap = new Map(currentState.patients.map((p) => [p.id, p]));
    for (const p of stateToApply.patients) {
      patientMap.set(p.id, p);
    }

    const medMap = new Map(currentState.medications.map((m) => [m.id, m]));
    for (const m of stateToApply.medications) {
      medMap.set(m.id, m);
    }

    const followerMap = new Map(currentState.followers.map((f) => [f.id, f]));
    if (Array.isArray(stateToApply.followers)) {
      for (const f of stateToApply.followers) {
        followerMap.set(f.id, f);
      }
    }

    const logMap = new Map(currentState.logs.map((l) => [l.id, l]));
    if (Array.isArray(stateToApply.logs)) {
      for (const l of stateToApply.logs) {
        logMap.set(l.id, l);
      }
    }

    return {
      success: true,
      state: {
        patients: Array.from(patientMap.values()),
        medications: Array.from(medMap.values()),
        followers: Array.from(followerMap.values()),
        logs: Array.from(logMap.values()),
        syncRoomCode: stateToApply.syncRoomCode || currentState.syncRoomCode,
        lastSyncTimestamp: Date.now(),
      },
    };
  } catch (e: any) {
    return {
      success: false,
      error: `فشل استيراد البيانات: ${e.message || 'بيانات غير مقروءة'}`,
    };
  }
}
