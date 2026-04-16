import React from 'react';
import * as Icons from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { featuresData } from '../data/content';

const Features = () => (
  <section id="features" className="py-20 bg-gray-50 font-lexend">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
          Powerful Features
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Everything you need to grow and scale
        </p>
      </div>

      <div className="space-y-20">
        {featuresData.map(({ icon, title, description, image }, i) => {
          const Icon = Icons[icon as keyof typeof Icons] as React.ElementType;
          const reverse = i % 2 === 1;
          return (
            <div
              key={title}
              className={`flex flex-col lg:flex-row items-center gap-12 ${
                reverse ? 'lg:flex-row-reverse' : ''
              }`}
            >
              {/* Text */}
              <div className="flex-1 lg:max-w-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#FFA135] to-[#FF7236] flex items-center justify-center mb-6">
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {title}
                </h3>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Image */}
              <div className="flex-1 lg:max-w-xl">
                <div className="relative">
                  <img
                    src={image}
                    alt={title}
                    className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default Features;
