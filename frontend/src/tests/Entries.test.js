// Entries.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Entries from '../pages/Entries';
import '@testing-library/jest-dom/extend-expect'; // for matchers
import axios from 'axios';
import { db } from '../firebaseConfig';
import { collection, getDocs, getDoc } from 'firebase/firestore';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock axios and Firebase Firestore APIs
jest.mock('axios');
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
}));

// Mocking Firebase Auth
jest.mock('firebase/auth', () => ({
  signOut: jest.fn(),
}));

// Sample data for entries and users
const mockEntries = [
  {
    id: 1,
    "Given Names": "John",
    "Family Name": "Doe",
    "Birth": "1900",
    "Death": "1950",
    "Short Description": "An example person",
    "Status": "No Revision",
    "Assigned To": "Editor 1",
    "Link": "http://example.com",
    "Comments": "None",
  },
];

const mockUsers = [
  {
    id: 'user1',
    givenName: 'Editor',
    familyName: 'One',
    email: 'editor@example.com',
  },
];

const mockUserProfile = {
  id: 'userID',
  email: 'editor@example.com',
  role: 'Head Director',
};

describe('Entries Page', () => {
  beforeEach(() => {
    // Mock API responses
    axios.get.mockResolvedValue({ data: mockEntries });

    // Mock Firebase Firestore responses
    getDocs.mockResolvedValue({
      docs: mockUsers.map((user) => ({
        id: user.id,
        data: () => user,
      })),
    });

    getDoc.mockResolvedValue({
      exists: () => true,
      data: () => mockUserProfile,
    });
  });

  test('renders without crashing', async () => {
    render(
      <MemoryRouter initialEntries={['/entries/userID']}>
        <Routes>
          <Route path="/entries/:userID" element={<Entries />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for entries and users to load
    await waitFor(() => expect(screen.getByText('Australian Dictionary of Biography Management System')).toBeInTheDocument());

    // Ensure the table is rendered with the correct columns
    expect(screen.getByText('Given Names')).toBeInTheDocument();
    expect(screen.getByText('Family Name')).toBeInTheDocument();
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
  });

  test('displays search and filters correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/entries/userID']}>
        <Routes>
          <Route path="/entries/:userID" element={<Entries />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for entries to load
    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

    // Type in the search bar and ensure the search input is updated
    const nameSearchInput = screen.getByPlaceholderText('by name...');
    fireEvent.change(nameSearchInput, { target: { value: 'John' } });
    expect(nameSearchInput.value).toBe('John');

    // Filter by status
    const statusButton = screen.getByText('Status');
    fireEvent.click(statusButton);
    const noRevisionOption = screen.getByText('No Revision');
    fireEvent.click(noRevisionOption);

    // Wait for the filtered results
    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());
  });

  test('handles entry assignment correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/entries/userID']}>
        <Routes>
          <Route path="/entries/:userID" element={<Entries />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for entries to load
    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

    // Select the entry
    fireEvent.click(screen.getByText('John'));

    // Click the Assign button
    const assignButton = screen.getByText('Assign');
    fireEvent.click(assignButton);

    // Verify if the assignment API call was made
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith('http://localhost:8800/assign', {
        assignedId: 'userID',
        assignedTo: 'Editor One',
        selectedEntryIds: [1],
      });
    });
  });

  test('handles pagination correctly', async () => {
    render(
      <MemoryRouter initialEntries={['/entries/userID']}>
        <Routes>
          <Route path="/entries/:userID" element={<Entries />} />
        </Routes>
      </MemoryRouter>
    );

    // Wait for entries to load
    await waitFor(() => expect(screen.getByText('John')).toBeInTheDocument());

    // Check if pagination buttons are rendered
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
  });
});
