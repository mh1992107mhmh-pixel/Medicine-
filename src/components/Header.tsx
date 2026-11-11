import React from 'react';
import { Pill, Sun, Moon, Volume2, ShieldCheck, Bell } from 'lucide-react';
import { sound } from '../services/sound';

interface HeaderProps {
  activeTab: 'today' | 'medications' | 'patients' | 'sync' | 'logs';
  setActiveTab: (tab: 'today' | 'medications' | 'patients' | 'sync' | 'logs') => void;
  activeRole: 'patient' | 'caregiver';
  onToggleRole: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  onTestAlarm: () => void;
  onOpenNotificationSettings: () => void;
  syncRoomCode: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeRole,
  onToggleRole,
  isDark,
  onToggleDark,
  onTestAlarm,
  onOpenNotificationSettings,
  syncRoomCode,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
            <Pill className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            دوائي رفيقي
          </span>
        </div>

        {/* Zone 2: Navigation Links (Single-line, 1-2 words) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('today')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
              activeTab === 'today'
                ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400 pb-0.5'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            جرعات اليوم
          </button>

          <button
            onClick={() => setActiveTab('medications')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
              activeTab === 'medications'
                ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400 pb-0.5'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            جدول الأدوية
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
              activeTab === 'patients'
                ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400 pb-0.5'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            المرضى والمتابعون
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-teal-600 dark:hover:text-teal-400 ${
              activeTab === 'logs'
                ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400 pb-0.5'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            سجل الأداء
          </button>

          <button
            onClick={() => setActiveTab('sync')}
            className={`whitespace-nowrap shrink-0 transition-colors hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'text-teal-600 dark:text-teal-400 font-bold border-b-2 border-teal-600 dark:border-teal-400 pb-0.5'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>المزامنة</span>
            <span className="text-[11px] font-mono font-normal opacity-75 dir-ltr bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {syncRoomCode}
            </span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Utilities */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Notification settings button */}
          <button
            onClick={onOpenNotificationSettings}
            title="تخصيص نغمات ورسائل التنبيه"
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Sound test button */}
          <button
            onClick={() => {
              sound.playGentleChime();
            }}
            title="تجربة النغمة الطبية"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Simulate due alarm button */}
          <button
            onClick={onTestAlarm}
            title="تجربة تنبيه موعد دواء الآن"
            className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1.5 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors whitespace-nowrap"
          >
            تجربة التنبيه 🔔
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleDark}
            title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Seamless Role Switcher (Patient vs Caregiver) */}
          <button
            onClick={onToggleRole}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-xs font-semibold rounded-xl transition-all shadow-xs whitespace-nowrap shrink-0 ${
              activeRole === 'patient'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                : 'bg-teal-700 hover:bg-teal-800 text-white shadow-teal-500/20'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">
              {activeRole === 'patient' ? 'وضع المريض (تبديل للمرافق)' : 'وضع المرافق (تبديل للمريض)'}
            </span>
            <span className="sm:hidden font-bold">
              {activeRole === 'patient' ? 'مريض' : 'مرافق'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
