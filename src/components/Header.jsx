/**
 * Header Component - Premium Light Theme
 * =======================================
 * Animated gradient logo with floating effect
 */

import React from 'react';

/**
 * Animated Logo Icon with gradient
 */
const AnimatedLogo = () => (
    <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-500 rounded-xl blur-lg opacity-40 animate-pulse" />

        {/* Logo container */}
        <div className="relative p-3 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-glow-sm animate-float">
            <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        </div>
    </div>
);

/**
 * Header component with premium branding
 */
export default function Header() {
    return (
        <header className="w-full">
            <div className="max-w-4xl mx-auto">
                {/* Logo and title */}
                <div className="flex items-center gap-4 mb-3">
                    <AnimatedLogo />

                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gradient">
                            DATTU BILL
                        </h1>
                        <p className="text-neutral-600 text-sm sm:text-base mt-1">
                            AI-Powered Invoice Processing •
                            <span className="text-primary-600 font-medium"> Secure & Private</span>
                        </p>
                    </div>
                </div>

                {/* Feature pills */}
                <div className="flex flex-wrap gap-2 mt-4 ml-16">
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700 border border-primary-200">
                        ✨ AI Extraction
                    </span>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-accent-100 text-accent-700 border border-accent-200">
                        📊 Excel Export
                    </span>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-success-100 text-success-600 border border-success-500/30">
                        🔒 Privacy First
                    </span>
                </div>
            </div>
        </header>
    );
}
