import { Link } from 'react-router-dom';
import { Bell, Download, Gift, Plus, Search, UserRound, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

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
  groupName,
  isAdmin,
  pendingCount,
  onMembers,
  onSession,
  onRefresh,
}) {
  const { t } = useI18n();

  const status =
    connection === 'demo'
      ? {
          label: t('nav.demo'),
          title: t('nav.demoTitle'),
          dot: 'bg-warning',
          className: 'border-warning/20 bg-warning/10 text-warning',
        }
      : connection === 'live'
        ? {
            label: t('nav.live'),
            title: t('nav.liveTitle'),
            dot: 'bg-success',
            className: 'border-success/20 bg-success/10 text-success',
          }
        : connection === 'connecting'
          ? {
              label: t('nav.connecting'),
              title: t('nav.connectingTitle'),
              dot: 'animate-pulse bg-info',
              className: 'border-info/20 bg-info/10 text-info',
            }
          : {
              label: t('nav.offline'),
              title: t('nav.offlineTitle'),
              dot: 'bg-subtle',
              className: 'border-line bg-surface text-muted',
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
    <header className="safe-top sticky top-0 z-30 border-b border-line bg-header backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 pb-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex min-w-0 items-center gap-3 rounded-xl">
            <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-700 shadow-lg shadow-rose-950/40">
              <Gift className="h-5 w-5 text-white" aria-hidden="true" />
              <span
                className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-page"
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg font-semibold leading-tight text-ink sm:text-xl">
                {t('app.title')}
              </span>
              <span className="hidden truncate text-xs text-muted sm:block">
                {groupName || t('app.subtitle')}
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
                className="hidden h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink sm:grid"
                aria-label={t('nav.install')}
                title={t('nav.install')}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}

            {isAdmin && pendingCount > 0 ? (
              <button
                type="button"
                onClick={onMembers}
                className="relative grid h-9 w-9 place-items-center rounded-full border border-warning/20 bg-warning/10 text-warning transition hover:bg-warning/20"
                aria-label={t('members.pendingAria', { count: pendingCount })}
                title={t('members.title')}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 grid min-w-[17px] place-items-center rounded-full bg-warning px-1 text-[10px] font-bold leading-4 text-amber-950">
                  {pendingCount}
                </span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={onSession}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink"
              aria-label={t('session.open')}
              title={t('session.open')}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>

            <LanguageSwitcher />
            <ThemeToggle />

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
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
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
              className="w-full rounded-xl border border-line bg-field py-2.5 pl-9 pr-9 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-subtle transition hover:bg-surface-strong hover:text-ink"
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
                      ? 'border-line-strong bg-ink text-page'
                      : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
                  }`}
                >
                  {entry.label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      selected
                        ? 'bg-page/15 text-page'
                        : 'bg-surface-strong text-subtle'
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
