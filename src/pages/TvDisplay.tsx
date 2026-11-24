import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Scissors, Clock } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { StatusBadge } from '../components/common/Badge';
import { calculateEstimatedWait } from '../domain/queueRules';

export const TvDisplay: React.FC = () => {
  const { t, language } = useTranslation();
  const { barbers, entries, services, settings, lastCalledToken, clearLastCalledToken } = useSalon();

  const [soundEnabled, setSoundEnabled] = useState(false);
  const [pulseToken, setPulseToken] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play pleasant chime on newly called token
  const playChime = () => {
    try {
      if (!soundEnabled) return;
      const ctx = audioContextRef.current || new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.8);
    } catch (e) {
      console.warn('Audio chime play blocked:', e);
    }
  };

  // Watch for newly called token to pulse and chime
  useEffect(() => {
    if (lastCalledToken) {
      setPulseToken(lastCalledToken.tokenNumber);
      playChime();

      const timer = setTimeout(() => {
        setPulseToken(null);
        clearLastCalledToken();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [lastCalledToken, soundEnabled]);

  // Next 5 eligible waiting tokens
  const upNextEntries = entries
    .filter(e => e.status === 'WAITING')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-charcoal-950 text-charcoal-50 p-6 sm:p-10 flex flex-col justify-between font-sans selection:bg-gold-500">
      {/* Top Branding & Now Serving Header */}
      <div className="flex items-center justify-between pb-6 border-b border-charcoal-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
            <Scissors className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-charcoal-50">
              {language === 'gu' ? settings.salonNameGu : settings.salonName}
            </h1>
            <p className="text-gold-400 font-semibold text-sm tracking-wider uppercase mt-0.5">
              {t('tvHeaderNowServing')}
            </p>
          </div>
        </div>

        {/* Audio Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
            soundEnabled
              ? 'bg-gold-500/20 text-gold-300 border-gold-500/40'
              : 'bg-charcoal-900 text-charcoal-400 border-charcoal-800'
          }`}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-gold-400" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundEnabled ? t('soundEnabled') : t('enableSoundBtn')}</span>
        </button>
      </div>

      {/* Main Grid: Barber Stations Now Serving */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 flex-1">
        {barbers.map(barber => {
          const activeCustomer = entries.find(
            e => e.assignedBarberId === barber.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
          );
          const isPulsing = activeCustomer && pulseToken === activeCustomer.tokenNumber;

          return (
            <div
              key={barber.id}
              className={`rounded-3xl border p-8 flex flex-col justify-between transition-all duration-500 ${
                isPulsing
                  ? 'bg-gold-500/20 border-gold-400 ring-4 ring-gold-400/50 scale-[1.03] shadow-2xl shadow-gold-500/30'
                  : 'bg-charcoal-900/90 border-charcoal-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-charcoal-800/80">
                  <span className="text-2xl font-black text-charcoal-100">
                    {language === 'gu' ? barber.nameGu : barber.name}
                  </span>
                  <StatusBadge
                    status={!barber.isOnDuty ? 'OFF_DUTY' : barber.status}
                    size="lg"
                  />
                </div>

                {/* Token Display (Strictly NO phone numbers exposed on public TV!) */}
                <div className="my-8 text-center">
                  {activeCustomer ? (
                    <div>
                      <div className="text-xs uppercase font-bold tracking-widest text-gold-400 mb-1">
                        {activeCustomer.status === 'CALLED' ? t('statusCalled') : t('statusInChair')}
                      </div>
                      <div className="text-6xl sm:text-7xl font-mono font-black text-gold-400 tracking-tight">
                        {activeCustomer.tokenNumber}
                      </div>
                      <div className="text-xl font-bold text-charcoal-100 mt-2">
                        {activeCustomer.customerName}
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-charcoal-500">
                      <span className="text-lg font-semibold">{t('available')}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-charcoal-800/80 text-center text-xs text-charcoal-400">
                Station #{barber.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* Up Next Bar (Next 5 tokens with estimated wait times) */}
      <div className="rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gold-400 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold-500" />
          <span>{t('tvUpNext')}</span>
        </h2>

        {upNextEntries.length === 0 ? (
          <div className="text-center py-4 text-sm text-charcoal-500">
            {t('tvNoUpcomingQueue')}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {upNextEntries.map((item, idx) => {
              const waitCalc = calculateEstimatedWait(entries, item.id, barbers, services);
              const waitDisplay = waitCalc.isUnavailable
                ? '--'
                : `~${waitCalc.waitMinutes ?? 15}m`;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-charcoal-800/80 border border-charcoal-700/60 p-4 text-center"
                >
                  <span className="text-xs font-bold text-charcoal-400 block mb-1">
                    #{idx + 1}
                  </span>
                  <span className="font-mono text-2xl font-black text-gold-400 block">
                    {item.tokenNumber}
                  </span>
                  <span className="text-xs font-semibold text-charcoal-200 block truncate mt-1">
                    {item.customerName}
                  </span>
                  <span className="text-[11px] font-medium text-gold-400/80 block mt-1">
                    {waitDisplay}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
