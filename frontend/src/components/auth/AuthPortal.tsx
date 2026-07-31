import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  LogIn,
  UserPlus,
  ArrowRight,
  Lock,
  User,
  AlertCircle,
  Car,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { login, register as registerUser } from '@/services/auth.service';
import { useAuth } from '@/hooks';
import { BRANCH_OPTIONS, HOSTEL_OPTIONS, ACADEMIC_YEAR_OPTIONS } from '@/constants/userOptions';

// Schema Validation
const loginSchema = z.object({
  username: z.string().min(1, 'Username or Roll Number is required'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full Name must be at least 2 characters').max(150),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(150)
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    institute_email: z
      .string()
      .min(1, 'Institute Email is required')
      .email('Must be a valid email address')
      .refine(
        (val) => val.toLowerCase().endsWith('@iiitk.ac.in'),
        'Must be an official IIITDM Kurnool email ending with @iiitk.ac.in'
      ),
    roll_number: z
      .string()
      .min(1, 'Roll Number is required')
      .regex(
        /^[0-9]{2,3}[A-Za-z]{2}[0-9]{4}$/,
        'Invalid Roll Number format (e.g. 124AD0048, 122CS0011, 23EC010)'
      ),
    gender: z.enum(['M', 'F', 'O', 'P', ''], {
      message: 'Please select your gender identity',
    }),
    academic_year: z.string().min(1, 'Please select your academic year'),
    branch: z.string().min(1, 'Please select your course or branch'),
    hostel: z.string().min(1, 'Please select your hostel residence'),
    phone_number: z
      .string()
      .refine((val) => {
        if (!val || val.trim() === '') return true;
        const clean = val.replace(/[\s\-+()]/g, '');
        return /^\d{10}$/.test(clean);
      }, 'Phone number must contain exactly 10 digits')
      .optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthPortalProps {
  initialMode?: 'login' | 'register';
}

export const AuthPortal: React.FC<AuthPortalProps> = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login: authLogin } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode with route changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setMode('register');
    } else if (location.pathname === '/login' || location.pathname === '/') {
      setMode(initialMode);
    }
  }, [location.pathname, initialMode]);

  // Auto-redirect logged in users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Login Form Hook
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  // Register Form Hook
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      full_name: '',
      username: '',
      institute_email: '',
      roll_number: '',
      gender: '',
      academic_year: '',
      branch: '',
      hostel: '',
      phone_number: '',
      password: '',
      confirm_password: '',
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await login(data);
      await authLogin(response.access, response.refresh);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setErrorMessage('Invalid credentials. Please check your username and password.');
        } else if (error.response?.data?.detail) {
          setErrorMessage(error.response.data.detail);
        } else {
          setErrorMessage('Unable to connect to server.');
        }
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await registerUser(data);
      const tokenResponse = await login({
        username: data.username,
        password: data.password,
      });
      await authLogin(tokenResponse.access, tokenResponse.refresh);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data) {
          const errData = error.response.data;
          if (typeof errData === 'object' && errData !== null) {
            const firstKey = Object.keys(errData)[0];
            const val = (errData as Record<string, unknown>)[firstKey];
            if (Array.isArray(val) && val.length > 0) {
              setErrorMessage(`${firstKey.toUpperCase()}: ${val[0]}`);
              return;
            } else if (typeof val === 'string') {
              setErrorMessage(val);
              return;
            } else if (errData.detail && typeof errData.detail === 'string') {
              setErrorMessage(errData.detail);
              return;
            }
          }
        }
        setErrorMessage('Registration failed. Please check your inputs and try again.');
      } else {
        setErrorMessage('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (newMode: 'login' | 'register') => {
    setErrorMessage(null);
    setMode(newMode);
    window.history.replaceState(null, '', newMode === 'register' ? '/register' : '/login');
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto w-full min-h-[calc(100vh-5rem)]">
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN — Brand & Feature Overview */}
        <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-black uppercase tracking-wider shadow-sm mx-auto lg:mx-0">
            <Car className="h-4 w-4 text-emerald-400" />
            <span>IIITDM Kurnool Ride Share</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-none">
              Auto<span className="text-emerald-600">Macha</span>
            </h1>
            <p className="text-sm sm:text-base font-semibold text-neutral-600 leading-relaxed">
              The official campus travel companion for IIITDM Kurnool students. Match auto rides, split fares, and communicate securely.
            </p>
          </div>


        </div>

        {/* RIGHT COLUMN — Unified Interactive Auth Card */}
        <div className="lg:col-span-7">
          <Card className="border-neutral-200/90 shadow-2xl bg-white rounded-3xl overflow-hidden">
            {/* Toggle Header Tabs */}
            <div className="grid grid-cols-2 p-1.5 bg-neutral-100 border-b border-neutral-200">
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  mode === 'login'
                    ? 'bg-black text-white shadow-md'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                }`}
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                  mode === 'register'
                    ? 'bg-black text-white shadow-md'
                    : 'text-neutral-600 hover:text-black hover:bg-neutral-200/60'
                }`}
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>

            <CardContent className="p-6 sm:p-8">
              {errorMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-800 shadow-2xs">
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                  <div className="flex-1">{errorMessage}</div>
                </div>
              )}

              {/* MODE 1: LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                      Roll No. / Institute Email / Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="e.g. 124AD0048@iiitk.ac.in"
                        className={`pl-10 h-11 rounded-xl font-semibold ${
                          loginForm.formState.errors.username ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...loginForm.register('username')}
                      />
                    </div>
                    {loginForm.formState.errors.username && (
                      <p className="text-xs font-bold text-red-600 mt-1">
                        {loginForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-neutral-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••••••"
                        className={`pl-10 h-11 rounded-xl font-semibold ${
                          loginForm.formState.errors.password ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...loginForm.register('password')}
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-xs font-bold text-red-600 mt-1">
                        {loginForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full gap-2 font-black text-sm uppercase tracking-wider mt-4 bg-black text-white hover:bg-neutral-800 h-12 rounded-xl shadow-lg shadow-black/10"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Signing In...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* MODE 2: REGISTER FORM */}
              {mode === 'register' && (
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Full Name
                      </Label>
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="e.g. Sai Vivek"
                        className={`h-11 rounded-xl font-semibold ${
                          registerForm.formState.errors.full_name ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...registerForm.register('full_name')}
                      />
                      {registerForm.formState.errors.full_name && (
                        <p className="text-xs font-bold text-red-600 mt-1">
                          {registerForm.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>

                    {/* Username */}
                    <div className="space-y-1.5">
                      <Label htmlFor="username" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Username
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="e.g. saivivek"
                        className={`h-11 rounded-xl font-semibold ${
                          registerForm.formState.errors.username ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...registerForm.register('username')}
                      />
                      {registerForm.formState.errors.username && (
                        <p className="text-xs font-bold text-red-600 mt-1">
                          {registerForm.formState.errors.username.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Institute Email */}
                    <div className="space-y-1.5">
                      <Label htmlFor="institute_email" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Institute Email (@iiitk.ac.in)
                      </Label>
                      <Input
                        id="institute_email"
                        type="email"
                        placeholder="e.g. 124ad0048@iiitk.ac.in"
                        className={`h-11 rounded-xl lowercase font-semibold ${
                          registerForm.formState.errors.institute_email ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...registerForm.register('institute_email')}
                      />
                      {registerForm.formState.errors.institute_email && (
                        <p className="text-xs font-bold text-red-600 mt-1">
                          {registerForm.formState.errors.institute_email.message}
                        </p>
                      )}
                    </div>

                    {/* Roll Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor="roll_number" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Roll Number
                      </Label>
                      <Input
                        id="roll_number"
                        type="text"
                        placeholder="e.g. 124AD0048"
                        className={`h-11 rounded-xl uppercase font-semibold ${
                          registerForm.formState.errors.roll_number ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...registerForm.register('roll_number')}
                      />
                      {registerForm.formState.errors.roll_number && (
                        <p className="text-xs font-bold text-red-600 mt-1">
                          {registerForm.formState.errors.roll_number.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Gender */}
                    <div className="space-y-1.5">
                      <Label htmlFor="gender" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Gender
                      </Label>
                      <select
                        id="gender"
                        disabled={isLoading}
                        {...registerForm.register('gender')}
                        className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                        <option value="P">Prefer not to say</option>
                      </select>
                    </div>

                    {/* Year */}
                    <div className="space-y-1.5">
                      <Label htmlFor="academic_year" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Year
                      </Label>
                      <select
                        id="academic_year"
                        disabled={isLoading}
                        {...registerForm.register('academic_year')}
                        className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select Year</option>
                        {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Course / Branch */}
                    <div className="space-y-1.5">
                      <Label htmlFor="branch" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Course
                      </Label>
                      <select
                        id="branch"
                        disabled={isLoading}
                        {...registerForm.register('branch')}
                        className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select Branch</option>
                        {BRANCH_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Hostel */}
                    <div className="space-y-1.5">
                      <Label htmlFor="hostel" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Hostel / Residence
                      </Label>
                      <select
                        id="hostel"
                        disabled={isLoading}
                        {...registerForm.register('hostel')}
                        className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-900 focus:ring-2 focus:ring-black"
                      >
                        <option value="">Select Hostel</option>
                        {HOSTEL_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone_number" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Phone (Optional)
                      </Label>
                      <Input
                        id="phone_number"
                        type="tel"
                        placeholder="e.g. 9876543210"
                        className="h-11 rounded-xl font-semibold"
                        disabled={isLoading}
                        {...registerForm.register('phone_number')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="reg_password" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Password
                      </Label>
                      <Input
                        id="reg_password"
                        type="password"
                        placeholder="••••••••••••"
                        className={`h-11 rounded-xl font-semibold ${
                          registerForm.formState.errors.password ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...registerForm.register('password')}
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password" className="text-neutral-800 font-extrabold text-xs uppercase tracking-wider">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm_password"
                        type="password"
                        placeholder="••••••••••••"
                        className={`h-11 rounded-xl font-semibold ${
                          registerForm.formState.errors.confirm_password ? 'border-red-500' : ''
                        }`}
                        disabled={isLoading}
                        {...registerForm.register('confirm_password')}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full gap-2 font-black text-sm uppercase tracking-wider mt-4 bg-black text-white hover:bg-neutral-800 h-12 rounded-xl shadow-lg shadow-black/10"
                  >
                    {isLoading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Registering Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};
