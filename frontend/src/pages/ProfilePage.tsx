import React, { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  User as UserIcon,
  Mail,
  Building2,
  Home,
  Phone,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  UserCog,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProfile, updateProfile } from '@/services/profile.service';
import { useAuth } from '@/hooks';
import type { User } from '@/types';
import { BRANCH_OPTIONS, HOSTEL_OPTIONS } from '@/constants/userOptions';


const profileSchema = z.object({
  branch: z.string().max(100, 'Branch must be at most 100 characters'),
  hostel: z.string().max(100, 'Hostel must be at most 100 characters'),
  gender: z.enum(['M', 'F', 'O', 'P', '']),
  phone_number: z.string().max(20, 'Phone number must be at most 20 characters'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfilePage: React.FC = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      branch: '',
      hostel: '',
      gender: '',
      phone_number: '',
    },
  });

  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
      const validGender = (g?: string): ProfileFormValues['gender'] =>
        g && ['M', 'F', 'O', 'P'].includes(g) ? (g as ProfileFormValues['gender']) : '';

      reset({
        branch: data.branch || '',
        hostel: data.hostel || '',
        gender: validGender(data.gender),
        phone_number: data.phone_number || '',
      });
    } catch {
      setError('Failed to load profile details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await updateProfile(data);
      setProfile(updated);
      updateUser(updated);
      const validGender = (g?: string): ProfileFormValues['gender'] =>
        g && ['M', 'F', 'O', 'P'].includes(g) ? (g as ProfileFormValues['gender']) : '';

      reset({
        branch: updated.branch || '',
        hostel: updated.hostel || '',
        gender: validGender(updated.gender),
        phone_number: updated.phone_number || '',
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(msg || 'Failed to save profile changes. Please check your inputs.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      const validGender = (g?: string): ProfileFormValues['gender'] =>
        g && ['M', 'F', 'O', 'P'].includes(g) ? (g as ProfileFormValues['gender']) : '';

      reset({
        branch: profile.branch || '',
        hostel: profile.hostel || '',
        gender: validGender(profile.gender),
        phone_number: profile.phone_number || '',
      });
      setError(null);
      setSuccessMsg(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-5xl mx-auto w-full">
      {/* Page Header */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-black flex items-center gap-3">
            <UserCog className="h-8 w-8 text-black" />
            <span>Profile Management</span>
          </h1>
          <p className="text-sm font-semibold text-neutral-600 mt-1">
            View your verified student identity and update your personal contact details.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="w-full flex flex-col items-center justify-center py-24 space-y-3 bg-neutral-50/50 rounded-2xl border border-neutral-200/60">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="text-xs font-semibold text-neutral-500">Loading profile data...</p>
        </div>
      )}

      {!isLoading && error && !profile && (
        <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-red-200 bg-red-50 text-center space-y-4 shadow-sm">
          <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-red-900 text-base">Unable to Load Profile</h3>
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <Button onClick={loadProfileData} size="sm" variant="outline" className="font-semibold border-red-300 hover:bg-red-100 text-red-900">
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && profile && (
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in-50 duration-300">
          {/* Read-Only Verified Credentials (Left / Top Column) */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-neutral-200/80 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-neutral-900 text-white px-6 py-5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Verified Identity</span>
                </div>
                <CardTitle className="text-xl font-black text-white">
                  Academic Credentials
                </CardTitle>
                <CardDescription className="text-xs text-neutral-400 mt-1">
                  These fields are verified via your institute email and cannot be edited.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-5 bg-neutral-50/50">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="h-3.5 w-3.5 text-neutral-600" />
                    <span>Username</span>
                  </label>
                  <div className="h-11 w-full rounded-xl border border-neutral-200/80 bg-neutral-100/70 px-3.5 py-2.5 text-sm font-bold text-neutral-800 flex items-center justify-between select-none">
                    <span>@{profile.username}</span>
                    <Lock className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-neutral-600" />
                    <span>Institute Email</span>
                  </label>
                  <div className="h-11 w-full rounded-xl border border-neutral-200/80 bg-neutral-100/70 px-3.5 py-2.5 text-sm font-bold text-neutral-800 flex items-center justify-between select-none overflow-hidden">
                    <span className="truncate">{profile.institute_email}</span>
                    <Lock className="h-4 w-4 text-neutral-400 shrink-0 ml-2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-neutral-600" />
                    <span>Roll Number</span>
                  </label>
                  <div className="h-11 w-full rounded-xl border border-neutral-200/80 bg-neutral-100/70 px-3.5 py-2.5 text-sm font-bold text-neutral-800 flex items-center justify-between select-none">
                    <span>{profile.roll_number}</span>
                    <Lock className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Editable Form (Right / Bottom Column) */}
          <div className="lg:col-span-7">
            <Card className="border-neutral-200/80 bg-white shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-neutral-100 px-6 py-5">
                <CardTitle className="text-xl font-black text-black">
                  Personal & Contact Details
                </CardTitle>
                <CardDescription className="text-xs text-neutral-500 mt-1">
                  Update your study course, hostel residence, and optional phone contact for peer coordination.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {successMsg && (
                  <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-in fade-in-50 duration-200">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    <span className="text-xs font-bold">{successMsg}</span>
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-3 animate-in fade-in-50 duration-200">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                    <span className="text-xs font-bold">{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {/* Branch Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="field-branch" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Course</span>
                    </label>
                    <select
                      id="field-branch"
                      {...register('branch')}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
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

                  {/* Hostel Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="field-hostel" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Home className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Hostel / Residence</span>
                    </label>
                    <select
                      id="field-hostel"
                      {...register('hostel')}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
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

                  {/* Gender Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="field-gender" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                      <UserIcon className="h-3.5 w-3.5 text-neutral-600" />
                      <span>Gender Identity</span>
                    </label>
                    <select
                      id="field-gender"
                      {...register('gender')}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    >
                      <option value="">Not Specified</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="O">Other</option>
                      <option value="P">Prefer not to say</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.gender.message}</p>
                    )}
                  </div>

                  {/* Phone Number Field (Optional Future-Ready) */}
                  <div className="space-y-1.5">
                    <label htmlFor="field-phone" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-neutral-600" />
                        <span>Phone Number</span>
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-400 normal-case">Optional</span>
                    </label>
                    <input
                      id="field-phone"
                      type="tel"
                      placeholder="e.g., +91 98765 43210"
                      {...register('phone_number')}
                      className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
                    />
                    {errors.phone_number && (
                      <p className="text-xs font-bold text-red-600 mt-1">{errors.phone_number.message}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isSaving || !isDirty}
                      className="font-semibold border-neutral-300 hover:bg-neutral-100 px-5"
                    >
                      <X className="h-4 w-4 mr-1.5" />
                      <span>Cancel</span>
                    </Button>

                    <Button
                      type="submit"
                      disabled={isSaving || !isDirty}
                      className="bg-black text-white hover:bg-neutral-800 font-bold px-6 shadow-md gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
