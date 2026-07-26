import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { UserPlus, ArrowRight, Lock, User, Mail, Hash, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { register as registerUser, login } from '@/services/auth.service';
import { useAuth } from '@/hooks';

const registerSchema = z
  .object({
    username: z.string().min(3, 'Username must be at least 3 characters').max(150),
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
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Please confirm your password'),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    phone_number: z.string().optional(),
    branch: z.string().optional(),
    hostel: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const navigate = useNavigate();
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
      username: '',
      institute_email: '',
      roll_number: '',
      password: '',
      confirm_password: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      branch: '',
      hostel: '',
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
      navigate('/');
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
        setErrorMessage('Registration failed. Please check your details and try again.');
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-black ring-1 ring-neutral-200 mb-2 shadow-sm">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-black">Create Account</h2>
        </div>

        <Card className="border-neutral-200 shadow-xl bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-black">Registration</CardTitle>
          </CardHeader>
          <CardContent>
            {errorMessage && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-neutral-800 font-medium">Username / Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="e.g. Duvva Sai Vivek"
                      className={`pl-9 ${errors.username ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      disabled={isLoading}
                      {...register('username')}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.username.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roll_number" className="text-neutral-800 font-medium">Roll Number</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input
                      id="roll_number"
                      type="text"
                      placeholder="e.g. 124AD0048"
                      className={`pl-9 uppercase ${errors.roll_number ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      disabled={isLoading}
                      {...register('roll_number')}
                    />
                  </div>
                  {errors.roll_number && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.roll_number.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="institute_email" className="text-neutral-800 font-medium">Institute Email (@iiitk.ac.in)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="institute_email"
                    type="email"
                    placeholder="e.g. 124AD0048@iiitk.ac.in"
                    className={`pl-9 lowercase ${errors.institute_email ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    disabled={isLoading}
                    {...register('institute_email')}
                  />
                </div>
                {errors.institute_email && (
                  <p className="text-xs text-red-600 font-medium mt-1">{errors.institute_email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-neutral-800 font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      className={`pl-9 ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      disabled={isLoading}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm_password" className="text-neutral-800 font-medium">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Repeat password"
                      className={`pl-9 ${errors.confirm_password ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                      disabled={isLoading}
                      {...register('confirm_password')}
                    />
                  </div>
                  {errors.confirm_password && (
                    <p className="text-xs text-red-600 font-medium mt-1">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-100">
                <p className="text-xs text-neutral-500 mb-4">Optional Student Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="branch" className="text-neutral-800 font-medium text-xs">Branch</Label>
                    <Input
                      id="branch"
                      type="text"
                      placeholder="e.g. AI & DS"
                      disabled={isLoading}
                      {...register('branch')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hostel" className="text-neutral-800 font-medium text-xs">Hostel & Room No.</Label>
                    <Input
                      id="hostel"
                      type="text"
                      placeholder="e.g. KALAM HALL, R-102"
                      disabled={isLoading}
                      {...register('hostel')}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gap-2 font-semibold text-base mt-4 bg-black text-white hover:bg-neutral-800 shadow-lg shadow-black/10"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-neutral-100 pt-4 pb-6">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-black hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
