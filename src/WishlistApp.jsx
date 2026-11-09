import { useCallback, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import AddWishModal from './components/AddWishModal';
import {
  DemoBanner,
  ErrorBanner,
  SyncFallbackBanner,
} from './components/Banners';
import MembersModal from './components/MembersModal';
import Navbar from './components/Navbar';
import ReserveModal from './components/ReserveModal';
import SessionModal from './components/SessionModal';
import ShareReceiver from './components/ShareReceiver';
import Toast from './components/Toast';
import { useGroup } from './group/GroupProvider';
import { useGroupWishlist } from './hooks/useGroupWishlist';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useI18n } from './i18n/I18nProvider';
import { normalizeSearch } from './lib/text';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

export default function WishlistApp() {
  const { t } = useI18n();
  const {
    group,
    member,
    personalLink,
    groupInviteLink,
    leaveDevice,
    dataMode,
    fallbackReason,
  } = useGroup();
  const {
    items,
    pendingMembers,
    loading,
    error,
    connection,
    reload,
    addItem,
    reserveItem,
    releaseItem,
    approveMember,
    rejectMember,
  } = useGroupWishlist();
  const { canInstall, install } = useInstallPrompt();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [addOpen, setAddOpen] = useState(false);
  const [addInitial, setAddInitial] = useState(null);
  const [reservation, setReservation] = useState(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ id: `${Date.now()}-${Math.random()}`, message, type });
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  const allCounts = useMemo(() => {
    const reserved = items.filter((item) => item.reservation).length;
    return {
      all: items.length,
      available: items.length - reserved,
      reserved,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    const query = normalizeSearch(search);

    return items.filter((item) => {
      if (filter === 'available' && item.reservation) return false;
      if (filter === 'reserved' && !item.reservation) return false;
      if (!query) return true;

      return [
        item.title,
        item.notes,
        item.added_by,
        item.price,
        item.reservation?.reserved_by_name,
      ].some((value) => normalizeSearch(value).includes(query));
    });
  }, [items, filter, search]);

  const hasFilters = filter !== 'all' || Boolean(search.trim());

  const openAdd = useCallback(() => {
    setAddInitial(null);
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    setAddInitial(null);
  }, []);

  const handleAdd = useCallback(
    async (payload) => {
      await addItem(payload);
      showToast(t('add.success'), 'success');
    },
    [addItem, showToast, t]
  );

  const handleReservation = useCallback(
    async ({ item, mode: reservationMode }) => {
      if (reservationMode === 'release') {
        await releaseItem(item.id);
        showToast(t('release.success'), 'success');
      } else {
        await reserveItem(item.id);
        showToast(
          t('reserve.success', { name: member?.displayName || '' }),
          'success'
        );
      }
    },
    [releaseItem, reserveItem, showToast, t, member]
  );

  const handleShared = useCallback(
    (payload, info) => {
      setAddInitial(payload);
      setAddOpen(true);

      if (!info.hadUrl) {
        showToast(t('share.noUrl'), 'info');
      } else if (!info.fetched) {
        showToast(t('share.fetchError'), 'info');
      }
    },
    [showToast, t]
  );

  const handleInstall = useCallback(async () => {
    const result = await install();
    if (result === 'ios') showToast(t('install.iosHint'), 'info');
    else if (result === 'unavailable') {
      showToast(t('install.unavailable'), 'info');
    }
  }, [install, showToast, t]);

  const handleRetry = useCallback(() => {
    void reload();
  }, [reload]);

  const handleReserve = useCallback((item) => {
    setReservation({ item, mode: 'reserve' });
  }, []);

  const handleRelease = useCallback((item) => {
    setReservation({ item, mode: 'release' });
  }, []);

  const closeReservation = useCallback(() => setReservation(null), []);
  const clearFilters = useCallback(() => {
    setSearch('');
    setFilter('all');
  }, []);

  const handleApprove = useCallback(
    async (memberId) => {
      await approveMember(memberId);
      showToast(t('members.approved'), 'success');
    },
    [approveMember, showToast, t]
  );

  const handleReject = useCallback(
    async (memberId) => {
      await rejectMember(memberId);
      showToast(t('members.rejected'), 'success');
    },
    [rejectMember, showToast, t]
  );

  const handleLeaveDevice = useCallback(() => {
    setSessionOpen(false);
    leaveDevice();
  }, [leaveDevice]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Navbar
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
        counts={allCounts}
        onAdd={openAdd}
        onInstall={handleInstall}
        canInstall={canInstall}
        connection={connection}
        groupName={group?.name}
        isAdmin={member?.isAdmin}
        pendingCount={pendingMembers.length}
        onMembers={() => setMembersOpen(true)}
        onSession={() => setSessionOpen(true)}
        onRefresh={handleRetry}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-4 pt-5 sm:px-6 lg:px-8">
        {dataMode === 'demo' && fallbackReason ? (
          <SyncFallbackBanner reason={fallbackReason} />
        ) : null}
        {dataMode === 'demo' && !fallbackReason ? <DemoBanner /> : null}
        {error && items.length > 0 ? (
          <ErrorBanner onRetry={handleRetry} />
        ) : null}

        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                items={filteredItems}
                allCounts={allCounts}
                loading={loading}
                error={error}
                hasFilters={hasFilters}
                onRetry={handleRetry}
                onAdd={openAdd}
                onClearFilters={clearFilters}
                onReserve={handleReserve}
                onRelease={handleRelease}
              />
            }
          />
          <Route path="/share" element={<ShareReceiver onShared={handleShared} />} />
          <Route
            path="/add-item"
            element={<ShareReceiver onShared={handleShared} />}
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="mx-auto mt-auto w-full max-w-7xl px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 text-center text-xs text-subtle sm:px-6 lg:px-8">
        <p>
          {t('app.footerMadeFor')}{' '}
          <span className="text-accent" aria-hidden="true">
            ♥
          </span>{' '}
          {t('app.footerNoAccounts')}
        </p>
      </footer>

      <AddWishModal
        open={addOpen}
        initial={addInitial}
        onClose={closeAdd}
        onSubmit={handleAdd}
      />

      <ReserveModal
        open={Boolean(reservation)}
        item={reservation?.item}
        mode={reservation?.mode || 'reserve'}
        memberName={member?.displayName || ''}
        onClose={closeReservation}
        onConfirm={handleReservation}
      />

      <MembersModal
        open={membersOpen}
        onClose={() => setMembersOpen(false)}
        members={pendingMembers}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      <SessionModal
        open={sessionOpen}
        onClose={() => setSessionOpen(false)}
        group={group}
        member={member}
        personalLink={personalLink}
        groupInviteLink={groupInviteLink}
        onLeaveDevice={handleLeaveDevice}
        canInstall={canInstall}
        onInstall={handleInstall}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
