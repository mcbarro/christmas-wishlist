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
  "group.leaveDevice": "Esci da questo gruppo",
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
    "Uscendo rimuovi questa sessione gruppo dal browser. Gli altri gruppi salvati restano disponibili.",
  "session.leaveDevice": "Esci da questo gruppo",

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

  "inbox.open": "Apri inbox",
  "inbox.openWithCount": "Apri inbox ({count} nuovi)",
  "inbox.title": "Inbox",
  "inbox.description":
    "Richieste dei membri e aggiornamenti sulle tue prenotazioni.",
  "inbox.tabsLabel": "Sezioni inbox",
  "inbox.requests": "Richieste",
  "inbox.notifications": "Notifiche",
  "inbox.empty": "Nessuna notifica",
  "inbox.emptyDescription":
    "Qui appariranno gli aggiornamenti sui desideri eliminati.",
  "inbox.wishDeleted":
    "Il desiderio “{title}” che avevi prenotato è stato eliminato da {name}.",
  "inbox.unread": "Notifica non letta",

  "members.filterLabel": "Filtra per membro",
  "members.filterAll": "Tutti",
  "members.filterBy": "Filtra per {name}",
  "members.you": "tu",

  "card.ideaFor": "Idea regalo per {name}",
  "card.suggestedBy": "Suggerito da {name}",
  "card.suggestedByYou": "Suggerito da te",
  "card.suggestedBySomeone": "Suggerito da un membro",
  "card.suggestionPrivate": "{name} non vede questa idea.",
  "card.delete": "Elimina desiderio",
  "card.deleteAria": "Elimina desiderio — {title}",

  "delete.title": "Eliminare questo desiderio?",
  "delete.description": "Questa azione non può essere annullata.",
  "delete.confirm": "Elimina desiderio",
  "delete.deleting": "Eliminazione...",
  "delete.cancel": "Annulla",
  "delete.ownerWarning":
    "Se qualcuno aveva già deciso di regalarlo, riceverà un avviso.",
  "delete.suggestionWarning":
    "Questa idea per {name} verrà rimossa. Chi l'aveva prenotata riceverà un avviso.",
  "delete.irreversible":
    "Il desiderio, i suoi dettagli e l'eventuale prenotazione verranno rimossi definitivamente.",
  "delete.success": "Desiderio eliminato.",
  "delete.error": "Non siamo riusciti a eliminare il desiderio. Riprova.",

  "add.importAmazon": "Importa da Amazon",
  "add.forWhom": "Per chi è?",
  "add.forMe": "Io",
  "add.suggestionHint":
    "{name} non vedrà questa idea. Gli altri membri la vedranno come un suggerimento da parte tua.",

  "amazon.title": "Importa una wishlist Amazon",
  "amazon.description":
    "Incolla il link di una wishlist Amazon pubblica. Scegli quali elementi aggiungere come tuoi desideri.",
  "amazon.urlLabel": "Link wishlist Amazon",
  "amazon.urlPlaceholder": "https://www.amazon.it/hz/wishlist/ls/...",
  "amazon.urlHint":
    "La lista deve essere pubblica. Viene letta tramite un servizio di lettura esterno.",
  "amazon.analyze": "Leggi la lista",
  "amazon.analyzing": "Lettura...",
  "amazon.analyzingTitle": "Lettura della lista Amazon",
  "amazon.analyzingDescription": "Può richiedere qualche secondo.",
  "amazon.found": "{count} elementi trovati",
  "amazon.selected": "{count} selezionati",
  "amazon.selectAll": "Seleziona tutti",
  "amazon.selectNone": "Deseleziona tutti",
  "amazon.cancel": "Annulla",
  "amazon.importCount": "Importa {count} desideri",
  "amazon.importing": "Importazione...",
  "amazon.noPrice": "Senza prezzo",
  "amazon.alreadyPresent": "Già presente",
  "amazon.viewProduct": "Vedi prodotto",
  "amazon.truncated":
    "La lista è molto lunga. Vengono mostrati solo i primi 100 elementi.",
  "amazon.imported": "{count} desideri importati.",
  "amazon.errors.INVALID_URL":
    "Incolla un link valido di una wishlist Amazon pubblica.",
  "amazon.errors.PRIVATE_LIST":
    "Questa wishlist non è pubblica o richiede l'accesso. Rendila pubblica e riprova.",
  "amazon.errors.NO_ITEMS": "Nessun elemento trovato in questa wishlist.",
  "amazon.errors.NETWORK":
    "Non siamo riusciti a raggiungere il servizio di lettura. Controlla la connessione e riprova.",
  "amazon.errors.UNAVAILABLE":
    "Il servizio di lettura non è disponibile in questo momento. Riprova tra poco.",
  "amazon.errors.IMPORT_LIMIT":
    "Puoi importare al massimo 100 elementi alla volta.",
  "amazon.errors.INVALID_IMPORT": "Non ci sono elementi validi da importare.",
  "amazon.errors.UNKNOWN":
    "Qualcosa è andato storto durante la lettura della lista. Riprova.",
  "amazon.errors.RPC_MISSING":
    "Questa funzione non è ancora disponibile. Riprova dopo l'aggiornamento del database.",
  "amazon.errors.NOT_APPROVED":
    "La tua iscrizione non è più approvata. Riapri il tuo link personale.",

  "budget.button": "Budget",
  "budget.open": "Filtro budget: {range}",
  "budget.title": "Filtro budget",
  "budget.description":
    "Mostra i regali all'interno dell'intervallo di prezzo selezionato.",
  "budget.range": "Intervallo selezionato",
  "budget.min": "Minimo",
  "budget.max": "Massimo",
  "budget.minAria": "Budget minimo",
  "budget.maxAria": "Budget massimo",
  "budget.includeMissing": "Includi i desideri senza prezzo",
  "budget.includeMissingHint":
    "Quando il filtro è attivo, i desideri senza un prezzo leggibile restano nascosti finché questa opzione non è selezionata.",
  "budget.reset": "Azzera",
  "budget.apply": "Applica",

  "group.errors.MEMBER_NOT_FOUND":
    "Questo membro non è più disponibile nel gruppo.",
  "group.errors.NOT_ALLOWED":
    "Solo chi ha inserito questo desiderio può eliminarlo.",
  "group.errors.INVALID_IMPORT": "I dati dell'import non sono validi.",
  "group.errors.IMPORT_LIMIT":
    "Puoi importare al massimo 100 desideri alla volta.",
  "group.errors.RPC_MISSING":
    "Questa funzione non è ancora disponibile. Riprova dopo l'aggiornamento del database.",

  "groups.switchAria": "Cambia gruppo: {group}",
  "groups.fallback": "Gruppo",
  "groups.menuLabel": "Menu gruppi",
  "groups.yourGroups": "I tuoi gruppi",
  "groups.addGroup": "Aggiungi un gruppo",
  "groups.leaveGroup": "Esci da questo gruppo",
  "groups.leaveAll": "Esci da tutti i gruppi",
  "group.backToGroup": "Torna al mio gruppo",

  "theme.switchToChristmas": "Passa al tema natalizio",

  "add.editTitle": "Modifica questo desiderio",
  "add.editDescription":
    "Aggiorna i dettagli. La modifica è subito visibile al gruppo.",
  "add.save": "Salva modifiche",
  "add.saving": "Salvataggio...",
  "add.updateSuccess": "Desiderio aggiornato.",
  "add.searchImage": "Cerca immagine",
  "add.searchImageTitle": "Cerca un'immagine",
  "add.searchImageHint": "Cerca su Wikimedia Commons per questo regalo.",
  "add.searchImagePlaceholder": "Cerca immagine",
  "add.searchingImage": "Ricerca...",
  "add.imageSearchEmpty": "Nessuna immagine trovata. Prova altre parole.",
  "add.imageSearchError":
    "Ricerca immagini non riuscita. Riprova o incolla un URL immagine.",
  "add.useImage": "Usa immagine: {title}",

  "card.hiddenBadge": "Nascosto",
  "card.hide": "Nascondi",
  "card.hideAria": "Nascondi — {title}",
  "card.unhide": "Mostra di nuovo",
  "card.unhideAria": "Mostra di nuovo — {title}",
  "card.edit": "Modifica",
  "card.editAria": "Modifica — {title}",

  "hidden.toggle": "Nascosti",
  "hidden.toggleHint":
    "Mostra o nascondi i desideri che hai nascosto per te.",
  "hide.success": "Desiderio nascosto.",
  "unhide.success": "Desiderio di nuovo visibile.",

  "bookmarklet.title": "Salva questa pagina",
  "bookmarklet.description":
    "Salva la pagina corrente del browser come desiderio in uno dei tuoi gruppi.",
  "bookmarklet.loading": "Preparazione della pagina...",
  "bookmarklet.loadingDescription":
    "Lettura dei dettagli e caricamento dei gruppi.",
  "bookmarklet.page": "Pagina",
  "bookmarklet.group": "Gruppo",
  "bookmarklet.forWhom": "Per chi è?",
  "bookmarklet.titleLabel": "Nome del regalo",
  "bookmarklet.save": "Aggiungi desiderio",
  "bookmarklet.saving": "Aggiunta...",
  "bookmarklet.cancel": "Annulla",
  "bookmarklet.installTitle": "Bookmarklet per desktop",
  "bookmarklet.installHint":
    "Trascina questo pulsante nella barra dei preferiti, oppure copia il codice e crea un preferito manualmente.",
  "bookmarklet.installNote":
    "Apri il preferito su una pagina prodotto per aggiungerla a un gruppo e scegliere il destinatario.",
  "bookmarklet.drag": "Aggiungi alla wishlist",
  "bookmarklet.copy": "Copia bookmarklet",
  "bookmarklet.saved": "Desiderio aggiunto a {group}.",
  "bookmarklet.errors.NO_GROUP":
    "Nessun gruppo salvato disponibile. Unisciti prima a un gruppo.",
  "bookmarklet.errors.SESSION_REVOKED":
    "La sessione per questo gruppo non è più valida.",
  "bookmarklet.errors.NETWORK":
    "Non siamo riusciti a raggiungere il servizio di sincronizzazione. Controlla la connessione.",
  "bookmarklet.errors.TITLE_REQUIRED": "Inserisci un nome per il regalo.",
  "bookmarklet.errors.MEMBER_NOT_FOUND":
    "Il membro selezionato non è più disponibile.",
  "bookmarklet.errors.NOT_APPROVED":
    "La tua iscrizione non è più approvata.",
  "bookmarklet.errors.NOT_ALLOWED":
    "Non puoi aggiungere un desiderio a questo gruppo con l'account selezionato.",
  "bookmarklet.errors.RPC_MISSING":
    "Questa funzione non è ancora disponibile. Riprova dopo l'aggiornamento del database.",
  "bookmarklet.errors.UNKNOWN":
    "Non siamo riusciti a salvare questa pagina. Riprova.",

  "common.close": "Chiudi",
  "common.someone": "qualcuno",
  "common.copied": "Copiato!",
  "common.copyFailed": "Copia non riuscita",
};

export default it;
