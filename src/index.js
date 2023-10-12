import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import config from './config';
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google"


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  // <React.StrictMode>
    <GoogleOAuthProvider 
      clientId={config.GOOGLE_OAUTH_CLIENT_ID} 
      onScriptLoadError={() => {
        console.log("gsi script loaded error")
      }}
      onScriptLoadSuccess={() => {
        console.log("gsi script loaded")
      }}
    >
      <BrowserRouter>
          <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  // </React.StrictMode>
);
