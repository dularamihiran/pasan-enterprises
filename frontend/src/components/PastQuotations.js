import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  UserIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { quotationAPI, handleApiError } from '../services/apiService';
import { generateQuotationPDF } from '../services/quotationService';

const ITEMS_PER_PAGE = 10;

const formatCurrency = (amount) =>
  `Rs. ${(Number(amount) || 0).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : '-';

const PastQuotations = ({ onBack }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuotations, setTotalQuotations] = useState(0);
  const [expanded, setExpanded] = useState(new Set());
  const [downloadingId, setDownloadingId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const loadQuotations = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = { page: currentPage, limit: ITEMS_PER_PAGE };
      if (searchTerm) params.search = searchTerm;

      const response = await quotationAPI.getAll(params);
      if (response.data.success) {
        setQuotations(response.data.data);
        setTotalPages(response.data.pages || 1);
        setTotalQuotations(response.data.total || 0);
      }
    } catch (err) {
      const errorInfo = handleApiError(err);
      setError(err.userMessage || errorInfo.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  const toggleExpanded = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Regenerate the PDF from the saved data (images are not stored, so none are included)
  const handleDownload = async (quotation) => {
    try {
      setDownloadingId(quotation._id);
      setError('');
      const result = await generateQuotationPDF({
        quotationNumber: quotation.quotationNumber,
        quotationDate: quotation.createdAt,
        customerInfo: quotation.customerInfo,
        items: (quotation.items || []).map((item) => ({
          ...item,
          extraDescription: item.description || '',
          images: []
        })),
        extras: quotation.extras || [],
        subtotal: quotation.subtotal,
        vatAmount: quotation.vatAmount,
        discountAmount: quotation.discountAmount,
        finalTotal: quotation.finalTotal
      });
      if (!result.success) {
        setError(result.message || 'Failed to generate PDF');
      }
    } catch (err) {
      console.error('Error regenerating quotation PDF:', err);
      setError('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const startIndex = totalQuotations === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * ITEMS_PER_PAGE, totalQuotations);

  const getPageNumbers = () => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-800 to-indigo-600 bg-clip-text text-transparent">
            Past Quotations
          </h1>
          <p className="text-slate-600 mt-2 text-sm sm:text-base">View and download previously created quotations</p>
        </div>
        <button
          onClick={onBack}
          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium shadow-sm"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Create Quotation
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by quotation number, customer name, phone, or created by..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
          />
        </div>
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800">All Quotations</h2>
            <p className="text-slate-600 text-sm mt-1">
              {totalQuotations} quotations found
              {totalQuotations > 0 && ` • Showing ${startIndex}-${endIndex}`}
            </p>
          </div>
          {totalPages > 1 && (
            <div className="text-sm text-slate-600">Page {currentPage} of {totalPages}</div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin-fast rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-slate-600">Loading quotations...</span>
          </div>
        ) : quotations.length === 0 ? (
          <div className="text-center py-12">
            <DocumentTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No quotations found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {quotations.map((quotation) => {
              const isExpanded = expanded.has(quotation._id);
              const itemCount = quotation.items?.length || 0;

              return (
                <div key={quotation._id} className="p-4 sm:p-6 hover:bg-slate-50 transition-colors duration-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 break-all">
                        {quotation.quotationNumber}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {quotation.customerInfo?.name} • {quotation.customerInfo?.phone}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CalendarDaysIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{formatDateTime(quotation.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <CurrencyDollarIcon className="w-4 h-4 text-slate-400" />
                          <span className="text-sm font-medium text-slate-900">{formatCurrency(quotation.finalTotal)}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
                          {itemCount} {itemCount === 1 ? 'item' : 'items'}
                        </span>
                        {quotation.createdBy?.fullName && (
                          <span className="inline-flex items-center text-xs text-slate-500">
                            <UserCircleIcon className="w-4 h-4 mr-1" />
                            Created by {quotation.createdBy.fullName}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 self-end md:self-auto">
                      <button
                        onClick={() => handleDownload(quotation)}
                        disabled={downloadingId === quotation._id}
                        className="inline-flex items-center px-3 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        title="Download PDF"
                      >
                        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                        {downloadingId === quotation._id ? 'Generating...' : 'PDF'}
                      </button>
                      <button
                        onClick={() => toggleExpanded(quotation._id)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Customer Info */}
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Customer Information</h4>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p><span className="font-medium text-slate-700">Name:</span> {quotation.customerInfo?.name}</p>
                            <p><span className="font-medium text-slate-700">Phone:</span> {quotation.customerInfo?.phone}</p>
                            {quotation.customerInfo?.email && (
                              <p><span className="font-medium text-slate-700">Email:</span> {quotation.customerInfo.email}</p>
                            )}
                            {quotation.customerInfo?.nic && (
                              <p><span className="font-medium text-slate-700">NIC:</span> {quotation.customerInfo.nic}</p>
                            )}
                            {quotation.customerInfo?.address && (
                              <p><span className="font-medium text-slate-700">Address:</span> {quotation.customerInfo.address}</p>
                            )}
                          </div>
                        </div>

                        {/* Summary */}
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Quotation Summary</h4>
                          <div className="text-sm space-y-1 bg-slate-50 rounded-lg p-3">
                            <div className="flex justify-between text-slate-600">
                              <span>Subtotal (excl. VAT):</span>
                              <span>{formatCurrency(quotation.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-blue-600">
                              <span>Total VAT:</span>
                              <span>{formatCurrency(quotation.vatAmount)}</span>
                            </div>
                            {quotation.discountAmount > 0 && (
                              <div className="flex justify-between text-green-600">
                                <span>Discount:</span>
                                <span>-{formatCurrency(quotation.discountAmount)}</span>
                              </div>
                            )}
                            {quotation.extrasTotal > 0 && (
                              <div className="flex justify-between text-slate-600">
                                <span>Extra Charges:</span>
                                <span>{formatCurrency(quotation.extrasTotal)}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-800 border-t border-slate-200 pt-1">
                              <span>Final Total:</span>
                              <span className="text-green-600">{formatCurrency(quotation.finalTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Items */}
                      <div>
                        <h4 className="font-medium text-slate-900 mb-2">Items</h4>
                        <div className="overflow-x-auto border border-slate-200 rounded-lg">
                          <table className="min-w-full text-sm">
                            <thead className="bg-slate-50 text-slate-700">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Item</th>
                                <th className="px-3 py-2 text-right font-medium">Qty</th>
                                <th className="px-3 py-2 text-right font-medium">Unit Price</th>
                                <th className="px-3 py-2 text-right font-medium">VAT %</th>
                                <th className="px-3 py-2 text-right font-medium">Warranty</th>
                                <th className="px-3 py-2 text-right font-medium">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {(quotation.items || []).map((item, idx) => (
                                <tr key={`${quotation._id}-${idx}`} className="align-top">
                                  <td className="px-3 py-2">
                                    <div className="font-medium text-slate-800">{item.name}</div>
                                    {item.itemId && <div className="text-xs text-slate-500">ID: {item.itemId}</div>}
                                    {item.description && (
                                      <div className="text-xs text-slate-500 mt-1 whitespace-pre-line max-w-md">{item.description}</div>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">{item.quantity}</td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">{formatCurrency(item.unitPrice)}</td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">{item.vatPercentage}%</td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap">{item.warrantyMonths} months</td>
                                  <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{formatCurrency(item.totalPrice)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Extras */}
                      {quotation.extras?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-slate-900 mb-2">Extra Charges</h4>
                          <ul className="text-sm text-slate-600 space-y-1">
                            {quotation.extras.map((extra, idx) => (
                              <li key={idx} className="flex justify-between max-w-md">
                                <span>{extra.description}</span>
                                <span>{formatCurrency(extra.amount)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-4 sm:px-6 py-4 border-t border-slate-200 flex items-center justify-center space-x-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 text-sm border rounded ${
                  currentPage === pageNum
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'border-slate-300 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PastQuotations;
