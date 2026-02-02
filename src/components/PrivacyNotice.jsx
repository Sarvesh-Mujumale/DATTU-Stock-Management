/**
 * PrivacyNotice Component - Light Theme
 */

import React from 'react';

export default function PrivacyNotice() {
    return (
        <div className="mt-8 privacy-notice animate-fade-in">
            <div className="flex-shrink-0 p-2 bg-success-100 rounded-lg">
                <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            </div>
            <div>
                <p className="font-medium text-success-700">Your Privacy is Protected</p>
                <p className="text-success-600/80 text-sm mt-1">
                    Files are processed locally and never stored on our servers.
                    All data is cleared after download.
                </p>
            </div>
        </div>
    );
}
