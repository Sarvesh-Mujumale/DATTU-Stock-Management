/**
 * React Application Entry Point
 * ==============================
 * Mounts the React application to the DOM.
 * Privacy-first: No analytics, no tracking, no storage.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Mount application
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
