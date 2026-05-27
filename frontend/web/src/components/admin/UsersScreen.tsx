// frontend/web/src/components/admin/UsersScreen.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAlert } from '@/components/ui/AlertProvider'
import { getUsers, createUser, updateUser, deleteUser, reactivateUser } from '@/services/api'
import { useToast } from '@/hooks/useToast'
import { extractData } from '@/hooks/useApiData'
import type { User } from '@shared/types/user'
import { 
  Plus, Edit2, Trash2, UserCheck, 
  Loader2, X, Mail, Phone, MapPin, Calendar, Briefcase, 
  BookOpen, Hash, Award, ChevronDown, ChevronUp, Users
} from 'lucide-react'
import { format } from 'date-fns'

const ROLE_THEME: Record<string, { bg: string; text: string }> = {
  admin: { bg: '#FEF3C7', text: '#D97706' },
  librarian: { bg: '#EDE9FE', text: '#7C3AED' },
  member: { bg: '#E0F2FE', text: '#0369A1' },
}

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'admin', label: 'Admin' },
]

export default function UsersScreen() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'librarian' | 'member'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    role: 'member' as 'admin' | 'librarian' | 'member',
    password: '',
    password2: '',
  })

  const { showConfirm } = useAlert()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Query
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const users = extractData<User[]>(usersResponse) || []

  // Mutations
  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'User created successfully' })
      closeModal()
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.email?.[0] || 
                  error?.response?.data?.username?.[0] ||
                  error?.response?.data?.message || 
                  'Failed to create user'
      toast({ title: 'Error', description: msg, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'User updated successfully' })
      closeModal()
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to update user', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'User deleted successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Cannot delete user with active records', variant: 'destructive' })
    },
    onSettled: () => {
      setDeletingId(null)
    },
  })

  const reactivateMutation = useMutation({
    mutationFn: reactivateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toast({ title: 'Success', description: 'User reactivated successfully' })
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error?.response?.data?.message || 'Failed to reactivate user', variant: 'destructive' })
    },
  })

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      full_name: '',
      username: '',
      email: '',
      role: 'member',
      password: '',
      password2: '',
    })
    setModalOpen(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      full_name: user.full_name,
      username: user.username,
      email: user.email,
      role: user.role,
      password: '',
      password2: '',
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = () => {
    if (!formData.full_name) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' })
      return
    }
    if (!formData.username) {
      toast({ title: 'Error', description: 'Username is required', variant: 'destructive' })
      return
    }
    if (!formData.email) {
      toast({ title: 'Error', description: 'Email is required', variant: 'destructive' })
      return
    }

    if (!editingUser) {
      if (!formData.password) {
        toast({ title: 'Error', description: 'Password is required for new users', variant: 'destructive' })
        return
      }
      if (formData.password !== formData.password2) {
        toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' })
        return
      }
    }

    const payload: any = {
      full_name: formData.full_name,
      username: formData.username,
      email: formData.email.toLowerCase(),
      role: formData.role,
    }

    if (!editingUser) {
      payload.password = formData.password
      payload.password2 = formData.password2
    }

    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = (user: User) => {
    showConfirm(
      'Delete User',
      `Delete "${user.full_name}"? This action cannot be undone.`,
      () => {
        setDeletingId(user.id)
        deleteMutation.mutate(user.id)
      },
      { confirmText: 'Delete', cancelText: 'Cancel', confirmVariant: 'danger' }
    )
  }

  const handleReactivate = (id: number) => {
    showConfirm(
      'Reactivate User',
      'Reactivate this user account?',
      () => reactivateMutation.mutate(id),
      { confirmText: 'Reactivate', cancelText: 'Cancel', confirmVariant: 'success' }
    )
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)
    return matchesSearch && matchesRole && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-[#DCD4C4]">
          <div>
            <h1 className="text-xl font-bold text-[#281711] font-baskerville">User Management</h1>
            <p className="text-sm text-[#706251] mt-1">Manage system users and their roles</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-[#281711] text-[#F4EFE0] px-4 py-2 hover:bg-[#3D2A1E] transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm font-semibold">Add User</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          <div className="flex items-center bg-white border border-[#DCD4C4] px-3 py-2">
            <svg className="w-4 h-4 text-[#A1927F] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-[#281711] placeholder-[#A1927F] outline-none"
            />
            {search && (
              <button onClick={() => setSearch('')}>
                <X size={14} className="text-[#A1927F]" />
              </button>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold border border-[#DCD4C4] bg-white text-[#706251] focus:outline-none focus:border-[#C59568]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="librarian">Librarian</option>
              <option value="member">Member</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 text-xs font-semibold border border-[#DCD4C4] bg-white text-[#706251] focus:outline-none focus:border-[#C59568]"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#EFE9CE]">
            <Users size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">No users found.</p>
          </div>
        ) : (
          <div className="bg-white border border-[#EFE9CE] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                {/* Sticky Header */}
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#1F150C]">
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#FBF5DD] uppercase tracking-wider w-[30%]">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#FBF5DD] uppercase tracking-wider hidden md:table-cell">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#FBF5DD] uppercase tracking-wider hidden lg:table-cell">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-[#FBF5DD] uppercase tracking-wider hidden xl:table-cell">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-[#FBF5DD] uppercase tracking-wider w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFE9CE]">
                  {filteredUsers.map((user) => {
                    const isExpanded = expandedId === user.id
                    const isDeleting = deletingId === user.id
                    const theme = ROLE_THEME[user.role] || ROLE_THEME.member
                    const isActive = user.is_active

                    return (
                      <>
                        {/* Main Row */}
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setExpandedId(isExpanded ? null : user.id)}
                                className="text-[#706251] hover:text-[#281711] transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                              <div>
                                <div className="font-semibold text-[#281711] text-sm">{user.full_name}</div>
                                <div className="text-xs text-[#706251]">{user.email}</div>
                                <div className="text-xs text-[#706251] md:hidden mt-0.5">
                                  @{user.username}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <span className={`px-2 py-1 text-[10px] font-bold rounded ${theme.bg} ${theme.text}`}>
                              {user.role.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {isActive ? (
                              <span className="px-2 py-1 text-[10px] font-bold bg-[#E6F4EA] text-[#137333] rounded">
                                ACTIVE
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-[10px] font-bold bg-[#FCE8E6] text-[#C53030] rounded">
                                INACTIVE
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#706251] hidden xl:table-cell">
                            {formatDate(user.date_joined)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(user)}
                                className="p-1.5 text-[#513E2F] hover:bg-gray-100 rounded transition-colors"
                                title="Edit User"
                              >
                                <Edit2 size={14} />
                              </button>
                              {!isActive && (
                                <button
                                  onClick={() => handleReactivate(user.id)}
                                  className="p-1.5 text-[#137333] hover:bg-green-50 rounded transition-colors"
                                  title="Reactivate"
                                >
                                  <UserCheck size={14} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(user)}
                                disabled={isDeleting}
                                className="p-1.5 text-[#C53030] hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Delete User"
                              >
                                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-[#FAF5E3]">
                            <td colSpan={5} className="px-4 py-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Account Details */}
                                <div>
                                  <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-2">Account Details</h4>
                                  <div className="space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs">
                                      <Hash size={12} className="text-[#A1927F]" />
                                      <span className="text-[#706251]">Username:</span>
                                      <span className="text-[#281711] font-medium">{user.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Mail size={12} className="text-[#A1927F]" />
                                      <span className="text-[#706251]">Email:</span>
                                      <span className="text-[#281711] font-medium">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <Calendar size={12} className="text-[#A1927F]" />
                                      <span className="text-[#706251]">Joined:</span>
                                      <span className="text-[#281711] font-medium">{formatDate(user.date_joined)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="w-4" />
                                      <span className="text-[#706251]">Role:</span>
                                      <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${theme.bg} ${theme.text}`}>
                                        {user.role.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Profile Details */}
                                {user.profile && (
                                  <>
                                    <div>
                                      <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-2">Contact Info</h4>
                                      <div className="space-y-1.5">
                                        {user.profile.phone_number && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <Phone size={12} className="text-[#A1927F]" />
                                            <span className="text-[#706251]">{user.profile.phone_number}</span>
                                          </div>
                                        )}
                                        {user.profile.address && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <MapPin size={12} className="text-[#A1927F]" />
                                            <span className="text-[#706251] break-all">{user.profile.address}</span>
                                          </div>
                                        )}
                                        {!user.profile.phone_number && !user.profile.address && (
                                          <p className="text-xs text-[#A1927F] italic">No contact information</p>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-2">Academic Info</h4>
                                      <div className="space-y-1.5">
                                        {user.profile.department_name && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <Briefcase size={12} className="text-[#A1927F]" />
                                            <span className="text-[#706251]">{user.profile.department_name}</span>
                                          </div>
                                        )}
                                        {user.profile.program && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <BookOpen size={12} className="text-[#A1927F]" />
                                            <span className="text-[#706251]">{user.profile.program}</span>
                                          </div>
                                        )}
                                        {user.profile.school_id && (
                                          <div className="flex items-center gap-2 text-xs">
                                            <Award size={12} className="text-[#A1927F]" />
                                            <span className="text-[#706251]">ID: {user.profile.school_id}</span>
                                          </div>
                                        )}
                                        {!user.profile.department_name && !user.profile.program && (
                                          <p className="text-xs text-[#A1927F] italic">No academic information</p>
                                        )}
                                      </div>
                                    </div>

                                    {user.profile.bio && (
                                      <div className="md:col-span-2 lg:col-span-3">
                                        <h4 className="text-xs font-bold text-[#513E2F] uppercase tracking-wider mb-2">Bio</h4>
                                        <p className="text-xs text-[#706251] p-2 bg-white/50 rounded">{user.profile.bio}</p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#F5F1E6] border border-[#DCD4C4] w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-baskerville text-lg font-bold text-[#281711]">
                  {editingUser ? 'EDIT USER' : 'ADD NEW USER'}
                </h2>
                <button onClick={closeModal}>
                  <X size={20} className="text-[#281711]" />
                </button>
              </div>
              <div className="h-px bg-[#DCD4C4] mb-5" />

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Username *</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Role *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!editingUser && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                        placeholder="Enter password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#3C2F2F] mb-1.5">Confirm Password *</label>
                      <input
                        type="password"
                        value={formData.password2}
                        onChange={(e) => setFormData({ ...formData, password2: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-[#DCD4C4] text-sm text-[#281711] focus:outline-none focus:border-[#C59568]"
                        placeholder="Confirm password"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-[#DCD4C4]">
                <button
                  onClick={closeModal}
                  className="flex-1 border border-[#281711] py-2 text-sm font-semibold text-[#281711] hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 bg-[#281711] text-[#F4EFE0] py-2 text-sm font-semibold hover:bg-[#3D2A1E] disabled:opacity-60"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'SAVING...' : (editingUser ? 'UPDATE' : 'CREATE')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}