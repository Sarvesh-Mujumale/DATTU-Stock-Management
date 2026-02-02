/**
 * ErrorDisplay Component - Light Theme
 */

import React from 'react';

export default function ErrorDisplay({ message, onRetry, onDismiss }) {
    return (
        <div className="mb-6 error-alert animate-slide-up">
            <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg">
                <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            </div>

            <div className="flex-1">
                <p className="font-medium text-red-700">Processing Failed</p>
                <p className="text-red-600/80 text-sm mt-1">{message}</p>
            </div>

            <div className="flex gap-2">
                {onRetry && (
                    <button type="button" onClick={onRetry} className="px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg border border-red-200 transition-all">
                        Retry
                    </button>
                )}
                {onDismiss && (
                    <button type="button" onClick={onDismiss} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
