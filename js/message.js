// =====================================================
// CAMPUSMARKET
// CONVERSATION DETAIL
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const conversationHeader =
    document.getElementById("conversationHeader");

const messagesList =
    document.getElementById("messagesList");

const messageError =
    document.getElementById("messageError");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const urlParameters =
    new URLSearchParams(window.location.search);

const conversationId =
    urlParameters.get("id");

let currentUser = null;

let currentConversation = null;

let unsubscribeMessages = null;

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }

        currentUser =
            user;

        if (!conversationId) {

            showError(
                "No conversation was selected."
            );

            setFormEnabled(false);

            return;

        }

        await loadConversation();

    }
);

async function loadConversation() {

    try {

        const conversationReference =
            doc(
                db,
                "conversations",
                conversationId
            );

        const conversationSnapshot =
            await getDoc(conversationReference);

        if (!conversationSnapshot.exists()) {

            showError(
                "This conversation could not be found."
            );

            setFormEnabled(false);

            return;

        }

        const conversation =
            conversationSnapshot.data();

        if (
            !Array.isArray(conversation.participants) ||
            !conversation.participants.includes(currentUser.uid)
        ) {

            showError(
                "You do not have access to this conversation."
            );

            setFormEnabled(false);

            return;

        }

        currentConversation = {

            id:
                conversationSnapshot.id,

            ...conversation

        };

        renderConversationHeader();

        listenForMessages();

        setFormEnabled(true);

    }

    catch (error) {

        console.error(
            "LOAD CONVERSATION ERROR:",
            error
        );

        showError(
            "Unable to load this conversation: " +
            error.message
        );

        setFormEnabled(false);

    }

}

function renderConversationHeader() {

    const isBuyer =
        currentConversation.buyerId ===
        currentUser.uid;

    const otherName =
        isBuyer
            ? currentConversation.sellerName
            : currentConversation.buyerName;

    const otherSchool =
        isBuyer
            ? currentConversation.sellerSchool
            : currentConversation.buyerSchool;

    const image =
        currentConversation.listingImage ||
        "https://placehold.co/120x120/e9e7ff/635bff?text=Item";

    conversationHeader.innerHTML = `

        <div class="card-body p-3 p-md-4">

            <div class="d-flex align-items-center gap-3">

                <a
                    href="item-detail.html?id=${encodeURIComponent(
                        currentConversation.listingId || ""
                    )}"
                    class="d-block"
                >

                    <img
                        src="${escapeHTML(image)}"
                        alt="${escapeHTML(
                            currentConversation.listingName ||
                            "Item"
                        )}"
                        class="rounded-3"
                        style="
                            width:76px;
                            height:76px;
                            object-fit:cover;
                        "
                        onerror="
                            this.src='https://placehold.co/120x120/e9e7ff/635bff?text=Item'
                        "
                    >

                </a>

                <div class="flex-grow-1">

                    <div class="small text-secondary">

                        Conversation with
                        ${escapeHTML(otherName || "User")}

                    </div>

                    <h2
                        class="h4 fw-bold mb-1"
                        style="font-family:'Space Grotesk',sans-serif;"
                    >

                        ${escapeHTML(
                            currentConversation.listingName ||
                            "Item"
                        )}

                    </h2>

                    <div class="small text-secondary">

                        ${escapeHTML(otherSchool || "")}

                    </div>

                </div>

            </div>

        </div>

    `;

}

function listenForMessages() {

    if (unsubscribeMessages) {

        unsubscribeMessages();

    }

    const messagesReference =
        collection(
            db,
            "conversations",
            conversationId,
            "messages"
        );

    const messagesQuery =
        query(
            messagesReference,
            orderBy("createdAt", "asc")
        );

    unsubscribeMessages =
        onSnapshot(
            messagesQuery,
            (snapshot) => {

                const messages = [];

                snapshot.forEach(
                    (messageDocument) => {

                        messages.push({

                            id:
                                messageDocument.id,

                            ...messageDocument.data()

                        });

                    }
                );

                renderMessages(messages);

            },
            (error) => {

                console.error(
                    "MESSAGES SNAPSHOT ERROR:",
                    error
                );

                showError(
                    "Unable to load messages: " +
                    error.message
                );

            }
        );

}

function renderMessages(messages) {

    messagesList.innerHTML =
        "";

    if (messages.length === 0) {

        messagesList.innerHTML = `

            <div
                class="h-100 d-flex align-items-center justify-content-center text-center text-secondary"
            >

                <div>

                    <i class="bi bi-chat-dots fs-2"></i>

                    <div class="mt-2">

                        Send the first message about this item.

                    </div>

                </div>

            </div>

        `;

        return;

    }

    messages.forEach(
        (message) => {

            createMessageBubble(message);

        }
    );

    messagesList.scrollTop =
        messagesList.scrollHeight;

}

function createMessageBubble(message) {

    const isMine =
        message.senderId ===
        currentUser.uid;

    const row =
        document.createElement("div");

    row.className =
        "d-flex mb-3 " +
        (
            isMine
                ? "justify-content-end"
                : "justify-content-start"
        );

    const sentAt =
        formatMessageTime(
            message.createdAt
        );

    row.innerHTML = `

        <div
            class="${
                isMine
                    ? "text-white"
                    : "text-dark bg-light border"
            } rounded-4 px-3 py-2"
            style="
                max-width:min(75%, 560px);
                background-color:${isMine ? "#635bff" : ""};
                overflow-wrap:anywhere;
            "
        >

            <div>

                ${escapeHTML(message.text || "")}

            </div>

            <div
                class="small mt-1 ${
                    isMine
                        ? "text-white-50"
                        : "text-secondary"
                }"
            >

                ${escapeHTML(sentAt)}

            </div>

        </div>

    `;

    messagesList.appendChild(row);

}

messageForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        hideError();

        if (
            !currentConversation ||
            !currentUser
        ) {

            showError(
                "This conversation is not ready yet."
            );

            return;

        }

        const text =
            messageInput.value.trim();

        if (!text) {

            return;

        }

        const submitButton =
            messageForm.querySelector(
                "button[type='submit']"
            );

        submitButton.disabled =
            true;

        messageInput.disabled =
            true;

        try {

            const messagesReference =
                collection(
                    db,
                    "conversations",
                    conversationId,
                    "messages"
                );

            await addDoc(
                messagesReference,
                {

                    text:
                        text,

                    senderId:
                        currentUser.uid,

                    senderName:
                        getCurrentUserName(),

                    createdAt:
                        serverTimestamp()

                }
            );

            await updateDoc(
                doc(
                    db,
                    "conversations",
                    conversationId
                ),
                {

                    lastMessage:
                        text,

                    lastMessageAt:
                        serverTimestamp(),

                    lastSenderId:
                        currentUser.uid

                }
            );

            messageInput.value =
                "";

            messageInput.focus();

        }

        catch (error) {

            console.error(
                "SEND MESSAGE ERROR:",
                error
            );

            showError(
                "Unable to send your message: " +
                error.message
            );

        }

        finally {

            submitButton.disabled =
                false;

            messageInput.disabled =
                false;

        }

    }
);

function getCurrentUserName() {

    if (
        currentConversation.buyerId ===
        currentUser.uid
    ) {

        return currentConversation.buyerName ||
            currentUser.email ||
            "Buyer";

    }

    if (
        currentConversation.sellerId ===
        currentUser.uid
    ) {

        return currentConversation.sellerName ||
            currentUser.email ||
            "Seller";

    }

    return currentUser.email ||
        "User";

}

function setFormEnabled(enabled) {

    messageInput.disabled =
        !enabled;

    const submitButton =
        messageForm.querySelector(
            "button[type='submit']"
        );

    submitButton.disabled =
        !enabled;

}

function showError(message) {

    messageError.textContent =
        message;

    messageError.classList.remove(
        "d-none"
    );

}

function hideError() {

    messageError.textContent =
        "";

    messageError.classList.add(
        "d-none"
    );

}

function formatMessageTime(timestamp) {

    if (!timestamp) {

        return "Sending...";

    }

    let date = null;

    if (typeof timestamp.toDate === "function") {

        date =
            timestamp.toDate();

    }

    else if (timestamp instanceof Date) {

        date =
            timestamp;

    }

    if (!date) {

        return "";

    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month:
                "short",

            day:
                "numeric",

            hour:
                "numeric",

            minute:
                "2-digit"
        }
    ).format(date);

}

function escapeHTML(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}
