// =====================================================
// CAMPUSMARKET - MAIN APP
// =====================================================


// =====================================================
// FIREBASE
// =====================================================

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
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// HTML ELEMENTS
// =====================================================


// Marketplace

const listingGrid =
    document.getElementById(
        "listingGrid"
    );


const emptyMarketplace =
    document.getElementById(
        "emptyMarketplace"
    );


// Search

const locationSearch =
    document.getElementById(
        "locationSearch"
    );


const clearSearch =
    document.getElementById(
        "clearSearch"
    );


// Navigation

const loggedOutNav =
    document.getElementById(
        "loggedOutNav"
    );


const loggedInNav =
    document.getElementById(
        "loggedInNav"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// Login

const loginForm =
    document.getElementById(
        "loginForm"
    );


const loginEmail =
    document.getElementById(
        "loginEmail"
    );


const loginPassword =
    document.getElementById(
        "loginPassword"
    );


const loginError =
    document.getElementById(
        "loginError"
    );


// Signup

const signupForm =
    document.getElementById(
        "signupForm"
    );


const signupName =
    document.getElementById(
        "signupName"
    );


const signupSchool =
    document.getElementById(
        "signupSchool"
    );


const signupEmail =
    document.getElementById(
        "signupEmail"
    );


const signupPassword =
    document.getElementById(
        "signupPassword"
    );


const signupError =
    document.getElementById(
        "signupError"
    );


// =====================================================
// GLOBAL DATA
// =====================================================

let allListings = [];


// =====================================================
// AUTH STATE
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        console.log(
            "Auth state:",
            user
        );


        if (user) {

            // -----------------------------------------
            // LOGGED IN
            // -----------------------------------------

            if (loggedOutNav) {

                loggedOutNav.classList.add(
                    "d-none"
                );

            }


            if (loggedInNav) {

                loggedInNav.classList.remove(
                    "d-none"
                );

                loggedInNav.classList.add(
                    "d-flex"
                );

            }


            console.log(
                "Logged in:",
                user.email
            );

        }

        else {

            // -----------------------------------------
            // LOGGED OUT
            // -----------------------------------------

            if (loggedOutNav) {

                loggedOutNav.classList.remove(
                    "d-none"
                );

            }


            if (loggedInNav) {

                loggedInNav.classList.add(
                    "d-none"
                );

                loggedInNav.classList.remove(
                    "d-flex"
                );

            }

        }

    }
);


// =====================================================
// SIGNUP
// =====================================================

if (signupForm) {

    signupForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            hideSignupError();


            const name =
                signupName.value.trim();


            const school =
                signupSchool.value.trim();


            const email =
                signupEmail.value.trim();


            const password =
                signupPassword.value;


            // -----------------------------------------
            // VALIDATION
            // -----------------------------------------

            if (!name) {

                showSignupError(
                    "Please enter a username."
                );

                return;

            }


            if (!school) {

                showSignupError(
                    "Please enter your school."
                );

                return;

            }


            if (!email) {

                showSignupError(
                    "Please enter your email."
                );

                return;

            }


            if (
                password.length < 6
            ) {

                showSignupError(
                    "Password must contain at least 6 characters."
                );

                return;

            }


            try {

                console.log(
                    "Creating Firebase account..."
                );


                // =====================================
                // CREATE AUTH ACCOUNT
                // =====================================

                const credential =
                    await createUserWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                const user =
                    credential.user;


                console.log(
                    "Firebase account created:",
                    user.uid
                );


                // =====================================
                // CREATE USER PROFILE
                // =====================================

                await setDoc(
                    doc(
                        db,
                        "users",
                        user.uid
                    ),
                    {

                        sellerName:
                            name,

                        school:
                            school,

                        email:
                            email,

                        profileImage:
                            "",

                        createdAt:
                            serverTimestamp()

                    }
                );


                console.log(
                    "User profile created."
                );


                // =====================================
                // CLOSE MODAL
                // =====================================

                closeModal(
                    "signupModal"
                );


                signupForm.reset();


                console.log(
                    "Signup complete."
                );

            }

            catch (error) {

                console.error(
                    "SIGNUP ERROR:",
                    error
                );


                showSignupError(
                    firebaseErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// =====================================================
// LOGIN
// =====================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            hideLoginError();


            const email =
                loginEmail.value.trim();


            const password =
                loginPassword.value;


            if (!email || !password) {

                showLoginError(
                    "Please enter your email and password."
                );

                return;

            }


            try {

                console.log(
                    "Logging in..."
                );


                const credential =
                    await signInWithEmailAndPassword(
                        auth,
                        email,
                        password
                    );


                console.log(
                    "Login successful:",
                    credential.user.uid
                );


                // -------------------------------------
                // CLOSE MODAL
                // -------------------------------------

                closeModal(
                    "loginModal"
                );


                loginForm.reset();

            }

            catch (error) {

                console.error(
                    "LOGIN ERROR:",
                    error
                );


                showLoginError(
                    firebaseErrorMessage(
                        error
                    )
                );

            }

        }
    );

}


// =====================================================
// LOGOUT
// =====================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await signOut(
                    auth
                );


                console.log(
                    "Logged out."
                );

            }

            catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

            }

        }
    );

}


// =====================================================
// LOAD MARKETPLACE
// =====================================================

async function loadListings() {

    console.log(
        "Loading listings..."
    );


    try {

        const listingsReference =
            collection(
                db,
                "listings"
            );


        const listingsQuery =
            query(
                listingsReference,

                where(
                    "status",
                    "==",
                    "active"
                )
            );


        const snapshot =
            await getDocs(
                listingsQuery
            );


        console.log(
            "Listings found:",
            snapshot.size
        );


        allListings = [];


        // =============================================
        // READ LISTINGS
        // =============================================

        for (
            const documentSnapshot
            of snapshot.docs
        ) {

            const listing =
                documentSnapshot.data();


            // -----------------------------------------
            // SELLER
            // -----------------------------------------

            let sellerName =
                listing.sellerName ||
                "Seller";


            let sellerSchool =
                listing.school ||
                "School not specified";


            // -----------------------------------------
            // FALLBACK: GET USER PROFILE
            // -----------------------------------------

            if (
                listing.sellerId &&
                !listing.sellerName
            ) {

                try {

                    const userReference =
                        doc(
                            db,
                            "users",
                            listing.sellerId
                        );


                    const userSnapshot =
                        await getDoc(
                            userReference
                        );


                    if (
                        userSnapshot.exists()
                    ) {

                        const user =
                            userSnapshot.data();


                        sellerName =
                            user.sellerName ||
                            user.name ||
                            "Seller";


                        sellerSchool =
                            user.school ||
                            sellerSchool;

                    }

                }

                catch (error) {

                    console.error(
                        "Seller lookup failed:",
                        error
                    );

                }

            }


            // -----------------------------------------
            // SAVE
            // -----------------------------------------

            allListings.push({

                id:
                    documentSnapshot.id,

                ...listing,

                sellerName:
                    sellerName,

                sellerSchool:
                    sellerSchool

            });

        }


        // =============================================
        // NEWEST FIRST
        // =============================================

        allListings.sort(
            (a, b) => {

                return (
                    getTimestamp(
                        b.createdAt
                    )
                    -
                    getTimestamp(
                        a.createdAt
                    )
                );

            }
        );


        displayListings(
            allListings
        );

    }

    catch (error) {

        console.error(
            "FIRESTORE ERROR:",
            error
        );


        listingGrid.innerHTML = `

            <div class="col-12">

                <div class="alert alert-danger">

                    <strong>
                        Unable to load listings.
                    </strong>

                    <br>

                    ${escapeHTML(
                        error.message
                    )}

                </div>

            </div>

        `;

    }

}


// =====================================================
// DISPLAY LISTINGS
// =====================================================

function displayListings(
    listings
) {

    listingGrid.innerHTML =
        "";


    if (
        listings.length === 0
    ) {

        emptyMarketplace.classList.remove(
            "d-none"
        );

        return;

    }


    emptyMarketplace.classList.add(
        "d-none"
    );


    listings.forEach(
        (listing) => {

            createListingCard(
                listing
            );

        }
    );

}


// =====================================================
// LISTING CARD
// =====================================================

function createListingCard(
    listing
) {

    const column =
        document.createElement(
            "div"
        );


    column.className =
        "col";


    // =============================================
    // IMAGE
    // =============================================

    let image =
        "https://placehold.co/600x450/e9f1fb/172033?text=No+Image";


    if (
        Array.isArray(
            listing.images
        ) &&
        listing.images.length > 0
    ) {

        image =
            listing.images[0];

    }


    // =============================================
    // SELLER
    // =============================================

    const sellerName =
        listing.sellerName ||
        "Seller";


    const sellerSchool =
        listing.sellerSchool ||
        listing.school ||
        "School not specified";


    // =============================================
    // CARD
    // =============================================

    column.innerHTML = `

        <div
            class="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
            style="cursor:pointer;"
        >

            <!-- IMAGE -->

            <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(
                    listing.name ||
                    "Item"
                )}"
                class="card-img-top"
                style="
                    height:220px;
                    object-fit:cover;
                "
                onerror="
                    this.src='https://placehold.co/600x450/e9f1fb/172033?text=Image+Unavailable'
                "
            >


            <!-- BODY -->

            <div class="card-body p-4">


                <!-- CATEGORY -->

                <div
                    class="small text-secondary mb-1"
                >

                    ${escapeHTML(
                        listing.category ||
                        ""
                    )}

                </div>


                <!-- NAME -->

                <h5
                    class="fw-bold mb-2"
                >

                    ${escapeHTML(
                        listing.name ||
                        "Untitled Item"
                    )}

                </h5>


                <!-- PRICE -->

                <div
                    class="fs-5 fw-bold mb-3"
                >

                    ${formatPrice(
                        listing.price
                    )}

                </div>


                <!-- =================================
                     SELLER
                ================================== -->

                <div
                    class="d-flex align-items-center gap-2 mb-3"
                >

                    <div
                        class="rounded-circle d-flex align-items-center justify-content-center"
                        style="
                            width:36px;
                            height:36px;
                            background:#eeeaff;
                            color:#635bff;
                        "
                    >

                        <i
                            class="bi bi-person-fill"
                        ></i>

                    </div>


                    <div>

                        <div
                            class="small fw-semibold"
                        >

                            ${escapeHTML(
                                sellerName
                            )}

                        </div>


                        <div
                            class="small text-secondary"
                        >

                            ${escapeHTML(
                                sellerSchool
                            )}

                        </div>

                    </div>

                </div>


                <!-- CONDITION -->

                <div
                    class="small text-secondary mb-2"
                >

                    <i
                        class="bi bi-box-seam me-1"
                    ></i>

                    ${escapeHTML(
                        listing.condition ||
                        "Condition not specified"
                    )}

                </div>


                <!-- LOCATION -->

                <div
                    class="small text-secondary"
                >

                    <i
                        class="bi bi-geo-alt me-1"
                    ></i>

                    ${escapeHTML(
                        listing.location ||
                        "Location not specified"
                    )}

                </div>

            </div>

        </div>

    `;


    // =============================================
    // CLICK
    // =============================================

    column
        .querySelector(".card")
        .addEventListener(
            "click",
            () => {

                window.location.href =
                    `item-detail.html?id=${encodeURIComponent(
                        listing.id
                    )}`;

            }
        );


    listingGrid.appendChild(
        column
    );

}


// =====================================================
// SEARCH
// =====================================================

if (locationSearch) {

    locationSearch.addEventListener(
        "input",
        () => {

            const search =
                locationSearch.value
                    .trim()
                    .toLowerCase();


            if (search) {

                clearSearch.classList.remove(
                    "d-none"
                );

            }

            else {

                clearSearch.classList.add(
                    "d-none"
                );

            }


            if (!search) {

                displayListings(
                    allListings
                );

                return;

            }


            const results =
                allListings.filter(
                    (listing) => {

                        const text = `

                            ${listing.name || ""}

                            ${listing.category || ""}

                            ${listing.sellerName || ""}

                            ${listing.sellerSchool || ""}

                            ${listing.school || ""}

                            ${listing.location || ""}

                            ${listing.description || ""}

                            ${listing.condition || ""}

                        `.toLowerCase();


                        return text.includes(
                            search
                        );

                    }
                );


            displayListings(
                results
            );

        }
    );

}


// =====================================================
// CLEAR SEARCH
// =====================================================

if (clearSearch) {

    clearSearch.addEventListener(
        "click",
        () => {

            locationSearch.value =
                "";


            clearSearch.classList.add(
                "d-none"
            );


            displayListings(
                allListings
            );

        }
    );

}


// =====================================================
// FIRESTORE TIMESTAMP
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


    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    if (
        typeof timestamp ===
        "number"
    ) {

        return timestamp;

    }


    return 0;

}


// =====================================================
// PRICE
// =====================================================

function formatPrice(
    price
) {

    if (
        price === undefined ||
        price === null ||
        price === ""
    ) {

        return "$0.00";

    }


    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(
        Number(price)
    );

}


// =====================================================
// FIREBASE ERROR
// =====================================================

function firebaseErrorMessage(
    error
) {

    switch (
        error.code
    ) {

        case "auth/invalid-credential":
            return "Incorrect email or password.";

        case "auth/invalid-email":
            return "Please enter a valid email address.";

        case "auth/email-already-in-use":
            return "An account already exists with this email.";

        case "auth/weak-password":
            return "Password must contain at least 6 characters.";

        case "auth/operation-not-allowed":
            return "Email/password authentication is not enabled in Firebase.";

        case "auth/too-many-requests":
            return "Too many attempts. Please try again later.";

        default:
            return error.message ||
                "Something went wrong.";

    }

}


// =====================================================
// ERROR DISPLAY
// =====================================================

function showLoginError(
    message
) {

    loginError.textContent =
        message;

    loginError.classList.remove(
        "d-none"
    );

}


function hideLoginError() {

    loginError.textContent =
        "";

    loginError.classList.add(
        "d-none"
    );

}


function showSignupError(
    message
) {

    signupError.textContent =
        message;

    signupError.classList.remove(
        "d-none"
    );

}


function hideSignupError() {

    signupError.textContent =
        "";

    signupError.classList.add(
        "d-none"
    );

}


// =====================================================
// CLOSE MODAL
// =====================================================

function closeModal(
    id
) {

    const element =
        document.getElementById(
            id
        );


    if (!element) {

        return;

    }


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        const modal =
            bootstrap.Modal.getInstance(
                element
            );


        if (modal) {

            modal.hide();

        }

    }

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


// =====================================================
// START
// =====================================================

loadListings();