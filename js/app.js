import {
    auth
} from "./firebase-config.js";


import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";


// =====================================================
// ELEMENTS
// =====================================================

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


const locationSearch =
    document.getElementById("locationSearch");

const clearSearch =
    document.getElementById("clearSearch");


// =====================================================
// FIREBASE AUTH STATE
// =====================================================
//
// Firebase decides which navigation is shown.
//
// NOT LOGGED IN:
//
//      Login | Signup
//
// LOGGED IN:
//
//      Sell Items | Logout
//
// =====================================================

onAuthStateChanged(auth, (user) => {

    if (user) {

        // User is logged in

        loggedOutNav.classList.add("d-none");

        loggedInNav.classList.remove("d-none");

        loggedInNav.classList.add("d-flex");

        console.log(
            "Logged in:",
            user.email
        );

    } else {

        // User is logged out

        loggedInNav.classList.add("d-none");

        loggedInNav.classList.remove("d-flex");

        loggedOutNav.classList.remove("d-none");

        console.log(
            "No user logged in"
        );

    }

});


// =====================================================
// LOGIN
// =====================================================

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        loginError.classList.add("d-none");


        const email =
            document
                .getElementById("loginEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("loginPassword")
                .value;


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            // Close modal

            const modalElement =
                document.getElementById("loginModal");


            const modal =
                bootstrap.Modal.getInstance(
                    modalElement
                );


            if (modal) {

                modal.hide();

            }


            // Clear form

            loginForm.reset();


        } catch (error) {

            console.error(error);


            loginError.textContent =
                getFirebaseErrorMessage(error);


            loginError.classList.remove(
                "d-none"
            );

        }

    }
);


// =====================================================
// SIGNUP
// =====================================================

signupForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        signupError.classList.add("d-none");


        const email =
            document
                .getElementById("signupEmail")
                .value
                .trim();


        const password =
            document
                .getElementById("signupPassword")
                .value;


        try {

            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


            // Close modal

            const modalElement =
                document.getElementById("signupModal");


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
                getFirebaseErrorMessage(error);


            signupError.classList.remove(
                "d-none"
            );

        }

    }
);


// =====================================================
// LOGOUT
// =====================================================

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


// =====================================================
// SEARCH BAR
// =====================================================
//
// For now this is just the UI.
//
// Later we can connect this to Firestore.
//
// Example:
//
// Search:
//
// "Los Angeles"
//
// "Mirman"
//
// "Santa Monica"
//
// "Beverly Hills"
//
// etc.
//
// =====================================================

locationSearch.addEventListener(
    "input",
    () => {

        if (
            locationSearch.value.trim() !== ""
        ) {

            clearSearch.classList.remove(
                "d-none"
            );

        } else {

            clearSearch.classList.add(
                "d-none"
            );

        }

    }
);


// =====================================================
// CLEAR SEARCH
// =====================================================

clearSearch.addEventListener(
    "click",
    () => {

        locationSearch.value = "";

        clearSearch.classList.add(
            "d-none"
        );

        locationSearch.focus();

    }
);


// =====================================================
// FIREBASE ERROR HANDLING
// =====================================================

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


        case "auth/too-many-requests":

            return "Too many attempts. Please try again later.";


        default:

            return "Something went wrong. Please try again.";

    }

}