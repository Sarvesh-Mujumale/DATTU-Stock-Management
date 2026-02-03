/**
 * Login Page
 * ==========
 * Premium centered card login interface matching reference.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import dattuChar from '../assets/dattu_character.jpg';

const STOCK_TIPS = [
    {
        title: "Stock Tip for Leaders",
        text: "A strong inventory culture starts at the top. Your visible leadership prevents losses."
    },
    {
        title: "Inventory Accuracy",
        text: "Regular cycle counts are 60% more effective than annual physical inventories for maintaining accuracy."
    },
    {
        title: "Demand Forecasting",
        text: "Analyze historical sales data to predict future demand and avoid overstocking or stockouts."
    },
    {
        title: "Safety Stock",
        text: "Maintain a safety stock buffer to protect against supply chain disruptions and unexpected demand spikes."
    },
    {
        title: "ABC Analysis",
        text: "Prioritize your inventory management by categorizing items into A (high value), B, and C (low value) groups."
    }
];

const TIP_DURATION = 10000; // 10 seconds per tip

export default function LoginPage() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Tip Timer State
    const [currentTipIndex, setCurrentTipIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const intervalId = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / TIP_DURATION) * 100;

            if (newProgress >= 100) {
                // Time to switch tip
                setCurrentTipIndex((prev) => (prev + 1) % STOCK_TIPS.length);
                setProgress(0);
                // Reset start time is implicit as we'll re-run this effect when index changes
            } else {
                setProgress(newProgress);
            }
        }, 50); // Update every 50ms for smooth animation

        return () => clearInterval(intervalId);
    }, [currentTipIndex]); // Re-run effect when index changes to reset timer relative to that tip

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const currentTip = STOCK_TIPS[currentTipIndex];

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#eef2f6] p-4 font-sans">

            {/* MAIN CARD CONTAINER */}
            <div className="w-full max-w-4xl bg-white rounded-[1rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">

                {/* LEFT SIDE - Brand & Character */}
                <div
                    className="w-full md:w-[50%] relative p-8 flex flex-col items-center justify-between text-center overflow-hidden transition-colors duration-1000"
                    style={{ background: 'linear-gradient(rgb(11, 61, 145) 0%, rgb(0, 167, 157) 100%)' }}
                >

                    {/* Character Image Section */}
                    <div className="flex-1 flex flex-col items-center justify-center w-full z-10 mt-4">
                        <div className="w-52 h-68 rounded-lg overflow-hidden shadow-2xl border-2 border-white/10 mb-6">
                            <img
                                src={dattuChar}
                                alt="DATTU"
                                className="w-full h-full object-cover"
                            />
                        </div>

                        <h1 className="text-3xl font-bold text-white mb-2">
                            Namaskar, I'm DATTU
                        </h1>
                        <p className="text-white/80 font-light text-lg">
                            Your Stock Management Assistant
                        </p>
                    </div>

                    {/* Tip Card */}
                    <div className="w-full bg-[#ffffff15] backdrop-blur-sm rounded-xl p-5 border border-white/10 text-left mt-8">
                        <div key={currentTipIndex} className="animate-slide-up">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="text-yellow-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </span>
                                <h3 className="text-white font-semibold text-sm">
                                    {currentTip.title}
                                </h3>
                            </div>
                            <p className="text-white/70 text-sm italic leading-relaxed mb-4 min-h-[3.5rem]">
                                "{currentTip.text}"
                            </p>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white/80 rounded-full transition-all duration-100 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE - Login Form */}
                <div className="w-full md:w-[45%] bg-white p-10 md:p-14 flex flex-col justify-center">
                    <div className="max-w-md mx-auto w-full">
                        <h2 className="text-3xl font-extrabold text-[#1e293b] mb-2">Sign in to DATTU</h2>
                        <p className="text-slate-600 text-sm mb-10">Access your Stock Management System.</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Username */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400"
                                    placeholder="e.g., admin"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 placeholder-slate-400 pr-10"
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>


                            {/* Error */}
                            {error && (
                                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || !username || !password}
                                className={`w-full py-3.5 px-6 rounded-lg font-bold text-white shadow-md transition-all duration-200
                                    ${!loading && username && password
                                        ? 'bg-gradient-to-r from-[#6b7280] to-[#4b5563] hover:from-[#0B3D91] hover:to-[#0B3D91] active:scale-[0.99]'
                                        : 'bg-slate-300 cursor-not-allowed text-slate-500'}`}
                            >
                                {loading ? 'Authenticating...' : (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Access Dashboard
                                    </span>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
