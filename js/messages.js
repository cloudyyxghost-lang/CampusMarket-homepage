// =====================================================
// CAMPUSMARKET
// MESSAGES
//
// Supports:
//
// messages.html
//
// messages.html?itemId=LISTING_ID&sellerId=SELLER_ID
//
// message.html?id=CONVERSATION_ID
// =====================================================


import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    query,
    where,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// HTML ELEMENTS
// =====================================================

const conversationList =
    document.getElementById(
        "conversationList"
    );


const emptyMessages =
    document.getElementById(
        "emptyMessages"
    );


const messagesError =
    document.getElementById(
        "messagesError"
    );


// =====================================================
// URL PARAMETERS
// =====================================================

const urlParameters =
    new URLSearchParams(
        window.location.search
    );


const itemId =
    urlParameters.get(
        "itemId"
    );


const sellerId =
    urlParameters.get(
        "sellerId"
    );


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "Authentication state:",
            user
        );


        // ---------------------------------------------
        // USER NOT LOGGED IN
        // ---------------------------------------------

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        currentUser =
            user;


        console.log(
            "Current user:",
            currentUser.uid
        );


        // =================================================
        // IMPORTANT
        //
        // If itemId + sellerId exist, the buyer just
        // clicked "Message Seller".
        // =================================================

        if (
            itemId &&
            sellerId
        ) {

            console.log(
                "Opening conversation for listing:",
                itemId
            );


            await startConversation();

            return;

        }


        // =================================================
        // OTHERWISE LOAD NORMAL INBOX
        // =================================================

        await loadConversations();

    }
);


// =====================================================
// START CONVERSATION
// =====================================================

async function startConversation() {

    try {

        // ---------------------------------------------
        // DON'T MESSAGE YOURSELF
        // ---------------------------------------------

        if (
            currentUser.uid ===
            sellerId
        ) {

            showError(
                "You cannot message yourself about your own listing."
            );


            return;

        }


        // ---------------------------------------------
        // GET LISTING
        // ---------------------------------------------

        const listingReference =
            doc(
                db,
                "listings",
                itemId
            );


        const listingSnapshot =
            await getDoc(
                listingReference
            );


        if (
            !listingSnapshot.exists()
        ) {

            showError(
                "This item no longer exists."
            );


            return;

        }


        const listing =
            listingSnapshot.data();


        console.log(
            "Listing:",
            listing
        );


        // ---------------------------------------------
        // GET BUYER PROFILE
        // ---------------------------------------------

        const buyerProfile =
            await getUserProfile(
                currentUser.uid
            );


        // ---------------------------------------------
        // GET SELLER PROFILE
        // ---------------------------------------------

        const sellerProfile =
            await getUserProfile(
                sellerId
            );


        // ---------------------------------------------
        // FIND EXISTING CONVERSATION
        // ---------------------------------------------

        const conversationsReference =
            collection(
                db,
                "conversations"
            );


        const conversationsQuery =
            query(
                conversationsReference,

                where(
                    "participants",
                    "array-contains",
                    currentUser.uid
                )
            );


        const conversationSnapshot =
            await getDocs(
                conversationsQuery
            );


        let existingConversation =
            null;


        conversationSnapshot.forEach(
            (conversationDocument) => {

                const data =
                    conversationDocument.data();


                /*
                 * We check these manually instead
                 * of using multiple Firestore
                 * where() statements.
                 *
                 * This avoids unnecessary
                 * composite-index problems.
                 */

                if (

                    data.listingId ===
                    itemId

                    &&

                    data.sellerId ===
                    sellerId

                    &&

                    data.buyerId ===
                    currentUser.uid

                ) {

                    existingConversation = {

                        id:
                            conversationDocument.id,

                        ...data

                    };

                }

            }
        );


        // ---------------------------------------------
        // EXISTING CONVERSATION
        // ---------------------------------------------

        if (
            existingConversation
        ) {

            console.log(
                "Existing conversation:",
                existingConversation.id
            );


            window.location.href =
                `message.html?id=${encodeURIComponent(
                    existingConversation.id
                )}`;


            return;

        }


        // ---------------------------------------------
        // IMAGE
        // ---------------------------------------------

        let listingImage =
            "";


        if (
            Array.isArray(
                listing.images
            )

            &&

            listing.images.length > 0
        ) {

            listingImage =
                listing.images[0];

        }


        if (
            !listingImage &&
            listing.imageUrl
        ) {

            listingImage =
                listing.imageUrl;

        }


        // ---------------------------------------------
        // BUYER NAME
        // ---------------------------------------------

        const buyerName =
            buyerProfile.sellerName ||
            buyerProfile.username ||
            buyerProfile.name ||
            "User";


        // ---------------------------------------------
        // BUYER SCHOOL
        // ---------------------------------------------

        const buyerSchool =
            buyerProfile.school ||
            "";


        // ---------------------------------------------
        // SELLER NAME
        // ---------------------------------------------

        const sellerName =
            listing.sellerName ||
            sellerProfile.sellerName ||
            sellerProfile.username ||
            sellerProfile.name ||
            "Seller";


        // ---------------------------------------------
        // SELLER SCHOOL
        // ---------------------------------------------

        const sellerSchool =
            listing.sellerSchool ||
            listing.school ||
            sellerProfile.school ||
            "";


        // ---------------------------------------------
        // CREATE CONVERSATION
        // ---------------------------------------------

        const conversationData = {

            buyerId:
                currentUser.uid,

            buyerName:
                buyerName,

            buyerSchool:
                buyerSchool,


            sellerId:
                sellerId,

            sellerName:
                sellerName,

            sellerSchool:
                sellerSchool,


            listingId:
                itemId,

            listingName:
                listing.name ||
                listing.itemName ||
                "Item",

            listingImage:
                listingImage,


            participants: [

                currentUser.uid,

                sellerId

            ],


            lastMessage:
                "",

            lastMessageAt:
                serverTimestamp(),


            createdAt:
                serverTimestamp()

        };


        console.log(
            "Creating conversation:",
            conversationData
        );


        const conversationReference =
            await addDoc(
                conversationsReference,
                conversationData
            );


        console.log(
            "Conversation created:",
            conversationReference.id
        );


        // ---------------------------------------------
        // OPEN CONVERSATION
        // ---------------------------------------------

        window.location.href =
            `message.html?id=${encodeURIComponent(
                conversationReference.id
            )}`;

    }

    catch (error) {

        console.error(
            "START CONVERSATION ERROR:",
            error
        );


        showError(
            "Unable to start conversation: " +
            error.message
        );

    }

}


// =====================================================
// GET USER PROFILE
// =====================================================

async function getUserProfile(
    userId
) {

    try {

        const userReference =
            doc(
                db,
                "users",
                userId
            );


        const userSnapshot =
            await getDoc(
                userReference
            );


        if (
            userSnapshot.exists()
        ) {

            return userSnapshot.data();

        }


        return {};

    }

    catch (error) {

        console.error(
            "USER PROFILE ERROR:",
            error
        );


        return {};

    }

}


// =====================================================
// LOAD NORMAL INBOX
// =====================================================

async function loadConversations() {

    try {

        console.log(
            "Loading user's conversations..."
        );


        const conversationsReference =
            collection(
                db,
                "conversations"
            );


        const conversationsQuery =
            query(
                conversationsReference,

                where(
                    "participants",
                    "array-contains",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(
                conversationsQuery
            );


        const conversations = [];


        snapshot.forEach(
            (documentSnapshot) => {

                conversations.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        console.log(
            "Found conversations:",
            conversations.length
        );


        // ---------------------------------------------
        // SORT
        // ---------------------------------------------

        conversations.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.lastMessageAt
                    )
                    -
                    getTimestamp(
                        a.lastMessageAt
                    )
                );

            }
        );


        // ---------------------------------------------
        // EMPTY
        // ---------------------------------------------

        if (
            conversations.length === 0
        ) {

            conversationList.innerHTML =
                "";


            emptyMessages.classList.remove(
                "d-none"
            );


            return;

        }


        emptyMessages.classList.add(
            "d-none"
        );


        conversationList.innerHTML =
            "";


        // ---------------------------------------------
        // DISPLAY
        // ---------------------------------------------

        conversations.forEach(
            (conversation) => {

                createConversationCard(
                    conversation
                );

            }
        );

    }

    catch (error) {

        console.error(
            "LOAD CONVERSATIONS ERROR:",
            error
        );


        showError(
            error.message
        );

    }

}


// =====================================================
// CONVERSATION CARD
// =====================================================

function createConversationCard(
    conversation
) {

    const card =
        document.createElement(
            "a"
        );


    card.href =
        `message.html?id=${encodeURIComponent(
            conversation.id
        )}`;


    card.className =
        "text-decoration-none text-dark";


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


    card.innerHTML = `

        <div
            class="card border-0 shadow-sm rounded-4"
        >

            <div
                class="card-body p-3 p-md-4"
            >

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
                            width:72px;
                            height:72px;
                            object-fit:cover;
                        "
                        onerror="
                            this.src='https://placehold.co/120x120/e9e7ff/635bff?text=Item'
                        "
                    >


                    <div
                        class="flex-grow-1"
                    >

                        <h5
                            class="fw-bold mb-1"
                        >

                            ${escapeHTML(
                                conversation.listingName ||
                                "Item"
                            )}

                        </h5>


                        <div
                            class="fw-semibold"
                        >

                            ${escapeHTML(
                                otherName ||
                                "User"
                            )}

                        </div>


                        <div
                            class="small text-secondary"
                        >

                            ${escapeHTML(
                                otherSchool ||
                                ""
                            )}

                        </div>


                        <div
                            class="small text-secondary text-truncate"
                        >

                            ${escapeHTML(
                                conversation.lastMessage ||
                                "No messages yet."
                            )}

                        </div>

                    </div>


                    <i
                        class="bi bi-chevron-right text-secondary"
                    ></i>

                </div>

            </div>

        </div>

    `;


    conversationList.appendChild(
        card
    );

}


// =====================================================
// TIMESTAMP
// =====================================================

function getTimestamp(
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
// ERROR
// =====================================================

function showError(
    message
) {

    if (!messagesError) {

        alert(message);

        return;

    }


    messagesError.textContent =
        message;


    messagesError.classList.remove(
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
