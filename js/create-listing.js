// =====================================================
// CAMPUSMARKET
// CREATE LISTING
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
    doc,
    getDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


// =====================================================
// HTML ELEMENTS
// =====================================================

const listingForm =
    document.getElementById(
        "listingForm"
    );


const itemImageURL =
    document.getElementById(
        "itemImageURL"
    );


const imagePreview =
    document.getElementById(
        "imagePreview"
    );


const imagePlaceholder =
    document.getElementById(
        "imagePlaceholder"
    );


const sellerNameDisplay =
    document.getElementById(
        "sellerNameDisplay"
    );


const sellerSchoolDisplay =
    document.getElementById(
        "sellerSchoolDisplay"
    );


const listingError =
    document.getElementById(
        "listingError"
    );


const listingSuccess =
    document.getElementById(
        "listingSuccess"
    );


const createListingButton =
    document.getElementById(
        "createListingButton"
    );


// =====================================================
// CURRENT USER
// =====================================================

let currentUser = null;

let currentUserProfile = null;


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


        // =============================================
        // NOT LOGGED IN
        // =============================================

        if (!user) {

            console.log(
                "No user logged in."
            );


            window.location.href =
                "index.html";


            return;

        }


        // =============================================
        // SAVE CURRENT USER
        // =============================================

        currentUser =
            user;


        console.log(
            "Current user:",
            currentUser.uid
        );


        // =============================================
        // LOAD USER PROFILE
        // =============================================

        await loadUserProfile();

    }
);


// =====================================================
// LOAD USER PROFILE
// =====================================================

async function loadUserProfile() {

    try {

        const userReference =
            doc(
                db,
                "users",
                currentUser.uid
            );


        const userSnapshot =
            await getDoc(
                userReference
            );


        if (
            !userSnapshot.exists()
        ) {

            showError(
                "Your user profile could not be found."
            );


            return;

        }


        currentUserProfile =
            userSnapshot.data();


        console.log(
            "User profile:",
            currentUserProfile
        );


        // =============================================
        // DISPLAY SELLER INFORMATION
        // =============================================

        const sellerName =
            currentUserProfile.sellerName ||
            "Seller";


        const school =
            currentUserProfile.school ||
            "School not specified";


        sellerNameDisplay.textContent =
            sellerName;


        sellerSchoolDisplay.textContent =
            school;

    }

    catch (error) {

        console.error(
            "USER PROFILE ERROR:",
            error
        );


        showError(
            "Unable to load your seller profile."
        );

    }

}


// =====================================================
// IMAGE PREVIEW
// =====================================================

itemImageURL.addEventListener(
    "input",
    () => {

        const url =
            itemImageURL.value.trim();


        // =============================================
        // NO URL
        // =============================================

        if (!url) {

            imagePreview.src =
                "";


            imagePreview.classList.add(
                "d-none"
            );


            imagePlaceholder.classList.remove(
                "d-none"
            );


            return;

        }


        // =============================================
        // SHOW IMAGE
        // =============================================

        imagePreview.src =
            url;


        imagePreview.classList.remove(
            "d-none"
        );


        imagePlaceholder.classList.add(
            "d-none"
        );

    }
);


// =====================================================
// IMAGE ERROR
// =====================================================

imagePreview.addEventListener(
    "error",
    () => {

        console.error(
            "Image could not be loaded:",
            itemImageURL.value
        );


        imagePreview.classList.add(
            "d-none"
        );


        imagePlaceholder.classList.remove(
            "d-none"
        );


        showError(
            "The image URL could not be loaded. Make sure you pasted a direct image URL."
        );

    }
);


// =====================================================
// IMAGE LOADED
// =====================================================

imagePreview.addEventListener(
    "load",
    () => {

        hideError();

    }
);


// =====================================================
// CREATE LISTING
// =====================================================

listingForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        hideError();

        hideSuccess();


        // =============================================
        // CHECK AUTHENTICATION
        // =============================================

        if (!currentUser) {

            showError(
                "Please log in before creating a listing."
            );


            return;

        }


        // =============================================
        // CHECK USER PROFILE
        // =============================================

        if (!currentUserProfile) {

            showError(
                "Your seller profile is still loading. Please try again."
            );


            return;

        }


        // =============================================
        // GET FORM VALUES
        // =============================================

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
                    "itemDescription"
                )
                .value
                .trim();


        const category =
            document
                .getElementById(
                    "itemCategory"
                )
                .value;


        const condition =
            document
                .getElementById(
                    "itemCondition"
                )
                .value;


        const price =
            Number(
                document
                    .getElementById(
                        "itemPrice"
                    )
                    .value
            );


        const school =
            document
                .getElementById(
                    "itemSchool"
                )
                .value
                .trim();


        const location =
            document
                .getElementById(
                    "itemLocation"
                )
                .value
                .trim();


        const imageURL =
            itemImageURL.value.trim();


        // =============================================
        // VALIDATION
        // =============================================

        if (!name) {

            showError(
                "Please enter an item name."
            );


            return;

        }


        if (!description) {

            showError(
                "Please enter a description."
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


        if (
            Number.isNaN(price) ||
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


        if (!location) {

            showError(
                "Please enter a location."
            );


            return;

        }


        // =============================================
        // IMAGE URL VALIDATION
        // =============================================

        let images = [];


        if (imageURL) {

            try {

                const imageURLObject =
                    new URL(
                        imageURL
                    );


                if (
                    imageURLObject.protocol !==
                        "http:" &&
                    imageURLObject.protocol !==
                        "https:"
                ) {

                    showError(
                        "Please enter a valid image URL beginning with http:// or https://."
                    );


                    return;

                }


                images = [
                    imageURL
                ];

            }

            catch (error) {

                showError(
                    "Please enter a valid image URL."
                );


                return;

            }

        }


        // =============================================
        // DISABLE BUTTON
        // =============================================

        createListingButton.disabled =
            true;


        createListingButton.innerHTML = `

            <span
                class="spinner-border spinner-border-sm me-2"
                role="status"
            ></span>

            Creating Listing...

        `;


        try {

            // =========================================
            // SELLER INFORMATION
            // =========================================

            const sellerName =
                currentUserProfile.sellerName ||
                "Seller";


            const sellerSchool =
                currentUserProfile.school ||
                school;


            // =========================================
            // LISTING OBJECT
            // =========================================

            const listingData = {

                // -------------------------------------
                // ITEM
                // -------------------------------------

                name:
                    name,

                description:
                    description,

                category:
                    category,

                condition:
                    condition,

                price:
                    price,


                // -------------------------------------
                // LOCATION
                // -------------------------------------

                school:
                    school,

                location:
                    location,


                // -------------------------------------
                // IMAGE URL
                // -------------------------------------

                images:
                    images,


                // -------------------------------------
                // SELLER
                // -------------------------------------

                sellerId:
                    currentUser.uid,

                sellerName:
                    sellerName,

                sellerSchool:
                    sellerSchool,


                // -------------------------------------
                // STATUS
                // -------------------------------------

                status:
                    "active",


                // -------------------------------------
                // DATE
                // -------------------------------------

                createdAt:
                    serverTimestamp()

            };


            console.log(
                "================================="
            );


            console.log(
                "LISTING DATA"
            );


            console.log(
                listingData
            );


            console.log(
                "IMAGE URL:",
                imageURL
            );


            console.log(
                "================================="
            );


            // =========================================
            // SAVE TO FIRESTORE
            // =========================================

            const listingReference =
                await addDoc(
                    collection(
                        db,
                        "listings"
                    ),
                    listingData
                );


            console.log(
                "Listing created:",
                listingReference.id
            );


            // =========================================
            // SUCCESS
            // =========================================

            showSuccess(
                "Listing created successfully!"
            );


            // =========================================
            // REDIRECT
            // =========================================

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
                "================================="
            );


            console.error(
                "CREATE LISTING ERROR"
            );


            console.error(
                error
            );


            console.error(
                "================================="
            );


            showError(
                "Unable to create listing: " +
                error.message
            );


            // =========================================
            // RESTORE BUTTON
            // =========================================

            createListingButton.disabled =
                false;


            createListingButton.innerHTML = `

                <i
                    class="bi bi-plus-circle me-2"
                ></i>

                Create Listing

            `;

        }

    }
);


// =====================================================
// SHOW ERROR
// =====================================================

function showError(
    message
) {

    listingError.textContent =
        message;


    listingError.classList.remove(
        "d-none"
    );

}


// =====================================================
// HIDE ERROR
// =====================================================

function hideError() {

    listingError.textContent =
        "";


    listingError.classList.add(
        "d-none"
    );

}


// =====================================================
// SHOW SUCCESS
// =====================================================

function showSuccess(
    message
) {

    listingSuccess.textContent =
        message;


    listingSuccess.classList.remove(
        "d-none"
    );

}


// =====================================================
// HIDE SUCCESS
// =====================================================

function hideSuccess() {

    listingSuccess.textContent =
        "";


    listingSuccess.classList.add(
        "d-none"
    );

}