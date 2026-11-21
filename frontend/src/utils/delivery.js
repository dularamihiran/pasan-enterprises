// Helpers for order delivery / warranty start date.
//
// deliveryType:
//   'immediate' -> customer took the items at the time of sale; warranty starts on sale date
//   'later'     -> delivered later; warranty starts on deliveryDate (null until finalized)
// Orders created before this feature have no delivery fields and are treated as 'immediate'.

export const isDeliveryLater = (order) => order?.deliveryType === 'later';

// Returns the Date the warranty starts from, or null if delivery is still pending.
export const getWarrantyStartDate = (order) => {
  if (!order) return null;
  if (order.deliveryDate) return new Date(order.deliveryDate);
  if (isDeliveryLater(order)) return null; // pending delivery -> warranty not started
  return order.createdAt ? new Date(order.createdAt) : null;
};

export const isDeliveryPending = (order) => isDeliveryLater(order) && !order?.deliveryDate;

// Convert a YYYY-MM-DD input value to an ISO string at local midnight, so the
// stored date is the same calendar day the user picked regardless of timezone.
export const dateInputToISO = (value) => {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00`);
  return isNaN(d.getTime()) ? null : d.toISOString();
};

// Local date as YYYY-MM-DD (for <input type="date"> values / min attributes)
export const toDateInputValue = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};
