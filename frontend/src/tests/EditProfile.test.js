import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EditProfile from '../pages/EditProfile'; // Adjust the path according to your folder structure
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';

// Mock Firebase Firestore and Auth
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    getDoc: jest.fn(),
    updateDoc: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
    onAuthStateChanged: jest.fn(),
    updateEmail: jest.fn(),
    signOut: jest.fn(),
    auth: {
        currentUser: { uid: '12345', email: 'testuser@example.com' }
    }
}));

describe('EditProfile Page', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Reset any previous mock data
    });

    test('renders loading state initially', () => {
        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>
        );
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('fetches and displays profile data', async () => {
        // Mocking Firebase getDoc to return mock data
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                givenName: 'John',
                familyName: 'Doe',
                gender: 'Male',
                phoneNumber: '1234567890',
                avatarUrl: 'https://i.pravatar.cc/300',
                email: 'testuser@example.com',
                role: 'Admin',
            }),
        });

        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue('John')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Male')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1234567890')).toBeInTheDocument();
            expect(screen.getByDisplayValue('testuser@example.com')).toBeInTheDocument();
        });
    });

    test('allows updating input fields', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                givenName: 'John',
                familyName: 'Doe',
                gender: 'Male',
                phoneNumber: '1234567890',
                email: 'testuser@example.com',
                avatarUrl: 'https://i.pravatar.cc/300',
                role: 'Admin',
            }),
        });

        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>
        );

        await waitFor(() => {
            // Update Given Name
            const givenNameInput = screen.getByLabelText(/Given Name/i);
            fireEvent.change(givenNameInput, { target: { value: 'Jane' } });
            expect(givenNameInput.value).toBe('Jane');

            // Update Email
            const emailInput = screen.getByLabelText(/Email/i);
            fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
            expect(emailInput.value).toBe('newemail@example.com');
        });
    });

    test('handles save operation', async () => {
        const updateEmail = jest.fn();
        const updateDoc = jest.fn();
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                givenName: 'John',
                familyName: 'Doe',
                gender: 'Male',
                phoneNumber: '1234567890',
                email: 'testuser@example.com',
                avatarUrl: 'https://i.pravatar.cc/300',
                role: 'Admin',
            }),
        });

        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>
        );

        // Simulate changing the email input
        await waitFor(() => {
            const emailInput = screen.getByLabelText(/Email/i);
            const confirmEmailInput = screen.getByLabelText(/Enter Email Again/i);
            fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });
            fireEvent.change(confirmEmailInput, { target: { value: 'newemail@example.com' } });
        });

        // Click on Save
        const saveButton = screen.getByText(/Save/i);
        fireEvent.click(saveButton);

        // Check if updateEmail and updateDoc have been called
        await waitFor(() => {
            expect(updateEmail).toHaveBeenCalledTimes(1);
            expect(updateDoc).toHaveBeenCalledTimes(1);
        });
    });

    test('displays error when emails do not match', async () => {
        getDoc.mockResolvedValue({
            exists: () => true,
            data: () => ({
                givenName: 'John',
                familyName: 'Doe',
                gender: 'Male',
                phoneNumber: '1234567890',
                email: 'testuser@example.com',
                avatarUrl: 'https://i.pravatar.cc/300',
                role: 'Admin',
            }),
        });

        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>
        );

        await waitFor(() => {
            // Simulate email mismatch
            const emailInput = screen.getByLabelText(/Email/i);
            const confirmEmailInput = screen.getByLabelText(/Enter Email Again/i);
            fireEvent.change(emailInput, { target: { value: 'email1@example.com' } });
            fireEvent.change(confirmEmailInput, { target: { value: 'email2@example.com' } });
        });

        // Click Save
        const saveButton = screen.getByText(/Save/i);
        fireEvent.click(saveButton);

        // Expect alert to show that emails don't match
        await waitFor(() => {
            expect(screen.getByText(/Emails do not match/i)).toBeInTheDocument();
        });
    });

    test('handles logout functionality', async () => {
        render(
            <MemoryRouter>
                <EditProfile />
            </MemoryRouter>
        );

        // Click the logout button
        const logoutButton = screen.getByText(/Logout/i);
        fireEvent.click(logoutButton);

        // Expect signOut to be called
        await waitFor(() => {
            expect(auth.signOut).toHaveBeenCalled();
        });
    });
});
