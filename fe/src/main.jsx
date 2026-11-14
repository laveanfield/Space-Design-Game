import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import SceneLab from './dev/SceneLab.jsx';
import './styles.css';

// ?lab=launch|orbit: trang thu nhanh cho nguoi phat trien (khong anh huong game binh thuong)
const lab = new URLSearchParams(window.location.search).has('lab');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>{lab ? <SceneLab /> : <App />}</React.StrictMode>
);
