import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@nextui-org/react";
import { collection, getDocs, setDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { EyeInvisibleOutlined, EyeOutlined } from "@ant-design/icons";
import { db, auth } from '../firebaseConfig';
import { initializeApp } from 'firebase/app';
import './../styles/usermanagement.css';

const roleOptions = ["Head Director", "Senior Editor", "Editor", "Intern"];

const firebaseConfig = {
  apiKey: "AIzaSyDc0X-cDET2SytWcAtrPphnv1TSVHY10UY",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const secondaryApp = initializeApp(firebaseConfig, "Secondary");
const secondaryAuth = getAuth(secondaryApp);

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newGivenName, setNewGivenName] = useState('');
    const [newFamilyName, setNewFamilyName] = useState('');
    const [loading, setLoading] = useState(true);
    const [visible, setVisible] = useState(false);
    const navigate = useNavigate();

    const toggleVisibility = () => setVisible(!visible);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("logged in as user: ", user.uid);
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists() && userDoc.data().role === "Head Director") {
                        fetchUsers();
                    } else {
                        console.log("fetching user role failed");
                        navigate('/entries');
                    }
                } catch (error) {
                    console.error("Error checking user role:", error);
                    navigate('/entries');
                }
            } else {
                console.log("no user found");
                navigate('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchUsers = async () => {
        try {
            const usersCollection = collection(db, 'users');
            const userSnapshot = await getDocs(usersCollection);
            const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(userList);
        } catch (error) {
            console.error('Error fetching users:', error);
            alert('Failed to fetch users. Please try again.');
        }
    };

    const handleAddUser = async () => {
        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
            const newUser = userCredential.user;

            await setDoc(doc(db, 'users', newUser.uid), {
                uid: newUser.uid,
                givenName: newGivenName,
                familyName: newFamilyName,
                avatarUrl: 'https://i.pravatar.cc/300',
                role: '',
                phoneNumber: '',
                gender: '',
                email: newEmail
            });

            console.log("User " + newUser.uid + " created successfully!");
            await signOut(secondaryAuth);

            onOpenChange(false);
            setNewEmail('');
            setNewPassword('');
            setNewGivenName('');
            setNewFamilyName('');
            fetchUsers();
        } catch (error) {
            console.error('Error adding new user:', error);
            alert('Failed to add new user. Please try again.');
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await deleteDoc(doc(db, 'users', userId));
                
                console.log(`User document for ${userId} deleted from Firestore.`);
                alert('User document deleted from Firestore. For complete user deletion, manually delete the account in firebase console.');
                
                fetchUsers();
            } catch (error) {
                console.error('Error deleting user document:', error);
                alert('Failed to delete user document. Please try again.');
            }
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            await updateDoc(doc(db, 'users', userId), { role: newRole });
            fetchUsers();
        } catch (error) {
            console.error('Error updating user role:', error);
            alert('Failed to update user role. Please try again.');
        }
    };

    const handleGoBack = () => {
        navigate(-1);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    const handleFirebaseConsoleRedirect = () => {
        window.open("https://console.firebase.google.com/u/0/project/history-biographers/authentication/users", "_blank");
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="user-management-container">
            <div className="top-bar">
                <Button onClick={handleGoBack} color="primary" variant="shadow">Go Back</Button>
                <span className="title-text">
                    Australian Dictionary of Biography Management System
                </span>
                <Button onClick={handleLogout} color="secondary" variant="shadow">Logout</Button>
            </div>
            <div className="content">
                <h1 className="page-title">User Management</h1>
                <div className="button-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <Button onClick={onOpen} variant="shadow" color="success">
                        Create New User Account
                    </Button>
                    <p style={{
                        color: 'white',
                        fontSize: '20px',
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        textAlign: 'center',
                        marginTop: '10px'
                    }}>
                        ⚠ For security reasons, complete deletion of accounts in firebase console. 
                    </p>
                    <Button onClick={handleFirebaseConsoleRedirect} variant="shadow" color="warning">
                        Go to Firebase Console
                    </Button>
                </div>
                <Table aria-label="User management table">
                <TableHeader>
                    <TableColumn>Name</TableColumn>
                    <TableColumn>Role</TableColumn>
                    <TableColumn>Email</TableColumn>
                    <TableColumn>Phone Number</TableColumn>
                    <TableColumn>Gender</TableColumn>
                    <TableColumn>Actions</TableColumn>
                </TableHeader>
                <TableBody>
                    {users.map((user) => (
                        <TableRow key={user.id}>
                            <TableCell>
                                {`${user.givenName} ${user.familyName}`}
                            </TableCell>
                            <TableCell>
                                <Dropdown>
                                    <DropdownTrigger>
                                        <Button variant="bordered">
                                            {user.role || 'Select Role'}
                                        </Button>
                                    </DropdownTrigger>
                                    <DropdownMenu aria-label="Role selection">
                                        {roleOptions.map((role) => (
                                            <DropdownItem key={role} onClick={() => handleRoleChange(user.id, role)}>
                                                {role}
                                            </DropdownItem>
                                        ))}
                                    </DropdownMenu>
                                </Dropdown>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.phoneNumber}</TableCell>
                            <TableCell>{user.gender}</TableCell>
                            <TableCell>
                                <Button
                                    color="danger"
                                    size="md"
                                    variant="ghost"
                                    onClick={() => handleDeleteUser(user.id)}
                                >
                                    Delete
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            <div className="bottom-bar"></div>

            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">Add New User</ModalHeader>
                            <ModalBody>
                                <Input
                                    label="Email"
                                    placeholder="Enter email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                                <Input
                                    label="Password"
                                    placeholder="Enter password"
                                    value={newPassword}
                                    endContent={
                                        <div style={{ display: "flex", gap: "7px", marginBottom: "6px" }}>
                                            {newPassword && (
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
                                        </div>
                                    }
                                    type={visible ? "text" : "password"}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                                <Input
                                    label="Given Name"
                                    placeholder="Enter given name"
                                    value={newGivenName}
                                    onChange={(e) => setNewGivenName(e.target.value)}
                                />
                                <Input
                                    label="Family Name"
                                    placeholder="Enter family name"
                                    value={newFamilyName}
                                    onChange={(e) => setNewFamilyName(e.target.value)}
                                />
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="primary" onPress={handleAddUser}>
                                    Add User
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}