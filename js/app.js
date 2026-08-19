// =====================================================
// FIREBASE
// =====================================================

import {
    auth,
    db
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const listingsContainer =
    document.getElementById(
        "listingsContainer"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const searchButton =
    document.getElementById(
        "searchButton"
    );


const loginButton =
    document.getElementById(
        "loginButton"
    );


const signupButton =
    document.getElementById(
        "signupButton"
    );


const sellButton =
    document.getElementById(
        "sellButton"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// =====================================================
// DATA
// =====================================================

let allListings = [];


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            // -----------------------------------------
            // USER IS LOGGED IN
            // -----------------------------------------

            if (loginButton) {

                loginButton.classList.add(
                    "d-none"
                );

            }


            if (signupButton) {

                signupButton.classList.add(
                    "d-none"
                );

            }


            if (sellButton) {

                sellButton.classList.remove(
                    "d-none"
                );

            }


            if (logoutButton) {

                logoutButton.classList.remove(
                    "d-none"
                );

            }

        }

        else {

            // -----------------------------------------
            // USER IS LOGGED OUT
            // -----------------------------------------

            if (loginButton) {

                loginButton.classList.remove(
                    "d-none"
                );

            }


            if (signupButton) {

                signupButton.classList.remove(
                    "d-none"
                );

            }


            if (sellButton) {

                sellButton.classList.add(
                    "d-none"
                );

            }


            if (logoutButton) {

                logoutButton.classList.add(
                    "d-none"
                );

            }

        }

    }
);


// =====================================================
// LOAD LISTINGS
// =====================================================

async function loadListings() {

    console.log(
        "Loading marketplace listings..."
    );


    try {

        const listingsReference =
            collection(
                db,
                "listings"
            );


        /*
         * We only retrieve listings that are active.
         *
         * We intentionally do not use orderBy()
         * so Firestore does not require an index.
         */

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
            "Marketplace listings found:",
            snapshot.size
        );


        allListings = [];


        snapshot.forEach(
            (documentSnapshot) => {

                allListings.push({

                    id:
                        documentSnapshot.id,

                    ...documentSnapshot.data()

                });

            }
        );


        // ---------------------------------------------
        // SORT NEWEST FIRST
        // ---------------------------------------------

        allListings.sort(
            (a, b) => {

                return (
                    getTimestampValue(
                        b.createdAt
                    )
                    -
                    getTimestampValue(
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
            "Error loading marketplace:",
            error
        );


        listingsContainer.innerHTML = `

            <div
                class="col-12 text-center py-5"
            >

                <div
                    class="alert alert-danger"
                >

                    <i
                        class="bi bi-exclamation-triangle me-2"
                    ></i>

                    Unable to load marketplace listings.

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

    listingsContainer.innerHTML =
        "";


    // ---------------------------------------------
    // NO RESULTS
    // ---------------------------------------------

    if (
        listings.length === 0
    ) {

        listingsContainer.innerHTML = `

            <div
                class="col-12 text-center py-5"
            >

                <div
                    class="d-flex align-items-center justify-content-center rounded-circle mx-auto mb-3"
                    style="
                        width: 75px;
                        height: 75px;
                        background-color: #f0efff;
                        color: #635bff;
                    "
                >

                    <i
                        class="bi bi-search fs-2"
                    ></i>

                </div>


                <h5 class="fw-bold">

                    No items found

                </h5>


                <p
                    class="text-secondary"
                >

                    Try another search.

                </p>

            </div>

        `;


        return;

    }


    // ---------------------------------------------
    // CREATE PRODUCT CARDS
    // ---------------------------------------------

    listings.forEach(
        (item) => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "col-sm-6 col-lg-4 col-xl-3";


            // -----------------------------------------
            // IMAGE
            // -----------------------------------------

            let image =
                "https://placehold.co/600x450/e9f1fb/172033?text=No+Image";


            if (
                Array.isArray(
                    item.images
                ) &&
                item.images.length > 0
            ) {

                image =
                    item.images[0];

            }


            // -----------------------------------------
            // CARD
            // -----------------------------------------

            column.innerHTML = `

                <a
                    href="item-detail.html?id=${encodeURIComponent(item.id)}"
                    class="text-decoration-none text-dark"
                >

                    <div
                        class="card border-0 shadow-sm rounded-4 overflow-hidden h-100"
                    >

                        <!-- IMAGE -->

                        <img
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(item.name || "Item")}"
                            class="card-img-top"
                            style="
                                height: 220px;
                                object-fit: cover;
                            "
                            onerror="
                                this.src='https://placehold.co/600x450/e9f1fb/172033?text=Image+Unavailable'
                            "
                        >


                        <!-- CARD BODY -->

                        <div
                            class="card-body p-3"
                        >

                            <!-- CATEGORY -->

                            <div
                                class="small text-secondary mb-1"
                            >

                                ${escapeHTML(
                                    item.category ||
                                    ""
                                )}

                            </div>


                            <!-- NAME -->

                            <h5
                                class="card-title fw-bold mb-2"
                            >

                                ${escapeHTML(
                                    item.name ||
                                    "Untitled"
                                )}

                            </h5>


                            <!-- PRICE -->

                            <div
                                class="fs-5 fw-bold mb-2"
                            >

                                ${formatPrice(
                                    item.price
                                )}

                            </div>


                            <!-- SCHOOL -->

                            <div
                                class="small text-secondary"
                            >

                                <i
                                    class="bi bi-mortarboard me-1"
                                ></i>

                                ${escapeHTML(
                                    item.school ||
                                    "School not specified"
                                )}

                            </div>


                            <!-- LOCATION -->

                            <div
                                class="small text-secondary mt-1"
                            >

                                <i
                                    class="bi bi-geo-alt me-1"
                                ></i>

                                ${escapeHTML(
                                    item.location ||
                                    "Location not specified"
                                )}

                            </div>

                        </div>

                    </div>

                </a>

            `;


            listingsContainer.appendChild(
                column
            );

        }
    );

}


// =====================================================
// SEARCH
// =====================================================

function performSearch() {

    const searchTerm =
        searchInput.value
            .trim()
            .toLowerCase();


    // ---------------------------------------------
    // SHOW EVERYTHING IF EMPTY
    // ---------------------------------------------

    if (!searchTerm) {

        displayListings(
            allListings
        );

        return;

    }


    // ---------------------------------------------
    // SEARCH
    // ---------------------------------------------

    const results =
        allListings.filter(
            (item) => {

                const searchableText = `

                    ${item.name || ""}

                    ${item.category || ""}

                    ${item.school || ""}

                    ${item.location || ""}

                    ${item.description || ""}

                    ${item.condition || ""}

                `.toLowerCase();


                return searchableText.includes(
                    searchTerm
                );

            }
        );


    console.log(
        "Search results:",
        results.length
    );


    displayListings(
        results
    );

}


// =====================================================
// SEARCH BUTTON
// =====================================================

if (searchButton) {

    searchButton.addEventListener(
        "click",
        () => {

            performSearch();

        }
    );

}


// =====================================================
// SEARCH AS USER TYPES
// =====================================================

if (searchInput) {

    searchInput.addEventListener(
        "input",
        () => {

            performSearch();

        }
    );


    // ---------------------------------------------
    // ENTER KEY
    // ---------------------------------------------

    searchInput.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                performSearch();

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


                window.location.reload();

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }

        }
    );

}


// =====================================================
// TIMESTAMP
// =====================================================

function getTimestampValue(
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
// HTML ESCAPE
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
// START MARKETPLACE
// =====================================================

loadListings();