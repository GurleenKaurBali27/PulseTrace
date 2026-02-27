export default function RequestDetail({ log, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Request Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>
        <div className="space-y-3">
          <div><span className="font-semibold">Method:</span> {log.method}</div>
          <div><span className="font-semibold">URL:</span> {log.url}</div>
          <div><span className="font-semibold">Timestamp:</span> {new Date(log.timestamp).toLocaleString()}</div>
          <div><span className="font-semibold">IP:</span> {log.ip}</div>
          <div><span className="font-semibold">User Agent:</span> {log.userAgent}</div>
          {log.data && (
            <div>
              <span className="font-semibold">Data:</span>
              <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto">
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
