export const Theme = {
    // Text colors
    text: '#FFFFFF',
    textMuted: '#999999',

    // Background colors
    background: '#000000',
    backgroundPanel: '#1E1E1E', // Dark gray panel background

    // Primary/accent colors
    primary: '#0080FF', // Blue
    accent: '#00FF80', // Light green (was using this for dates)

    // Accessory colors (from List component)
    info: '#0080FF', // Blue for text accessories
    success: '#00FF80', // Green for date accessories
    warning: '#FF8000', // Orange for tag accessories
    error: '#FF0000', // Red for errors

    // Additional UI colors
    border: '#333333',
    highlight: '#0080FF',
    selected: '#0080FF',
    yellow: '#FFFF00', // Yellow for icons

    // Transparent
    transparent: undefined, // Use undefined for no background color
} as const

export default Theme
