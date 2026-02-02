/**
 * ProcessingStatus Component - Premium Light Theme
 * =================================================
 * Animated progress steps with pulsing indicators
 */

import React from 'react';

const STEPS = [
    { key: 'uploading', label: 'Uploading', icon: '📤' },
    { key: 'processing', label: 'AI Processing', icon: '🤖' },
    { key: 'generating', label: 'Generating Excel', icon: '📊' },
];

const Spinner = () => (
    <div className="relative w-6 h-6">
        <div className="absolute inset-0 rounded-full border-2 border-primary-200" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary-600 animate-spin" />
    </div>
);

const CheckIcon = () => (
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
    </div>
);

export default function ProcessingStatus({ state }) {
    const getStepStatus = (stepKey) => {
        const stepIndex = STEPS.findIndex(s => s.key === stepKey);
        const currentIndex = STEPS.findIndex(s => s.key === state);
        if (stepIndex < currentIndex) return 'completed';
        if (stepIndex === currentIndex) return 'active';
        return 'pending';
    };

    return (
        <div className="py-8 animate-fade-in">
            <div className="text-center mb-8">
                <h3 className="text-xl font-bold text-gradient mb-2">Processing Your Document</h3>
                <p className="text-neutral-500 text-sm">This may take a few moments...</p>
            </div>

            <div className="space-y-3">
                {STEPS.map((step, index) => {
                    const status = getStepStatus(step.key);
                    return (
                        <div key={step.key} className={`progress-step ${status}`}>
                            <div className="flex-shrink-0">
                                {status === 'completed' && <CheckIcon />}
                                {status === 'active' && <Spinner />}
                                {status === 'pending' && (
                                    <div className="w-6 h-6 rounded-full border-2 border-neutral-300 flex items-center justify-center text-neutral-400">
                                        <span className="text-xs">{index + 1}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{step.icon}</span>
                                    <span className={`font-medium ${status === 'active' ? 'text-primary-700' :
                                        status === 'completed' ? 'text-success-600' : 'text-neutral-400'
                                        }`}>{step.label}</span>
                                </div>
                            </div>
                            {status === 'active' && <span className="text-primary-600 text-sm animate-pulse">In progress...</span>}
                            {status === 'completed' && <span className="text-success-600 text-sm">Done</span>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-8">
                <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500 shimmer"
                        style={{
                            width: state === 'uploading' ? '33%' :
                                state === 'processing' ? '66%' :
                                    state === 'generating' ? '90%' : '100%'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

