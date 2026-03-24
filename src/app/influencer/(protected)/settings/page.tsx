"use client"
import React, { useState } from 'react';
import { Menu, X, User, Bell, Lock, Palette, Code, CreditCard, ChevronRight, Copy, Eye, EyeOff } from 'lucide-react';

export default function SettingsUI() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toggles, setToggles] = useState({
    emailNotifications: true,
    pushNotifications: false,
    twoFactor: true,
    darkMode: false,
    apiKey: true,
    webhooks: true,
    emailInvoices: true,
    pdfDownload: true,
    invoiceReminders: false,
    weeklyNotifications: true
  });
  const [showApiKey, setShowApiKey] = useState(false);

  const menuItems = [
    { id: 'account', label: 'Account Settings', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    // { id: 'api', label: 'API & Webhooks', icon: Code },
    // { id: 'integrations', label: 'Integrations', icon: Code },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'payment', label: 'Payment Preferences', icon: CreditCard }
  ];

  const toggleSwitch = (key: keyof typeof toggles) => {
    setToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-12 pb-8 border-b border-slate-200">
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
        <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        <button
          className="px-6 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-lg flex-shrink-0"
          style={{ backgroundColor: '#FBBF00' }}
        >
          Save
        </button>
      </div>
      <div className="space-y-4 mt-6">
        {children}
      </div>
    </div>
  );

  const FormInput = ({ label, placeholder, type = 'text', value = '' }: { label: string; placeholder: string; type?: string; value?: string }) => (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        defaultValue={value}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-yellow-400 text-slate-900"
      />
    </div>
  );

const ToggleItem = ({ label, description, toggleKey }: { label: string; description?: string; toggleKey: keyof typeof toggles }) => (
    <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-slate-300 bg-white">
      <div className="flex-1">
        <p className="font-medium text-slate-900">{label}</p>
        {description && <p className="text-sm text-slate-600">{description}</p>}
      </div>
      <button
        onClick={() => toggleSwitch(toggleKey)}
        className={`relative w-12 h-6 rounded-full transition-colors ml-4 flex-shrink-0`}
        style={{ backgroundColor: toggles[toggleKey] ? '#FBBF00' : '#d1d5db' }}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${toggles[toggleKey] ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-slate-50 border-r border-slate-200 transition-all duration-300 overflow-hidden md:w-64 flex-shrink-0`}>
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg" style={{ backgroundColor: '#FBBF00' }} />
            <span className="font-bold text-slate-900">Settings</span>
          </div>
          <nav className="space-y-2">
            {menuItems.map(item => {
              const Icon = item.icon;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-700 hover:bg-white"
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 md:p-12">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden mb-6 p-2 hover:bg-slate-100 rounded-lg"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Account Settings */}
          <div id="account">
            <SettingSection title="Account Settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="First Name" placeholder="John" value="John" />
                <FormInput label="Last Name" placeholder="Doe" value="Doe" />
              </div>
              <FormInput label="Email Address" placeholder="john@example.com" type="email" value="john@example.com" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput label="Phone Number" placeholder="+1 (555) 000-0000" value="+1 (555) 123-4567" />
                <FormInput label="Country" placeholder="United States" value="United States" />
              </div>
            </SettingSection>
          </div>

          {/* Notifications */}
          <div id="notifications">
            <SettingSection title="Notifications">
              <ToggleItem label="Email Notifications" description="Receive updates via email" toggleKey="emailNotifications" />
              <ToggleItem label="Push Notifications" description="Browser push notifications" toggleKey="pushNotifications" />
              <ToggleItem label="Weekly Summary" description="Get a weekly summary of your activity" toggleKey="weeklyNotifications" />
            </SettingSection>
          </div>

          {/* Privacy & Security */}
          <div id="privacy">
            <SettingSection title="Privacy & Security">
              <ToggleItem label="Two-Factor Authentication" description="Add an extra layer of security" toggleKey="twoFactor" />
              <div className="space-y-4">
                <FormInput label="Current Password" type="password" placeholder="••••••••" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput label="New Password" type="password" placeholder="••••••••" />
                  <FormInput label="Confirm Password" type="password" placeholder="••••••••" />
                </div>
              </div>
            </SettingSection>
          </div>

          {/* Appearance */}
          <div id="appearance">
            <SettingSection title="Appearance">
              <ToggleItem label="Dark Mode" description="Use dark theme for the interface" toggleKey="darkMode" />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Color Scheme</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { name: 'Light', bg: 'bg-white', border: 'border-2 border-slate-300' },
                    { name: 'Dark', bg: 'bg-slate-900', border: 'border-2 border-slate-700' },
                    { name: 'System', bg: 'bg-gradient-to-r from-white to-slate-900', border: 'border-2 border-slate-400' }
                  ].map(theme => (
                    <div key={theme.name} className={`h-20 rounded-lg ${theme.bg} ${theme.border} cursor-pointer hover:shadow-lg transition-shadow flex items-center justify-center`}>
                      <span className={`text-sm font-medium ${theme.bg === 'bg-white' ? 'text-slate-900' : 'text-white'}`}>{theme.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SettingSection>
          </div>
          {/* Billing */}
          <div id="billing">
            <SettingSection title="Billing & Plan">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-600">Current Plan</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">Professional</p>
                  <p className="text-sm text-slate-600 mt-2">$29/month</p>
                </div>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-600">Renewal Date</p>
                  <p className="text-2xl font-bold text-slate-900 mt-2">Mar 15, 2024</p>
                  <p className="text-sm text-slate-600 mt-2">Auto-renewal enabled</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                <div className="flex items-center gap-4 p-4 border border-slate-200 rounded-lg bg-white">
                  <div className="w-12 h-8 bg-gradient-to-r from-slate-900 to-slate-700 rounded" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">Visa ending in 4242</p>
                    <p className="text-sm text-slate-600">Expires 12/25</p>
                  </div>
                  <button className="text-slate-600 hover:text-slate-900">Edit</button>
                </div>
              </div>
            </SettingSection>
          </div>

          {/* Payment Preferences */}
          <div id="payment">
            <SettingSection title="Payment Preferences">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Billing Frequency</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Monthly', price: '$29/month', active: true },
                    { label: 'Annually', price: '$290/year', active: false }
                  ].map(option => (
                    <button
                      key={option.label}
                      className={`p-4 border-2 rounded-lg transition-all text-left ${option.active
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{option.label}</p>
                          <p className="text-sm text-slate-600">{option.price}</p>
                        </div>
                        {option.active && (
                          <div className="w-5 h-5 rounded-full" style={{ backgroundColor: '#FBBF00' }} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Currency</label>
                <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-yellow-400 text-slate-900">
                  <option>USD - United States Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                  <option>JPY - Japanese Yen</option>
                  <option>CAD - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Invoice Settings</label>
                <div className="space-y-3">
                  <ToggleItem label="Email Invoices" description="Receive invoice copies via email" toggleKey="emailInvoices" />
                  <ToggleItem label="PDF Download" description="Download invoices as PDF" toggleKey="pdfDownload" />
                  <ToggleItem label="Invoice Reminders" description="Get reminders before payment due date" toggleKey="invoiceReminders" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Saved Payment Methods</label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded" />
                      <div>
                        <p className="font-medium text-slate-900">Mastercard</p>
                        <p className="text-sm text-slate-600">•••• •••• •••• 5678</p>
                      </div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 font-medium text-sm">Remove</button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white hover:border-slate-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-8 bg-gradient-to-r from-slate-900 to-slate-700 rounded" />
                      <div>
                        <p className="font-medium text-slate-900">Visa</p>
                        <p className="text-sm text-slate-600">•••• •••• •••• 4242</p>
                      </div>
                    </div>
                    <button className="text-red-600 hover:text-red-700 font-medium text-sm">Remove</button>
                  </div>
                  <button
                    className="w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-lg font-medium text-slate-700 hover:border-slate-400 transition-colors"
                  >
                    + Add Payment Method
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-4">Refund Policy</label>
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
                  <p className="text-sm text-slate-600">30-day refund guarantee. If you're not satisfied with your plan, contact support for a full refund within 30 days of purchase.</p>
                </div>
              </div>
            </SettingSection>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="h-1 w-16 rounded-full" style={{ backgroundColor: '#FBBF00' }} />
              <p className="text-sm text-slate-600">All changes are saved automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}