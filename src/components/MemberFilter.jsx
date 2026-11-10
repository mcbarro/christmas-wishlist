import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Users } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { getMemberColor, getMemberInitial } from '../lib/memberColor';

export default function MemberFilter({
  members,
  selectedId,
  currentMemberId,
  onSelect,
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

  if (!members?.length) return null;

  const ordered = [...members].sort((first, second) => {
    if (first.id === currentMemberId) return -1;
    if (second.id === currentMemberId) return 1;
    return first.displayName.localeCompare(second.displayName);
  });
  const selected =
    selectedId === 'all'
      ? null
      : ordered.find((member) => member.id === selectedId) || null;
  const selectedColor = selected ? getMemberColor(selected.id) : null;

  const choose = (memberId) => {
    onSelect(memberId);
    setOpen(false);
  };

  return (
    <div className="flex min-w-0 items-center gap-2">
      <div ref={rootRef} className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={() => choose('all')}
          aria-pressed={selectedId === 'all'}
          className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition ${
            selectedId === 'all'
              ? 'border-line-strong bg-ink text-page'
              : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
          }`}
        >
          <span
            className={`grid h-5 w-5 place-items-center rounded-full ${
              selectedId === 'all'
                ? 'bg-page/15 text-page'
                : 'bg-surface-strong text-subtle'
            }`}
            aria-hidden="true"
          >
            <Users className="h-3 w-3" />
          </span>
          {t('members.filterAll')}
        </button>

        <div className="relative min-w-0">
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={t('members.filterChoose')}
            className={`inline-flex h-8 max-w-[11rem] items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition ${
              selected
                ? 'border-line-strong bg-surface-strong text-ink'
                : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
            }`}
          >
            {selected ? (
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                style={{
                  backgroundColor: selectedColor.background,
                  color: selectedColor.foreground,
                }}
                aria-hidden="true"
              >
                {getMemberInitial(selected.displayName)}
              </span>
            ) : (
              <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate">
              {selected ? selected.displayName : t('members.filterChoose')}
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
              aria-label={t('members.filterMenu')}
              className="absolute left-0 top-full z-50 mt-2 w-60 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-panel p-1.5 shadow-2xl shadow-black/20"
            >
              <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-subtle">
                {t('members.filterMenu')}
              </p>

              <button
                type="button"
                role="menuitem"
                onClick={() => choose('all')}
                className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${
                  selectedId === 'all'
                    ? 'bg-surface-strong text-ink'
                    : 'text-muted hover:bg-surface-strong hover:text-ink'
                }`}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/10 text-accent">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {t('members.filterAll')}
                </span>
                {selectedId === 'all' ? (
                  <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                ) : null}
              </button>

              <div className="my-1 border-t border-line" />

              <div className="max-h-64 overflow-y-auto">
                {ordered.map((member) => {
                  const color = getMemberColor(member.id);
                  const active = selectedId === member.id;
                  const isCurrent = member.id === currentMemberId;

                  return (
                    <button
                      key={member.id}
                      type="button"
                      role="menuitem"
                      onClick={() => choose(member.id)}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition ${
                        active
                          ? 'bg-surface-strong text-ink'
                          : 'text-muted hover:bg-surface-strong hover:text-ink'
                      }`}
                    >
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: color.background,
                          color: color.foreground,
                        }}
                        aria-hidden="true"
                      >
                        {getMemberInitial(member.displayName)}
                      </span>
                      <span className="min-w-0 flex-1 truncate">
                        {member.displayName}
                        {isCurrent ? ` (${t('members.you')})` : ''}
                      </span>
                      {active ? (
                        <Check className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
