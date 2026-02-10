import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './style.css'

const rootEl = document.getElementById('app')
if (!rootEl) {
  const el = document.createElement('div')
  el.id = 'app'
  document.body.appendChild(el)
}

createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
