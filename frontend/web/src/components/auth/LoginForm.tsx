// frontend/web/src/components/auth/LoginForm.tsx
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useLogin } from '@/hooks/useAuth'
import type { UserRole } from '@shared/types'

function getDefaultDashboardPath(role?: UserRole | null) {
  if (role === 'admin') return '/admin/dashboard'
  if (role === 'librarian') return '/librarian/loans'
  return '/member/dashboard'
}

export default function LoginForm() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [secureText, setSecureText] = useState(true)
  const [remember, setRemember] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Handle activation from query params
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const uid = params.get('uid')
    const token = params.get('token')
    
    if (uid && token) {
      setErrorMsg('Your account is verified. You can now log in.')
    }
  }, [location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setErrorMsg('Please enter your email and password.')
      return
    }
    setErrorMsg(null)
    setLoading(true)

    login.mutate(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: ({ user }) => {
          setLoading(false)
          navigate(getDefaultDashboardPath(user.role), { replace: true })
        },
        onError: (err: any) => {
          setLoading(false)
          const status = err?.response?.status
          const msg =
            status === 401
              ? 'Incorrect email or password.'
              : status === 403
                ? 'Your account is not yet activated. Please check your email.'
                : status === 400
                  ? 'Please enter a valid email and password.'
                  : status >= 500
                    ? 'Server error. Please try again later.'
                    : err?.response?.data?.detail ?? 'Something went wrong. Please try again.'
          setErrorMsg(msg)
        },
      },
    )
  }

  return (
    <div className="px-6 pt-[42px] pb-6">
      {/* Welcome Title */}
      <h2 
        className="text-[20px] font-semibold text-[#281711] tracking-[0.22em] text-center mb-2"
        style={{ fontFamily: "'Gloock', serif" }}
      >
        WELCOME
      </h2>
      <div className="w-10 h-px bg-[#DFD6C2] mx-auto mt-2 mb-5" />

      {/* Error Banner */}
      {errorMsg && (
        <div className="flex flex-row items-center bg-[#FCE8E6] border border-[#F5C2C2] px-3 py-2.5 mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A83232" strokeWidth="2" className="mr-1.5 flex-shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="flex-1 text-[#A83232] text-[12px] font-medium leading-snug">{errorMsg}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Email Input */}
        <div className="mb-4">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Email:
          </label>
          <div className="flex flex-row items-center bg-white border border-[#DFD6C2] h-[42px]">
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
        </div>

        {/* Password Input */}
        <div className="mb-4">
          <label className="block text-[14px] font-medium text-[#513E2F] mb-1.5">
            Password:
          </label>
          <div className="flex flex-row items-center bg-white border border-[#DFD6C2] h-[42px] relative">
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
        </div>

        {/* Utilities Row */}
        <div className="flex flex-row justify-between items-center mt-1 mb-6">
          <button
            type="button"
            onClick={() => setRemember(!remember)}
            className="flex flex-row items-center cursor-pointer"
          >
            <div className={`w-3.5 h-3.5 border mr-2 flex items-center justify-center ${remember ? 'bg-[#281711] border-[#281711]' : 'bg-white border-[#8E7A66]'}`}>
              {remember && (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </div>
            <span className="text-[11px] text-[#463527]">Remember me</span>
          </button>
          <Link to="/forgot-password" className="text-[11px] text-[#463527] hover:text-[#281711]">
            Forgot Password
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || login.isPending}
          className="w-full h-[46px] bg-[#281711] text-[#F4EFE0] text-[15px] tracking-[0.14em] hover:bg-[#3D2A1E] disabled:opacity-60 flex items-center justify-center cursor-pointer"
          style={{ fontFamily: "'Libre Baskerville', serif", fontWeight: 700 }}
        >
          {loading || login.isPending ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              SIGNING IN...
            </span>
          ) : (
            'SIGN IN'
          )}
        </button>

        {/* Register Link */}
        <div className="items-center mt-5">
          <p className="text-[12px] text-[#513E2F] text-center">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[#281711] hover:underline"
              style={{ fontFamily: "'Libre Baskerville', serif" }}
            >
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}