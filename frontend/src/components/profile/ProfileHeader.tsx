import React from 'react';
import {
  Mail,
  Building2,
  Home,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Star,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';

interface ProfileHeaderProps {
  user: User;
  onEditClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, onEditClick }) => {
  const getInitials = (name?: string, username?: string) => {
    const text = name && name.trim().length > 0 ? name : username || 'U';
    const parts = text.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return text.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const displayName = user.full_name || `@${user.username}`;
  const initials = getInitials(user.full_name, user.username);
  const ratingValue = user.average_rating ? Number(user.average_rating).toFixed(1) : 'New';

  return (
    <div className="w-full bg-white rounded-3xl border border-neutral-200/80 shadow-sm overflow-hidden p-6 sm:p-8 transition-all">
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        
        {/* Avatar & Left Information */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left w-full md:w-auto">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-white shadow-md bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-700 flex items-center justify-center text-white text-3xl font-black tracking-wider">
              {user.profile_picture ? (
                <img
                  src={user.profile_picture}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Verification Badge Icon */}
            {user.verification_status === 'verified' && (
              <div
                className="absolute bottom-1 right-1 bg-emerald-500 text-white rounded-full p-1.5 shadow-md border-2 border-white"
                title="Verified Institute Student"
              >
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* User Primary Meta */}
          <div className="space-y-2 max-w-lg">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                {displayName}
              </h1>
              {user.full_name && (
                <span className="text-sm font-semibold text-neutral-500 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200">
                  @{user.username}
                </span>
              )}
              {user.verification_status === 'verified' ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  <span>Pending</span>
                </span>
              )}
            </div>

            {/* Bio */}
            {user.bio && (
              <p className="text-sm text-neutral-600 font-medium leading-relaxed italic">
                "{user.bio}"
              </p>
            )}

            {/* Details Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-2 gap-x-4 text-xs font-semibold text-neutral-600 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                <span>{user.institute_email}</span>
              </div>
              {user.branch && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user.branch}</span>
                </div>
              )}
              {user.academic_year && (
                <div className="flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user.academic_year}</span>
                </div>
              )}
              {user.hostel && (
                <div className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{user.hostel}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-neutral-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatDate(user.date_joined)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Rating Highlights & Edit Button */}
        <div className="flex flex-col sm:flex-row md:flex-col items-center md:items-end gap-4 shrink-0 w-full md:w-auto border-t md:border-t-0 border-neutral-100 pt-4 md:pt-0">
          <div className="flex items-center gap-3 bg-neutral-50 px-4 py-2.5 rounded-2xl border border-neutral-200/80">
            <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              <span>{ratingValue}</span>
            </div>
            <div className="h-4 w-px bg-neutral-300" />
            <div className="text-xs font-bold text-neutral-600">
              <span>{user.total_completed_rides || 0}</span> Rides Completed
            </div>
          </div>

          <Button
            onClick={onEditClick}
            className="w-full sm:w-auto bg-black text-white hover:bg-neutral-800 font-bold px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Edit3 className="w-4 h-4" />
            <span>Edit Profile</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
