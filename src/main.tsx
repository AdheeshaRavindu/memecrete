import React from 'react';
import ReactDOM from 'react-dom/client';
import { SpincreteApp } from './app/SpincreteApp';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <SpincreteApp />
  </React.StrictMode>,
);