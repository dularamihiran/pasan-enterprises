import React, { useState, useEffect, useCallback } from 'react';
import {
  TagIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { machineService } from '../services/machineService';

const PAGE_SIZE = 20;

const FILTERS = [
  { value: 'all', label: 'All machines' },
  { value: 'with-serials', label: 'Has serial numbers' },
  { value: 'untagged-stock', label: 'Stock without serial numbers' },
  { value: 'no-serials', label: 'Never had serial numbers' }
];

const sortSerials = (list) =>
  [...list].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

const formatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SummaryCard = ({ label, value, className }) => (
  <div className={`rounded-xl border p-3 sm:p-4 ${className}`}>
    <div className="text-xs sm:text-sm opacity-80">{label}</div>
    <div className="text-xl sm:text-2xl font-bold mt-1">{value}</div>
  </div>
);

const SerialNumbers = () => {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  const [machines, setMachines] = useState([]);
  const [summary, setSummary] = useState(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});

  // Debounce the search box
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await machineService.getSerialInventory({ search, filter, page, limit: PAGE_SIZE });
      const list = response.data || [];
      setMachines(list);
      setSummary(response.summary || null);
      setTotal(response.total || 0);
      setPages(response.pages || 1);

      // When searching for a serial number, open the machines that contain it
      if (search) {
        const term = search.toUpperCase();
        const toExpand = {};
        list.forEach(m => {
          const hit =
            (m.availableSerialNumbers || []).some(sn => sn.includes(term)) ||
            (m.soldSerialNumbers || []).some(s => s.serialNumber?.includes(term));
          if (hit) toExpand[m._id] = true;
        });
        setExpanded(toExpand);
      }
    } catch (err) {
      setError(err.message || 'Failed to load serial numbers');
    } finally {
      setLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleExpanded = (id) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isMatch = (serial) => search && serial.toUpperCase().includes(search.toUpperCase());

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Serial Numbers
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">
            Available and sold serial numbers for every machine
          </p>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stock-wide totals */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <SummaryCard
            label="Machines with serial no."
            value={`${summary.machinesWithSerials} / ${summary.machines}`}
            className="bg-white/70 border-slate-200 text-slate-800"
          />
          <SummaryCard
            label="Available serial no."
            value={summary.availableSerials}
            className="bg-green-50 border-green-200 text-green-800"
          />
          <SummaryCard
            label="Sold serial no."
            value={summary.soldSerials}
            className="bg-blue-50 border-blue-200 text-blue-800"
          />
          <SummaryCard
            label="Units in stock without serial no."
            value={summary.unitsWithoutSerials}
            className="bg-amber-50 border-amber-200 text-amber-800"
          />
        </div>
      )}

      {/* Search and filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-4 sm:p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by item ID, machine name, or serial number (e.g., K1-PEIA-003)"
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
            />
          </div>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50"
          >
            {FILTERS.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <p className="text-xs text-slate-500 mt-3">
          {loading ? 'Loading...' : `${total} machine${total !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Machine list */}
      <div className="space-y-3">
        {!loading && machines.length === 0 && !error && (
          <div className="bg-white/60 rounded-2xl border border-slate-200/50 p-8 text-center text-slate-500">
            No machines found.
          </div>
        )}

        {machines.map(machine => {
          const available = sortSerials(machine.availableSerialNumbers || []);
          const sold = [...(machine.soldSerialNumbers || [])].sort(
            (a, b) => new Date(b.soldAt || 0) - new Date(a.soldAt || 0)
          );
          const withoutSerials = Math.max((machine.quantity || 0) - available.length, 0);
          const isOpen = Boolean(expanded[machine._id]);

          return (
            <div key={machine._id} className="bg-white/70 backdrop-blur-sm rounded-xl shadow border border-slate-200/60 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpanded(machine._id)}
                className="w-full text-left px-4 py-3 sm:px-5 sm:py-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {isOpen
                    ? <ChevronDownIcon className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
                    : <ChevronRightIcon className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-800 truncate">{machine.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">ID: {machine.itemId}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{machine.category}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs pl-7 md:pl-0">
                  <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">Stock: {machine.quantity}</span>
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Available: {available.length}</span>
                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700">Sold: {sold.length}</span>
                  {withoutSerials > 0 && (
                    <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-700">Without serial: {withoutSerials}</span>
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-slate-200 px-4 py-4 sm:px-5 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 bg-slate-50/50">
                  {/* Available */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <TagIcon className="w-4 h-4 mr-1.5 text-green-600" />
                      Available ({available.length})
                    </h4>
                    {available.length === 0 ? (
                      <p className="text-sm text-slate-500">No available serial numbers.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-64 overflow-y-auto p-2 bg-white border border-slate-200 rounded-lg">
                        {available.map(sn => (
                          <span
                            key={sn}
                            className={`font-mono text-xs px-2 py-1 rounded border ${
                              isMatch(sn)
                                ? 'bg-yellow-100 border-yellow-400 text-yellow-900'
                                : 'bg-green-50 border-green-200 text-green-800'
                            }`}
                          >
                            {sn}
                          </span>
                        ))}
                      </div>
                    )}
                    {withoutSerials > 0 && (
                      <p className="text-xs text-amber-700 mt-2">
                        {withoutSerials} unit(s) in stock have no serial number yet. Add them from Add Inventory by searching this Item ID.
                      </p>
                    )}
                  </div>

                  {/* Sold */}
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
                      <TagIcon className="w-4 h-4 mr-1.5 text-blue-600" />
                      Sold ({sold.length})
                    </h4>
                    {sold.length === 0 ? (
                      <p className="text-sm text-slate-500">No sold serial numbers.</p>
                    ) : (
                      <div className="max-h-64 overflow-auto bg-white border border-slate-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 text-slate-600 sticky top-0">
                            <tr>
                              <th className="text-left font-medium px-3 py-2">Serial No.</th>
                              <th className="text-left font-medium px-3 py-2">Order ID</th>
                              <th className="text-left font-medium px-3 py-2">Sold On</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sold.map((s, i) => (
                              <tr
                                key={`${s.serialNumber}-${i}`}
                                className={`border-t border-slate-100 ${isMatch(s.serialNumber) ? 'bg-yellow-50' : ''}`}
                              >
                                <td className="px-3 py-2 font-mono text-slate-800">{s.serialNumber}</td>
                                <td className="px-3 py-2 text-slate-700">{s.orderId || '-'}</td>
                                <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{formatDate(s.soldAt)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page} of {pages}</span>
          <button
            type="button"
            onClick={() => setPage(p => Math.min(p + 1, pages))}
            disabled={page === pages || loading}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default SerialNumbers;
