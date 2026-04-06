'use client'

import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

export default function ChatBot({ isOpen, onClose }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I help you today?', sender: 'bot', time: '10:00' },
    { id: 2, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt', sender: 'bot', time: '10:01' },
    { id: 3, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt', sender: 'user', time: '10:02' },
    { id: 4, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt', sender: 'bot', time: '10:03' },
    { id: 5, text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt', sender: 'user', time: '10:04' },
  ])

  const [isTyping, setIsTyping] = useState(false)
  const chatContainerRef = useRef(null)

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages, isOpen, isTyping])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: 'user',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages([...messages, newMessage])
    setMessage('')

    setIsTyping(true)

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "I'm processing your request. Please wait a moment!",
        sender: 'bot',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }])
      setIsTyping(false)
    }, 1500)
  }

  if (!isOpen) return null

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">

          <div className="bot-info-header">
            <div className="bot-avatar-header">
              <Image src="/bot.png" alt="Bot" width={40} height={40} />
            </div>
            <div className="bot-name-container">
              <span className="bot-name">IQLIQ BOT</span>
              <div className="status-indicator">
                <span className="status-dot"></span>
                <span className="bot-status">Online</span>
              </div>
            </div>
          </div>

          <button className="close-btn" onClick={onClose} aria-label="Close Chat">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Message Area */}
        <div className="chat-messages" ref={chatContainerRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`message-row ${msg.sender}-row`}>
              {msg.sender === 'bot' && (
                <div className="message-avatar">
                  <Image src="/bot.png" alt="Bot" width={32} height={32} />
                </div>
              )}
              <div className={`message-bubble ${msg.sender}-bubble`}>
                <span className="bubble-text">{msg.text}</span>
                <span className="message-time">{msg.time}</span>
              </div>
              {msg.sender === 'user' && (
                <div className="message-avatar">
                  <Image src="/1.jpg" alt="User" width={32} height={32} style={{ borderRadius: '50%' }} />
                </div>
              )}
            </div>
          ))}
          {/* Typing Indicator */}
          <div className="message-row bot-row typing-indicator-row">
            <div className="message-avatar">
              <Image src="/bot.png" alt="Bot" width={32} height={32} />
            </div>
            <div className="message-bubble bot-bubble typing-bubble">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="chat-input-wrapper">
          <form className="chat-input-area" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder="ASK QLIQY AI..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button type="submit" className="send-btn" disabled={!message.trim()}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .chatbot-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.15);
          z-index: 10000;
          backdrop-filter: blur(12px);
          animation: fadeIn 0.4s ease-out;
        }

        .chatbot-container {
          position: fixed;
          left: 0;
          top: 0;
          width: 45vw; /* Encompass close to half the screen on desktop */
          min-width: 400px;
          height: 100vh;
          background: #FFFFFF;
          box-shadow: 15px 0 50px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
          animation: slideFromLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          border-right: 1px solid rgba(0, 0, 0, 0.05);
        }

        @keyframes slideFromLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .chatbot-header {
          display: flex;
          align-items: center;
          justify-content: space-between; /* Push close icon to the right */
          padding: 28px 24px;
          border-bottom: 1px solid #F1F5F9;
          gap: 20px;
          background: #FFFFFF;
        }

        .close-btn {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0; /* Prevent the button from shrinking */
        }

        .close-btn:hover {
          background: #F1F5F9;
          transform: rotate(90deg);
          border-color: #CBD5E1;
        }

        .bot-info-header {
            display: flex;
            align-items: center;
            gap: 14px;
        }

        .bot-avatar-header {
            width: 52px;
            height: 52px;
            border-radius: 18px;
            background: #F8FAFC;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #E2E8F0;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
        }

        .bot-name-container {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }

        .bot-name {
            font-weight: 800;
            font-size: 18px;
            color: #0F172A;
            letter-spacing: -0.02em;
        }

        .status-indicator {
            display: flex;
            align-items: center;
            gap: 7px;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #22C55E;
            border-radius: 50%;
            position: relative;
        }

        .status-dot::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            border: 2px solid #22C55E;
            animation: ripple 2s infinite;
        }

        @keyframes ripple {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
        }

        .bot-status {
            font-size: 13px;
            color: #64748B;
            font-weight: 600;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 32px 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
          background: #FFFFFF;
          scroll-behavior: smooth;
        }

        /* Professional Scrollbar */
        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
          transition: background 0.3s ease;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: #CBD5E1;
        }

        .message-row {
          display: flex;
          align-items: flex-end;
          gap: 12px;
          max-width: 90%;
          animation: messageAppear 0.4s cubic-bezier(0.16, 1, 0.3, 1) backwards;
        }

        @keyframes messageAppear {
            from { opacity: 0; transform: translateY(15px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .bot-row {
          align-self: flex-start;
        }

        .user-row {
          align-self: flex-end;
          flex-direction: row;
        }

        .message-bubble {
          padding: 14px 20px;
          font-size: 15px;
          line-height: 1.6;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .bot-bubble {
          background: #0082FF;
          color: #FFFFFF;
          border-radius: 22px 22px 22px 4px;
          box-shadow: 0 5px 15px rgba(0, 130, 255, 0.2);
          font-weight: 400;
        }

        .user-bubble {
          background: #F1F5F9;
          color: #1E293B;
          border-radius: 22px 22px 4px 22px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
          font-weight: 400;
        }

        .message-time {
            font-size: 10px;
            opacity: 0.6;
            margin-top: 2px;
            align-self: flex-end;
            font-weight: 500;
        }

        .message-avatar {
            flex-shrink: 0;
            width: 34px;
            height: 34px;
            border-radius: 50%;
            overflow: hidden;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
            border: 2px solid #FFF;
        }

        .chat-input-wrapper {
            padding: 24px;
            background: #FFFFFF;
            border-top: 1px solid #F1F5F9;
        }

        .chat-input-area {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #F8FAFC;
          padding: 10px 10px 10px 24px;
          border-radius: 28px;
          border: 1px solid #E2E8F0;
          transition: all 0.3s ease;
        }

        .chat-input-area:focus-within {
            border-color: #0082FF;
            background: #FFFFFF;
            box-shadow: 0 8px 24px rgba(0, 130, 255, 0.12);
            transform: translateY(-2px);
        }

        .chat-input-area input {
          flex: 1;
          background: transparent;
          border: none;
          font-size: 15px;
          outline: none;
          color: #0F172A;
          font-weight: 500;
        }

        .chat-input-area input::placeholder {
            color: #94A3B8;
        }

        .send-btn {
          width: 44px;
          height: 44px;
          background: #0082FF;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 6px 15px rgba(0, 130, 255, 0.25);
        }

        .send-btn:hover:not(:disabled) {
          transform: scale(1.1);
          background: #0072E0;
          box-shadow: 0 8px 20px rgba(0, 130, 255, 0.35);
        }

        .send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }

        .send-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
            background: #94A3B8;
            box-shadow: none;
        }

        @media (max-width: 768px) {
          .chatbot-container {
            width: 100%;
            border-right: none;
          }
          .chatbot-header {
              padding: 24px 20px;
          }
          .chat-messages {
              padding: 24px 16px;
          }
        }
      `}</style>
    </div>
  )
}
