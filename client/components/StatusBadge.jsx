export default function StatusBadge({ method }) {
  const colors = {
    GET: 'bg-blue-100 text-blue-800',
    POST: 'bg-green-100 text-green-800',
    PUT: 'bg-yellow-100 text-yellow-800',
    DELETE: 'bg-red-100 text-red-800'
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colors[method] || 'bg-gray-100 text-gray-800'}`}>
      {method}
    </span>
  );
}
