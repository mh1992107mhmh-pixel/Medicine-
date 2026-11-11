/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Calendar,
  Pill,
  Users,
  Share2,
  FileText,
  ShieldCheck,
  Bell,
  Heart,
  Sliders,
} from 'lucide-react';
import {
  ActiveDoseAlert,
  AppSettings,
  AppStateData,
  DoseLog,
  Follower,
  Medication,
  Patient,
} from './types';
import {
  loadAppSettings,
  loadAppState,
  saveAppSettings,
  saveAppState,
} from './services/storage';
import { pullStateFromSyncRoom, pushStateToSyncRoom } from './services/sync';
import { sound } from './services/sound';
import {
  requestNotificationPermission,
  showBrowserNotification,
} from './services/notifications';
import { formatTimeArabic, getTodayDateString } from './utils/helpers';
import { Header } from './components/Header';
import { PatientModeView } from './components/PatientModeView';
import { CaregiverDashboard } from './components/CaregiverDashboard';
import { SyncModal } from './components/SyncModal';
import { AlarmModal } from './components/AlarmModal';
import { MedicationModal } from './components/MedicationModal';
import { PatientModal } from './components/PatientModal';
import { FollowerModal } from './components/FollowerModal';
import { ComplianceLogView } from './components/ComplianceLogView';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(loadAppState);
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings);
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      localStorage.getItem('dawaei_theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  // Current view tab
  const [activeTab, setActiveTab] = useState<'today' | 'medications' | 'patients' | 'sync' | 'logs'>('today');

  // Modals state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMedModalOpen, setIsMedModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);
  const [editingFollower, setEditingFollower] = useState<Follower | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Active alarm state
  const [activeAlert, setActiveAlert] = useState<ActiveDoseAlert | null>(null);

  // Notification banner prompt state
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

  // Last checked minute tracker to avoid duplicate alarms in the same minute
  const lastAlertMinuteRef = useRef<string>('');

  // 1. Sync theme with DOM
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('dawaei_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('dawaei_theme', 'light');
    }
  }, [isDark]);

  // 2. Persist state on change
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  // 3. Listen to cross-tab updates via BroadcastChannel
  useEffect(() => {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;
    const bc = new BroadcastChannel('dawaei_sync_channel');
    bc.onmessage = (event) => {
      if (event.data?.type === 'STATE_UPDATED' && event.data?.payload) {
        setAppState(event.data.payload);
      }
    };
    return () => bc.close();
  }, []);

  // 4. Handle #join=ROOMCODE or #token=TOKEN from URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    if (hash.startsWith('#join=')) {
      const code = hash.replace('#join=', '').trim().toUpperCase();
      if (code) {
        pullStateFromSyncRoom(code).then((res) => {
          if (res.success && res.data) {
            setAppState(res.data);
            window.location.hash = '';
          }
        });
      }
    }
  }, []);

  // 5. Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        setShowNotificationPrompt(true);
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    setShowNotificationPrompt(false);
    if (perm === 'granted') {
      showBrowserNotification('تم تفعيل إشعارات دوائي رفيقي بنجاح', {
        body: 'سنقوم بتنبيهك صوتياً وفورياً عند حلول موعد أي جرعة علاجية للمرضى والمتابعين.',
      });
      sound.playGentleChime();
    }
  };

  // Helper to construct custom reminder message
  const renderReminderMessage = (med: Medication, patient: Patient, timeStr: string): string => {
    if (med.customReminderMessage) {
      return med.customReminderMessage;
    }
    const template = settings.messageTemplate || 'حان موعد دواء {medication} لـ {patient} ({dosage})';
    return template
      .replace('{patient}', patient.name)
      .replace('{medication}', med.name)
      .replace('{dosage}', med.dosage)
      .replace('{time}', formatTimeArabic(timeStr));
  };

  // 6. Master Dose Alarm Checker (every 10 seconds)
  useEffect(() => {
    const checkDoses = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMinutes = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMinutes}`;
      const todayStr = getTodayDateString();

      // Avoid re-triggering for the exact same minute
      if (lastAlertMinuteRef.current === currentTimeStr) return;

      // Scan all active medications
      for (const med of appState.medications) {
        if (!med.active) continue;

        if (med.times.includes(currentTimeStr)) {
          // Check if already taken or skipped today
          const existingLog = appState.logs.find(
            (l) =>
              l.medicationId === med.id &&
              l.scheduledDate === todayStr &&
              l.scheduledTime === currentTimeStr
          );

          if (!existingLog || existingLog.status === 'snoozed') {
            // If it was snoozed, check if snooze time expired
            if (existingLog?.snoozedUntil && Date.now() < existingLog.snoozedUntil) {
              continue;
            }

            const patient = appState.patients.find((p) => p.id === med.patientId);
            if (patient) {
              lastAlertMinuteRef.current = currentTimeStr;

              // Find assigned followers who receive notifications for this patient
              const assignedFollowers = appState.followers.filter(
                (f) =>
                  f.receiveNotifications &&
                  (f.assignedPatientIds.includes('all') || f.assignedPatientIds.includes(patient.id))
              );

              const formattedMessage = renderReminderMessage(med, patient, currentTimeStr);

              // Play configured sound
              const soundToPlay = med.reminderSound || settings.defaultSound || 'tri_tone_alarm';
              if (settings.soundEnabled) {
                sound.playSound(soundToPlay, settings.soundVolume);
              }

              setActiveAlert({
                medication: med,
                patient,
                scheduledTime: currentTimeStr,
                doseId: existingLog?.id,
                customMessage: formattedMessage,
                notifiedFollowers: assignedFollowers,
              });

              // Fire push notification
              const followerNamesNotice =
                assignedFollowers.length > 0
                  ? ` (تم إشعار: ${assignedFollowers.map((f) => f.name.split(' ')[0]).join('، ')})`
                  : '';

              showBrowserNotification(`🔔 موعد دواء: ${med.name}`, {
                body: `${formattedMessage}${followerNamesNotice}`,
              });
              break;
            }
          }
        }
      }
    };

    const interval = setInterval(checkDoses, 10000);
    checkDoses(); // immediate check
    return () => clearInterval(interval);
  }, [appState, settings]);

  // Active patient object
  const activePatient =
    appState.patients.find((p) => p.id === settings.activePatientId) ||
    appState.patients[0] || {
      id: 'pat-default',
      name: 'المريض الرئيسي',
      ageGroup: 'كبير سن',
      colorTheme: 'emerald',
      avatarEmoji: '🧓',
      createdAt: Date.now(),
    };

  // HANDLERS:
  // 1. Mark Dose as Taken
  const handleConfirmTaken = (medicationId: string, patientId: string, scheduledTime: string) => {
    const todayStr = getTodayDateString();
    const now = new Date();
    const actualTimeStr = now.toTimeString().split(' ')[0];

    const currentRecorder =
      settings.activeRole === 'patient' ? activePatient.name : 'المرافق المشرف';

    // Update stock count
    const updatedMeds = appState.medications.map((m) => {
      if (m.id === medicationId && m.stockCount > 0) {
        return { ...m, stockCount: m.stockCount - 1 };
      }
      return m;
    });

    // Check if log exists to update or insert
    const existingIndex = appState.logs.findIndex(
      (l) =>
        l.medicationId === medicationId &&
        l.patientId === patientId &&
        l.scheduledDate === todayStr &&
        l.scheduledTime === scheduledTime
    );

    let updatedLogs: DoseLog[];
    if (existingIndex >= 0) {
      updatedLogs = [...appState.logs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        status: 'taken',
        actualTime: actualTimeStr,
        recordedBy: currentRecorder,
        timestamp: Date.now(),
      };
    } else {
      const newLog: DoseLog = {
        id: `log-${Date.now()}`,
        medicationId,
        patientId,
        scheduledDate: todayStr,
        scheduledTime,
        actualTime: actualTimeStr,
        status: 'taken',
        recordedBy: currentRecorder,
        timestamp: Date.now(),
      };
      updatedLogs = [newLog, ...appState.logs];
    }

    const nextState = {
      ...appState,
      medications: updatedMeds,
      logs: updatedLogs,
      lastSyncTimestamp: Date.now(),
    };
    setAppState(nextState);

    // Auto push sync if enabled
    if (settings.autoSync) {
      pushStateToSyncRoom(appState.syncRoomCode, nextState).catch(() => {});
    }
  };

  // 2. Snooze Dose
  const handleSnooze = (medicationId: string, patientId: string, scheduledTime: string, minutes: number) => {
    const todayStr = getTodayDateString();
    const snoozedUntil = Date.now() + minutes * 60 * 1000;

    const existingIndex = appState.logs.findIndex(
      (l) =>
        l.medicationId === medicationId &&
        l.patientId === patientId &&
        l.scheduledDate === todayStr &&
        l.scheduledTime === scheduledTime
    );

    let updatedLogs: DoseLog[];
    if (existingIndex >= 0) {
      updatedLogs = [...appState.logs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        status: 'snoozed',
        snoozedUntil,
        timestamp: Date.now(),
      };
    } else {
      const newLog: DoseLog = {
        id: `log-${Date.now()}`,
        medicationId,
        patientId,
        scheduledDate: todayStr,
        scheduledTime,
        status: 'snoozed',
        snoozedUntil,
        recordedBy: 'المريض',
        timestamp: Date.now(),
      };
      updatedLogs = [newLog, ...appState.logs];
    }

    setAppState({
      ...appState,
      logs: updatedLogs,
      lastSyncTimestamp: Date.now(),
    });
  };

  // 3. Skip Dose
  const handleSkip = (medicationId: string, patientId: string, scheduledTime: string, reason: string) => {
    const todayStr = getTodayDateString();
    const existingIndex = appState.logs.findIndex(
      (l) =>
        l.medicationId === medicationId &&
        l.patientId === patientId &&
        l.scheduledDate === todayStr &&
        l.scheduledTime === scheduledTime
    );

    let updatedLogs: DoseLog[];
    if (existingIndex >= 0) {
      updatedLogs = [...appState.logs];
      updatedLogs[existingIndex] = {
        ...updatedLogs[existingIndex],
        status: 'skipped',
        note: reason,
        timestamp: Date.now(),
      };
    } else {
      const newLog: DoseLog = {
        id: `log-${Date.now()}`,
        medicationId,
        patientId,
        scheduledDate: todayStr,
        scheduledTime,
        status: 'skipped',
        note: reason,
        recordedBy: settings.activeRole === 'patient' ? activePatient.name : 'المرافق المشرف',
        timestamp: Date.now(),
      };
      updatedLogs = [newLog, ...appState.logs];
    }

    setAppState({
      ...appState,
      logs: updatedLogs,
      lastSyncTimestamp: Date.now(),
    });
  };

  // 4. Undo Taken
  const handleUndoTaken = (logId: string) => {
    const updatedLogs = appState.logs.filter((l) => l.id !== logId);
    setAppState({
      ...appState,
      logs: updatedLogs,
      lastSyncTimestamp: Date.now(),
    });
  };

  // 5. Refill Medication Stock
  const handleRefillStock = (medicationId: string, amount: number) => {
    const updated = appState.medications.map((m) => {
      if (m.id === medicationId) {
        return { ...m, stockCount: m.stockCount + amount };
      }
      return m;
    });
    setAppState({ ...appState, medications: updated, lastSyncTimestamp: Date.now() });
    sound.playGentleChime();
  };

  // 6. Toggle Active/Inactive Medication
  const handleToggleMedActive = (medicationId: string) => {
    const updated = appState.medications.map((m) => {
      if (m.id === medicationId) {
        return { ...m, active: !m.active };
      }
      return m;
    });
    setAppState({ ...appState, medications: updated, lastSyncTimestamp: Date.now() });
  };

  // 7. Save Medication (Add / Edit)
  const handleSaveMedication = (data: Partial<Medication>) => {
    if (editingMedication) {
      const updated = appState.medications.map((m) => {
        if (m.id === editingMedication.id) {
          return { ...m, ...data } as Medication;
        }
        return m;
      });
      setAppState({ ...appState, medications: updated, lastSyncTimestamp: Date.now() });
    } else {
      const newMed: Medication = {
        id: `med-${Date.now()}`,
        patientId: data.patientId || activePatient.id,
        name: data.name || 'دواء جديد',
        dosage: data.dosage || 'حبة واحدة',
        form: data.form || 'pill',
        instruction: data.instruction || 'after_meal',
        frequency: data.frequency || 'twice_daily',
        firstDoseTime: data.firstDoseTime || '08:00',
        times: data.times || ['08:00'],
        days: data.days || ['daily'],
        imageUrl: data.imageUrl,
        stockCount: data.stockCount || 30,
        lowStockAlert: data.lowStockAlert || 5,
        reminderSound: data.reminderSound,
        customReminderMessage: data.customReminderMessage,
        advanceReminderMinutes: data.advanceReminderMinutes || 0,
        active: true,
        notes: data.notes || '',
        createdAt: Date.now(),
      };
      setAppState({
        ...appState,
        medications: [...appState.medications, newMed],
        lastSyncTimestamp: Date.now(),
      });
    }
    setEditingMedication(null);
    sound.playGentleChime();
  };

  // 8. Delete Medication
  const handleDeleteMedication = (medicationId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا الدواء نهائياً من الجدول؟')) {
      const updated = appState.medications.filter((m) => m.id !== medicationId);
      setAppState({ ...appState, medications: updated, lastSyncTimestamp: Date.now() });
    }
  };

  // 9. Save Patient (Add / Edit)
  const handleSavePatient = (data: Partial<Patient>) => {
    if (editingPatient) {
      const updated = appState.patients.map((p) => {
        if (p.id === editingPatient.id) {
          return { ...p, ...data } as Patient;
        }
        return p;
      });
      setAppState({ ...appState, patients: updated, lastSyncTimestamp: Date.now() });
    } else {
      const newPatient: Patient = {
        id: `pat-${Date.now()}`,
        name: data.name || 'مريض جديد',
        ageGroup: data.ageGroup || 'كبير سن',
        colorTheme: data.colorTheme || 'emerald',
        avatarEmoji: data.avatarEmoji || '🧓',
        notes: data.notes || '',
        createdAt: Date.now(),
      };
      setAppState({
        ...appState,
        patients: [...appState.patients, newPatient],
        lastSyncTimestamp: Date.now(),
      });
      setSettings({ ...settings, activePatientId: newPatient.id });
    }
    setEditingPatient(null);
    sound.playGentleChime();
  };

  // 10. Delete Patient
  const handleDeletePatient = (patientId: string) => {
    if (appState.patients.length <= 1) {
      alert('يجب أن يبقى مريض واحد على الأقل في التطبيق.');
      return;
    }
    if (confirm('هل أنت متأكد من حذف ملف هذا المريض وجميع أدويته؟')) {
      const updatedPatients = appState.patients.filter((p) => p.id !== patientId);
      const updatedMeds = appState.medications.filter((m) => m.patientId !== patientId);
      setAppState({
        ...appState,
        patients: updatedPatients,
        medications: updatedMeds,
        lastSyncTimestamp: Date.now(),
      });
      if (settings.activePatientId === patientId) {
        setSettings({ ...settings, activePatientId: updatedPatients[0].id });
      }
    }
  };

  // 11. Save Follower (Add / Edit)
  const handleSaveFollower = (data: Partial<Follower>) => {
    if (editingFollower) {
      const updated = appState.followers.map((f) => {
        if (f.id === editingFollower.id) {
          return { ...f, ...data } as Follower;
        }
        return f;
      });
      setAppState({ ...appState, followers: updated, lastSyncTimestamp: Date.now() });
    } else {
      const newFollower: Follower = {
        id: `fol-${Date.now()}`,
        name: data.name || 'متابع جديد',
        relationship: data.relationship || 'ابن',
        role: data.role || 'caregiver',
        phoneOrContact: data.phoneOrContact || '',
        assignedPatientIds: data.assignedPatientIds || ['all'],
        receiveNotifications: data.receiveNotifications !== false,
        shareToken: data.shareToken || `TOK-FOL-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: Date.now(),
      };
      setAppState({
        ...appState,
        followers: [...appState.followers, newFollower],
        lastSyncTimestamp: Date.now(),
      });
    }
    setEditingFollower(null);
    sound.playGentleChime();
  };

  const handleDeleteFollower = (followerId: string) => {
    if (appState.followers.length <= 1) {
      alert('يجب الإبقاء على متابع واحد على الأقل.');
      return;
    }
    const updated = appState.followers.filter((f) => f.id !== followerId);
    setAppState({ ...appState, followers: updated, lastSyncTimestamp: Date.now() });
  };

  // Simulate test alarm button
  const handleTriggerTestAlarm = () => {
    const med = appState.medications.find((m) => m.patientId === activePatient.id) || appState.medications[0];
    if (med) {
      const patient = appState.patients.find((p) => p.id === med.patientId) || activePatient;
      const assignedFollowers = appState.followers.filter(
        (f) =>
          f.receiveNotifications &&
          (f.assignedPatientIds.includes('all') || f.assignedPatientIds.includes(patient.id))
      );
      const msg = renderReminderMessage(med, patient, med.times[0] || '12:00');

      setActiveAlert({
        medication: med,
        patient,
        scheduledTime: med.times[0] || '12:00',
        customMessage: msg,
        notifiedFollowers: assignedFollowers,
      });

      const soundToPlay = med.reminderSound || settings.defaultSound || 'tri_tone_alarm';
      sound.playSound(soundToPlay, settings.soundVolume);

      showBrowserNotification(`[تجربة] موعد دواء: ${med.name} لـ ${patient.name}`, {
        body: msg,
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors selection:bg-teal-500 selection:text-white">
      {/* Top Bar Contract Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'sync') {
            setIsSyncModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        activeRole={settings.activeRole}
        onToggleRole={() => {
          const nextRole = settings.activeRole === 'patient' ? 'caregiver' : 'patient';
          setSettings({ ...settings, activeRole: nextRole });
          sound.playGentleChime();
        }}
        isDark={isDark}
        onToggleDark={() => setIsDark(!isDark)}
        onTestAlarm={handleTriggerTestAlarm}
        onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
        syncRoomCode={appState.syncRoomCode}
      />

      {/* Optional Notification Permission Prompt Banner */}
      {showNotificationPrompt && (
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white px-4 py-3 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 shrink-0 animate-bounce" />
              <span>
                <strong>تفعيل الإشعارات الفورية:</strong> لكي نذكرك أنت والمتابعين بالدواء حتى والشاشة مقفلة أو المتصفح في الخلفية.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleEnableNotifications}
                className="px-3.5 py-1.5 rounded-lg bg-white text-teal-800 font-bold hover:bg-teal-50 transition-colors shadow-xs"
              >
                تفعيل الآن
              </button>
              <button
                onClick={() => setShowNotificationPrompt(false)}
                className="px-2 py-1.5 text-white/80 hover:text-white text-xs"
              >
                لاحقاً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* VIEW 1: Patient Mode View */}
        {settings.activeRole === 'patient' && activeTab === 'today' && (
          <PatientModeView
            patients={appState.patients}
            activePatient={activePatient}
            onSelectPatient={(pid) => setSettings({ ...settings, activePatientId: pid })}
            medications={appState.medications}
            logs={appState.logs}
            onMarkTaken={handleConfirmTaken}
            onSnooze={handleSnooze}
            onUndoTaken={handleUndoTaken}
            onOpenSync={() => setIsSyncModalOpen(true)}
            onSwitchToCaregiver={() => setSettings({ ...settings, activeRole: 'caregiver' })}
          />
        )}

        {/* VIEW 2: Caregiver Dashboard View (Default when in caregiver role or when tab is medications/patients) */}
        {(settings.activeRole === 'caregiver' || activeTab === 'medications' || activeTab === 'patients') &&
          activeTab !== 'logs' && (
            <CaregiverDashboard
              patients={appState.patients}
              activePatient={activePatient}
              onSelectPatient={(pid) => setSettings({ ...settings, activePatientId: pid })}
              onOpenAddPatient={() => {
                setEditingPatient(null);
                setIsPatientModalOpen(true);
              }}
              onOpenEditPatient={(patient) => {
                setEditingPatient(patient);
                setIsPatientModalOpen(true);
              }}
              onDeletePatient={handleDeletePatient}
              medications={appState.medications}
              onOpenAddMedication={() => {
                setEditingMedication(null);
                setIsMedModalOpen(true);
              }}
              onOpenEditMedication={(med) => {
                setEditingMedication(med);
                setIsMedModalOpen(true);
              }}
              onDeleteMedication={handleDeleteMedication}
              onToggleMedicationActive={handleToggleMedActive}
              onRefillStock={handleRefillStock}
              followers={appState.followers}
              onOpenAddFollower={() => {
                setEditingFollower(null);
                setIsFollowerModalOpen(true);
              }}
              onOpenEditFollower={(follower) => {
                setEditingFollower(follower);
                setIsFollowerModalOpen(true);
              }}
              onDeleteFollower={handleDeleteFollower}
              onOpenNotificationSettings={() => setIsNotificationModalOpen(true)}
              logs={appState.logs}
              syncRoomCode={appState.syncRoomCode}
              onOpenSync={() => setIsSyncModalOpen(true)}
            />
          )}

        {/* VIEW 3: Compliance Log & Audit Reports View */}
        {activeTab === 'logs' && (
          <ComplianceLogView
            logs={appState.logs}
            patients={appState.patients}
            medications={appState.medications}
            onUndoTaken={handleUndoTaken}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Thumb Tab Bar (Ergonomic thumb navigation) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16 pb-safe">
        <button
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'today'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] mt-1">اليوم</span>
        </button>

        <button
          onClick={() => setActiveTab('medications')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'medications'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Pill className="w-5 h-5" />
          <span className="text-[10px] mt-1">الأدوية</span>
        </button>

        <button
          onClick={() => setActiveTab('patients')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'patients'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-1">المرضى</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            activeTab === 'logs'
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[10px] mt-1">السجل</span>
        </button>

        <button
          onClick={() => setIsSyncModalOpen(true)}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            isSyncModalOpen
              ? 'text-teal-600 dark:text-teal-400 font-bold'
              : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-[10px] mt-1">المزامنة</span>
        </button>
      </nav>

      {/* ALL MODALS: */}
      {/* 1. Dose Alert Modal */}
      <AlarmModal
        alert={activeAlert}
        onConfirmTaken={handleConfirmTaken}
        onSnooze={handleSnooze}
        onSkip={handleSkip}
        onClose={() => setActiveAlert(null)}
        soundEnabled={settings.soundEnabled}
      />

      {/* 2. 3-in-1 Sync Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        appState={appState}
        onUpdateState={(newState) => setAppState(newState)}
      />

      {/* 3. Medication Modal (Add/Edit) */}
      <MedicationModal
        isOpen={isMedModalOpen}
        onClose={() => {
          setIsMedModalOpen(false);
          setEditingMedication(null);
        }}
        onSave={handleSaveMedication}
        editingMedication={editingMedication}
        patients={appState.patients}
        defaultPatientId={activePatient.id}
      />

      {/* 4. Patient Modal (Add/Edit) */}
      <PatientModal
        isOpen={isPatientModalOpen}
        onClose={() => {
          setIsPatientModalOpen(false);
          setEditingPatient(null);
        }}
        onSave={handleSavePatient}
        editingPatient={editingPatient}
      />

      {/* 5. Follower Modal */}
      <FollowerModal
        isOpen={isFollowerModalOpen}
        onClose={() => {
          setIsFollowerModalOpen(false);
          setEditingFollower(null);
        }}
        onSave={handleSaveFollower}
        editingFollower={editingFollower}
        patients={appState.patients}
        syncRoomCode={appState.syncRoomCode}
      />

      {/* 6. Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => setSettings({ ...settings, ...newSettings })}
      />
    </div>
  );
}
