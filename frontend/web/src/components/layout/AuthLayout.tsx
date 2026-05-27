// frontend/web/src/components/layouts/AuthLayout.tsx
import { Outlet } from 'react-router-dom'
import Chatbot from '@/components/chat/Chatbot'

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#1E120C]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/login-bg.png)' }}
      />
      <div className="absolute inset-0 bg-black/15" />

      {/* ScrollView equivalent - content container */}
      <div className="relative z-10 w-full flex-grow flex items-center justify-center py-10">
        <div className="w-full flex flex-col items-center px-6">
          {/* Header Group - exact RN spacing */}
          <div className="flex flex-col items-center mb-6">
            <h1 
              className="text-[clamp(56px,8vw,64px)] font-medium tracking-[0.2em] text-[#F4EFE0] text-center leading-none"
              style={{ fontFamily: "'Gloock', serif" }}
            >
              LIBRIUM
            </h1>
            <div className="w-9 h-0.5 bg-[#C59568] mt-1 mb-4" />
            <div className="max-w-[320px] items-center">
              <p 
                className="text-[#f3f1ed] text-[13px] italic leading-[18px] text-center opacity-85"
                style={{ fontFamily: "'Libre Baskerville', serif" }}
              >
                "Libraries store the energy that fuels the imagination."
              </p>
              <p 
                className="text-[#f3c599] text-[13px] mt-1.5 tracking-[0.5px] text-center"
                style={{ fontFamily: "'Libre Baskerville', serif" }}
              >
                — Sidney Sheldon
              </p>
            </div>
          </div>

          {/* Card - with rounded corners */}
          <div className="w-full max-w-[390px] bg-[#F4EFE0] rounded-2xl shadow-2xl">
            <Outlet />
          </div>
        </div>
      </div>
      
      {/* Chatbot - available on auth pages too (optional) */}
      <Chatbot />
    </div>
  )
}