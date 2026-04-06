'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

export default function CategoryCard({ name, image, onClick }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="category-card" onClick={onClick}>
      <Image
        src={image}
        alt={name}
        width={isMobile ? 140 : 206}
        height={isMobile ? 140 : 206}
        style={{ borderRadius: '16px' }}
      />
      <div className="category-name">
        <h3>{name}</h3>
      </div>

      <style jsx>{`
        .category-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: rgba(247, 247, 247, 0.00);
          cursor: pointer;
          transition: all 0.2s ease;
          padding: ${isMobile ? '10px' : '16px'};
          min-width: ${isMobile ? '150px' : '238px'};
        }

        .category-name {
          display: flex;
          padding: 0 8px;
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
          align-self: stretch;
        }

        .category-name h3 {
          align-self: stretch;
          color: #000;
          text-align: center;
          font-family: 'DM Sans', -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 18px;
          font-weight: 400;
          line-height: 150%;
          margin: 0;
        }

        @media (max-width: 768px) {
          .category-name h3 {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  )
}
