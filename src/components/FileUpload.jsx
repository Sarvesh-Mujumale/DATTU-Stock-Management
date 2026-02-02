/**
 * FileUpload Component - Premium Light Theme
 * ==========================================
 * Drag-and-drop with glow effects and animations
 */

import React, { useState, useRef, useCallback } from 'react';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Animated upload icon
 */
const UploadIcon = ({ isDragging }) => (
    <div className={`relative mb-6 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
        {/* Glow ring */}
        <div className={`absolute inset-0 bg-primary-500 rounded-full blur-xl transition-opacity duration-300 ${isDragging ? 'opacity-30' : 'opacity-10'}`} />

        {/* Icon container */}
        <div className={`relative p-6 rounded-full transition-all duration-300
            ${isDragging
                ? 'bg-gradient-to-br from-primary-500 to-primary-700'
                : 'bg-gradient-to-br from-neutral-100 to-neutral-200 border border-neutral-300'}`}>
            <svg
                className={`w-10 h-10 transition-colors duration-300 ${isDragging ? 'text-white' : 'text-primary-600'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
            </svg>
        </div>
    </div>
);

/**
 * Document icon for selected file
 */
const DocumentIcon = () => (
    <div className="p-4 bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-glow-sm">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    </div>
);

export default function FileUpload({ onFileSelect, disabled = false, selectedFile = null, onClear }) {
    const [isDragging, setIsDragging] = useState(false);
    const [validationError, setValidationError] = useState('');
    const fileInputRef = useRef(null);

    const validateFile = useCallback((file) => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(extension)) {
            return `Invalid file type. Accepted: ${ACCEPTED_EXTENSIONS.join(', ')}`;
        }
        if (file.size > MAX_FILE_SIZE) return `File too large. Maximum size is 10MB.`;
        return null;
    }, []);

    const handleFileSelect = useCallback((file) => {
        setValidationError('');
        const error = validateFile(file);
        if (error) { setValidationError(error); return; }
        onFileSelect(file);
    }, [validateFile, onFileSelect]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;
        const files = e.dataTransfer.files;
        if (files.length > 0) handleFileSelect(files[0]);
    }, [disabled, handleFileSelect]);

    const handleClick = useCallback(() => {
        if (!disabled && fileInputRef.current) fileInputRef.current.click();
    }, [disabled]);

    const handleInputChange = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) handleFileSelect(files[0]);
        e.target.value = '';
    }, [handleFileSelect]);

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="w-full">
            <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_EXTENSIONS.join(',')}
                onChange={handleInputChange}
                className="hidden"
                id="file-upload-input"
            />

            {!selectedFile ? (
                <div
                    role="button"
                    tabIndex={disabled ? -1 : 0}
                    onClick={handleClick}
                    onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`upload-zone ${isDragging ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
                >
                    <UploadIcon isDragging={isDragging} />
                    <p className="text-neutral-800 font-semibold text-lg mb-2">
                        {isDragging ? 'Drop your file here' : 'Drag & drop your document'}
                    </p>
                    <p className="text-neutral-500 text-sm mb-6">
                        or <span className="text-primary-600 font-medium cursor-pointer hover:text-primary-700">click to browse</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                        {['.xlsx', '.xls', '.pdf', '.jpg', '.png'].map((ext) => (
                            <span key={ext} className="file-badge">{ext}</span>
                        ))}
                    </div>
                    <p className="text-neutral-400 text-xs mt-6">Maximum file size: 10MB</p>
                </div>
            ) : (
                <div className="glass-card rounded-2xl p-6 animate-fade-in">
                    <div className="flex items-center gap-4">
                        <DocumentIcon />
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-neutral-900 truncate text-lg">{selectedFile.name}</p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="file-badge">{selectedFile.name.split('.').pop().toUpperCase()}</span>
                                <span className="text-neutral-500 text-sm">{formatFileSize(selectedFile.size)}</span>
                            </div>
                        </div>
                        {onClear && !disabled && (
                            <button
                                type="button"
                                onClick={onClear}
                                className="p-3 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {validationError && (
                <div className="mt-4 error-alert animate-slide-up">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{validationError}</span>
                </div>
            )}
        </div>
    );
}
