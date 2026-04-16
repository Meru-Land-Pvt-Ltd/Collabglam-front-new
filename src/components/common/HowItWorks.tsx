import React from 'react';
import { Upload, Share, DollarSign, Megaphone, UserCheck, Handshake } from 'lucide-react';

const HowItWorks = () => {
const steps = [
  {
    icon: Megaphone,
    title: "Launch Campaign",
    description:
      "Create and launch your brand’s campaign—set your goals, budget, and target audience to get started.",
    color: "from-[#FF8C00] to-[#FF5E7E]",
  },
  {
    icon: UserCheck,
    title: "Apply & Approve",
    description:
      "Influencers submit their proposals; you review their profiles and approve the perfect matches.",
    color: "from-[#FF8C00] to-[#FF5E7E]",
  },
  {
    icon: Handshake,
    title: "Collaborate",
    description:
      "Work hand-in-hand with your chosen influencers to drive results—and post more Campaigns.",
    color: "from-[#FF8C00] to-[#FF5E7E]",
  },
];

  return (
    <section id="how-it-works" className="py-20 bg-white font-lexend">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Three simple steps to launch your first collaboration and start earning.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={index}
              className="group relative text-center hover:scale-105 transition-all duration-300"
            >
              {/* Card */}
              <div className="bg-gray-50 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
                {/* Icon */}
                <div className={`w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-8 w-8 text-white" />
                </div>

                {/* Step Number */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-[#FF8C00] rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>

                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Connector Arrow (hidden on mobile) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2 z-10">
                  <div className="w-12 h-0.5 bg-gradient-to-r from-[#ef2f5b] to-purple-400"></div>
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-purple-400 border-t-2 border-b-2 border-t-transparent border-b-transparent"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;