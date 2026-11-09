const it = {
  "app.title": "Wishlist di Natale",
  "app.subtitle": "La lista dei desideri di famiglia, senza account.",
  "app.description":
    "La lista dei desideri di famiglia senza account. Aggiungi desideri, condividi link ai prodotti e prenota i regali.",
  "app.footerMadeFor": "Creata per scambiarci regali in famiglia.",
  "app.footerNoAccounts": "Niente account. Niente email. Solo desideri.",

  "nav.add": "Aggiungi un desiderio",
  "nav.searchPlaceholder": "Cerca desideri, persone o note...",
  "nav.searchLabel": "Cerca desideri",
  "nav.clearSearch": "Cancella ricerca",
  "nav.filterLabel": "Filtra i desideri",
  "nav.filterAll": "Tutti",
  "nav.filterAvailable": "Disponibili",
  "nav.filterReserved": "Prenotati",
  "nav.install": "Installa l'app",
  "nav.live": "Live",
  "nav.demo": "Demo",
  "nav.connecting": "Connessione",
  "nav.offline": "Offline",
  "nav.liveTitle": "La sincronizzazione di famiglia è attiva.",
  "nav.demoTitle": "Questo gruppo famiglia è salvato solo in questo browser.",
  "nav.connectingTitle": "Connessione alla sincronizzazione di famiglia.",
  "nav.offlineTitle":
    "La sincronizzazione di famiglia è offline. Tocca per aggiornare.",
  "nav.refresh": "Aggiorna la wishlist",

  "stats.total": "{count} desideri",
  "stats.totalOne": "1 desiderio",
  "stats.available": "{count} disponibili",
  "stats.availableOne": "1 disponibile",
  "stats.reserved": "{count} prenotati",
  "stats.reservedOne": "1 prenotato",
  "stats.filtered": "Visualizzati {shown} di {total}",

  "demo.banner":
    "Modalità demo: questo gruppo famiglia e i suoi desideri sono salvati solo in questo browser. Collega Supabase per sincronizzarli tra dispositivi.",
  "demo.schemaMissing":
    "Supabase è configurato, ma la migrazione del database per i gruppi famiglia non è stata applicata. Questo browser usa la modalità demo locale. Applica la migrazione dei gruppi per abilitare la sincronizzazione.",
  "demo.syncUnavailable":
    "Il servizio di sincronizzazione della famiglia non è disponibile in questo momento. Questo browser usa la modalità demo locale. Controlla la connessione o riprova.",
  "demo.retrySync": "Riprova la sincronizzazione",

  "error.load":
    "Non siamo riusciti a caricare la wishlist. Controlla la connessione e riprova.",
  "error.retry": "Riprova",
  "error.boundaryTitle": "Qualcosa è andato storto",
  "error.boundaryDescription":
    "La wishlist ha incontrato un errore imprevisto. Ricarica la pagina per continuare.",
  "error.reload": "Ricarica la pagina",

  "loading.wishes": "Caricamento dei desideri...",
  "home.wishesTitle": "Desideri",

  "empty.title": "Ancora nessun desiderio",
  "empty.description":
    "Aggiungi la prima idea regalo e condividila con la famiglia.",
  "empty.cta": "Aggiungi il primo desiderio",
  "empty.noResultsTitle": "Nessun desiderio corrispondente",
  "empty.noResultsDescription": "Prova con un'altra ricerca o un altro filtro.",
  "empty.clear": "Cancella i filtri",

  "card.available": "Disponibile",
  "card.reservedBadge": "Prenotato",
  "card.reservedBy": "Prenotato da {name}",
  "card.reservedByYou": "Prenotato da te",
  "card.addedBy": "Aggiunto da {name}",
  "card.addedByYou": "Aggiunto da te",
  "card.addedAnonymously": "Aggiunto in anonimo",
  "card.addedOn": "Aggiunto {date}",
  "card.reserve": "Lo regalo io!",
  "card.reserveAria": "Lo regalo io! — {title}",
  "card.release": "Libera",
  "card.releaseAria": "Libera la prenotazione di {title}",
  "card.viewProduct": "Vedi prodotto",
  "card.openAria": "Vedi prodotto — {title}",
  "card.imageAlt": "Immagine del prodotto {title}",
  "card.yourWishBadge": "Il tuo desiderio",
  "card.yourWish": "Il tuo desiderio",
  "card.privacyHint":
    "Le prenotazioni qui sono nascoste per mantenere la sorpresa.",

  "add.title": "Aggiungi un desiderio",
  "add.description":
    "Incolla il link di un prodotto o compila i dettagli manualmente.",
  "add.urlLabel": "Link del prodotto",
  "add.urlPlaceholder": "https://...",
  "add.urlHint":
    "Proveremo a recuperare automaticamente titolo, immagine e prezzo.",
  "add.fetch": "Recupera dettagli",
  "add.fetching": "Recupero...",
  "add.fetchSuccess": "Dettagli recuperati. Controlla i campi prima di salvare.",
  "add.fetchError":
    "Non siamo riusciti a recuperare i dettagli. Puoi compilarli manualmente.",
  "add.titleLabel": "Nome del regalo",
  "add.titlePlaceholder": "Cosa vorresti?",
  "add.priceLabel": "Prezzo (opzionale)",
  "add.pricePlaceholder": "es. 29,99 €",
  "add.notesLabel": "Note (opzionale)",
  "add.notesPlaceholder": "Taglia, colore, dove trovarlo...",
  "add.imageLabel": "URL immagine (opzionale)",
  "add.imagePlaceholder": "https://...",
  "add.imagePreview": "Anteprima immagine",
  "add.imageUnavailable": "Impossibile caricare questa immagine.",
  "add.removeImage": "Rimuovi immagine",
  "add.submit": "Aggiungi alla wishlist",
  "add.submitting": "Aggiunta in corso...",
  "add.cancel": "Annulla",
  "add.errorTitle": "Aggiungi un nome per il regalo.",
  "add.errorUrl": "Inserisci un link http(s) valido per il prodotto.",
  "add.errorImageUrl": "Inserisci un link http(s) valido per l'immagine.",
  "add.errorGeneric": "Non siamo riusciti ad aggiungere il desiderio. Riprova.",
  "add.success": "Desiderio aggiunto alla lista.",

  "reserve.title": "Lo regalo io!",
  "reserve.description":
    "Fai sapere alla famiglia che stai comprando “{title}” così nessun altro lo farà.",
  "reserve.asName": "Stai prenotando come {name}.",
  "reserve.confirm": "Prenota questo regalo",
  "reserve.saving": "Prenotazione...",
  "reserve.cancel": "Annulla",
  "reserve.success": "Prenotato! {name} regalerà questo regalo.",
  "reserve.error":
    "Non siamo riusciti a prenotare il regalo. Potrebbe essere appena stato prenotato da qualcun altro.",
  "reserve.already": "Questo regalo è già stato prenotato da {name}.",
  "reserve.ownItem":
    "Questo è un tuo desiderio, quindi non puoi prenotarlo.",

  "release.title": "Libera la prenotazione",
  "release.description": "“{title}” tornerà disponibile per la famiglia.",
  "release.confirm": "Libera prenotazione",
  "release.releasing": "Rilascio...",
  "release.cancel": "Annulla",
  "release.success": "Prenotazione liberata.",
  "release.error": "Non siamo riusciti a liberare il regalo. Riprova.",

  "group.loading": "Caricamento del gruppo famiglia...",
  "group.createTitle": "Crea il tuo gruppo famiglia",
  "group.createDescription":
    "Scegli un nome per il gruppo e il nome che vedrà la tua famiglia.",
  "group.groupNameLabel": "Nome del gruppo",
  "group.groupNamePlaceholder": "es. Natale Famiglia Rossi",
  "group.yourNameLabel": "Il tuo nome",
  "group.yourNamePlaceholder": "es. Marco",
  "group.createSubmit": "Crea gruppo",
  "group.creating": "Creazione...",
  "group.inviteHint":
    "Hai già un link invito? Aprilo in questo browser per richiedere l'accesso al gruppo.",
  "group.joinTitle": "Unisciti al gruppo famiglia",
  "group.joinDescription":
    "Stai entrando in “{group}”. Inserisci il tuo nome per richiedere l'accesso.",
  "group.joinSubmit": "Richiedi accesso",
  "group.joining": "Invio richiesta...",
  "group.joinPendingHint":
    "L'amministratore del gruppo dovrà approvare la tua richiesta prima che tu possa vedere i desideri.",
  "group.sessionRevoked":
    "La tua sessione precedente non è più valida. Richiedi di nuovo l'accesso per rientrare nel gruppo.",
  "group.startNewGroup": "Crea un nuovo gruppo",
  "group.pendingTitle": "In attesa di approvazione",
  "group.pendingDescription":
    "La tua richiesta di accesso al gruppo famiglia è in attesa di approvazione da parte dell'amministratore.",
  "group.pendingGroup": "Gruppo",
  "group.pendingMember": "Sei",
  "group.copyPersonalLink": "Copia link personale",
  "group.checkAgain": "Controlla di nuovo",
  "group.checking": "Controllo...",
  "group.leaveDevice": "Esci da questo dispositivo",
  "group.invalidTitle": "Gruppo non trovato",
  "group.errorTitle": "Non siamo riusciti ad aprire il gruppo",
  "group.backToStart": "Torna all'inizio",
  "group.retry": "Riprova",
  "group.errors.GROUP_NOT_FOUND":
    "Questo link del gruppo non è valido. Chiedi all'amministratore un nuovo link invito.",
  "group.errors.GROUP_EXISTS":
    "Esiste già un gruppo con questo link. Riprova.",
  "group.errors.INVALID_SECRET":
    "Il link del gruppo o del membro non è valido.",
  "group.errors.INVALID_NAME": "Completa i campi nome richiesti.",
  "group.errors.NOT_APPROVED":
    "La tua iscrizione è ancora in attesa di approvazione.",
  "group.errors.NOT_ADMIN": "Solo un amministratore del gruppo può farlo.",
  "group.errors.ITEM_NOT_FOUND": "Questo desiderio non esiste più.",
  "group.errors.OWN_ITEM": "Non puoi prenotare un tuo desiderio.",
  "group.errors.ALREADY_RESERVED":
    "Qualcuno ha già prenotato questo desiderio.",
  "group.errors.NOT_RESERVED": "Questa prenotazione non è più tua.",
  "group.errors.MEMBER_NOT_PENDING":
    "Questa richiesta di accesso è già stata gestita.",
  "group.errors.TITLE_REQUIRED": "Inserisci un nome per il regalo.",
  "group.errors.SESSION_REVOKED":
    "La tua sessione precedente non è più valida. Richiedi di nuovo l'accesso.",
  "group.errors.STORAGE_FAILED":
    "Questo browser non è riuscito a salvare i dati del gruppo.",
  "group.errors.NETWORK":
    "Non siamo riusciti a raggiungere il servizio di sincronizzazione. Controlla la connessione e riprova.",
  "group.errors.UNKNOWN": "Qualcosa è andato storto. Riprova.",

  "members.pendingAria": "Richieste di accesso in attesa: {count}",
  "members.title": "Richieste di accesso",
  "members.description": "Approva o rifiuta i nuovi membri della famiglia.",
  "members.empty": "Nessuna richiesta in attesa",
  "members.emptyDescription":
    "I nuovi membri appariranno qui per l'approvazione.",
  "members.requested": "Richiesta {date}",
  "members.approve": "Approva",
  "members.reject": "Rifiuta",
  "members.approved": "Membro approvato.",
  "members.rejected": "Richiesta di accesso rifiutata.",

  "session.open": "Apri sessione",
  "session.title": "La tua sessione",
  "session.description":
    "Questo link è la tua identità su questo dispositivo. Conservalo con cura.",
  "session.group": "Gruppo",
  "session.member": "Membro",
  "session.roleAdmin":
    "Sei l'amministratore del gruppo. Puoi approvare nuovi membri.",
  "session.roleMember": "Sei un membro di questo gruppo famiglia.",
  "session.personalLink": "Link personale",
  "session.personalLinkHint":
    "Chiunque abbia questo link può agire come te. Usalo per riaprire la stessa sessione su un altro dispositivo.",
  "session.copyPersonalLink": "Copia link personale",
  "session.groupInviteLink": "Link invito gruppo",
  "session.groupInviteHint":
    "Condividi questo link con un parente. Entrerà come membro in attesa finché non lo approvi.",
  "session.copyGroupInvite": "Copia link invito",
  "session.leaveHint":
    "Uscendo rimuovi la sessione da questo browser. Puoi riaprirla con il tuo link personale.",
  "session.leaveDevice": "Esci da questo dispositivo",

  "share.loadingTitle": "Lettura del link condiviso...",
  "share.loadingDescription":
    "Stiamo recuperando i dettagli del prodotto per pre-compilare il desiderio.",
  "share.fetchError":
    "Non siamo riusciti a recuperare i dettagli del prodotto. Puoi compilarli manualmente.",
  "share.noUrl": "Nessun link prodotto condiviso. Aggiungi il desiderio manualmente.",

  "toast.dismiss": "Chiudi",

  "language.label": "Lingua",
  "language.en": "English",
  "language.it": "Italiano",
  "language.switchTo": "Passa a {language}",

  "theme.switchToLight": "Passa alla modalità chiara",
  "theme.switchToDark": "Passa alla modalità scura",

  "install.iosHint":
    "Per installare su iPhone o iPad, tocca Condividi e scegli “Aggiungi a Home”.",
  "install.unavailable":
    "Usa il menu del browser per installare l'app o aggiungerla alla schermata Home.",

  "notFound.title": "Pagina non trovata",
  "notFound.description": "Questa pagina non esiste o il link non è valido.",
  "notFound.cta": "Torna alla wishlist",

  "common.close": "Chiudi",
  "common.someone": "qualcuno",
  "common.copied": "Copiato!",
  "common.copyFailed": "Copia non riuscita",
};

export default it;
