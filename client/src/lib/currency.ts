/**
 * Currency Formatting Utility
 * 
 * This utility provides consistent currency formatting across the application,
 * inspired by DM-Cockpit's multi-currency support.
 * 
 * Features:
 * - Automatic currency detection from project/account data
 * - Support for all major currencies
 * - Consistent formatting across all pages
 * - Fallback to INR when currency is unknown (User Preference)
 */

import type { Project } from '@/types';

/**
 * Currency symbol mapping for common currencies
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CNY: '¥',
    AUD: 'A$',
    CAD: 'C$',
    CHF: 'CHF',
    SEK: 'kr',
    NOK: 'kr',
    DKK: 'kr',
    PLN: 'zł',
    BRL: 'R$',
    MXN: 'Mex$',
    ZAR: 'R',
    AED: 'د.إ',
    SAR: '﷼',
    SGD: 'S$',
    HKD: 'HK$',
    NZD: 'NZ$',
    THB: '฿',
    MYR: 'RM',
    IDR: 'Rp',
    PHP: '₱',
    VND: '₫',
    KRW: '₩',
    TRY: '₺',
    RUB: '₽',
};

/**
 * Locale mapping for currency formatting
 */
export const CURRENCY_LOCALES: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    INR: 'en-IN',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    AUD: 'en-AU',
    CAD: 'en-CA',
    CHF: 'de-CH',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    PLN: 'pl-PL',
    BRL: 'pt-BR',
    MXN: 'es-MX',
    ZAR: 'en-ZA',
    AED: 'ar-AE',
    SAR: 'ar-SA',
    SGD: 'en-SG',
    HKD: 'zh-HK',
    NZD: 'en-NZ',
    THB: 'th-TH',
    MYR: 'ms-MY',
    IDR: 'id-ID',
    PHP: 'en-PH',
    VND: 'vi-VN',
    KRW: 'ko-KR',
    TRY: 'tr-TR',
    RUB: 'ru-RU',
};

/**
 * Get currency code from project data
 * Checks Google Ads currency first, fallback to Meta Ads, then INR
 */
export const getCurrencyFromProject = (project: Project | null, accountCurrency?: string): string => {
    if (accountCurrency) {
        return accountCurrency.toUpperCase();
    }

    if (project?.googleAdsCurrency) {
        return project.googleAdsCurrency;
    }

    if (project?.metaAdsCurrency) {
        return project.metaAdsCurrency;
    }

    // Default to INR as per user request
    return 'INR';
};

/**
 * Format currency value with proper symbol and locale
 * 
 * @param amount - The numeric amount to format
 * @param currencyCode - ISO currency code (e.g., 'USD', 'EUR', 'INR')
 * @param options - Additional formatting options
 * @returns Formatted currency string
 */
export const formatCurrency = (
    amount: number,
    currencyCode: string = 'INR',
    options?: {
        minimumFractionDigits?: number;
        maximumFractionDigits?: number;
        useSymbol?: boolean;
    }
): string => {
    const code = currencyCode.toUpperCase();
    const locale = CURRENCY_LOCALES[code] || 'en-IN';

    const formatOptions: Intl.NumberFormatOptions = {
        style: 'currency',
        currency: code,
        minimumFractionDigits: options?.minimumFractionDigits ?? 2,
        maximumFractionDigits: options?.maximumFractionDigits ?? 2,
    };

    try {
        return new Intl.NumberFormat(locale, formatOptions).format(amount);
    } catch (error) {
        // Fallback to INR if currency code is invalid
        console.warn(`Invalid currency code: ${code}, falling back to INR`);
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    }
};

/**
 * Format currency with compact notation for large numbers
 * e.g., ₹1.2K, ₹1.5M
 */
export const formatCurrencyCompact = (
    amount: number,
    currencyCode: string = 'INR'
): string => {
    const code = currencyCode.toUpperCase();
    const locale = CURRENCY_LOCALES[code] || 'en-IN';

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(amount);
    } catch (error) {
        // Fallback formatting
        const symbol = CURRENCY_SYMBOLS[code] || '₹';
        if (amount >= 1000000) return `${symbol}${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `${symbol}${(amount / 1000).toFixed(1)}K`;
        return `${symbol}${amount.toFixed(0)}`;
    }
};

/**
 * Get currency symbol for a given currency code
 */
export const getCurrencySymbol = (currencyCode: string): string => {
    return CURRENCY_SYMBOLS[currencyCode.toUpperCase()] || currencyCode;
};

/**
 * Create a currency formatter function bound to a specific currency
 * Useful for components that format multiple values with the same currency
 */
export const createCurrencyFormatter = (currencyCode: string) => {
    return (amount: number, options?: Parameters<typeof formatCurrency>[2]) => {
        return formatCurrency(amount, currencyCode, options);
    };
};
