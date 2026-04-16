import React from 'react';
import { TrendingUp, Users, DollarSign, Globe, Star, Zap } from 'lucide-react';

const SocialProof = () => {
  const metrics = [
    {
      icon: Users,
      value: "Verified",
      label: "Influencers",
      color: "from-[#FF8C00] to-[#FF5E7E]"
    },
    {
      icon: DollarSign,
      value: "Big",
      label: "Revenue",
      color: "from-[#FF8C00] to-[#FF5E7E]"
    },
    {
      icon: Globe,
      value: "160+",
      label: "Countries Served",
      color: "from-[#FF8C00] to-[#FF5E7E]"
    },
    {
      icon: TrendingUp,
      value: "300%",
      label: "Average Growth",
      color: "from-[#FF8C00] to-[#FF5E7E]"
    },
    {
      icon: Star,
      value: "4.9/5",
      label: "User Rating",
      color: "from-[#FF8C00] to-[#FF5E7E]"
    },
    {
      icon: Zap,
      value: "99.99%",
      label: "Deal Success Rate",
      color: "from-[#FF8C00] to-[#FF5E7E]"
    }
  ];

  return (
    <section className="py-16 bg-white font-lexend">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            Trusted by Brands & Creators Worldwide
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join the growing community of successful content creators who are scaling their businesses with Collabglam.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {metrics.map((metric, idx) => (
            <div
              key={idx}
              className="bg-gray-50 rounded-xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-100"
            >
              <div
                className={`w-12 h-12 mx-auto mb-4 rounded-full bg-gradient-to-r ${metric.color} flex items-center justify-center`}
              >
                <metric.icon className="h-6 w-6 text-white" />
              </div>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Additional Social Proof */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-8">Featured in</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-2xl font-bold text-gray-400">MHD Tech</div>
            <div className="text-2xl font-bold text-gray-400">Enoylity Technology</div>
            <div className="text-2xl font-bold text-gray-400">ShareMitra</div>
            <div className="text-2xl font-bold text-gray-400">BigBrands</div>
            <div className="text-2xl font-bold text-gray-400">BigInfluencers</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
