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
  "demo.schemaMissing":
    "Supabase is configured, but the family-group database migration has not been applied. This browser is using local demo mode. Apply the group migration to enable family sync.",
  "demo.syncUnavailable":
    "The family sync service is unavailable right now. This browser is using local demo mode. Check your connection or retry.",
  "demo.retrySync": "Retry family sync",

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
  "rating.label": "Wish rating",
  "rating.value": "{value} out of 5",
  "rating.hint": "Click or use the arrow keys. Each step is 0.5.",
  "rating.error": "We couldn't save your rating. Please try again.",

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
  "group.inviteTitle": "You're invited",
  "group.inviteDescription":
    "You've been invited to join “{group}”. Confirm below to enter.",
  "group.inviteJoin": "Join the group",
  "group.inviteJoining": "Joining...",
  "group.inviteSingleUseHint":
    "This link works only once. After you join it can no longer be used, and this browser keeps your access.",
  "group.startNewGroup": "Start a new group",
  "group.pendingTitle": "Waiting for approval",
  "group.pendingDescription":
    "Your request to join the family group is waiting for the administrator's approval.",
  "group.pendingGroup": "Group",
  "group.pendingMember": "You are",
  "group.copyPersonalLink": "Copy personal link",
  "group.checkAgain": "Check again",
  "group.checking": "Checking...",
  "group.leaveDevice": "Leave this group",
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
  "group.errors.INVALID_RATING":
    "Choose a rating between 1 and 5 in steps of 0.5.",
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
  "group.errors.INVITE_NOT_FOUND":
    "This invite link has already been used or is no longer valid. Ask the admin for a new one.",
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
  "members.inviteTitle": "Invite a member",
  "members.inviteDescription":
    "Enter their name and generate a one-time link. They join immediately the first time they open it, without waiting for approval.",
  "members.inviteNameLabel": "Member name",
  "members.inviteNamePlaceholder": "e.g. Sofia",
  "members.inviteCreate": "Generate link",
  "members.inviteCreating": "Generating...",
  "members.inviteLinkTitle": "One-time invite link for {name}",
  "members.inviteLinkHint":
    "Send this link privately. It works once: after they join, it can no longer be used.",
  "members.inviteCreated": "One-time invite for {name} created.",
  "members.inviteCopy": "Copy link",

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
    "Leaving removes this group session from this browser. Other saved groups stay available.",
  "session.leaveDevice": "Leave this group",

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

  "inbox.open": "Open inbox",
  "inbox.openWithCount": "Open inbox ({count} new)",
  "inbox.title": "Inbox",
  "inbox.description": "Member requests and updates about your reservations.",
  "inbox.tabsLabel": "Inbox sections",
  "inbox.requests": "Requests",
  "inbox.notifications": "Notifications",
  "inbox.empty": "No notifications",
  "inbox.emptyDescription":
    "Updates about deleted wishes will appear here.",
  "inbox.wishDeleted":
    "The wish “{title}” you had reserved was deleted by {name}.",
  "inbox.unread": "Unread notification",

  "members.filterLabel": "Filter by member",
  "members.filterAll": "Everyone",
  "members.filterBy": "Filter by {name}",
  "members.you": "you",

  "card.ideaFor": "Gift idea for {name}",
  "card.suggestedBy": "Suggested by {name}",
  "card.suggestedByYou": "Suggested by you",
  "card.suggestedBySomeone": "Suggested by a member",
  "card.suggestionPrivate": "{name} cannot see this idea.",
  "card.delete": "Delete wish",
  "card.deleteAria": "Delete wish — {title}",

  "delete.title": "Delete this wish?",
  "delete.description": "This action cannot be undone.",
  "delete.confirm": "Delete wish",
  "delete.deleting": "Deleting...",
  "delete.cancel": "Cancel",
  "delete.ownerWarning":
    "If someone had already offered to buy it, they will receive a notification.",
  "delete.suggestionWarning":
    "This idea for {name} will be removed. Anyone who reserved it will be notified.",
  "delete.irreversible":
    "The wish, its details and any reservation will be permanently removed.",
  "delete.success": "Wish deleted.",
  "delete.error": "We couldn't delete this wish. Please try again.",

  "add.importAmazon": "Import from Amazon",
  "add.forWhom": "Who is it for?",
  "add.forMe": "Me",
  "add.suggestionHint":
    "{name} won't see this idea. Other members will see it as a suggestion from you.",

  "amazon.title": "Import an Amazon wishlist",
  "amazon.description":
    "Paste a public Amazon wishlist link. Choose which items to add as your wishes.",
  "amazon.urlLabel": "Amazon wishlist link",
  "amazon.urlPlaceholder": "https://www.amazon.it/hz/wishlist/ls/...",
  "amazon.urlHint":
    "The list must be public. It is read through a third-party reader service.",
  "amazon.analyze": "Read the list",
  "amazon.analyzing": "Reading...",
  "amazon.analyzingTitle": "Reading your Amazon list",
  "amazon.analyzingDescription": "This can take a few seconds.",
  "amazon.found": "{count} items found",
  "amazon.selected": "{count} selected",
  "amazon.selectAll": "Select all",
  "amazon.selectNone": "Clear selection",
  "amazon.cancel": "Cancel",
  "amazon.importCount": "Import {count} wishes",
  "amazon.importing": "Importing...",
  "amazon.noPrice": "No price",
  "amazon.alreadyPresent": "Already present",
  "amazon.viewProduct": "View product",
  "amazon.truncated":
    "This list is very long. Only the first 100 items are shown.",
  "amazon.imported": "{count} wishes imported.",
  "amazon.errors.INVALID_URL":
    "Paste a valid public Amazon wishlist link.",
  "amazon.errors.PRIVATE_LIST":
    "This wishlist is not public or requires a login. Make it public and try again.",
  "amazon.errors.NO_ITEMS": "No items were found in this wishlist.",
  "amazon.errors.NETWORK":
    "We couldn't reach the reader service. Check your connection and try again.",
  "amazon.errors.UNAVAILABLE":
    "The reader service is unavailable right now. Try again in a moment.",
  "amazon.errors.IMPORT_LIMIT": "You can import at most 100 items at a time.",
  "amazon.errors.INVALID_IMPORT": "There are no valid items to import.",
  "amazon.errors.UNKNOWN":
    "Something went wrong while reading the list. Please try again.",
  "amazon.errors.RPC_MISSING":
    "This feature is not available yet. Try again after the database update.",
  "amazon.errors.NOT_APPROVED":
    "Your membership is no longer approved. Reopen your personal link.",

  "budget.button": "Budget",
  "budget.open": "Budget filter: {range}",
  "budget.title": "Budget filter",
  "budget.description": "Show gifts within the selected price range.",
  "budget.range": "Selected range",
  "budget.min": "Minimum",
  "budget.max": "Maximum",
  "budget.minAria": "Minimum budget",
  "budget.maxAria": "Maximum budget",
  "budget.includeMissing": "Include wishes without a price",
  "budget.includeMissingHint":
    "When the filter is active, wishes without a parsable price are hidden unless this option is on.",
  "budget.reset": "Reset",
  "budget.apply": "Apply",

  "group.errors.MEMBER_NOT_FOUND":
    "This member is no longer available in the group.",
  "group.errors.NOT_ALLOWED":
    "Only the person who added this wish can delete it.",
  "group.errors.INVALID_IMPORT": "The import data is not valid.",
  "group.errors.IMPORT_LIMIT": "You can import at most 100 wishes at a time.",
  "group.errors.RPC_MISSING":
    "This feature is not available yet. Try again after the database update.",

  "groups.switchAria": "Switch group: {group}",
  "groups.fallback": "Group",
  "groups.menuLabel": "Group menu",
  "groups.yourGroups": "Your groups",
  "groups.addGroup": "Add a group",
  "groups.leaveGroup": "Leave this group",
  "groups.leaveAll": "Leave all groups",
  "group.backToGroup": "Back to my group",

  "theme.switchToChristmas": "Switch to Christmas theme",

  "add.editTitle": "Edit this wish",
  "add.editDescription":
    "Update the details. The change is visible to the group immediately.",
  "add.save": "Save changes",
  "add.saving": "Saving...",
  "add.updateSuccess": "Wish updated.",
  "add.searchImage": "Search image",
  "add.searchImageTitle": "Search an image",
  "add.searchImageHint": "Search Wikimedia Commons for this gift.",
  "add.searchImagePlaceholder": "Image search",
  "add.searchingImage": "Searching...",
  "add.imageSearchEmpty": "No images found. Try different words.",
  "add.imageSearchError":
    "Image search failed. Try again or paste an image URL.",
  "add.useImage": "Use image: {title}",

  "card.hiddenBadge": "Hidden",
  "card.hide": "Hide",
  "card.hideAria": "Hide — {title}",
  "card.unhide": "Show again",
  "card.unhideAria": "Show again — {title}",
  "card.edit": "Edit",
  "card.editAria": "Edit — {title}",

  "hidden.toggle": "Hidden",
  "hidden.toggleHint":
    "Show or hide the wishes you have hidden for yourself.",
  "hide.success": "Wish hidden.",
  "unhide.success": "Wish visible again.",

  "view.label": "Wish layout",
  "view.grid": "Grid view",
  "view.list": "List view",

  "bookmarklet.title": "Save this page",
  "bookmarklet.description":
    "Save the current browser page as a wish in one of your groups.",
  "bookmarklet.loading": "Preparing the page...",
  "bookmarklet.loadingDescription":
    "Reading the page details and loading your groups.",
  "bookmarklet.page": "Page",
  "bookmarklet.group": "Group",
  "bookmarklet.forWhom": "Who is it for?",
  "bookmarklet.titleLabel": "Gift name",
  "bookmarklet.save": "Add wish",
  "bookmarklet.saving": "Adding...",
  "bookmarklet.cancel": "Cancel",
  "bookmarklet.installTitle": "Desktop bookmarklet",
  "bookmarklet.installHint":
    "Drag this button to your bookmarks bar, or copy the code and create a bookmark manually.",
  "bookmarklet.installNote":
    "Open the bookmark on any product page to add it to a group and choose the recipient.",
  "bookmarklet.drag": "Add to wishlist",
  "bookmarklet.copy": "Copy bookmarklet",
  "bookmarklet.saved": "Wish added to {group}.",
  "bookmarklet.errors.NO_GROUP":
    "No saved group is available. Join a group first.",
  "bookmarklet.errors.SESSION_REVOKED":
    "Your session for this group is no longer valid.",
  "bookmarklet.errors.NETWORK":
    "We couldn't reach the family sync service. Check your connection.",
  "bookmarklet.errors.TITLE_REQUIRED": "Enter a name for the gift.",
  "bookmarklet.errors.MEMBER_NOT_FOUND":
    "The selected member is no longer available.",
  "bookmarklet.errors.NOT_APPROVED":
    "Your membership is no longer approved.",
  "bookmarklet.errors.NOT_ALLOWED":
    "You cannot add a wish to this group with the selected account.",
  "bookmarklet.errors.RPC_MISSING":
    "This feature is not available yet. Try again after the database update.",
  "bookmarklet.errors.UNKNOWN":
    "We couldn't save this page. Please try again.",

  "common.close": "Close",
  "common.someone": "someone",
  "common.copied": "Copied!",
  "common.copyFailed": "Copy failed",
};

export default en;
