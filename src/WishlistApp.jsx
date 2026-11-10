import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import AddWishModal from './components/AddWishModal';
import AmazonImportModal from './components/AmazonImportModal';
import {
  DemoBanner,
  ErrorBanner,
  SyncFallbackBanner,
} from './components/Banners';
import DeleteWishModal from './components/DeleteWishModal';
import InboxModal from './components/InboxModal';
import Navbar from './components/Navbar';
import ReserveModal from './components/ReserveModal';
import SessionModal from './components/SessionModal';
import ShareReceiver from './components/ShareReceiver';
import Toast from './components/Toast';
import { useGroup } from './group/GroupProvider';
import { useGroupWishlist } from './hooks/useGroupWishlist';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { useI18n } from './i18n/I18nProvider';
import { filterWishes, getPriceBounds } from './lib/filters';
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
    capabilities,
  } = useGroup();
  const {
    items,
    pendingMembers,
    members,
    notifications,
    loading,
    error,
    connection,
    reload,
    addItem,
    addItems,
    deleteItem,
    markNotificationsRead,
    reserveItem,
    releaseItem,
    approveMember,
    rejectMember,
  } = useGroupWishlist();
  const { canInstall, install } = useInstallPrompt();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [memberFilter, setMemberFilter] = useState('all');
  const [budget, setBudget] = useState({
    active: false,
    min: 0,
    max: 0,
    includeMissing: false,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [addInitial, setAddInitial] = useState(null);
  const [amazonOpen, setAmazonOpen] = useState(false);
  const [reservation, setReservation] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const budgetBounds = useMemo(() => getPriceBounds(items), [items]);
  const featureSet = useMemo(
    () => new Set(capabilities?.features || []),
    [capabilities]
  );
  const hasFeature = useCallback(
    (name) => featureSet.has(name),
    [featureSet]
  );
  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  useEffect(() => {
    if (
      memberFilter !== 'all' &&
      !members.some((member) => member.id === memberFilter)
    ) {
      setMemberFilter('all');
    }
  }, [members, memberFilter]);

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

  const filteredItems = useMemo(
    () =>
      filterWishes(items, {
        memberId: memberFilter,
        budget,
        status: filter,
        query: search,
      }),
    [items, memberFilter, budget, filter, search]
  );

  const hasFilters =
    filter !== 'all' ||
    Boolean(search.trim()) ||
    memberFilter !== 'all' ||
    Boolean(budget.active);

  const openAdd = useCallback(() => {
    setAddInitial(null);
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    setAddInitial(null);
  }, []);

  const openAmazonImport = useCallback(() => {
    setAddOpen(false);
    setAddInitial(null);
    setAmazonOpen(true);
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
    setMemberFilter('all');
    setBudget({
      active: false,
      min: budgetBounds.min,
      max: budgetBounds.max,
      includeMissing: false,
    });
  }, [budgetBounds]);

  const resetBudget = useCallback(() => {
    setBudget({
      active: false,
      min: budgetBounds.min,
      max: budgetBounds.max,
      includeMissing: false,
    });
  }, [budgetBounds]);

  const handleAmazonImport = useCallback(
    async (amazonItems) => {
      const inserted = await addItems(amazonItems);
      showToast(t('amazon.imported', { count: inserted }), 'success');
    },
    [addItems, showToast, t]
  );

  const handleDeleteRequest = useCallback((item) => {
    setDeleteTarget(item);
  }, []);

  const handleConfirmDelete = useCallback(
    async (item) => {
      await deleteItem(item.id);
      setDeleteTarget(null);
      showToast(t('delete.success'), 'success');
    },
    [deleteItem, showToast, t]
  );

  const handleMarkNotificationsRead = useCallback(async () => {
    await markNotificationsRead();
  }, [markNotificationsRead]);

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
        pendingCount={pendingMembers.length}
        unreadCount={unreadCount}
        members={hasFeature('suggestions') ? members : []}
        memberFilter={memberFilter}
        onMemberFilterChange={setMemberFilter}
        currentMemberId={member?.id}
        budgetBounds={budgetBounds}
        budget={budget}
        onBudgetChange={setBudget}
        onBudgetReset={resetBudget}
        onInbox={() => setInboxOpen(true)}
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
                onDelete={
                  hasFeature('delete_notifications')
                    ? handleDeleteRequest
                    : undefined
                }
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
        members={hasFeature('suggestions') ? members : []}
        currentMemberId={member?.id}
        onAmazonImport={openAmazonImport}
        onClose={closeAdd}
        onSubmit={handleAdd}
      />

      <AmazonImportModal
        open={amazonOpen}
        onClose={() => setAmazonOpen(false)}
        existingItems={items}
        onImport={handleAmazonImport}
      />

      <ReserveModal
        open={Boolean(reservation)}
        item={reservation?.item}
        mode={reservation?.mode || 'reserve'}
        memberName={member?.displayName || ''}
        onClose={closeReservation}
        onConfirm={handleReservation}
      />

      <InboxModal
        open={inboxOpen}
        onClose={() => setInboxOpen(false)}
        pendingMembers={pendingMembers}
        notifications={notifications}
        isAdmin={member?.isAdmin}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkRead={handleMarkNotificationsRead}
      />

      <DeleteWishModal
        open={Boolean(deleteTarget)}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
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
