import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BTRheader from "../components/modals/btrHeader";
import Navbar from "../components/modals/serviceNavbar.jsx";
import BTRNavbar from '../components/modals/btrNavbar.jsx';
import { useMonitorMaintenance } from '../hooks/useMonitorMaintenance.js';

export default function MaintenanceList() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  
  // Use the custom hook
  const {
    filteredSchedules,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    setSortBy
  } = useMonitorMaintenance();

  const formatDate = (d) => new Date(d).toLocaleString();

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader/>
      <BTRNavbar/>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-400">Monitor Maintenance</h1>
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 bg-yellow-400 text-white rounded font-semibold hover:bg-yellow-500"
          >
            Back to Inventory
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="Search by asset or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-yellow-400"
          />
          <select
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-yellow-400"
          >
            <option value="asset_name">Sort by Name</option>
            <option value="scheduled_at">Sort by Date</option>
            <option value="status">Sort by Status</option>
          </select>
        </div>

        {loading && <p className="text-gray-600">Loading schedules…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && filteredSchedules.length === 0 && (
          <p className="text-gray-600">No maintenance schedules yet.</p>
        )}

        {/* Accordion list */}
        {!loading && filteredSchedules.length > 0 && (
          <div className="bg-white rounded shadow divide-y divide-gray-200">
            {filteredSchedules.map((s) => (
              <div key={s.asset_id} className="cursor-pointer">
                {/* Visible bar – click to expand */}
                <div
                  onClick={() => toggle(s.asset_id)}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-800">{s.asset_name}</span>
                  <span className="text-xs text-gray-500">
                    {openId === s.asset_id ? '▲' : '▼'}
                  </span>
                </div>

                {/* Expandable details */}
                {openId === s.asset_id && (
                  <div className="px-4 pb-4 text-sm text-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-gray-500">Asset:</span>
                      <p className="font-medium">{s.asset_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Recipient:</span>
                      <p className="font-medium">{s.user_email}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Scheduled:</span>
                      <p className="font-medium">{formatDate(s.scheduled_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <p>
                        <span
                          className={`inline-block px-2 py-1 text-xs rounded ${
                            s.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Sender e-mail:</span>
                      <p className="font-mono text-gray-600">{s.user_email ? 'Sent' : '-'}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}