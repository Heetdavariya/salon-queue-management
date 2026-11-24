import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Clock, Scissors, ArrowRight, ShieldCheck, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { StatusBadge } from '../components/common/Badge';
import { calculateEstimatedWait, isOnlineQueueCutoffActive } from '../domain/queueRules';

export const Home: React.FC = () => {
  const { t, language } = useTranslation();
  const { entries, barbers, services, settings, isConnected } = useSalon();
  const [isRetrying, setIsRetrying] = useState(false);

  const activeWaiting = entries.filter(e => e.status === 'WAITING');
  const isCutoff = isOnlineQueueCutoffActive(settings.closingTime, settings.autoCutoffMinutes);
  const canJoinOnline = settings.isOpen && settings.isOnlineQueueOpen && !isCutoff;

  // Approximate wait for someone arriving right now
  const dummyEntryId = activeWaiting.length > 0 ? activeWaiting[0].id : '';
  const waitEstimate = dummyEntryId
    ? calculateEstimatedWait(entries, dummyEntryId, barbers, services)
    : { waitMinutes: 0, isUnavailable: false, position: 0 };

  const approxMins = activeWaiting.length === 0 ? 0 : waitEstimate.waitMinutes ?? 15;

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      setIsRetrying(false);
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in space-y-8">
      {/* Disconnection Warning if connection lost */}
      {!isConnected && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center justify-between text-amber-300 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{t('connectionLost')}</span>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{t('retryBtn')}</span>
          </button>
        </div>
      )}

      {/* Hero / Salon Status Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-charcoal-800 via-charcoal-900 to-charcoal-950 border border-charcoal-700/60 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-charcoal-700/60">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{settings.isOpen ? t('openNow') : t('closedNow')}</span>
              <span>•</span>
              <span>{t('closesAt')} {settings.closingTime}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-charcoal-50 tracking-tight">
              {language === 'gu' ? settings.salonNameGu : settings.salonName}
            </h1>
            <p className="text-sm sm:text-base text-charcoal-300 mt-1">
              {t('tagline')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                canJoinOnline
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${canJoinOnline ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              {canJoinOnline ? t('onlineQueueOpen') : t('onlineQueueClosed')}
            </span>
          </div>
        </div>

        {/* Live Queue Counter & Estimated Wait */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <div className="bg-charcoal-900/80 border border-charcoal-700/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-charcoal-400 tracking-wider">
                {t('liveQueueTitle')}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-charcoal-50 mt-0.5">
                {activeWaiting.length}{' '}
                <span className="text-sm font-normal text-charcoal-300">
                  {activeWaiting.length === 1 ? t('customerWaitingSingular') : t('customersWaiting')}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-charcoal-900/80 border border-charcoal-700/50 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-semibold text-charcoal-400 tracking-wider">
                {t('approxWait')}
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-charcoal-50 mt-0.5">
                {activeWaiting.length === 0 ? (
                  <span className="text-emerald-400 text-lg font-semibold">{t('noOneWaiting')}</span>
                ) : (
                  <>~{approxMins} <span className="text-sm font-normal text-charcoal-300">{t('minutesSuffix')}</span></>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Prominent CTA */}
        <div className="mt-8">
          {canJoinOnline ? (
            <Link
              to="/join"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-charcoal-950 font-bold text-base shadow-lg shadow-gold-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 touch-target"
            >
              <span>{t('joinQueueBtn')}</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <div className="rounded-xl bg-charcoal-900/90 border border-amber-500/40 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-charcoal-200">
                <p className="font-semibold text-amber-300">
                  {!settings.isOpen ? t('closedNow') : t('onlineQueueClosed')}
                </p>
                <p className="mt-0.5 text-charcoal-300">
                  {isCutoff
                    ? t('autoCutoffExplanation')
                    : t('joinQueueClosedNote')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barbers Availability Cards */}
      <div className="rounded-3xl bg-charcoal-900/80 border border-charcoal-800 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-charcoal-100 flex items-center gap-2 mb-4">
          <Scissors className="w-5 h-5 text-gold-500" />
          <span>{t('barberAvailability')}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map(barber => {
            const activeCustomer = entries.find(
              e => e.assignedBarberId === barber.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
            );
            const statusDisplay = !barber.isOnDuty
              ? 'OFF_DUTY'
              : barber.status === 'ON_BREAK'
              ? 'ON_BREAK'
              : activeCustomer
              ? 'busy'
              : 'AVAILABLE';

            return (
              <div
                key={barber.id}
                className="rounded-2xl bg-charcoal-800/80 border border-charcoal-700/60 p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-charcoal-100">
                    {language === 'gu' ? barber.nameGu : barber.name}
                  </h3>
                  <p className="text-xs text-charcoal-400 mt-0.5">
                    {activeCustomer ? `${t('statusInChair')}: ${activeCustomer.tokenNumber}` : t('available')}
                  </p>
                </div>
                {statusDisplay === 'busy' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    {t('busy')}
                  </span>
                ) : (
                  <StatusBadge status={statusDisplay} size="sm" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* How it Works Section */}
      <div className="rounded-3xl bg-charcoal-900/60 border border-charcoal-800/80 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-charcoal-100 mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold-500" />
          <span>{t('howItWorksTitle')}</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 rounded-xl bg-charcoal-800/50 border border-charcoal-700/40">
            <span className="font-semibold text-gold-400 block mb-1">Step 1</span>
            <p className="text-charcoal-300">{t('howItWorksStep1')}</p>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-800/50 border border-charcoal-700/40">
            <span className="font-semibold text-gold-400 block mb-1">Step 2</span>
            <p className="text-charcoal-300">{t('howItWorksStep2')}</p>
          </div>
          <div className="p-4 rounded-xl bg-charcoal-800/50 border border-charcoal-700/40">
            <span className="font-semibold text-gold-400 block mb-1">Step 3</span>
            <p className="text-charcoal-300">{t('howItWorksStep3')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
