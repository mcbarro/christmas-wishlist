import { Link } from 'react-router-dom';
import { Download, Gift, Plus, Search, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({
  search,
  onSearchChange,
  filter,
  onFilterChange,
  counts,
  onAdd,
  onInstall,
  canInstall,
  connection,
  onRefresh,
}) {
  const { t } = useI18n();

  const status =
    connection === 'demo'
      ? {
          label: t('nav.demo'),
          title: t('nav.demoTitle'),
          dot: 'bg-amber-400',
          className: 'border-amber-300/20 bg-amber-500/10 text-amber-200',
        }
      : connection === 'live'
        ? {
            label: t('nav.live'),
            title: t('nav.liveTitle'),
            dot: 'bg-emerald-400',
            className:
              'border-emerald-300/20 bg-emerald-500/10 text-emerald-200',
          }
        : connection === 'connecting'
          ? {
              label: t('nav.connecting'),
              title: t('nav.connectingTitle'),
              dot: 'animate-pulse bg-sky-400',
              className: 'border-sky-300/20 bg-sky-500/10 text-sky-200',
            }
          : {
              label: t('nav.offline'),
              title: t('nav.offlineTitle'),
              dot: 'bg-slate-500',
              className: 'border-white/10 bg-white/5 text-slate-400',
            };

  const filters = [
    { id: 'all', label: t('nav.filterAll'), count: counts.all },
    {
      id: 'available',
      label: t('nav.filterAvailable'),
      count: counts.available,
    },
    { id: 'reserved', label: t('nav.filterReserved'), count: counts.reserved },
  ];

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-white/10 bg-[#080d19]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3 rounded-xl">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 shadow-lg shadow-rose-950/40">
              <Gift className="h-5 w-5 text-white" aria-hidden="true" />
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#080d19]"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold leading-tight text-white sm:text-xl">
                {t('app.title')}
              </span>
              <span className="hidden truncate text-xs text-slate-400 sm:block">
                {t('app.subtitle')}
              </span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition hover:brightness-110 md:inline-flex ${status.className}`}
              title={status.title}
              aria-label={`${status.label}: ${t('nav.refresh')}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                aria-hidden="true"
              />
              {status.label}
            </button>

            {canInstall ? (
              <button
                type="button"
                onClick={onInstall}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label={t('nav.install')}
                title={t('nav.install')}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}

            <LanguageSwitcher />

            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400 active:scale-[0.98] sm:px-4"
              aria-label={t('nav.add')}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t('nav.add')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={t('nav.searchPlaceholder')}
              aria-label={t('nav.searchLabel')}
              autoComplete="off"
              enterKeyHint="search"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-rose-400/60 focus:bg-white/[0.07] focus:ring-2 focus:ring-rose-500/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-white/10 hover:text-white"
                aria-label={t('nav.clearSearch')}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div
            className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5"
            role="group"
            aria-label={t('nav.filterLabel')}
          >
            {filters.map((entry) => {
              const selected = filter === entry.id;
              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => onFilterChange(entry.id)}
                  aria-pressed={selected}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? 'border-white/20 bg-white text-slate-950'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {entry.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      selected
                        ? 'bg-slate-950/10 text-slate-700'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {entry.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
