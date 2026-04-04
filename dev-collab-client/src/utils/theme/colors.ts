export const MANTINE_COLORS = [
    "blue", "cyan", "grape", "indigo", "lime", "orange", "pink", "red", "teal", "violet", "yellow"
];

/**
 * Generates a consistent Mantine color for a given string using a simple hash.
 */
export const getColorForString = (str: string) => {
    if (!str) return "gray";
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % MANTINE_COLORS.length;
    return MANTINE_COLORS[index];
};
