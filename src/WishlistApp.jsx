import { useCallback, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import AddWishModal from './components/AddWishModal';
import AmazonImportModal from './components/AmazonImportModal';
import {
  DemoBanner,
  ErrorBanner,
  SyncFallbackBanner,
} from './components/Banners';
import BookmarkletModal from './components/BookmarkletModal';
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
import { filterWishes, getPriceBounds, sortWishes } from './lib/filters';
import {
  addItem as addItemInStore,
  buildSessionLink,
} from './lib/groupStore';
import HomePage from './pages/HomePage';
import NotFoundPage from './pages/NotFoundPage';

const VIEW_STORAGE_KEY = 'christmas-wishlist:view:v1';
const HIDE_OWN_STORAGE_KEY = 'christmas-wishlist:hide-own:v1';
const MOBILE_VIEW_QUERY = '(max-width: 639px)';

function isMobileViewport() {
  if (typeof window === 'undefined') return false;
  if (typeof window.matchMedia === 'function') {
    return window.matchMedia(MOBILE_VIEW_QUERY).matches;
  }
  return window.innerWidth < 640;
}

function readInitialViewMode() {
  if (typeof window === 'undefined') return 'grid';

  try {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === 'list' || stored === 'grid') return stored;
  } catch {
    // Fall back to the viewport default when storage is unavailable.
  }

  return isMobileViewport() ? 'list' : 'grid';
}

function readInitialHideOwn() {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(HIDE_OWN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

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
    baseHref,
    session,
    sessions,
    switchGroup,
    startAddGroup,
    leaveGroup,
    leaveAllGroups,
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
    updateItem,
    setItemRating,
    deleteItem,
    hideItem,
    unhideItem,
    markNotificationsRead,
    reserveItem,
    releaseItem,
    approveMember,
    rejectMember,
    createPreapprovedMember,
    removeMember,
    reissueInvite,
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
  const [editTarget, setEditTarget] = useState(null);
  const [showHidden, setShowHidden] = useState(false);
  const [viewMode, setViewMode] = useState(readInitialViewMode);
  const [hideOwn, setHideOwnState] = useState(readInitialHideOwn);
  const [amazonOpen, setAmazonOpen] = useState(false);
  const [bookmarkletData, setBookmarkletData] = useState(null);
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
  const hiddenCount = items.filter((item) => item.hidden_by_me).length;
  const canHide =
    memberFilter !== 'all' && memberFilter !== member?.id;

  const addModalInitial = useMemo(() => {
    if (!editTarget) return addInitial;
    return {
      title: editTarget.title || '',
      url: editTarget.url || '',
      image_url: editTarget.image_url || '',
      notes: editTarget.notes || '',
      price: editTarget.price || '',
      owner_member_id: editTarget.owner_member_id || '',
      rating:
        typeof editTarget.rating === 'number' ? editTarget.rating : 2.5,
    };
  }, [editTarget, addInitial]);

  useEffect(() => {
    if (
      memberFilter !== 'all' &&
      !members.some((member) => member.id === memberFilter)
    ) {
      setMemberFilter('all');
    }
  }, [members, memberFilter]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('bookmarklet') !== '1') return;

    setBookmarkletData({
      url: params.get('url') || '',
      title: params.get('title') || '',
    });

    params.delete('bookmarklet');
    params.delete('url');
    params.delete('title');
    const nextUrl = new URL(window.location.href);
    nextUrl.search = params.toString();
    window.history.replaceState(null, '', nextUrl);
  }, []);

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
      sortWishes(
        filterWishes(items, {
          memberId: memberFilter,
          budget,
          status: filter,
          query: search,
          showHidden,
          hideOwn,
          ownMemberId: member?.id,
        })
      ),
    [items, memberFilter, budget, filter, search, showHidden, hideOwn, member?.id]
  );

  const handleViewModeChange = useCallback((mode) => {
    const next = mode === 'list' ? 'list' : 'grid';
    setViewMode(next);

    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, []);

  const setHideOwn = useCallback((next) => {
    setHideOwnState(next);

    try {
      window.localStorage.setItem(HIDE_OWN_STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Keep the in-memory preference when storage is unavailable.
    }
  }, []);

  const toggleHideOwn = useCallback(() => {
    setHideOwn(!hideOwn);
  }, [hideOwn, setHideOwn]);

  const hasFilters =
    filter !== 'all' ||
    Boolean(search.trim()) ||
    memberFilter !== 'all' ||
    Boolean(budget.active) ||
    hideOwn;

  const openAdd = useCallback(() => {
    setAddInitial(null);
    setEditTarget(null);
    setAddOpen(true);
  }, []);

  const closeAdd = useCallback(() => {
    setAddOpen(false);
    setAddInitial(null);
    setEditTarget(null);
  }, []);

  const openEdit = useCallback((item) => {
    setAddInitial(null);
    setEditTarget(item);
    setAddOpen(true);
  }, []);

  const openAmazonImport = useCallback(() => {
    setAddOpen(false);
    setAddInitial(null);
    setEditTarget(null);
    setAmazonOpen(true);
  }, []);

  const handleAdd = useCallback(
    async (payload) => {
      if (editTarget) {
        await updateItem(editTarget.id, payload);
        showToast(t('add.updateSuccess'), 'success');
      } else {
        await addItem(payload);
        showToast(t('add.success'), 'success');
      }
    },
    [addItem, updateItem, editTarget, showToast, t]
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
      setEditTarget(null);
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

  const handleRate = useCallback(
    async (item, rating) => {
      try {
        await setItemRating(item.id, rating);
      } catch (error) {
        console.error('Could not save the wish rating:', error);
        showToast(t('rating.error'), 'error');
      }
    },
    [setItemRating, showToast, t]
  );

  const closeReservation = useCallback(() => setReservation(null), []);
  const clearFilters = useCallback(() => {
    setSearch('');
    setFilter('all');
    setMemberFilter('all');
    setShowHidden(false);
    setHideOwn(false);
    setBudget({
      active: false,
      min: budgetBounds.min,
      max: budgetBounds.max,
      includeMissing: false,
    });
  }, [budgetBounds, setHideOwn]);

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

  const handleBookmarkletSave = useCallback(
    async ({ group, session: targetSession, item }) => {
      await addItemInStore({
        group,
        session: targetSession,
        ...item,
      });

      const isCurrent =
        targetSession.groupSecret === session?.groupSecret &&
        targetSession.userSecret === session?.userSecret;
      if (isCurrent) await reload();

      showToast(
        t('bookmarklet.saved', { group: group.name }),
        'success'
      );
    },
    [session, reload, showToast, t]
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

  const handleHide = useCallback(
    async (item) => {
      await hideItem(item.id);
      showToast(t('hide.success'), 'success');
    },
    [hideItem, showToast, t]
  );

  const handleUnhide = useCallback(
    async (item) => {
      await unhideItem(item.id);
      showToast(t('unhide.success'), 'success');
    },
    [unhideItem, showToast, t]
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

  const handleCreateInvite = useCallback(
    async (displayName) => {
      const result = await createPreapprovedMember(displayName);
      const link = buildSessionLink({
        href: baseHref,
        groupSecret: group?.groupSecret || '',
        inviteToken: result.inviteToken,
      });

      showToast(
        t('members.inviteCreated', { name: result.displayName }),
        'success'
      );
      return { name: result.displayName, link };
    },
    [createPreapprovedMember, baseHref, group, showToast, t]
  );

  const handleRemoveMember = useCallback(
    async (member) => {
      try {
        await removeMember(member.id);
        showToast(
          t('members.removed', { name: member.displayName }),
          'success'
        );
      } catch (error) {
        console.error('Could not remove the member:', error);
        showToast(
          t(`group.errors.${error.code || 'UNKNOWN'}`),
          'error'
        );
        throw error;
      }
    },
    [removeMember, showToast, t]
  );

  const handleReissueInvite = useCallback(
    async (member) => {
      const result = await reissueInvite(member.id);
      const link = buildSessionLink({
        href: baseHref,
        groupSecret: group?.groupSecret || '',
        inviteToken: result.inviteToken,
      });
      return { name: result.displayName, link };
    },
    [reissueInvite, baseHref, group]
  );

  const handleLeaveDevice = useCallback(() => {
    setSessionOpen(false);
    leaveDevice();
  }, [leaveDevice]);

  return (
    <div className="relative z-10 flex min-h-dvh flex-col">
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
        group={group}
        sessions={sessions}
        session={session}
        onSwitchGroup={switchGroup}
        onAddGroup={startAddGroup}
        onLeaveGroup={leaveGroup}
        onLeaveAll={leaveAllGroups}
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
        showHidden={showHidden}
        hiddenCount={hiddenCount}
        hideFeature={hasFeature('hide_items')}
        onToggleHidden={() => setShowHidden((current) => !current)}
        hideOwn={hideOwn}
        onToggleHideOwn={toggleHideOwn}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
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
                viewMode={viewMode}
                onRetry={handleRetry}
                onAdd={openAdd}
                onClearFilters={clearFilters}
                onReserve={handleReserve}
                onRelease={handleRelease}
                onRate={handleRate}
                showRating={hasFeature('item_ratings')}
                onDelete={
                  hasFeature('delete_notifications')
                    ? handleDeleteRequest
                    : undefined
                }
                onEdit={
                  hasFeature('edit_items') ? openEdit : undefined
                }
                onHide={
                  hasFeature('hide_items') ? handleHide : undefined
                }
                onUnhide={
                  hasFeature('hide_items') ? handleUnhide : undefined
                }
                canHide={canHide}
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
        initial={addModalInitial}
        members={hasFeature('suggestions') ? members : []}
        currentMemberId={member?.id}
        editing={Boolean(editTarget)}
        showRating={hasFeature('item_ratings')}
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

      <BookmarkletModal
        open={Boolean(bookmarkletData)}
        pageUrl={bookmarkletData?.url || ''}
        pageTitle={bookmarkletData?.title || ''}
        sessions={sessions}
        currentSession={session}
        onClose={() => setBookmarkletData(null)}
        onSave={handleBookmarkletSave}
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
        members={members}
        currentMemberId={member?.id}
        notifications={notifications}
        isAdmin={member?.isAdmin}
        onApprove={handleApprove}
        onReject={handleReject}
        onMarkRead={handleMarkNotificationsRead}
        onCreateInvite={
          hasFeature('one_time_invites')
            ? handleCreateInvite
            : undefined
        }
        onRemoveMember={
          hasFeature('member_removal') && member?.isAdmin
            ? handleRemoveMember
            : undefined
        }
        onReissueInvite={
          hasFeature('member_reinvite') && member?.isAdmin
            ? handleReissueInvite
            : undefined
        }
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
        baseHref={baseHref}
        onLeaveDevice={handleLeaveDevice}
        canInstall={canInstall}
        onInstall={handleInstall}
      />

      <Toast toast={toast} onDismiss={dismissToast} />
    </div>
  );
}
