import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AlertTriangle, Calculator, Files } from 'lucide-react';
import { App } from './App';
import { PricingEngine } from './components/PricingEngine';
import { PricingEstimatesWorkspace } from './components/PricingEstimatesWorkspace';
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
  const params = new URLSearchParams(window.location.search);
  const [pricingOpen, setPricingOpen] = useState(params.get('pricing') === '1');
  const [estimatesOpen, setEstimatesOpen] = useState(params.get('estimates') === '1');

  function openNewEstimate() {
    setEstimatesOpen(false);
    setPricingOpen(true);
  }

  return (
    <>
      <App />
      <button className="estimatesLauncher" type="button" onClick={() => setEstimatesOpen(true)}>
        <Files size={18} />
        <span>Estimates</span>
      </button>
      <button className="pricingLauncher" type="button" onClick={() => setPricingOpen(true)}>
        <Calculator size={18} />
        <span>Quick price</span>
      </button>
      <PricingEngine open={pricingOpen} onClose={() => setPricingOpen(false)} />
      <PricingEstimatesWorkspace open={estimatesOpen} onClose={() => setEstimatesOpen(false)} onNewEstimate={openNewEstimate} />
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
