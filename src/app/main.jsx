import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  AlertTriangle,
  ClipboardList,
  Images,
  ScanSearch,
  ThumbsUp,
} from 'lucide-react';
import {
  completeInspection,
  createInspection,
  updateInspectionArea,
  updateInspectionItem,
  uploadInspectionPhoto,
} from '../services/api';
import { App } from './App';
import '../styles/app.css';

// v3.7 generated the inspection workspace without adding its runtime imports
// to App.jsx. Expose the dependencies as global bindings so the existing
// inspection module can render while App.jsx is split into smaller modules.
Object.assign(globalThis, {
  AlertTriangle,
  ClipboardList,
  Images,
  ScanSearch,
  ThumbsUp,
  completeInspection,
  createInspection,
  updateInspectionArea,
  updateInspectionItem,
  uploadInspectionPhoto,
});

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

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
