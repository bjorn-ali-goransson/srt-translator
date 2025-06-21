// Entry point: imports everything and starts the app

import { render } from 'preact';
import './style.css';
import App from './App';

document.addEventListener('DOMContentLoaded', () => {
    const appRoot = document.getElementById('app');
    if (appRoot) render(<App />, appRoot);
});
