import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLogs, createLogs } from '../services/api';
import { generateDemoLogs } from '../utils/demoData';
import RequestTable from '../components/RequestTable';
import RequestDetail from './RequestDetail';

export default function Dashboard() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const data = await fetchLogs();
      setLogs(Array.isArray(data) ? data : data?.data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate demo logs and send them to the server
   * Creates 5-10 realistic fake API logs for demonstration
   */
  const handleDemoMode = async () => {
    try {
      setDemoLoading(true);
      setDemoMode(true);
      
      // Generate 5-10 fake logs
      const demoLogs = generateDemoLogs();
      
      console.log(`🎬 Demo Mode: Generating ${demoLogs.length} sample logs...`);
      
      // Send logs to server
      await createLogs(demoLogs);
      
      console.log('✅ Demo logs sent to server');
      
      // Refresh logs to show the new demo data
      setTimeout(loadLogs, 500);
    } catch (error) {
      console.error('Error loading demo data:', error);
      // Still show the demo logs in UI even if server fails
      const demoLogs = generateDemoLogs();
      setLogs(prev => [...demoLogs, ...prev]);
    } finally {
      setDemoLoading(false);
    }
  };

  /**
   * Clear demo data and reload actual logs
   */
  const handleClearDemo = async () => {
    setDemoMode(false);
    setLoading(true);
    await loadLogs();
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading...</div>;

  return (
    <div>
      {/* Navigation Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2"
          >
            ← Back to Home
          </button>
          <h1 className="text-2xl font-bold">Request Tracker Dashboard</h1>
          <div className="w-32"></div>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">API Request Logs</h2>
            <p className="text-gray-600">
              {demoMode && '🎬 Demo Mode Active - '} 
              {logs.length} {logs.length === 1 ? 'log' : 'logs'} found
            </p>
          </div>
          
          {/* Demo Mode Button */}
          <div className="flex gap-3">
            {!demoMode ? (
              <button
                onClick={handleDemoMode}
                disabled={demoLoading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                {demoLoading ? (
                  <>
                    <span className="inline-block animate-spin">⏳</span>
                    Loading Demo...
                  </>
                ) : (
                  <>
                    <span>🎬</span>
                    Demo Mode
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleClearDemo}
                disabled={loading}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
              >
                ✕ Clear Demo
              </button>
            )}
          </div>
        </div>

        {/* Demo Mode Info Banner */}
        {demoMode && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
            <p className="text-blue-900 font-semibold">🎬 Demo Mode Active</p>
            <p className="text-blue-700 text-sm mt-1">
              This dashboard is showing sample API failures for demonstration. Click "Clear Demo" to see real logs.
            </p>
          </div>
        )}

        <RequestTable logs={logs} onSelectLog={setSelectedLog} />
        {selectedLog && (
          <RequestDetail log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </div>
    </div>
  );
}
