// src/app/auth/signup/page.tsx
'use client'; // This directive makes this component a client component

import { useState, useEffect } from 'react';
import { signUpWithEmail, setupRecaptcha, sendPhoneVerificationCode, verifyPhoneCode } from '@/utils/firebase/firebse.auth'; // Adjust path
import { AuthErrorCodes } from 'firebase/auth'; // Helpful for specific error handling
import { analytics } from '@/utils/firebase/firebase.config';
import { logEvent } from 'firebase/analytics';

export default function SignUpPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [smsCode, setSmsCode] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<any>(null); // Type 'any' for ConfirmationResult initially
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        // Initialize reCAPTCHA on the client side only
        // It's crucial to call this in a useEffect to ensure 'window' is available.
        if (typeof window !== 'undefined') {
            const verifier = setupRecaptcha();
            if (verifier) {
                console.log("reCAPTCHA verifier initialized.");
            }
        }
    }, []); // Run once on component mount

    const handleEmailSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const userCredential = await signUpWithEmail(email, password);
            setMessage(`Successfully signed up with email: ${userCredential.user.email}`);
            if (analytics) { // Always check if analytics is initialized (it might be null if no measurementId or server-side)
                logEvent(analytics, 'user_signup', { method: 'email_password' });
                console.log("Logged user_signup event to Analytics.");
            }
            // Redirect or update UI
        } catch (err: any) {
            // You can refine error messages based on firebaseError.code
            if (err.code === AuthErrorCodes.EMAIL_EXISTS) {
                setError('Email already in use. Please sign in or use a different email.');
            } else {
                setError(`Failed to sign up: ${err.message}`);
            }
        }
    };

    const handleSendSmsCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            if (window.recaptchaVerifier) { // Ensure recaptchaVerifier is available globally
                const result = await sendPhoneVerificationCode(phoneNumber, window.recaptchaVerifier);
                setConfirmationResult(result);
                setMessage('Verification code sent to your phone!');
            } else {
                setError('reCAPTCHA not initialized. Please try again.');
            }
        } catch (err: any) {
            setError(`Failed to send SMS code: ${err.message}`);
        }
    };

    const handleVerifySmsCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (!confirmationResult) {
            setError('Please send a verification code first.');
            return;
        }
        try {
            const userCredential = await verifyPhoneCode(confirmationResult, smsCode);
            setMessage(`Successfully signed in with phone: ${userCredential.user.phoneNumber}`);
            // Redirect or update UI
        } catch (err: any) {
            setError(`Failed to verify code: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto' }}>
        <h1>Firebase Authentication</h1>

        <section style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px' }}>
            <h2>Email & Password</h2>
            <form onSubmit={handleEmailSignUp}>
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px 15px' }}>Sign Up with Email</button>
            </form>
        </section>

        <section style={{ border: '1px solid #ccc', padding: '20px' }}>
            <h2>Phone (SMS) Authentication</h2>
            {!confirmationResult ? (
            <form onSubmit={handleSendSmsCode}>
                <input
                type="tel"
                placeholder="Phone Number (e.g., +15551234567)"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
                />
                <button type="submit" style={{ padding: '10px 15px' }}>Send SMS Code</button>
            </form>
            ) : (
            <form onSubmit={handleVerifySmsCode}>
                <input
                type="text"
                placeholder="Enter SMS Verification Code"
                value={smsCode}
                onChange={(e) => setSmsCode(e.target.value)}
                required
                style={{ display: 'block', marginBottom: '10px', width: '100%', padding: '8px' }}
                />
                <button type="submit" style={{ padding: '10px 15px' }}>Verify Code</button>
            </form>
            )}
            {/* This is the invisible reCAPTCHA container. It must exist. */}
            <div id="recaptcha-container" style={{ visibility: 'hidden', height: '0', overflow: 'hidden' }}></div>
        </section>

        {message && <p style={{ color: 'green', marginTop: '20px' }}>{message}</p>}
        {error && <p style={{ color: 'red', marginTop: '20px' }}>Error: {error}</p>}
        </div>
    );
}
