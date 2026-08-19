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
    query,
    where,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const listingTableBody =
    document.getElementById(
        "listingTableBody"
    );


const emptyListings =
    document.getElementById(
        "emptyListings"
    );


const totalListings =
    document.getElementById(
        "totalListings"
    );


const activeListings =
    document.getElementById(
        "activeListings"
    );


const soldListings =
    document.getElementById(
        "soldListings"
    );


const listingSearch =
    document.getElementById(
        "listingSearch"
    );


const logoutButton =
    document.getElementById(
        "logoutButton"
    );


const filterButtons =
    document.querySelectorAll(
        ".filter-button"
    );


// =====================================================
// VARIABLES
// =====================================================

let myListings = [];

let currentFilter = "all";


// =====================================================
// CHECK LOGIN
// =====================================================

onAuthStateChanged(
    auth,
    async (user) => {

        console.log(
            "Authentication state:",
            user
        );


        if (!user) {

            console.log(
                "No user is logged in."
            );


            window.location.href =
                "index.html";


            return;

        }


        console.log(
            "Logged-in user ID:",
            user.uid
        );


        console.log(
            "Logged-in email:",
            user.email
        );


        await loadMyListings(
            user.uid
        );

    }
);


// =====================================================
// LOAD SELLER LISTINGS
// =====================================================

async function loadMyListings(
    userId
) {

    console.log(
        "Loading listings for:",
        userId
    );


    try {

        // ---------------------------------------------
        // Reference to listings collection
        // ---------------------------------------------

        const listingsReference =
            collection(
                db,
                "listings"
            );


        // ---------------------------------------------
        // ONLY FILTER BY SELLER ID
        //
        // We intentionally removed orderBy()
        // so you don't need a Firestore index.
        // ---------------------------------------------

        const listingsQuery =
            query(
                listingsReference,

                where(
                    "sellerId",
                    "==",
                    userId
                )
            );


        console.log(
            "Running Firestore query..."
        );


        // ---------------------------------------------
        // GET DOCUMENTS
        // ---------------------------------------------

        const snapshot =
            await getDocs(
                listingsQuery
            );


        console.log(
            "Firestore documents found:",
            snapshot.size
        );


        // ---------------------------------------------
        // CLEAR CURRENT LIST
        // ---------------------------------------------

        myListings = [];


        // ---------------------------------------------
        // READ DOCUMENTS
        // ---------------------------------------------

        snapshot.forEach(
            (documentSnapshot) => {

                const data =
                    documentSnapshot.data();


                console.log(
                    "Listing found:",
                    documentSnapshot.id,
                    data
                );


                myListings.push({

                    id:
                        documentSnapshot.id,

                    ...data

                });

            }
        );


        // ---------------------------------------------
        // SORT BY DATE IN JAVASCRIPT
        // ---------------------------------------------

        myListings.sort(
            (a, b) => {

                const dateA =
                    getTimestampValue(
                        a.createdAt
                    );


                const dateB =
                    getTimestampValue(
                        b.createdAt
                    );


                return dateB - dateA;

            }
        );


        // ---------------------------------------------
        // UPDATE DASHBOARD
        // ---------------------------------------------

        updateStatistics();


        displayListings(
            myListings
        );

    }

    catch (error) {

        console.error(
            "================================="
        );


        console.error(
            "ERROR LOADING SELLER LISTINGS"
        );


        console.error(
            error
        );


        console.error(
            "================================="
        );


        // ---------------------------------------------
        // Show error to user
        // ---------------------------------------------

        emptyListings.classList.remove(
            "d-none"
        );


        emptyListings.innerHTML = `

            <div class="py-4">

                <i
                    class="bi bi-exclamation-triangle fs-1 text-danger"
                ></i>


                <h5 class="fw-bold mt-3">

                    Unable to load your listings

                </h5>


                <p class="text-secondary">

                    Please check the browser console
                    for the Firebase error.

                </p>

            </div>

        `;

    }

}


// =====================================================
// CONVERT FIRESTORE TIMESTAMP
// =====================================================

function getTimestampValue(
    timestamp
) {

    if (!timestamp) {

        return 0;

    }


    // Firestore Timestamp

    if (
        typeof timestamp.toMillis ===
        "function"
    ) {

        return timestamp.toMillis();

    }


    // JavaScript Date

    if (
        timestamp instanceof Date
    ) {

        return timestamp.getTime();

    }


    // Number

    if (
        typeof timestamp ===
        "number"
    ) {

        return timestamp;

    }


    return 0;

}


// =====================================================
// UPDATE STATISTICS
// =====================================================

function updateStatistics() {

    const total =
        myListings.length;


    const active =
        myListings.filter(
            (item) =>
                item.status === "active"
        ).length;


    const sold =
        myListings.filter(
            (item) =>
                item.status === "sold"
        ).length;


    totalListings.textContent =
        total;


    activeListings.textContent =
        active;


    soldListings.textContent =
        sold;


    console.log(
        "Statistics:",
        {
            total,
            active,
            sold
        }
    );

}


// =====================================================
// DISPLAY LISTINGS
// =====================================================

function displayListings(
    listings
) {

    listingTableBody.innerHTML =
        "";


    // ---------------------------------------------
    // APPLY STATUS FILTER
    // ---------------------------------------------

    let filteredListings =
        listings;


    if (
        currentFilter !==
        "all"
    ) {

        filteredListings =
            listings.filter(
                (item) =>
                    item.status ===
                    currentFilter
            );

    }


    // ---------------------------------------------
    // NO RESULTS
    // ---------------------------------------------

    if (
        filteredListings.length ===
        0
    ) {

        emptyListings.classList.remove(
            "d-none"
        );


        emptyListings.innerHTML = `

            <div class="py-4">

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
                        class="bi bi-box-seam fs-2"
                    ></i>

                </div>


                <h5 class="fw-bold">

                    No products yet

                </h5>


                <p class="text-secondary mb-4">

                    Create your first listing
                    and start selling.

                </p>


                <a
                    href="create-listing.html"
                    class="btn text-white rounded-3 px-4"
                    style="
                        background-color: #635bff;
                    "
                >

                    <i
                        class="bi bi-plus-lg me-2"
                    ></i>

                    Add Product

                </a>

            </div>

        `;


        return;

    }


    // ---------------------------------------------
    // HIDE EMPTY MESSAGE
    // ---------------------------------------------

    emptyListings.classList.add(
        "d-none"
    );


    // ---------------------------------------------
    // CREATE TABLE ROWS
    // ---------------------------------------------

    filteredListings.forEach(
        (item) => {

            const row =
                document.createElement(
                    "tr"
                );


            // -----------------------------------------
            // IMAGE
            // -----------------------------------------

            let image =
                "https://placehold.co/70x70/e9f1fb/172033?text=No+Image";


            if (
                Array.isArray(
                    item.images
                ) &&
                item.images.length >
                0
            ) {

                image =
                    item.images[0];

            }


            // -----------------------------------------
            // ROW
            // -----------------------------------------

            row.innerHTML = `

                <!-- PRODUCT -->

                <td class="px-4">

                    <div
                        class="d-flex align-items-center gap-3"
                    >

                        <img
                            src="${escapeHTML(image)}"
                            alt="${escapeHTML(item.name || "Product")}"
                            class="rounded-3 border"
                            style="
                                width: 58px;
                                height: 58px;
                                object-fit: cover;
                            "
                        >


                        <div>

                            <div class="fw-semibold">

                                ${escapeHTML(
                                    item.name ||
                                    "Untitled"
                                )}

                            </div>


                            <div
                                class="small text-secondary"
                            >

                                ${escapeHTML(
                                    item.condition ||
                                    ""
                                )}

                            </div>

                        </div>

                    </div>

                </td>


                <!-- CATEGORY -->

                <td>

                    ${escapeHTML(
                        item.category ||
                        "-"
                    )}

                </td>


                <!-- PRICE -->

                <td>

                    <strong>

                        ${formatPrice(
                            item.price
                        )}

                    </strong>

                </td>


                <!-- STATUS -->

                <td>

                    ${getStatusBadge(
                        item.status
                    )}

                </td>


                <!-- SCHOOL -->

                <td>

                    ${escapeHTML(
                        item.school ||
                        "-"
                    )}

                </td>


                <!-- ACTIONS -->

                <td class="text-end px-4">

                    <!-- VIEW -->

                    <a
                        href="item-detail.html?id=${encodeURIComponent(item.id)}"
                        class="btn btn-sm btn-outline-secondary me-1"
                        title="View listing"
                    >

                        <i
                            class="bi bi-eye"
                        ></i>

                    </a>


                    <!-- EDIT -->

                    <a
                        href="edit-listing.html?id=${encodeURIComponent(item.id)}"
                        class="btn btn-sm btn-outline-secondary me-1"
                        title="Edit listing"
                    >

                        <i
                            class="bi bi-pencil"
                        ></i>

                    </a>


                    <!-- DELETE -->

                    <button
                        type="button"
                        class="btn btn-sm btn-outline-danger delete-button"
                        data-id="${item.id}"
                        title="Delete listing"
                    >

                        <i
                            class="bi bi-trash"
                        ></i>

                    </button>

                </td>

            `;


            listingTableBody.appendChild(
                row
            );

        }
    );


    // =================================================
    // DELETE BUTTONS
    // =================================================

    const deleteButtons =
        document.querySelectorAll(
            ".delete-button"
        );


    deleteButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    await deleteListing(
                        button.dataset.id
                    );

                }
            );

        }
    );

}


// =====================================================
// DELETE LISTING
// =====================================================

async function deleteListing(
    listingId
) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this listing?"
        );


    if (!confirmed) {

        return;

    }


    try {

        await deleteDoc(
            doc(
                db,
                "listings",
                listingId
            )
        );


        console.log(
            "Listing deleted:",
            listingId
        );


        // Remove locally

        myListings =
            myListings.filter(
                item =>
                    item.id !==
                    listingId
            );


        updateStatistics();


        displayListings(
            myListings
        );

    }

    catch (error) {

        console.error(
            "Error deleting listing:",
            error
        );


        alert(
            "Unable to delete the listing."
        );

    }

}


// =====================================================
// STATUS BADGE
// =====================================================

function getStatusBadge(
    status
) {

    if (
        status === "sold"
    ) {

        return `

            <span
                class="badge bg-secondary rounded-pill"
            >

                Sold

            </span>

        `;

    }


    if (
        status === "draft"
    ) {

        return `

            <span
                class="badge bg-warning text-dark rounded-pill"
            >

                Draft

            </span>

        `;

    }


    if (
        status === "inactive"
    ) {

        return `

            <span
                class="badge bg-light text-dark border rounded-pill"
            >

                Inactive

            </span>

        `;

    }


    return `

        <span
            class="badge bg-success rounded-pill"
        >

            Active

        </span>

    `;

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
// SEARCH
// =====================================================

listingSearch.addEventListener(
    "input",
    () => {

        const search =
            listingSearch.value
                .trim()
                .toLowerCase();


        const results =
            myListings.filter(
                (item) => {

                    const searchableText = `

                        ${item.name || ""}

                        ${item.category || ""}

                        ${item.school || ""}

                        ${item.description || ""}

                        ${item.location || ""}

                    `.toLowerCase();


                    return searchableText.includes(
                        search
                    );

                }
            );


        displayListings(
            results
        );

    }
);


// =====================================================
// FILTERS
// =====================================================

filterButtons.forEach(
    (button) => {

        button.addEventListener(
            "click",
            () => {

                currentFilter =
                    button.dataset.filter;


                // Reset buttons

                filterButtons.forEach(
                    (btn) => {

                        btn.classList.remove(
                            "btn-dark"
                        );


                        btn.classList.add(
                            "btn-outline-secondary"
                        );

                    }
                );


                // Activate clicked button

                button.classList.remove(
                    "btn-outline-secondary"
                );


                button.classList.add(
                    "btn-dark"
                );


                displayListings(
                    myListings
                );

            }
        );

    }
);


// =====================================================
// LOGOUT
// =====================================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(
                auth
            );


            window.location.href =
                "index.html";

        }

        catch (error) {

            console.error(
                "Logout failed:",
                error
            );

        }

    }
);


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