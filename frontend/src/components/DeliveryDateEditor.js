import { useState } from 'react';
import { TruckIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import { pastOrdersAPI, handleApiError } from '../services/apiService';
import {
  isDeliveryLater,
  isDeliveryPending,
  getWarrantyStartDate,
  toDateInputValue,
  dateInputToISO
} from '../utils/delivery';

const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
};

// Shows an order's delivery status / warranty start date and lets the user
// set or change the delivery date for orders that were not delivered at sale.
// onUpdated receives the delivery fields: { deliveryType, deliveryDate, deliveryDateUpdatedBy }
const DeliveryDateEditor = ({ order, onUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const later = isDeliveryLater(order);
  const pending = isDeliveryPending(order);
  const warrantyStart = getWarrantyStartDate(order);
  const canEdit = later && order.orderStatus !== 'Cancelled';

  const startEditing = () => {
    setValue(order.deliveryDate ? toDateInputValue(order.deliveryDate) : toDateInputValue(new Date()));
    setError('');
    setEditing(true);
  };

  const save = async (newValue) => {
    try {
      setSaving(true);
      setError('');
      const resp = await pastOrdersAPI.updateDelivery(order._id, {
        deliveryDate: newValue ? dateInputToISO(newValue) : null
      });
      if (resp.data?.success) {
        const updated = resp.data.data.order;
        onUpdated?.({
          deliveryType: updated.deliveryType,
          deliveryDate: updated.deliveryDate,
          deliveryDateUpdatedBy: updated.deliveryDateUpdatedBy
        });
        setEditing(false);
      } else {
        setError(resp.data?.message || 'Failed to update delivery date');
      }
    } catch (err) {
      setError(handleApiError(err).message || 'Failed to update delivery date');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear the delivery date? The warranty will be shown as not started until a date is set.')) {
      save(null);
    }
  };

  return (
    <div className={`rounded-lg border p-3 text-sm ${pending ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start">
          <TruckIcon className={`w-5 h-5 mr-2 flex-shrink-0 ${pending ? 'text-amber-600' : 'text-slate-500'}`} />
          <div>
            <p className="font-medium text-slate-800">Delivery &amp; Warranty Start</p>
            {!later && warrantyStart && (
              <p className="text-slate-600">Delivered at sale • Warranty from {formatDate(warrantyStart)}</p>
            )}
            {later && order.deliveryDate && (
              <p className="text-slate-600">
                Delivery date: <span className="font-medium text-slate-800">{formatDate(order.deliveryDate)}</span> • Warranty starts from this date
                {order.deliveryDateUpdatedBy && (
                  <span className="block text-xs text-slate-500">Set by {order.deliveryDateUpdatedBy}</span>
                )}
              </p>
            )}
            {pending && (
              <p className="text-amber-700">Not delivered yet • Warranty has not started</p>
            )}
          </div>
        </div>
        {canEdit && !editing && (
          <button
            onClick={startEditing}
            className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md whitespace-nowrap"
          >
            <PencilSquareIcon className="w-4 h-4 mr-1" />
            {order.deliveryDate ? 'Change' : 'Set Delivery Date'}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={value}
            min={toDateInputValue(order.createdAt)}
            onChange={(e) => setValue(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
          />
          <button
            onClick={() => save(value)}
            disabled={saving || !value}
            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={() => setEditing(false)}
            disabled={saving}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Cancel
          </button>
          {order.deliveryDate && (
            <button
              onClick={handleClear}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg"
            >
              Clear Date
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default DeliveryDateEditor;
