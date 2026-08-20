// =====================================================
// CAMPUSMARKET
// MESSAGE PAGE
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// HTML ELEMENTS
// =====================================================

const conversationHeader =
    document.getElementById("conversationHeader");

const messagesList =
    document.getElementById("messagesList");

const messageForm =
    document.getElementById("messageForm");

const messageInput =
    document.getElementById("messageInput");

const messageError =
    document.getElementById("messageError");


// =====================================================
// GET CONVERSATION ID
// =====================================================

const urlParameters =
    new URLSearchParams(window.location.search);

const conversationId =
    urlParameters.get("id");


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;

let conversation = null;


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;
        }

        currentUser = user;

        if (!conversationId) {

            showError(
                "Conversation not found."
            );

            return;
        }

        await loadConversation();

        if (conversation) {

            listenForMessages();

        }

    }
);


// =====================================================
// LOAD CONVERSATION
// =====================================================

async function loadConversation() {

    try {

        const conversationReference =
            doc(
                db,
                "conversations",
                conversationId
            );

        const conversationSnapshot =
            await getDoc(
                conversationReference
            );

        if (!conversationSnapshot.exists()) {

            showError(
                "This conversation does not exist."
            );

            return;
        }

        conversation = {

            id:
                conversationSnapshot.id,

            ...conversationSnapshot.data()

        };


        // =============================================
        // SECURITY CHECK
        // =============================================

        if (
            !conversation.participants ||
            !conversation.participants.includes(
                currentUser.uid
            )
        ) {

            showError(
                "You do not have access to this conversation."
            );

            conversation = null;

            return;
        }


        renderConversationHeader();

    }

    catch (error) {

        console.error(
            "LOAD CONVERSATION ERROR:",
            error
        );

        showError(
            error.message
        );

    }

}


// =====================================================
// CONVERSATION HEADER
// =====================================================

function renderConversationHeader() {

    const isBuyer =
        conversation.buyerId ===
        currentUser.uid;


    const otherName =
        isBuyer
            ? conversation.sellerName
            : conversation.buyerName;


    const otherSchool =
        isBuyer
            ? conversation.sellerSchool
            : conversation.buyerSchool;


    let image =
        "https://placehold.co/120x120/e9e7ff/635bff?text=Item";


    if (
        conversation.listingImage
    ) {

        image =
            conversation.listingImage;

    }


    conversationHeader.innerHTML = `

        <div
            class="d-flex align-items-center gap-3"
        >

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                    conversation.listingName ||
                    "Item"
                )}"
                class="rounded-3"
                style="
                    width:80px;
                    height:80px;
                    object-fit:cover;
                "
                onerror="
                    this.src='https://placehold.co/120x120/e9e7ff/635bff?text=Item'
                "
            >

            <div>

                <div class="small text-secondary">
                    Conversation about
                </div>

                <h4 class="fw-bold mb-1">
                    ${escapeHTML(
                        conversation.listingName ||
                        "Item"
                    )}
                </h4>

                <div class="small text-secondary">

                    Talking with

                    <strong>
                        ${escapeHTML(
                            otherName ||
                            "User"
                        )}
                    </strong>

                    ${
                        otherSchool
                            ? " · " +
                              escapeHTML(
                                  otherSchool
                              )
                            : ""
                    }

                </div>

            </div>

        </div>

    `;

}


// =====================================================
// LISTEN FOR MESSAGES
// =====================================================

function listenForMessages() {

    const messagesReference =
        collection(
            db,
            "messages"
        );


    /*
     * IMPORTANT:
     *
     * We only use where().
     *
     * We DO NOT use orderBy().
     *
     * This means Firebase does not require
     * a composite index.
     */

    const messagesQuery =
        query(

            messagesReference,

            where(
                "conversationId",
                "==",
                conversationId
            )

        );


    onSnapshot(

        messagesQuery,

        (snapshot) => {

            messagesList.innerHTML =
                "";


            const messages = [];


            // =========================================
            // GET MESSAGES
            // =========================================

            snapshot.forEach(
                (documentSnapshot) => {

                    messages.push({

                        id:
                            documentSnapshot.id,

                        ...documentSnapshot.data()

                    });

                }
            );


            // =========================================
            // SORT IN JAVASCRIPT
            // =========================================

            messages.sort(
                (a, b) => {

                    const timeA =
                        getMessageTime(
                            a.createdAt
                        );

                    const timeB =
                        getMessageTime(
                            b.createdAt
                        );

                    return timeA - timeB;

                }
            );


            // =========================================
            // EMPTY CONVERSATION
            // =========================================

            if (
                messages.length === 0
            ) {

                messagesList.innerHTML = `

                    <div
                        class="text-center text-secondary py-5"
                    >

                        <i
                            class="bi bi-chat-dots fs-1 d-block mb-3"
                        ></i>

                        <div>
                            Start the conversation.
                        </div>

                    </div>

                `;

                return;
            }


            // =========================================
            // DISPLAY
            // =========================================

            messages.forEach(
                (message) => {

                    renderMessage(
                        message
                    );

                }
            );


            // =========================================
            // SCROLL DOWN
            // =========================================

            messagesList.scrollTop =
                messagesList.scrollHeight;

        },

        (error) => {

            console.error(
                "MESSAGE LISTENER ERROR:",
                error
            );

            showError(
                error.message
            );

        }

    );

}


// =====================================================
// RENDER MESSAGE
// =====================================================

function renderMessage(
    message
) {

    const isMine =
        message.senderId ===
        currentUser.uid;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "d-flex mb-3";


    if (isMine) {

        wrapper.classList.add(
            "justify-content-end"
        );

    }

    else {

        wrapper.classList.add(
            "justify-content-start"
        );

    }


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "p-3 rounded-4";


    bubble.style.maxWidth =
        "75%";


    if (isMine) {

        bubble.style.backgroundColor =
            "#635bff";

        bubble.style.color =
            "white";

    }

    else {

        bubble.style.backgroundColor =
            "#f1f1f1";

        bubble.style.color =
            "#212529";

    }


    bubble.innerHTML = `

        <div>
            ${escapeHTML(
                message.text || ""
            )}
        </div>

        <div
            class="small mt-1 ${
                isMine
                    ? "text-white-50"
                    : "text-secondary"
            }"
        >

            ${formatMessageTime(
                message.createdAt
            )}

        </div>

    `;


    wrapper.appendChild(
        bubble
    );


    messagesList.appendChild(
        wrapper
    );

}


// =====================================================
// SEND MESSAGE
// =====================================================

messageForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const text =
            messageInput.value.trim();


        if (!text) {

            return;

        }


        if (!conversation) {

            showError(
                "Conversation is not loaded."
            );

            return;

        }


        try {

            // =========================================
            // DISABLE INPUT
            // =========================================

            messageInput.disabled =
                true;


            // =========================================
            // CREATE MESSAGE
            // =========================================

            await addDoc(

                collection(
                    db,
                    "messages"
                ),

                {

                    conversationId:
                        conversationId,

                    senderId:
                        currentUser.uid,

                    senderName:
                        getCurrentUserName(),

                    text:
                        text,

                    createdAt:
                        serverTimestamp()

                }

            );


            // =========================================
            // UPDATE CONVERSATION
            // =========================================

            const conversationReference =
                doc(
                    db,
                    "conversations",
                    conversationId
                );


            await updateDoc(

                conversationReference,

                {

                    lastMessage:
                        text,

                    lastMessageAt:
                        serverTimestamp()

                }

            );


            // =========================================
            // CLEAR INPUT
            // =========================================

            messageInput.value =
                "";

        }

        catch (error) {

            console.error(
                "SEND MESSAGE ERROR:",
                error
            );

            showError(
                "Unable to send message: " +
                error.message
            );

        }

        finally {

            messageInput.disabled =
                false;

            messageInput.focus();

        }

    }
);


// =====================================================
// GET CURRENT USER NAME
// =====================================================

function getCurrentUserName() {

    if (
        conversation.buyerId ===
        currentUser.uid
    ) {

        return (
            conversation.buyerName ||
            "User"
        );

    }


    return (
        conversation.sellerName ||
        "User"
    );

}


// =====================================================
// MESSAGE TIME
// =====================================================

function getMessageTime(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    return 0;

}


// =====================================================
// FORMAT MESSAGE TIME
// =====================================================

function formatMessageTime(
    timestamp
) {

    if (!timestamp) {

        return "Sending...";

    }


    if (
        typeof timestamp.toDate !==
        "function"
    ) {

        return "Sending...";

    }


    const date =
        timestamp.toDate();


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


// =====================================================
// ERROR
// =====================================================

function showError(
    message
) {

    if (!messageError) {

        alert(message);

        return;

    }


    messageError.textContent =
        message;


    messageError.classList.remove(
        "d-none"
    );

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHTML(
    value
) {

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