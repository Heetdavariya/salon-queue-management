import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserCheck, Clock, CheckCircle, Play, Coffee } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { StatusBadge } from '../components/common/Badge';
import { findNextEligibleCustomer } from '../domain/queueRules';

export const BarberView: React.FC = () => {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { t, language } = useTranslation();
  const { barbers, entries, services, startService, doneService, toggleBarberBreak } = useSalon();

  // Find current barber by case-insensitive name match, or default to first barber
  const barber = barbers.find(
    b => b.name.toLowerCase() === (name || '').toLowerCase()
  ) || barbers[0];

  // Active assignment for this barber (CALLED or IN_CHAIR)
  const currentCustomer = entries.find(
    e => e.assignedBarberId === barber?.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
  );

  // Next eligible customer for this barber
  const nextCustomer = barber ? findNextEligibleCustomer(entries, barber.id) : null;

  // Live timer for elapsed service duration
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    let interval: any;
    if (currentCustomer?.status === 'IN_CHAIR' && currentCustomer.startedAt) {
      const updateTimer = () => {
        const start = new Date(currentCustomer.startedAt!).getTime();
        const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
        setElapsedSeconds(diff);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [currentCustomer]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!barber) {
    return <div className="p-8 text-center text-charcoal-400">Barber not found</div>;
  }

  const isOnBreak = barber.status === 'ON_BREAK';

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-8 animate-fade-in space-y-6">
      {/* Barber Selector & Status Header */}
      <div className="flex items-center justify-between bg-charcoal-900 border border-charcoal-800 rounded-2xl p-4">
        <div>
          <span className="text-xs uppercase font-semibold text-charcoal-400">
            {t('barberViewTitle')}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h1 className="text-2xl font-bold text-charcoal-50">
              {language === 'gu' ? barber.nameGu : barber.name}
            </h1>
            <StatusBadge status={isOnBreak ? 'ON_BREAK' : 'AVAILABLE'} size="sm" />
          </div>
        </div>

        {/* Quick Switch Dropdown */}
        <div className="text-right">
          <label className="text-[11px] text-charcoal-400 block mb-1">
            {t('switchBarberLabel')}
          </label>
          <select
            value={barber.name}
            onChange={e => navigate(`/barber/${e.target.value}`)}
            className="px-3 py-1.5 rounded-lg bg-charcoal-800 border border-charcoal-700 text-xs font-semibold text-gold-400 focus:outline-none"
          >
            {barbers.map(b => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Break Warning if on break */}
      {isOnBreak && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-center gap-3">
          <Coffee className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs sm:text-sm text-amber-300">
            {t('barberCurrentlyOnBreak')}
          </p>
        </div>
      )}

      {/* Current Customer Card */}
      <div className="rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-4 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-gold-500" />
          <span>{t('currentCustomerTitle')}</span>
        </h2>

        {currentCustomer ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs text-charcoal-400">{t('tokenLabel')}</span>
                <div className="text-4xl sm:text-5xl font-black font-mono text-gold-400">
                  {currentCustomer.tokenNumber}
                </div>
                <h3 className="text-xl font-bold text-charcoal-100 mt-1">
                  {currentCustomer.customerName}
                </h3>
              </div>
              <StatusBadge status={currentCustomer.status} size="md" />
            </div>

            {/* Services List */}
            <div className="rounded-2xl bg-charcoal-950 p-4 border border-charcoal-800">
              <span className="text-xs text-charcoal-400 block mb-2">{t('selectedServices')}:</span>
              <div className="flex flex-wrap gap-2">
                {currentCustomer.serviceIds.map(sId => {
                  const s = services.find(srv => srv.id === sId);
                  return (
                    <span
                      key={sId}
                      className="px-3 py-1.5 rounded-lg bg-charcoal-800 text-xs font-semibold text-charcoal-200 border border-charcoal-700"
                    >
                      {s ? (language === 'gu' ? s.nameGu : s.nameEn) : sId}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Live Timer if In Chair */}
            {currentCustomer.status === 'IN_CHAIR' && (
              <div className="rounded-2xl bg-blue-500/10 border border-blue-500/30 p-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold">
                  <Clock className="w-5 h-5 animate-spin" />
                  <span>{t('serviceTimer')}</span>
                </div>
                <div className="font-mono text-2xl font-bold text-blue-300">
                  {formatTimer(elapsedSeconds)}
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div>
              {currentCustomer.status === 'CALLED' ? (
                <button
                  onClick={() => startService(currentCustomer.id)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-charcoal-950 font-bold text-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 touch-target"
                >
                  <Play className="w-5 h-5 fill-charcoal-950" />
                  <span>{t('startServiceBtn')}</span>
                </button>
              ) : (
                <button
                  onClick={() => doneService(currentCustomer.id)}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-charcoal-950 font-bold text-lg shadow-lg shadow-gold-500/20 transition-all flex items-center justify-center gap-2 touch-target"
                >
                  <CheckCircle className="w-6 h-6 stroke-[2.5]" />
                  <span>{t('doneServiceBtn')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-charcoal-500 border border-dashed border-charcoal-800 rounded-2xl">
            <p className="text-sm font-medium">{t('noCurrentCustomer')}</p>
          </div>
        )}
      </div>

      {/* Next For You Preview */}
      <div className="rounded-2xl bg-charcoal-900 border border-charcoal-800 p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-400 mb-3">
          {t('nextForYouTitle')}
        </h3>
        {nextCustomer ? (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-charcoal-800/60 border border-charcoal-700/60">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-gold-400 text-base">
                  {nextCustomer.tokenNumber}
                </span>
                <span className="font-semibold text-charcoal-100 text-sm">
                  {nextCustomer.customerName}
                </span>
              </div>
              <div className="text-xs text-charcoal-400 mt-1">
                {nextCustomer.serviceIds
                  .map(sId => services.find(s => s.id === sId)?.nameEn)
                  .filter(Boolean)
                  .join(', ')}
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded bg-charcoal-700 text-charcoal-300 font-medium">
              Up Next
            </span>
          </div>
        ) : (
          <p className="text-xs text-charcoal-500 py-3 text-center">
            {t('noNextCustomer')}
          </p>
        )}
      </div>

      {/* Available / On Break Toggle */}
      <div className="pt-2">
        <button
          onClick={() => toggleBarberBreak(barber.id)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm border transition-all flex items-center justify-center gap-2 touch-target ${
            isOnBreak
              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
        >
          <Coffee className="w-4 h-4" />
          <span>{isOnBreak ? t('statusToggleAvailable') : t('statusToggleBreak')}</span>
        </button>
      </div>
    </div>
  );
};
