import React from 'react';

/**
 * Authentic vector brand marks for Indian UPI payment apps and NPCI rails
 */

export const UpiLogo: React.FC<{ className?: string }> = ({ className = 'h-5' }) => (
  <svg viewBox="0 0 160 56" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* NPCI UPI Logo */}
    <path d="M7 44L28 12H44L23 44H7Z" fill="#707070" />
    <path d="M26 44L47 12H63L42 44H26Z" fill="#F47920" />
    <path d="M45 44L66 12H82L61 44H45Z" fill="#0F9946" />
    <text x="88" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="900" fontSize="30" fill="#FFFFFF" letterSpacing="1">
      UPI
    </text>
  </svg>
);

export const GooglePayLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

export const PhonePeLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 48 48" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* PhonePe Brand Purple Squircle */}
    <rect width="48" height="48" rx="11" fill="#5F259F" />
    {/* Official PhonePe Devanagari Pe Symbol in Pure White */}
    <path
      fill="#FFFFFF"
      d="M34.8 17.6c-.3-.5-.9-.8-1.5-.8h-5.8l-4.5-5.3c-.4-.5-1.1-.7-1.7-.5l-1.6.5c-.3.1-.4.4-.3.6l5 4.7h-6.3c-.4 0-.8.3-.8.7v1.1c0 .4.4.7.8.7h1.4v4.6c0 3.4 1.8 5.4 4.8 5.4.9 0 1.7-.1 2.6-.5v3.1c0 .8.7 1.5 1.5 1.5h1.3c.4 0 .7-.3.7-.7V17.6h3.2c.4 0 .7-.3.7-.7v-1.1c0-.4-.3-.7-.7-.7h-.7v2.5zm-8.3 1.5h-4.3v-2.3h4.3v2.3zm0 6.8c-.6.3-1.3.4-2 .4-1.5 0-2.3-.7-2.3-2.4v-2.4h4.3v4.4z"
    />
  </svg>
);

export const PaytmLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Crisp White Badge */}
    <rect width="24" height="24" rx="5.5" fill="#FFFFFF" />
    {/* Paytm "Pay" in Dark Midnight Blue #002E6E */}
    <path
      fill="#002E6E"
      d="M.232 9.4A.234.234 0 0 0 0 9.636v5.924c0 .132.096.238.216.241h1.09c.13 0 .237-.107.237-.24l.004-1.658H2.57c.857 0 1.453-.605 1.453-1.481v-1.538c0-.877-.596-1.484-1.453-1.484H.232zm9.032 0a.239.239 0 0 0-.237.241v2.47c0 .94.657 1.608 1.579 1.608h.675s.016 0 .037.004a.253.253 0 0 1 .222.253c0 .13-.096.235-.219.251l-.018.004-.303.006H9.739a.239.239 0 0 0-.236.24v1.09a.24.24 0 0 0 .236.242h1.75c.92 0 1.577-.669 1.577-1.608v-4.56a.239.239 0 0 0-.236-.24h-1.07a.239.239 0 0 0-.236.24c-.005.787 0 1.525 0 2.255a.253.253 0 0 1-.25.25h-.449a.253.253 0 0 1-.25-.255c.005-.754-.005-1.5-.005-2.25a.239.239 0 0 0-.236-.24zm-4.004.006a.232.232 0 0 0-.238.226v1.023c0 .132.113.24.252.24h1.413c.112.017.2.1.213.23v.14c-.013.124-.1.214-.207.224h-.7c-.93 0-1.594.63-1.594 1.515v1.269c0 .88.57 1.506 1.495 1.506h1.94c.348 0 .63-.27.63-.6v-4.136c0-1.004-.508-1.637-1.72-1.637zm-3.713 1.572h.678c.139 0 .25.115.25.256v.836a.253.253 0 0 1-.25.256h-.1c-.192.002-.386 0-.578 0zm4.67 1.977h.445c.139 0 .252.108.252.24v.932a.23.23 0 0 1-.014.076.25.25 0 0 1-.238.164h-.445a.247.247 0 0 1-.252-.24v-.933c0-.132.113-.239.252-.239Z"
    />
    {/* Paytm "tm" in Signature Cyan #00BAF2 */}
    <path
      fill="#00BAF2"
      d="M15.85 8.167a.204.204 0 0 0-.04.004c-.68.19-.543 1.148-1.781 1.23h-.12a.23.23 0 0 0-.052.005h-.001a.24.24 0 0 0-.184.235v1.09c0 .134.106.241.237.241h.645v4.623c0 .132.104.238.233.238h1.058a.236.236 0 0 0 .233-.238v-4.623h.6c.13 0 .236-.107.236-.241v-1.09a.239.239 0 0 0-.236-.24h-.612V8.386a.218.218 0 0 0-.216-.22zm4.225 1.17c-.398 0-.762.15-1.042.395v-.124a.238.238 0 0 0-.234-.224h-1.07a.24.24 0 0 0-.236.242v5.92a.24.24 0 0 0 .236.242h1.07c.12 0 .217-.091.233-.209v-4.25a.393.393 0 0 1 .371-.408h.196a.41.41 0 0 1 .226.09.405.405 0 0 1 .145.319v4.074l.004.155a.24.24 0 0 0 .237.241h1.07a.239.239 0 0 0 .235-.23l-.001-4.246c0-.14.062-.266.174-.34a.419.419 0 0 1 .196-.068h.198c.23.02.37.2.37.408.005 1.396.004 2.8.004 4.224a.24.24 0 0 0 .237.241h1.07c.13 0 .236-.108.236-.241v-4.543c0-.31-.034-.442-.08-.577a1.601 1.601 0 0 0-1.51-1.09h-.015a1.58 1.58 0 0 0-1.152.5c-.291-.308-.7-.5-1.153-.5z"
    />
  </svg>
);

export const BhimLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#055B32" />
    {/* Arrow triangles */}
    <path d="M18 46L36 18H24L12 46H18Z" fill="#F47920" />
    <path d="M32 46L50 18H38L26 46H32Z" fill="#FFFFFF" />
    <path d="M44 46L58 24H50L40 46H44Z" fill="#91D651" />
  </svg>
);

export const CredLogo: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 64 64" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect width="64" height="64" rx="14" fill="#121212" stroke="#333333" strokeWidth="2" />
    {/* CRED Shield Mask */}
    <path
      d="M32 14L18 20v14c0 9.5 6 18.4 14 20.8 8-2.4 14-11.3 14-20.8V20L32 14zm0 29.5c-5.2-1.9-9-7.8-9-14.5V23.7l9-3.9 9 3.9V29c0 6.7-3.8 12.6-9 14.5z"
      fill="#FFFFFF"
    />
    <circle cx="32" cy="30" r="3.5" fill="#3B82F6" />
  </svg>
);
