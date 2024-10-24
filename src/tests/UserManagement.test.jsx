import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import UserManagement from '../pages/UserManagement';
import { getDocs, setDoc, deleteDoc, updateDoc, collection } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut, getAuth, onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter } from 'react-router-dom';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('firebase/auth');
jest.mock('../firebaseConfig', () => ({
  db: jest.fn(),
  auth: jest.fn(),
}));

describe('UserManagement Component', () => {
  beforeEach(() => {
    // Mock Firestore collection
    getDocs.mockResolvedValue({
      docs: [
        { id: '1', data: () => ({ givenName: 'John', familyName: 'Doe', email: 'john@example.com', role: 'Editor', phoneNumber: '1234567890' }) },
        { id: '2', data: () => ({ givenName: 'Jane', familyName: 'Smith', email: 'jane@example.com', role: 'Senior Editor', phoneNumber: '0987654321' }) },
      ],
    });

    // Mock Firebase Auth user
    onAuthStateChanged.mockImplementation((auth, callback) => {
      const user = { uid: 'adminUserId' };  // assuming admin user logged in
      callback(user);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();  // clear all mocks between tests
  });

  it('renders the UserManagement component and fetches users', async () => {
    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    // Check for the loading state
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    // Wait for users to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    });
  });

  it('allows adding a new user', async () => {
    // Mock user creation
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'newUserId' },
    });

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    // Open the modal for adding a new user
    fireEvent.click(screen.getByText(/Create New User Account/i));

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'newuser@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Given Name/i), { target: { value: 'New' } });
    fireEvent.change(screen.getByLabelText(/Family Name/i), { target: { value: 'User' } });

    // Click 'Add User'
    fireEvent.click(screen.getByText(/Add User/i));

    // Check if setDoc was called with correct data
    await waitFor(() => {
      expect(setDoc).toHaveBeenCalledWith(expect.anything(), {
        uid: 'newUserId',
        givenName: 'New',
        familyName: 'User',
        avatarUrl: 'https://i.pravatar.cc/300',
        role: '',
        phoneNumber: '',
        gender: '',
        email: 'newuser@example.com',
      });
    });

    // Ensure signOut was called
    expect(signOut).toHaveBeenCalled();
  });

  it('allows deleting a user', async () => {
    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    // Wait for users to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click delete for a user
    fireEvent.click(screen.getAllByText(/Delete/i)[0]);

    // Confirm the deletion
    global.confirm = jest.fn(() => true);  // Mock window.confirm
    await waitFor(() => {
      expect(deleteDoc).toHaveBeenCalledWith(expect.anything()); // check if deleteDoc was called
    });
  });

  it('allows role changing for a user', async () => {
    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    // Wait for users to be fetched and rendered
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click to change role of the first user
    fireEvent.click(screen.getAllByText(/Editor/i)[0]);

    // Select a new role from dropdown
    fireEvent.click(screen.getByText('Head Director'));

    // Check if updateDoc was called with the new role
    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(expect.anything(), { role: 'Head Director' });
    });
  });
});
