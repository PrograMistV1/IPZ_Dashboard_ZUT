export const API_BASE_URL = "http://127.0.0.1:8000";

export const API_ENDPOINTS = {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGIN_HISTORY: "/auth/login-history",
    ACCOUNT_INFO: "/auth/me",
    RATES: "/rates",
};

export const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "CHF", "JPY", "UAH"];


export const FULL_CURRENCY_OPTIONS = [
    "THB","USD","AUD","HKD","CAD","NZD","SGD","EUR","HUF","CHF","GBP","UAH",
    "JPY","CZK","DKK","ISK","NOK","SEK","RON","BGN","TRY","ILS","CLP","PHP",
    "MXN","ZAR","BRL","MYR","IDR","INR","KRW","CNY",
];

export const CURRENCY_NAMES = {
    THB: 'Thailand',
    USD: 'United States',
    AUD: 'Australia',
    HKD: 'Hong Kong',
    CAD: 'Canada',
    NZD: 'New Zealand',
    SGD: 'Singapore',
    EUR: 'Eurozone',
    HUF: 'Hungary',
    CHF: 'Switzerland',
    GBP: 'United Kingdom',
    UAH: 'Ukraine',
    JPY: 'Japan',
    CZK: 'Czech Republic',
    DKK: 'Denmark',
    ISK: 'Iceland',
    NOK: 'Norway',
    SEK: 'Sweden',
    RON: 'Romania',
    BGN: 'Bulgaria',
    TRY: 'Turkey',
    ILS: 'Israel',
    CLP: 'Chile',
    PHP: 'Philippines',
    MXN: 'Mexico',
    ZAR: 'South Africa',
    BRL: 'Brazil',
    MYR: 'Malaysia',
    IDR: 'Indonesia',
    INR: 'India',
    KRW: 'South Korea',
    CNY: 'China',
    
};


export const FULL_CURRENCY_LIST = FULL_CURRENCY_OPTIONS
    .map(code => ({ code, label: `${code} (${CURRENCY_NAMES[code] || ''})` }))
    .sort((a, b) => a.label.localeCompare(b.label));

export function getCurrencyLabel(code) {
    return `${code} (${CURRENCY_NAMES[code] || ''})`;
}

export const ERROR_MESSAGES = {
    INVALID_CREDENTIALS: "Invalid username or password",
    REGISTRATION_FAILED: "Registration failed",
    CONNECTION_ERROR: "Backend connection error",
    SERVER_ERROR: "Server error",
    SESSION_ERROR: "Session invalid",
    UNAUTHORIZED: "Unauthorized operation",
    FETCH_HISTORY_ERROR: "Failed to fetch login history",
    FETCH_ACCOUNT_ERROR: "Failed to fetch account information",
};

export const NEWS_CATEGORIES = [
    { value: 'general', label: 'General' },
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'sports', label: 'Sports' },
    { value: 'health', label: 'Health' },
    { value: 'science', label: 'Science' },
    { value: 'entertainment', label: 'Entertainment' },
];

export const DIRECTIONS = [
    { value: 'vertical', label: 'Vertical' },
    { value: 'horizontal', label: 'Horizontal' },
];
