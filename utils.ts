/**
 * Get user initials from full name
 * @param name - Full name of the user
 * @returns Initials (max 2 letters): "J" for "Jai", "JD" for "Jai Doshi"
 */
export const getUserInitials = (name: string | null | undefined): string => {
  if (!name || name.trim().length === 0) {
    return 'U';
  }
  
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: return first letter
    return words[0].charAt(0).toUpperCase();
  } else {
    // Multiple words: return first letter of first and second word (max 2 letters)
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
};

