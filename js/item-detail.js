// =========================================================
// CampusMarket - Item Detail Page
// =========================================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =========================================================
// DOM ELEMENTS
// =========================================================

const loadingState =
    document.getElementById("loadingState");

const errorState =
    document.getElementById("errorState");

const errorMessage =
    document.getElementById("errorMessage");

const itemContent =
    document.getElementById("itemContent");


const mainItemImage =
    document.getElementById("mainItemImage");

const thumbnailContainer =
    document.getElementById("thumbnailContainer");


const itemCategory =
    document.getElementById("itemCategory");

const itemName =
    document.getElementById("itemName");

const itemPrice =
    document.getElementById("itemPrice");

const itemCondition =
    document.getElementById("itemCondition");

const itemDescription =
    document.getElementById("itemDescription");


const itemLocation =
    document.getElementById("itemLocation");

const itemSchool =
    document.getElementById("itemSchool");


const sellerName =
    document.getElementById("sellerName");

const sellerSchool =
    document.getElementById("sellerSchool");


const messageSellerButton =
    document.getElementById("messageSellerButton");


const loggedOutNav =
    document.getElementById("loggedOutNav");

const loggedInNav =
    document.getElementById("loggedInNav");

const logoutButton =
    document.getElementById("logoutButton");


const loginForm =
    document.getElementById("loginForm");

const signupForm =
    document.getElementById("signupForm");


const loginError =
    document.getElementById("loginError");

const signupError =
    document.getElementById("signupError");


// =========================================================
// GET ITEM ID FROM URL
// =========================================================
//
// Example:
//
// item-detail.html?id=abc123
//
// =========================================================

const urlParams =
    new URLSearchParams(window.location.search);


const itemId =
    urlParams.get("id");


// =========================================================
// CURRENT ITEM
// =========================================================

let currentItem = null;


// =========================================================
// CURRENT USER
// =========================================================

let currentUser = null;


// =========================================================
// AUTHENTICATION STATE
// =========================================================

onAuthStateChanged(
    auth,
    (user) => {

        currentUser = user;


        if (user) {

            // ---------------------------------------------
            // LOGGED IN
            // ---------------------------------------------

            loggedOutNav.classList.add(
                "d-none"
            );

            loggedInNav.classList.remove(
                "d-none"
            );

            loggedInNav.classList.add(
                "d-flex"
            );


            console.log(
                "Logged in:",
                user.email
            );

        } else {

            // ---------------------------------------------
            // LOGGED OUT
            // ---------------------------------------------

            loggedInNav.classList.add(
                "d-none"
            );

            loggedInNav.classList.remove(
                "d-flex"
            );

            loggedOutNav.classList.remove(
                "d-none"
            );

        }

    }
);


// =========================================================
// LOAD ITEM
// =========================================================

loadItem();


// =========================================================
// LOAD ITEM FROM FIRESTORE
// =========================================================

async function loadItem() {

    // ---------------------------------------------
    // No ID
    // ---------------------------------------------

    if (!itemId) {

        showError(
            "No item was selected."
        );

        return;

    }


    try {

        // ---------------------------------------------
        // Reference to listing
        // ---------------------------------------------

        const itemReference =
            doc(
                db,
                "listings",
                itemId
            );


        // ---------------------------------------------
        // Get listing
        // ---------------------------------------------

        const itemSnapshot =
            await getDoc(
                itemReference
            );


        // ---------------------------------------------
        // Item doesn't exist
        // ---------------------------------------------

        if (!itemSnapshot.exists()) {

            showError(
                "This item no longer exists or has been removed."
            );

            return;

        }


        // ---------------------------------------------
        // Save item
        // ---------------------------------------------

        currentItem = {

            id: itemSnapshot.id,

            ...itemSnapshot.data()

        };


        // ---------------------------------------------
        // Display item
        // ---------------------------------------------

        displayItem(
            currentItem
        );


    } catch (error) {

        console.error(
            "Error loading item:",
            error
        );


        showError(
            "There was a problem loading this item."
        );

    }

}


// =========================================================
// DISPLAY ITEM
// =========================================================

function displayItem(item) {

    // ---------------------------------------------
    // Basic information
    // ---------------------------------------------

    itemCategory.textContent =
        item.category || "";


    itemName.textContent =
        item.name || "Untitled Item";


    // ---------------------------------------------
    // Price
    // ---------------------------------------------

    if (
        item.price !== undefined &&
        item.price !== null
    ) {

        itemPrice.textContent =
            formatPrice(item.price);

    } else {

        itemPrice.textContent =
            "Price not listed";

    }


    // ---------------------------------------------
    // Condition
    // ---------------------------------------------

    itemCondition.textContent =
        item.condition || "Condition not specified";


    // ---------------------------------------------
    // Description
    // ---------------------------------------------

    itemDescription.textContent =
        item.description ||
        "No description provided.";


    // ---------------------------------------------
    // Location
    // ---------------------------------------------

    itemLocation.textContent =
        item.location ||
        "Location not specified";


    // ---------------------------------------------
    // School
    // ---------------------------------------------

    itemSchool.textContent =
        item.school ||
        "";


    // ---------------------------------------------
    // Seller
    // ---------------------------------------------

    sellerName.textContent =
        item.sellerName ||
        "CampusMarket Seller";


    sellerSchool.textContent =
        item.school ||
        "";


    // ---------------------------------------------
    // Images
    // ---------------------------------------------

    displayImages(
        item.images || []
    );


    // ---------------------------------------------
    // Show page
    // ---------------------------------------------

    loadingState.classList.add(
        "d-none"
    );

    itemContent.classList.remove(
        "d-none"
    );

}


// =========================================================
// DISPLAY IMAGES
// =========================================================

function displayImages(images) {

    thumbnailContainer.innerHTML = "";


    // ---------------------------------------------
    // No images
    // ---------------------------------------------

    if (
        !images ||
        images.length === 0
    ) {

        mainItemImage.src =
            "https://placehold.co/800x600/e9f1fb/172033?text=No+Image";


        return;

    }


    // ---------------------------------------------
    // Main image
    // ---------------------------------------------

    mainItemImage.src =
        images[0];


    // ---------------------------------------------
    // Create thumbnails
    // ---------------------------------------------

    images.forEach(
        (imageURL, index) => {

            const thumbnail =
                document.createElement("button");


            thumbnail.type =
                "button";


            thumbnail.className =
                "btn p-0 border border-dark rounded-3 overflow-hidden";


            thumbnail.style.height =
                "90px";


            thumbnail.style.width =
                "100%";


            thumbnail.innerHTML = `

                <img
                    src="${imageURL}"
                    alt="Item image ${index + 1}"
                    class="w-100 h-100"
                    style="object-fit: cover;"
                >

            `;


            thumbnail.addEventListener(
                "click",
                () => {

                    mainItemImage.src =
                        imageURL;

                }
            );


            thumbnailContainer.appendChild(
                thumbnail
            );

        }
    );

}


// =========================================================
// FORMAT PRICE
// =========================================================

function formatPrice(price) {

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(price);

}


// =========================================================
// MESSAGE SELLER
// =========================================================

messageSellerButton.addEventListener(
    "click",
    () => {

        // ---------------------------------------------
        // User is NOT logged in
        // ---------------------------------------------

        if (!currentUser) {

            const loginModalElement =
                document.getElementById(
                    "loginModal"
                );


            const loginModal =
                new bootstrap.Modal(
                    loginModalElement
                );


            loginModal.show();


            return;

        }


        // ---------------------------------------------
        // User is logged in
        // ---------------------------------------------
        //
        // We will build the actual messaging system
        // next.
        //
        // For now, go to the conversation page.
        // ---------------------------------------------

        window.location.href =
            `messages.html?itemId=${currentItem.id}&sellerId=${currentItem.sellerId}`;

    }
);


// =========================================================
// LOGOUT
// =========================================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// =========================================================
// LOGIN
// =========================================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        loginError.classList.add(
            "d-none"
        );


        const email =
            document
                .getElementById(
                    "loginEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "loginPassword"
                )
                .value;


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            const modalElement =
                document.getElementById(
                    "loginModal"
                );


            const modal =
                bootstrap.Modal.getInstance(
                    modalElement
                );


            if (modal) {

                modal.hide();

            }


            loginForm.reset();


        } catch (error) {

            console.error(error);


            loginError.textContent =
                getFirebaseErrorMessage(
                    error
                );


            loginError.classList.remove(
                "d-none"
            );

        }

    }
);


// =========================================================
// SIGNUP
// =========================================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        signupError.classList.add(
            "d-none"
        );


        const email =
            document
                .getElementById(
                    "signupEmail"
                )
                .value
                .trim();


        const password =
            document
                .getElementById(
                    "signupPassword"
                )
                .value;


        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


            const modalElement =
                document.getElementById(
                    "signupModal"
                );


            const modal =
                bootstrap.Modal.getInstance(
                    modalElement
                );


            if (modal) {

                modal.hide();

            }


            signupForm.reset();


        } catch (error) {

            console.error(error);


            signupError.textContent =
                getFirebaseErrorMessage(
                    error
                );


            signupError.classList.remove(
                "d-none"
            );

        }

    }
);


// =========================================================
// ERROR DISPLAY
// =========================================================

function showError(message) {

    loadingState.classList.add(
        "d-none"
    );


    itemContent.classList.add(
        "d-none"
    );


    errorMessage.textContent =
        message;


    errorState.classList.remove(
        "d-none"
    );

}


// =========================================================
// FIREBASE ERROR MESSAGES
// =========================================================

function getFirebaseErrorMessage(error) {

    switch (error.code) {

        case "auth/invalid-email":

            return "Please enter a valid email address.";


        case "auth/user-not-found":

            return "No account was found with this email.";


        case "auth/wrong-password":

            return "Incorrect password.";


        case "auth/invalid-credential":

            return "The email or password is incorrect.";


        case "auth/email-already-in-use":

            return "An account already exists with this email.";


        case "auth/weak-password":

            return "Password must be at least 6 characters.";


        default:

            return "Something went wrong. Please try again.";

    }

}