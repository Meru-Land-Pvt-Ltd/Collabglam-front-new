// src/pages/index.tsx
"use client";

import Features from "@/components/common/Features";
import Footer from "@/components/common/Footer";
import Header from "@/components/common/Header";
import Hero from "@/components/common/Hero";
import Credibility from "@/components/common/CredibilitySection";
import CreatorsMatchSection from "@/components/common/CreatorMatchSection";
import FAQ from "@/components/common/faq";
import HowItWorks from "@/components/common/HowItWorks";
import Pricing from "@/components/common/Pricing";
import SocialProof from "@/components/common/SocialProof";
import SuccessStories from "@/components/common/SuccessStories";
import React from "react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <HowItWorks />
      <Features />
      <Credibility />
      <CreatorsMatchSection />
      <SocialProof />
      {/* <SuccessStories /> */}
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  );
}
