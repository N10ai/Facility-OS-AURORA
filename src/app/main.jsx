import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Calculator } from 'lucide-react';
import { App } from './App';
import { PricingEngine } from './components/PricingEngine';
import '../styles/app.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('FacilityOS runtime error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="runtimeErrorPage">
          <section className="runtimeErrorCard">
            <AlertTriangle size={28} />
            <h1>Aurora could not open this screen.</h1>
            <p>{this.state.error.message || 'An unexpected runtime error occurred.'}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Reload Aurora
            </button>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

function AuroraRoot() {
  const [pricingOpen, setPricingOpen] = useState(new URLSearchParams(window.location.search).get('pricing') === '1');

  return (
    <>
      <App />
      <button className="pricingLauncher" type="button" onClick={() => setPricingOpen(true)}>
        <Calculator size={18} />
        <span>Quick price</span>
      </button>
      <PricingEngine open={pricingOpen} onClose={() => setPricingOpen(false)} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuroraRoot />
    </AppErrorBoundary>
  </React.StrictMode>,
);
