// frontend/web/src/components/chat/Chatbot.tsx
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Trash2, Send, BookOpen } from 'lucide-react'
//import { useAuthStore } from '@/store/auth.store'

interface Message {
  role: 'user' | 'assistant'
  message: string
  created_at?: string
}

export default function Chatbot() {
  //const { user } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 200)
    }
  }, [isOpen])

  // Load chat history when chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadChatHistory()
    }
  }, [isOpen])

  const loadChatHistory = async () => {
    try {
      const response = await fetch('https://librium.onrender.com/api/library/chat/', {
        credentials: 'include',
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setMessages(data.reverse())
      }
    } catch (error) {
      console.error('Failed to load chat history:', error)
    }
  }

  const sendMessage = async () => {
    if (!message.trim()) return

    const userMessage: Message = {
      role: 'user',
      message: message.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    const userQuestion = message.trim()
    setMessage('')
    setLoading(true)

    try {
      const response = await fetch('https://librium.onrender.com/api/library/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ message: userQuestion }),
      })

      const data = await response.json()
      const botMessage: Message = {
        role: 'assistant',
        message: data.assistant?.message || 'Sorry, I could not process that request.',
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: 'Network error. Please try again later.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestions = [
    'Library hours?',
    'Borrowing limits?',
    'Overdue fines?',
    'Reserve a book?',
  ]

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#8B6914] shadow-lg hover:bg-[#7A5A10] transition-colors flex items-center justify-center group"
      >
        <MessageCircle size={28} className="text-white" />
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DAA520] flex items-center justify-center">
          <span className="text-[10px]">🤖</span>
        </div>
      </button>

      {/* Chat Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 flex items-end justify-end"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-[#F5F0E8] w-full max-w-md md:max-w-lg h-[80vh] max-h-[600px] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-[#1F150C] px-4 py-3 flex justify-between items-center border-b border-[#E8DCC8]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#8B6914] flex items-center justify-center">
                  <BookOpen size={16} className="text-[#FBF5DD]" />
                </div>
                <h3 className="text-white font-semibold font-serif text-base">Librium Assistant</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={clearChat}
                  className="p-1 hover:opacity-70 transition-opacity"
                  title="Clear chat"
                >
                  <Trash2 size={16} className="text-[#FBF5DD]" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:opacity-70 transition-opacity"
                >
                  <X size={20} className="text-[#FBF5DD]" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                  <MessageCircle size={48} className="text-[#C4A77D] mb-3" />
                  <p className="text-[#4A3728] text-base font-serif font-semibold">
                    Ask me anything about Librium!
                  </p>
                  <p className="text-[#A68A64] text-xs mt-1">
                    📚 Books • 🔖 Reservations • 💰 Fines • 📖 Borrowing
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-[#8B6914] text-white rounded-br-md'
                          : 'bg-white border border-[#E8DCC8] text-[#2D1F10] rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#E8DCC8] rounded-2xl rounded-bl-md px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-[#8B6914] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-[#8B6914] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-[#8B6914] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions (only when no messages) */}
            {messages.length === 0 && !loading && (
              <div className="px-4 py-2 overflow-x-auto whitespace-nowrap scrollbar-thin">
                <div className="flex gap-2">
                  {suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMessage(suggestion)}
                      className="px-3 py-1.5 bg-white border border-[#E8DCC8] rounded-full text-xs font-medium text-[#8B6914] hover:bg-gray-50 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Area */}
            <div className="border-t border-[#E8DCC8] p-3 bg-white">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask a question..."
                  rows={1}
                  className="flex-1 bg-[#F5F0E8] rounded-full px-4 py-2.5 text-sm text-[#2D1F10] placeholder-[#A68A64] resize-none outline-none focus:ring-1 focus:ring-[#8B6914]"
                  style={{ maxHeight: '100px' }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || loading}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    !message.trim() || loading
                      ? 'bg-[#C4A77D] cursor-not-allowed'
                      : 'bg-[#8B6914] hover:bg-[#7A5A10]'
                  }`}
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}