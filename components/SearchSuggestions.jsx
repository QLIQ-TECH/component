'use client'

import { useEffect, useRef, useState, memo, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDispatch, useSelector } from 'react-redux'
import { fetchSearchSuggestions, clearSuggestions } from '@/store/slices/productsSlice'
import { generateProductUrl, getPrimaryImage } from '@/utils/productUtils'
import { calculateSimilarity } from '@/utils/searchUtils'

const SearchSuggestions = memo(function SearchSuggestions({ 
  query, 
  isVisible, 
  onClose, 
  onSelect,
  inputRef 
}) {
  const router = useRouter()
  const dispatch = useDispatch()
  const suggestionsRef = useRef(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const { 
    searchSuggestions, 
    searchProductTypes,
    suggestionsLoading, 
    suggestionsError 
  } = useSelector(state => state.products)

  // Fetch suggestions when query changes
  useEffect(() => {
    if (query && query.trim().length >= 2 && isVisible) {
      dispatch(fetchSearchSuggestions(query.trim()))
    } else {
      dispatch(clearSuggestions())
    }
  }, [query, isVisible, dispatch])

  // Build suggestions that include the user's query and corrected spellings
  const displaySuggestions = useMemo(() => {
    if (!query || !query.trim()) return []
    
    const queryLower = query.trim().toLowerCase()
    const suggestions = []
    
    // Always show the user's typed query as the first option
    suggestions.push({
      isQueryOption: true,
      name: query.trim(),
      displayName: query.trim(),
      isCorrected: false
    })
    
    // If we have product types, find the best matching ones (for spell correction)
    if (searchProductTypes.length > 0) {
      // Find the best matching product type (likely the corrected spelling)
      const bestMatches = searchProductTypes
        .map(type => {
          const typeName = (type.name || '').toLowerCase()
          const similarity = calculateSimilarity(queryLower, typeName)
          return { ...type, similarity }
        })
        .filter(item => item.similarity > 0.5) // Only show if reasonably similar
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 3) // Top 3 matches
      
      // Add corrected spellings if they're different from the query
      bestMatches.forEach(match => {
        const matchName = match.name || ''
        const matchLower = matchName.toLowerCase()
        
        // Only add if it's different from the query (potential correction)
        if (matchLower !== queryLower && match.similarity > 0.7) {
          // Check if we already have this exact suggestion
          const alreadyExists = suggestions.some(s => 
            s.name && s.name.toLowerCase() === matchLower
          )
          
          if (!alreadyExists) {
            suggestions.push({
              ...match,
              isCorrected: true,
              correctedFrom: query.trim()
            })
          }
        }
      })
      
      // Add product type variants (even if not exact match)
      searchProductTypes.slice(0, 5).forEach(type => {
        const typeName = (type.name || '').toLowerCase()
        const alreadyExists = suggestions.some(s => 
          s.name && s.name.toLowerCase() === typeName
        )
        
        if (!alreadyExists) {
          suggestions.push(type)
        }
      })
    }
    
    return suggestions
  }, [query, searchProductTypes])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept Enter key - let the form submission handle it
      // This allows users to press Enter to search for their typed query directly
      if (e.key === 'Enter') {
        return // Let the form handle Enter key
      }
      
      if (!isVisible || !displaySuggestions.length) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < displaySuggestions.length - 1 ? prev + 1 : prev
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, displaySuggestions, selectedIndex, onClose])

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1)
  }, [displaySuggestions])

  const handleSuggestionClick = (suggestion) => {
    // Handle query option (user's typed query)
    if (suggestion.isQueryOption) {
      router.push(`/search?q=${encodeURIComponent(suggestion.name)}`)
    }
    // Handle product type suggestions
    else if (suggestion.name) {
      // Navigate to search results page with the product type as query
      router.push(`/search?q=${encodeURIComponent(suggestion.name)}`)
    } else if (suggestion.slug || suggestion._id) {
      // Fallback: Navigate to product detail page if it's a product object
      const slug = suggestion.slug || suggestion._id
      const id = suggestion._id || suggestion.id
      const url = id ? generateProductUrl(id, slug) : `/product/${slug}`
      router.push(url)
    } else {
      // Fallback to search results page
      router.push(`/search?q=${encodeURIComponent(suggestion.title || suggestion.name || query || '')}`)
    }
    onSelect()
  }

  const handleMouseEnter = (index) => {
    setSelectedIndex(index)
  }

  // Always show suggestions if query is long enough, even if no products match
  if (!isVisible || !query || query.trim().length < 2) {
    return null
  }
  
  // Show loading or suggestions
  if (suggestionsLoading) {
    // Show loading state
  } else if (!suggestionsLoading && displaySuggestions.length === 0) {
    // Even if no products match, show the query as a suggestion
    return (
      <div 
        ref={suggestionsRef}
        className="search-suggestions"
        style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          border: '1px solid #E5E7EB',
          borderTop: 'none',
          borderRadius: '0 0 12px 12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
      >
        <div className="suggestions-list">
          <div
            className="suggestion-item"
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query.trim())}`)
              onSelect()
            }}
            style={{
              padding: '12px 16px',
              cursor: 'pointer',
              backgroundColor: 'transparent',
              transition: 'background-color 0.2s ease'
            }}
          >
            <div className="suggestion-row">
              <div className="suggestion-content">
                <div className="suggestion-header">
                  <span className="suggestion-title" style={{ fontWeight: 500 }}>
                    {query.trim()}
                  </span>
                  <span className="suggestion-type">Search</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      ref={suggestionsRef}
      className="search-suggestions"
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        border: '1px solid #E5E7EB',
        borderTop: 'none',
        borderRadius: '0 0 12px 12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        maxHeight: '300px',
        overflowY: 'auto'
      }}
    >
      {suggestionsLoading ? (
        <div className="suggestion-loading">
          <div className="loading-spinner"></div>
          <span>Searching...</span>
        </div>
      ) : suggestionsError ? (
        <div className="suggestion-error">
          <span>Failed to load suggestions</span>
        </div>
      ) : (
        <div className="suggestions-list">
          {displaySuggestions.map((suggestion, index) => {
            // Handle query option (user's typed query)
            if (suggestion.isQueryOption) {
              return (
                <div
                  key={`query-${index}`}
                  className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < displaySuggestions.length - 1 ? '1px solid #E5E7EB' : 'none',
                    backgroundColor: selectedIndex === index ? '#F0F9FF' : 'transparent',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <div className="suggestion-row">
                    <div className="suggestion-content">
                      <div className="suggestion-header">
                        <span className="suggestion-title" style={{ fontWeight: 500, color: '#111827' }}>
                          {suggestion.displayName}
                        </span>
                        <span className="suggestion-type">
                          Search
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Handle corrected spelling suggestions
            if (suggestion.isCorrected) {
              return (
                <div
                  key={`corrected-${suggestion.name}-${index}`}
                  className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: index < displaySuggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                    backgroundColor: selectedIndex === index ? '#F0F9FF' : 'transparent',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  <div className="suggestion-row">
                    <div className="suggestion-content">
                      <div className="suggestion-header">
                        <span className="suggestion-title">
                          {suggestion.name}
                        </span>
                        <span className="suggestion-type" style={{ background: '#FEF3C7', color: '#92400E' }}>
                          Did you mean?
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            }
            
            // Handle product type suggestions
            const firstProduct = suggestion.products?.[0]
            const displayName = suggestion.name || suggestion.title || 'Product Type'
            
            return (
              <div
                key={`type-${displayName}-${index}`}
                className={`suggestion-item ${selectedIndex === index ? 'selected' : ''}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => handleMouseEnter(index)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: index < displaySuggestions.length - 1 ? '1px solid #F3F4F6' : 'none',
                  backgroundColor: selectedIndex === index ? '#F0F9FF' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}
              >
                <div className="suggestion-row">
                  {firstProduct?.images && (
                    <div className="thumb">
                      <Image
                        src={getPrimaryImage(firstProduct.images)}
                        alt={displayName}
                        width={48}
                        height={48}
                        style={{ objectFit: 'cover', borderRadius: 8 }}
                      />
                    </div>
                  )}
                  <div className="suggestion-content">
                    <div className="suggestion-header">
                      <span className="suggestion-title">
                        {displayName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style jsx>{`
        .suggestion-loading {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px;
          color: #6B7280;
          font-size: 14px;
        }

        .suggestion-error {
          padding: 16px;
          color: #EF4444;
          font-size: 14px;
        }

        .suggestion-item:hover {
          background-color: #F0F9FF !important;
        }

        .suggestion-row { display: flex; align-items: center; gap: 12px; }
        .thumb { flex: 0 0 48px; height: 48px; border-radius: 8px; overflow: hidden; background: #fff; }
        .suggestion-content { display: flex; flex-direction: column; gap: 4px; }

        .suggestion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .suggestion-title {
          font-weight: 500;
          color: #111827;
          font-size: 14px;
        }

        .suggestion-type {
          font-size: 12px;
          color: #6B7280;
          background: #F3F4F6;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .meta { display: flex; gap: 8px; align-items: center; }

        .suggestion-price {
          font-size: 12px;
          color: #059669;
          font-weight: 500;
        }
        .brand { font-size: 12px; color: #6B7280; }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #E5E7EB;
          border-top: 2px solid #0082FF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
})

export default SearchSuggestions
