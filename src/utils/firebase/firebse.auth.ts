// src/lib/firebase/auth.ts
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    signOut,
    RecaptchaVerifier,
    Auth,
    UserCredential,
    ConfirmationResult,
} from 'firebase/auth';
import { auth } from './firebase.config'; // Import the initialized auth instance

interface FirebaseAuthError extends Error {
    code: string;
}

// --- Email/Password Authentication ---

export const signUpWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error: any) { // Use 'any' for unknown error types, then cast or check
        const firebaseError = error as FirebaseAuthError;
        console.error("Error signing up:", firebaseError.code, firebaseError.message);
        throw firebaseError; // Re-throw to be handled by calling component
    }
};

export const signInWithEmail = async (email: string, password: string): Promise<UserCredential> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential;
    } catch (error: any) {
        const firebaseError = error as FirebaseAuthError;
        console.error("Error signing in:", firebaseError.code, firebaseError.message);
        throw firebaseError;
    }
};

// --- Phone (SMS) Authentication ---

// This function must be called in a client component where window is defined
export const setupRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier | null => {
    if (typeof window === 'undefined') {
        console.warn("RecaptchaVerifier can only be initialized on the client side.");
        return null;
    }

    // Avoid re-initializing if already present (for dev mode HMR)
    if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible', // or 'normal' if you want a visible checkbox
        'callback': (response: any) => {
            // reCAPTCHA solved, allows signInWithPhoneNumber to proceed
            console.log("reCAPTCHA solved:", response);
        },
        'expired-callback': () => {
            console.warn("reCAPTCHA expired. User might need to re-verify.");
        }
        });
    }
    return window.recaptchaVerifier;
};

export const sendPhoneVerificationCode = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    try {
        console.log(auth);
        console.log(phoneNumber);
        console.log("--------App verifier------");
        console.log(appVerifier);
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return confirmationResult;
    } catch (error: any) {
        const firebaseError = error as FirebaseAuthError;
        console.error("Error sending SMS code:", firebaseError.code, firebaseError.message);
        throw firebaseError;
    }
};

export const verifyPhoneCode = async (confirmationResult: ConfirmationResult, code: string): Promise<UserCredential> => {
    try {
        const userCredential = await confirmationResult.confirm(code);
        return userCredential;
    } catch (error: any) {
        const firebaseError = error as FirebaseAuthError;
        console.error("Error verifying SMS code:", firebaseError.code, firebaseError.message);
        throw firebaseError;
    }
};

// --- General Authentication ---

export const signOutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
        console.log("User signed out.");
    } catch (error: any) {
        const firebaseError = error as FirebaseAuthError;
        console.error("Error signing out:", firebaseError.code, firebaseError.message);
        throw firebaseError;
    }
};

// Helper for listening to auth state changes (often used in a Context)
export const onAuthStateChangedListener = (callback: (user: any | null) => void) => {
    return auth.onAuthStateChanged(callback);
};

// Extend the Window interface for recaptchaVerifier property
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
    }
}
