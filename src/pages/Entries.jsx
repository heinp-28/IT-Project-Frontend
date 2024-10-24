// Parts of code adapted from NextUI Table

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button, DropdownItem, DropdownMenu, Dropdown, DropdownTrigger, Pagination, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input, Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure, 
    Code,
    CardHeader,
    Divider} from "@nextui-org/react";
import {Navbar, NavbarContent, Avatar} from "@nextui-org/react";
import './../styles/entries.css';
import { ChevronDownIcon } from './ChevronDownIcon.jsx';
import { useNavigate, useParams } from 'react-router-dom';
import {SearchIcon} from "./SearchIcon";
import { db, auth } from './../firebaseConfig.js';
import { collection, getDocs, getDoc, doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import {Card, CardBody} from "@nextui-org/react";
import { EditOutlined, CommentOutlined } from "@ant-design/icons";
import moment from 'moment';

// Column Names of the data file as well as additional fields
const columns = [
    //{ key: "Image", label: "Image" },
    { key: "Given Names", label: "Given Names" },
    { key: "Family Name", label: "Family Name" },
    { key: "Birth", label: "Birth" },
    { key: "Death", label: "Death" },
    { key: "Short Description", label: "Short Description" },
    { key: "Assigned To", label: "Assigned To"},
    { key: "Status", label: "Status" },
    { key: "Link", label: "Link" },
    { key: "Comments", label: "Comments" }
];

// Mapping of color to each status
const statusColorMap = {
    "No Revision": "success",
    "Minor Revision": "warning",
    "Major Revision": "danger",
    "Not Indicated": "default"
};

// The status options for entries
const statusOptions = [
    { name: "No Revision", id: "No Revision" },
    { name: "Minor Revision", id: "Minor Revision" },
    { name: "Major Revision", id: "Major Revision" },
    { name: "Not Indicated", id: "Not Indicated" }
];

// Entries page
const Entries = () => {

    const [entries, setEntries] = useState([]);
    const [comments, setComments] = useState([]);

    const [page, setPage] = useState([1]);
    const rowsPerPage = 10;
    const [statusFilter, setStatusFilter] = useState(new Set([]));
    const [editorFilter, setEditorFilter] = useState(new Set([]));
    const navigate = useNavigate();
    const [searchValueName, setSearchValueName] = useState('');
    const [searchValueShortDesc, setSearchValueShortDesc] = useState('');
    const { userID } = useParams();
    const [users, setUsers] = useState([]);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('');

    const { isOpen, onOpen, onOpenChange } = useDisclosure(); // For controlling the modal
    const [selectedEntryId, setSelectedEntryId] = useState(null); // To track the entry being edited
    const [newComment, setNewComment] = useState("");


    // API request to fetch the current user's email
    useEffect(() => {
        const fetchProfileInfo = async () => {
            try {
                const docRef = doc(db, "users", userID);
                const docSnap = await getDoc(docRef);
    
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setEmail(data.email);
                    if (data.role === "Head Director") {
                        setRole("admin");
                    } else {
                        setRole("notadmin");
                    }
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching profile email:", error);
            }
        };
        fetchProfileInfo();
    }, [userID]);
    
    // Fetch comments from your API or database
    useEffect(() => {
        const fetchComments = async () => {
        try {
            const res = await axios.get("http://3.107.174.83:8800/comments");
            const commentsData = {};
            res.data.forEach(comment => {
            // Access Entry_id from the comment object
            const entryId = comment.Entry_id; 
            if (!commentsData[entryId]) {
                commentsData[entryId] = [];
            }
            commentsData[entryId].push(comment);
            });
            setComments(commentsData);
            console.log(commentsData); // Log the commentsData object
        } catch (err) {
            console.log(err);
        }
        };
        fetchComments();
    }, []);

    // API request to fetch all entries
    useEffect(() => {
        const fetchAllEntries = async () => {
            try {
                const res = await axios.get("http://3.107.174.83:8800/entries");
                setEntries(res.data);
            } catch (err) {
                console.log(err);
            }
        };
        fetchAllEntries();
    }, []);

    // Fetching all entries from firestore database
    useEffect(() => {
        const fetchUsers = async () => {
          try {
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersList = usersSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));
            setUsers(usersList);
          } catch (error) {
            console.error("Error fetching users:", error);
          }
        };
    
        fetchUsers();
    }, []);
    
    // Ensure page is set to 1 after entries are loaded
    useEffect(() => {
        if (entries.length > 0) {
            setPage(1); // Set page to 1 when entries are loaded
        }
    }, [entries]);

    // Creating pages of entries either filtered or searched
    const filteredItems = useMemo(() => {
        const searchTermDescription = searchValueShortDesc.toLowerCase().trim();
        const searchTermName = searchValueName.toLowerCase().trim();
            
        let filteredEntries = [...entries];

        // Filter entries based on the search term for short description
        if (searchTermDescription) {
            filteredEntries = filteredEntries.filter((entry) =>
                entry["Short Description"].replace(/'/g, '').trim().toLowerCase().includes(searchTermDescription.replace(/'/g, '').trim()),
        );
        }

        // Filter entries based on the search term for name
        if (searchTermName) {
            filteredEntries = filteredEntries.filter((entry) =>
                entry["Given Names"].toLowerCase().includes(searchTermName) || 
                entry["Family Name"].toLowerCase().includes(searchTermName) || 
                `${entry["Given Names"]} ${entry["Family Name"]}`.toLowerCase().includes(searchTermName),
            );
        };

        // Filter entries based on the editor in charge
        if (editorFilter.size !== 0) {
            filteredEntries = filteredEntries.filter((entry) => 
                editorFilter.has(entry['Assigned Id']));
        }
        
        // Filter entries based on the status of the entries
        if (statusFilter.size !== 0) {
            filteredEntries = filteredEntries.filter((entry) => 
                statusFilter.has(entry.Status) || (statusFilter.has("Not Indicated") && !entry.Status));
        }
        
        return filteredEntries;
    }, [entries, searchValueName, searchValueShortDesc, editorFilter, statusFilter]);


    // Divide the entries into different pages
    const entryColumns = useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);


    // Calculated the number of pages required
    const pages = Math.ceil(filteredItems.length / rowsPerPage);


    // Handler function for when a name search value is entered
    const handleSearchNameChange = useCallback((value) => {
        if(value) {
            setSearchValueName(value);
            setPage(1); // Reset to the first page on new search
        } else {
            setSearchValueName('');
        }
    }, [])

    // Handler function to assign entries when the button is clicked
    const handleAssign = useCallback(async () => {

        // Make sure entries are selected before assigning it
        if (selectedEntries.length === 0) {
            alert("Please select entries.");
            return;
        }

        // Construct the name of the user
        const assignedUserName = users.find(user => user.id === userID)?.givenName + " " + users.find(user => user.id === userID)?.familyName;
        
        // Update mysql database by sending an api request
        try {
            const res = await axios.put("http://3.107.174.83:8800/assign", {
                assignedId: userID,
                assignedTo: assignedUserName,
                selectedEntryIds: Array.from(selectedEntries)
            });
            alert(res.data);

            // Refresh the page after assigning etnries
            const updatedEntries = await axios.get("http://3.107.174.83:8800/entries");
            setEntries(updatedEntries.data);
        } catch (error) {
            console.error("Error assigning entries:", error);
        }
    }, [selectedEntries, userID, users]);


    // Function to handle adding a new comment
    const handleAddComment = async (entryId) => {

        // Construct the name of the user
        const assignedUserName = users.find(user => user.id === userID)?.givenName + " " + users.find(user => user.id === userID)?.familyName;

        try {

            const formattedDateTime = moment().format('YYYY-MM-DD HH:mm:ss');

            // Send a POST request to your API to add the comment
            const res = await axios.post("http://3.107.174.83:8800/comments", {
                Entry_id: entryId,
                Comment: newComment,
                Commenter: assignedUserName,
                CommenterId: userID,
                Date_Time: formattedDateTime
            });
            alert(res.data);

            // Update the comments state in the frontend
            setComments(prevComments => ({
                ...prevComments,
                [entryId]: [
                    ...(prevComments[entryId] || []), 
                    { 
                        Comment: newComment, 
                        Commenter: assignedUserName, 
                        Date_Time: formattedDateTime, // Include the formatted date
                        CommenterId: userID // Assuming you want to include the commenter's ID
                    }
                ]
            }));

            setNewComment(""); // Clear the input field
        } catch (error) {
            console.error("Error adding comment:", error);
        }
    };

    // Updated handleStatusChange function to properly update entry status
    const handleStatusChange = useCallback(async (entryId, newStatus) => {
        try {
            await axios.put(`http://3.107.174.83:8800/update-status/${entryId}`, { 
                status: newStatus 
            });
            
            // Update the local entries state to reflect the change immediately
            setEntries(prevEntries => prevEntries.map(entry => {
                if (entry.id === entryId) {
                    return { ...entry, Status: newStatus };
                }
                return entry;
            }));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    }, []);


    // Handler function for when a short term description search value is entered
    const handleSearchShortDescChange = useCallback((value) => {
        if(value) {
            setSearchValueShortDesc(value);
            setPage(1); // Reset to the first page on new search
        } else {
            setSearchValueShortDesc('');
        }
    }, [])

    const handleUnassign = useCallback(async () => {
        // Make sure entries are selected before unassigning
        if (selectedEntries.size === 0) {
            alert("Please select entries.");
            return;
        }
    
        try {
            const res = await axios.put("http://3.107.174.83:8800/unassign", {
                selectedEntryIds: Array.from(selectedEntries)
            });
            alert(res.data);
    
            // Refresh the page after unassigning entries
            const updatedEntries = await axios.get("http://3.107.174.83:8800/entries");
            setEntries(updatedEntries.data);
        } catch (error) {
            console.error("Error unassigning entries:", error);
        }
    }, [selectedEntries]);

    // The top content of a table (Search bar, status options filter, etc.)
    const topContent = useMemo(() => {

        // Count the number of entries in different states
        const noRevisionCount = entries.filter(entry => entry.Status === "No Revision").length;
        const minorRevisionCount = entries.filter(entry => entry.Status === "Minor Revision").length;
        const majorRevisionCount = entries.filter(entry => entry.Status === "Major Revision").length;
        const notIndicatedCount = entries.filter(entry => !entry.Status || entry.Status === "Not Indicated").length;

        return (
            <div>
                <div className="flex flex-row-reverse gap-4 p-4">

                    {/* Add a button for unassigning entries */}
                    <div>
                        <Button
                            color='secondary'
                            onClick={handleUnassign}
                        >
                            Unassign
                        </Button>
                    </div>

                    {/* Add a button for assigning entries */}
                    <div>
                        <Button
                            color='secondary'
                            onClick={handleAssign}
                        >
                            Assign
                        </Button>
                    </div>

                    {/* Search Bar by short description */}
                    <div className='w-full'>
                        <Input
                            label='Search'
                            isClearable={true}
                            onClear={(e) => setSearchValueShortDesc('')}
                            className='w-auto'
                            placeholder="by short description..."
                            startContent={
                                <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
                            }
                            size="md"
                            variant="bordered"
                            value={searchValueShortDesc}
                            onValueChange={handleSearchShortDescChange}
                        />
                    </div>

                    {/* Search Bar by name */}
                    <div className='w-full'>
                        <Input
                            label='Search'
                            isClearable={true}
                            onClear={(e) => setSearchValueName('')}
                            className='w-auto'
                            placeholder="by name..."
                            startContent={
                                <SearchIcon className="text-black/50 mb-0.5 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0" />
                            }
                            size="md"
                            variant="bordered"
                            value={searchValueName}
                            onValueChange={handleSearchNameChange}
                        />
                    </div>
                    
                    {/* Editor Options Filter */}
                    <div className='relative'>
                    <Dropdown>
                        <DropdownTrigger className='sm:flex'>
                            <Button
                            endContent={<ChevronDownIcon className="text-small" />}
                            size="md"
                            variant="flat"
                            color='primary'
                            >
                            Editor
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                            aria-label="Editors Filter"
                            selectedKeys={editorFilter}
                            closeOnSelect={false}
                            selectionMode="multiple"
                            onSelectionChange={setEditorFilter}
                        >
                            {users.map(user => (
                            <DropdownItem key={user.id} value={user.id}>
                                {user.givenName + ' ' + user['familyName']} 
                            </DropdownItem>
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                    </div>

                    {/* Status Options Filter */}
                    <div>
                        <Dropdown>
                            <DropdownTrigger className='sm:flex'>
                                <Button
                                    endContent={<ChevronDownIcon className="text-small" />}
                                    size="md"
                                    variant="flat"
                                    color='primary'
                                >
                                    Status
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                aria-label="Status Filter"
                                selectedKeys={statusFilter}
                                onSelectionChange={setStatusFilter}
                                selectionMode="multiple"
                            >
                                {statusOptions.map((status) => (
                                    <DropdownItem key={status.id}>
                                        {status.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>
                    </div>
                </div>

                {/*  Use Card component to display statistics */}
                <div className="my-4">
                    <Card>
                        <CardBody>
                        <p className="font-semibold">Statistics:</p>
                        <p>Total Entries: {entries.length}</p>
                        <p>No Revision: {noRevisionCount} | Minor Revision: {minorRevisionCount} | Major Revision: {majorRevisionCount} | Not Indicated: {notIndicatedCount}</p>
                        </CardBody>
                    </Card>
                </div>

            </div>
        );
    }, [handleUnassign, entries, statusFilter, searchValueName, searchValueShortDesc, editorFilter, users, handleSearchNameChange, handleSearchShortDescChange, handleAssign]);

    // The bottom content of a table (Page Scroll)
    const bottomContent = useMemo(() => {
        return (
            <div className="flex w-full justify-center">
                <Pagination
                    isCompact
                    showControls
                    showShadow
                    color="secondary"
                    page={page}
                    total={pages}
                    onChange={setPage}
                />
                
            </div>
            
        );
    }, [pages, page]);

    const handleAccount = (event) => {
        event.preventDefault();

        navigate(`/profile/${userID}`);
    }

    const handleUserManagement = (event) => {
        event.preventDefault();
        navigate(`/manage-users`);
    }

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // Rendering the Page
    return (
        <div className = "relative">
            <Navbar maxWidth="full">
                <NavbarContent as="div" className="flex items-center">
                    {/* Move the Dropdown here for top-left alignment */}
                    <Dropdown placement="bottom-start">
                        <DropdownTrigger>
                            <Avatar
                                isBordered
                                as="button"
                                color="secondary"
                                name={users.find(user => user.id === userID)?.givenName}
                                size="md"
                            />
                        </DropdownTrigger>
                        <DropdownMenu aria-label="Profile Actions" variant="flat" disabledKeys={["notadmin"]}>
                            <DropdownItem key="profile" className="h-14 gap-2">
                                <p className="font-semibold">Signed in as</p>
                                <p className="font-semibold">{email}</p>
                            </DropdownItem>
                            <DropdownItem key="settings" onClick={handleAccount}>Account Settings</DropdownItem>
                            <DropdownItem key="logout" onClick={handleLogout} color="danger">
                                Log Out
                            </DropdownItem>
                            <DropdownItem key={role} onClick={handleUserManagement}>User Management</DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
                </NavbarContent>
            </Navbar>

            {/* Rendering the NextUI table */}
            <Table
                aria-label="entries table"
                isCompact
                removeWrapper
                isStriped
                selectionMode='multiple'
                topContent={topContent}
                topContentPlacement="outside"
                bottomContent={bottomContent}
                bottomContentPlacement='outside'
                color={'primary'}
                selectedKeys={selectedEntries}
                onSelectionChange={(selected) => {
                    setSelectedEntries(selected);}}

            >
                <TableHeader columns={columns}>
                {column => <TableColumn key={column.key}>{column.label}</TableColumn>}
                </TableHeader>
                <TableBody emptyContent={"No entries found"} items={entryColumns}>
                    {entry => (
                        <TableRow key={entry.id}>
                            {columns.map(column => (
                                <TableCell key={column.key}>
                                    {column.key === "Status" ? (
                                        <div className="flex items-center">
                                            <Chip
                                                className="capitalize border-none gap-1 text-default-600"
                                                color={statusColorMap[entry['Status']]}
                                                size="sm"
                                                variant="dot"
                                            >
                                                {entry[column.key] || "Not Indicated"}

                                            </Chip>

                                            <Dropdown>
                                                <DropdownTrigger>
                                                    <EditOutlined />
                                                </DropdownTrigger>
                                                <DropdownMenu
                                                    aria-label="Edit Status"
                                                    onAction={(key) => handleStatusChange(entry.id, key)}
                                                >
                                                    {statusOptions.map((status) => (
                                                        <DropdownItem key={status.id} value={status.id}>
                                                            {status.name}
                                                        </DropdownItem>
                                                    ))}
                                                </DropdownMenu>
                                            </Dropdown>

                                        </div>
                                    ) : column.key === "Link" ? (<Button
                                        as="a"
                                        href={entry[column.key]}
                                        target="_blank">
                                            {"Page"}
                                    </Button>
                                    ) : column.key === "Comments" ? (
                                        <Button isIconOnly onPress={() => { setSelectedEntryId(entry.id); onOpen(); }}>
                                            <CommentOutlined />
                                        </Button>
                                    )
                                    : (
                                        entry[column.key] || "N/A"
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {/* Modal for Comments */}
            <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" size='4xl' scrollBehavior='inside'>
                <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader>Comments</ModalHeader>
                        <ModalBody>
                                <div>
                                    {comments[selectedEntryId] && comments[selectedEntryId].length > 0 ? (
                                        comments[selectedEntryId].map((comment, index) => (
                                        <div key={index} className="py-2"> 
                                            <Card key={index} className="max-w-[400px]">
                                                <CardHeader className="flex gap-3">
                                                    <Avatar
                                                        isBordered
                                                        as="button"
                                                        color="secondary"
                                                        name={users.find(user => user.id === userID)?.givenName}
                                                        size="md"
                                                    />
                                                    <div className="flex flex-col">
                                                        <p className="text-md">{comment.Commenter}</p>
                                                        <p className="text-small text-default-500">{moment(comment.Date_Time).format('MMMM Do YYYY, h:mm a')}</p>
                                                    </div>
                                                </CardHeader>
                                                <Divider/>
                                                <CardBody>
                                                    <Code>{comment.Comment}</Code>
                                                </CardBody>
                                            </Card>
                                        </div>
                                        ))
                                    ) : (
                                        <div>No comments yet.</div> 
                                    )}
                                </div>
                    </ModalBody>
                    <ModalFooter>
                        <Input
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            clearable
                        />
                        <Button onPress={() => handleAddComment(selectedEntryId)}>
                            Add Comment
                        </Button>
                    </ModalFooter>
                    </>
                )}
                </ModalContent>
            </Modal>

        </div>
    );
};

export default Entries;