/**
 * BillTypeSelector Component - Premium Design
 * ============================================
 * Pill-shaped toggle with smooth sliding indicator
 */

import React from 'react';

/**
 * Processing modes
 */
export const ProcessingMode = {
    SINGLE: 'single',
    ANALYSIS: 'analysis'
};

/**
 * Mode configuration
 */
const MODES = [
    {
        id: ProcessingMode.SINGLE,
        label: 'Single Document',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        description: 'Process a single bill'
    },
    {
        id: ProcessingMode.ANALYSIS,
        label: 'Bill Analysis',
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        description: 'Compare multiple bills'
    }
];

/**
 * BillTypeSelector component with animated pill toggle
 */
export default function BillTypeSelector({ mode, onModeChange }) {
    const activeIndex = MODES.findIndex(m => m.id === mode);

    return (
        <div className="mb-8">
            {/* Pill toggle container */}
            <div className="mode-selector">
                {/* Sliding indicator */}
                <div
                    className="mode-indicator"
                    style={{
                        width: `calc(50% - 4px)`,
                        left: activeIndex === 0 ? '4px' : 'calc(50%)',
                    }}
                />

                {/* Mode buttons */}
                {MODES.map((modeOption) => (
                    <button
                        key={modeOption.id}
                        type="button"
                        onClick={() => onModeChange(modeOption.id)}
                        className={`mode-btn ${mode === modeOption.id ? 'active' : ''}`}
                    >
                        <span className={`transition-transform duration-300 ${mode === modeOption.id ? 'scale-110' : ''}`}>
                            {modeOption.icon}
                        </span>
                        <span className="hidden sm:inline">{modeOption.label}</span>
                    </button>
                ))}
            </div>

            {/* Active mode description */}
            <p className="text-center text-neutral-500 text-sm mt-3 animate-fade-in">
                {MODES.find(m => m.id === mode)?.description}
            </p>
        </div>
    );
}
