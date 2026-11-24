import React from 'react';
import { Scissors, Heart } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useSalon } from '../../context/SalonContext';

export const Footer: React.FC = () => {
  const { t, language } = useTranslation();
  const { settings } = useSalon();

  return (
    <footer className="mt-auto bg-charcoal-950 border-t border-charcoal-800/80 py-8 text-charcoal-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Scissors className="w-4 h-4 text-gold-500" />
          <span className="font-semibold text-charcoal-200">
            {language === 'gu' ? settings.salonNameGu : settings.salonName}
          </span>
          <span className="text-charcoal-500">•</span>
          <span>{t('tagline')}</span>
        </div>

        <div className="flex items-center gap-4 text-charcoal-400">
          <span>{t('closesAt')} {settings.closingTime}</span>
          <span className="text-charcoal-600">|</span>
          <span className="flex items-center gap-1 text-charcoal-400">
            Built with <Heart className="w-3.5 h-3.5 text-gold-500 inline fill-gold-500/20" /> for Salon Operations
          </span>
        </div>
      </div>
    </footer>
  );
};
