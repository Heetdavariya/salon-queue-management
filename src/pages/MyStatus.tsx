import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Bell,
  Scissors,
  CheckCircle,
  XCircle,
  UserX
} from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { calculateEstimatedWait } from '../domain/queueRules';

export const MyStatus: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useTranslation();
  const { entries, barbers, services, cancelSpot } = useSalon();

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [elapsedInChairSeconds, setElapsedInChairSeconds] = useState(0);

  const entry = entries.find(e => e.id === id);

  // Live timer for IN_CHAIR service duration
  useEffect(() => {
    let interval: any;
    if (entry?.status === 'IN_CHAIR' && entry.startedAt) {
      const updateTimer = () => {
        const start = new Date(entry.startedAt!).getTime();
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
        setElapsedInChairSeconds(diff);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedInChairSeconds(0);
    }
    return () => clearInterval(interval);
  }, [entry?.status, entry?.startedAt]);

  if (!entry) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-charcoal-100">{t('tokenNotFound')}</h1>
        <p className="text-sm text-charcoal-400 mt-2 mb-6">{t('tokenNotFoundDesc')}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-charcoal-800 text-gold-400 font-semibold border border-charcoal-700 hover:bg-charcoal-700 transition-colors touch-target"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToHome')}</span>
        </Link>
      </div>
    );
  }

  const waitCalculation = calculateEstimatedWait(entries, entry.id, barbers, services);
  const position = waitCalculation.position;
  const waitMinutes = waitCalculation.waitMinutes;

  const assignedBarber = entry.assignedBarberId
    ? barbers.find(b => b.id === entry.assignedBarberId)
    : null;

  const preferredBarber = entry.preferredBarberId !== 'ANY'
    ? barbers.find(b => b.id === entry.preferredBarberId)
    : null;

  const isCalled = entry.status === 'CALLED';
  const isSecondInLine = entry.status === 'WAITING' && position === 2;
  const isInChair = entry.status === 'IN_CHAIR';
  const isDone = entry.status === 'DONE';
  const isCancelled = entry.status === 'CANCELLED';
  const isNoShow = entry.status === 'NO_SHOW';

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleConfirmCancel = () => {
    cancelSpot(entry.id);
    setIsCancelModalOpen(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-charcoal-400 hover:text-gold-400 transition-colors touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('backToHome')}</span>
      </Link>

      {/* High-visibility Called / It's Your Turn Banner */}
      {isCalled && (
        <div className="rounded-3xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 p-6 sm:p-8 text-charcoal-950 shadow-2xl animate-pulse-subtle border-2 border-gold-300">
          <div className="flex items-center gap-3 mb-2">
            <Bell className="w-8 h-8 fill-charcoal-950 stroke-charcoal-950" />
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {t('yourTurnTitle')}
            </h2>
          </div>
          <p className="text-base sm:text-lg font-bold opacity-95">
            {t('yourTurnDesc')}{' '}
            <span className="underline decoration-charcoal-950 decoration-2 font-black">
              {assignedBarber
                ? (language === 'gu' ? assignedBarber.nameGu : assignedBarber.name)
                : 'Barber Station'}
            </span>
          </p>
          <div className="mt-4 pt-3 border-t border-charcoal-950/20 text-xs font-semibold opacity-90">
            Please proceed to the chair now so we can begin your service.
          </div>
        </div>
      )}

      {/* Second in Line: Start Coming Banner */}
      {isSecondInLine && (
        <div className="rounded-2xl bg-amber-500/15 border border-amber-500/40 p-5 flex items-start gap-3 animate-slide-up">
          <AlertCircle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-300 text-base">
              {t('startComingAlertTitle')}
            </h3>
            <p className="text-xs sm:text-sm text-charcoal-300 mt-1">
              {t('startComingAlertDesc')}
            </p>
          </div>
        </div>
      )}

      {/* Terminal State Notices */}
      {isDone && (
        <div className="rounded-2xl bg-emerald-500/15 border border-emerald-500/40 p-5 flex items-start gap-3">
          <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-emerald-300 text-base">{t('statusFinishedTitle')}</h3>
            <p className="text-xs sm:text-sm text-charcoal-300 mt-1">{t('statusFinishedDesc')}</p>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="rounded-2xl bg-gray-500/15 border border-gray-600/40 p-5 flex items-start gap-3">
          <XCircle className="w-6 h-6 text-gray-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-300 text-base">{t('statusCancelledTitle')}</h3>
            <p className="text-xs sm:text-sm text-charcoal-400 mt-1">{t('statusCancelledDesc')}</p>
          </div>
        </div>
      )}

      {isNoShow && (
        <div className="rounded-2xl bg-rose-500/15 border border-rose-500/40 p-5 flex items-start gap-3">
          <UserX className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-rose-300 text-base">{t('statusNoShowTitle')}</h3>
            <p className="text-xs sm:text-sm text-charcoal-300 mt-1">{t('statusNoShowDesc')}</p>
          </div>
        </div>
      )}

      {/* Main Token Status Card */}
      <div className="rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
        <div className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-1">
          {t('tokenLabel')}
        </div>
        <div className="text-5xl sm:text-6xl font-black text-gold-400 font-mono tracking-tight my-2">
          {entry.tokenNumber}
        </div>
        <div className="text-base font-semibold text-charcoal-100">
          {entry.customerName}
        </div>
        <div className="mt-4 flex justify-center">
          <StatusBadge status={entry.status} size="lg" />
        </div>

        {/* In Chair Active Service Display */}
        {isInChair && (
          <div className="mt-6 pt-6 border-t border-charcoal-800">
            <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
                <Scissors className="w-5 h-5 animate-spin" />
                <span>Service In Progress ({assignedBarber ? assignedBarber.name : 'Barber'})</span>
              </div>
              <div className="font-mono text-xl font-bold text-blue-300">
                {formatTimer(elapsedInChairSeconds)}
              </div>
            </div>
          </div>
        )}

        {/* Position & Estimated Wait (Shown when Waiting) */}
        {entry.status === 'WAITING' && (
          <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-charcoal-800 text-left">
            <div className="bg-charcoal-800/60 p-4 rounded-2xl border border-charcoal-700/40">
              <span className="text-xs text-charcoal-400 block">{t('queuePosition')}</span>
              <span className="text-2xl font-bold text-charcoal-100 mt-1 block">
                #{position}{' '}
                <span className="text-xs font-normal text-charcoal-400">{t('inLineSuffix')}</span>
              </span>
            </div>

            <div className="bg-charcoal-800/60 p-4 rounded-2xl border border-charcoal-700/40">
              <span className="text-xs text-charcoal-400 block">{t('approxWaitTime')}</span>
              <span className="text-2xl font-bold text-charcoal-100 mt-1 block">
                {waitCalculation.isUnavailable ? (
                  <span className="text-xs text-amber-400 font-medium">{t('waitUnavailable')}</span>
                ) : (
                  <>~{waitMinutes} <span className="text-xs font-normal text-charcoal-400">{t('minutesSuffix')}</span></>
                )}
              </span>
            </div>
          </div>
        )}

        {/* Selected Services & Barber Preference */}
        <div className="mt-6 pt-6 border-t border-charcoal-800 text-left space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-charcoal-400">{t('selectedBarber')}:</span>
            <span className="font-semibold text-charcoal-200">
              {assignedBarber
                ? (language === 'gu' ? assignedBarber.nameGu : assignedBarber.name)
                : preferredBarber
                ? (language === 'gu' ? preferredBarber.nameGu : preferredBarber.name)
                : t('anyBarberOption')}
            </span>
          </div>

          <div className="text-xs sm:text-sm">
            <span className="text-charcoal-400 block mb-1">{t('selectedServices')}:</span>
            <div className="flex flex-wrap gap-1.5">
              {entry.serviceIds.map(sId => {
                const srv = services.find(s => s.id === sId);
                if (!srv) return null;
                return (
                  <span
                    key={srv.id}
                    className="inline-flex items-center px-2.5 py-1 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-200"
                  >
                    {language === 'gu' ? srv.nameGu : srv.nameEn} (₹{srv.price})
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Cancel Spot Action (Only when active: WAITING or CALLED) */}
        {(entry.status === 'WAITING' || entry.status === 'CALLED') && (
          <div className="mt-8 pt-6 border-t border-charcoal-800">
            <button
              onClick={() => setIsCancelModalOpen(true)}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 underline touch-target"
            >
              {t('cancelMySpotBtn')}
            </button>
          </div>
        )}

        {/* If in terminal state, provide button to rejoin */}
        {(isDone || isCancelled || isNoShow) && (
          <div className="mt-8 pt-6 border-t border-charcoal-800">
            <Link
              to="/join"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-sm shadow-md transition-all touch-target"
            >
              <span>{t('joinQueueBtn')}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Dialog */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title={t('cancelConfirmTitle')}
      >
        <p className="text-sm text-charcoal-300 mb-6">
          {t('cancelConfirmDesc')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => setIsCancelModalOpen(false)}
            className="px-4 py-2.5 rounded-xl bg-charcoal-800 text-charcoal-200 font-semibold hover:bg-charcoal-700 text-sm touch-target"
          >
            {t('cancelConfirmNo')}
          </button>
          <button
            onClick={handleConfirmCancel}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm touch-target"
          >
            {t('cancelConfirmYes')}
          </button>
        </div>
      </Modal>
    </div>
  );
};
