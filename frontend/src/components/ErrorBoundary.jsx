import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('AgriSmart UI Error Boundary Caught Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4 border border-red-200">
                        <AlertTriangle className="h-7 w-7" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                    <p className="text-sm text-gray-500 max-w-md mb-6">
                        {this.state.error?.message || 'An unexpected rendering error occurred in this view.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2.5 bg-eco-600 hover:bg-eco-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
