import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  TagIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { machineService } from '../services/machineService';

const SERIAL_FIXED_PART = 'PEIA';

const initialFormData = {
  itemId: '',
  name: '',
  category: '',
  description: '',
  quantity: '',
  price: '',
  shipmentNumber: '',
  boxNumber: '',
  startMachineNumber: '1',
  // Only used when adding serials to an existing machine
  serialCount: ''
};

// Builds serials like K1-PEIA-003-001, K1-PEIA-003-002, ... (one per unit)
const generateSerialNumbers = ({ shipmentNumber, boxNumber, startMachineNumber, count }) => {
  const shipment = shipmentNumber.trim().toUpperCase();
  const box = boxNumber.trim();
  const qty = parseInt(count, 10);
  const start = parseInt(startMachineNumber, 10) || 1;

  if (!shipment || !box || !qty || qty <= 0) return [];

  const paddedBox = box.padStart(3, '0');
  return Array.from({ length: qty }, (_, i) =>
    `${shipment}-${SERIAL_FIXED_PART}-${paddedBox}-${String(start + i).padStart(3, '0')}`
  );
};

// Escape regex special characters so the search box matches text literally
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const inputClass = (locked) =>
  `w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
    locked ? 'bg-slate-100 text-slate-600 cursor-not-allowed' : 'bg-white/50'
  }`;

const AddInventory = () => {
  const [formData, setFormData] = useState(initialFormData);

  // Existing machine picked from the Item ID search (null = adding a new item)
  const [selectedMachine, setSelectedMachine] = useState(null);
  // For an existing machine: true = serials are for newly arrived units (stock increases)
  const [increaseQuantity, setIncreaseQuantity] = useState(false);

  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [searching, setSearching] = useState(false);

  const isExisting = Boolean(selectedMachine);
  const serialNumbers = generateSerialNumbers({
    ...formData,
    count: isExisting ? formData.serialCount : formData.quantity
  });
  const serialInputUsed = Boolean(formData.shipmentNumber.trim() || formData.boxNumber.trim());

  const existingAvailable = selectedMachine?.availableSerialNumbers || [];
  const existingSold = selectedMachine?.soldSerialNumbers || [];
  const unitsWithoutSerials = selectedMachine
    ? Math.max((selectedMachine.quantity || 0) - existingAvailable.length, 0)
    : 0;

  const exactMatch = !isExisting && searchResults.find(
    m => m.itemId?.toLowerCase() === formData.itemId.trim().toLowerCase()
  );

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categories, setCategories] = useState([
    // Fallback categories if API fails
    'Packing Machine',
    'Filling Machine',
    'Sealing Machine',
    'Capping Machine',
    'Date Coding Machine',
    'Dehydrator Machine',
    'Optional Line Equipment',
    'Mixing Machine',
    'Labelling Machine',
    'Grinding Machine',
    'Food machine',
    'Other'
  ]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Fetch categories from backend on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
        console.log('Fetching categories from:', `${API_BASE_URL}/categories/enums`);

        const response = await fetch(`${API_BASE_URL}/categories/enums`);
        const data = await response.json();

        if (data.success && data.categories) {
          console.log('✅ Categories fetched from backend:', data.categories);
          setCategories(data.categories);
        } else {
          console.warn('⚠️  Using fallback categories - API response:', data);
        }
      } catch (error) {
        console.error('❌ Failed to fetch categories, using fallback:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Search existing machines as the user types in the Item ID field
  useEffect(() => {
    if (selectedMachine) return;

    const term = formData.itemId.trim();
    if (!term) {
      setSearchResults([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await machineService.getAllMachines({ search: escapeRegex(term), limit: 10 });
        if (!cancelled) setSearchResults(response.data || []);
      } catch (error) {
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.itemId, selectedMachine]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Debug log for category changes
    if (name === 'category') {
      console.log('Category selected:', `"${value}"`, 'Length:', value.length);
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear any existing messages when user starts typing
    if (message.text) {
      setMessage({ type: '', text: '' });
    }
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setFormData({
      ...initialFormData,
      itemId: machine.itemId || '',
      name: machine.name || '',
      category: machine.category || '',
      description: machine.description || '',
      quantity: String(machine.quantity ?? 0),
      price: String(machine.price ?? '')
    });
    // If every unit in stock already has a serial (e.g. quantity 0 machines added
    // for quotations), new serials can only be for newly arrived units
    const untagged = (machine.quantity || 0) - (machine.availableSerialNumbers?.length || 0);
    setIncreaseQuantity(untagged <= 0);
    setShowResults(false);
    setMessage({ type: '', text: '' });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setSelectedMachine(null);
    setIncreaseQuantity(false);
    setSearchResults([]);
    setMessage({ type: '', text: '' });
  };

  // Returns an error message for the serial number inputs, or null if they are fine
  const validateSerialInputs = () => {
    if (!formData.shipmentNumber.trim() || !formData.boxNumber.trim()) {
      return isExisting
        ? 'Enter the Shipment No. and the Box No. for the serial numbers.'
        : 'To add serial numbers, enter both the Shipment No. and the Box No. (or leave both empty).';
    }
    if (!/^[A-Za-z0-9]+$/.test(formData.shipmentNumber.trim())) {
      return 'Shipment No. can contain only letters and numbers (e.g., K1).';
    }
    if (!/^\d+$/.test(formData.boxNumber.trim())) {
      return 'Box No. must be a number (e.g., 3 or 003).';
    }
    if (!/^\d+$/.test(formData.startMachineNumber.trim()) || parseInt(formData.startMachineNumber, 10) < 1) {
      return 'Starting Machine No. must be a number of 1 or more.';
    }
    return null;
  };

  // Add serial numbers to the selected existing machine
  const submitSerialsForExisting = async () => {
    const serialError = validateSerialInputs();
    if (serialError) {
      setMessage({ type: 'error', text: serialError });
      return;
    }

    const count = parseInt(formData.serialCount, 10);
    if (!/^\d+$/.test(formData.serialCount.trim()) || count < 1) {
      setMessage({ type: 'error', text: 'Enter how many serial numbers to add (1 or more).' });
      return;
    }

    if (!increaseQuantity && count > unitsWithoutSerials) {
      setMessage({
        type: 'error',
        text: `Only ${unitsWithoutSerials} unit(s) in stock are without serial numbers. If these are newly arrived units, tick "These are new units".`
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await machineService.addSerialNumbers(selectedMachine._id, {
        serialNumbers,
        increaseQuantity
      });

      if (response.success) {
        const updated = response.data;
        setSelectedMachine(updated);
        setFormData(prev => ({
          ...prev,
          quantity: String(updated.quantity ?? 0),
          shipmentNumber: '',
          boxNumber: '',
          startMachineNumber: '1',
          serialCount: ''
        }));
        const untagged = (updated.quantity || 0) - (updated.availableSerialNumbers?.length || 0);
        setIncreaseQuantity(untagged <= 0);
        setMessage({
          type: 'success',
          text: `${serialNumbers.length} serial number(s) added to ${updated.itemId}.${
            increaseQuantity ? ` Stock increased to ${updated.quantity}.` : ''
          }`
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to add serial numbers. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isExisting) {
      await submitSerialsForExisting();
      return;
    }

    // Validation
    if (!formData.itemId || !formData.name || !formData.category || !formData.description || !formData.quantity || !formData.price) {
      setMessage({
        type: 'error',
        text: 'Please fill in all required fields (Item ID, Name, Category, Description, Quantity, and Price).'
      });
      return;
    }

    // Validate category
    if (!categories.includes(formData.category)) {
      console.error('Invalid category:', formData.category);
      setMessage({
        type: 'error',
        text: 'Please select a valid category from the dropdown.'
      });
      return;
    }

    // Validate numeric fields
    if (parseFloat(formData.price) < 0) {
      setMessage({
        type: 'error',
        text: 'Price cannot be negative.'
      });
      return;
    }

    if (parseInt(formData.quantity) < 0) {
      setMessage({
        type: 'error',
        text: 'Quantity cannot be negative.'
      });
      return;
    }

    // Serial numbers are optional, but if started both parts are needed
    if (serialInputUsed) {
      const serialError = validateSerialInputs();
      if (serialError) {
        setMessage({ type: 'error', text: serialError });
        return;
      }
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Prepare data for API
      const machineData = {
        itemId: formData.itemId.trim(),
        name: formData.name.trim(),
        category: formData.category.trim(), // Trim category to remove any whitespace
        description: formData.description.trim(),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        ...(serialNumbers.length > 0 && { serialNumbers })
      };

      console.log('Machine data being sent:', machineData); // Debug log

      // Call API to create machine
      const response = await machineService.createMachine(machineData);

      if (response.success) {
        resetForm();
        setMessage({
          type: 'success',
          text: 'Machine added to inventory successfully!'
        });
      }
    } catch (error) {
      console.error('Error adding machine:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to add machine to inventory. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const generateItemId = () => {
    const prefix = 'PE';
    const randomNum = Math.floor(Math.random() * 900000) + 100000;
    const newId = `${prefix}-${randomNum}`;
    setFormData(prev => ({
      ...prev,
      itemId: newId
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
          Add Inventory
        </h1>
        <p className="text-slate-600 mt-2 text-sm sm:text-base">
          Add new items to your machinery inventory, or search an existing Item ID to add serial numbers
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Message Display */}
        {message.text && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg flex items-start sm:items-center ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            ) : (
              <ExclamationCircleIcon className="w-5 h-5 mr-2 flex-shrink-0" />
            )}
            <span className="text-sm sm:text-base">{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
              <ClipboardDocumentListIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Basic Information
            </h3>

            {isExisting && (
              <div className="mb-4 sm:mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                Existing machine selected. Details are read-only here (edit them in View Inventory) — add serial numbers below.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Item ID{' '}
                  <span className="text-slate-500 text-xs">
                    {isExisting ? '(existing machine)' : '(enter a new ID, generate one, or search an existing machine)'}
                  </span>
                </label>
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    {!isExisting && (
                      <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    )}
                    <input
                      type="text"
                      name="itemId"
                      value={formData.itemId}
                      onChange={handleInputChange}
                      onFocus={() => setShowResults(true)}
                      onBlur={() => setTimeout(() => setShowResults(false), 150)}
                      placeholder="e.g., PE-123456, or type to search"
                      autoComplete="off"
                      readOnly={isExisting}
                      className={`${inputClass(isExisting)} ${isExisting ? '' : 'pl-10'}`}
                      required
                    />

                    {/* Search results dropdown */}
                    {showResults && !isExisting && formData.itemId.trim() && (searching || searchResults.length > 0) && (
                      <div className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg">
                        {searching && searchResults.length === 0 ? (
                          <div className="px-4 py-3 text-sm text-slate-500">Searching...</div>
                        ) : (
                          <>
                            <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100">
                              Existing machines — select one to add serial numbers
                            </div>
                            {searchResults.map(machine => (
                              <button
                                type="button"
                                key={machine._id}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectMachine(machine)}
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-slate-100 last:border-b-0"
                              >
                                <div className="flex justify-between items-center gap-2">
                                  <span className="font-medium text-slate-800">{machine.itemId}</span>
                                  <span className="text-xs text-slate-500 whitespace-nowrap">
                                    Qty {machine.quantity} · {machine.availableSerialNumbers?.length || 0} serial(s)
                                  </span>
                                </div>
                                <div className="text-sm text-slate-600 truncate">{machine.name}</div>
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  {isExisting ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center"
                      title="Clear selection and add a new item"
                    >
                      <XMarkIcon className="w-5 h-5 mr-1" />
                      Change
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={generateItemId}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:scale-105 transition-all duration-200"
                    >
                      Generate
                    </button>
                  )}
                </div>
                {exactMatch && (
                  <p className="mt-2 text-xs text-amber-700">
                    This Item ID already exists. Select it from the list to add serial numbers to it.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter the machine name"
                  readOnly={isExisting}
                  className={inputClass(isExisting)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                {isExisting ? (
                  <input
                    type="text"
                    value={formData.category}
                    readOnly
                    className={inputClass(true)}
                  />
                ) : (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={inputClass(false)}
                    required
                    disabled={categoriesLoading}
                  >
                    <option value="">
                      {categoriesLoading ? 'Loading categories...' : 'Select a category'}
                    </option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                )}
              </div>



              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Detailed description of the machine..."
                  rows={3}
                  readOnly={isExisting}
                  className={inputClass(isExisting)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Inventory Details */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6 flex items-center">
              <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Inventory Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isExisting ? 'Current Stock Quantity' : 'Quantity'}
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  readOnly={isExisting}
                  className={inputClass(isExisting)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price (Rs)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  readOnly={isExisting}
                  className={inputClass(isExisting)}
                  required
                />
              </div>
            </div>

            {isExisting && (
              <div className="mt-4 sm:mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500">In stock</div>
                  <div className="text-lg font-semibold text-slate-800">{selectedMachine.quantity}</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs text-green-700">With serial no.</div>
                  <div className="text-lg font-semibold text-green-800">{existingAvailable.length}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="text-xs text-amber-700">Without serial no.</div>
                  <div className="text-lg font-semibold text-amber-800">{unitsWithoutSerials}</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div className="text-xs text-slate-500">Sold (serial no.)</div>
                  <div className="text-lg font-semibold text-slate-800">{existingSold.length}</div>
                </div>
              </div>
            )}
          </div>

          {/* Serial Numbers */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 flex items-center">
              <TagIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Serial Numbers
              {!isExisting && <span className="ml-2 text-sm font-normal text-slate-500">(optional)</span>}
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mb-4 sm:mb-6">
              {isExisting
                ? 'Add serial numbers for this machine, in the format Shipment-PEIA-Box-Machine (e.g., K1-PEIA-003-001).'
                : 'Leave empty if you don\'t have serial numbers yet (e.g., machines added for quotations) — you can add them later by searching the Item ID. One serial number is created per unit, in the format Shipment-PEIA-Box-Machine (e.g., K1-PEIA-003-001).'}
            </p>

            {/* Existing serial numbers of the selected machine */}
            {isExisting && existingAvailable.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <p className="text-sm font-medium text-slate-700 mb-2">
                  Existing available serial numbers ({existingAvailable.length}):
                </p>
                <div className="max-h-36 overflow-y-auto flex flex-wrap gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  {existingAvailable.map(sn => (
                    <span key={sn} className="font-mono text-xs text-slate-700 bg-white border border-slate-200 rounded px-2 py-1">
                      {sn}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${isExisting ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Shipment No.
                </label>
                <input
                  type="text"
                  name="shipmentNumber"
                  value={formData.shipmentNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., K1"
                  className={`${inputClass(false)} uppercase`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Box No.
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  name="boxNumber"
                  value={formData.boxNumber}
                  onChange={handleInputChange}
                  placeholder="e.g., 003"
                  className={inputClass(false)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Starting Machine No.
                </label>
                <input
                  type="number"
                  name="startMachineNumber"
                  value={formData.startMachineNumber}
                  onChange={handleInputChange}
                  placeholder="1"
                  min="1"
                  className={inputClass(false)}
                />
              </div>

              {isExisting && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    No. of Serials to Add
                  </label>
                  <input
                    type="number"
                    name="serialCount"
                    value={formData.serialCount}
                    onChange={handleInputChange}
                    placeholder={increaseQuantity ? 'e.g., 4' : `max ${unitsWithoutSerials}`}
                    min="1"
                    max={increaseQuantity ? undefined : unitsWithoutSerials || undefined}
                    className={inputClass(false)}
                  />
                </div>
              )}
            </div>

            {isExisting && (
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={increaseQuantity}
                  onChange={(e) => setIncreaseQuantity(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  These are new units (newly arrived stock) — increase the stock quantity by the number of serials added.
                  <span className="block text-xs text-slate-500">
                    {increaseQuantity
                      ? `Stock will go from ${selectedMachine.quantity} to ${selectedMachine.quantity + serialNumbers.length}.`
                      : `Leave unticked to assign serials to units already in stock (${unitsWithoutSerials} without serial numbers). Stock quantity stays ${selectedMachine.quantity}.`}
                  </span>
                </span>
              </label>
            )}

            {(serialInputUsed || (isExisting && formData.serialCount)) && (
              <div className="mt-4 sm:mt-6">
                {serialNumbers.length > 0 ? (
                  <>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      {serialNumbers.length} serial number{serialNumbers.length !== 1 ? 's' : ''} will be saved:
                    </p>
                    <div className="max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      {serialNumbers.map(sn => (
                        <span key={sn} className="font-mono text-sm text-slate-800 bg-white border border-slate-200 rounded px-2 py-1">
                          {sn}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    {isExisting
                      ? 'Enter the Shipment No., Box No. and No. of Serials to Add to see the serial numbers.'
                      : 'Enter the Shipment No., Box No. and a Quantity above 0 to see the serial numbers.'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm sm:text-base"
              disabled={loading}
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:scale-105 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-sm sm:text-base"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {isExisting ? 'Saving...' : 'Adding...'}
                </>
              ) : isExisting ? (
                <>
                  <TagIcon className="w-5 h-5 mr-2" />
                  Save Serial Numbers
                </>
              ) : (
                <>
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add to Inventory
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInventory;
