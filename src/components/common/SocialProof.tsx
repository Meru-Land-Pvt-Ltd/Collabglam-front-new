import React from 'react';
import { Star } from 'lucide-react';

const testimonials = [
  {
    quote:
      '“CollabGlam made it incredibly easy to enter the US market. They found the perfect tech reviewers for our new power bank. The video generated over 150,000 views and a noticeable spike in our Amazon sales within the first week.”',
    name: 'David L.',
    role: 'Marketing Director',
    initials: 'DL',
  },
  {
    quote:
      '“We used to waste weeks emailing influencers who never replied. CollabGlam brought us 5 interested creators in two days. The ROI on our first campaign was 4x our spend. Highly recommended.”',
    name: 'Sarah W.',
    role: 'E-commerce Manager',
    initials: 'SW',
  },
  {
    quote:
      '“The transparency is what I appreciate most. We knew exactly what we were paying for, and the CollabGlam team handled all the stressful negotiations. The final video was exactly what we wanted.”',
    name: 'Michael T.',
    role: 'Founder',
    initials: 'MT',
  },
];

const SocialProof = () => {
  return (
    <>
      {/* Featured In */}
      <section className="bg-white py-16 font-lexend">
        <div className="mx-auto px-4 text-center sm:px-6 lg:px-8">
          <p className="mb-8 text-xl font-medium text-gray-600 sm:text-2xl">
            Featured in
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="text-3xl font-bold text-gray-400 sm:text-4xl">
              MHD Tech
            </div>
            <div className="text-3xl font-bold text-gray-400 sm:text-4xl">
              Enoylity Technology
            </div>
            <div className="text-3xl font-bold text-gray-400 sm:text-4xl">
              ShareMitra
            </div>
            <div className="text-3xl font-bold text-gray-400 sm:text-4xl">
              BigBrands
            </div>
            <div className="text-3xl font-bold text-gray-400 sm:text-4xl">
              BigInfluencers
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by Growing Brands */}
      <section id='testimonials'  className="bg-[#f7f5f4] py-20 font-lexend lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] text-[#0d1633] sm:text-5xl lg:text-[72px]">
              Trusted by Growing{' '}
              <span className="text-[#f59b00]">Brands</span>
            </h2>
          </div>

          <div className="mt-16 grid gap-8 lg:mt-20 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-[#ececec] bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(15,23,42,0.12)] sm:p-10"
              >
                <div className="mb-8 flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star
                      key={starIndex}
                      className="h-5 w-5 fill-[#f2c94c] text-[#f2c94c]"
                    />
                  ))}
                </div>

                <p className="min-h-[180px] text-[18px] leading-10 text-[#374151] italic">
                  {item.quote}
                </p>

                <div className="mt-10 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f59b00] text-xl font-extrabold text-white">
                    {item.initials}
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-[#11182f]">
                      {item.name}
                    </h3>
                    <p className="text-lg text-[#4b5565]">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default SocialProof;