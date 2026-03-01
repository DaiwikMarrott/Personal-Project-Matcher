/**
 * Modern Pastel Green Color Theme
 * Minimalistic and calming color palette for Project Jekyll & Hyde
 */

export const Colors = {
  // Primary greens
  primary: '#7EC8A3',        // Soft pastel green
  primaryLight: '#A8DDB5',   // Light pastel green
  primaryDark: '#5BA37D',    // Darker shade for contrast
  
  // Background colors
  background: '#F5F9F7',     // Very light mint background
  surface: '#FFFFFF',        // Pure white for cards
  surfaceLight: '#FAFDFB',   // Slight green tint
  
  // Accent colors
  accent: '#6DBEA0',         // Vibrant green for CTAs
  accentLight: '#B8E6D5',    // Light green for highlights
  success: '#7EC8A3',        // Success states
  warning: '#FFD88D',        // Warnings (soft yellow)
  error: '#FF9B9B',          // Errors (soft red)
  info: '#A8D8F0',           // Info (soft blue)
  
  // Text colors
  text: {
    primary: '#2A4D3E',      // Dark green for primary text
    secondary: '#5A7869',    // Medium green for secondary text
    tertiary: '#8BA599',     // Light green for tertiary text
    disabled: '#B8C9C0',     // Disabled state
    inverse: '#FFFFFF',      // White text on dark backgrounds
  },
  
  // Border colors
  border: {
    light: '#E1EFE8',        // Light border
    medium: '#C5DED2',       // Medium border
    dark: '#A8C9BA',         // Dark border
  },
  
  // Shadow
  shadow: 'rgba(126, 200, 163, 0.15)', // Soft green shadow
  
  // Gradients
  gradient: {
    primary: ['#7EC8A3', '#A8DDB5'],
    accent: ['#6DBEA0', '#7EC8A3'],
    background: ['#F5F9F7', '#FAFDFB'],
  },
  
  // Status colors
  status: {
    open: '#7EC8A3',         // Open projects
    inProgress: '#A8D8F0',   // In progress
    completed: '#B8C9C0',    // Completed
    closed: '#8BA599',       // Closed
  },
  
  // Semantic colors
  semantic: {
    beginner: '#B8E6D5',
    intermediate: '#7EC8A3',
    advanced: '#5BA37D',
    expert: '#2A4D3E',
  },
};

export default Colors;
