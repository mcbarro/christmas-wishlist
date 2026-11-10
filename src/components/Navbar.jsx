import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Download,
  Eye,
  EyeOff,
  Gift,
  LayoutGrid,
  List,
  Plus,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import BudgetFilter from './BudgetFilter';
import GroupSwitcher from './GroupSwitcher';
import MemberFilter from './MemberFilter';
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
  group,
  sessions,
  session,
  onSwitchGroup,
  onAddGroup,
  onLeaveGroup,
  onLeaveAll,
  pendingCount,
  unreadCount,
  members,
  memberFilter,
  onMemberFilterChange,
  currentMemberId,
  budgetBounds,
  budget,
  onBudgetChange,
  onBudgetReset,
  showHidden,
  hiddenCount,
  hideFeature,
  onToggleHidden,
  viewMode,
  onViewModeChange,
  onInbox,
  onSession,
  onRefresh,
}) {
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(Boolean(search));
  const searchRef = useRef(null);
  const inboxCount = (pendingCount || 0) + (unreadCount || 0);
  const showSearch = searchOpen || Boolean(search);

  useEffect(() => {
    if (!searchOpen) return;
    searchRef.current?.focus();
  }, [searchOpen]);

  const groupSwitcher = (
    <GroupSwitcher
      group={group}
      sessions={sessions}
      currentSession={session}
      onSwitch={onSwitchGroup}
      onAddGroup={onAddGroup}
      onLeaveGroup={onLeaveGroup}
      onLeaveAll={onLeaveAll}
    />
  );

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
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Link
              to="/"
              className="flex min-w-0 shrink items-center gap-3 rounded-xl"
            >
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
                {t('app.subtitle')}
              </span>
            </span>
          </Link>

          <div className="hidden min-w-0 lg:block">{groupSwitcher}</div>
        </div>

        <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide transition hover:brightness-110 xl:inline-flex ${status.className}`}
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
                className="hidden h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink lg:grid"
                aria-label={t('nav.install')}
                title={t('nav.install')}
              >
                <Download className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onInbox}
              className={`relative h-9 w-9 place-items-center rounded-full border transition ${
                inboxCount > 0 ? 'grid' : 'hidden sm:grid'
              } ${
                inboxCount > 0
                  ? 'border-warning/20 bg-warning/10 text-warning hover:bg-warning/20'
                  : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
              }`}
              aria-label={
                inboxCount > 0
                  ? t('inbox.openWithCount', { count: inboxCount })
                  : t('inbox.open')
              }
              title={t('inbox.title')}
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {inboxCount > 0 ? (
                <span className="absolute -right-1 -top-1 grid min-w-[17px] place-items-center rounded-full bg-warning px-1 text-[10px] font-bold leading-4 text-amber-950">
                  {inboxCount > 9 ? '9+' : inboxCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={onSession}
              className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink"
              aria-label={t('session.open')}
              title={t('session.open')}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
            </button>

            <ThemeToggle />
            <button
              type="button"
              onClick={onAdd}
              className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-red-500 px-3 text-sm font-semibold text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-red-400 active:scale-[0.98] sm:px-4"
              aria-label={t('nav.add')}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">{t('nav.add')}</span>
            </button>
          </div>
        </div>

        <div className="lg:hidden">{groupSwitcher}</div>

        <div className="flex flex-wrap items-center gap-2">
          {showSearch ? (
            <div className="relative min-w-[13rem] flex-1 sm:max-w-md">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onSearchChange('');
                    setSearchOpen(false);
                  }
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.value) setSearchOpen(false);
                }}
                placeholder={t('nav.searchPlaceholder')}
                aria-label={t('nav.searchLabel')}
                autoComplete="off"
                enterKeyHint="search"
                className="w-full rounded-xl border border-line bg-field py-2 pl-9 pr-9 text-sm text-ink placeholder:text-subtle outline-none transition focus:border-accent/60 focus:bg-panel focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  setSearchOpen(false);
                }}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-subtle transition hover:bg-surface-strong hover:text-ink"
                aria-label={t('nav.clearSearch')}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-muted transition hover:bg-surface-strong hover:text-ink"
              aria-label={t('nav.searchLabel')}
              title={t('nav.searchLabel')}
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
          )}

          <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 sm:flex-none">
            <div className="relative shrink-0">
              <select
                value={filter}
                onChange={(event) => onFilterChange(event.target.value)}
                aria-label={t('nav.filterLabel')}
                className="appearance-none rounded-full border border-line bg-surface py-1.5 pl-3 pr-8 text-xs font-semibold text-ink outline-none transition hover:bg-surface-strong focus:border-accent/60 focus:ring-2 focus:ring-accent/20"
              >
                {filters.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.label} ({entry.count})
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-subtle"
                aria-hidden="true"
              />
            </div>

            <BudgetFilter
              bounds={budgetBounds}
              value={budget}
              onChange={onBudgetChange}
              onReset={onBudgetReset}
            />

            {hideFeature ? (
              <button
                type="button"
                onClick={onToggleHidden}
                aria-pressed={showHidden}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  showHidden
                    ? 'border-warning/30 bg-warning/10 text-warning'
                    : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
                }`}
                title={t('hidden.toggleHint')}
              >
                {showHidden ? (
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                {t('hidden.toggle')}
                {hiddenCount > 0 ? (
                  <span className="rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                    {hiddenCount}
                  </span>
                ) : null}
              </button>
            ) : null}

            <div
              className="flex shrink-0 items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
              role="group"
              aria-label={t('view.label')}
            >
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                aria-pressed={viewMode !== 'list'}
                className={`grid h-7 w-7 place-items-center rounded-full transition ${
                  viewMode !== 'list'
                    ? 'bg-ink text-page'
                    : 'text-muted hover:bg-surface-strong hover:text-ink'
                }`}
                aria-label={t('view.grid')}
                title={t('view.grid')}
              >
                <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                aria-pressed={viewMode === 'list'}
                className={`grid h-7 w-7 place-items-center rounded-full transition ${
                  viewMode === 'list'
                    ? 'bg-ink text-page'
                    : 'text-muted hover:bg-surface-strong hover:text-ink'
                }`}
                aria-label={t('view.list')}
                title={t('view.list')}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>

        {members?.length > 1 ? (
          <MemberFilter
            members={members}
            selectedId={memberFilter}
            currentMemberId={currentMemberId}
            onSelect={onMemberFilterChange}
          />
        ) : null}
      </div>
    </header>
  );
}
