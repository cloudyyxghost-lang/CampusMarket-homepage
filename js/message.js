import { auth, db } from "./firebase-config.js";

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
// URL PARAMETERS
// =====================================================

const params =
    new URLSearchParams(window.location.search);

const itemId =
    params.get("itemId");

const sellerId =
    params.get("sellerId");


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;


// =====================================================
// AUTH
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

        console.log(
            "Logged in user:",
            currentUser.uid
        );

        // =============================================
        // BUYER CLICKED MESSAGE SELLER
        // =============================================

        if (itemId && sellerId) {

            console.log(
                "Starting conversation..."
            );

            console.log(
                "Item:",
                itemId
            );

            console.log(
                "Seller:",
                sellerId
            );

            await startConversation();

            return;
        }


        // =============================================
        // NORMAL INBOX
        // =============================================

        await loadInbox();

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
            currentUser.uid === sellerId
        ) {

            alert(
                "You cannot message yourself."
            );

            return;
        }


        // ---------------------------------------------
        // GET LISTING
        // ---------------------------------------------

        const listingRef =
            doc(
                db,
                "listings",
                itemId
            );

        const listingSnapshot =
            await getDoc(
                listingRef
            );


        if (!listingSnapshot.exists()) {

            alert(
                "This listing could not be found."
            );

            return;
        }


        const listing =
            listingSnapshot.data();


        console.log(
            "Listing found:",
            listing
        );


        // ---------------------------------------------
        // FIND EXISTING CONVERSATION
        // ---------------------------------------------

        const conversationsRef =
            collection(
                db,
                "conversations"
            );


        const q =
            query(
                conversationsRef,

                where(
                    "participants",
                    "array-contains",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        let existingConversationId =
            null;


        snapshot.forEach(
            (conversationDoc) => {

                const data =
                    conversationDoc.data();


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

                    existingConversationId =
                        conversationDoc.id;

                }

            }
        );


        // ---------------------------------------------
        // EXISTING CONVERSATION
        // ---------------------------------------------

        if (
            existingConversationId
        ) {

            console.log(
                "Existing conversation:",
                existingConversationId
            );


            window.location.href =
                "message.html?id=" +
                existingConversationId;

            return;
        }


        // ---------------------------------------------
        // GET SELLER
        // ---------------------------------------------

        let sellerName =
            listing.sellerName ||
            "Seller";

        let sellerSchool =
            listing.school ||
            listing.sellerSchool ||
            "";


        try {

            const sellerRef =
                doc(
                    db,
                    "users",
                    sellerId
                );


            const sellerSnapshot =
                await getDoc(
                    sellerRef
                );


            if (
                sellerSnapshot.exists()
            ) {

                const seller =
                    sellerSnapshot.data();


                sellerName =
                    seller.sellerName ||
                    seller.username ||
                    seller.name ||
                    sellerName;


                sellerSchool =
                    seller.school ||
                    sellerSchool;

            }

        }

        catch (error) {

            console.log(
                "Could not load seller profile:",
                error
            );

        }


        // ---------------------------------------------
        // GET BUYER
        // ---------------------------------------------

        let buyerName =
            "Buyer";

        let buyerSchool =
            "";


        try {

            const buyerRef =
                doc(
                    db,
                    "users",
                    currentUser.uid
                );


            const buyerSnapshot =
                await getDoc(
                    buyerRef
                );


            if (
                buyerSnapshot.exists()
            ) {

                const buyer =
                    buyerSnapshot.data();


                buyerName =
                    buyer.sellerName ||
                    buyer.username ||
                    buyer.name ||
                    "Buyer";


                buyerSchool =
                    buyer.school ||
                    "";

            }

        }

        catch (error) {

            console.log(
                "Could not load buyer profile:",
                error
            );

        }


        // ---------------------------------------------
        // LISTING IMAGE
        // ---------------------------------------------

        let listingImage =
            "";


        if (
            Array.isArray(
                listing.images
            )
        ) {

            if (
                listing.images.length > 0
            ) {

                listingImage =
                    listing.images[0];

            }

        }


        if (
            !listingImage &&
            listing.imageUrl
        ) {

            listingImage =
                listing.imageUrl;

        }


        // ---------------------------------------------
        // CREATE CONVERSATION
        // ---------------------------------------------

        const conversation = {

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
            conversation
        );


        const newConversation =
            await addDoc(
                conversationsRef,
                conversation
            );


        console.log(
            "Conversation created:",
            newConversation.id
        );


        // ---------------------------------------------
        // OPEN CHAT
        // ---------------------------------------------

        window.location.href =
            "message.html?id=" +
            newConversation.id;

    }

    catch (error) {

        console.error(
            "START CONVERSATION ERROR:",
            error
        );


        alert(
            "Unable to start conversation:\n\n" +
            error.message
        );

    }

}


// =====================================================
// NORMAL INBOX
// =====================================================

async function loadInbox() {

    const conversationList =
        document.getElementById(
            "conversationList"
        );

    const emptyMessages =
        document.getElementById(
            "emptyMessages"
        );


    if (!conversationList) {

        console.error(
            "conversationList element not found."
        );

        return;
    }


    try {

        const conversationsRef =
            collection(
                db,
                "conversations"
            );


        const q =
            query(
                conversationsRef,

                where(
                    "participants",
                    "array-contains",
                    currentUser.uid
                )
            );


        const snapshot =
            await getDocs(q);


        conversationList.innerHTML =
            "";


        if (
            snapshot.empty
        ) {

            if (emptyMessages) {

                emptyMessages.classList.remove(
                    "d-none"
                );

            }

            return;
        }


        if (emptyMessages) {

            emptyMessages.classList.add(
                "d-none"
            );

        }


        snapshot.forEach(
            (conversationDoc) => {

                const data =
                    conversationDoc.data();


                createConversationCard(
                    conversationDoc.id,
                    data,
                    conversationList
                );

            }
        );

    }

    catch (error) {

        console.error(
            "LOAD INBOX ERROR:",
            error
        );

        alert(
            error.message
        );

    }

}


// =====================================================
// CONVERSATION CARD
// =====================================================

function createConversationCard(
    conversationId,
    data,
    container
) {

    const isBuyer =
        data.buyerId ===
        currentUser.uid;


    const otherName =
        isBuyer
            ? data.sellerName
            : data.buyerName;


    const image =
        data.listingImage ||
        "https://placehold.co/100x100";


    const card =
        document.createElement(
            "a"
        );


    card.href =
        "message.html?id=" +
        conversationId;


    card.className =
        "text-decoration-none text-dark";


    card.innerHTML = `

        <div
            class="card border-0 shadow-sm rounded-4 mb-3"
        >

            <div
                class="card-body"
            >

                <div
                    class="d-flex align-items-center gap-3"
                >

                    <img
                        src="${escapeHTML(image)}"
                        style="
                            width:70px;
                            height:70px;
                            object-fit:cover;
                        "
                        class="rounded-3"
                    >

                    <div>

                        <h5 class="fw-bold mb-1">

                            ${escapeHTML(
                                data.listingName ||
                                "Item"
                            )}

                        </h5>

                        <div>

                            ${escapeHTML(
                                otherName ||
                                "User"
                            )}

                        </div>

                        <small class="text-secondary">

                            ${
                                data.lastMessage ||
                                "No messages yet."
                            }

                        </small>

                    </div>

                </div>

            </div>

        </div>

    `;


    container.appendChild(
        card
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