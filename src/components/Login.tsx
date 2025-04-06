import React, { useState, useEffect } from 'react';
import { Package, Mail, Lock, AlertCircle, User, Check, X, Eye, EyeOff, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase, checkSupabaseConnection } from '../lib/supabase';
import PasswordReset from './PasswordReset';

interface LoginProps {
  onLogin: () => void;
}

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isConnectionOk, setIsConnectionOk] = useState(true);

  // Force light theme for login page
  useEffect(() => {
    // Save current theme preference
    const currentTheme = localStorage.getItem('theme');
    
    // Force light theme
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    
    // Cleanup function to restore theme preference when component unmounts
    return () => {
      if (currentTheme) {
        localStorage.setItem('theme', currentTheme);
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        }
      }
    };
  }, []);

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection();
      setIsConnectionOk(isConnected);
      if (!isConnected) {
        toast.error('Unable to connect to the server. Please try again later.');
      }
    };
    checkConnection();
  }, []);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });

  // Update password strength indicators when password changes
  useEffect(() => {
    if (isSignUp) {
      setPasswordStrength({
        hasMinLength: password.length >= 8,
        hasUpperCase: /[A-Z]/.test(password),
        hasLowerCase: /[a-z]/.test(password),
        hasNumber: /[0-9]/.test(password),
        hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
      });
    }
  }, [password, isSignUp]);

  const validateName = (name: string): string => {
    if (!name) return 'This field is required';
    if (name.length < 2) return 'Must be at least 2 characters';
    if (!/^[a-zA-Z\s-']+$/.test(name)) return 'Only letters, spaces, hyphens, and apostrophes allowed';
    if (name.length > 50) return 'Must be less than 50 characters';
    return '';
  };

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) return 'Invalid email format';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (!isSignUp) return ''; // Skip detailed validation for login

    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must include a number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must include a special character';
    return '';
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (isSignUp) {
      const firstNameError = validateName(firstName.trim());
      const lastNameError = validateName(lastName.trim());
      if (firstNameError) errors.firstName = firstNameError;
      if (lastNameError) errors.lastName = lastNameError;
    }

    const emailError = validateEmail(email.trim());
    const passwordError = validatePassword(password);
    
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isConnectionOk) {
      toast.error('Unable to connect to the server. Please try again later.');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              first_name: firstName.trim(),
              last_name: lastName.trim()
            }
          }
        });

        if (error) throw error;

        if (data?.user) {
          toast.success('Account created successfully! You can now log in.');
          setIsSignUp(false);
          // Clear form
          setFirstName('');
          setLastName('');
          setPassword('');
          setEmail('');
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });

        if (error) throw error;

        if (data?.user) {
          toast.success('Successfully logged in!');
          onLogin();
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      setError(error.message || (isSignUp 
        ? 'Failed to create account. Please try again.' 
        : 'Invalid email or password. Please try again.'
      ));
      toast.error(isSignUp ? 'Sign up failed' : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderPasswordStrength = () => {
    const requirements = [
      { label: 'At least 8 characters', met: passwordStrength.hasMinLength },
      { label: 'Contains uppercase letter', met: passwordStrength.hasUpperCase },
      { label: 'Contains lowercase letter', met: passwordStrength.hasLowerCase },
      { label: 'Contains number', met: passwordStrength.hasNumber },
      { label: 'Contains special character', met: passwordStrength.hasSpecialChar }
    ];

    return (
      <div className="mt-2 space-y-2">
        <p className="text-sm font-medium text-gray-700">Password requirements:</p>
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div key={index} className="flex items-center gap-2">
              {req.met ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <X className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${req.met ? 'text-green-700' : 'text-red-700'}`}>
                {req.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (showPasswordReset) {
    return <PasswordReset onBack={() => setShowPasswordReset(false)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="rounded-lg bg-gray-900 p-2">
            <Package className="w-12 h-12 text-blue-400" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to WareFlow
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {isSignUp ? 'Create your account' : 'Sign in to manage your warehouse'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10">
          {/* Test Credentials Box */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2 mb-2 text-blue-800">
              <Info className="w-5 h-5" />
              <h3 className="font-medium">Test Credentials</h3>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p><span className="font-medium">Email:</span> test@wareflow.com</p>
              <p><span className="font-medium">Password:</span> password123</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700">
                <AlertCircle className="w-5 h-5" />
                <p className="text-sm">{error}</p>
              </div>
            )}
            
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        if (validationErrors.firstName) {
                          setValidationErrors({ ...validationErrors, firstName: '' });
                        }
                      }}
                      onBlur={(e) => {
                        const error = validateName(e.target.value.trim());
                        if (error) {
                          setValidationErrors({ ...validationErrors, firstName: error });
                        }
                      }}
                      className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                        validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm`}
                      placeholder="John"
                    />
                  </div>
                  {validationErrors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        if (validationErrors.lastName) {
                          setValidationErrors({ ...validationErrors, lastName: '' });
                        }
                      }}
                      onBlur={(e) => {
                        const error = validateName(e.target.value.trim());
                        if (error) {
                          setValidationErrors({ ...validationErrors, lastName: error });
                        }
                      }}
                      className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                        validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm`}
                      placeholder="Doe"
                    />
                  </div>
                  {validationErrors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                  )}
                </div>
              </div>
            )}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (validationErrors.email) {
                      setValidationErrors({ ...validationErrors, email: '' });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validateEmail(e.target.value.trim());
                    if (error) {
                      setValidationErrors({ ...validationErrors, email: error });
                    }
                  }}
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    validationErrors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm`}
                  placeholder="you@company.com"
                />
              </div>
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (validationErrors.password) {
                      setValidationErrors({ ...validationErrors, password: '' });
                    }
                  }}
                  onBlur={(e) => {
                    const error = validatePassword(e.target.value);
                    if (error) {
                      setValidationErrors({ ...validationErrors, password: error });
                    }
                  }}
                  className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                    validationErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <Eye className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
              {isSignUp && renderPasswordStrength()}
            </div>

            {!isSignUp && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <button
                    type="button"
                    onClick={() => setShowPasswordReset(true)}
                    className="font-medium text-blue-600 hover:text-blue-500"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || Object.keys(validationErrors).length > 0 || !isConnectionOk}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  isSignUp ? 'Creating account...' : 'Signing in...'
                ) : (
                  isSignUp ? 'Create Account' : 'Sign in'
                )}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                  setValidationErrors({});
                  setPassword('');
                  if (!isSignUp) {
                    setFirstName('');
                    setLastName('');
                  }
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;