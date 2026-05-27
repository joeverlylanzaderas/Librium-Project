// frontend/web/src/components/profile/ProfileScreen.tsx
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getMe, updateMe, changePassword } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import { useAuthStore } from '@/store/auth.store'
import type { User as UserType } from '@shared/types/user'
import { 
  Mail, Phone, MapPin, Calendar, Briefcase, 
  BookOpen, Award, Heart, Edit2, Save, X,
  Lock, Eye, EyeOff, Loader2, Camera, AlertCircle, User
} from 'lucide-react'
import { format } from 'date-fns'

const SEX_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
  { value: 'O', label: 'Other' },
]

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = 'dz5b4xsjy'
const CLOUDINARY_UPLOAD_PRESET = 'librium_covers'

export default function ProfileScreen() {
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    profile: {
      phone_number: '',
      address: '',
      bio: '',
      birthday: '',
      sex: '',
      profile_picture: '',
    }
  })

  const { toast } = useToast()
  const { updateUserProfile, updateUser } = useAuthStore()

  // Query
  const { data: userResponse, isLoading, refetch } = useQuery({
    queryKey: ['profile'],
    queryFn: getMe,
  })
  const user = extractData<UserType>(userResponse)

  // Populate form when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        profile: {
          phone_number: user.profile?.phone_number || '',
          address: user.profile?.address || '',
          bio: user.profile?.bio || '',
          birthday: user.profile?.birthday || '',
          sex: user.profile?.sex || '',
          profile_picture: user.profile?.profile_picture || '',
        }
      })
    }
  }, [user])

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      return data.secure_url
    } catch (error) {
      console.error('Upload error:', error)
      return null
    }
  }

  // Handle profile picture upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 2MB', variant: 'destructive' })
      return
    }

    setUploadingAvatar(true)
    try {
      const imageUrl = await uploadImageToCloudinary(file)
      if (imageUrl) {
        // Update API
        await updateMe({ profile: { profile_picture: imageUrl } })
        
        // Refetch to get fresh data
        await refetch()
        
        // Update auth store immediately
        updateUserProfile({ profile_picture: imageUrl })
        
        // Update local form data
        setFormData(prev => ({
          ...prev,
          profile: {
            ...prev.profile,
            profile_picture: imageUrl
          }
        }))
        
        toast({ title: 'Success', description: 'Profile picture updated successfully' })
      } else {
        toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Could not update profile picture', variant: 'destructive' })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: updateMe,
    onSuccess: async () => {
      await refetch()
      // Update auth store with fresh user data
      const freshUser = extractData<UserType>(userResponse)
      if (freshUser) {
        updateUser({
          full_name: freshUser.full_name,
          username: freshUser.username,
        })
        if (freshUser.profile) {
          updateUserProfile({
            phone_number: freshUser.profile.phone_number,
            address: freshUser.profile.address,
            bio: freshUser.profile.bio,
            birthday: freshUser.profile.birthday,
            sex: freshUser.profile.sex,
          })
        }
      }
      toast({ title: 'Success', description: 'Profile updated successfully' })
      setIsEditing(false)
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Failed to update profile'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
    onSettled: () => {
      setSaving(false)
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast({ title: 'Success', description: 'Password changed successfully' })
      setShowPasswordModal(false)
      setPasswordForm({ old_password: '', new_password: '', confirm_password: '' })
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.old_password?.[0] ||
                  error?.response?.data?.new_password?.[0] ||
                  error?.response?.data?.message ||
                  'Failed to change password'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
    onSettled: () => {
      setChangingPassword(false)
    },
  })

  const handleSaveProfile = () => {
    if (!formData.full_name) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' })
      return
    }
    setSaving(true)
    updateProfileMutation.mutate(formData)
  }

  const handleChangePassword = () => {
    if (!passwordForm.old_password) {
      toast({ title: 'Error', description: 'Current password is required', variant: 'destructive' })
      return
    }
    if (!passwordForm.new_password) {
      toast({ title: 'Error', description: 'New password is required', variant: 'destructive' })
      return
    }
    if (passwordForm.new_password.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' })
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' })
      return
    }
    setChangingPassword(true)
    changePasswordMutation.mutate({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
      confirm_password: passwordForm.confirm_password,
    })
  }

  const cancelEdit = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        username: user.username || '',
        profile: {
          phone_number: user.profile?.phone_number || '',
          address: user.profile?.address || '',
          bio: user.profile?.bio || '',
          birthday: user.profile?.birthday || '',
          sex: user.profile?.sex || '',
          profile_picture: user.profile?.profile_picture || '',
        }
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  const getRoleBadgeColor = () => {
    if (user?.role === 'admin') return 'bg-[#FEF3C7] text-[#D97706]'
    if (user?.role === 'librarian') return 'bg-[#EDE9FE] text-[#7C3AED]'
    return 'bg-[#E0F2FE] text-[#0369A1]'
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '—'
    return format(new Date(dateString), 'MMMM d, yyyy')
  }

  const getInitials = () => {
    if (!user?.full_name) return 'U'
    return user.full_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const calculateAge = (birthday: string | null | undefined) => {
    if (!birthday) return null
    const today = new Date()
    const birthDate = new Date(birthday)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#281711] font-baskerville">My Profile</h1>
          <p className="text-sm text-[#706251] mt-1">Manage your personal information and account settings</p>
        </div>

        {/* Profile Card */}
        <div className="bg-white border border-[#EFE9CE] overflow-hidden">
          {/* Cover / Avatar Section */}
          <div className="bg-[#1F150C] px-6 py-8 flex flex-col items-center border-b border-[#412D15]">
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              
              {formData.profile.profile_picture ? (
                <img
                  src={formData.profile.profile_picture}
                  alt={user?.full_name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-[#FFC85C]"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[#412D15] flex items-center justify-center border-4 border-[#FFC85C]">
                  <span className="text-3xl font-bold text-[#FFC85C]">{getInitials()}</span>
                </div>
              )}
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 p-1.5 bg-[#FFC85C] rounded-full hover:bg-[#F69D39] transition-colors disabled:opacity-50"
              >
                {uploadingAvatar ? (
                  <Loader2 size={14} className="animate-spin text-[#1F150C]" />
                ) : (
                  <Camera size={14} className="text-[#1F150C]" />
                )}
              </button>
            </div>
            <h2 className="text-xl font-bold text-white mt-4">{user?.full_name}</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-1 text-[10px] font-bold rounded ${getRoleBadgeColor()}`}>
                {user?.role?.toUpperCase()}
              </span>
              {user?.is_active ? (
                <span className="px-2 py-1 text-[10px] font-bold bg-[#E6F4EA] text-[#137333] rounded">
                  ACTIVE
                </span>
              ) : (
                <span className="px-2 py-1 text-[10px] font-bold bg-[#FCE8E6] text-[#C53030] rounded">
                  INACTIVE
                </span>
              )}
            </div>
            <p className="text-sm text-[#8E7A66] mt-2">{user?.email}</p>
          </div>

          {/* Edit Mode Toggle */}
          <div className="px-6 py-4 border-b border-[#EFE9CE] flex justify-end">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#281711] text-white text-sm font-semibold hover:bg-[#3D2A1E] transition-colors"
              >
                <Edit2 size={14} />
                Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 border border-[#DCD4C4] text-[#706251] text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  <X size={14} />
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#281711] text-white text-sm font-semibold hover:bg-[#3D2A1E] transition-colors disabled:opacity-60"
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {/* Profile Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div>
                <h3 className="text-sm font-bold text-[#513E2F] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User size={14} />
                  Basic Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                      />
                    ) : (
                      <p className="text-sm text-[#281711]">{user?.full_name || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Username</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                      />
                    ) : (
                      <p className="text-sm text-[#281711]">@{user?.username || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Email Address</label>
                    <p className="text-sm text-[#281711] flex items-center gap-2">
                      <Mail size={14} className="text-[#A1927F]" />
                      {user?.email}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Phone Number</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.profile.phone_number}
                        onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, phone_number: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-sm text-[#281711] flex items-center gap-2">
                        <Phone size={14} className="text-[#A1927F]" />
                        {user?.profile?.phone_number || '—'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Birthday</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formData.profile.birthday}
                        onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, birthday: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                      />
                    ) : (
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-[#281711] flex items-center gap-2">
                          <Calendar size={14} className="text-[#A1927F]" />
                          {formatDate(user?.profile?.birthday)}
                        </p>
                        {user?.profile?.birthday && (
                          <p className="text-sm text-[#706251]">
                            ({calculateAge(user.profile.birthday)} years old)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Sex</label>
                    {isEditing ? (
                      <select
                        value={formData.profile.sex}
                        onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, sex: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                      >
                        <option value="">Select</option>
                        {SEX_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-[#281711]">
                        {SEX_OPTIONS.find(s => s.value === user?.profile?.sex)?.label || '—'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Additional Info */}
              <div>
                <h3 className="text-sm font-bold text-[#513E2F] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Heart size={14} />
                  Additional Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Address</label>
                    {isEditing ? (
                      <textarea
                        value={formData.profile.address}
                        onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, address: e.target.value } })}
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] resize-none"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="text-sm text-[#281711] flex items-start gap-2">
                        <MapPin size={14} className="text-[#A1927F] mt-0.5 flex-shrink-0" />
                        <span>{user?.profile?.address || '—'}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Bio</label>
                    {isEditing ? (
                      <textarea
                        value={formData.profile.bio}
                        onChange={(e) => setFormData({ ...formData, profile: { ...formData.profile, bio: e.target.value } })}
                        rows={4}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] resize-none"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-sm text-[#706251] italic p-3 bg-[#F7F3E3] rounded">
                        {user?.profile?.bio || 'No bio provided yet.'}
                      </p>
                    )}
                  </div>

                  {(user?.profile?.department_name || user?.profile?.program || user?.profile?.school_id) && (
                    <div className="pt-2">
                      <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-3">Academic Information</h4>
                      <div className="space-y-2">
                        {user?.profile?.department_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase size={14} className="text-[#A1927F]" />
                            <span className="text-[#706251]">Department:</span>
                            <span className="text-[#281711] font-medium">{user.profile.department_name}</span>
                          </div>
                        )}
                        {user?.profile?.program && (
                          <div className="flex items-center gap-2 text-sm">
                            <BookOpen size={14} className="text-[#A1927F]" />
                            <span className="text-[#706251]">Program:</span>
                            <span className="text-[#281711] font-medium">{user.profile.program}</span>
                          </div>
                        )}
                        {user?.profile?.school_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <Award size={14} className="text-[#A1927F]" />
                            <span className="text-[#706251]">School ID:</span>
                            <span className="text-[#281711] font-medium">{user.profile.school_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-[#513E2F] mb-1">Member Since</label>
                    <p className="text-sm text-[#281711] flex items-center gap-2">
                      <Calendar size={14} className="text-[#A1927F]" />
                      {user?.date_joined ? format(new Date(user.date_joined), 'MMMM d, yyyy') : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Change Button */}
            <div className="mt-8 pt-6 border-t border-[#EFE9CE]">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-[#281711] text-[#281711] text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                <Lock size={14} />
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F1E6] border border-[#DCD4C4] w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-baskerville text-lg font-bold text-[#281711]">Change Password</h2>
                <button onClick={() => setShowPasswordModal(false)}>
                  <X size={20} className="text-[#281711]" />
                </button>
              </div>
              <div className="h-px bg-[#DCD4C4] mb-5" />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.old_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] pr-10"
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1927F] hover:text-[#281711]"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.new_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] pr-10"
                      placeholder="Enter new password (min. 8 characters)"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1927F] hover:text-[#281711]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirm_password}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568] pr-10"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#A1927F] hover:text-[#281711]"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#706251]">
                  <AlertCircle size={12} />
                  Password must be at least 8 characters
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#DCD4C4]">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 border border-[#281711] py-2 text-sm font-semibold text-[#281711] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="flex-1 bg-[#281711] text-[#F4EFE0] py-2 text-sm font-semibold hover:bg-[#3D2A1E] disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {changingPassword ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                  Update Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}