// frontend/web/src/components/auth/RegisterForm.tsx
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useAlert } from '@/components/ui/AlertProvider'

export function RegisterForm() {
  const navigate = useNavigate()
  const { showAlert } = useAlert()

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [secureText, setSecureText] = useState(true)
  const [secureConfirmText, setSecureConfirmText] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const register = useMutation({ 
    mutationFn: authService.register,
    onSuccess: () => {
      setLoading(false)
      showAlert(
        'Registration Successful',
        'Account created! Please check your email for verification before signing in.',
        { variant: 'success', buttonText: 'Go to Sign In' }
      )
      setTimeout(() => navigate('/login'), 3000)
    },
    onError: (err: any) => {
      setLoading(false)
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const msg = Object.entries(data)
          .map(([key, val]) => {
            const display = Array.isArray(val) ? val.join(', ') : String(val)
            return `${key.replace(/_/g, ' ')}: ${display}`
          })
          .join('\n')
        setErrorMsg(msg)
      } else {
        setErrorMsg('Could not complete registration. Please try again.')
      }
    }
  })

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    if (!fullName.trim()) errors.fullName = 'Full name is required'
    if (!username.trim()) errors.username = 'Username is required'
    else if (username.length < 3) errors.username = 'Username must be at least 3 characters'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!email.includes('@')) errors.email = 'Please enter a valid email'
    if (!password) errors.password = 'Password is required'
    else if (password.length < 8) errors.password = 'Password must be at least 8 characters'
    if (!password2) errors.password2 = 'Please confirm your password'
    else if (password !== password2) errors.password2 = "Passwords don't match"
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!validateForm()) return
    setLoading(true)

    // Send correct field names: password2 (not re_password)
    register.mutate({
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim(),
      password: password,
      password2: password2,  // Changed from re_password to password2
    })
  }

  return (
    <div className="px-6 pt-9 pb-6">
      {/* Title */}
      <h2 
        className="text-[20px] font-semibold text-[#281711] tracking-[0.22em] text-center mb-2"
        style={{ fontFamily: "'Gloock', serif" }}
      >
        REGISTER
      </h2>
      <div className="w-10 h-px bg-[#DFD6C2] mx-auto mt-2 mb-5" />

      {/* Error/Success Banner */}
      {errorMsg && (
        <div className={`flex flex-row items-start gap-1.5 border px-3 py-2.5 mb-4 ${errorMsg.includes('created') ? 'bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-[#FCE8E6] border-[#F5C2C2]'}`}>
          {errorMsg.includes('created') ? (
            <svg className="text-[#2E7D32] mt-0.5 flex-shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A83232" strokeWidth="2" className="mt-0.5 flex-shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <p className={`flex-1 text-[12px] font-medium leading-snug whitespace-pre-line ${errorMsg.includes('created') ? 'text-[#2E7D32]' : 'text-[#A83232]'}`}>
            {errorMsg}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Full Name */}
        <div className="mb-3.5">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Full Name:
          </label>
          <div className={`flex flex-row items-center bg-white border h-[42px] ${fieldErrors.fullName ? 'border-[#F5C2C2]' : 'border-[#DFD6C2]'}`}>
            <svg className="ml-3 mr-2 text-[#614E3C] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              className="flex-1 bg-transparent text-[13px] text-[#281711] placeholder-[#A1927F] outline-none h-full px-2"
            />
          </div>
          {fieldErrors.fullName && <p className="text-[#A83232] text-[11px] mt-1">{fieldErrors.fullName}</p>}
        </div>

        {/* Username */}
        <div className="mb-3.5">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Username:
          </label>
          <div className={`flex flex-row items-center bg-white border h-[42px] ${fieldErrors.username ? 'border-[#F5C2C2]' : 'border-[#DFD6C2]'}`}>
            <svg className="ml-3 mr-2 text-[#614E3C] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
            </svg>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="janedoe"
              className="flex-1 bg-transparent text-[13px] text-[#281711] placeholder-[#A1927F] outline-none h-full px-2"
            />
          </div>
          {fieldErrors.username && <p className="text-[#A83232] text-[11px] mt-1">{fieldErrors.username}</p>}
        </div>

        {/* Email */}
        <div className="mb-3.5">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Email Address:
          </label>
          <div className={`flex flex-row items-center bg-white border h-[42px] ${fieldErrors.email ? 'border-[#F5C2C2]' : 'border-[#DFD6C2]'}`}>
            <svg className="ml-3 mr-2 text-[#614E3C] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@institution.edu"
              className="flex-1 bg-transparent text-[13px] text-[#281711] placeholder-[#A1927F] outline-none h-full px-2"
            />
          </div>
          {fieldErrors.email && <p className="text-[#A83232] text-[11px] mt-1">{fieldErrors.email}</p>}
        </div>

        {/* Password */}
        <div className="mb-3.5">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Password:
          </label>
          <div className={`flex flex-row items-center bg-white border h-[42px] relative ${fieldErrors.password ? 'border-[#F5C2C2]' : 'border-[#DFD6C2]'}`}>
            <svg className="ml-3 mr-2 text-[#614E3C] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={secureText ? 'password' : 'text'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent text-[13px] text-[#281711] placeholder-[#A1927F] outline-none h-full px-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setSecureText(!secureText)}
              className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[#614E3C] hover:text-[#281711]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {secureText ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {fieldErrors.password && <p className="text-[#A83232] text-[11px] mt-1">{fieldErrors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Confirm Password:
          </label>
          <div className={`flex flex-row items-center bg-white border h-[42px] relative ${fieldErrors.password2 ? 'border-[#F5C2C2]' : 'border-[#DFD6C2]'}`}>
            <svg className="ml-3 mr-2 text-[#614E3C] flex-shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={secureConfirmText ? 'password' : 'text'}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              placeholder="••••••••"
              className="flex-1 bg-transparent text-[13px] text-[#281711] placeholder-[#A1927F] outline-none h-full px-2 pr-10"
            />
            <button
              type="button"
              onClick={() => setSecureConfirmText(!secureConfirmText)}
              className="absolute right-0 top-0 h-full w-10 flex items-center justify-center text-[#614E3C] hover:text-[#281711]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {secureConfirmText ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
          {fieldErrors.password2 && <p className="text-[#A83232] text-[11px] mt-1">{fieldErrors.password2}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || register.isPending}
          className="w-full h-[46px] bg-[#281711] text-[#F4EFE0] text-[15px] tracking-[0.14em] hover:bg-[#3D2A1E] disabled:opacity-60 flex items-center justify-center cursor-pointer"
          style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700 }}
        >
          {loading || register.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              CREATING ACCOUNT...
            </span>
          ) : (
            'CREATE ACCOUNT'
          )}
        </button>

        {/* Login Link */}
        <div className="items-center mt-5">
          <p className="text-[12px] text-[#513E2F] text-center">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[#281711] hover:underline"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Sign In
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}