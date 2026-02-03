/**
 * Document Processor - Premium Light Theme
 * =========================================
 * Modern light theme with glassmorphism and animations
 * Now with Role-Based Authentication
 */

import React, { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import MultiFileUpload from './components/MultiFileUpload';
import BillTypeSelector, { ProcessingMode } from './components/BillTypeSelector';
import ProcessingStatus from './components/ProcessingStatus';
import ErrorDisplay from './components/ErrorDisplay';
import PrivacyNotice from './components/PrivacyNotice';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';

const ProcessingState = {
    IDLE: 'idle',
    UPLOADING: 'uploading',
    PROCESSING: 'processing',
    GENERATING: 'generating',
    COMPLETE: 'complete',
    ERROR: 'error'
};

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

const SuccessState = ({ onDismiss }) => (
    <div className="text-center py-12 animate-fade-in">
        <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-success-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
            </div>
        </div>
        <h3 className="text-2xl font-bold text-gradient mb-2">Download Complete!</h3>
        <p className="text-neutral-500 mb-4">Your Excel file has been downloaded successfully.</p>

        {/* Okay Button */}
        <button
            type="button"
            onClick={onDismiss}
            className="mt-6 px-8 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
        >
            ✓ Okay, Got It
        </button>
    </div>
);

// Tab Navigation for Admin users
const TabNavigation = ({ activeTab, onTabChange, isAdmin }) => (
    <div className="flex gap-2 mb-6">
        <button
            onClick={() => onTabChange('process')}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'process'
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg'
                : 'bg-white/50 text-neutral-600 hover:bg-white/80'
                }`}
        >
            📄 Process Bills
        </button>
        {isAdmin && (
            <button
                onClick={() => onTabChange('admin')}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${activeTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg'
                    : 'bg-white/50 text-neutral-600 hover:bg-white/80'
                    }`}
            >
                👤 User Management
            </button>
        )}
    </div>
);

// User Info Bar
const UserInfoBar = ({ user, onLogout }) => (
    <div className="flex items-center justify-between mb-6 p-4 glass-card rounded-2xl">
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold
                ${user.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-primary-500 to-primary-600'}`}>
                {user.username[0].toUpperCase()}
            </div>
            <div>
                <p className="font-medium text-neutral-800">
                    {user.username}
                    {user.role === 'admin' && (
                        <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                            Admin
                        </span>
                    )}
                </p>
                <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
        </div>
        <button
            onClick={onLogout}
            className="px-4 py-2 text-neutral-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center gap-2"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
        </button>
    </div>
);

// Main Dashboard Component (Bill Processing)
function BillProcessingDashboard() {
    const { token } = useAuth();
    const [mode, setMode] = useState(ProcessingMode.SINGLE);
    const [selectedFile, setSelectedFile] = useState(null);
    const [purchaseFiles, setPurchaseFiles] = useState([]);
    const [salesFiles, setSalesFiles] = useState([]);
    const [processingState, setProcessingState] = useState(ProcessingState.IDLE);
    const [errorMessage, setErrorMessage] = useState('');

    const handleModeChange = useCallback((newMode) => {
        setMode(newMode);
        setSelectedFile(null);
        setPurchaseFiles([]);
        setSalesFiles([]);
        setProcessingState(ProcessingState.IDLE);
        setErrorMessage('');
    }, []);

    const handleFileSelect = useCallback((file) => {
        setSelectedFile(file);
        setProcessingState(ProcessingState.IDLE);
        setErrorMessage('');
    }, []);


    // Get API URL from environment
    const API_URL = import.meta.env.VITE_API_URL;

    const handleSingleProcess = useCallback(async () => {
        if (!selectedFile) return;
        setProcessingState(ProcessingState.UPLOADING);
        setErrorMessage('');

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);
            setProcessingState(ProcessingState.PROCESSING);

            const response = await fetch(`${API_URL}/process-document`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Processing failed');
            }

            setProcessingState(ProcessingState.GENERATING);
            const blob = await response.blob();
            const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'processed_document.xlsx';
            downloadBlob(blob, filename);
            setProcessingState(ProcessingState.COMPLETE);
        } catch (error) {
            console.error('Processing error:', error);
            setProcessingState(ProcessingState.ERROR);
            setErrorMessage(error.message || 'An unexpected error occurred');
        }
    }, [selectedFile, token]);

    const handleAnalysisProcess = useCallback(async () => {
        if (purchaseFiles.length === 0 && salesFiles.length === 0) return;
        setProcessingState(ProcessingState.UPLOADING);
        setErrorMessage('');

        try {
            const formData = new FormData();
            purchaseFiles.forEach(file => formData.append('purchase_files', file));
            salesFiles.forEach(file => formData.append('sales_files', file));
            formData.append('auto_detect', 'true');
            setProcessingState(ProcessingState.PROCESSING);

            const response = await fetch(`${API_URL}/analyze-bills`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Analysis failed');
            }

            setProcessingState(ProcessingState.GENERATING);
            const blob = await response.blob();
            const filename = response.headers.get('Content-Disposition')?.match(/filename="(.+)"/)?.[1] || 'inventory_analysis.xlsx';
            downloadBlob(blob, filename);
            setProcessingState(ProcessingState.COMPLETE);
        } catch (error) {
            console.error('Analysis error:', error);
            setProcessingState(ProcessingState.ERROR);
            setErrorMessage(error.message || 'An unexpected error occurred');
        }
    }, [purchaseFiles, salesFiles, token]);

    const handleSuccessDismiss = useCallback(() => {
        setPurchaseFiles([]);
        setSalesFiles([]);
        setSelectedFile(null);
        setProcessingState(ProcessingState.IDLE);
    }, []);

    const handleProcess = mode === ProcessingMode.SINGLE ? handleSingleProcess : handleAnalysisProcess;
    const canProcess = mode === ProcessingMode.SINGLE ? selectedFile !== null : (purchaseFiles.length > 0 || salesFiles.length > 0);
    const handleRetry = useCallback(() => { setProcessingState(ProcessingState.IDLE); setErrorMessage(''); }, []);
    const isProcessing = [ProcessingState.UPLOADING, ProcessingState.PROCESSING, ProcessingState.GENERATING].includes(processingState);

    return (
        <>
            <BillTypeSelector mode={mode} onModeChange={handleModeChange} />

            {processingState === ProcessingState.ERROR && (
                <ErrorDisplay message={errorMessage} onRetry={handleRetry} onDismiss={handleRetry} />
            )}

            {isProcessing && <ProcessingStatus state={processingState} />}

            {processingState === ProcessingState.IDLE && (
                <>
                    {mode === ProcessingMode.SINGLE ? (
                        <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} disabled={isProcessing} />
                    ) : (
                        <MultiFileUpload purchaseFiles={purchaseFiles} salesFiles={salesFiles} onPurchaseFilesChange={setPurchaseFiles} onSalesFilesChange={setSalesFiles} disabled={isProcessing} />
                    )}

                    <button
                        type="button"
                        onClick={handleProcess}
                        disabled={!canProcess || isProcessing}
                        className={`w-full mt-8 py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 transform
                            ${canProcess && !isProcessing ? 'btn-primary hover:scale-[1.02]' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300'}`}
                    >
                        {mode === ProcessingMode.SINGLE ? '✨ Process Document' : `📊 Analyze ${purchaseFiles.length + salesFiles.length} Bills`}
                    </button>
                </>
            )}

            {processingState === ProcessingState.COMPLETE && (
                <SuccessState onDismiss={handleSuccessDismiss} />
            )}
        </>
    );
}

// Authenticated App Content
function AuthenticatedApp() {
    const { user, logout, isAdmin, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('process');

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-neutral-500 mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-animated overflow-hidden relative">
            {/* Floating background orbs */}
            <div className="floating-orb floating-orb-1" />
            <div className="floating-orb floating-orb-2" />

            <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
                <Header />

                <div className="glass-card rounded-3xl p-8 mt-8">
                    {/* User Info */}
                    <UserInfoBar user={user} onLogout={logout} />

                    {/* Tab Navigation for Admin */}
                    {isAdmin && (
                        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isAdmin} />
                    )}

                    {/* Content */}
                    {activeTab === 'process' ? (
                        <BillProcessingDashboard />
                    ) : (
                        <AdminDashboard />
                    )}
                </div>

                <PrivacyNotice />

                <footer className="text-center mt-8 text-neutral-500 text-sm">
                    <p>DATTU AI Safety Platform 1.0 </p>
                </footer>
            </div>
        </div>
    );
}

// Main App with Auth Check
function AppContent() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                    <p className="text-neutral-500 mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    return isAuthenticated ? <AuthenticatedApp /> : <LoginPage />;
}

// Root App Component with AuthProvider
export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
