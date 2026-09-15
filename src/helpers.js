const normalizeArabic = (value = '') =>
    String(value)
        .toLocaleLowerCase('ar')
        .normalize('NFD')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[أإآٱ]/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ه')
        .replace(/ؤ/g, 'و')
        .replace(/ئ/g, 'ي')
        .replace(/\u0640/g, '')
        .trim()

export const matches = (value, query) =>
    normalizeArabic(value).includes(normalizeArabic(query))

export function getPageNumbers(totalPages, currentPage) {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    if (currentPage <= 4) {
        return [
            1,
            2,
            3,
            4,
            "...",
            totalPages - 2,
            totalPages - 1,
            totalPages
        ];
    }

    if (currentPage >= totalPages - 3) {
        return [
            1,
            2,
            3,
            "...",
            totalPages - 3,
            totalPages - 2,
            totalPages - 1,
            totalPages
        ];
    }

    return [
        1,
        2,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages - 1,
        totalPages
    ];
}
