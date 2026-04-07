'use client';

import React from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Hero = () => {
  const router = useRouter();

  const handlePrimaryClick = () => {
    router.push('/brand/login');
  };

  const handleSecondaryClick = () => {
    const section = document.getElementById('how-it-works');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    router.push('/brand/login');
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-white font-lexend lg:pt-20"
    >
      <div className="relative min-h-[calc(100vh-96px)] w-full overflow-hidden bg-[#071426]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/brand/hero-bg.png')" }}
        />

        {/* Overlays */}
        <div className="absolute inset-0 bg-[#061120]/72" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071426]/95 via-[#071426]/82 to-[#071426]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071426] via-transparent to-transparent" />

        {/* Decorative shapes */}
        <div className="absolute -left-24 top-0 h-full w-[320px] rotate-12 bg-[#0d1b33]/40 blur-sm" />
        <div className="absolute left-[28%] top-[10%] h-[360px] w-[360px] rounded-full border-[24px] border-white/6" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center px-6 py-20 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-[#f6a019]/35 bg-[#1b2437]/85 px-5 py-3 text-sm font-semibold text-[#f6a019] shadow-[0_0_0_1px_rgba(246,160,25,0.06)] backdrop-blur-sm">
              <span className="h-2.5 w-2.5 rounded-full bg-[#f6a019]" />
              <span>500+ YouTube Campaigns Managed</span>
            </div>

            {/* Heading */}
            <h1 className="max-w-4xl text-5xl font-extrabold leading-[1.02] tracking-[-0.03em] text-white sm:text-6xl lg:text-[88px]">
              <span className="block">Get Your Product</span>
              <span className="block">Reviewed by</span>
              <span className="mt-2 block text-[#f6a019]">Verified YouTube</span>
              <span className="block text-[#f6a019]">Creators.</span>
            </h1>

            {/* Description */}
            <p className="mt-8 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
              Frustrated by expensive agencies and unresponsive influencers? We
              match your brand with the right YouTube creators, negotiate the best
              rates, and manage the entire campaign—so you can focus on sales.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <button
                onClick={handlePrimaryClick}
                className="group inline-flex items-center justify-center rounded-2xl bg-[#f6a019] px-8 py-5 text-base font-bold text-white shadow-lg shadow-[#f6a019]/20 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ffab1f]"
              >
                <span>Get Matched With Creators — Free</span>
                <ArrowRight className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>

              <button
                onClick={handleSecondaryClick}
                className="group inline-flex items-center gap-3 text-base font-semibold text-white/90 transition-colors duration-300 hover:text-white"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/5 backdrop-blur-sm transition-all duration-300 group-hover:border-white/40 group-hover:bg-white/10">
                  <PlayCircle className="h-6 w-6" />
                </span>
                <span>See How It Works</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;