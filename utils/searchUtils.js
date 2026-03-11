/**
 * Utility functions for search functionality
 * - Extract product types/variants from products
 * - Fuzzy search for handling misspellings
 */

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length
  const n = str2.length
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity score between two strings (0-1)
 */
export function calculateSimilarity(str1, str2) {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase())
  return 1 - (distance / maxLength)
}

/**
 * Extract product type/variant string from a product
 * Examples: "dumbbells 5kg", "dumbbells 7.5kg"
 * Removes descriptive words and keeps only base product name + weight/variant
 */
export function extractProductType(product) {
  if (!product) return null

  const title = product.title || ''
  if (!title) return null
  
  // Words to remove (descriptive/marketing words)
  const wordsToRemove = [
    'neoprene', 'coated', 'set', 'color', 'coded', 'pair', 'pairs', '2x', '2 x',
    'professional', 'premium', 'heavy', 'duty', 'adjustable', 'rubber',
    'hex', 'round', 'pro', 'elite', 'classic', 'modern', 'vintage',
    'with', 'and', 'the', 'a', 'an', 'for', 'of', 'in', 'on', 'at',
    'by', 'to', 'from', 'as', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'cannot', '-', '–', '—'
  ]
  
  // Extract weight from title (patterns like "7.5kg", "2x7.5kg", "5 kg", etc.)
  let extractedWeight = null
  let cleanedTitle = title
  
  // Pattern to match weights: "2x7.5kg", "2 x 7.5kg", "7.5kg", "7.5 kg", etc.
  // First try to match patterns with "x" (like "2x7.5kg")
  const multiWeightPattern = /(\d+\.?\d*)\s*x\s*(\d+\.?\d*)\s*kg/gi
  const multiMatch = title.match(multiWeightPattern)
  
  if (multiMatch && multiMatch.length > 0) {
    // Extract the actual weight (second number in "2x7.5kg")
    const numbers = multiMatch[0].match(/\d+\.?\d*/g)
    if (numbers && numbers.length >= 2) {
      // Take the last number (the actual weight per unit)
      extractedWeight = `${numbers[numbers.length - 1]}kg`
      // Remove the pattern from title
      cleanedTitle = cleanedTitle.replace(multiWeightPattern, '').trim()
    }
  } else {
    // Try simple weight pattern: "7.5kg", "5 kg", etc.
    const simpleWeightPattern = /(\d+\.?\d*)\s*kg/gi
    const simpleMatch = title.match(simpleWeightPattern)
    if (simpleMatch && simpleMatch.length > 0) {
      extractedWeight = simpleMatch[0].trim()
      // Remove the pattern from title
      cleanedTitle = cleanedTitle.replace(simpleWeightPattern, '').trim()
    }
  }
  
  // Also check product fields for weight
  if (!extractedWeight) {
    // Check variant_attributes first (most specific)
    if (product.variant_attributes && typeof product.variant_attributes === 'object') {
      Object.entries(product.variant_attributes).forEach(([key, value]) => {
        if (value && key.toLowerCase().includes('weight')) {
          const weightValue = String(value).trim()
          extractedWeight = weightValue.includes('kg') ? weightValue : `${weightValue}kg`
        }
      })
    }
    
    // Check attributes
    if (!extractedWeight && product.attributes && typeof product.attributes === 'object') {
      if (product.attributes.weight) {
        const weightValue = String(product.attributes.weight).trim()
        extractedWeight = weightValue.includes('kg') ? weightValue : `${weightValue}kg`
      }
    }
    
    // Check specifications
    if (!extractedWeight && product.specifications && typeof product.specifications === 'object') {
      Object.keys(product.specifications).forEach(key => {
        if (key.toLowerCase().includes('weight') && !extractedWeight) {
          const weightValue = String(product.specifications[key]).trim()
          extractedWeight = weightValue.includes('kg') ? weightValue : `${weightValue}kg`
        }
      })
    }
    
    // Check weight field directly
    if (!extractedWeight && product.weight) {
      const weightValue = String(product.weight).trim()
      extractedWeight = weightValue.includes('kg') ? weightValue : `${weightValue}kg`
    }
  }
  
  // Extract base product name (remove descriptive words and clean up)
  // First, remove common prefixes and suffixes
  cleanedTitle = cleanedTitle
    .replace(/^neoprene\s+/i, '')
    .replace(/coated\s+/gi, '')
    .replace(/\s+set\s*/gi, ' ')
    .replace(/color\s*coded/gi, '')
    .replace(/[-–—]/g, ' ')
    .trim()
  
  const titleWords = cleanedTitle
    .split(/\s+/)
    .map(word => word.replace(/[^\w]/g, '')) // Remove punctuation
    .filter(word => {
      const lowerWord = word.toLowerCase()
      // Remove empty, numbers, and descriptive words
      return word.length > 0 && 
             !/^\d+$/.test(word) && // Not just numbers
             !wordsToRemove.includes(lowerWord) &&
             word.length > 2 // At least 3 characters
    })
  
  // Find the main product noun (common product keywords)
  const productKeywords = [
    'dumbbell', 'dumbbells', 'barbell', 'barbells', 'kettlebell', 'kettlebells',
    'weight', 'weights', 'plate', 'plates', 'bar', 'bars',
    'treadmill', 'treadmills', 'bike', 'bikes', 'bicycle', 'bicycles',
    'mat', 'mats', 'yoga', 'pilates', 'resistance', 'band', 'bands',
    'treadmill', 'elliptical', 'rower', 'bench', 'rack', 'cable', 'machine'
  ]
  
  let baseProductName = null
  
  // First, try to find a product keyword (check both singular and plural)
  for (const word of titleWords) {
    const lowerWord = word.toLowerCase()
    // Check if word matches or contains a product keyword
    for (const keyword of productKeywords) {
      if (lowerWord === keyword || lowerWord === keyword + 's' || keyword === lowerWord + 's') {
        baseProductName = keyword.endsWith('s') ? keyword : keyword + 's' // Prefer plural
        break
      }
      if (lowerWord.includes(keyword) || keyword.includes(lowerWord)) {
        baseProductName = keyword.endsWith('s') ? keyword : keyword + 's' // Prefer plural
        break
      }
    }
    if (baseProductName) break
  }
  
  // If no keyword found, use the longest meaningful word (likely the product name)
  if (!baseProductName && titleWords.length > 0) {
    // Sort by length and take the longest meaningful word
    const sortedWords = [...titleWords]
      .filter(w => w.length >= 4) // At least 4 characters for meaningful words
      .sort((a, b) => b.length - a.length)
    
    if (sortedWords.length > 0) {
      baseProductName = sortedWords[0].toLowerCase()
      // Make plural if it's a common product word
      if (!baseProductName.endsWith('s') && baseProductName.length > 3) {
        baseProductName = baseProductName + 's'
      }
    }
  }
  
  // Fallback: use first meaningful word
  if (!baseProductName && titleWords.length > 0) {
    baseProductName = titleWords[0].toLowerCase()
    if (!baseProductName.endsWith('s') && baseProductName.length > 3) {
      baseProductName = baseProductName + 's'
    }
  }
  
  // If still no base name, use a simplified version of the title
  if (!baseProductName) {
    const firstWord = cleanedTitle.toLowerCase().split(/\s+/)[0]
    baseProductName = firstWord ? firstWord.replace(/[^\w]/g, '') : 'product'
  }
  
  // Ensure it's lowercase and properly formatted
  baseProductName = baseProductName.toLowerCase()
  
  // Capitalize first letter
  baseProductName = baseProductName.charAt(0).toUpperCase() + baseProductName.slice(1)
  
  // Combine base product name with weight
  if (extractedWeight) {
    return `${baseProductName} ${extractedWeight}`.trim()
  }
  
  return baseProductName
}

/**
 * Extract unique product types from an array of products
 * Groups similar products and returns unique types
 */
export function extractUniqueProductTypes(products) {
  if (!Array.isArray(products) || products.length === 0) return []
  
  const typeMap = new Map()
  
  products.forEach(product => {
    const type = extractProductType(product)
    if (!type) return
    
    // Normalize the type for grouping (lowercase, remove extra spaces)
    const normalizedType = type.toLowerCase().trim().replace(/\s+/g, ' ')
    
    if (!typeMap.has(normalizedType)) {
      typeMap.set(normalizedType, {
        displayName: type, // Keep original casing for display
        count: 0,
        products: []
      })
    }
    
    const entry = typeMap.get(normalizedType)
    entry.count++
    entry.products.push(product)
  })
  
  // Convert to array and sort by count (most common first)
  return Array.from(typeMap.values())
    .sort((a, b) => b.count - a.count)
    .map(entry => ({
      name: entry.displayName,
      count: entry.count,
      products: entry.products
    }))
}

/**
 * Fuzzy search function that handles misspellings
 * Returns products/types that match the query with a similarity threshold
 */
export function fuzzySearch(items, query, options = {}) {
  if (!query || !query.trim()) return items
  
  const {
    threshold = 0.6, // Minimum similarity score (0-1)
    maxResults = 10,
    field = 'name' // Field to search in
  } = options
  
  const normalizedQuery = query.toLowerCase().trim()
  const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0)
  
  const results = items.map(item => {
    const searchText = typeof item === 'string' 
      ? item 
      : (item[field] || item.title || item.name || '')
    
    if (!searchText) return { item, score: 0 }
    
    const normalizedText = searchText.toLowerCase()
    
    // Calculate similarity scores
    let maxScore = 0
    
    // Check if query words appear in the text (exact match gets higher score)
    const allWordsMatch = queryWords.every(word => normalizedText.includes(word))
    if (allWordsMatch) {
      maxScore = Math.max(maxScore, 0.9)
    }
    
    // Check individual word matches
    queryWords.forEach(word => {
      if (normalizedText.includes(word)) {
        maxScore = Math.max(maxScore, 0.8)
      } else {
        // Fuzzy match individual words
        const words = normalizedText.split(/\s+/)
        words.forEach(textWord => {
          const similarity = calculateSimilarity(word, textWord)
          if (similarity > threshold) {
            maxScore = Math.max(maxScore, similarity * 0.7)
          }
        })
      }
    })
    
    // Overall string similarity
    const overallSimilarity = calculateSimilarity(normalizedQuery, normalizedText)
    maxScore = Math.max(maxScore, overallSimilarity)
    
    return { item, score: maxScore }
  })
  
  // Filter by threshold and sort by score
  return results
    .filter(result => result.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
    .map(result => result.item)
}

/**
 * Search product types with fuzzy matching
 */
export function searchProductTypes(products, query) {
  // First extract unique types
  const types = extractUniqueProductTypes(products)
  
  // Then apply fuzzy search
  return fuzzySearch(types, query, {
    threshold: 0.5, // Lower threshold for better results
    maxResults: 10,
    field: 'name'
  })
}
