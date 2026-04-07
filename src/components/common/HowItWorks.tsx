import React from 'react';
import {
  Globe,
  Handshake,
  Search,
  Settings,
  TrendingUp,
  Users,
  Youtube,
  type LucideIcon,
} from 'lucide-react';

type StatItem = {
  icon: LucideIcon;
  value: string;
  label: string;
};

type FeatureItem = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const stats: StatItem[] = [
  {
    icon: Youtube,
    value: '500+',
    label: 'YouTube Campaigns Managed',
  },
  {
    icon: Globe,
    value: '12',
    label: 'Countries Served',
  },
  {
    icon: Users,
    value: '2,500+',
    label: 'Verified Creator Network',
  },
  {
    icon: TrendingUp,
    value: '3.2x',
    label: 'Average Campaign ROI',
  },
];

const features: FeatureItem[] = [
  {
    icon: Search,
    title: 'Find Verified YouTube Creators',
    description:
      'Stop guessing. We analyze your product and target market to find YouTube creators whose audience perfectly matches your ideal customer.',
  },
  {
    icon: Handshake,
    title: 'Negotiate Rates Within Budget',
    description:
      'No hidden fees or surprises. We use our industry experience to negotiate fair, transparent rates that fit your specific budget.',
  },
  {
    icon: Settings,
    title: 'Full Campaign Management',
    description:
      'From the initial creative brief to the final published video, we handle all the communication and logistics. You just approve the content.',
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="bg-white font-lexend">
      {/* Top Stats Bar */}
      <div className="w-full bg-gradient-to-r from-[#f7b047] via-[#ff9800] to-[#f7b047]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-y-10 py-10 md:grid-cols-4 md:gap-6 md:py-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="flex flex-col items-center justify-center text-center"
              >
                <stat.icon className="mb-4 h-7 w-7 text-[#0d1633]" strokeWidth={2} />
                <h3 className="text-4xl font-extrabold tracking-tight text-[#0d1633] md:text-5xl">
                  {stat.value}
                </h3>
                <p className="mt-3 text-sm font-medium text-[#26314d] md:text-lg">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-[#fcfcfc] py-20 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center rounded-full bg-[#f7efe5] px-5 py-2 text-sm font-bold uppercase tracking-wide text-[#f39a07]">
              Why CollabGlam
            </div>

            <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-[-0.03em] text-[#0d1633] sm:text-5xl lg:text-[72px]">
              We Help Your Brand Achieve{' '}
              <span className="text-[#f39a07]">3 Key Things</span>
            </h2>
          </div>

          {/* Cards */}
          <div className="mt-16 grid gap-8 lg:mt-20 lg:grid-cols-3">
            {features.map((item, index) => (
              <div
                key={index}
                className="rounded-[28px] border border-[#ececec] bg-white p-8 shadow-[0_8px_30px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_40px_rgba(16,24,40,0.08)] sm:p-10"
              >
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#fbf1e7]">
                  <item.icon className="h-8 w-8 text-[#f39a07]" strokeWidth={2.2} />
                </div>

                <h3 className="text-2xl font-extrabold leading-snug text-[#11182f] sm:text-[34px]">
                  {item.title}
                </h3>

                <p className="mt-6 text-lg leading-9 text-[#4b5565]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;