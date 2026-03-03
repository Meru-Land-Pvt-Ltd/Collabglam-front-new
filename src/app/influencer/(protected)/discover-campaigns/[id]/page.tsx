"use client";

import React from "react";
import {
  MapPin,
  Clock,
  UsersThree,
  Tag,
  CurrencyDollar,
  BookmarkSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/buttonComp";
import { Badge } from "@/components/ui/badge";

/* -------------------------------------------------------------------------- */
/*                              DUMMY DATA                                    */
/* -------------------------------------------------------------------------- */

const campaign = {
  id: 1,
  title: "Summer Fashion Collection Launch",
  brand: "Fashion Nova",
  description:
    "Collaborate with a leading fashion brand to showcase their new summer collection. We are looking for creators who can produce high-quality lifestyle and outfit content that resonates with Gen Z and young millennials.",
  image:
    "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=1400",
  budget: 5000,
  daysLeft: 3,
  match: 92,
  category: "Fashion",
  targetAge: "18–24",
  location: "United States",
  goals: ["Brand Awareness", "Product Launch"],
};

/* -------------------------------------------------------------------------- */
/*                              PAGE COMPONENT                                */
/* -------------------------------------------------------------------------- */

const CampaignDetailsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">

        {/* ---------------- HERO IMAGE ---------------- */}
        <div className="relative w-full h-[380px] rounded-3xl overflow-hidden shadow-sm">
          <img
            src={campaign.image}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />

          {/* Match Badge */}
          <div className="absolute top-6 right-6">
            <Badge className="bg-black text-white text-sm px-4 py-1">
              {campaign.match}% Match
            </Badge>
          </div>
        </div>

        {/* ---------------- HEADER SECTION ---------------- */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {campaign.title}
            </h1>
            <p className="text-gray-500 mt-2 text-sm">
              by {campaign.brand}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Button className="flex items-center gap-2">
              <BookmarkSimple size={18} />
              Save
            </Button>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
              Apply Now
            </Button>
          </div>
        </div>

        {/* ---------------- META INFO ---------------- */}
        <div className="grid md:grid-cols-4 gap-6 bg-white p-6 rounded-2xl shadow-sm">

          <div className="flex items-center gap-3">
            <CurrencyDollar size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Budget</p>
              <p className="font-semibold text-gray-900">
                ${campaign.budget.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Time Left</p>
              <p className="font-semibold text-gray-900">
                {campaign.daysLeft} days
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <UsersThree size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Target Age</p>
              <p className="font-semibold text-gray-900">
                {campaign.targetAge}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Location</p>
              <p className="font-semibold text-gray-900">
                {campaign.location}
              </p>
            </div>
          </div>

        </div>

        {/* ---------------- DESCRIPTION ---------------- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Campaign Overview
            </h2>
            <p className="text-gray-600 mt-3 leading-7">
              {campaign.description}
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Goals
            </h3>
            <div className="flex flex-wrap gap-3">
              {campaign.goals.map((goal, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-1"
                >
                  <Tag size={14} />
                  {goal}
                </Badge>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CampaignDetailsPage;