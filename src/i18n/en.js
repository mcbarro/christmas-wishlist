const en = {
  "app.title": "Christmas Wishlist",
  "app.subtitle": "The family wishlist, no account needed.",
  "app.description":
    "A family wishlist with no accounts. Add wishes, share product links and reserve gifts.",
  "app.footerMadeFor": "Made for family gift-giving.",
  "app.footerNoAccounts": "No accounts. No email. Just wishes.",

  "nav.add": "Add a wish",
  "nav.searchPlaceholder": "Search wishes, people or notes...",
  "nav.searchLabel": "Search wishes",
  "nav.clearSearch": "Clear search",
  "nav.filterLabel": "Filter wishes",
  "nav.filterAll": "All",
  "nav.filterAvailable": "Available",
  "nav.filterReserved": "Reserved",
  "nav.install": "Install app",
  "nav.live": "Live",
  "nav.demo": "Demo",
  "nav.connecting": "Connecting",
  "nav.offline": "Offline",
  "nav.liveTitle": "Family sync is active.",
  "nav.demoTitle": "This family group is stored only in this browser.",
  "nav.connectingTitle": "Connecting to family sync.",
  "nav.offlineTitle": "Family sync is offline. Tap to refresh.",
  "nav.refresh": "Refresh wishlist",

  "stats.total": "{count} wishes",
  "stats.totalOne": "1 wish",
  "stats.available": "{count} available",
  "stats.availableOne": "1 available",
  "stats.reserved": "{count} reserved",
  "stats.reservedOne": "1 reserved",
  "stats.filtered": "Showing {shown} of {total}",

  "demo.banner":
    "Demo mode: this family group and its wishes are saved only in this browser. Connect Supabase to sync them across devices.",

  "error.load":
    "We couldn't load the wishlist. Check your connection and try again.",
  "error.retry": "Try again",
  "error.boundaryTitle": "Something went wrong",
  "error.boundaryDescription":
    "The wishlist hit an unexpected error. Reload the page to continue.",
  "error.reload": "Reload page",

  "loading.wishes": "Loading wishes...",
  "home.wishesTitle": "Wishes",

  "empty.title": "No wishes yet",
  "empty.description":
    "Add the first gift idea and share it with your family.",
  "empty.cta": "Add the first wish",
  "empty.noResultsTitle": "No matching wishes",
  "empty.noResultsDescription": "Try a different search or filter.",
  "empty.clear": "Clear filters",

  "card.available": "Available",
  "card.reservedBadge": "Reserved",
  "card.reservedBy": "Reserved by {name}",
  "card.reservedByYou": "Reserved by you",
  "card.addedBy": "Added by {name}",
  "card.addedByYou": "Added by you",
  "card.addedAnonymously": "Added anonymously",
  "card.addedOn": "Added {date}",
  "card.reserve": "I'll give this!",
  "card.reserveAria": "I'll give this! — {title}",
  "card.release": "Release",
  "card.releaseAria": "Release the reservation for {title}",
  "card.viewProduct": "View product",
  "card.openAria": "View product — {title}",
  "card.imageAlt": "{title} product image",
  "card.yourWishBadge": "Your wish",
  "card.yourWish": "Your wish",
  "card.privacyHint": "Reservations are hidden here to keep the surprise.",

  "add.title": "Add a wish",
  "add.description": "Paste a product link or fill in the details yourself.",
  "add.urlLabel": "Product link",
  "add.urlPlaceholder": "https://...",
  "add.urlHint":
    "We'll try to fetch the title, image and price automatically.",
  "add.fetch": "Fetch details",
  "add.fetching": "Fetching...",
  "add.fetchSuccess": "Details fetched. Check the fields before saving.",
  "add.fetchError":
    "We couldn't fetch the details. You can fill them in manually.",
  "add.titleLabel": "Gift name",
  "add.titlePlaceholder": "What would you like?",
  "add.priceLabel": "Price (optional)",
  "add.pricePlaceholder": "e.g. € 29.99",
  "add.notesLabel": "Notes (optional)",
  "add.notesPlaceholder": "Size, color, where to find it...",
  "add.imageLabel": "Image URL (optional)",
  "add.imagePlaceholder": "https://...",
  "add.imagePreview": "Image preview",
  "add.imageUnavailable": "This image can't be loaded.",
  "add.removeImage": "Remove image",
  "add.submit": "Add to wishlist",
  "add.submitting": "Adding...",
  "add.cancel": "Cancel",
  "add.errorTitle": "Please add a name for the gift.",
  "add.errorUrl": "Please enter a valid http(s) product link.",
  "add.errorImageUrl": "Please enter a valid http(s) image link.",
  "add.errorGeneric": "We couldn't add this wish. Please try again.",
  "add.success": "Wish added to the list.",

  "reserve.title": "I'll give this!",
  "reserve.description":
    "Let the family know you're buying “{title}” so nobody else does.",
  "reserve.asName": "You are reserving as {name}.",
  "reserve.confirm": "Reserve this gift",
  "reserve.saving": "Reserving...",
  "reserve.cancel": "Cancel",
  "reserve.success": "Reserved! {name} is giving this gift.",
  "reserve.error":
    "We couldn't reserve this gift. It may have just been taken by someone else.",
  "reserve.already": "This gift has already been reserved by {name}.",
  "reserve.ownItem": "This is your own wish, so you cannot reserve it.",

  "release.title": "Release reservation",
  "release.description":
    "This will make “{title}” available again for the family.",
  "release.confirm": "Release reservation",
  "release.releasing": "Releasing...",
  "release.cancel": "Cancel",
  "release.success": "Reservation released.",
  "release.error": "We couldn't release this gift. Please try again.",

  "group.loading": "Loading your family group...",
  "group.createTitle": "Create your family group",
  "group.createDescription":
    "Choose a name for the group and the name your family will see.",
  "group.groupNameLabel": "Group name",
  "group.groupNamePlaceholder": "e.g. Rossi Family Christmas",
  "group.yourNameLabel": "Your name",
  "group.yourNamePlaceholder": "e.g. Marco",
  "group.createSubmit": "Create group",
  "group.creating": "Creating...",
  "group.inviteHint":
    "Already have an invite link? Open it in this browser to request access to the group.",
  "group.joinTitle": "Join the family group",
  "group.joinDescription":
    "You're joining “{group}”. Enter your name to request access.",
  "group.joinSubmit": "Request access",
  "group.joining": "Sending request...",
  "group.joinPendingHint":
    "The group admin will need to approve your request before you can see the wishes.",
  "group.sessionRevoked":
    "Your previous session is no longer valid. Request access again to rejoin the group.",
  "group.startNewGroup": "Start a new group",
  "group.pendingTitle": "Waiting for approval",
  "group.pendingDescription":
    "Your request to join the family group is waiting for the administrator's approval.",
  "group.pendingGroup": "Group",
  "group.pendingMember": "You are",
  "group.copyPersonalLink": "Copy personal link",
  "group.checkAgain": "Check again",
  "group.checking": "Checking...",
  "group.leaveDevice": "Leave this device",
  "group.invalidTitle": "Group not found",
  "group.errorTitle": "We couldn't open the group",
  "group.backToStart": "Back to start",
  "group.retry": "Try again",
  "group.errors.GROUP_NOT_FOUND":
    "This group link is not valid. Ask the admin for a new invite link.",
  "group.errors.GROUP_EXISTS":
    "A group with this link already exists. Please try again.",
  "group.errors.INVALID_SECRET":
    "The group or member link is invalid.",
  "group.errors.INVALID_NAME": "Please complete the required name fields.",
  "group.errors.NOT_APPROVED":
    "Your membership is still pending approval.",
  "group.errors.NOT_ADMIN": "Only a group admin can do this.",
  "group.errors.ITEM_NOT_FOUND": "This wish no longer exists.",
  "group.errors.OWN_ITEM": "You cannot reserve your own wish.",
  "group.errors.ALREADY_RESERVED":
    "Someone has already reserved this wish.",
  "group.errors.NOT_RESERVED": "This reservation is no longer yours.",
  "group.errors.MEMBER_NOT_PENDING":
    "This member request has already been handled.",
  "group.errors.TITLE_REQUIRED": "Enter a name for the gift.",
  "group.errors.SESSION_REVOKED":
    "Your previous session is no longer valid. Request access again.",
  "group.errors.STORAGE_FAILED":
    "This browser could not save the group data.",
  "group.errors.NETWORK":
    "We couldn't reach the family sync service. Check your connection and try again.",
  "group.errors.UNKNOWN": "Something went wrong. Please try again.",

  "members.pendingAria": "Pending member requests: {count}",
  "members.title": "Member requests",
  "members.description": "Approve or reject new family members.",
  "members.empty": "No pending requests",
  "members.emptyDescription":
    "New members will appear here for approval.",
  "members.requested": "Requested {date}",
  "members.approve": "Approve",
  "members.reject": "Reject",
  "members.approved": "Member approved.",
  "members.rejected": "Member request rejected.",

  "session.open": "Open session",
  "session.title": "Your session",
  "session.description":
    "This link is your identity on this device. Keep it private.",
  "session.group": "Group",
  "session.member": "Member",
  "session.roleAdmin":
    "You are the group admin. You can approve new members.",
  "session.roleMember": "You are a member of this family group.",
  "session.personalLink": "Personal link",
  "session.personalLinkHint":
    "Anyone with this link can act as you. Use it to reopen the same session on another device.",
  "session.copyPersonalLink": "Copy personal link",
  "session.groupInviteLink": "Group invite link",
  "session.groupInviteHint":
    "Share this link with a relative. They will join as a pending member until you approve them.",
  "session.copyGroupInvite": "Copy invite link",
  "session.leaveHint":
    "Leaving removes your session from this browser. You can reopen it with your personal link.",
  "session.leaveDevice": "Leave this device",

  "share.loadingTitle": "Reading the shared link...",
  "share.loadingDescription":
    "We're fetching the product details to pre-fill your wish.",
  "share.fetchError":
    "We couldn't fetch the product details. You can fill them in manually.",
  "share.noUrl": "No product link was shared. Add the wish manually.",

  "toast.dismiss": "Dismiss",

  "language.label": "Language",
  "language.en": "English",
  "language.it": "Italiano",
  "language.switchTo": "Switch to {language}",

  "theme.switchToLight": "Switch to light mode",
  "theme.switchToDark": "Switch to dark mode",

  "install.iosHint":
    "To install on iPhone or iPad, tap Share and choose “Add to Home Screen”.",
  "install.unavailable":
    "Use your browser's menu to install this app or add it to your home screen.",

  "notFound.title": "Page not found",
  "notFound.description": "This page doesn't exist or the link is invalid.",
  "notFound.cta": "Back to the wishlist",

  "common.close": "Close",
  "common.someone": "someone",
  "common.copied": "Copied!",
  "common.copyFailed": "Copy failed",
};

export default en;
