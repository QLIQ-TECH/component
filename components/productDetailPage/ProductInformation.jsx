'use client'

import { useState } from 'react'
import Image from 'next/image'

const faqData = [
  {
    question: "Question text goes here",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat. Aenean faucibus nibh et justo cursus id rutrum lorem imperdiet. Nunc ut sem vitae risus tristique posuere."
  },
  {
    question: "Question text goes here",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
  },
  {
    question: "Question text goes here",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
  },
  {
    question: "Question text goes here",
    answer: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique."
  }
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0)

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index)
  }

  return (
    <div className="faq-section">
      <div className="faq-container">
        <div className="faq-content">
          <div className="faq-text">
            <h2 className="faq-title">Product Information</h2>
            <div className="faq-accordion">
              {faqData.map((item, index) => (
                <div key={index} className={`accordion-item ${openIndex === index ? 'open' : ''}`}>
                  <div className="accordion-question" onClick={() => toggleFAQ(index)}>
                    <div className="question-text">{item.question}</div>
                    <button className="toggle-btn" aria-label="Toggle question">
                      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                        {openIndex === index ? (
                          <path d="M24 16H16H8" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        ) : (
                          <path d="M24 16H16M16 16H8M16 16V8M16 16V24" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        )}
                      </svg>
                    </button>
                  </div>
                  {openIndex === index && (
                    <div className="accordion-answer">
                      <div className="answer-text">{item.answer}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* <div className="faq-image">
            <Image
              src="https://api.builder.io/api/v1/image/assets/TEMP/578a387ce7b8070169768b7de1c8fcbb3dedc99d?width=1040"
              alt="FAQ Image"
              width={520}
              height={576}
              style={{ borderRadius: '24px' }}
            />
          </div> */}
        </div>
      </div>

      <style jsx>{`
        .faq-section {
          display: flex;
          padding: 40px;
          align-items: center;
          gap: 60px;
          width: 100%;
        }

        .faq-container {
          width: 100%;
          max-width: 1360px;
          margin: 0 auto;
        }

        .faq-content {
          display: flex;
          align-items: center;
          gap: 60px;
          width: 100%;
        }

        .faq-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 24px;
          flex: 1 0 0;
        }

        .faq-title {
          align-self: stretch;
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 40px;
          font-weight: 700;
          line-height: 120%;
          margin: 0;
        }

        .faq-accordion {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 16px;
          align-self: stretch;
        }

        .accordion-item {
          display: flex;
          padding: 0 24px;
          flex-direction: column;
          align-items: flex-start;
          align-self: stretch;
          border-radius: 24px;
          border: 1px solid rgba(0, 0, 0, 0.24);
          transition: all 0.2s ease;
        }

        .accordion-item.open {
          border: 1px solid #000;
          background: #F7F7F7;
        }

        .accordion-question {
          display: flex;
          padding: 16px 0;
          align-items: center;
          gap: 24px;
          align-self: stretch;
          cursor: pointer;
        }

        .question-text {
          flex: 1 0 0;
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 20px;
          font-weight: 700;
          line-height: 140%;
        }

        .toggle-btn {
          width: 32px;
          height: 32px;
          background: none;
          border: none;
          cursor: pointer;
        }

        .accordion-answer {
          display: flex;
          padding-bottom: 24px;
          align-items: flex-start;
          gap: 16px;
          align-self: stretch;
        }

        .answer-text {
          flex: 1 0 0;
          color: #000;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 16px;
          font-weight: 700;
          line-height: 150%;
        }

        .faq-image {
          flex-shrink: 0;
        }

        @media (max-width: 1024px) {
          .faq-content {
            flex-direction: column;
            gap: 40px;
          }

          .faq-image {
            width: 100%;
          }
        }

        @media (max-width: 767px) {
          .faq-section {
            padding: 20px;
            gap: 40px;
          }

          .faq-title {
            font-size: 28px;
          }

          .question-text {
            font-size: 18px;
          }

          .answer-text {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  )
}
