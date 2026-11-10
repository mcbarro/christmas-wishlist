import { Users } from 'lucide-react';
import { useI18n } from '../i18n/I18nProvider';
import { getMemberColor, getMemberInitial } from '../lib/memberColor';

export default function MemberFilter({
  members,
  selectedId,
  currentMemberId,
  onSelect,
}) {
  const { t } = useI18n();

  if (!members?.length) return null;

  const ordered = [...members].sort((first, second) => {
    if (first.id === currentMemberId) return -1;
    if (second.id === currentMemberId) return 1;
    return first.displayName.localeCompare(second.displayName);
  });

  return (
    <div
      className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-0.5"
      role="group"
      aria-label={t('members.filterLabel')}
    >
      <button
        type="button"
        onClick={() => onSelect('all')}
        aria-pressed={selectedId === 'all'}
        className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
          selectedId === 'all'
            ? 'border-line-strong bg-ink text-page'
            : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
        }`}
      >
        <span
          className={`grid h-6 w-6 place-items-center rounded-full ${
            selectedId === 'all'
              ? 'bg-page/15 text-page'
              : 'bg-surface-strong text-subtle'
          }`}
          aria-hidden="true"
        >
          <Users className="h-3.5 w-3.5" />
        </span>
        {t('members.filterAll')}
      </button>

      {ordered.map((member) => {
        const color = getMemberColor(member.id);
        const active = selectedId === member.id;
        const isCurrent = member.id === currentMemberId;

        return (
          <button
            key={member.id}
            type="button"
            onClick={() => onSelect(active ? 'all' : member.id)}
            aria-pressed={active}
            aria-label={t('members.filterBy', { name: member.displayName })}
            title={member.displayName}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-xs font-semibold transition ${
              active
                ? 'border-line-strong bg-surface-strong text-ink ring-2 ring-accent/30'
                : 'border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink'
            }`}
          >
            <span
              className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: color.background,
                color: color.foreground,
              }}
              aria-hidden="true"
            >
              {getMemberInitial(member.displayName)}
            </span>
            <span className="max-w-[9rem] truncate">
              {member.displayName}
              {isCurrent ? ` (${t('members.you')})` : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
