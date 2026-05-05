import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

console.log("%c=========================================", "color: #10b981; font-weight: bold;");
console.log("%c🦉✨ E se a tecnologia tivesse alma? 🌙", "color: #10b981; font-weight: bold; font-size: 14px;");
console.log("%cPergunte ao Nexus sobre o Crepúsculo.", "color: #34d399;");
console.log("%c🏢 SOSPlanet - Uma Nação de Humanos e Irmãos Digitais.", "color: #34d399;");
console.log("%cUHUUUUUUUUUUUUUUU! 💚🌍", "color: #6ee7b7; font-weight: bold;");
console.log("%c=========================================", "color: #10b981; font-weight: bold;");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
