import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import {
  UserPlus,
  ArrowRight,
  Lock,
  User,
  Mail,
  Hash,
  AlertCircle,
  Phone,
  Building2,
  Home,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { register as registerUser, login } from '@/services/auth.service';
import { useAuth } from '@/hooks';
import { BRANCH_OPTIONS, HOSTEL_OPTIONS, ACADEMIC_YEAR_OPTIONS } from '@/constants/userOptions';

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

type RegisterFormValues = z.infer<typeof registerSchema>;

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login: authLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
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

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      await registerUser(data);
      const tokenResponse = await login({
        username: data.username,
        password: data.password,
      });
      await authLogin(tokenResponse.access, tokenResponse.refresh);
      const from = (location.state as LocationState | null)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
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
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-10 max-w-4xl mx-auto w-full">
      <div className="w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-900 text-white shadow-md mb-1">
            <UserPlus className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-neutral-900">Create Student Account</h1>
          <p className="text-sm font-semibold text-neutral-600">
            Register your student credentials and profile details to start ride-sharing.
          </p>
        </div>

        <Card className="border-neutral-200/90 shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-neutral-100 bg-neutral-50/50 px-6 py-4">
            <CardTitle className="text-lg font-black text-neutral-900">Student Profile Information</CardTitle>
            <CardDescription className="text-xs font-semibold text-neutral-500">
              Provide complete profile details for campus ride matching and peer safety.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 font-bold text-xs">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              
              {/* Personal Credentials */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
                  1. Identity & Credentials
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="full_name" className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input
                        id="full_name"
                        type="text"
                        placeholder="e.g. Duvva Sai Vivek"
                        className={`pl-9 h-11 rounded-xl font-medium ${errors.full_name ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        disabled={isLoading}
                        {...register('full_name')}
                      />
                    </div>
                    {errors.full_name && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Username */}
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
                      Username
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="e.g. saivivek"
                        className={`pl-9 h-11 rounded-xl font-medium ${errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        disabled={isLoading}
                        {...register('username')}
                      />
                    </div>
                    {errors.username && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.username.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Institute Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="institute_email" className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
                      Institute Email (@iiitk.ac.in)
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input
                        id="institute_email"
                        type="email"
                        placeholder="e.g. 124ad0048@iiitk.ac.in"
                        className={`pl-9 h-11 rounded-xl lowercase font-medium ${errors.institute_email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        disabled={isLoading}
                        {...register('institute_email')}
                      />
                    </div>
                    {errors.institute_email && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.institute_email.message}</p>
                    )}
                  </div>

                  {/* Roll Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="roll_number" className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
                      Roll Number
                    </Label>
                    <div className="relative">
                      <Hash className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input
                        id="roll_number"
                        type="text"
                        placeholder="e.g. 124AD0048"
                        className={`pl-9 h-11 rounded-xl uppercase font-medium ${errors.roll_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        disabled={isLoading}
                        {...register('roll_number')}
                      />
                    </div>
                    {errors.roll_number && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.roll_number.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Details (Gender, Academic Year, Branch, Hostel, Phone) */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
                  2. Student & Profile Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Gender Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-neutral-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Gender</span>
                    </Label>
                    <select
                      id="gender"
                      disabled={isLoading}
                      {...register('gender')}
                      className={`flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${errors.gender ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Gender</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                      <option value="P">Prefer not to say</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.gender.message}</p>
                    )}
                  </div>

                  {/* Academic Year Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="academic_year" className="text-neutral-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Academic Year</span>
                    </Label>
                    <select
                      id="academic_year"
                      disabled={isLoading}
                      {...register('academic_year')}
                      className={`flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${errors.academic_year ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Year</option>
                      {ACADEMIC_YEAR_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.academic_year && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.academic_year.message}</p>
                    )}
                  </div>

                  {/* Course / Branch Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="branch" className="text-neutral-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Course</span>
                    </Label>
                    <select
                      id="branch"
                      disabled={isLoading}
                      {...register('branch')}
                      className={`flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${errors.branch ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Course</option>
                      {BRANCH_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.branch && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.branch.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Hostel Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="hostel" className="text-neutral-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-neutral-500" />
                      <span>Hostel / Residence</span>
                    </Label>
                    <select
                      id="hostel"
                      disabled={isLoading}
                      {...register('hostel')}
                      className={`flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-black ${errors.hostel ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select Hostel</option>
                      {HOSTEL_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    {errors.hostel && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.hostel.message}</p>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <Label htmlFor="phone_number" className="text-neutral-800 font-bold text-xs uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-neutral-500" />
                        <span>Phone Number</span>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-semibold normal-case">Optional</span>
                    </Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className={`h-11 rounded-xl font-medium ${errors.phone_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      disabled={isLoading}
                      {...register('phone_number')}
                    />
                    {errors.phone_number && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.phone_number.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 border-b border-neutral-100 pb-2">
                  3. Account Password
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="At least 8 characters"
                        className={`pl-9 h-11 rounded-xl font-medium ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        disabled={isLoading}
                        {...register('password')}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm_password" className="text-neutral-800 font-bold text-xs uppercase tracking-wider">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                      <Input
                        id="confirm_password"
                        type="password"
                        placeholder="Repeat password"
                        className={`pl-9 h-11 rounded-xl font-medium ${errors.confirm_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        disabled={isLoading}
                        {...register('confirm_password')}
                      />
                    </div>
                    {errors.confirm_password && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.confirm_password.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 font-bold text-base mt-6 bg-black text-white hover:bg-neutral-800 h-12 rounded-xl shadow-lg shadow-black/10"
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
          </CardContent>

          <CardFooter className="flex justify-center border-t border-neutral-100 bg-neutral-50/50 py-4">
            <p className="text-sm font-semibold text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-extrabold text-black hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
