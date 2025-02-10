import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Warehouse, 
  Building,
  Save,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface ValidationErrors {
  companyName?: string;
  firstName?: string;
  lastName?: string;
  warehouse?: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  security?: {
    sessionTimeout?: string;
    passwordExpiry?: string;
  };
}

const Settings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [settings, setSettings] = useState({
    companyName: '',
    email: '',
    firstName: '',
    lastName: '',
    notifications: {
      lowStock: false,
      newOrders: false,
      reports: false
    },
    warehouse: {
      name: '',
      address: '',
      city: '',
      country: ''
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30',
      passwordExpiry: '90'
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const validateName = (value: string): string => {
    if (!value.trim()) return 'This field is required';
    if (value.length < 2) return 'Must be at least 2 characters';
    if (value.length > 50) return 'Must be less than 50 characters';
    if (!/^[a-zA-Z0-9\s-'&,.]+$/.test(value)) return 'Contains invalid characters';
    return '';
  };

  const validateAddress = (value: string): string => {
    if (!value.trim()) return 'This field is required';
    if (value.length < 5) return 'Must be at least 5 characters';
    if (value.length > 100) return 'Must be less than 100 characters';
    return '';
  };

  const validateCity = (value: string): string => {
    if (!value.trim()) return 'This field is required';
    if (value.length < 2) return 'Must be at least 2 characters';
    if (value.length > 50) return 'Must be less than 50 characters';
    if (!/^[a-zA-Z\s-']+$/.test(value)) return 'Contains invalid characters';
    return '';
  };

  const validateCountry = (value: string): string => {
    if (!value.trim()) return 'This field is required';
    if (value.length < 2) return 'Must be at least 2 characters';
    if (value.length > 50) return 'Must be less than 50 characters';
    if (!/^[a-zA-Z\s-']+$/.test(value)) return 'Contains invalid characters';
    return '';
  };

  const validateNumber = (value: string, min: number, max: number): string => {
    const num = parseInt(value);
    if (isNaN(num)) return 'Must be a valid number';
    if (num < min) return `Must be at least ${min}`;
    if (num > max) return `Must be less than ${max}`;
    if (!Number.isInteger(num)) return 'Must be a whole number';
    return '';
  };

  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Profile validation
    if (activeSection === 'profile') {
      const firstNameError = validateName(settings.firstName);
      const lastNameError = validateName(settings.lastName);
      if (firstNameError) errors.firstName = firstNameError;
      if (lastNameError) errors.lastName = lastNameError;
    }

    // Company validation
    if (activeSection === 'company') {
      const companyNameError = validateName(settings.companyName);
      if (companyNameError) errors.companyName = companyNameError;
    }

    // Warehouse validation
    if (activeSection === 'warehouse') {
      errors.warehouse = {};
      const nameError = validateName(settings.warehouse.name);
      const addressError = validateAddress(settings.warehouse.address);
      const cityError = validateCity(settings.warehouse.city);
      const countryError = validateCountry(settings.warehouse.country);

      if (nameError) errors.warehouse.name = nameError;
      if (addressError) errors.warehouse.address = addressError;
      if (cityError) errors.warehouse.city = cityError;
      if (countryError) errors.warehouse.country = countryError;

      if (Object.keys(errors.warehouse).length === 0) {
        delete errors.warehouse;
      }
    }

    // Security validation
    if (activeSection === 'security') {
      errors.security = {};
      const sessionTimeoutError = validateNumber(settings.security.sessionTimeout, 1, 1440); // Max 24 hours
      const passwordExpiryError = validateNumber(settings.security.passwordExpiry, 1, 365); // Max 1 year

      if (sessionTimeoutError) errors.security.sessionTimeout = sessionTimeoutError;
      if (passwordExpiryError) errors.security.passwordExpiry = passwordExpiryError;

      if (Object.keys(errors.security).length === 0) {
        delete errors.security;
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (settingsError && settingsError.code !== 'PGRST116') {
        throw settingsError;
      }

      setSettings({
        email: user.email || '',
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        companyName: userSettings?.company_name || 'WareFlow Inc.',
        notifications: userSettings?.notifications || settings.notifications,
        warehouse: userSettings?.warehouse || settings.warehouse,
        security: userSettings?.security || settings.security
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      setIsSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No user found');
      }

      const { error: userError } = await supabase.auth.updateUser({
        data: {
          first_name: settings.firstName,
          last_name: settings.lastName
        }
      });

      if (userError) throw userError;

      const { error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          company_name: settings.companyName,
          notifications: settings.notifications,
          warehouse: settings.warehouse,
          security: settings.security
        }, {
          onConflict: 'user_id'
        });

      if (settingsError) throw settingsError;

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const renderValidationError = (error: string | undefined) => {
    if (!error) return null;
    return (
      <div className="flex items-center gap-1 mt-1">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <p className="text-sm text-red-600">{error}</p>
      </div>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={settings.firstName}
                  onChange={(e) => {
                    setSettings({ ...settings, firstName: e.target.value });
                    if (validationErrors.firstName) {
                      setValidationErrors({ ...validationErrors, firstName: undefined });
                    }
                  }}
                  onBlur={() => {
                    const error = validateName(settings.firstName);
                    if (error) {
                      setValidationErrors({ ...validationErrors, firstName: error });
                    }
                  }}
                  className={`w-full p-2 border ${
                    validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your first name"
                />
                {renderValidationError(validationErrors.firstName)}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={settings.lastName}
                  onChange={(e) => {
                    setSettings({ ...settings, lastName: e.target.value });
                    if (validationErrors.lastName) {
                      setValidationErrors({ ...validationErrors, lastName: undefined });
                    }
                  }}
                  onBlur={() => {
                    const error = validateName(settings.lastName);
                    if (error) {
                      setValidationErrors({ ...validationErrors, lastName: error });
                    }
                  }}
                  className={`w-full p-2 border ${
                    validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your last name"
                />
                {renderValidationError(validationErrors.lastName)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-sm text-gray-500">Email address cannot be changed</p>
            </div>
          </div>
        );

      case 'company':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => {
                  setSettings({ ...settings, companyName: e.target.value });
                  if (validationErrors.companyName) {
                    setValidationErrors({ ...validationErrors, companyName: undefined });
                  }
                }}
                onBlur={() => {
                  const error = validateName(settings.companyName);
                  if (error) {
                    setValidationErrors({ ...validationErrors, companyName: error });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.companyName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.companyName)}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400 shrink-0" />
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        [key]: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        );

      case 'warehouse':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Warehouse Name
              </label>
              <input
                type="text"
                value={settings.warehouse.name}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    warehouse: { ...settings.warehouse, name: e.target.value }
                  });
                  if (validationErrors.warehouse?.name) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, name: undefined }
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateName(settings.warehouse.name);
                  if (error) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, name: error }
                    });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.warehouse?.name ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.warehouse?.name)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={settings.warehouse.address}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    warehouse: { ...settings.warehouse, address: e.target.value }
                  });
                  if (validationErrors.warehouse?.address) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, address: undefined }
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateAddress(settings.warehouse.address);
                  if (error) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, address: error }
                    });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.warehouse?.address ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.warehouse?.address)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={settings.warehouse.city}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    warehouse: { ...settings.warehouse, city: e.target.value }
                  });
                  if (validationErrors.warehouse?.city) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, city: undefined }
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateCity(settings.warehouse.city);
                  if (error) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, city: error }
                    });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.warehouse?.city ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.warehouse?.city)}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={settings.warehouse.country}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    warehouse: { ...settings.warehouse, country: e.target.value }
                  });
                  if (validationErrors.warehouse?.country) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, country: undefined }
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateCountry(settings.warehouse.country);
                  if (error) {
                    setValidationErrors({
                      ...validationErrors,
                      warehouse: { ...validationErrors.warehouse, country: error }
                    });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.warehouse?.country ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.warehouse?.country)}
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-gray-400" />
                <div>
                  <span className="text-gray-700">Two-Factor Authentication</span>
                  <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.security.twoFactor}
                  onChange={(e) => setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      twoFactor: e.target.checked
                    }
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                min="1"
                max="1440"
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      sessionTimeout: e.target.value
                    }
                  });
                  if (validationErrors.security?.sessionTimeout) {
                    setValidationErrors({
                      ...validationErrors,
                      security: { ...validationErrors.security, sessionTimeout: undefined }
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateNumber(settings.security.sessionTimeout, 1, 1440);
                  if (error) {
                    setValidationErrors({
                      ...validationErrors,
                      security: { ...validationErrors.security, sessionTimeout: error }
                    });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.security?.sessionTimeout ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.security?.sessionTimeout)}
              <p className="mt-1 text-sm text-gray-500">
                Enter a value between 1 and 1440 minutes (24 hours)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password Expiry (days)
              </label>
              <input
                type="number"
                value={settings.security.passwordExpiry}
                min="1"
                max="365"
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    security: {
                      ...settings.security,
                      passwordExpiry: e.target.value
                    }
                  });
                  if (validationErrors.security?.passwordExpiry) {
                    setValidationErrors({
                      ...validationErrors,
                      security: { ...validationErrors.security, passwordExpiry: undefined }
                    });
                  }
                }}
                onBlur={() => {
                  const error = validateNumber(settings.security.passwordExpiry, 1, 365);
                  if (error) {
                    setValidationErrors({
                      ...validationErrors,
                      security: { ...validationErrors.security, passwordExpiry: error }
                    });
                  }
                }}
                className={`w-full p-2 border ${
                  validationErrors.security?.passwordExpiry ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {renderValidationError(validationErrors.security?.passwordExpiry)}
              <p className="mt-1 text-sm text-gray-500">
                Enter a value between 1 and 365 days (1 year)
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const menuItems = [
    { icon: User, label: 'Profile', id: 'profile' },
    { icon: Building, label: 'Company', id: 'company' },
    { icon: Bell, label: 'Notifications', id: 'notifications' },
    { icon: Warehouse, label: 'Warehouse', id: 'warehouse' },
    { icon: Shield, label: 'Security', id: 'security' },
  ];

  const activeItem = menuItems.find(item => item.id === activeSection);
  const ActiveIcon = activeItem?.icon;

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and warehouse settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id);
                    setValidationErrors({});
                  }}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg text-gray-700 hover:bg-gray-50 whitespace-nowrap transition-colors ${
                    activeSection === item.id ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              {ActiveIcon && <ActiveIcon className="w-5 h-5 text-blue-600" />}
              {activeItem?.label} Settings
            </h2>
            {renderSection()}
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving || Object.keys(validationErrors).length > 0}
              className="btn btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="whitespace-nowrap">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span className="whitespace-nowrap">Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;