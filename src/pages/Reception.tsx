import React, { useState, useEffect } from 'react';
import { Users, Plus, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { StatusBadge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { canBarberTakeCustomer, findNextEligibleCustomer } from '../domain/queueRules';

export const Reception: React.FC = () => {
  const { t, language } = useTranslation();
  const { entries, barbers, services, settings, callNext, markNoShow, cancelSpot, addWalkIn } = useSalon();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInServices, setWalkInServices] = useState<string[]>([]);
  const [walkInBarber, setWalkInBarber] = useState('ANY');
  const [walkInError, setWalkInError] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [selectedForNoShow, setSelectedForNoShow] = useState<string | null>(null);
  const [selectedForCancel, setSelectedForCancel] = useState<string | null>(null);

  // Real-time clock for reception landscape header
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter waiting list ordered strictly FCFS (createdAt ascending)
  const waitingEntries = entries
    .filter(e => e.status === 'WAITING' || e.status === 'CALLED')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const handleWalkInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWalkInError('');
    const result = addWalkIn(walkInName, walkInPhone, walkInServices, walkInBarber);
    if (result.success && result.entry) {
      setWalkInName('');
      setWalkInPhone('');
      setWalkInServices([]);
      setWalkInBarber('ANY');
      setIsWalkInOpen(false);
      setToastMessage(`${t('walkInSuccessMsg')} (Token ${result.entry.tokenNumber})`);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      setWalkInError(result.error || 'Failed to add walk-in');
    }
  };

  const formatElapsed = (startedAtIso?: string) => {
    if (!startedAtIso) return '00:00';
    const totalSecs = Math.max(0, Math.floor((Date.now() - new Date(startedAtIso).getTime()) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-fade-in">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl bg-emerald-500 text-charcoal-950 font-bold px-5 py-3 shadow-2xl flex items-center gap-2 animate-slide-up">
          <CheckCircle className="w-5 h-5 stroke-[2.5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Title, Live Clock, and Add Walk-in */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-charcoal-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-50 flex items-center gap-2.5">
              <Users className="w-7 h-7 text-gold-500" />
              <span>{t('receptionTitle')}</span>
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-charcoal-800 border border-charcoal-700 font-mono text-gold-400">
              <Clock className="w-3.5 h-3.5" />
              {currentTime}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-charcoal-400 mt-1">
            Optimized for 10-inch Tablet Landscape & Multi-Device Real-Time Management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              settings.isOnlineQueueOpen
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${settings.isOnlineQueueOpen ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span>{settings.isOnlineQueueOpen ? t('onlineQueueOpen') : t('onlineQueueClosed')}</span>
          </span>

          <button
            onClick={() => setIsWalkInOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-sm shadow-md shadow-gold-500/20 touch-target transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('addWalkInBtn')}</span>
          </button>
        </div>
      </div>

      {/* Barber Station Cards */}
      <div>
        <h2 className="text-lg font-bold text-charcoal-100 mb-4 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-gold-500" />
          <span>{t('barberStations')}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {barbers.map(barber => {
            const activeCustomer = entries.find(
              e => e.assignedBarberId === barber.id && (e.status === 'CALLED' || e.status === 'IN_CHAIR')
            );
            const canCall = canBarberTakeCustomer(barber, entries);
            const nextEligible = findNextEligibleCustomer(entries, barber.id);

            return (
              <div
                key={barber.id}
                className="rounded-2xl bg-charcoal-900 border border-charcoal-800 p-5 shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-charcoal-800">
                    <h3 className="font-bold text-base text-charcoal-50">
                      {language === 'gu' ? barber.nameGu : barber.name}
                    </h3>
                    <StatusBadge
                      status={!barber.isOnDuty ? 'OFF_DUTY' : barber.status}
                      size="sm"
                    />
                  </div>

                  {/* Active Customer Details */}
                  <div className="mt-4">
                    {activeCustomer ? (
                      <div className="rounded-xl bg-charcoal-800/80 border border-charcoal-700/60 p-3.5 space-y-2">
                        <div className="flex items-center justify-between text-xs text-charcoal-400">
                          <span>{t('currentlyServing')}</span>
                          <span className="font-mono text-gold-400 font-bold text-base">
                            {activeCustomer.tokenNumber}
                          </span>
                        </div>
                        <div className="font-semibold text-sm text-charcoal-100">
                          {activeCustomer.customerName}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-charcoal-700/60 text-xs">
                          <StatusBadge status={activeCustomer.status} size="sm" />
                          <span className="font-mono text-charcoal-300 font-medium">
                            {activeCustomer.status === 'IN_CHAIR'
                              ? `In chair: ${formatElapsed(activeCustomer.startedAt)}`
                              : `Called: ${Math.floor((Date.now() - new Date(activeCustomer.calledAt || activeCustomer.createdAt).getTime()) / 60000)}m ago`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-charcoal-800/30 border border-dashed border-charcoal-800 p-5 text-center text-xs text-charcoal-400">
                        {t('noActiveCustomer')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Call Next Action */}
                <div className="mt-4 pt-3 border-t border-charcoal-800">
                  <button
                    onClick={() => callNext(barber.id)}
                    disabled={!canCall || !nextEligible}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gold-500 hover:bg-gold-400 text-charcoal-950 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-target flex items-center justify-center gap-2"
                  >
                    <span>{t('callNextBtn')}</span>
                    {nextEligible && (
                      <span className="font-mono bg-charcoal-950/20 px-2 py-0.5 rounded text-[11px]">
                        ({nextEligible.tokenNumber})
                      </span>
                    )}
                  </button>
                  {!canCall ? (
                    <p className="text-[11px] text-charcoal-500 text-center mt-1">
                      {activeCustomer
                        ? 'Station Busy (1 active assignment limit)'
                        : barber.status === 'ON_BREAK'
                        ? 'Barber is On Break'
                        : 'Barber is Off Duty'}
                    </p>
                  ) : !nextEligible ? (
                    <p className="text-[11px] text-charcoal-500 text-center mt-1">
                      {t('noEligibleCustomer')}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ordered Waiting List Table */}
      <div className="rounded-2xl bg-charcoal-900 border border-charcoal-800 shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-charcoal-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-charcoal-100 flex items-center gap-2">
            <span>{t('orderedWaitingList')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/30 font-bold">
              {waitingEntries.length}
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal-300">
            <thead className="bg-charcoal-950/60 text-xs font-semibold text-charcoal-400 uppercase tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="px-6 py-3.5">{t('colToken')}</th>
                <th className="px-6 py-3.5">{t('colCustomer')}</th>
                <th className="px-6 py-3.5">{t('colServices')}</th>
                <th className="px-6 py-3.5">{t('colBarberPref')}</th>
                <th className="px-6 py-3.5">{t('colWaitDuration')}</th>
                <th className="px-6 py-3.5">{t('colStatus')}</th>
                <th className="px-6 py-3.5 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {waitingEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-charcoal-500">
                    {t('emptyQueue')}
                  </td>
                </tr>
              ) : (
                waitingEntries.map(entry => {
                  const minutesWaiting = Math.floor(
                    (Date.now() - new Date(entry.createdAt).getTime()) / 60000
                  );
                  const isOver60 = minutesWaiting > 60;
                  const prefBarber = barbers.find(b => b.id === entry.preferredBarberId);

                  const minutesSinceCalled = entry.calledAt
                    ? Math.floor((Date.now() - new Date(entry.calledAt).getTime()) / 60000)
                    : 0;

                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-charcoal-800/40 transition-colors ${
                        isOver60 ? 'bg-amber-500/10 border-l-4 border-l-amber-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4 font-mono font-bold text-gold-400 text-base">
                        {entry.tokenNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-charcoal-100">{entry.customerName}</div>
                        <div className="text-xs text-charcoal-400">{entry.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {entry.serviceIds.map(sId => {
                            const s = services.find(srv => srv.id === sId);
                            return (
                              <span
                                key={sId}
                                className="px-2 py-0.5 rounded bg-charcoal-800 text-xs text-charcoal-300 border border-charcoal-700"
                              >
                                {s ? (language === 'gu' ? s.nameGu : s.nameEn) : sId}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-charcoal-300">
                        {prefBarber
                          ? (language === 'gu' ? prefBarber.nameGu : prefBarber.name)
                          : t('anyBarberOption')}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            isOver60
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                              : 'text-charcoal-300'
                          }`}
                        >
                          {minutesWaiting} {t('minutesSuffix')}
                          {isOver60 && (
                            <span className="text-[10px] uppercase font-bold text-amber-400 ml-1">
                              (Urgent)
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={entry.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {entry.status === 'CALLED' && (
                          <button
                            onClick={() => setSelectedForNoShow(entry.id)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold border border-rose-500/40 touch-target transition-colors"
                            title={
                              minutesSinceCalled >= 10
                                ? 'Called over 10 min ago — eligible for No-Show'
                                : `Called ${minutesSinceCalled}m ago (eligible after 10m)`
                            }
                          >
                            {t('noShowAction')}
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedForCancel(entry.id)}
                          className="px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-300 hover:text-charcoal-100 text-xs font-semibold touch-target transition-colors"
                        >
                          {t('cancelAction')}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Walk-in Modal */}
      <Modal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        title={t('walkInModalTitle')}
      >
        <form onSubmit={handleWalkInSubmit} className="space-y-4">
          {walkInError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {walkInError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              {t('nameLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={walkInName}
              onChange={e => setWalkInName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              {t('phoneLabel')} <span className="text-rose-400">*</span>
            </label>
            <input
              type="tel"
              required
              maxLength={10}
              value={walkInPhone}
              onChange={e => setWalkInPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit mobile number"
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100 placeholder-charcoal-500 focus:outline-none focus:ring-2 focus:ring-gold-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              {t('servicesLabel')} (Max 3) <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {services
                .filter(s => s.isEnabled)
                .map(s => {
                  const isSelected = walkInServices.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        if (isSelected) {
                          setWalkInServices(walkInServices.filter(id => id !== s.id));
                        } else if (walkInServices.length < 3) {
                          setWalkInServices([...walkInServices, s.id]);
                        }
                      }}
                      className={`p-2.5 rounded-lg text-xs text-left border transition-all ${
                        isSelected
                          ? 'bg-gold-500/20 border-gold-500 text-gold-300 font-semibold'
                          : 'bg-charcoal-800 border-charcoal-700 text-charcoal-300 hover:border-charcoal-600'
                      }`}
                    >
                      <div className="truncate">{language === 'gu' ? s.nameGu : s.nameEn}</div>
                      <div className="text-[11px] text-charcoal-400 mt-0.5">
                        {s.durationMinutes}m • ₹{s.price}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              {t('barberPrefLabel')}
            </label>
            <select
              value={walkInBarber}
              onChange={e => setWalkInBarber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100 focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="ANY">{t('anyBarberOption')}</option>
              {barbers
                .filter(b => b.isOnDuty)
                .map(b => (
                  <option key={b.id} value={b.id} disabled={b.status === 'ON_BREAK'}>
                    {b.name} {b.status === 'ON_BREAK' ? '(On break)' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsWalkInOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-charcoal-800 text-charcoal-300 text-xs font-semibold hover:bg-charcoal-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={walkInServices.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold disabled:opacity-50"
            >
              {t('addWalkInBtn')}
            </button>
          </div>
        </form>
      </Modal>

      {/* No Show Confirmation Modal */}
      <Modal
        isOpen={!!selectedForNoShow}
        onClose={() => setSelectedForNoShow(null)}
        title={t('noShowConfirmTitle')}
      >
        {(() => {
          const entryToNoShow = entries.find(e => e.id === selectedForNoShow);
          const minutesCalled = entryToNoShow?.calledAt
            ? Math.floor((Date.now() - new Date(entryToNoShow.calledAt).getTime()) / 60000)
            : 0;
          return (
            <div>
              <p className="text-sm text-charcoal-300 mb-3">{t('noShowConfirmDesc')}</p>
              {entryToNoShow && (
                <div className="p-3 mb-4 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-200 space-y-1">
                  <div><strong>Customer:</strong> {entryToNoShow.customerName} ({entryToNoShow.tokenNumber})</div>
                  <div><strong>Time Elapsed Since Called:</strong> {minutesCalled} minutes</div>
                </div>
              )}
            </div>
          );
        })()}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setSelectedForNoShow(null)}
            className="px-4 py-2.5 rounded-xl bg-charcoal-800 text-charcoal-300 text-sm font-semibold hover:bg-charcoal-700"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => {
              if (selectedForNoShow) markNoShow(selectedForNoShow);
              setSelectedForNoShow(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold"
          >
            {t('confirmNoShowBtn')}
          </button>
        </div>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!selectedForCancel}
        onClose={() => setSelectedForCancel(null)}
        title={t('cancelConfirmTitle')}
      >
        {(() => {
          const entryToCancel = entries.find(e => e.id === selectedForCancel);
          return (
            <div>
              <p className="text-sm text-charcoal-300 mb-3">{t('cancelConfirmDesc')}</p>
              {entryToCancel && (
                <div className="p-3 mb-4 rounded-xl bg-charcoal-800 border border-charcoal-700 text-xs text-charcoal-200">
                  <strong>Token:</strong> {entryToCancel.tokenNumber} — {entryToCancel.customerName}
                </div>
              )}
            </div>
          );
        })()}
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setSelectedForCancel(null)}
            className="px-4 py-2.5 rounded-xl bg-charcoal-800 text-charcoal-300 text-sm font-semibold hover:bg-charcoal-700"
          >
            {t('cancelConfirmNo')}
          </button>
          <button
            onClick={() => {
              if (selectedForCancel) cancelSpot(selectedForCancel);
              setSelectedForCancel(null);
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold"
          >
            {t('cancelConfirmYes')}
          </button>
        </div>
      </Modal>
    </div>
  );
};
