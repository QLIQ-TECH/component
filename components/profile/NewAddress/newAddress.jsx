import { useState, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faBriefcase, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons'
import { createAddress, fetchCountries, fetchCitiesByCountry, fetchZonesByCity } from '../../../store/slices/checkoutSlice'
import { fetchProfile } from '../../../store/slices/profileSlice'
import { useToast } from '../../../contexts/ToastContext'
import styles from './newAddress.module.css'

export default function NewAddress({ onCancel, onSave }) {
  const dispatch = useDispatch()
  const { show } = useToast()
  const { user } = useSelector(state => state.profile)
  const {
    countries: apiCountries,
    loadingCountries,
    cities: apiCities,
    loadingCities,
    zones: apiZones,
    loadingZones
  } = useSelector(state => state.checkout)
  
  const [addressType, setAddressType] = useState('home')
  const [customLabel, setCustomLabel] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    postalCode: '',
    latitude: null,
    longitude: null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [addressFieldErrors, setAddressFieldErrors] = useState({})
  const addressLine1AutocompleteRef = useRef(null)
  const autocompleteInstanceRef = useRef(null)
  const citiesZonesRef = useRef({ cities: [], zones: [] })

  const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY || 'AIzaSyDdZ_Y4ANv6qnyWeBebbWA6YoKqMd-o-4Y'

  // Map country names to ISO country codes for Google Places API
  const getCountryCode = (countryName) => {
    const countryCodeMap = {
      'United Arab Emirates': 'ae',
      'UAE': 'ae',
      'United States': 'us',
      'USA': 'us',
      'United Kingdom': 'gb',
      'UK': 'gb',
      'India': 'in',
      'Saudi Arabia': 'sa',
      'Kuwait': 'kw',
      'Qatar': 'qa',
      'Oman': 'om',
      'Bahrain': 'bh'
    }
    return countryCodeMap[countryName] || countryName?.toLowerCase().slice(0, 2) || null
  }

  // Load Google Maps API with Places library - optimized version
  const loadGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      // Check if Google Maps is already loaded
      if (window.google && window.google.maps && window.google.maps.places) {
        resolve()
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript) {
        // Use event listener instead of polling for better performance
        const checkLoaded = () => {
          if (window.google && window.google.maps && window.google.maps.places) {
            resolve()
          } else {
            // Fallback: check after a short delay if event didn't fire
            setTimeout(() => {
              if (window.google && window.google.maps && window.google.maps.places) {
                resolve()
              }
            }, 50)
          }
        }
        existingScript.addEventListener('load', checkLoaded)
        // Also check immediately in case it's already loaded
        checkLoaded()
        return
      }

      // Load Google Maps script
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`
      script.async = true
      script.defer = true
      script.onload = () => {
        resolve()
      }
      script.onerror = () => {
        console.error('Failed to load Google Maps')
        reject(new Error('Failed to load Google Maps'))
      }
      document.head.appendChild(script)
    })
  }

  // Populate form with user data from aggregate API
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || '',
        phone: user.phone || '',
        email: user.email || ''
      }))
    }
  }, [user])
  
  // Fetch countries on mount
  useEffect(() => {
    dispatch(fetchCountries())
  }, [dispatch])

  // Fetch cities when country is selected
  useEffect(() => {
    if (selectedCountry) {
      dispatch(fetchCitiesByCountry(selectedCountry))
      setSelectedCity('') // Reset city when country changes
      setSelectedState('') // Reset zone when country changes
    }
  }, [selectedCountry, dispatch])

  // Fetch zones when city is selected
  useEffect(() => {
    if (selectedCity) {
      dispatch(fetchZonesByCity(selectedCity))
      setSelectedState('') // Reset zone when city changes
    }
  }, [selectedCity, dispatch])
  
  // Use API countries (convert array of strings to array of objects for compatibility)
  const countries = (apiCountries || []).map(countryName => ({ name: countryName, isoCode: countryName }))
  
  // Use API cities (convert array of strings to array of objects for compatibility)
  const cities = (apiCities || []).map(cityName => ({ name: cityName }))
  
  // Use API zones (include charge so we can save it in payload)
  const zones = (apiZones || []).map(zone => ({
    name: zone.zoneName,
    id: zone.id,
    charge: zone.charge
  }))

  // Keep refs updated with latest cities and zones for use in autocomplete handler
  useEffect(() => {
    citiesZonesRef.current = { cities, zones }
  }, [cities, zones])
  
  // Check if we should show zones dropdown (when city is selected)
  const shouldShowZonesDropdown = selectedCity && zones.length > 0

  // Initialize Google Maps API and Places Autocomplete - runs once on mount
  useEffect(() => {
    let isMounted = true
    let observer = null

    const initializeAutocomplete = async (retryCount = 0) => {
      const maxRetries = 5
      // Only initialize if API key is available
      if (!GOOGLE_API_KEY) {
        return
      }

      try {
        // Load Google Maps API if not already loaded
        if (!googleMapsLoaded) {
          await loadGoogleMaps()
          if (!isMounted) return
          setGoogleMapsLoaded(true)
        }

        // Verify Google Maps is loaded
        if (!window.google || !window.google.maps || !window.google.maps.places) {
          return
        }

        // Get the input element (may not exist yet if tab just mounted)
        const addressInput = document.getElementById('new-address-line-1-autocomplete')
        if (!addressInput) {
          if (retryCount < maxRetries && isMounted) {
            setTimeout(() => initializeAutocomplete(retryCount + 1), 150 * (retryCount + 1))
          }
          return
        }

        // Don't reinitialize if already exists
        if (autocompleteInstanceRef.current) {
          return
        }

        // Clean up any existing pac-containers
        const existingPacContainers = document.querySelectorAll('.pac-container')
        existingPacContainers.forEach(container => container.remove())

        // Prepare autocomplete options
        const autocompleteOptions = {
          types: ['geocode'],
          fields: ['address_components', 'formatted_address', 'geometry', 'name', 'types']
        }

        // Add country restriction if country is selected
        if (selectedCountry) {
          const countryCode = getCountryCode(selectedCountry)
          if (countryCode) {
            autocompleteOptions.componentRestrictions = { country: countryCode }
          }
        }

        // Create autocomplete instance
        const autocomplete = new window.google.maps.places.Autocomplete(addressInput, autocompleteOptions)
        autocompleteInstanceRef.current = autocomplete

        // Optimized styling function - only style when needed
        const styleAutocompleteDropdown = () => {
          const pacContainer = document.querySelector('.pac-container')
          if (pacContainer) {
            pacContainer.style.zIndex = '10000'
            pacContainer.style.borderRadius = '8px'
            pacContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            pacContainer.style.marginTop = '4px'
            pacContainer.style.maxHeight = '300px'
            pacContainer.style.overflowY = 'auto'
          }
        }

        // Use a more efficient MutationObserver - only watch for pac-container additions
        observer = new MutationObserver((mutations) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) {
                if (node.classList?.contains('pac-container')) {
                  styleAutocompleteDropdown()
                  break
                } else if (node.querySelector?.('.pac-container')) {
                  styleAutocompleteDropdown()
                  break
                }
              }
            }
          }
        })
        
        // Only observe the input's parent container, not the entire body
        const inputContainer = addressInput.closest('div') || document.body
        observer.observe(inputContainer, {
          childList: true,
          subtree: true
        })

        // Store observer for cleanup
        autocomplete._observer = observer

        // Style dropdown when it opens (debounced)
        let styleTimeout = null
        const debouncedStyle = () => {
          clearTimeout(styleTimeout)
          styleTimeout = setTimeout(styleAutocompleteDropdown, 10)
        }

        addressInput.addEventListener('focus', debouncedStyle)
        addressInput.addEventListener('input', debouncedStyle)

        // Handle place selection - always update displayed address (even when geometry is missing)
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()

          // Extract address components (always do this so we can display address)
          const addressComponents = place.address_components || []
          let streetNumber = ''
          let route = ''
          let city = ''
          let state = ''
          let postalCode = ''
          let country = ''

          addressComponents.forEach(component => {
            const types = component.types
            if (types.includes('street_number')) {
              streetNumber = component.long_name
            } else if (types.includes('route')) {
              route = component.long_name
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              city = component.long_name
            } else if (types.includes('administrative_area_level_1')) {
              state = component.long_name
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name
            } else if (types.includes('country')) {
              country = component.long_name
            }
          })

          // Use place name for establishments, otherwise use formatted address (always show something)
          const addressLine1 = place.name && place.types?.includes('establishment')
            ? `${place.name}, ${place.formatted_address || ''}`
            : (place.formatted_address || [streetNumber, route].filter(Boolean).join(' ') || place.name || addressInput?.value || '')

          // Get latitude and longitude only when geometry is present
          const hasGeometry = place.geometry && place.geometry.location
          const latitude = hasGeometry ? place.geometry.location.lat() : null
          const longitude = hasGeometry ? place.geometry.location.lng() : null

          console.log('📍 Extracted address components:', { city, state, country, postalCode })

          // Always update form so the address displays; include lat/long only when available
          setFormData(prev => ({
            ...prev,
            addressLine1: addressLine1,
            ...(postalCode && { postalCode: postalCode }),
            ...(latitude != null && { latitude }),
            ...(longitude != null && { longitude })
          }))

          // Step 1: Auto-fill country if found
          if (country) {
            const currentCountries = apiCountries || []
            // Try exact match first
            let countryMatch = currentCountries.find(c => c.toLowerCase() === country.toLowerCase())
            // If no exact match, try partial match (e.g., "United Arab Emirates" matches "UAE")
            if (!countryMatch) {
              countryMatch = currentCountries.find(c => {
                const cLower = c.toLowerCase()
                const countryLower = country.toLowerCase()
                return cLower.includes(countryLower) || countryLower.includes(cLower) ||
                       (country === 'UAE' && cLower.includes('united arab')) ||
                       (country === 'United Arab Emirates' && cLower.includes('uae'))
              })
            }
            
            if (countryMatch) {
              console.log('✅ Auto-filling country:', countryMatch)
              setSelectedCountry(countryMatch)
              
              // Step 2: After country is set, wait for cities to load, then auto-fill city
              // Store the city value to match later
              const cityToMatch = city
              const stateToMatch = state
              
              // Function to try matching city after cities are loaded
              const tryMatchCity = (attempt = 0) => {
                if (attempt > 10) return // Max 10 attempts (3 seconds)
                
                const currentCities = apiCities || []
                if (currentCities.length > 0 && cityToMatch) {
                  // Cities are loaded, try to match
                  const cityMatch = currentCities.find(c => {
                    const cName = typeof c === 'string' ? c : c
                    return cName.toLowerCase() === cityToMatch.toLowerCase() ||
                           cName.toLowerCase().includes(cityToMatch.toLowerCase()) ||
                           cityToMatch.toLowerCase().includes(cName.toLowerCase())
                  })
                  
                  if (cityMatch) {
                    const cityName = typeof cityMatch === 'string' ? cityMatch : cityMatch
                    console.log('✅ Auto-filling city:', cityName)
                    setSelectedCity(cityName)
                    
                    // Step 3: After city is set, wait for zones to load, then auto-fill zone/state
                    const tryMatchZone = (zoneAttempt = 0) => {
                      if (zoneAttempt > 10) return // Max 10 attempts
                      
                      const currentZones = apiZones || []
                      if (currentZones.length > 0 && stateToMatch) {
                        const zoneMatch = currentZones.find(z => {
                          const zName = typeof z === 'string' ? z : (z.zoneName || z.name)
                          return zName.toLowerCase() === stateToMatch.toLowerCase() ||
                                 zName.toLowerCase().includes(stateToMatch.toLowerCase()) ||
                                 stateToMatch.toLowerCase().includes(zName.toLowerCase())
                        })
                        
                        if (zoneMatch) {
                          const zoneName = typeof zoneMatch === 'string' ? zoneMatch : (zoneMatch.zoneName || zoneMatch.name)
                          console.log('✅ Auto-filling zone/state:', zoneName)
                          setSelectedState(zoneName)
                        }
                      } else {
                        // Zones not loaded yet, try again
                        setTimeout(() => tryMatchZone(zoneAttempt + 1), 300)
                      }
                    }
                    
                    // Start trying to match zone
                    tryMatchZone()
                  } else {
                    // City not found, try again after a delay
                    setTimeout(() => tryMatchCity(attempt + 1), 300)
                  }
                } else {
                  // Cities not loaded yet, try again
                  setTimeout(() => tryMatchCity(attempt + 1), 300)
                }
              }
              
              // Start trying to match city after a short delay
              setTimeout(() => tryMatchCity(), 300)
            } else {
              console.warn('⚠️ Country not found in list:', country, 'Available:', currentCountries)
            }
          }
        })
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error)
      }
    }

    // Initialize with minimal delay
    const timeoutId = setTimeout(() => {
      initializeAutocomplete()
    }, 0)

    // Cleanup function - only runs on unmount
    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      if (autocompleteInstanceRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteInstanceRef.current)
        // Disconnect observer if it exists
        if (autocompleteInstanceRef.current._observer) {
          autocompleteInstanceRef.current._observer.disconnect()
        }
        autocompleteInstanceRef.current = null
      }
      // Clean up observer if it exists
      if (observer) {
        observer.disconnect()
      }
    }
  }, [GOOGLE_API_KEY, googleMapsLoaded]) // Only depend on API key and loaded state

  // Update country restrictions when country changes - separate effect for better performance
  useEffect(() => {
    if (autocompleteInstanceRef.current && window.google?.maps?.places) {
      if (selectedCountry) {
        const countryCode = getCountryCode(selectedCountry)
        if (countryCode) {
          autocompleteInstanceRef.current.setComponentRestrictions({ country: countryCode })
        } else {
          autocompleteInstanceRef.current.setComponentRestrictions({})
        }
      } else {
        autocompleteInstanceRef.current.setComponentRestrictions({})
      }
    }
  }, [selectedCountry])

  const handleTypeChange = (type) => {
    setAddressType(type)
    setCustomLabel('')
  }

  const handleCustomLabelChange = (e) => {
    const value = e.target.value
    setCustomLabel(value)
    if (value) {
      setAddressType('custom')
    } else {
      // If custom label is cleared, revert to 'home'
      setAddressType('home')
    }
  }

  // Get the display value for the label input
  const getLabelValue = () => {
    if (customLabel) return customLabel
    if (addressType === 'home') return 'Home'
    if (addressType === 'work') return 'Work'
    if (addressType === 'other') return 'Other'
    return ''
  }

  const handleCountryChange = (e) => {
    const countryName = e.target.value
    setSelectedCountry(countryName)
    setSelectedCity('') // Reset city when country changes
    setSelectedState('') // Reset zone when country changes
  }

  const handleCityChange = (e) => {
    const cityName = e.target.value
    setSelectedCity(cityName)
    setSelectedState('') // Reset zone when city changes
  }

  const handleZoneChange = (e) => {
    const zoneName = e.target.value
    setSelectedState(zoneName)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate all required fields and set error states
    const errors = {}
    
    if (!formData.fullName || formData.fullName.trim() === '') {
      errors.fullName = true
    }
    if (!formData.phone || formData.phone.trim() === '') {
      errors.phone = true
    }
    if (!formData.email || formData.email.trim() === '') {
      errors.email = true
    }
    if (!selectedCountry) {
      errors.country = true
    }
    if (!selectedCity) {
      errors.city = true
    }
    if (!selectedState) {
      errors.state = true
    }
    if (!formData.postalCode || formData.postalCode.trim() === '') {
      errors.postalCode = true
    }
    if (!formData.addressLine1 || formData.addressLine1.trim() === '') {
      errors.addressLine1 = true
    }
    
    // If there are errors, mark ALL required fields as having errors (turn all red)
    if (Object.keys(errors).length > 0) {
      // Set all required fields to show error state
      setAddressFieldErrors({
        fullName: !formData.fullName || formData.fullName.trim() === '',
        phone: !formData.phone || formData.phone.trim() === '',
        email: !formData.email || formData.email.trim() === '',
        country: !selectedCountry,
        city: !selectedCity,
        state: !selectedState,
        postalCode: !formData.postalCode || formData.postalCode.trim() === '',
        addressLine1: !formData.addressLine1 || formData.addressLine1.trim() === ''
      })
      show('Please fill in all required fields', 'error')
      return
    }
    
    // Clear errors if validation passes
    setAddressFieldErrors({})
    
    setIsSubmitting(true)

    try {
      // Prepare address data matching checkout format
      // IMPORTANT: Use selectedCity and selectedState directly to avoid any swap issues
      // Explicitly build addressData to ensure city and state are NOT swapped
      const selectedZone = zones.find(zone => zone.name === selectedState)

      const addressData = {
        type: addressType,
        fullName: formData.fullName || '',
        phone: formData.phone || '',
        email: formData.email || '',
        addressLine1: formData.addressLine1 || '',
        addressLine2: formData.addressLine2 || '',
        // IMPORTANT: API expects swapped values - selectedState goes to city field, selectedCity goes to state field
        city: selectedState, // API city field gets the zone/state dropdown value
        state: selectedCity, // API state field gets the city dropdown value
        zoneId: selectedZone?.id || null,
        zoneName: selectedState || null,
        country: selectedCountry,
        postalCode: formData.postalCode || '',
        landmark: formData.landmark || '',
        instructions: '',
        isDefault: false
      }
      
      // Debug log to verify city and state are correct before submission
      console.log('📍 [ADDRESS SUBMISSION] City/State values (SWAPPED for API):', {
        selectedCity: selectedCity,
        selectedState: selectedState,
        apiCity: addressData.city, // This is selectedState (zone)
        apiState: addressData.state, // This is selectedCity (city)
        note: 'API expects: city=zone, state=city'
      })
      
      // FINAL SAFEGUARD: Explicitly ensure city and state are swapped for API
      // API expects: city field = zone/state dropdown value, state field = city dropdown value
      addressData.city = selectedState
      addressData.state = selectedCity
      
      console.log('📍 [ADDRESS SUBMISSION] City/State values AFTER final fix:', {
        selectedCity: selectedCity,
        selectedState: selectedState,
        addressDataCity: addressData.city,
        addressDataState: addressData.state
      })

      // Use coordinates from autocomplete if available, otherwise geocode
      if (formData.latitude && formData.longitude) {
        addressData.latitude = formData.latitude
        addressData.longitude = formData.longitude
        console.log('✅ Saving address with coordinates from autocomplete:', { 
          latitude: formData.latitude, 
          longitude: formData.longitude 
        })
      } else {
        // Get coordinates from address using Google Geocoding API as fallback
      try {
        const addressString = [
          addressData.addressLine1,
          addressData.addressLine2,
          addressData.city,
          addressData.state,
          addressData.postalCode,
          addressData.country
        ].filter(Boolean).join(', ')
        
          if (addressString && GOOGLE_API_KEY) {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${GOOGLE_API_KEY}`
          )
          
          const data = await response.json()
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location
            if (location && location.lat && location.lng) {
              addressData.latitude = location.lat
              addressData.longitude = location.lng
            }
          }
        }
      } catch (error) {
        console.error('Error getting coordinates:', error)
        // Continue without coordinates - address will be saved without lat/long
        }
      }

      console.log('📤 [FINAL PAYLOAD] Sending address data to API:', JSON.stringify(addressData, null, 2))
      const result = await dispatch(createAddress(addressData))
      
      if (createAddress.fulfilled.match(result)) {
        setAddressFieldErrors({}) // Clear all field errors on success
        show('Address added successfully')
        // Refresh profile to get updated addresses
        await dispatch(fetchProfile())
        // Call onSave callback if provided
        if (onSave) onSave()
      } else {
        show('Failed to add address', 'error')
      }
    } catch (error) {
      show(error.message || 'Failed to add address', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.newAddressContainer}>
      <h3 className={styles.title}>ADD NEW ADDRESS</h3>
      {/* <p className={styles.subtitle}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero
        et velit interdum, ac aliquet odio mattis.
      </p> */}
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <div className={styles.labelRow}>
          <button 
            type="button" 
            className={`${styles.iconBtn} ${addressType === 'home' ? styles.active : ''}`}
            onClick={() => handleTypeChange('home')}
            title="Home"
          >
            <FontAwesomeIcon icon={faHome} />
          </button>
          <button 
            type="button" 
            className={`${styles.iconBtn} ${addressType === 'work' ? styles.active : ''}`}
            onClick={() => handleTypeChange('work')}
            title="Work"
          >
            <FontAwesomeIcon icon={faBriefcase} />
          </button>
          <button 
            type="button" 
            className={`${styles.iconBtn} ${addressType === 'other' ? styles.active : ''}`}
            onClick={() => handleTypeChange('other')}
            title="Other"
          >
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </button>
          <input 
            className={styles.labelInput} 
            placeholder="Custom Label" 
            value={getLabelValue()}
            onChange={handleCustomLabelChange}
          />
        </div>
        <div className={styles.gridRow}>
          <select 
            className={`${styles.input} ${addressFieldErrors.country ? styles.inputError : ''}`}
            value={selectedCountry}
            onChange={(e) => {
              handleCountryChange(e)
              if (addressFieldErrors.country) {
                setAddressFieldErrors(prev => ({ ...prev, country: false }))
              }
            }}
            required
            disabled={loadingCountries}
          >
            <option value="">{loadingCountries ? 'Loading...' : 'Select Country'}</option>
            {countries.map((country) => (
              <option key={country.isoCode} value={country.name}>
                {country.name}
              </option>
            ))}
          </select>
          <select 
            className={`${styles.input} ${addressFieldErrors.city ? styles.inputError : ''}`}
            value={selectedCity}
            onChange={(e) => {
              handleCityChange(e)
              if (addressFieldErrors.city) {
                setAddressFieldErrors(prev => ({ ...prev, city: false }))
              }
            }}
            disabled={!selectedCountry || loadingCities}
            required
          >
            <option value="">{loadingCities ? 'Loading...' : selectedCountry ? 'Select City' : 'Select Country First'}</option>
            {cities.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.gridRow}>
          <select 
            className={`${styles.input} ${addressFieldErrors.state ? styles.inputError : ''}`}
            value={selectedState}
            onChange={(e) => {
              handleZoneChange(e)
              if (addressFieldErrors.state) {
                setAddressFieldErrors(prev => ({ ...prev, state: false }))
              }
            }}
            disabled={!selectedCity || loadingZones}
            required
          >
            <option value="">{loadingZones ? 'Loading...' : selectedCity ? 'Select Area' : 'Select City First'}</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.name}>
                {zone.name}
              </option>
            ))}
            <option value="Other">Other</option>
          </select>
        </div>
        <div className={styles.fullRow}>
          <input 
            id="new-address-line-1-autocomplete"
            ref={addressLine1AutocompleteRef}
            className={`${styles.input} ${addressFieldErrors.addressLine1 ? styles.inputError : ''}`}
            name="addressLine1"
            value={formData.addressLine1}
            onChange={(e) => {
              handleInputChange(e)
              if (addressFieldErrors.addressLine1) {
                setAddressFieldErrors(prev => ({ ...prev, addressLine1: false }))
              }
            }}
            placeholder="Search Address (e.g., Latifa Tower)" 
            required
            autoComplete="off"
          />
        </div>
        <div className={styles.fullRow}>
          <input 
            className={styles.input} 
            name="addressLine2"
            value={formData.addressLine2}
            onChange={handleInputChange}
            placeholder="Address Line 2 (Flat Number, Building Number)" 
          />
        </div>
        <div className={styles.gridRow}>
          <input 
            className={`${styles.input} ${addressFieldErrors.postalCode ? styles.inputError : ''}`}
            name="postalCode"
            value={formData.postalCode}
            onChange={(e) => {
              handleInputChange(e)
              if (addressFieldErrors.postalCode) {
                setAddressFieldErrors(prev => ({ ...prev, postalCode: false }))
              }
            }}
            placeholder="Postal Code" 
            required
          />
          <input 
            className={styles.input} 
            name="landmark"
            value={formData.landmark}
            onChange={handleInputChange}
            placeholder="Landmark (Optional)" 
          />
        </div>
        <div className={styles.gridRow}>
          <input 
            className={`${styles.input} ${addressFieldErrors.fullName ? styles.inputError : ''}`}
            name="fullName"
            value={formData.fullName}
            onChange={(e) => {
              handleInputChange(e)
              if (addressFieldErrors.fullName) {
                setAddressFieldErrors(prev => ({ ...prev, fullName: false }))
              }
            }}
            placeholder="Full Name" 
            required
          />
          <input 
            className={`${styles.input} ${addressFieldErrors.phone ? styles.inputError : ''}`}
            name="phone"
            value={formData.phone}
            onChange={(e) => {
              handleInputChange(e)
              if (addressFieldErrors.phone) {
                setAddressFieldErrors(prev => ({ ...prev, phone: false }))
              }
            }}
            placeholder="Phone" 
            required
          />
        </div>
        <div className={styles.gridRow}>
          <input 
            className={`${styles.input} ${addressFieldErrors.email ? styles.inputError : ''}`}
            name="email"
            type="email"
            value={formData.email}
            onChange={(e) => {
              handleInputChange(e)
              if (addressFieldErrors.email) {
                setAddressFieldErrors(prev => ({ ...prev, email: false }))
              }
            }}
            placeholder="Email" 
            required
          />
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className={styles.saveBtn} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
