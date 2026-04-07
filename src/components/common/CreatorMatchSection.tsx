'use client';

import React, { useState } from 'react';
import { post } from '@/lib/api';
import Swal from 'sweetalert2';

const productOptions = [
  'Tech Gadgets',
  'Beauty & Skincare',
  'Fashion & Apparel',
  'Home & Living',
  'Fitness & Wellness',
  'Food & Beverage',
  'Software / SaaS',
  'Other',
];

const budgetOptions = [
  '$500 - $1,000',
  '$1,000 - $3,000',
  '$3,000 - $5,000',
  '$5,000 - $10,000',
  '$10,000+',
];

const marketOptions = [
  'United States',
  'United Kingdom',
  'Canada',
  'Europe',
  'India',
  'Global',
];

const CreatorMatchPage = () => {
  const [formData, setFormData] = useState({
    productType: '',
    budget: '',
    market: '',
    email: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsSubmitting(true);

    try {
      const response = await post('/matched-creator/create', formData);

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text:
          response?.message || 'Creator match request submitted successfully.',
        confirmButtonColor: '#f59b00',
      });

      setFormData({
        productType: '',
        budget: '',
        market: '',
        email: '',
      });
    } catch (error: any) {
      await Swal.fire({
        icon: 'error',
        title: 'Submission Failed',
        text:
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong while submitting the form.',
        confirmButtonColor: '#f59b00',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-screen bg-[#f8f8f8] py-16 font-lexend sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-[-0.03em] text-[#0d1633] sm:text-5xl lg:text-[72px]">
            Get Matched With Creators
          </h1>

          <p className="mt-5 text-lg leading-8 text-[#4b5565] sm:text-xl">
            Tell us about your brand and we&apos;ll send you hand-picked creator
            matches in 48-72 hours.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-3xl rounded-[28px] border border-[#e8e8e8] bg-white px-6 py-8 shadow-[0_10px_40px_rgba(15,23,42,0.05)] sm:px-10 sm:py-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label
                htmlFor="productType"
                className="mb-3 block text-lg font-bold text-[#11182f]"
              >
                What type of product are you selling?
              </label>
              <select
                id="productType"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="h-16 w-full rounded-2xl border border-[#d9d9d9] bg-white px-5 text-lg text-[#11182f] outline-none transition focus:border-[#f59b00] focus:ring-2 focus:ring-[#f59b00]/15"
                required
              >
                <option value="">Select category...</option>
                {productOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="budget"
                className="mb-3 block text-lg font-bold text-[#11182f]"
              >
                What is your campaign budget?
              </label>
              <select
                id="budget"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                className="h-16 w-full rounded-2xl border border-[#d9d9d9] bg-white px-5 text-lg text-[#11182f] outline-none transition focus:border-[#f59b00] focus:ring-2 focus:ring-[#f59b00]/15"
                required
              >
                <option value="">Select budget...</option>
                {budgetOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="market"
                className="mb-3 block text-lg font-bold text-[#11182f]"
              >
                Where are your primary customers?
              </label>
              <select
                id="market"
                name="market"
                value={formData.market}
                onChange={handleChange}
                className="h-16 w-full rounded-2xl border border-[#d9d9d9] bg-white px-5 text-lg text-[#11182f] outline-none transition focus:border-[#f59b00] focus:ring-2 focus:ring-[#f59b00]/15"
                required
              >
                <option value="">Select market...</option>
                {marketOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-3 block text-lg font-bold text-[#11182f]"
              >
                Where should we send your matches?
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@yourbrand.com"
                value={formData.email}
                onChange={handleChange}
                className="h-16 w-full rounded-2xl border border-[#d9d9d9] bg-white px-5 text-lg text-[#11182f] placeholder:text-[#9aa0ab] outline-none transition focus:border-[#f59b00] focus:ring-2 focus:ring-[#f59b00]/15"
                required
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-16 w-full items-center justify-center rounded-2xl bg-[#f59b00] px-6 text-xl font-extrabold text-white transition hover:bg-[#e89200] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting
                  ? 'Submitting...'
                  : 'Get Your Creator Matches — Free'}
              </button>
            </div>

            <p className="pt-2 text-center text-base text-[#5b6472] sm:text-lg">
              No subscription. No software fees. You only pay when a campaign
              runs.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default CreatorMatchPage;