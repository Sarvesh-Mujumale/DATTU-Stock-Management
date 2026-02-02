/**
 * MultiFileUpload Component - Premium Light Theme
 * ================================================
 * Side-by-side upload zones for purchase and sales bills
 */

import React, { useState, useRef, useCallback } from 'react';

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.pdf', '.jpg', '.jpeg', '.png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const FileListItem = ({ file, onRemove, disabled }) => {
    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    return (
        <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-neutral-200 shadow-sm animate-slide-up">
            <div className="p-2 bg-primary-100 rounded-lg">
                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-neutral-800 truncate font-medium">{file.name}</p>
                <p className="text-xs text-neutral-500">{formatSize(file.size)}</p>
            </div>
            {!disabled && (
                <button type="button" onClick={onRemove} className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
        </div>
    );
};

const CategoryUpload = ({ title, icon, files, onFilesChange, disabled, color = 'primary' }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const validateFile = useCallback((file) => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!ACCEPTED_EXTENSIONS.includes(extension)) return false;
        if (file.size > MAX_FILE_SIZE) return false;
        return true;
    }, []);

    const handleFiles = useCallback((newFiles) => {
        const validFiles = Array.from(newFiles).filter(validateFile);
        if (validFiles.length > 0) onFilesChange([...files, ...validFiles]);
    }, [files, onFilesChange, validateFile]);

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!disabled) handleFiles(e.dataTransfer.files);
    };

    const handleRemove = (index) => onFilesChange(files.filter((_, i) => i !== index));

    const colorClasses = {
        primary: { icon: 'text-primary-600', bg: 'from-primary-600 to-primary-800', border: 'border-primary-300', activeBg: 'bg-primary-50' },
        accent: { icon: 'text-accent-600', bg: 'from-accent-600 to-accent-800', border: 'border-accent-300', activeBg: 'bg-accent-50' }
    }[color];

    return (
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 bg-gradient-to-br ${colorClasses.bg} rounded-xl`}>
                    <span className="text-xl">{icon}</span>
                </div>
                <div>
                    <h3 className="font-semibold text-neutral-800">{title}</h3>
                    <p className="text-xs text-neutral-500">{files.length} file(s) added</p>
                </div>
            </div>

            <div
                role="button"
                tabIndex={disabled ? -1 : 0}
                onClick={() => !disabled && fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`min-h-[140px] p-4 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
                    ${isDragging ? `${colorClasses.border} ${colorClasses.activeBg}` : 'border-neutral-300 hover:border-neutral-400 bg-white/50'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_EXTENSIONS.join(',')} onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} className="hidden" />
                <div className="text-center">
                    <svg className={`w-8 h-8 mx-auto mb-2 ${colorClasses.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-neutral-500">Drop files or <span className={colorClasses.icon}>browse</span></p>
                </div>
            </div>

            {files.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {files.map((file, index) => (
                        <FileListItem key={`${file.name}-${index}`} file={file} onRemove={() => handleRemove(index)} disabled={disabled} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function MultiFileUpload({ purchaseFiles, salesFiles, onPurchaseFilesChange, onSalesFilesChange, disabled = false }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <CategoryUpload title="Purchase Bills" icon="📥" files={purchaseFiles} onFilesChange={onPurchaseFilesChange} disabled={disabled} color="primary" />
            <CategoryUpload title="Sales Bills" icon="📤" files={salesFiles} onFilesChange={onSalesFilesChange} disabled={disabled} color="accent" />
        </div>
    );
}
