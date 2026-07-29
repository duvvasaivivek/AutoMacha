import React, { useEffect, useState, useCallback } from 'react';
import {
  User as UserIcon,
  Mail,
  Building2,
  Home,
  Phone,
  Lock,
  UserCog,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ShieldCheck,
  GraduationCap,
  FileText,
  Edit3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProfile, updateProfile } from '@/services/profile.service';
import { useAuth } from '@/hooks';
import type { User } from '@/types';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ProfilePlaceholders } from '@/components/profile/ProfilePlaceholders';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';

export const ProfilePage: React.FC = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);

  const loadProfileData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch {
      setError('Failed to load profile details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  const handleSaveProfile = async (formData: FormData) => {
    setError(null);
    setSuccessMsg(null);
    try {
      const updated = await updateProfile(formData);
      setProfile(updated);
      updateUser(updated);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      const errorText = msg || 'Failed to save profile changes. Please verify your inputs.';
      setError(errorText);
      throw err;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getGenderLabel = (g?: string) => {
    switch (g) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'O': return 'Other';
      case 'P': return 'Prefer not to say';
      default: return 'Not specified';
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 py-8 sm:py-12 max-w-6xl mx-auto w-full space-y-8">
      {/* Top Title Banner */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-neutral-900 flex items-center gap-3">
            <UserCog className="h-8 w-8 text-black" />
            <span>User Profile</span>
          </h1>
          <p className="text-sm font-semibold text-neutral-600 mt-1">
            Manage your verified identity, ride statistics, contact details, and preferences.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 shadow-sm animate-in fade-in-50 duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <span className="text-xs font-bold">{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {error && !isLoading && (
        <div className="w-full p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 flex items-center justify-between gap-3 shadow-sm animate-in fade-in-50 duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
            <span className="text-xs font-bold">{error}</span>
          </div>
          <Button onClick={loadProfileData} size="sm" variant="outline" className="text-xs font-bold border-red-300">
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="w-full space-y-6 animate-pulse">
          <div className="w-full h-48 bg-neutral-200/60 rounded-3xl" />
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200/60 rounded-2xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-neutral-200/60 rounded-3xl" />
            <div className="h-64 bg-neutral-200/60 rounded-3xl" />
          </div>
        </div>
      )}

      {/* Profile Loaded Content */}
      {!isLoading && profile && (
        <div className="w-full space-y-8 animate-in fade-in-50 duration-300">
          
          {/* Header Card */}
          <ProfileHeader user={profile} onEditClick={() => setIsEditDialogOpen(true)} />

          {/* Statistics Grid */}
          <ProfileStats user={profile} />

          {/* Core Info & Account Meta Section */}
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Personal Information (Left 7 Cols) */}
            <div className="lg:col-span-7">
              <Card className="border-neutral-200/80 bg-white shadow-sm rounded-3xl overflow-hidden h-full">
                <CardHeader className="border-b border-neutral-100 px-6 py-5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-black text-neutral-900">
                      Personal Information
                    </CardTitle>
                    <CardDescription className="text-xs text-neutral-500 mt-0.5">
                      Your registered contact & academic attributes.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setIsEditDialogOpen(true)}
                    size="sm"
                    variant="ghost"
                    className="text-xs font-bold text-neutral-600 hover:text-black gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </Button>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Read-Only Email */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-neutral-600" />
                          <span>Institute Email</span>
                        </span>
                        <Lock className="w-3.5 h-3.5 text-neutral-400" />
                      </div>
                      <div className="text-xs font-bold text-neutral-900 truncate">
                        {profile.institute_email}
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Phone Number</span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900">
                        {profile.phone_number || 'Not provided'}
                      </div>
                    </div>

                    {/* Course / Branch */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Course / Department</span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900">
                        {profile.branch || 'Not specified'}
                      </div>
                    </div>

                    {/* Academic Year */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Academic Year</span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900">
                        {profile.academic_year || 'Not specified'}
                      </div>
                    </div>

                    {/* Hostel */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Hostel Residence</span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900">
                        {profile.hostel || 'Not specified'}
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1">
                      <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-neutral-600" />
                        <span>Gender</span>
                      </div>
                      <div className="text-xs font-bold text-neutral-900">
                        {getGenderLabel(profile.gender)}
                      </div>
                    </div>
                  </div>

                  {/* Bio Full Block */}
                  <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/70 space-y-1.5">
                    <div className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Biography / About</span>
                    </div>
                    <div className="text-xs font-medium text-neutral-700 leading-relaxed italic">
                      {profile.bio || 'No biography added yet.'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Account Details & Meta (Right 5 Cols) */}
            <div className="lg:col-span-5">
              <Card className="border-neutral-200/80 bg-white shadow-sm rounded-3xl overflow-hidden h-full">
                <CardHeader className="bg-neutral-900 text-white px-6 py-5">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Account Metadata</span>
                  </div>
                  <CardTitle className="text-xl font-black text-white">
                    Account Status
                  </CardTitle>
                  <CardDescription className="text-xs text-neutral-400 mt-0.5">
                    System security status, role, and activity audit timestamps.
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 space-y-4 bg-neutral-50/50">
                  
                  {/* Email Verification Status */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-neutral-200/80">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-neutral-900">Email Verification</div>
                      <div className="text-[11px] font-medium text-neutral-500">
                        {profile.institute_email}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </span>
                  </div>

                  {/* System Role */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-neutral-200/80">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-neutral-900">Assigned Role</div>
                      <div className="text-[11px] font-medium text-neutral-500">Access permission level</div>
                    </div>
                    <span className="text-xs font-black text-neutral-900 bg-neutral-100 border border-neutral-300 px-3 py-1 rounded-full">
                      {profile.role || (profile.is_superuser ? 'Super Admin' : profile.is_staff ? 'Admin' : 'Student')}
                    </span>
                  </div>

                  {/* Account Created Date */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-neutral-200/80">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-900">Account Created</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-600">
                      {formatDate(profile.date_joined)}
                    </span>
                  </div>

                  {/* Last Updated Timestamp */}
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-neutral-200/80">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="text-xs font-bold text-neutral-900">Last Profile Update</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-600">
                      {formatDate(profile.last_updated)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>

          {/* Placeholders / Future Modules */}
          <ProfilePlaceholders />

          {/* Edit Profile Modal Dialog */}
          <EditProfileDialog
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            user={profile}
            onSave={handleSaveProfile}
          />
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
