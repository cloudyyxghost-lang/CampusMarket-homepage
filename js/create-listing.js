// =====================================================
// IMPORT FIREBASE
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
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// ELEMENTS
// =====================================================

const form =
    document.getElementById(
        "createListingForm"
    );


const imageUrlInput =
    document.getElementById(
        "imageUrlInput"
    );


const addImageButton =
    document.getElementById(
        "addImageButton"
    );


const imagePreviewContainer =
    document.getElementById(
        "imagePreviewContainer"
    );


const imageCount =
    document.getElementById(
        "imageCount"
    );


const createError =
    document.getElementById(
        "createError"
    );


const createSuccess =
    document.getElementById(
        "createSuccess"
    );


const publishButton =
    document.getElementById(
        "publishButton"
    );


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;


// =====================================================
// IMAGE URL ARRAY
// =====================================================

let imageURLs = [];


// =====================================================
// MAXIMUM NUMBER OF IMAGES
// =====================================================

const MAX_IMAGES = 8;


// =====================================================
// AUTHENTICATION
// =====================================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            window.location.href =
                "index.html";

            return;

        }


        currentUser = user;

    }
);


// =====================================================
// ADD IMAGE BUTTON
// =====================================================

addImageButton.addEventListener(
    "click",
    () => {

        addImage();

    }
);


// =====================================================
// PRESS ENTER TO ADD IMAGE
// =====================================================

imageUrlInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            addImage();

        }

    }
);


// =====================================================
// ADD IMAGE
// =====================================================

function addImage() {

    clearMessages();


    // ---------------------------------------------
    // GET URL
    // ---------------------------------------------

    const url =
        imageUrlInput.value.trim();


    // ---------------------------------------------
    // CHECK EMPTY
    // ---------------------------------------------

    if (!url) {

        showError(
            "Please enter an image URL."
        );

        return;

    }


    // ---------------------------------------------
    // CHECK MAXIMUM
    // ---------------------------------------------

    if (
        imageURLs.length >= MAX_IMAGES
    ) {

        showError(
            "You can add a maximum of 8 images."
        );

        return;

    }


    // ---------------------------------------------
    // CHECK DUPLICATE
    // ---------------------------------------------

    if (
        imageURLs.includes(url)
    ) {

        showError(
            "You already added this image."
        );

        return;

    }


    // ---------------------------------------------
    // BASIC URL VALIDATION
    // ---------------------------------------------

    let parsedURL;


    try {

        parsedURL =
            new URL(url);

    }

    catch (error) {

        showError(
            "Please enter a valid image URL."
        );

        return;

    }


    // ---------------------------------------------
    // ONLY HTTP / HTTPS
    // ---------------------------------------------

    if (
        parsedURL.protocol !== "http:" &&
        parsedURL.protocol !== "https:"
    ) {

        showError(
            "Image URL must start with http:// or https://."
        );

        return;

    }


    // ---------------------------------------------
    // TEST THE IMAGE
    // ---------------------------------------------

    const testImage =
        new Image();


    testImage.onload =
        () => {

            // -----------------------------------------
            // IMAGE IS VALID
            // -----------------------------------------

            imageURLs.push(
                url
            );


            imageUrlInput.value =
                "";


            renderImages();


            updateImageCount();


            clearMessages();

        };


    testImage.onerror =
        () => {

            showError(
                "We could not load that image. Please check the URL and make sure it points directly to an image."
            );

        };


    // ---------------------------------------------
    // START LOADING IMAGE
    // ---------------------------------------------

    testImage.src =
        url;

}


// =====================================================
// DISPLAY IMAGES
// =====================================================

function renderImages() {

    imagePreviewContainer.innerHTML =
        "";


    imageURLs.forEach(
        (url, index) => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "col-6 col-md-4";


            column.innerHTML = `

                <div
                    class="card border shadow-sm h-100 overflow-hidden"
                >

                    <div
                        class="position-relative"
                    >

                        <img
                            src="${escapeHTML(url)}"
                            alt="Product image ${index + 1}"
                            class="card-img-top"
                            style="
                                height: 150px;
                                object-fit: cover;
                            "
                        >


                        <span
                            class="position-absolute top-0 start-0 m-2 badge bg-dark"
                        >

                            ${index + 1}

                        </span>

                    </div>


                    <div
                        class="card-body p-2"
                    >

                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger w-100 remove-image-button"
                            data-index="${index}"
                        >

                            <i
                                class="bi bi-trash me-1"
                            ></i>

                            Remove

                        </button>

                    </div>

                </div>

            `;


            imagePreviewContainer.appendChild(
                column
            );

        }
    );


    // =================================================
    // REMOVE BUTTONS
    // =================================================

    const removeButtons =
        document.querySelectorAll(
            ".remove-image-button"
        );


    removeButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset.index
                        );


                    imageURLs.splice(
                        index,
                        1
                    );


                    renderImages();


                    updateImageCount();

                }
            );

        }
    );

}


// =====================================================
// UPDATE IMAGE COUNT
// =====================================================

function updateImageCount() {

    imageCount.textContent =
        `${imageURLs.length} / ${MAX_IMAGES} images`;

}


// =====================================================
// FORM SUBMISSION
// =====================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        clearMessages();


        // ---------------------------------------------
        // CHECK AUTHENTICATION
        // ---------------------------------------------

        if (!currentUser) {

            showError(
                "You must be logged in to create a listing."
            );

            return;

        }


        // ---------------------------------------------
        // CHECK IMAGES
        // ---------------------------------------------

        if (
            imageURLs.length === 0
        ) {

            showError(
                "Please add at least one image."
            );

            return;

        }


        // ---------------------------------------------
        // GET FORM VALUES
        // ---------------------------------------------

        const name =
            document
                .getElementById(
                    "itemName"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "description"
                )
                .value
                .trim();


        const priceValue =
            document
                .getElementById(
                    "price"
                )
                .value;


        const price =
            Number(
                priceValue
            );


        const status =
            document
                .getElementById(
                    "status"
                )
                .value;


        const school =
            document
                .getElementById(
                    "school"
                )
                .value
                .trim();


        const category =
            document
                .getElementById(
                    "category"
                )
                .value;


        const condition =
            document
                .getElementById(
                    "condition"
                )
                .value;


        const location =
            document
                .getElementById(
                    "location"
                )
                .value
                .trim();


        const pickup =
            document
                .getElementById(
                    "pickup"
                )
                .value
                .trim();


        // ---------------------------------------------
        // VALIDATION
        // ---------------------------------------------

        if (!name) {

            showError(
                "Please enter an item name."
            );

            return;

        }


        if (!description) {

            showError(
                "Please enter item details."
            );

            return;

        }


        if (
            priceValue === "" ||
            isNaN(price) ||
            price < 0
        ) {

            showError(
                "Please enter a valid price."
            );

            return;

        }


        if (!school) {

            showError(
                "Please enter your school."
            );

            return;

        }


        if (!category) {

            showError(
                "Please select a category."
            );

            return;

        }


        if (!condition) {

            showError(
                "Please select the item's condition."
            );

            return;

        }


        if (!location) {

            showError(
                "Please enter a location."
            );

            return;

        }


        // ---------------------------------------------
        // DISABLE BUTTON
        // ---------------------------------------------

        publishButton.disabled =
            true;


        publishButton.innerHTML = `

            <span
                class="spinner-border spinner-border-sm me-2"
            ></span>

            Creating Listing...

        `;


        try {

            // =================================================
            // FIRESTORE LISTING
            // =================================================

            const listingData = {

                // Seller information
                sellerId:
                    currentUser.uid,

                sellerEmail:
                    currentUser.email || "",


                // Item information
                name:
                    name,

                description:
                    description,

                price:
                    price,

                category:
                    category,

                condition:
                    condition,


                // Location
                school:
                    school,

                location:
                    location,

                pickup:
                    pickup,


                // Listing status
                status:
                    status,


                // IMAGE URLS
                images:
                    imageURLs,


                // Timestamp
                createdAt:
                    serverTimestamp()

            };


            // =================================================
            // ADD TO FIRESTORE
            // =================================================

            const listingReference =
                await addDoc(
                    collection(
                        db,
                        "listings"
                    ),
                    listingData
                );


            console.log(
                "Listing successfully created:",
                listingReference.id
            );


            // =================================================
            // SUCCESS
            // =================================================

            showSuccess(
                "Your listing has been created successfully."
            );


            // =================================================
            // REDIRECT
            // =================================================

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
                "Error creating listing:",
                error
            );


            showError(
                "Something went wrong while creating your listing. Please try again."
            );


            resetButton();

        }

    }
);


// =====================================================
// SHOW ERROR
// =====================================================

function showError(
    message
) {

    createError.textContent =
        message;


    createError.classList.remove(
        "d-none"
    );

}


// =====================================================
// SHOW SUCCESS
// =====================================================

function showSuccess(
    message
) {

    createSuccess.textContent =
        message;


    createSuccess.classList.remove(
        "d-none"
    );

}


// =====================================================
// CLEAR MESSAGES
// =====================================================

function clearMessages() {

    createError.classList.add(
        "d-none"
    );


    createSuccess.classList.add(
        "d-none"
    );

}


// =====================================================
// RESET BUTTON
// =====================================================

function resetButton() {

    publishButton.disabled =
        false;


    publishButton.innerHTML = `

        Continue

        <i
            class="bi bi-arrow-right ms-2"
        ></i>

    `;

}


// =====================================================
// BASIC HTML ESCAPING
// =====================================================

function escapeHTML(
    value
) {

    return value
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
// INITIAL IMAGE COUNT
// =====================================================

updateImageCount();