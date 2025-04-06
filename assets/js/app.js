/**
 * The `app` object contains methods and properties for managing a note-keeping application.
 * It includes functionalities for registering a service worker, checking online status,
 * interacting with local storage, logging operations, handling note creation/update/deletion and initializing the application.
 *
 * @namespace app
 *
 * @property {Function} registerServiceWorker - Registers the service worker if supported by the browser.
 * @property {Function} isOnline - Checks if the browser is currently online.
 * @property {Function} getFromLocalStorage - Retrieves data from local storage by key.
 * @property {Function} setInLocalStorage - Stores data in local storage with a specified key.
 * @property {Function} logOperation - Logs an operation with a success or error status.
 * @property {Function} handleCreateNote - Handles the creation of a new note.
 * @property {Function} handleUpdateNote - Handles the update of an existing note.
 * @property {Function} handleDeleteNote - Handles the deletion of a note.
 * @property {Function} createNoteHandler - Handles the form submission for creating a new note.
 * @property {Function} addNoteToUI - Adds a note to the user interface.
 * @property {Function} attachDOMEvents - Attaches event listeners to the DOM elements.
 * @property {Function} loadNotes - Loads notes from local storage or server and displays them.
 * @property {Function} init - Initializes the application, registers event listeners, and loads notes.
 */
const app = {
  /**
   * Registers the service worker if supported by the browser.
   *
   * This method checks if the `serviceWorker` is available in the `navigator` object.
   * If available, it attempts to register the service worker using the specified file.
   * On successful registration, it logs a confirmation message to the console.
   * If the registration fails, it logs the error stack trace to the console.
   *
   * @returns {void}
   */
  registerServiceWorker() {
    const hasServiceWorker = "serviceWorker" in navigator;
    if (!hasServiceWorker) return;

    navigator.serviceWorker
      .register("service-worker.js")
      .then(() => console.log("Service Worker enregistré."))
      .catch((err) => {
        console.trace("Erreur d'enregistrement du Service Worker:", err);
      });
  },

  /**
   * Checks if the browser is currently online.
   *
   * @returns {boolean} True if the browser is online, otherwise false.
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Retrieves an item from local storage and parses it as JSON.
   *
   * @param {string} key - The key of the item to retrieve from local storage.
   * @returns {Array|Object|null} The parsed JSON object or array from local storage, or null if the item does not exist.
   */
  getFromLocalStorage(key) {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch (error) {
      console.trace(error);
      return null;
    }
  },

  /**
   * Stores a value in the local storage under the specified key.
   *
   * @param {string} key - The key under which the value will be stored.
   * @param {any} value - The value to be stored. It will be serialized to a JSON string.
   */
  setInLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Logs an operation to the log container in the DOM.
   *
   * @param {string} operation - The description of the operation to log.
   * @param {boolean} [isSuccess=true] - Indicates whether the operation was successful. Defaults to true.
   */
  logOperation(operation, isSuccess = true) {
    const container = document.getElementById("logs-container");

    const logHeader = document.createElement("div");
    const logEntry = document.createElement("div");
    const logDate = document.createElement("span");
    const logOperation = document.createElement("p");

    logDate.textContent = new Date().toLocaleString();
    logOperation.textContent = operation;

    logEntry.classList.add("log", isSuccess ? "log--success" : "log--error");

    logHeader.append(logDate);
    logEntry.append(logHeader, logOperation);
    container.appendChild(logEntry);
  },

  /**
   * Handles the creation of a new note.
   *
   * This function attempts to create a new note using the NoteKeeper service if the application is online.
   * If the application is offline, it logs an error.
   *
   * @param {string} noteContent - The content of the note to be created.
   * @returns {Promise<void>} - A promise that resolves when the note creation process is complete.
   */
  async handleCreateNote(noteContent) {
    try {
      const savedNotes = app.getFromLocalStorage("savedNotes");
      let newNote;

      if (!app.isOnline()) {
        newNote = {id: null, content: noteContent}
        
        // throw new Error("Impossible de créer une note hors ligne.");

      } else {
        newNote = await NoteKeeper.createNote(noteContent);

        if (!newNote) {
          throw new Error("Erreur lors de la création de la note.");
        }
      }

      savedNotes.push(newNote);
      app.setInLocalStorage("savedNotes", savedNotes);

      app.addNoteToUI(newNote);
      app.logOperation("Création d'une note");

      return true;
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);

      return false;
    }
  },

  /**
   * Handles the update of a note.
   *
   * This function attempts to update a note using the NoteKeeper service if the application is online.
   * If the update fails or the application is offline, it logs the error.
   *
   * @async
   * @param {Note} note - The note object to be updated.
   * @returns {Promise<void>} - A promise that resolves when the update operation is complete.
   */
  async handleUpdateNote(note) {
    try {
      const savedNotes = app.getFromLocalStorage("savedNotes");
      let notes = savedNotes;

      if (!app.isOnline()) {

        // throw new Error("Impossible de mettre à jour la note hors ligne.");

      } else {
        if (!(await NoteKeeper.updateNote(note))) {
          throw new Error("Erreur lors de la mise à jour de la note.");
        }
      }

      notes = notes.map((savedNote) =>
        savedNote.id === note.id ? note : savedNote
      );

      app.setInLocalStorage("savedNotes", notes);
      app.logOperation("Mise à jour d'une note");
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);
    }
  },

  /**
   * Handles the deletion of a note.
   *
   * This function attempts to delete a note by its ID. If the application is offline, it logs an error.
   *
   * @param {number} noteId - The ID of the note to be deleted.
   * @param {HTMLElement} noteElement - The DOM element representing the note to be deleted.
   * @returns {Promise<void>} - A promise that resolves when the note has been deleted.
   */
  async handleDeleteNote(noteId, noteElement) {
    try {
      const notesContainer = document.getElementById("notes-container");
      const savedNotes = app.getFromLocalStorage("savedNotes");
      let notes = savedNotes;

      const isNew = notes.find((n) => n.id === noteId)?.isNew;

      if (!isNew) {
        if (!app.isOnline()) {

          //throw new Error("Impossible de supprimer la note hors ligne.");

        } else {
          if (!(await NoteKeeper.deleteNote(noteId))) {
            throw new Error("Erreur lors de la suppression de la note.");
          }
        }
      }

      notes = savedNotes.filter((n) => n.id !== noteId);
      app.setInLocalStorage("savedNotes", notes);

      if (notesContainer && noteElement) {
        notesContainer.removeChild(noteElement);
      }

      app.logOperation("Suppression d'une note");
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);
    }
  },

  /**
   * Handles the form submission for creating a new note.
   *
   * @param {SubmitEvent} event
   * @returns {Promise<void>}
   */
  async createNoteHandler(event) {
    event.preventDefault();
    const noteContent = document
      .getElementById("note-creator-content")
      .value.trim();
    if (!noteContent) return;

    if (await app.handleCreateNote(noteContent)) {
      document.getElementById("note-creator-content").value = "";
    }
  },

  /**
   * Adds a note to the UI.
   *
   * @param {Note} note - The note object to be added.
   * @param {string} note.id - The unique identifier of the note.
   * @param {string} note.content - The content of the note.
   */
  addNoteToUI(note) {
    const notesContainer = document.getElementById("notes-container");
    const noteElement = document.createElement("form");
    const noteContent = document.createElement("textarea");
    const updateButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    noteElement.className = "item";
    noteElement.id = "a"+note.id;
    deleteButton.textContent = "Supprimer";
    updateButton.textContent = "Modifier";
    deleteButton.type = "button";
    updateButton.type = "submit";
    noteContent.value = note.content;

    deleteButton.addEventListener(
      "click",
      app.handleDeleteNote.bind(null, note.id, noteElement)
    );

    noteElement.addEventListener("submit", (event) => {
      event.preventDefault();
      const updatedNoteContent = noteContent.value.trim();
      if (!updatedNoteContent) return;

      app.handleUpdateNote({
        id: note.id,
        content: updatedNoteContent,
      });
    });

    noteElement.append(deleteButton, updateButton, noteContent);
    notesContainer.appendChild(noteElement);
  },

  /**
   * Asynchronously loads notes from either the local storage or a remote source.
   *
   * If the application is online, it attempts to fetch all notes from the remote source
   * and updates the local storage with the fetched notes. If an error occurs during this process,
   * it logs the error and stops further execution.
   *
   * If the application is offline or an error occurs, it falls back to loading notes from the local storage.
   *
   * Finally, it adds each note to the UI and logs the operation.
   *
   * @async
   * @function loadNotes
   * @returns {Promise<void>} A promise that resolves when the notes have been loaded and processed.
   */
  async loadNotes() {
    const savedNotes = app.getFromLocalStorage("savedNotes");
    let notes = [];

    if (app.isOnline()) {
      try {
        notes = await NoteKeeper.getAllNotes();
        if(savedNotes && notes != savedNotes && savedNotes.length >= 1) {
          savedNotes.forEach(async (savedNote)=> { 
            if(!savedNote.id){
              await app.handleCreateNote(savedNote.content)
              savedNote = null;
            }
          })
          notes.forEach((note) => {
            let exist = false;
            savedNotes.forEach(async (savedNote)=>{
              if (savedNote.id == note.id){
                exist = true;
              }
            })
            !exist ? app.handleDeleteNote(note.id, document.querySelector(`#a${note.id}`)) : null;
          });
          notes = await NoteKeeper.getAllNotes();
        }
        notes = await NoteKeeper.getAllNotes();
        app.setInLocalStorage("savedNotes", notes);
      } catch (error) {
        console.trace("Erreur lors du chargement des notes :", error);
        app.logOperation("Erreur lors du chargement des notes", false);
        return;
      }
    } 
    notes = notes?.length ? notes : savedNotes;
    const notesContainer = document.getElementById("notes-container");
    notesContainer.innerHTML = "";
    notes.forEach(app.addNoteToUI);
    app.logOperation("Chargement des notes");
  },

  /**
   * Attaches event listeners to the DOM elements.
   *
   * - Adds a submit event listener to the note creation form.
   * - Adds a submit event listener to the chat form.
   * - Adds a click event listener to the chat toggle button.
   */

  async addMessageToUI(message) {
    const myIdentifiant = await NoteKeeper.getIdentifier();

    const dateTime = new Date(message.timestamp)
    const messagesContainer = document.getElementById("messages-container");
    const messageElement = document.createElement("message");
    const messageContent = document.createElement("p");
    const messageTimeStamp = document.createElement("p");

    if(myIdentifiant == message.identifier){
      messageElement.className = "mine item"
    } else {
      messageElement.className = "item";
    }
    messageContent.innerText = message.content;
    messageTimeStamp.className = "message-timestamp"
    messageTimeStamp.innerText = dateTime.toLocaleString();

    messageElement.append(messageContent, messageTimeStamp);
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  },

  screenChange(screen){
    const body = document.querySelector(".body")
    if(screen == "Notes"){
      body.innerHTML = 
        `
        <section>
          <h2>Créer une nouvelle note</h2>

          <form id="note-creator">
            <textarea
              id="note-creator-content"
              placeholder="Contenu de la note"
            ></textarea>
            <button type="submit">Créer cette note</button>
          </form>
        </section>

        <div class="wrapper">
          <section>
            <h2>Liste des notes existantes</h2>

            <div id="notes-container" class="item-list"></div>
          </section>

          <section>
            <h2>Opérations effectuées</h2>

            <div id="logs-container" class="item-list"></div>
          </section>
        </div>
        `
      app.loadNotes();
      app.attachDOMEvents()
      localStorage.setItem("screen", "Notes")
    }
    else 
    {
      body.innerHTML = 
        `
        <div class="wrapper">
          <section>
            <h2>Liste des messages</h2>

            <div id="messages-container" class="item-list"></div>

            <form id="message-creator">
              <textarea
                id="message-creator-content"
                placeholder="Contenu du message"
              ></textarea>
              <button type="submit">Envoyer</button>
            </form>
          </section>

          <section>
            <h2>Opérations effectuées</h2>

            <div id="logs-container" class="item-list"></div>
          </section>
        </div>
        `
      app.loadMessages();
      app.attachDOMEvents()
      localStorage.setItem("screen", "Messagerie")
    }
  },

  async loadMessages() {
    const savedMessages = app.getFromLocalStorage("savedMessages");
    let messages = [];

    if (app.isOnline()) {
      try {
        messages = await NoteKeeper.getMessages();
        if(savedMessages && messages != messages && savedMessages.length >= 1) {
          savedMessages.forEach(async (savedMessage)=> { 
            if(!savedMessage.id){
              await app.handleCreateNote(savedMessage.content)
              savedMessage = null;
            }
          })
        }
        messages = await NoteKeeper.getMessages();
      } catch (error) {
        console.trace("Erreur lors du chargement des messages :", error);
        app.logOperation("Erreur lors du chargement des messages", false);
        return;
      }
    } 
    messages = messages?.length ? messages : null;
    const messagesContainer = document.getElementById("messages-container");
    messagesContainer.innerHTML = "";
    messages.forEach(app.addMessageToUI);
    app.logOperation("Chargement des messages");
  },

  async handleCreateMessage(messageContent) {
    try {
      let newMessage;
      const date = new Date();

      if (!app.isOnline()) {
        newMessage = {identifier: NoteKeeper.getIdentifier(), content: messageContent, timestamp: date.getTime()}
        
        // throw new Error("Impossible de créer une note hors ligne.");

      } else {
        newMessage = {identifier: NoteKeeper.getIdentifier(), content: messageContent, timestamp: date.getTime()}
        await NoteKeeper.sendMessage(newMessage.content);

        if (!newMessage) {
          throw new Error("Erreur lors de la création de la note.");
        }
      }

      app.logOperation("Envoi d'un message");

      return true;
    } catch (error) {
      console.trace(error);
      app.logOperation(error.message, false);

      return false;
    }
  },

  async createMessageHandler(event) {
    event.preventDefault();
    const messageContent = document
      .getElementById("message-creator-content")
      .value.trim();
    if (!messageContent) return;

    if (await app.handleCreateMessage(messageContent)) {
      document.getElementById("message-creator-content").value = "";
    }
  },

  attachDOMEvents() {
    if(document.getElementById("note-creator")){
      document
        .getElementById("note-creator")
        .addEventListener("submit", app.createNoteHandler); 
    }

    if(document.getElementById("message-creator")){
      document
        .getElementById("message-creator")
        .addEventListener("submit", app.createMessageHandler);
    }

    window.addEventListener("online", () => {
      app.logOperation("En ligne");
    });

    window.addEventListener("offline", () => {
      app.logOperation("Hors ligne");
    });
  },

  /**
   * Initializes the application by setting up event listeners and loading initial data.
   *
   * - Logs the initialization operation.
   * - Registers the service worker.
   * - Loads existing notes.
   * - Sets up a submit event listener for the note creation form.
   * - Adds event listeners for online and offline status changes to handle synchronization and logging.
   */
  init() {
    app.logOperation("Initialisation de l'application.");
    app.registerServiceWorker();
    if(localStorage.getItem("screen")){
      app.screenChange(localStorage.getItem("screen"))
    } 
    else 
    {
      app.screenChange("Notes")
    }
    NoteKeeper.onMessage((message)=>app.addMessageToUI(message));
    app.attachDOMEvents();
  },
};

document.addEventListener("DOMContentLoaded", app.init);