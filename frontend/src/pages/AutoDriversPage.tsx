import React, { useEffect, useState, useCallback, useTransition } from 'react';
import { Phone, Search, Plus, CheckCircle2, Clock, Car, ShieldCheck, UserCheck, AlertCircle, X } from 'lucide-react';
import { getVerifiedAutoDrivers, suggestAutoDriver, getMyAutoDriverSuggestions } from '@/services/autoDrivers.service';
import type { AutoDriver } from '@/types/autoDriver';
import { useAuth } from '@/hooks';

export const AutoDriversPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'verified' | 'my-suggestions'>('verified');
  
  const [verifiedDrivers, setVerifiedDrivers] = useState<AutoDriver[]>([]);
  const [mySuggestions, setMySuggestions] = useState<AutoDriver[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Suggest Driver Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [, startTransition] = useTransition();

  const fetchDrivers = useCallback(async (query = '') => {
    setIsLoading(true);
    setError(null);
    try {
      if (activeTab === 'verified') {
        const data = await getVerifiedAutoDrivers(query);
        setVerifiedDrivers(data);
      } else {
        const data = await getMyAutoDriverSuggestions();
        setMySuggestions(data);
      }
    } catch (err) {
      console.error('Failed to load auto drivers:', err);
      setError('Failed to load drivers directory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDrivers(searchQuery);
  }, [fetchDrivers, searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    startTransition(() => {
      if (activeTab === 'verified') {
        fetchDrivers(val);
      }
    });
  };

  const handleCallDriver = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    window.location.href = `tel:${cleaned}`;
  };

  const handleOpenModal = () => {
    setFullName('');
    setPhoneNumber('');
    setVehicleNumber('');
    setNotes('');
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.replace(/\D/g, '');

    if (!cleanName) {
      setFormError('Driver name is required.');
      return;
    }

    if (cleanPhone.length !== 10) {
      setFormError('Phone number must be exactly 10 digits.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await suggestAutoDriver({
        full_name: cleanName,
        phone_number: cleanPhone,
        vehicle_number: vehicleNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setFormSuccess(res.message || 'Your driver suggestion has been submitted for review.');
      setTimeout(() => {
        setIsModalOpen(false);
        if (activeTab === 'my-suggestions') {
          fetchDrivers();
        }
      }, 2000);
    } catch (err: any) {
      console.error('Driver suggestion error:', err);
      const serverMsg = err.response?.data?.phone_number?.[0] || err.response?.data?.full_name?.[0] || err.response?.data?.message || 'Failed to submit driver suggestion.';
      setFormError(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentDriversList = activeTab === 'verified' ? verifiedDrivers : mySuggestions;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-2xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Car className="w-7 h-7 text-emerald-200" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Auto Drivers Directory</h1>
          </div>
          <p className="text-emerald-100 text-sm sm:text-base max-w-xl">
            Quickly find trusted campus auto drivers, call them directly, or suggest new drivers for community verification.
          </p>
        </div>

        {user && (
          <button
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-white text-emerald-700 font-semibold px-5 py-2.5 rounded-xl shadow-lg hover:bg-emerald-50 active:scale-95 transition duration-200 text-sm sm:text-base"
          >
            <Plus className="w-5 h-5" />
            Suggest Driver
          </button>
        )}
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl w-full md:w-auto">
          <button
            onClick={() => setActiveTab('verified')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'verified'
                ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Verified Drivers
          </button>

          {user && (
            <button
              onClick={() => setActiveTab('my-suggestions')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition ${
                activeTab === 'my-suggestions'
                  ? 'bg-white dark:bg-gray-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              My Suggestions
            </button>
          )}
        </div>

        {/* Real-time Search Input (Only shown on Verified tab) */}
        {activeTab === 'verified' && (
          <div className="relative flex-1 md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by driver name or phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
            />
          </div>
        )}
      </div>

      {/* Directory Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : currentDriversList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm">
          <Car className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">
            {activeTab === 'verified' ? 'No Drivers Found' : 'No Driver Suggestions Yet'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-6">
            {activeTab === 'verified'
              ? 'No verified auto drivers match your search query. Try searching by phone number or submit a new driver.'
              : 'You have not submitted any driver suggestions yet.'}
          </p>
          {user && (
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-5 py-2.5 rounded-xl shadow transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Suggest an Auto Driver
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentDriversList.map((driver) => (
            <div
              key={driver.id}
              className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Card Title & Verified Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1">
                    {driver.full_name}
                  </h3>
                  {driver.is_verified ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5" />
                      Pending Approval
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <p className="font-mono font-medium text-gray-800 dark:text-gray-200">
                    📞 {driver.phone_number}
                  </p>

                  {driver.vehicle_number && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🛺 Vehicle: <span className="font-semibold text-gray-700 dark:text-gray-300">{driver.vehicle_number}</span>
                    </p>
                  )}

                  {driver.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2">
                      "{driver.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Call Button */}
              <div className="mt-5 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleCallDriver(driver.phone_number)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-semibold py-2.5 rounded-xl shadow-sm transition text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Call {driver.phone_number}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suggest Driver Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Car className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Suggest an Auto Driver</h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Submit details of trusted campus auto drivers. Submissions require admin verification before becoming public.
            </p>

            {formError && (
              <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 p-3.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleSuggestSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Driver Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number (10 Digits) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g. 9876543210"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Number <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. AP 39 AB 1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Operating Route <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Operates between IIIT Campus and Railway Station; available at night."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AutoDriversPage;
