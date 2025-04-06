const chatContainer = document.getElementById("chat-container");
const chatToggle = document.getElementById("chat-toggle");
const messagesContainer = document.getElementById("messages-container");
const chatInput = document.getElementById("chat-input");
const chatForm = document.getElementById("chat-form");

chatToggle.addEventListener("click", () => {
    chatContainer.classList.toggle("open");
    chatToggle.innerHTML = chatContainer.classList.contains("open") ? "▼" : "▲";
});

const loadMessages = () => {
    const messages = JSON.parse(localStorage.getItem("messages")) || [];
    messagesContainer.innerHTML = messages
        .map(msg => {
            const userClass = msg.user === "Moi" ? "moi" : "autre";
            return `<div class="message ${userClass}"><strong>${msg.user}:</strong> ${msg.text}</div>`;
        })
        .join("");
};

const saveMessage = (message) => {
    let messages = JSON.parse(localStorage.getItem("messages")) || [];
    messages.push(message);
    localStorage.setItem("messages", JSON.stringify(messages));
};
chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text === "") return;

    const message = { user: "Moi", text, timestamp: new Date().toISOString() };
    saveMessage(message);
    chatInput.value = "";

    loadMessages();

    if (navigator.onLine) {
        fetch("", {
            method: "POST",
            body: JSON.stringify(message),
            headers: { "Content-Type": "application/json" }
        }).then(() => {
            console.log("Message envoyé et synchronisé avec l'API");
        }).catch(console.error);
    }
});

loadMessages();

window.addEventListener("online", () => {
    let messages = JSON.parse(localStorage.getItem("messages")) || [];

    messages.forEach(message => {
        fetch("", {
            method: "POST",
            body: JSON.stringify(message),
            headers: { "Content-Type": "application/json" }
        }).then(() => {
            console.log("Message synchronisé !");
        }).catch(console.error);
    });

    localStorage.removeItem("messages");
});

const fetchMessagesFromAPI = () => {
    fetch("")
        .then(response => response.json())
        .then(messages => {
            localStorage.setItem("messages", JSON.stringify(messages));
            loadMessages();
        })
        .catch(console.error);
};

fetchMessagesFromAPI();