import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, Clock, AlertTriangle, ExternalLink, RefreshCw, Scissors } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { calculateEstimatedWait, isOnlineQueueCutoffActive } from '../domain/queueRules';
import { QueueEntry } from '../domain/types';

export const JoinQueue: React.FC = () => {
  const { t, language } = useTranslation();
  const { services, barbers, settings, joinQueue, entries } = useSalon();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedBarberId, setSelectedBarberId] = useState<string>('ANY');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingActiveSpot, setExistingActiveSpot] = useState<QueueEntry | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeServices = useMemo(() => services.filter(s => s.isEnabled), [services]);
  const isCutoff = isOnlineQueueCutoffActive(settings.closingTime, settings.autoCutoffMinutes);
  const isOnlineOpen = settings.isOpen && settings.isOnlineQueueOpen && !isCutoff;

  const onDutyBarbers = useMemo(() => barbers.filter(b => b.isOnDuty), [barbers]);

  const toggleService = (id: string) => {
    if (selectedServiceIds.includes(id)) {
      setSelectedServiceIds(selectedServiceIds.filter(sId => sId !== id));
      setErrors(prev => ({ ...prev, services: '' }));
    } else {
      if (selectedServiceIds.length >= 3) {
        setErrors(prev => ({ ...prev, services: t('maxServicesExceeded') }));
        return;
      }
      setSelectedServiceIds([...selectedServiceIds, id]);
      setErrors(prev => ({ ...prev, services: '' }));
    }
  };

  const totals = useMemo(() => {
    let duration = 0;
    let price = 0;
    selectedServiceIds.forEach(id => {
      const s = services.find(srv => srv.id === id);
      if (s) {
        duration += s.durationMinutes;
        price += s.price;
      }
    });
    return { duration, price };
  }, [selectedServiceIds, services]);

  // Dynamic estimate of expected wait time for the customer joining right now
  const dynamicWaitEstimate = useMemo(() => {
    if (selectedServiceIds.length === 0) return null;

    // Create a temporary dummy entry placed at end of queue
    const dummyEntry: QueueEntry = {
      id: 'temp-dummy-id',
      tokenNumber: 'S-TEMP',
      customerName: 'Temp',
      phone: '0000000000',
      serviceIds: selectedServiceIds,
      preferredBarberId: selectedBarberId,
      status: 'WAITING',
      createdAt: new Date(Date.now() + 1000).toISOString()
    };

    const tempEntries = [...entries, dummyEntry];
    const calc = calculateEstimatedWait(tempEntries, dummyEntry.id, barbers, services);
    return calc;
  }, [selectedServiceIds, selectedBarberId, entries, barbers, services]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrors({});
    setExistingActiveSpot(null);

    if (!name.trim()) {
      setErrors(prev => ({ ...prev, name: t('nameRequired') }));
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^\d{10}$/.test(cleanPhone)) {
      setErrors(prev => ({ ...prev, phone: t('phoneInvalid') }));
      return;
    }

    if (selectedServiceIds.length === 0) {
      setErrors(prev => ({ ...prev, services: t('minServicesRequired') }));
      return;
    }

    setIsSubmitting(true);

    try {
      const result = joinQueue(name, phone, selectedServiceIds, selectedBarberId);
      if (result.success && result.entry) {
        navigate(`/status/${result.entry.id}`);
      } else {
        setIsSubmitting(false);
        if (result.existingActiveEntry) {
          setExistingActiveSpot(result.existingActiveEntry);
        } else if (result.error) {
          setErrors({ form: result.error });
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrors({ form: err.message || t('errorOccurred') });
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-charcoal-400 hover:text-gold-400 transition-colors mb-6 touch-target"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('backToHome')}</span>
      </Link>

      <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-50 mb-2">
          {t('joinTitle')}
        </h1>
        <p className="text-sm text-charcoal-300 mb-6">
          {t('tagline')}
        </p>

        {/* Online Queue Closed Banner */}
        {!isOnlineOpen && (
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-bold text-amber-300">
                {!settings.isOpen ? t('closedNow') : t('onlineQueueClosed')}
              </h3>
              <p className="text-xs text-charcoal-300 mt-1">
                {isCutoff ? t('autoCutoffExplanation') : t('joinQueueClosedNote')}
              </p>
            </div>
          </div>
        )}

        {/* Existing Active Spot Banner */}
        {existingActiveSpot && (
          <div className="mb-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-amber-300">{t('activeSpotFoundTitle')}</h3>
                <p className="text-xs text-charcoal-300 mt-1">{t('activeSpotFoundDesc')}</p>
                <div className="mt-3 flex items-center gap-3">
                  <span className="font-mono text-sm px-2.5 py-1 rounded bg-amber-500/20 text-amber-200 font-bold border border-amber-500/40">
                    Token: {existingActiveSpot.tokenNumber}
                  </span>
                  <Link
                    to={`/status/${existingActiveSpot.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold-400 hover:text-gold-300 underline"
                  >
                    <span>{t('viewExistingSpotBtn')}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {errors.form && (
          <div className="mb-6 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Name */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-200 mb-2">
              {t('nameLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!isOnlineOpen || isSubmitting}
              value={name}
              onChange={e => {
                setName(e.target.value);
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder={t('namePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-charcoal-800 border border-charcoal-700 text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-500 touch-target disabled:opacity-50"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{errors.name}</p>
            )}
          </div>

          {/* 10-digit Phone Number */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-200 mb-2">
              {t('phoneLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              disabled={!isOnlineOpen || isSubmitting}
              value={phone}
              onChange={e => {
                setPhone(e.target.value.replace(/\D/g, ''));
                setErrors(prev => ({ ...prev, phone: '' }));
              }}
              placeholder={t('phonePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-charcoal-800 border border-charcoal-700 text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-500 touch-target disabled:opacity-50"
            />
            <p className="text-xs text-charcoal-400 mt-1.5">{t('phoneHelp')}</p>
            {errors.phone && (
              <p className="text-xs text-rose-400 mt-1 font-medium">{errors.phone}</p>
            )}
          </div>

          {/* Service Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-charcoal-200">
                {t('servicesLabel')} <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-charcoal-400">{t('servicesHelp')}</span>
            </div>

            {errors.services && (
              <p className="text-xs text-rose-400 mb-2 font-medium">{errors.services}</p>
            )}

            {activeServices.length === 0 ? (
              <div className="p-4 rounded-xl bg-charcoal-800/40 border border-charcoal-700 text-center text-xs text-charcoal-400">
                <Scissors className="w-5 h-5 mx-auto mb-1 text-charcoal-500" />
                No services currently available.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeServices.map(srv => {
                  const isSelected = selectedServiceIds.includes(srv.id);
                  return (
                    <button
                      type="button"
                      key={srv.id}
                      disabled={!isOnlineOpen || isSubmitting}
                      onClick={() => toggleService(srv.id)}
                      className={`text-left p-3.5 rounded-xl border transition-all flex items-start justify-between gap-2 touch-target ${
                        isSelected
                          ? 'bg-gold-500/15 border-gold-500/50 ring-1 ring-gold-500/40 text-charcoal-50'
                          : 'bg-charcoal-800/80 border-charcoal-700/60 text-charcoal-200 hover:border-charcoal-600'
                      } ${!isOnlineOpen || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div>
                        <div className="font-semibold text-sm">
                          {language === 'gu' ? srv.nameGu : srv.nameEn}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-charcoal-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gold-500" />
                            {srv.durationMinutes} {t('minuteSuffix')}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-gold-400">₹{srv.price}</span>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-gold-500 border-gold-500 text-charcoal-950'
                            : 'border-charcoal-600 bg-charcoal-900'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Barber Selection */}
          <div>
            <label className="block text-sm font-semibold text-charcoal-200 mb-2">
              {t('barberPrefLabel')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!isOnlineOpen || isSubmitting}
                onClick={() => setSelectedBarberId('ANY')}
                className={`p-3.5 rounded-xl border text-left transition-all touch-target ${
                  selectedBarberId === 'ANY'
                    ? 'bg-gold-500/15 border-gold-500/50 ring-1 ring-gold-500/40'
                    : 'bg-charcoal-800/80 border-charcoal-700/60 hover:border-charcoal-600'
                } ${!isOnlineOpen || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-semibold text-sm text-charcoal-100">
                  {t('anyBarberOption')}
                </div>
                <div className="text-xs text-emerald-400 mt-0.5">
                  Best for shortest wait time
                </div>
              </button>

              {onDutyBarbers.map(barber => {
                const isOnBreak = barber.status === 'ON_BREAK';
                const isSelected = selectedBarberId === barber.id;
                return (
                  <button
                    type="button"
                    key={barber.id}
                    disabled={isOnBreak || !isOnlineOpen || isSubmitting}
                    onClick={() => !isOnBreak && setSelectedBarberId(barber.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all touch-target ${
                      isOnBreak
                        ? 'bg-charcoal-800/40 border-charcoal-800 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'bg-gold-500/15 border-gold-500/50 ring-1 ring-gold-500/40'
                        : 'bg-charcoal-800/80 border-charcoal-700/60 hover:border-charcoal-600'
                    }`}
                  >
                    <div className="font-semibold text-sm text-charcoal-100">
                      {language === 'gu' ? barber.nameGu : barber.name}
                    </div>
                    <div className="text-xs mt-0.5">
                      {isOnBreak ? (
                        <span className="text-amber-400 font-medium">
                          {t('barberOnBreakNote')}
                        </span>
                      ) : (
                        <span className="text-charcoal-400">{t('available')}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {onDutyBarbers.length === 0 && (
              <p className="text-xs text-amber-400 mt-2">
                No barbers currently on duty.
              </p>
            )}
          </div>

          {/* Booking Summary Box */}
          <div className="rounded-2xl bg-charcoal-950 border border-charcoal-800 p-4 space-y-2 text-sm">
            <h3 className="font-bold text-xs uppercase tracking-wider text-charcoal-400">
              {t('bookingSummary')}
            </h3>
            <div className="flex justify-between text-charcoal-300">
              <span>{t('totalDuration')}:</span>
              <span className="font-semibold text-charcoal-100">{totals.duration} {t('minutesSuffix')}</span>
            </div>
            <div className="flex justify-between text-charcoal-300">
              <span>{t('totalPrice')}:</span>
              <span className="font-bold text-gold-400 text-base">₹{totals.price}</span>
            </div>
            <div className="flex justify-between text-charcoal-300">
              <span>{t('selectedBarber')}:</span>
              <span className="font-semibold text-charcoal-100">
                {selectedBarberId === 'ANY'
                  ? t('anyBarberOption')
                  : barbers.find(b => b.id === selectedBarberId)?.name || selectedBarberId}
              </span>
            </div>
            {dynamicWaitEstimate && (
              <div className="pt-2 border-t border-charcoal-800/60 flex justify-between text-charcoal-300">
                <span className="text-gold-400 font-medium">{t('approxExpectedWait')}:</span>
                <span className="font-bold text-gold-400">
                  {dynamicWaitEstimate.isUnavailable
                    ? t('waitUnavailable')
                    : `~${dynamicWaitEstimate.waitMinutes ?? 15} ${t('minutesSuffix')}`}
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isOnlineOpen || selectedServiceIds.length === 0 || isSubmitting}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 disabled:opacity-50 disabled:cursor-not-allowed text-charcoal-950 font-bold text-base shadow-lg shadow-gold-500/20 transition-all touch-target flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{t('submitting')}</span>
              </>
            ) : (
              <span>{t('confirmAndGetTokenBtn')}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
