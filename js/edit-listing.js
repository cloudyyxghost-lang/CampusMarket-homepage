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
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// GET LISTING ID
// =====================================================

const params =
    new URLSearchParams(
        window.location.search
    );

const listingId =
    params.get("id");


// =====================================================
// ELEMENTS
// =====================================================

const form =
    document.getElementById(
        "editListingForm"
    );

const itemName =
    document.getElementById(
        "itemName"
    );

const category =
    document.getElementById(
        "category"
    );

const price =
    document.getElementById(
        "price"
    );

const condition =
    document.getElementById(
        "condition"
    );

const locationInput =
    document.getElementById(
        "location"
    );

const description =
    document.getElementById(
        "description"
    );

const imageUrl =
    document.getElementById(
        "imageUrl"
    );

const status =
    document.getElementById(
        "status"
    );

const imagePreview =
    document.getElementById(
        "imagePreview"
    );

const imagePreviewContainer =
    document.getElementById(
        "imagePreviewContainer"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const successMessage =
    document.getElementById(
        "successMessage"
    );

const saveButton =
    document.getElementById(
        "saveButton"
    );


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


        if (!listingId) {

            showError(
                "No listing ID was provided."
            );

            return;

        }


        await loadListing(
            user
        );

    }
);


// =====================================================
// LOAD LISTING
// =====================================================

async function loadListing(
    user
) {

    try {

        const listingReference =
            doc(
                db,
                "listings",
                listingId
            );


        const snapshot =
            await getDoc(
                listingReference
            );


        if (!snapshot.exists()) {

            showError(
                "This listing does not exist."
            );

            return;

        }


        const listing =
            snapshot.data();


        // =============================================
        // SECURITY
        // =============================================

        if (
            listing.sellerId &&
            listing.sellerId !== user.uid
        ) {

            showError(
                "You can only edit your own listings."
            );

            form.style.display =
                "none";

            return;

        }


        // =============================================
        // FILL FORM
        // =============================================

        itemName.value =
            listing.name ||
            listing.itemName ||
            "";


        category.value =
            listing.category ||
            "";


        price.value =
            listing.price ||
            "";


        condition.value =
            listing.condition ||
            "";


        locationInput.value =
            listing.location ||
            "";


        description.value =
            listing.description ||
            listing.details ||
            "";


        status.value =
            listing.status ||
            "active";


        // =============================================
        // IMAGE
        // =============================================

        let existingImage = "";


        if (
            Array.isArray(
                listing.images
            )

            &&

            listing.images.length > 0
        ) {

            existingImage =
                listing.images[0];

        }

        else if (
            listing.imageUrl
        ) {

            existingImage =
                listing.imageUrl;

        }

        else if (
            listing.image
        ) {

            existingImage =
                listing.image;

        }


        imageUrl.value =
            existingImage;


        showImagePreview(
            existingImage
        );

    }

    catch (error) {

        console.error(
            "LOAD LISTING ERROR:",
            error
        );

        showError(
            error.message
        );

    }

}


// =====================================================
// IMAGE PREVIEW
// =====================================================

imageUrl.addEventListener(
    "input",
    () => {

        showImagePreview(
            imageUrl.value.trim()
        );

    }
);


function showImagePreview(
    url
) {

    if (!url) {

        imagePreviewContainer
            .classList
            .add("d-none");

        return;

    }


    imagePreview.src =
        url;


    imagePreview.onload =
        () => {

            imagePreviewContainer
                .classList
                .remove("d-none");

        };


    imagePreview.onerror =
        () => {

            imagePreviewContainer
                .classList
                .add("d-none");

        };

}


// =====================================================
// SAVE CHANGES
// =====================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        try {

            saveButton.disabled =
                true;


            saveButton.innerHTML = `

                <span
                    class="spinner-border spinner-border-sm me-2"
                ></span>

                Saving...

            `;


            const newImage =
                imageUrl.value.trim();


            const updatedListing = {

                name:
                    itemName.value.trim(),

                category:
                    category.value,

                price:
                    Number(
                        price.value
                    ),

                condition:
                    condition.value,

                location:
                    locationInput.value.trim(),

                description:
                    description.value.trim(),

                status:
                    status.value,

                images:
                    newImage
                        ? [newImage]
                        : []

            };


            const listingReference =
                doc(
                    db,
                    "listings",
                    listingId
                );


            await updateDoc(
                listingReference,
                updatedListing
            );


            successMessage.textContent =
                "Listing updated successfully!";


            successMessage.classList.remove(
                "d-none"
            );


            saveButton.innerHTML = `

                <i class="bi bi-check-lg"></i>

                Saved

            `;


            setTimeout(
                () => {

                    window.location.href =
                        "seller-dashboard.html";

                },
                1000
            );

        }

        catch (error) {

            console.error(
                "UPDATE LISTING ERROR:",
                error
            );


            showError(
                error.message
            );


            saveButton.disabled =
                false;


            saveButton.innerHTML = `

                <i class="bi bi-check-lg"></i>

                Save Changes

            `;

        }

    }
);


// =====================================================
// ERROR
// =====================================================

function showError(
    message
) {

    errorMessage.textContent =
        message;


    errorMessage.classList.remove(
        "d-none"
    );

}