import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  Share2,
  KeyRound,
  ShieldCheck,
  FileText,
  X,
  ExternalLink,
  Laptop2,
  Smartphone,
} from 'lucide-react';
import { AppStateData } from '../types';
import {
  createShareableUrl,
  downloadBackupFile,
  exportStateToJson,
  generateQrDataUrl,
  parseAndValidateImport,
  pullStateFromSyncRoom,
  pushStateToSyncRoom,
} from '../services/sync';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppStateData;
  onUpdateState: (newState: AppStateData) => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({
  isOpen,
  onClose,
  appState,
  onUpdateState,
}) => {
  const [activeTab, setActiveTab] = useState<'room_code' | 'qr_code' | 'backup_export'>('room_code');
  const [qrImageUrl, setQrImageUrl] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Join room input
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Manual import textarea
  const [importText, setImportText] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');

  const shareableUrl = createShareableUrl(appState.syncRoomCode);

  useEffect(() => {
    if (isOpen) {
      // Generate QR data URL for shareable url
      generateQrDataUrl(shareableUrl || appState.syncRoomCode).then((url) => {
        setQrImageUrl(url);
      });
      setSyncStatusMsg(null);
    }
  }, [isOpen, appState.syncRoomCode, shareableUrl]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appState.syncRoomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyJson = () => {
    const jsonStr = exportStateToJson(appState);
    navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // 1. Push state to server room
  const handlePushSync = async () => {
    setIsLoading(true);
    setSyncStatusMsg({ text: 'جاري رفع ومزامنة البيانات في الغرفة التشاركية...', type: 'info' });
    const res = await pushStateToSyncRoom(appState.syncRoomCode, appState);
    setIsLoading(false);
    if (res.success) {
      setSyncStatusMsg({ text: 'تمت المزامنة بنجاح! يمكن للمتابعين الآن جلب التحديثات.', type: 'success' });
      onUpdateState({ ...appState, lastSyncTimestamp: Date.now() });
    } else {
      setSyncStatusMsg({ text: res.message, type: 'error' });
    }
  };

  // 2. Join another room code
  const handleJoinRoom = async () => {
    if (!joinCodeInput.trim()) return;
    setIsLoading(true);
    setSyncStatusMsg({ text: `جاري البحث عن بيانات الرمز (${joinCodeInput})...`, type: 'info' });
    const res = await pullStateFromSyncRoom(joinCodeInput);
    setIsLoading(false);
    if (res.success && res.data) {
      onUpdateState(res.data);
      setSyncStatusMsg({
        text: `تم الاتصال بنجاح وتحديث بيانات المرضى والأدوية من الغرفة (${joinCodeInput.toUpperCase()})`,
        type: 'success',
      });
      setJoinCodeInput('');
    } else {
      setSyncStatusMsg({ text: res.message || 'تعذر العثور على الغرفة', type: 'error' });
    }
  };

  // 3. Manual JSON / File import
  const handleImportSubmit = () => {
    if (!importText.trim()) return;
    const result = parseAndValidateImport(importText, appState, importMode);
    if (result.success && result.state) {
      onUpdateState(result.state);
      setSyncStatusMsg({
        text: `تم استيراد البيانات بنجاح (${result.state.patients.length} مرضى و ${result.state.medications.length} دواء)`,
        type: 'success',
      });
      setImportText('');
    } else {
      setSyncStatusMsg({ text: result.error || 'فشل الاستيراد', type: 'error' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                المزامنة التشاركية ومشاركة المرضى
              </h2>
              <p className="text-xs text-slate-500">
                مزامنة فورية آمنة بين أجهزة المريض والمتابعين بدون حسابات أو تسجيل دخول
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

        {/* 3-in-1 Tabs Selector */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('room_code')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'room_code'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>الرمز الفوري (6 أرقام)</span>
            </button>

            <button
              onClick={() => setActiveTab('qr_code')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'qr_code'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>رمز QR والرابط</span>
            </button>

            <button
              onClick={() => setActiveTab('backup_export')}
              className={`py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'backup_export'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>نسخ احتياطي واستيراد</span>
            </button>
          </div>
        </div>

        {/* Status feedback message */}
        {syncStatusMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              syncStatusMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : syncStatusMsg.type === 'error'
                ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>{syncStatusMsg.text}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: 6-DIGIT ROOM CODE */}
          {activeTab === 'room_code' && (
            <div className="space-y-6">
              {/* Current Room Code Card */}
              <div className="p-5 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/60 text-center space-y-3">
                <span className="text-xs font-semibold text-teal-800 dark:text-teal-300">
                  رمز المشاركة الخاص بهذا الجهاز (شاركه مع المتابعين أو المريض):
                </span>
                <div className="flex items-center justify-center gap-3">
                  <div className="text-3xl sm:text-4xl font-mono font-black tracking-widest text-teal-800 dark:text-teal-200 dir-ltr bg-white dark:bg-slate-800 px-6 py-2.5 rounded-2xl border border-teal-300 dark:border-teal-700 shadow-inner">
                    {appState.syncRoomCode}
                  </div>
                  <button
                    onClick={handleCopyCode}
                    className="p-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
                    title="نسخ الرمز"
                  >
                    {copiedCode ? <Check className="w-5 h-5 text-emerald-200" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[11px] text-teal-700 dark:text-teal-400">
                  أي متابع يدخل هذا الرمز في جهازه سيتمكن فوراً من عرض ومتابعة مواعيد أدوية المرضى.
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    disabled={isLoading}
                    onClick={handlePushSync}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>رفع التحديثات للغرفة الآن</span>
                  </button>
                </div>
              </div>

              {/* Join Existing Room Card */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  الانضمام لغرفة مريض أو متابع آخر:
                </h3>
                <p className="text-xs text-slate-500">
                  إذا كان المريض أو أحد أفراد العائلة قد أنشأ جدول الأدوية على جهازه، أدخل رمزه المكون من 6 خانات هنا:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={joinCodeInput}
                    onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                    placeholder="مثال: MED-782"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm tracking-widest text-center uppercase"
                  />
                  <button
                    disabled={isLoading || !joinCodeInput.trim()}
                    onClick={handleJoinRoom}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-700 text-white font-bold text-xs whitespace-nowrap transition-colors disabled:opacity-50"
                  >
                    تحميل البيانات والربط
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QR CODE & DIRECT LINK */}
          {activeTab === 'qr_code' && (
            <div className="space-y-6 text-center">
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 inline-block mx-auto">
                {qrImageUrl ? (
                  <img
                    src={qrImageUrl}
                    alt="رمز الاستجابة السريعة للمزامنة"
                    className="w-56 h-56 mx-auto rounded-xl shadow-xs bg-white p-2"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center bg-slate-100 rounded-xl">
                    <QrCode className="w-12 h-12 text-slate-400 animate-pulse" />
                  </div>
                )}
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-3">
                  امسح الرمز بكاميرا الجوال للانضمام الفوري
                </p>
              </div>

              {/* Direct Link Copy */}
              <div className="space-y-2 text-right">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  أو شارك الرابط المباشر للغرفة:
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareableUrl}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-600 dark:text-slate-300 dir-ltr select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP EXPORT & IMPORT */}
          {activeTab === 'backup_export' && (
            <div className="space-y-6">
              {/* Export Section */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-teal-600" />
                  <span>تصدير نسخة احتياطية محلية (يعمل بلا إنترنت تماماً)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  يمكنك تحميل ملف يحتوي على جميع أدوية المرضى وسجل الجرعات، أو نسخ النص التشفيري لنقله لأي هاتف آخر.
                </p>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => downloadBackupFile(appState)}
                    className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل ملف النسخة الاحتياطية (.json)</span>
                  </button>

                  <button
                    onClick={handleCopyJson}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                  >
                    {copiedJson ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedJson ? 'تم نسخ النص!' : 'نسخ كود البيانات كـ نص'}</span>
                  </button>
                </div>
              </div>

              {/* Import Section */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>استيراد وتحديث البيانات</span>
                </h3>

                <div className="flex items-center gap-4 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">طريقة الاستيراد:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="imp_mode"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="text-teal-600"
                    />
                    <span>دمج مع المرضى الحاليين (موصى به)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="imp_mode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-teal-600"
                    />
                    <span>استبدال البيانات بالكامل</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-100 flex items-center gap-2">
                    <Upload className="w-3.5 h-3.5" />
                    <span>اختيار ملف .json من جهازك</span>
                    <input type="file" accept=".json,text/plain" onChange={handleFileUpload} className="hidden" />
                  </label>
                  <span className="text-xs text-slate-400">أو الصق الكود النصي أدناه</span>
                </div>

                <textarea
                  rows={3}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="الصق كود النسخة الاحتياطية هنا..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />

                <button
                  disabled={!importText.trim()}
                  onClick={handleImportSubmit}
                  className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs disabled:opacity-50 transition-colors"
                >
                  تأكيد وتطبيق الاستيراد
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
