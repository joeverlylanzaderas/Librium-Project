// frontend/web/src/components/librarian/LibrarianMembersScreen.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getUsers } from '@/services/api'
import { extractData } from '@/hooks/useApiData'
import type { User } from '@shared/types/user'
import { Search, X, ChevronDown, ChevronUp, Users, Loader2, Calendar, Phone, User as UserIcon } from 'lucide-react'
import { format } from 'date-fns'

export default function LibrarianMembersScreen() {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // Query
  const { data: usersResponse, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  })
  const allUsers = extractData<User[]>(usersResponse) || []
  
  // Filter only members (role === 'member')
  const members = allUsers.filter(user => user.role === 'member')

  // Filter by search
  const filteredMembers = members.filter((member) =>
    member.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    member.email?.toLowerCase().includes(search.toLowerCase()) ||
    member.username?.toLowerCase().includes(search.toLowerCase())
  )

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy')
  }

  const getSexLabel = (sex: string | null) => {
    if (!sex) return '—'
    return sex === 'M' ? 'Male' : sex === 'F' ? 'Female' : 'Other'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#281711]" />
      </div>
    )
  }

  return (
    <div className="bg-[#FCFAEE] min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="bg-white border-b border-[#DCD4C4] p-4 sticky top-0 z-10">
          <div className="flex items-center bg-white border border-[#DCD4C4] rounded-lg px-3 py-2">
            <Search size={16} className="text-[#A1927F] mr-2" />
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
          <p className="text-xs text-[#706251] mt-2">
            {filteredMembers.length} members
          </p>
        </div>

        {/* Members List */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-[#A1927F] mb-3" />
            <p className="text-[#706251]">No members found.</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {filteredMembers.map((member) => {
              const isExpanded = expandedId === member.id
              const isActive = member.is_active

              return (
                <div
                  key={member.id}
                  className="bg-white border border-[#EFE9CE] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Card Header - Clickable */}
                  <button
                    onClick={() => toggleExpand(member.id)}
                    className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-[#281711] text-base">{member.full_name}</h3>
                        <p className="text-sm text-[#706251] mt-0.5">{member.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          isActive 
                            ? 'bg-[#E6F4EA] text-[#137333]' 
                            : 'bg-[#FCE8E6] text-[#C53030]'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={16} className="text-[#A1927F]" />
                        ) : (
                          <ChevronDown size={16} className="text-[#A1927F]" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-[#EFE9CE] p-4 bg-[#FAF5E3]">
                      <div className="space-y-3">
                        {/* Username */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <UserIcon size={14} className="text-[#A1927F]" />
                            <span className="text-sm text-[#706251]">Username</span>
                          </div>
                          <span className="text-sm font-medium text-[#281711]">{member.username}</span>
                        </div>

                        {/* Joined Date */}
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-[#A1927F]" />
                            <span className="text-sm text-[#706251]">Joined</span>
                          </div>
                          <span className="text-sm font-medium text-[#281711]">
                            {formatDate(member.date_joined)}
                          </span>
                        </div>

                        {/* Phone Number */}
                        {member.profile?.phone_number && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Phone size={14} className="text-[#A1927F]" />
                              <span className="text-sm text-[#706251]">Phone</span>
                            </div>
                            <span className="text-sm font-medium text-[#281711]">
                              {member.profile.phone_number}
                            </span>
                          </div>
                        )}

                        {/* Birthday */}
                        {member.profile?.birthday && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-[#A1927F]" />
                              <span className="text-sm text-[#706251]">Birthday</span>
                            </div>
                            <span className="text-sm font-medium text-[#281711]">
                              {format(new Date(member.profile.birthday), 'MMM d, yyyy')}
                            </span>
                          </div>
                        )}

                        {/* Age */}
                        {member.profile?.birthday && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-3.5" />
                              <span className="text-sm text-[#706251]">Age</span>
                            </div>
                            <span className="text-sm font-medium text-[#281711]">
                              {(() => {
                                const today = new Date()
                                const birthDate = new Date(member.profile.birthday)
                                let age = today.getFullYear() - birthDate.getFullYear()
                                const m = today.getMonth() - birthDate.getMonth()
                                if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                                  age--
                                }
                                return age
                              })()} years
                            </span>
                          </div>
                        )}

                        {/* Sex */}
                        {member.profile?.sex && (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="w-3.5" />
                              <span className="text-sm text-[#706251]">Sex</span>
                            </div>
                            <span className="text-sm font-medium text-[#281711]">
                              {getSexLabel(member.profile.sex)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}