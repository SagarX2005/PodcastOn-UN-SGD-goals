// utils/thumbnailMapping.js

// Import only available thumbnails
const thumbnails = {
  // Storytelling style for all religions
  'christianity-storytelling': require('../assets/thumbnails/christianity-storytelling.jpg'),
  'islam-storytelling': require('../assets/thumbnails/islam-storytelling.jpg'),
  'hinduism-storytelling': require('../assets/thumbnails/hinduism-storytelling.jpg'),
  'buddhism-storytelling': require('../assets/thumbnails/buddhism-storytelling.jpg'),
  'sikhism-storytelling': require('../assets/thumbnails/sikhism-storytelling.jpg'),
  'judaism-storytelling': require('../assets/thumbnails/judaism-storytelling.jpg'),
  'none-storytelling': require('../assets/thumbnails/none-storytelling.jpg'),
  
  // Educational style for all religions
  'christianity-educational': require('../assets/thumbnails/christianity-educational.jpg'),
  'islam-educational': require('../assets/thumbnails/islam-educational.jpg'),
  'hinduism-educational': require('../assets/thumbnails/hinduism-educational.jpg'),
  'buddhism-educational': require('../assets/thumbnails/buddhism-educational.jpg'),
  'sikhism-educational': require('../assets/thumbnails/sikhism-educational.jpg'),
  'judaism-educational': require('../assets/thumbnails/judaism-educational.jpg'),
  'none-educational': require('../assets/thumbnails/none-educational.jpg'),

  // Conversational style for all religions
'christianity-conversational': require('../assets/thumbnails/christianity-conversational.jpg'),
'islam-conversational': require('../assets/thumbnails/islam-conversational.jpg'),
'hinduism-conversational': require('../assets/thumbnails/hinduism-conversational.jpg'),
'buddhism-conversational': require('../assets/thumbnails/buddhism-conversational.jpg'),
'sikhism-conversational': require('../assets/thumbnails/sikhism-conversational.jpg'),
'judaism-conversational': require('../assets/thumbnails/judaism-conversational.jpg'),
'none-conversational': require('../assets/thumbnails/none-conversational.jpg'),

// Humorous style for all religions
'christianity-humorous': require('../assets/thumbnails/christianity-humorous.jpg'),
'islam-humorous': require('../assets/thumbnails/islam-humorous.jpg'),
'hinduism-humorous': require('../assets/thumbnails/hinduism-humorous.jpg'),
'buddhism-humorous': require('../assets/thumbnails/buddhism-humorous.jpg'),
'sikhism-humorous': require('../assets/thumbnails/sikhism-humorous.jpg'),
'judaism-humorous': require('../assets/thumbnails/judaism-humorous.jpg'),
'none-humorous': require('../assets/thumbnails/none-humorous.jpg'),

// Spiritual style for all religions
'christianity-spiritual': require('../assets/thumbnails/christianity-spiritual.jpg'),
'islam-spiritual': require('../assets/thumbnails/islam-spiritual.jpg'),
'hinduism-spiritual': require('../assets/thumbnails/hinduism-spiritual.jpg'),
'buddhism-spiritual': require('../assets/thumbnails/buddhism-spiritual.jpg'),
'sikhism-spiritual': require('../assets/thumbnails/sikhism-spiritual.jpg'),
'judaism-spiritual': require('../assets/thumbnails/judaism-spiritual.jpg'),
'none-spiritual': require('../assets/thumbnails/none-spiritual.jpg'),

// Motivational style for all religions
'christianity-motivational': require('../assets/thumbnails/christianity-motivational.jpg'),
'islam-motivational': require('../assets/thumbnails/islam-motivational.jpg'),
'hinduism-motivational': require('../assets/thumbnails/hinduism-motivational.jpg'),
'buddhism-motivational': require('../assets/thumbnails/buddhism-motivational.jpg'),
'sikhism-motivational': require('../assets/thumbnails/sikhism-motivational.jpg'),
'judaism-motivational': require('../assets/thumbnails/judaism-motivational.jpg'),
'none-motivational': require('../assets/thumbnails/none-motivational.jpg'),
  
  // Ultimate fallback
  'default': require('../assets/thumbnails/default.jpg'),
};

/**
 * Get the appropriate thumbnail for a podcast based on religion and style
 * @param {string} religion - The religion selected (Christianity, Islam, etc.)
 * @param {string} style - The podcast style (Conversational, Educational, etc.)
 * @returns {any} The required image module or default.jpg
 */
export const getThumbnailForPodcast = (religion, style) => {
  // Normalize inputs to lowercase and trim
  const normalizedReligion = religion?.toLowerCase().trim() || 'none';
  const normalizedStyle = style?.toLowerCase().trim() || 'conversational';
  
  // Create key
  const key = `${normalizedReligion}-${normalizedStyle}`;
  
  // Try to get specific thumbnail
  let thumbnail = thumbnails[key];
  
  // If not found, try religion-based fallback (any style)
  if (!thumbnail && normalizedReligion !== 'none') {
    const religionKeys = Object.keys(thumbnails).filter(k => k.startsWith(normalizedReligion + '-'));
    for (let rKey of religionKeys) {
      if (thumbnails[rKey]) {
        thumbnail = thumbnails[rKey];
        break;
      }
    }
  }
  
  // If still not found, return ultimate default
  if (!thumbnail) {
    thumbnail = thumbnails['default'];
  }
  
  return thumbnail;
};

export default thumbnails;