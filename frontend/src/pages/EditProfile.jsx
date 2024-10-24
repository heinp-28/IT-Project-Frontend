import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardBody, CardFooter, Divider, Image, Button, Input } from "@nextui-org/react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, updateEmail, signOut } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import "./../styles/profile.css";

// EditProfile page
export default function EditProfile() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState({
        user: null,
        profile: {
            givenName: "",
            familyName: "",
            gender: "",
            phoneNumber: "",
            avatarUrl: "",
            role: "",
            email: "",
        },
        confirmEmail: "",
    });

    // Fetch the current user's profile using firebase UID
    const fetchProfile = useCallback(async (currentUser) => {
        if (!currentUser) return;

        try {
            const docRef = doc(db, "users", currentUser.uid);
            const docSnap = await getDoc(docRef);
           
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUserData(prev => ({
                    ...prev,
                    profile: { ...data, id: docSnap.id },
                    confirmEmail: data.email || currentUser.email || "",
                }));
            } else {
                console.log("No profile document. Creating one.");
                const newProfile = {
                    givenName: "",
                    familyName: "",
                    gender: "",
                    phoneNumber: "",
                    avatarUrl: "https://i.pravatar.cc/300",
                    role: "",
                    email: currentUser.email,
                };
                await updateDoc(docRef, newProfile);
                setUserData(prev => ({
                    ...prev,
                    profile: { ...newProfile, id: currentUser.uid },
                    confirmEmail: currentUser.email,
                }));
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Functions to change the content of useState profile which is used to update the existing profile data
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                [name]: value,
            }
        }));
    };

    // Separate functions to handle email and confirm email input change
    const handleEmailChange = (e) => {
        setUserData(prev => ({
            ...prev,
            profile: {
                ...prev.profile,
                email: e.target.value,
            }
        }));
    };

    const handleConfirmEmailChange = (e) => {
        setUserData(prev => ({
            ...prev,
            confirmEmail: e.target.value,
        }));
    };

    // Function called when save button at profile card footer section is pressed. 
    // Check if both the user input for email is correct, if user input new email.
    // Updates firestore document.
    const handleSave = async () => {
        if (!userData.user) return;

        if (userData.profile.email !== userData.confirmEmail) {
            alert("Emails do not match. Please check and try again.");
            return;
        }

        try {
            const docRef = doc(db, "users", userData.user.uid);
            console.log(docRef);

            // Update email in Firebase Auth
            if (userData.profile.email !== userData.user.email) {
                await updateEmail(userData.user, userData.profile.email);
            }
            await updateDoc(docRef, userData.profile);
            alert("Profile updated successfully.");
            handleGoBack();
        } catch (error) {
            console.error("Error updating profile:", error);
            if (error.code === "auth/requires-recent-login") {
                alert("For security reasons, please log in again to change your email.");
                navigate('/login');
            } else {
                alert("Failed to update profile. Please try again.");
            }
        }
    };

    // Only allow entrance to edit-profile page for logged in user
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUserData(prev => ({ ...prev, user: currentUser }));
                fetchProfile(currentUser);
            } else {
                setLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate, fetchProfile]);

    // Go back to the profile page called from pressing Go Back navigation button at the top bar
    const handleGoBack = () => {
        navigate(`/profile/${userData.user?.uid}`);
    };

    // Logout the current user
    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Loading screen
    if (loading) {
        return <div>Loading...</div>;
    }

    // Return warning page if no logged in user is found
    if (!userData.user) {
        return <div>You must be logged in to view this page.</div>;
    }

    // Rendering the edit profile page
    return (
        <div className="profile-container">
            <div className="top-bar">
                <Button onClick={handleGoBack} color="primary">Go Back</Button>
                <span className="title-text">
                    Australian History Biographers Database Management System
                </span>
                <Button onClick={handleLogout} color="secondary">Logout</Button>
            </div>
            <section className="section">
                <Card className="profile-card">
                    <CardHeader className="card-header">
                        <Image
                            alt="avatar"
                            height={150}
                            radius="sm"
                            src={userData.profile.avatarUrl}
                            width={150}
                            style={{ objectFit: "contain" }}
                        />
                        <div className="name-role">
                            <div className="name-inputs">
                                <Input
                                    name="givenName"
                                    label="Given Name"
                                    variant="faded"
                                    value={userData.profile.givenName}
                                    onChange={handleChange}
                                    className="name-input"
                                />
                                <Input
                                    name="familyName"
                                    label="Family Name"
                                    variant="faded"
                                    value={userData.profile.familyName}
                                    onChange={handleChange}
                                    className="name-input"
                                />
                            </div>
                            <p className="text-lg text-default-500">{userData.profile.role}</p>
                        </div>
                    </CardHeader>

                    <Divider />

                    <CardBody className="card-body">
                        <div className="info-row">
                            <Input
                                name="gender"
                                type="text"
                                label="Gender"
                                variant="faded"
                                value={userData.profile.gender}
                                onChange={handleChange}
                                className="flex"
                            />
                        </div>
                        <div className="info-row">
                            <Input
                                name="email"
                                type="email"
                                label="Email"
                                variant="faded"
                                value={userData.profile.email}
                                onChange={handleEmailChange}
                                className="flex"
                            />
                        </div>
                        <div className="info-row">
                            <Input
                                name="confirmEmail"
                                type="email"
                                label="Enter Email Again"
                                variant="faded"
                                value={userData.confirmEmail}
                                onChange={handleConfirmEmailChange}
                                className="flex"
                            />
                        </div>
                        <div className="info-row">
                            <Input
                                name="phoneNumber"
                                type="tel"
                                label="Phone Number"
                                variant="faded"
                                value={userData.profile.phoneNumber}
                                onChange={handleChange}
                                className="flex"
                            />
                        </div>
                    </CardBody>

                    <Divider />
                    <CardFooter className="card-footer">
                        <Button color="primary" onClick={handleSave} variant="shadow">Save</Button>
                        <Button color="danger" onClick={handleGoBack} variant="light" style={{ marginLeft: '10px' }}>Cancel</Button>
                    </CardFooter>
                </Card>
            </section>
            <div className="bottom-bar"></div>
        </div>
    );
}