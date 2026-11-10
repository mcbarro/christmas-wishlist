import { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  LogOut,
  Plus,
  Users,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';

export default function GroupSwitcher({
  group,
  sessions,
  currentSession,
  onSwitch,
  onAddGroup,
  onLeaveGroup,
  onLeaveAll,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const ordered = [...(sessions || [])].sort(
    (first, second) =>
      (second.lastUsedAt || 0) - (first.lastUsedAt || 0)
  );

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('groups.switchAria', {
          group: group?.name || t('groups.fallback'),
        })}
        className="inline-flex h-9 max-w-[8rem] items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 text-xs font-semibold text-ink transition hover:bg-surface-strong sm:max-w-[16rem]"
      >
        <Users className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
        <span className="truncate">
          {group?.name || t('groups.fallback')}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-subtle transition ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={t('groups.menuLabel')}
          className="absolute left-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/20"
        >
          <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-subtle">
            {t('groups.yourGroups')}
          </p>

          <div className="max-h-64 overflow-y-auto">
            {ordered.map((entry) => {
              const isCurrent =
                entry.groupSecret === currentSession?.groupSecret &&
                entry.userSecret === currentSession?.userSecret;

              return (
                <button
                  key={`${entry.groupSecret}:${entry.userSecret}`}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    if (!isCurrent) void onSwitch(entry);
                  }}
                  className={`flex w-full items-start gap-2 rounded-xl px-2.5 py-2 text-left transition ${
                    isCurrent
                      ? 'bg-surface-strong text-ink'
                      : 'text-muted hover:bg-surface-strong hover:text-ink'
                  }`}
                >
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                    {isCurrent ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Users className="h-3 w-3" aria-hidden="true" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {entry.groupName || t('groups.fallback')}
                    </span>
                    {entry.displayName ? (
                      <span className="block truncate text-xs text-subtle">
                        {entry.displayName}
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="my-1 border-t border-line" />

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onAddGroup();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-ink transition hover:bg-surface-strong"
          >
            <Plus className="h-4 w-4 text-accent" aria-hidden="true" />
            {t('groups.addGroup')}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void onLeaveGroup();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-danger transition hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('groups.leaveGroup')}
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLeaveAll();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm font-semibold text-danger transition hover:bg-danger/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t('groups.leaveAll')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
