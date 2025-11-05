import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import BTRheader from "../components/modals/btrHeader";
import Navbar from "../components/modals/serviceNavbar.jsx";
import BTRNavbar from '../components/modals/btrNavbar.jsx';
import { useMonitorMaintenance } from '../hooks/useMonitorMaintenance.js';
import { usePredictiveMaintenance } from '../hooks/usePredictiveMaintenance.js';
import { Button } from "@/components/ui/button";
import api from "../api/api";

export default function MaintenanceList() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const assetId = searchParams.get("id");

  /* -------------------------------------------------- */
  /*  Hooks                                             */
  /* -------------------------------------------------- */
  const {
    filteredSchedules,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    setSortBy
  } = useMonitorMaintenance();

  //const { maintenanceDates } = usePredictiveMaintenance();   // predictive data
  

  /* Helper – pick predicted next check-up for an asset */
  // const getNextCheckup = (assetId) => {
  //   const item = maintenanceDates.find(md => md.id === assetId);
  //   return item?.next_maintenance_checkup || null;
  // };

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : 'Not scheduled');

  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  useEffect(() => {
    if (!assetId) return;
    setSearchQuery(`id:${assetId}`);
  }, [setSearchQuery, assetId]);

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <BTRheader />
      <BTRNavbar />
      <div className="max-w-[84rem] mx-auto px-4 sm:px-6 mt-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-500">Monitor Maintenance</h1>
          <Button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 bg-blue-900 text-white rounded font-semibold hover:bg-blue-950"
          >
            Back to Inventory
          </Button>
        </div>

        {/* Search / Sort */}
        <div className="mb-4 flex gap-2 sm:justify-end mt-4">
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
            {filteredSchedules.map((s, k) => (
              <div key={k} className="cursor-pointer">
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
                            s.status === 'done'
                              ? 'bg-green-100 text-green-800'
                              : s.status === 'in-progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {s.status}
                        </span>
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-500">Report:</span>
                      <Button
                      variant={"link"}
                        onClick={async()=>{
                          const response = await api.get(`/api/pdf/${s.id}`, {
                          responseType: 'blob',
                        });

                        // Create a URL from the Blob
                        const fileURL = URL.createObjectURL(response.data);
                        
                        // Open the URL in a new tab
                        window.open(fileURL, '_blank');
                        }}
                        className="py-2 px-0 flex flex-col gap-3 hover:text-blue-400 underline"
                      >
                        View report
                      </Button>
                    </div>
                    <div>
                      <span className="text-gray-500">Sender e-mail:</span>
                      <p className="font-mono text-gray-600">{s.user_email ? 'Sent' : '-'}</p>
                    </div>



                    {/* Predictive maintenance row */}
                    {/* <div className="sm:col-span-2">
                      <span className="text-gray-500">Predictive Next Check-up:</span>
                      <p className="font-medium text-blue-600">
                        {formatDate(getNextCheckup(s.asset_id))}
                      </p>
                    </div> */}
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