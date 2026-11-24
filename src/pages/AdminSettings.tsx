import React, { useState } from 'react';
import { Settings, Users, Scissors, RotateCcw, Plus, Edit2 } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useSalon } from '../context/SalonContext';
import { Service } from '../domain/types';
import { Modal } from '../components/common/Modal';

export const AdminSettings: React.FC = () => {
  const { t, language } = useTranslation();
  const {
    services,
    barbers,
    settings,
    entries,
    updateSettings,
    updateService,
    addService,
    toggleBarberDuty,
    resetToDemoData
  } = useSalon();

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // New service form state
  const [formNameEn, setFormNameEn] = useState('');
  const [formNameGu, setFormNameGu] = useState('');
  const [formDuration, setFormDuration] = useState('30');
  const [formPrice, setFormPrice] = useState('250');

  // Today's real performance statistics
  const doneToday = entries.filter(e => e.status === 'DONE');
  const noShowsToday = entries.filter(e => e.status === 'NO_SHOW');

  const totalWaitTimeMinutes = doneToday.reduce((sum, e) => {
    if (e.createdAt && e.calledAt) {
      const wait = (new Date(e.calledAt).getTime() - new Date(e.createdAt).getTime()) / 60000;
      return sum + Math.max(0, wait);
    }
    return sum;
  }, 0);

  const avgWaitTime = doneToday.length > 0 ? Math.round(totalWaitTimeMinutes / doneToday.length) : 0;

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingService) {
      updateService(editingService.id, {
        nameEn: formNameEn,
        nameGu: formNameGu,
        durationMinutes: parseInt(formDuration, 10) || 30,
        price: parseInt(formPrice, 10) || 200
      });
      setEditingService(null);
    } else {
      addService({
        nameEn: formNameEn,
        nameGu: formNameGu,
        durationMinutes: parseInt(formDuration, 10) || 30,
        price: parseInt(formPrice, 10) || 200,
        isEnabled: true
      });
      setIsAddServiceOpen(false);
    }
    setFormNameEn('');
    setFormNameGu('');
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormNameEn(service.nameEn);
    setFormNameGu(service.nameGu);
    setFormDuration(service.durationMinutes.toString());
    setFormPrice(service.price.toString());
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-charcoal-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-50 flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-gold-500" />
            <span>{t('adminTitle')}</span>
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            {t('adminSubtitle')}
          </p>
        </div>

        <button
          onClick={() => setIsResetConfirmOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-charcoal-200 border border-charcoal-700 text-xs font-semibold transition-colors touch-target"
        >
          <RotateCcw className="w-4 h-4 text-gold-500" />
          <span>{t('resetDemoDataBtn')}</span>
        </button>
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs text-charcoal-400 uppercase font-semibold">
            {t('statServedToday')}
          </span>
          <div className="text-3xl font-black text-emerald-400 mt-1">
            {doneToday.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs text-charcoal-400 uppercase font-semibold">
            {t('statAvgWait')}
          </span>
          <div className="text-3xl font-black text-gold-400 mt-1">
            {avgWaitTime} <span className="text-sm font-normal text-charcoal-400">{t('minutesSuffix')}</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-charcoal-900 border border-charcoal-800">
          <span className="text-xs text-charcoal-400 uppercase font-semibold">
            {t('statNoShows')}
          </span>
          <div className="text-3xl font-black text-rose-400 mt-1">
            {noShowsToday.length}
          </div>
        </div>
      </div>

      {/* Operating Hours & Queue Control */}
      <div className="rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-charcoal-100 mb-6 flex items-center gap-2">
          <span>{t('queueControlsTitle')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-5 rounded-2xl bg-charcoal-800/60 border border-charcoal-700/60 flex items-center justify-between">
            <div>
              <span className="font-semibold text-charcoal-100 text-sm block">
                {t('toggleOnlineQueueLabel')}
              </span>
              <span className="text-xs text-charcoal-400 mt-0.5 block">
                {settings.isOnlineQueueOpen ? 'Active and accepting' : 'Disabled'}
              </span>
            </div>
            <button
              onClick={() => updateSettings({ isOnlineQueueOpen: !settings.isOnlineQueueOpen })}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all touch-target ${
                settings.isOnlineQueueOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
              }`}
            >
              {settings.isOnlineQueueOpen ? t('statusEnabled') : t('statusDisabled')}
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-charcoal-800/60 border border-charcoal-700/60">
            <label className="font-semibold text-charcoal-100 text-sm block mb-1">
              {t('closingTimeLabel')}
            </label>
            <input
              type="time"
              value={settings.closingTime}
              onChange={e => updateSettings({ closingTime: e.target.value })}
              className="px-3 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-700 text-gold-400 font-mono font-bold text-sm"
            />
            <p className="text-xs text-charcoal-400 mt-2">
              {t('autoCutoffExplanation')}
            </p>
          </div>
        </div>
      </div>

      {/* Barbers Duty Management */}
      <div className="rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6 sm:p-8">
        <h2 className="text-lg font-bold text-charcoal-100 mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-500" />
          <span>{t('barberDutyTitle')}</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {barbers.map(barber => (
            <div
              key={barber.id}
              className="p-4 rounded-2xl bg-charcoal-800/60 border border-charcoal-700/60 flex items-center justify-between"
            >
              <div>
                <span className="font-bold text-charcoal-100 block">
                  {language === 'gu' ? barber.nameGu : barber.name}
                </span>
                <span className="text-xs text-charcoal-400 mt-0.5 block">
                  {barber.status === 'ON_BREAK' ? t('onBreak') : t('available')}
                </span>
              </div>
              <button
                onClick={() => toggleBarberDuty(barber.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all touch-target ${
                  barber.isOnDuty
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-charcoal-700 text-charcoal-400 border-charcoal-600'
                }`}
              >
                {barber.isOnDuty ? t('onDutyLabel') : t('offDutyLabel')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Services Management */}
      <div className="rounded-3xl bg-charcoal-900 border border-charcoal-800 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-charcoal-100 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-gold-500" />
            <span>{t('servicesSectionTitle')}</span>
          </h2>
          <button
            onClick={() => {
              setEditingService(null);
              setFormNameEn('');
              setFormNameGu('');
              setFormDuration('30');
              setFormPrice('250');
              setIsAddServiceOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs shadow-md transition-all touch-target"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{t('addNewServiceBtn')}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-charcoal-300">
            <thead className="bg-charcoal-950 text-xs text-charcoal-400 uppercase tracking-wider border-b border-charcoal-800">
              <tr>
                <th className="px-4 py-3">{t('serviceNameEn')}</th>
                <th className="px-4 py-3">{t('serviceNameGu')}</th>
                <th className="px-4 py-3">{t('durationMin')}</th>
                <th className="px-4 py-3">{t('priceRs')}</th>
                <th className="px-4 py-3">{t('colStatus')}</th>
                <th className="px-4 py-3 text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-800">
              {services.map(srv => (
                <tr key={srv.id} className="hover:bg-charcoal-800/40">
                  <td className="px-4 py-3.5 font-semibold text-charcoal-100">{srv.nameEn}</td>
                  <td className="px-4 py-3.5 text-charcoal-300">{srv.nameGu}</td>
                  <td className="px-4 py-3.5">{srv.durationMinutes} min</td>
                  <td className="px-4 py-3.5 font-bold text-gold-400">₹{srv.price}</td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => updateService(srv.id, { isEnabled: !srv.isEnabled })}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        srv.isEnabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {srv.isEnabled ? t('statusEnabled') : t('statusDisabled')}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => openEditModal(srv)}
                      className="p-1.5 rounded-lg text-charcoal-400 hover:text-gold-400 hover:bg-charcoal-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      <Modal
        isOpen={isAddServiceOpen || !!editingService}
        onClose={() => {
          setIsAddServiceOpen(false);
          setEditingService(null);
        }}
        title={editingService ? t('editService') : t('addNewServiceBtn')}
      >
        <form onSubmit={handleSaveService} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              {t('serviceNameEn')}
            </label>
            <input
              type="text"
              required
              value={formNameEn}
              onChange={e => setFormNameEn(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-300 mb-1">
              {t('serviceNameGu')}
            </label>
            <input
              type="text"
              required
              value={formNameGu}
              onChange={e => setFormNameGu(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                {t('durationMin')}
              </label>
              <input
                type="number"
                required
                min={5}
                max={180}
                value={formDuration}
                onChange={e => setFormDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal-300 mb-1">
                {t('priceRs')}
              </label>
              <input
                type="number"
                required
                min={0}
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-charcoal-700 text-sm text-charcoal-100"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAddServiceOpen(false);
                setEditingService(null);
              }}
              className="px-4 py-2 rounded-xl bg-charcoal-800 text-charcoal-300 text-xs font-semibold"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 text-xs font-bold"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Demo Data Modal */}
      <Modal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        title={t('resetDemoDataBtn')}
      >
        <p className="text-sm text-charcoal-300 mb-6">{t('resetDemoConfirm')}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setIsResetConfirmOpen(false)}
            className="px-4 py-2 rounded-xl bg-charcoal-800 text-charcoal-300 text-sm font-semibold"
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => {
              resetToDemoData();
              setIsResetConfirmOpen(false);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-bold"
          >
            {t('confirm')}
          </button>
        </div>
      </Modal>
    </div>
  );
};
