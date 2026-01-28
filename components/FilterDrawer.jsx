import { useEffect, useState, useCallback, useRef } from 'react';

export default function FilterDrawer({ open, onClose, inline = false, sticky = false, stickyTop = 112, facets = [], selected = {}, onChange, onClear }) {
  // Initialize with all facets expanded by default
  const [expandedFacets, setExpandedFacets] = useState(() => {
    return new Set(facets.map(facet => facet.key));
  });

  // Local state for price range to avoid constant API calls
  const [localPriceRange, setLocalPriceRange] = useState({});
  const [priceDebounceTimer, setPriceDebounceTimer] = useState(null);
  const [activeSlider, setActiveSlider] = useState(null);
  const [hoveredSlider, setHoveredSlider] = useState(null);
  const activeSliderDataRef = useRef(null);
  
  // Cache the initial bounds for range facets to prevent jumping/shrinking during filtering
  const [cachedFacetBounds, setCachedFacetBounds] = useState({});

  useEffect(() => {
    if (!Array.isArray(facets)) return;
    
    setCachedFacetBounds(prev => {
      const next = { ...prev };
      let changed = false;
      
      facets.forEach(facet => {
        if (facet.type === 'range' && facet.min !== undefined && facet.max !== undefined) {
          // Only set if not already set (preserve initial global bounds)
          if (!next[facet.key]) {
            next[facet.key] = { min: facet.min, max: facet.max };
            changed = true;
          }
        }
      });
      
      return changed ? next : prev;
    });
  }, [facets]);
  
  // Debounced price range handler
  const debouncedPriceChange = useCallback((facetKey, newRange) => {
    if (priceDebounceTimer) {
      clearTimeout(priceDebounceTimer);
    }
    
    const timer = setTimeout(() => {
      if (onChange) {
        onChange(facetKey, newRange);
      }
    }, 500); // 500ms delay
    
    setPriceDebounceTimer(timer);
  }, [onChange, priceDebounceTimer]);

  const handleRangeChange = useCallback((facetKey, field, value, facetMin, facetMax) => {
    if (!onChange) return
    
    // Get current values
    const currentRange = localPriceRange[facetKey] || selected[facetKey] || {};
    
    // Parse the new value
    const numValue = parseInt(value) || (field === 'min' ? facetMin : facetMax);
    
    // Create new range object
    const newRange = { ...currentRange };
    
    if (field === 'min') {
      const proposedMin = Math.min(Math.max(numValue, facetMin), facetMax);
      const currentMax = newRange.max ?? facetMax;
      newRange.min = Math.min(proposedMin, currentMax); // clamp at current max instead of swapping
    } else if (field === 'max') {
      const proposedMax = Math.min(Math.max(numValue, facetMin), facetMax);
      const currentMin = newRange.min ?? facetMin;
      newRange.max = Math.max(proposedMax, currentMin); // clamp at current min instead of swapping
    }
    
    // Update local state immediately for smooth UI
    setLocalPriceRange(prev => ({
      ...prev,
      [facetKey]: newRange
    }));
    
    // Debounce the actual API call
    debouncedPriceChange(facetKey, newRange);
  }, [onChange, localPriceRange, selected, debouncedPriceChange]);
  
  // Dedicated handlers so each thumb has its own code path
  const handleMinSliderInput = (facetKey, value, facetMin, facetMax) => {
    setActiveSlider('min');
    handleRangeChange(facetKey, 'min', value, facetMin, facetMax);
  };

  const handleMaxSliderInput = (facetKey, value, facetMin, facetMax) => {
    setActiveSlider('max');
    handleRangeChange(facetKey, 'max', value, facetMin, facetMax);
  };

  // Allow clicking anywhere on the track to pick the nearest thumb (min or max)
  const handleTrackPointerDown = useCallback((event, facetKey, facetMin, facetMax, currentMin, currentMax) => {
    if (event.button !== undefined && event.button !== 0) return; // only primary mouse button

    const wrapper = event.currentTarget;
    const rect = wrapper.getBoundingClientRect();
    const clientX = event.touches?.[0]?.clientX ?? event.clientX;
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const rawValue = facetMin + (percent * (facetMax - facetMin));
    const snappedValue = Math.round(rawValue);

    const distanceToMin = Math.abs(snappedValue - currentMin);
    const distanceToMax = Math.abs(snappedValue - currentMax);
    const targetThumb = distanceToMin <= distanceToMax ? 'min' : 'max';

    // Ensure subsequent drags track against the wrapper we started on
    activeSliderDataRef.current = { wrapper, facetKey, facetMin, facetMax };
    setActiveSlider(targetThumb);
    handleRangeChange(facetKey, targetThumb, snappedValue.toString(), facetMin, facetMax);

    event.preventDefault();
    event.stopPropagation();
  }, [handleRangeChange]);

  // Keyboard support so both thumbs are usable without the track
  const handleSliderKeyDown = (facetKey, field, facetMin, facetMax) => (event) => {
    const step = 1;
    const currentRange = localPriceRange[facetKey] || selected[facetKey] || {};
    const currentMin = currentRange.min ?? facetMin;
    const currentMax = currentRange.max ?? facetMax;
    let nextValue;

    if (field === 'min') {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        nextValue = Math.min(currentMin + step, currentMax);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        nextValue = Math.max(currentMin - step, facetMin);
      }
    } else if (field === 'max') {
      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        nextValue = Math.min(currentMax + step, facetMax);
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        nextValue = Math.max(currentMax - step, currentMin);
      }
    }

    if (nextValue !== undefined) {
      event.preventDefault();
      handleRangeChange(facetKey, field, nextValue.toString(), facetMin, facetMax);
    }
  };

  // Global mouse move handler for dragging
  useEffect(() => {
    let rafId = null;
    
    const handleGlobalMouseMove = (event) => {
      if (!activeSlider || !activeSliderDataRef.current) return;
      
      // Use requestAnimationFrame for smooth updates
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(() => {
        const { wrapper, facetKey, facetMin, facetMax } = activeSliderDataRef.current;
        if (!wrapper) return;
        
        // Get current values dynamically from state
        const currentRange = localPriceRange[facetKey] || selected[facetKey] || {};
        const currentMin = currentRange.min ?? facetMin;
        const currentMax = currentRange.max ?? facetMax;
        
        const rect = wrapper.getBoundingClientRect();
        const clientX = event.touches?.[0]?.clientX ?? event.clientX;
        const mouseX = clientX - rect.left;
        const trackWidth = rect.width;
        const mousePercent = Math.max(0, Math.min(1, mouseX / trackWidth));
        const mouseValue = facetMin + (mousePercent * (facetMax - facetMin));
        const roundedValue = Math.round(mouseValue);
        
        if (activeSlider === 'min') {
          // Ensure min doesn't exceed current max
          const newValue = Math.min(Math.max(roundedValue, facetMin), currentMax);
          handleRangeChange(facetKey, 'min', newValue.toString(), facetMin, facetMax);
        } else if (activeSlider === 'max') {
          // Ensure max doesn't go below current min and doesn't exceed facetMax
          const newValue = Math.min(Math.max(roundedValue, currentMin), facetMax);
          handleRangeChange(facetKey, 'max', newValue.toString(), facetMin, facetMax);
        }
      });
    };

    if (activeSlider) {
      document.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
      document.addEventListener('touchmove', handleGlobalMouseMove, { passive: true });
      return () => {
        if (rafId) {
          cancelAnimationFrame(rafId);
        }
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('touchmove', handleGlobalMouseMove);
      };
    }
  }, [activeSlider, localPriceRange, selected, handleRangeChange]);

  useEffect(() => {
    if (inline) return; // Do not alter body scroll in inline mode
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open, inline]);

  // Global mouse up handler to reset active slider
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setActiveSlider(null);
      activeSliderDataRef.current = null;
    };
    if (activeSlider) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('touchend', handleGlobalMouseUp);
      return () => {
        document.removeEventListener('mouseup', handleGlobalMouseUp);
        document.removeEventListener('touchend', handleGlobalMouseUp);
      };
    }
  }, [activeSlider]);

  // Update expanded facets when facets change (new filter data loaded)
  useEffect(() => {
    if (facets.length > 0) {
      setExpandedFacets(new Set(facets.map(facet => facet.key)));
    }
  }, [facets]);

  const toggleFacetExpansion = (facetKey) => {
    setExpandedFacets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(facetKey)) {
        newSet.delete(facetKey);
      } else {
        newSet.add(facetKey);
      }
      return newSet;
    });
  };

  const handleCheckboxToggle = (facetKey, value) => {
    if (!onChange) return
    const current = selected[facetKey] instanceof Set
      ? new Set(Array.from(selected[facetKey]))
      : new Set(Array.isArray(selected[facetKey]) ? selected[facetKey] : [])
    if (current.has(value)) current.delete(value)
    else current.add(value)
    onChange(facetKey, current)
  }

  // Sync local price range with selected filters when they change externally
  useEffect(() => {
    setLocalPriceRange(prev => {
      const newLocal = { ...prev };
      Object.keys(selected).forEach(key => {
        if (selected[key] && typeof selected[key] === 'object' && (selected[key].min !== undefined || selected[key].max !== undefined)) {
          newLocal[key] = selected[key];
        }
      });
      return newLocal;
    });
  }, [selected]);

  if (!open) return null;

  const handleMinSelect = (facetKey, value) => {
    if (!onChange) return
    onChange(facetKey, typeof value === 'number' ? value : undefined)
  }

  // Check if any filters are applied
  const hasAppliedFilters = () => {
    return Object.keys(selected).some(key => {
      const value = selected[key];
      if (value instanceof Set) {
        return value.size > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      if (typeof value === 'object' && value !== null) {
        return value.min !== undefined || value.max !== undefined;
      }
      if (typeof value === 'number') {
        return value > 0;
      }
      return Boolean(value);
    });
  }

  // Reset all filters
  const handleReset = () => {
    if (onClear) {
      onClear();
    }
    // Also clear local price range
    setLocalPriceRange({});
  }

  return (
    <div className={inline ? "filter-drawer-inline-wrapper" : "filter-drawer-overlay"}>
      <div className="filter-drawer">
        <div className="filter-header">
          <span className="filter-title">Filters</span>
          <div className="filter-header-actions">
            {hasAppliedFilters() && (
              <button className="filter-reset" onClick={handleReset}>
                {/* <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3V1M8 3H6M8 3H10M8 3V5M3 8H1M3 8V6M3 8V10M3 8H5M8 13V15M8 13H6M8 13H10M8 13V11M13 8H15M13 8V6M13 8V10M13 8H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg> */}
                Reset
              </button>
            )}
            {!inline && (
              <button className="filter-close" onClick={onClose}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#F5F5F5"/>
                <path d="M11 11L21 21M21 11L11 21" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
            )}
          </div>
        </div>
        <div className="filter-divider"></div>
        <div className="filter-list">
          {Array.isArray(facets) && facets.length > 0 ? (
            facets.map((facet) => (
              <div className="filter-section" key={facet.key}>
                <div className="filter-row">
                  <span className="filter-label">{facet.label}</span>
                  <button
                    type="button"
                    className="facet-toggle"
                    aria-expanded={expandedFacets.has(facet.key)}
                    onClick={() => toggleFacetExpansion(facet.key)}
                  >
                    <svg 
                      className={`filter-chevron ${expandedFacets.has(facet.key) ? 'expanded' : ''}`}
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="none"
                      aria-hidden="true"
                    >
                      <path d="M4 6L8 10L12 6" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                {expandedFacets.has(facet.key) && (
                  <>
                    {facet.type === 'checkbox' && (
                  <div className="filter-options">
                    {(facet.options || []).map(opt => {
                      const checked = selected[facet.key] instanceof Set
                        ? selected[facet.key].has(opt.value)
                        : Array.isArray(selected[facet.key])
                          ? selected[facet.key].includes(opt.value)
                          : false
                      return (
                        <label className="filter-option" key={`${facet.key}:${opt.value}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCheckboxToggle(facet.key, opt.value)}
                          />
                          <span className="option-text">{opt.label}</span>
                          {typeof opt.count === 'number' && <span className="option-count">{opt.count}</span>}
                        </label>
                      )
                    })}
                  </div>
                )}
                {facet.type === 'range' && (() => {
                  // Use cached bounds if available to maintain stable slider scale, otherwise fallback to current facet props
                  const cached = cachedFacetBounds[facet.key] || {};
                  const facetMin = cached.min ?? facet.min ?? 0;
                  const facetMax = cached.max ?? facet.max ?? 1000;
                  
                  const currentRange = localPriceRange[facet.key] || selected[facet.key] || {};
                  const currentMin = currentRange.min ?? facetMin;
                  const currentMax = currentRange.max ?? facetMax;
                  
                  // Calculate progress bar position and width
                  const rangeTotal = facetMax - facetMin;
                  const progressLeft = rangeTotal > 0 ? ((currentMin - facetMin) / rangeTotal) * 100 : 0;
                  const progressWidth = rangeTotal > 0 ? ((currentMax - currentMin) / rangeTotal) * 100 : 100;
                  const maxLeft = progressLeft + progressWidth;

                  // Show both tooltips when hovering over either slider or when actively dragging
                  const isHoveringThisRange = hoveredSlider?.key === facet.key;
                  const isActiveThisRange = activeSliderDataRef.current?.facetKey === facet.key;
                  const showMinTooltip = isHoveringThisRange || isActiveThisRange;
                  const showMaxTooltip = isHoveringThisRange || isActiveThisRange;
                  
                  return (
                    <div className="filter-range">
                      <div className="range-slider-container">
                        <div className="range-selected-display">
                          <span className="range-price-text">
                            <span className="range-price-min">AED {facetMin}</span>
                            {/* <span className="range-price-separator"> – </span> */}
                            <span className="range-price-max">AED {facetMax}</span>
                          </span>
                        </div>
                        <div 
                          className="range-slider-wrapper"
                          aria-label="Price range slider"
                          onMouseEnter={() => setHoveredSlider({ key: facet.key, thumb: 'both' })}
                          onMouseLeave={() => setHoveredSlider(null)}
                          onMouseDownCapture={(e) => handleTrackPointerDown(e, facet.key, facetMin, facetMax, currentMin, currentMax)}
                          onTouchStartCapture={(e) => handleTrackPointerDown(e, facet.key, facetMin, facetMax, currentMin, currentMax)}
                        >
                          <div className="range-track">
                            <div 
                              className="range-progress" 
                              style={{
                                left: `${Math.max(0, Math.min(100, progressLeft))}%`,
                                width: `${Math.max(0, Math.min(100, progressWidth))}%`
                              }}
                            ></div>
                          </div>

                          {showMinTooltip && (() => {
                            const minPosition = Math.max(0, Math.min(100, progressLeft));
                            // If tooltip is too close to left edge (< 15%), shift it right
                            const isLeftEdge = minPosition < 15;
                            return (
                              <div 
                                className={`range-tooltip range-tooltip-min ${isLeftEdge ? 'tooltip-left' : ''}`}
                                style={{ 
                                  left: `${minPosition}%`
                                }}
                              >
                                AED {currentMin}
                              </div>
                            );
                          })()}
                          
                          {showMaxTooltip && (() => {
                            const maxPosition = Math.max(0, Math.min(100, maxLeft));
                            // If tooltip is too close to right edge (> 85%), shift it left
                            const isRightEdge = maxPosition > 85;
                            return (
                              <div 
                                className={`range-tooltip range-tooltip-max ${isRightEdge ? 'tooltip-right' : ''}`}
                                style={{ 
                                  left: `${maxPosition}%`
                                }}
                              >
                                AED {currentMax}
                              </div>
                            );
                          })()}

                          <input
                            type="range"
                            min={facetMin}
                            max={facetMax}
                            step="1"
                            value={currentMin}
                            aria-label="Minimum price"
                            aria-valuemin={facetMin}
                            aria-valuemax={currentMax}
                            aria-valuenow={currentMin}
                            aria-valuetext={`Minimum price ${currentMin}`}
                            onChange={(e) => handleMinSliderInput(facet.key, e.target.value, facetMin, facetMax)}
                            onInput={(e) => handleMinSliderInput(facet.key, e.target.value, facetMin, facetMax)}
                            onMouseEnter={() => setHoveredSlider({ key: facet.key, thumb: 'min' })}
                            onMouseLeave={() => {
                              // Delay clearing to allow moving to max slider
                              setTimeout(() => {
                                if (!document.querySelector(`.range-slider-wrapper[aria-label="Price range slider"]:hover`)) {
                                  setHoveredSlider(null);
                                }
                              }, 50);
                            }}
                            onMouseDown={(e) => {
                              // Prevent track clicks from jumping the thumb; we handle movement manually
                              e.preventDefault();
                              setActiveSlider('min');
                              const wrapper = e.currentTarget.closest('.range-slider-wrapper');
                              if (wrapper) {
                                activeSliderDataRef.current = {
                                  wrapper,
                                  facetKey: facet.key,
                                  facetMin,
                                  facetMax,
                                  currentMin,
                                  currentMax
                                };
                              }
                            }}
                            onMouseUp={() => {
                              setActiveSlider(null);
                              activeSliderDataRef.current = null;
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              setActiveSlider('min');
                              const wrapper = e.currentTarget.closest('.range-slider-wrapper');
                              if (wrapper) {
                                activeSliderDataRef.current = {
                                  wrapper,
                                  facetKey: facet.key,
                                  facetMin,
                                  facetMax,
                                  currentMin,
                                  currentMax
                                };
                              }
                            }}
                            onTouchEnd={() => {
                              setActiveSlider(null);
                              activeSliderDataRef.current = null;
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={() => setActiveSlider('min')}
                            onBlur={() => setActiveSlider(null)}
                            onKeyDown={handleSliderKeyDown(facet.key, 'min', facetMin, facetMax)}
                            style={{ pointerEvents: 'none', touchAction: 'none', zIndex: activeSlider === 'min' ? 3 : 2 }}
                            className={`range-slider min-slider ${activeSlider === 'min' ? 'active' : ''}`}
                          />
                          <input
                            type="range"
                            min={facetMin}
                            max={facetMax}
                            step="1"
                            value={currentMax}
                            aria-label="Maximum price"
                            aria-valuemin={currentMin}
                            aria-valuemax={facetMax}
                            aria-valuenow={currentMax}
                            aria-valuetext={`Maximum price ${currentMax}`}
                            onChange={(e) => handleMaxSliderInput(facet.key, e.target.value, facetMin, facetMax)}
                            onInput={(e) => handleMaxSliderInput(facet.key, e.target.value, facetMin, facetMax)}
                            onMouseEnter={() => setHoveredSlider({ key: facet.key, thumb: 'max' })}
                            onMouseLeave={() => {
                              // Delay clearing to allow moving to min slider
                              setTimeout(() => {
                                if (!document.querySelector(`.range-slider-wrapper[aria-label="Price range slider"]:hover`)) {
                                  setHoveredSlider(null);
                                }
                              }, 50);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setActiveSlider('max');
                              const wrapper = e.currentTarget.closest('.range-slider-wrapper');
                              if (wrapper) {
                                activeSliderDataRef.current = {
                                  wrapper,
                                  facetKey: facet.key,
                                  facetMin,
                                  facetMax,
                                  currentMin,
                                  currentMax
                                };
                              }
                            }}
                            onMouseUp={() => {
                              setActiveSlider(null);
                              activeSliderDataRef.current = null;
                            }}
                            onTouchStart={(e) => {
                              e.preventDefault();
                              setActiveSlider('max');
                              const wrapper = e.currentTarget.closest('.range-slider-wrapper');
                              if (wrapper) {
                                activeSliderDataRef.current = {
                                  wrapper,
                                  facetKey: facet.key,
                                  facetMin,
                                  facetMax,
                                  currentMin,
                                  currentMax
                                };
                              }
                            }}
                            onTouchEnd={() => {
                              setActiveSlider(null);
                              activeSliderDataRef.current = null;
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onFocus={() => setActiveSlider('max')}
                            onBlur={() => setActiveSlider(null)}
                            onKeyDown={handleSliderKeyDown(facet.key, 'max', facetMin, facetMax)}
                            style={{ pointerEvents: 'none', touchAction: 'none', zIndex: activeSlider === 'max' ? 3 : 2 }}
                            className={`range-slider max-slider ${activeSlider === 'max' ? 'active' : ''}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                {facet.type === 'min' && (
                  <div className="filter-options">
                    {(facet.options || []).map(opt => (
                      <label className="filter-option" key={`${facet.key}:${opt.value}`}>
                        <input
                          type="radio"
                          name={`min-${facet.key}`}
                          checked={Number(selected[facet.key] || 0) === Number(opt.value)}
                          onChange={() => handleMinSelect(facet.key, opt.value)}
                        />
                        <span className="option-text">{opt.label}</span>
                        {typeof opt.count === 'number' && <span className="option-count">{opt.count}</span>}
                      </label>
                    ))}
                  </div>
                )}
                  </>
                )}
              </div>
            ))
          ) : (
            ["Availability", "Price", "Product Type", "Collections", "Color", "Size", "Strap Material"].map((label) => (
              <div className="filter-row" key={label}>
                <span className="filter-label">{label}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M6 8L10 12L14 8" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            ))
          )}
        </div>
        {!inline && (
          <div className="filter-actions">
            <button className="filter-clear" onClick={onClear}>Clear All</button>
            <button className="filter-results" onClick={onClose}>See Results</button>
          </div>
        )}
      </div>
      <style jsx>{`
        .filter-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.08);
          z-index: 9999;
          display: flex;
          justify-content: flex-start;
        }
        .filter-drawer-inline-wrapper {
          display: block;
          background: transparent;
          width: 100%;
          ${sticky ? `position: sticky; top: ${stickyTop}px;` : ''}
        }
        .filter-drawer {
          background: #fff;
          width: 320px;
          max-width: 100vw;
          height: ${inline ? 'auto' : '100vh'};
          box-shadow: ${inline ? '0 2px 8px rgba(0,0,0,0.1)' : '2px 0 16px rgba(0,0,0,0.08)'};
          display: flex;
          flex-direction: column;
          border-radius: ${inline ? '12px' : '0'};
          ${inline ? '' : 'animation: slideInLeft 0.25s cubic-bezier(.4,0,.2,1);'}
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 16px 24px;
        }
        .filter-header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .filter-reset {
          display: flex;
          align-items: center;
          gap: 6px;
          background:rgb(0, 130, 255, 0.2);
          color: #0082FF;
          border: none;
          border-radius: 32px;
          padding: 8px 16px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .filter-title {
          font-size: 24px;
          font-weight: 600;
          color: #000;
        }
        .filter-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .filter-divider {
          height: 1px;
          background: #000;
          margin: 0 24px 0 24px;
        }
        .filter-list {
          flex: 1;
          padding: 24px 24px 0 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .filter-section { padding-bottom: 8px; border-bottom: 1px solid #eee; }
        .filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .filter-label {
          font-size: 18px;
          font-weight: 600;
          color: #111;
        }
        .filter-chevron {
          transition: transform 0.2s ease;
        }
        .filter-chevron.expanded {
          transform: rotate(180deg);
        }
        .facet-toggle {
          background: transparent;
          border: none;
          padding: 4px;
          margin: -4px 0 -4px 8px;
          cursor: pointer;
          border-radius: 6px;
        }
        .facet-toggle:focus-visible {
          outline: 2px solid #b3dbff;
          outline-offset: 2px;
        }
        .filter-options { display: flex; flex-direction: column; gap: 10px; padding: 8px 0 0 0; }
        .filter-option { display: flex; align-items: center; gap: 10px; font-size: 14px; color: #222; }
        .option-text { flex: 1; }
        .option-count { color: #666; font-size: 12px; }
        .filter-range { 
          padding-top: 8px; 
          width: 100%;
          min-width: 0;
        }
        .range-slider-container { 
          display: flex; 
          flex-direction: column; 
          gap: 0;
          min-height: 64px;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        .range-selected-display {
          display: flex;
          align-items: center;
          font-size: 16px;
          font-weight: 500;
          color: #222;
          margin-bottom: 16px;
          min-height: 28px;
          padding: 0;
          width: 100%;
        }
        .range-price-text {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          min-width: 180px;
        }
        .range-price-min {
          text-align: left;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
        .range-price-max {
          text-align: right;
          font-variant-numeric: tabular-nums;
          font-feature-settings: "tnum";
        }
        .range-price-separator {
          display: inline-block;
          margin: 0 4px;
          flex-shrink: 0;
        }
        .range-slider-wrapper { 
          position: relative; 
          height: 20px; 
          margin: 0;
          padding: 0;
          width: 100%;
          min-width: 100%;
          max-width: 100%;
          flex-shrink: 0;
          box-sizing: border-box;
        }
        .range-track {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          width: 100% !important;
          height: 6px;
          background: #e0e0e0;
          border-radius: 3px;
          transform: translateY(-50%);
          box-sizing: border-box;
          min-width: 100% !important;
          max-width: 100% !important;
        }
        .range-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: #0082FF;
          border-radius: 3px;
          transition: left 0.15s cubic-bezier(0.4, 0, 0.2, 1), width 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: left, width;
          box-sizing: border-box;
          max-width: 100%;
        }
        .range-slider-wrapper:active .range-progress {
          transition: none;
        }
        .range-slider { 
          position: absolute; 
          width: 100%; 
          height: 20px; 
          background: transparent; 
          outline: none; 
          -webkit-appearance: none; 
          appearance: none;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          pointer-events: none; /* Only allow interaction via the thumb (button) */
        }
        .range-slider::-webkit-slider-track { 
          height: 6px; 
          background: transparent; 
          border-radius: 3px; 
        }
        .range-slider::-webkit-slider-thumb { 
          -webkit-appearance: none; 
          appearance: none; 
          height: 20px; 
          width: 20px; 
          background: radial-gradient(circle, #fff 30%, #0082FF 30%);
          border-radius: 50%; 
          cursor: pointer; 
          border: 3px solid #fff; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        .range-slider-wrapper:active .range-slider::-webkit-slider-thumb {
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .range-slider::-moz-range-track { 
          height: 6px; 
          background: transparent; 
          border-radius: 3px; 
          border: none; 
        }
        .range-slider::-moz-range-thumb { 
          height: 20px; 
          width: 20px; 
          background: radial-gradient(circle, #fff 30%, #0082FF 30%);
          border-radius: 50%; 
          cursor: pointer; 
          border: 3px solid #fff; 
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          pointer-events: auto;
        }
        .range-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }
        .range-slider-wrapper:active .range-slider::-moz-range-thumb {
          transition: transform 0.1s ease, box-shadow 0.1s ease;
        }
        .range-tooltip {
          position: absolute;
          top: -36px;
          background: #222;
          color: #fff;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }
        .range-tooltip::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 50%;
          margin-left: -4px;
          border-width: 4px;
          border-style: solid;
          border-color: #222 transparent transparent transparent;
        }
        .range-tooltip-min {
          transform: translateX(-50%);
        }
        .range-tooltip-min.tooltip-left {
          transform: translateX(0);
        }
        .range-tooltip-min.tooltip-left::after {
          left: 20px;
          margin-left: 0;
        }
        .range-tooltip-max {
          transform: translateX(-50%);
        }
        .range-tooltip-max.tooltip-right {
          transform: translateX(-100%);
        }
        .range-tooltip-max.tooltip-right::after {
          left: auto;
          right: 20px;
          margin-left: 0;
        }
        .min-slider { 
          z-index: 3; 
          pointer-events: auto !important;
          position: absolute;
        }
        .min-slider.active {
          z-index: 6 !important;
        }
        .max-slider { 
          z-index: 4; 
          pointer-events: auto !important;
          position: absolute;
        }
        .max-slider.active {
          z-index: 6 !important;
        }
        
        /* Ensure both sliders can be interacted with */
        .range-slider-wrapper:hover .min-slider:not(.active) {
          z-index: 4;
        }
        .range-slider-wrapper:hover .max-slider:not(.active) {
          z-index: 3;
        }
        
        /* Make sure thumbs are always clickable */
        .range-slider::-webkit-slider-thumb {
          pointer-events: auto;
        }
        .range-slider::-moz-range-thumb {
          pointer-events: auto;
        }
        .filter-actions {
          display: flex;
          gap: 18px;
          padding: 0 24px 32px 24px;
        }
        .filter-clear {
          flex: 1;
          background: #fff;
          color: #111;
          border: 1.5px solid #0082FF;
          border-radius: 24px;
          font-size: 18px;
          font-weight: 600;
          padding: 12px 0;
          cursor: pointer;
          transition: background 0.2s;
        }
        .filter-results {
          flex: 1;
          background: #CBE6FF;
          color: #0082FF;
          border: none;
          border-radius: 24px;
          font-size: 18px;
          font-weight: 600;
          padding: 12px 0;
          cursor: pointer;
          transition: background 0.2s;
        }
        .filter-clear:hover {
          background: #f5faff;
        }
        .filter-results:hover {
          background: #b3dbff;
        }
        @media (max-width: 600px) {
          .filter-drawer {
            width: 100vw;
            padding: 0;
          }
          .filter-header, .filter-divider, .filter-list, .filter-actions {
            padding-left: 12px;
            padding-right: 12px;
          }
        }
      `}</style>
    </div>
  );
}
