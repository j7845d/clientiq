import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import * as authService from '../../services/authService';
import type { User } from '../../types';

interface RegisterProps {
  onRegisterSuccess: (user: User) => void;
  onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onSwitchToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    try {
        await authService.register(name, email, password);
        setSuccessMessage('Registration successful! Please log in.');
        setTimeout(() => {
            onSwitchToLogin();
        }, 2000);
    } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        setIsLoading(false);
    }
  };

  if (successMessage) {
    return (
        <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-green-600 dark:text-green-400 mb-4">Success!</h2>
            <p className="text-slate-600 dark:text-slate-300">{successMessage}</p>
        </div>
    )
  }

  return (
    <div className="p-6">
       <h2 className="text-xl font-semibold text-center text-slate-800 dark:text-white mb-1">
          Create an Account
        </h2>
        <p className="text-sm text-center text-slate-600 dark:text-slate-400 mb-6">
            Get started with your sales power-up suite.
        </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your Name"
            required
            disabled={isLoading}
            className="mt-1"
          />
        </div>
         <div>
          <Label htmlFor="email-register">Email Address</Label>
          <Input
            id="email-register"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isLoading}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password-register">Password</Label>
          <Input
            id="password-register"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={isLoading}
            className="mt-1"
          />
        </div>
         {error && <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>}
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </div>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 pt-2">
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin} className="font-medium text-sky-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300">
                Sign In
            </button>
        </p>
      </form>
    </div>
  );
};

export default Register;