'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import ChatBot from './ChatBot'

export default function BotContainer() {
  const [isChatOpen, setIsChatOpen] = useState(false)

  return (
    <>
      {/* Dynamic Floating Action Button */}
      <div 
        className="sticky-bot" 
        onClick={() => setIsChatOpen(true)}
        aria-label="Open Help Chat"
      >
        <Image 
          src="/bot.png" 
          alt="IQLIQ Bot" 
          width={80} 
          height={80} 
          priority
        />
      </div>

      {/* ChatBot Popup Drawer */}
      <ChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
      />

      <style jsx>{`
        .sticky-bot {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999; /* Ensure it's above most things */
          cursor: pointer;
          width: 64px;
          height: 64px;
          background: #0082FF;
          border-radius: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 16px rgba(0, 130, 255, 0.3);
          border: 2px solid #FFF;
        }

        .sticky-bot :global(img) {
          width: 40px !important;
          height: 40px !important;
          object-fit: contain;
          transition: transform 0.3s ease;
        }

        .sticky-bot:hover {
          transform: translateY(-5px) rotate(5deg);
          box-shadow: 0 12px 24px rgba(0, 130, 255, 0.45);
          background: #0072e0;
        }

        .sticky-bot:hover :global(img) {
          transform: scale(1.1);
        }

        .sticky-bot:active {
          transform: scale(0.9);
        }

        @media (max-width: 768px) {
          .sticky-bot {
            bottom: 80px;
            right: 20px;
            width: 56px;
            height: 56px;
          }
          .sticky-bot :global(img) {
            width: 32px !important;
            height: 32px !important;
          }
        }
      `}</style>
    </>
  )
}
