import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  X,
  Upload,
  Trash2,
  Save,
  Loader2,
  Building2,
  Home,
  User as UserIcon,
  Phone,
  GraduationCap,
  FileText,
  AlertCircle,
  Camera,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { User } from '@/types';
import { BRANCH_OPTIONS, HOSTEL_OPTIONS, ACADEMIC_YEAR_OPTIONS } from '@/constants/userOptions';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const editProfileSchema = z.object({
  full_name: z.string().max(150, 'Full name cannot exceed 150 characters').optional(),
  branch: z.string().max(100, 'Branch must be at most 100 characters').optional(),
  academic_year: z.string().max(50, 'Academic year must be at most 50 characters').optional(),
  hostel: z.string().max(100, 'Hostel must be at most 100 characters').optional(),
  gender: z.enum(['M', 'F', 'O', 'P', '']),
  phone_number: z
    .string()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      const clean = val.replace(/[\s\-+()]/g, '');
      return /^\d{10}$/.test(clean);
    }, 'Phone number must contain exactly 10 digits')
    .optional(),
  bio: z.string().max(300, 'Bio cannot exceed 300 characters').optional(),
});

type EditProfileFormValues = z.infer<typeof editProfileSchema>;

interface EditProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (data: FormData) => Promise<void>;
}

export const EditProfileDialog: React.FC<EditProfileDialogProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user.profile_picture || null);
  const [removePicture, setRemovePicture] = useState<boolean>(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const validGender = (g?: string): EditProfileFormValues['gender'] =>
    g && ['M', 'F', 'O', 'P'].includes(g) ? (g as EditProfileFormValues['gender']) : '';

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      full_name: user.full_name || '',
      branch: user.branch || '',
      academic_year: user.academic_year || '',
      hostel: user.hostel || '',
      gender: validGender(user.gender),
      phone_number: user.phone_number || '',
      bio: user.bio || '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        full_name: user.full_name || '',
        branch: user.branch || '',
        academic_year: user.academic_year || '',
        hostel: user.hostel || '',
        gender: validGender(user.gender),
        phone_number: user.phone_number || '',
        bio: user.bio || '',
      });
      setSelectedImage(null);
      setPreviewUrl(user.profile_picture || null);
      setRemovePicture(false);
      setFileError(null);
      setApiError(null);
    }
  }, [isOpen, user, reset]);

  if (!isOpen) return null;

  const bioContent = watch('bio') || '';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFileError('Only image files (JPEG, PNG, WebP) are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Image file size must not exceed 5 MB.');
      return;
    }

    setSelectedImage(file);
    setRemovePicture(false);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setRemovePicture(true);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (values: EditProfileFormValues) => {
    setIsSubmitting(true);
    setApiError(null);

    try {
      const formData = new FormData();
      if (values.full_name !== undefined) formData.append('full_name', values.full_name);
      if (values.branch !== undefined) formData.append('branch', values.branch);
      if (values.academic_year !== undefined) formData.append('academic_year', values.academic_year);
      if (values.hostel !== undefined) formData.append('hostel', values.hostel);
      if (values.gender !== undefined) formData.append('gender', values.gender);
      if (values.phone_number !== undefined) formData.append('phone_number', values.phone_number);
      if (values.bio !== undefined) formData.append('bio', values.bio);

      if (removePicture) {
        formData.append('clear_picture', 'true');
      } else if (selectedImage) {
        formData.append('profile_picture', selectedImage);
      }

      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setApiError(msg || 'Failed to update profile. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100 bg-neutral-900 text-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-emerald-400" />
              <span>Edit Profile Details</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Update your personal info, hostel location, and profile picture.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-full hover:bg-neutral-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {apiError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-center gap-3 text-xs font-bold">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Profile Picture Upload Section */}
          <div className="bg-neutral-50/70 p-5 rounded-2xl border border-neutral-200/80 space-y-4">
            <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider block">
              Profile Picture
            </label>
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Picture Preview */}
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-neutral-200 bg-neutral-900 flex items-center justify-center text-white text-2xl font-black shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-neutral-400" />
                )}
              </div>

              {/* Upload Actions */}
              <div className="space-y-2 text-center sm:text-left">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-bold border-neutral-300 hover:bg-neutral-100 text-xs"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    <span>{previewUrl ? 'Replace Image' : 'Upload Image'}</span>
                  </Button>

                  {previewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="font-bold border-red-200 hover:bg-red-50 text-red-700 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      <span>Remove</span>
                    </Button>
                  )}
                </div>

                <p className="text-[11px] font-semibold text-neutral-400">
                  Supported formats: JPG, PNG, WebP (Max 5 MB)
                </p>

                {fileError && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <form id="edit-profile-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <label htmlFor="field-full-name" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                <span>Full Name</span>
              </label>
              <input
                id="field-full-name"
                type="text"
                placeholder="e.g. Alex Morgan"
                {...register('full_name')}
                className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {errors.full_name && (
                <p className="text-xs font-bold text-red-600 mt-1">{errors.full_name.message}</p>
              )}
            </div>

            {/* Branch & Academic Year Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Branch */}
              <div className="space-y-1.5">
                <label htmlFor="field-branch" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Course</span>
                </label>
                <select
                  id="field-branch"
                  {...register('branch')}
                  className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
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

              {/* Academic Year */}
              <div className="space-y-1.5">
                <label htmlFor="field-year" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Academic Year</span>
                </label>
                <select
                  id="field-year"
                  {...register('academic_year')}
                  className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
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
            </div>

            {/* Hostel & Gender Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hostel */}
              <div className="space-y-1.5">
                <label htmlFor="field-hostel" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Hostel / Residence</span>
                </label>
                <select
                  id="field-hostel"
                  {...register('hostel')}
                  className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
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

              {/* Gender */}
              <div className="space-y-1.5">
                <label htmlFor="field-gender" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Gender</span>
                </label>
                <select
                  id="field-gender"
                  {...register('gender')}
                  className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
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
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label htmlFor="field-phone" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Phone Number</span>
                </span>
                <span className="text-[10px] font-semibold text-neutral-400 normal-case">10 Digits</span>
              </label>
              <input
                id="field-phone"
                type="tel"
                placeholder="e.g. 9876543210"
                {...register('phone_number')}
                className="flex h-11 w-full rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-sm font-semibold text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {errors.phone_number && (
                <p className="text-xs font-bold text-red-600 mt-1">{errors.phone_number.message}</p>
              )}
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label htmlFor="field-bio" className="text-xs font-bold text-neutral-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Bio / Introduction</span>
                </span>
                <span className={`text-[10px] font-semibold ${bioContent.length > 300 ? 'text-red-600 font-bold' : 'text-neutral-400'}`}>
                  {bioContent.length} / 300
                </span>
              </label>
              <textarea
                id="field-bio"
                rows={3}
                placeholder="Tell fellow travelers a bit about yourself..."
                {...register('bio')}
                className="flex w-full rounded-xl border border-neutral-300 bg-white p-3.5 text-sm font-medium text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {errors.bio && (
                <p className="text-xs font-bold text-red-600 mt-1">{errors.bio.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-100 bg-neutral-50 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="font-bold border-neutral-300 hover:bg-neutral-200"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="edit-profile-form"
            disabled={isSubmitting}
            className="bg-black text-white hover:bg-neutral-800 font-bold px-6 shadow-md gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>

      </div>
    </div>
  );
};
