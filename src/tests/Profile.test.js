import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Profile from './Profile';
import { MemoryRouter, useParams } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
import { auth } from '../firebaseConfig';
import '@testing-library/jest-dom/extend-expect';

// Mock Firebase functions
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  auth: { currentUser: { email: 'test@example.com' } }
}));

jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  doc: jest.fn()
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
  useNavigate: () => jest.fn(),
}));

describe('Profile Component', () => {
  const mockProfileData = {
    givenName: 'John',
    familyName: 'Doe',
    role: 'User',
    gender: 'Male',
    phoneNumber: '1234567890',
    avatarUrl: 'https://example.com/avatar.png',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ userID: '12345' });
    getDoc.mockResolvedValue({ exists: () => true, data: () => mockProfileData });
  });

  test('renders profile information correctly', async () => {
    render(<Profile />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toHaveValue('Male');
      expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
      expect(screen.getByLabelText('Phone Number')).toHaveValue('1234567890');
    });
  });

  test('opens edit password modal on "Edit" button click', async () => {
    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Edit'));
    
    await waitFor(() => {
      expect(screen.getByText('Enter Password to Edit')).toBeInTheDocument();
    });
  });

  test('toggles password visibility in modal', async () => {
    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Edit'));

    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.type).toBe('password'); // Initially hidden

    fireEvent.click(screen.getByLabelText(/toggle password visibility/i));
    expect(passwordInput.type).toBe('text'); // Now visible

    fireEvent.click(screen.getByLabelText(/toggle password visibility/i));
    expect(passwordInput.type).toBe('password'); // Hidden again
  });

  test('clears password input in modal', async () => {
    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Edit'));

    const passwordInput = screen.getByLabelText('Password');
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.value).toBe('password123');

    fireEvent.click(screen.getByLabelText(/clear password/i));
    expect(passwordInput.value).toBe('');
  });

  test('logs in user with password and navigates to edit profile', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce();

    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Edit'));

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });
  });

  test('shows error when password is incorrect', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Incorrect password'));

    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Edit'));

    const passwordInput = screen.getByLabelText('Password');
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument();
    });
  });

  test('logs out user and navigates to login page', async () => {
    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(signOut).toHaveBeenCalled();
    });
  });

  test('navigates back to entries page when "Go Back" button is clicked', () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate,
    }));

    render(<Profile />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText('Go Back'));

    expect(mockNavigate).toHaveBeenCalledWith('/entries/12345');
  });
});
