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


const form =
    document.getElementById("sellForm");

const imageUrl =
    document.getElementById("imageUrl");

const imagePreview =
    document.getElementById("imagePreview");

const imagePreviewContainer =
    document.getElementById(
        "imagePreviewContainer"
    );

const errorMessage =
    document.getElementById("errorMessage");

const successMessage =
    document.getElementById("successMessage");

const submitButton =
    document.getElementById("submitButton");


let currentUser = null;


// =====================================================
// AUTH
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
// IMAGE PREVIEW
// =====================================================

imageUrl.addEventListener(
    "input",
    () => {

        const url =
            imageUrl.value.trim();

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
);


// =====================================================
// CREATE LISTING
// =====================================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        if (!currentUser) {

            showError(
                "Please log in first."
            );

            return;

        }


        try {

            submitButton.disabled =
                true;


            submitButton.innerHTML = `

                <span
                    class="spinner-border spinner-border-sm me-2"
                ></span>

                Creating...

            `;


            const name =
                document
                    .getElementById("itemName")
                    .value
                    .trim();


            const category =
                document
                    .getElementById("category")
                    .value;


            const price =
                Number(
                    document
                        .getElementById("price")
                        .value
                );


            const condition =
                document
                    .getElementById("condition")
                    .value;


            const location =
                document
                    .getElementById("location")
                    .value
                    .trim();


            const description =
                document
                    .getElementById("description")
                    .value
                    .trim();


            const image =
                imageUrl.value.trim();


            await addDoc(

                collection(
                    db,
                    "listings"
                ),

                {

                    name:
                        name,

                    category:
                        category,

                    price:
                        price,

                    condition:
                        condition,

                    location:
                        location,

                    description:
                        description,

                    images:
                        image
                            ? [image]
                            : [],

                    sellerId:
                        currentUser.uid,

                    status:
                        "active",

                    createdAt:
                        serverTimestamp()

                }

            );


            successMessage.textContent =
                "Listing created successfully!";

            successMessage.classList.remove(
                "d-none"
            );


            form.reset();


            imagePreviewContainer
                .classList
                .add("d-none");


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
                "CREATE LISTING ERROR:",
                error
            );


            showError(
                error.message
            );


            submitButton.disabled =
                false;


            submitButton.innerHTML = `

                <i class="bi bi-plus-lg"></i>

                Create Listing

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