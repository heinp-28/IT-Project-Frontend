import { useState } from "react";
import "./../styles/login.css";
import { useNavigate } from "react-router-dom";
import { EyeInvisibleOutlined, EyeOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { Input, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, useDisclosure, Link } from "@nextui-org/react";

import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth, db } from "../firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

// Login page
export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [resetEmail, setResetEmail] = useState("");

    const clearPassword = () => setPassword("");
    const clearEmail = () => setEmail("");
    const clearResetEmail = () => setResetEmail("");

    const toggleVisibility = () => setVisible(!visible);

    // Submit the user credential input to attempt login
    // Fetch UID to navigate to the personal entries page address
    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            // Sign in the user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // After successful authentication, fetch the user's document using their UID
            const userDocRef = doc(db, "users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                console.log('User document data:', userDocSnap.data());
                navigate(`/entries/${user.uid}`);
            } else {
                console.log('No user document found.');
                alert("User not found, please try again.");
            }
        } catch (error) {
            console.error('Error logging in:', error.message);
            alert("Invalid credentials or user not found, please try again.");
        }
    };

    // Function called from pressing password reset link
    // Opens the modal to take user email
    const handlePasswordReset = async () => {
        try {
            await sendPasswordResetEmail(auth, resetEmail);
            console.log("Sending password reset to:", resetEmail);
            onOpenChange(false); // Close the modal after submission
            alert("Password reset email sent. Please check your inbox.");
        } catch (error) {
            console.error('Error sending email:', error.message);
            alert("Reset email could not be sent, please try again.")
        }
    };

    // Rendering the login page
    return (
        <div className="login-section">
            <div className="title">
                <h1>Victorian Working Party</h1>
                <h1>Australian Dictionary Of Biography</h1>
            </div>
            <form onSubmit={handleSubmit} className="form">
                <div className="loginform">
                    <Input
                        className="input-field"
                        type="email"
                        label="Email"
                        variant="faded"
                        placeholder="Enter your email"
                        value={email}
                        endContent={
                            email && (
                                <button
                                    className="focus:outline-none"
                                    type="button"
                                    onClick={clearEmail}
                                    aria-label="clear email"
                                    style={{ background: "transparent", border: "none", marginBottom: "6px" }}
                                >
                                    <CloseCircleOutlined className="text-2xl text-default-400" />
                                </button>
                            )
                        }
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Input
                        className="input-field"
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
                    <div className="forgot-password-container">
                        <Link href="#" color="warning" underline="always" onPress={onOpen}>Forgot Password?</Link>
                    </div>
                    <Button type="submit" color="success" variant="shadow" className="login">Login</Button>
                </div>
            </form>

            {/* Modal popup appears when user presses reset password link. Sends password reset email to the input address */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} isDismissable={false} isKeyboardDismissDisabled={true}>
                <ModalContent>
                    {(onClose) => (
                        <>
                        <ModalHeader className="flex">Reset Password</ModalHeader>
                        <ModalBody>
                            <p>
                                Please enter your email to receive a password reset link.
                            </p>
                            <Input
                                className="input-fields"
                                isClearable
                                type="email"
                                label="Email"
                                variant="faded"
                                placeholder="Enter your email"
                                value={resetEmail}
                                endContent={
                                    resetEmail && (
                                        <button
                                            className="focus:outline-none"
                                            type="button"
                                            onClick={clearResetEmail}
                                            aria-label="clear password reset email"
                                            style={{ background: "transparent", border: "none", marginBottom: "5px", marginRight: "1px" }}
                                        >
                                            <CloseCircleOutlined className="text-2xl text-default-400" />
                                        </button>
                                    )
                                }
                                onChange={(e) => setResetEmail(e.target.value)}
                            />
                        </ModalBody>
                        <ModalFooter>
                            <Button color="danger" variant="light" onPress={onClose}>
                                Close
                            </Button>
                            <Button color="primary" onPress={() => {
                                handlePasswordReset();
                                console.log('Password reset email sent');
                                onClose();
                            }}>
                            Reset Password
                            </Button>
                        </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}