import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scissors, Globe, Users, Tv, Settings, UserCheck } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { useSalon } from '../../context/SalonContext';

export const Navbar: React.FC = () => {
  const { language, toggleLanguage, t } = useTranslation();
  const { settings, isConnected } = useSalon();
  const location = useLocation();

  const isCurrent = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur-md border-b border-charcoal-800/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-gold-500 hover:text-gold-400 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500 rounded-lg p-1"
          >
            <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-500">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-charcoal-50 block leading-tight">
                {language === 'gu' ? settings.salonNameGu : settings.salonName}
              </span>
              <span className="text-[11px] text-charcoal-400 font-medium hidden sm:block">
                {t('tagline')}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center gap-1.5 ${
                isCurrent('/') && location.pathname === '/'
                  ? 'bg-charcoal-800 text-gold-400 shadow-inner'
                  : 'text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-800/60'
              }`}
            >
              {t('navHome')}
            </Link>

            <Link
              to="/reception"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center gap-1.5 ${
                isCurrent('/reception')
                  ? 'bg-charcoal-800 text-gold-400 shadow-inner'
                  : 'text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-800/60'
              }`}
            >
              <Users className="w-4 h-4" />
              {t('navReception')}
            </Link>

            <Link
              to="/barber/Ravi"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center gap-1.5 ${
                isCurrent('/barber')
                  ? 'bg-charcoal-800 text-gold-400 shadow-inner'
                  : 'text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-800/60'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              {t('navBarber')}
            </Link>

            <Link
              to="/display"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center gap-1.5 ${
                isCurrent('/display')
                  ? 'bg-charcoal-800 text-gold-400 shadow-inner'
                  : 'text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-800/60'
              }`}
            >
              <Tv className="w-4 h-4" />
              {t('navTv')}
            </Link>

            <Link
              to="/admin"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target flex items-center gap-1.5 ${
                isCurrent('/admin')
                  ? 'bg-charcoal-800 text-gold-400 shadow-inner'
                  : 'text-charcoal-300 hover:text-charcoal-100 hover:bg-charcoal-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              {t('navAdmin')}
            </Link>
          </nav>

          {/* Right Section: Sync indicator & Language Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Sync Status */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-charcoal-800 border border-charcoal-700/60 text-xs text-charcoal-300"
              title={isConnected ? t('syncStatusLocal') : t('syncStatusConnecting')}
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
              <span className="hidden sm:inline font-medium text-[11px] text-charcoal-300">
                Live Sync
              </span>
            </div>

            {/* Language Toggle Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gold-500/40 bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 font-medium text-xs sm:text-sm transition-all touch-target focus:outline-none focus:ring-2 focus:ring-gold-500"
              aria-label="Switch language between English and Gujarati"
            >
              <Globe className="w-4 h-4 text-gold-400" />
              <span>{t('changeLanguage')}</span>
            </button>
          </div>
        </div>

        {/* Mobile secondary navigation strip */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-charcoal-800/60 text-xs font-medium text-charcoal-300 overflow-x-auto">
          <Link
            to="/"
            className={`px-2.5 py-1.5 rounded-md ${
              isCurrent('/') && location.pathname === '/' ? 'bg-charcoal-800 text-gold-400 font-bold' : ''
            }`}
          >
            {t('navHome')}
          </Link>
          <Link
            to="/join"
            className={`px-2.5 py-1.5 rounded-md ${
              isCurrent('/join') ? 'bg-charcoal-800 text-gold-400 font-bold' : ''
            }`}
          >
            {t('navJoin')}
          </Link>
          <Link
            to="/reception"
            className={`px-2.5 py-1.5 rounded-md ${
              isCurrent('/reception') ? 'bg-charcoal-800 text-gold-400 font-bold' : ''
            }`}
          >
            {t('navReception')}
          </Link>
          <Link
            to="/barber/Ravi"
            className={`px-2.5 py-1.5 rounded-md ${
              isCurrent('/barber') ? 'bg-charcoal-800 text-gold-400 font-bold' : ''
            }`}
          >
            {t('navBarber')}
          </Link>
          <Link
            to="/display"
            className={`px-2.5 py-1.5 rounded-md ${
              isCurrent('/display') ? 'bg-charcoal-800 text-gold-400 font-bold' : ''
            }`}
          >
            {t('navTv')}
          </Link>
          <Link
            to="/admin"
            className={`px-2.5 py-1.5 rounded-md ${
              isCurrent('/admin') ? 'bg-charcoal-800 text-gold-400 font-bold' : ''
            }`}
          >
            {t('navAdmin')}
          </Link>
        </div>
      </div>
    </header>
  );
};
