import React, { useState, useEffect } from 'react';
import { Button, Input, Card, CardHeader, CardBody, CardFooter, Divider, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import { EyeInvisibleOutlined, EyeOutlined, CloseCircleOutlined } from "@ant-design/icons";
import "./../styles/profile.css";

// Profile page
export default function Profile() {
    const { userID } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState({});
    const [password, setPassword] = useState('');
    const [visible, setVisible] = useState(false);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();

    const toggleVisibility = () => setVisible(!visible);
    const clearPassword = () => setPassword("");

    // Fetch the current user's profile using firebase UID
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "users", userID);
                const docSnap = await getDoc(docRef);
               
                if (docSnap.exists()) {
                    setProfile({ ...docSnap.data(), id: docSnap.id });
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };
        fetchProfile();
    }, [userID]);
   
    // Function called from pressing edit button
    const handleEdit = async () => {
        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error("No authenticated user found");
            }
            // Attempt login again for privacy & security
            await signInWithEmailAndPassword(auth, user.email, password);
            navigate(`/edit-profile/${userID}`);
        } catch (error) {
            console.error("Error authenticating:", error);
            alert("Incorrect password. Please try again.");
        }
    };

    // Go back to the main page (entries)
    const handleGoBack = () => {
        navigate(`/entries/${userID}`);
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

    // Rendering the profile page
    return (
        <div className="profile-container">
            <div className="top-bar">
                <Button onClick={handleGoBack} color="primary" variant="shadow">Go Back</Button>
                <span className="title-text">
                    Australian Dictionary of Biography Management System
                </span>
                <Button onClick={handleLogout} color="secondary" variant="shadow">Logout</Button>
            </div>
            <section className="section">
                <Card className="profile-card">
                    <CardHeader className="card-header">
                        <Image
                            alt="avatar"
                            height={150}
                            radius="sm"
                            src={profile.avatarUrl}
                            width={150}
                            style={{ objectFit: 'contain' }}
                        />
                        <div className="name-role">
                            <p className="name-text">{`${profile.givenName || ''} ${profile.familyName || ''}`}</p>
                            <p className="role-text">{profile.role}</p>
                        </div>
                    </CardHeader>
                    <Divider/>
                    <CardBody className="card-body">
                        <div className="info-row">
                            <Input
                                isReadOnly
                                type="text"
                                variant="faded"
                                label="Gender"
                                value={profile.gender || ''}
                                className="flex"
                            />
                        </div>
                        <div className="info-row">
                            <Input
                                isReadOnly
                                type="email"
                                variant="faded"
                                label="Email"
                                value={auth.currentUser?.email || ''}
                                className="flex"
                            />
                        </div>
                        <div className="info-row">
                            <Input
                                isReadOnly
                                type="tel"
                                variant="faded"
                                label="Phone Number"
                                value={profile.phoneNumber || ''}
                                className="flex"
                            />
                        </div>
                    </CardBody>
                    <Divider/>
                    <CardFooter className="card-footer">
                        <Button color="primary" variant="shadow" onClick={onOpen}>Edit</Button>
                    </CardFooter>
                </Card>
            </section>
            <div className="bottom-bar"></div>

            {/* Modal popup appears when user presses edit button to take password input */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Enter Password to Edit</ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Password"
                                    variant="faded"
                                    placeholder="Enter your password"
                                    value={password}
                                    endContent={
                                        <div style={{ display: "flex", gap: "7px", marginBottom: "6px" }}>
                                            {password && (
                                            <button 
                                                className="focus:outline-none" 
                                                type="button" 
                                                onClick={toggleVisibility} 
                                                aria-label="toggle password visibility">
                                                {visible ? (
                                                <EyeOutlined className="text-2xl text-default-400 pointer-events-none" />
                                                ) : (
                                                <EyeInvisibleOutlined className="text-2xl text-default-400 pointer-events-none" />
                                                )}
                                            </button>
                                            )}
                                            {password && (
                                            <button
                                                className="focus:outline-none"
                                                type="button"
                                                onClick={clearPassword}
                                                aria-label="clear password"
                                                style={{ background: "transparent", border: "none" }}
                                            >
                                                <CloseCircleOutlined className="text-2xl text-default-400" />
                                            </button>
                                            )}
                                        </div>
                                    }
                                    type={visible ? "text" : "password"}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={handleEdit}>
                                    Confirm
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}