import { useNavigate } from 'react-router-dom';
import { Code, Play, BarChart3, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold">Observability</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            View Dashboard
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-slate-950 to-cyan-500/10 pointer-events-none" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-block mb-6">
            <span className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm font-semibold">
              🚀 Local Development Observability
            </span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Observability for your
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Local Dev Loop
            </span>
          </h1>

          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto leading-relaxed">
            Track API failures in real-time, visualize request flows, and debug faster. 
            Built for developers who want complete insights into their local service communication.
          </p>

          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70"
          >
            <Play size={20} />
            View Live Demo
            <ArrowRight size={20} />
          </button>

          <p className="mt-4 text-sm text-slate-500">
            ✨ 5-10 sample logs auto-generated for demonstration
          </p>
        </div>
      </section>

      {/* Setup Guide Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started in 3 Steps</h2>
            <p className="text-slate-400 text-lg">
              Start tracking API failures in your local dev environment in minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1: Install Tracker */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />

                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
                  <Code size={24} className="text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2">1. Install Tracker</h3>
                <p className="text-slate-400 mb-6">
                  Add the tracker SDK to your microservices to start logging requests
                </p>

                <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-cyan-400 overflow-auto">
                  <div>npm install api-tracker</div>
                  <div className="text-slate-500">// Then configure in your service</div>
                </div>
              </div>
            </div>

            {/* Step 2: Run Server */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />

                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
                  <Play size={24} className="text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2">2. Run Server</h3>
                <p className="text-slate-400 mb-6">
                  Start the observability server to collect and aggregate logs
                </p>

                <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-cyan-400 overflow-auto">
                  <div>npm run dev</div>
                  <div className="text-slate-500">// Server running on :5000</div>
                </div>
              </div>
            </div>

            {/* Step 3: View Dashboard */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 h-full">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-t-2xl" />

                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 mb-6">
                  <BarChart3 size={24} className="text-white" />
                </div>

                <h3 className="text-xl font-bold mb-2">3. View Dashboard</h3>
                <p className="text-slate-400 mb-6">
                  Visualize API failures, performance metrics, and error distributions
                </p>

                <div className="bg-slate-900 rounded-lg p-4 text-sm font-mono text-cyan-400 overflow-auto">
                  <div>http://localhost:5173</div>
                  <div className="text-slate-500">// View live data</div>
                </div>
              </div>
            </div>
          </div>

          {/* Connect steps with arrows */}
          <div className="hidden md:flex justify-between items-center mt-12 text-slate-600">
            <div className="flex-1 text-center">✓ Complete</div>
            <ArrowRight className="flex-shrink-0" />
            <div className="flex-1 text-center">✓ Running</div>
            <ArrowRight className="flex-shrink-0" />
            <div className="flex-1 text-center">✓ Monitoring</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Key Features</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Real-time Tracking', desc: 'See API failures as they happen with instant updates' },
              { title: 'Smart Filtering', desc: 'Filter by service, method, status code, or route' },
              { title: 'Error Analytics', desc: 'Analyze failure patterns and identify common issues' },
              { title: 'Performance Metrics', desc: 'Track request duration and identify bottlenecks' },
              { title: 'Error Details', desc: 'View full request/response bodies and stack traces' },
              { title: 'Multi-Service', desc: 'Monitor multiple microservices from a single dashboard' }
            ].map((feature, idx) => (
              <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition-colors">
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-gradient-to-r from-blue-600/20 via-slate-900 to-cyan-600/20 border-t border-slate-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-slate-400 mb-8">
            View the live demo to see how Observability works with sample data
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold text-lg shadow-lg shadow-blue-500/50"
          >
            <Play size={20} />
            Launch Dashboard
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/50 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded flex items-center justify-center">
                  <BarChart3 size={16} className="text-white" />
                </div>
                <span className="font-bold">Observability</span>
              </div>
              <p className="text-slate-400 text-sm">
                Complete observability for your local development environment
              </p>
            </div>
            <div className="text-right text-slate-500 text-sm">
              <p>Local Development Observability v1.0</p>
              <p>© 2026 All rights reserved</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
