import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';
import { MemoryRouter } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import '@testing-library/jest-dom/extend-expect';

// Mock Firebase functions
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form', () => {
    render(<Login />, { wrapper: MemoryRouter });

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
  });

  test('clears email and password fields when clear buttons are clicked', () => {
    render(<Login />, { wrapper: MemoryRouter });

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');

    fireEvent.click(screen.getAllByRole('button', { name: /clear/i })[0]); // Clear email
    fireEvent.click(screen.getAllByRole('button', { name: /clear/i })[1]); // Clear password

    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
  });

  test('toggles password visibility', () => {
    render(<Login />, { wrapper: MemoryRouter });

    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    expect(passwordInput.type).toBe('password'); // Initially hidden

    fireEvent.click(screen.getByLabelText(/toggle password visibility/i)); // Show password
    expect(passwordInput.type).toBe('text'); // Now visible

    fireEvent.click(screen.getByLabelText(/toggle password visibility/i)); // Hide password again
    expect(passwordInput.type).toBe('password');
  });

  test('submits form and logs in user', async () => {
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: '12345' },
    });

    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'password123' },
    });

    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
    });

    // Ideally, check if the navigation happens (mock useNavigate)
  });

  test('displays error on login failure', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Invalid credentials'));

    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'wrong@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' },
    });

    fireEvent.click(screen.getByText(/login/i));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials or user not found/i)).toBeInTheDocument();
    });
  });

  test('opens reset password modal when "Forgot Password" is clicked', () => {
    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText(/forgot password/i));

    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/enter your email/i)).toBeInTheDocument();
  });

  test('sends password reset email', async () => {
    sendPasswordResetEmail.mockResolvedValueOnce();

    render(<Login />, { wrapper: MemoryRouter });

    fireEvent.click(screen.getByText(/forgot password/i));

    const resetEmailInput = screen.getByLabelText(/enter your email/i);
    fireEvent.change(resetEmailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByText(/reset password/i));

    await waitFor(() => {
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
    });

    expect(screen.getByText(/password reset email sent/i)).toBeInTheDocument();
  });
});
