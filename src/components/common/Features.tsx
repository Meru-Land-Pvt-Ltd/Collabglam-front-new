import React from 'react';
import { ClipboardList, Rocket, UsersRound } from 'lucide-react';

const processSteps = [
  {
    id: '01',
    icon: ClipboardList,
    title: 'Submit Your Product & Budget',
    description:
      'Tell us what you are selling and how much you want to spend. It takes less than 60 seconds.',
  },
  {
    id: '02',
    icon: UsersRound,
    title: 'Receive Creator Matches (48–72 Hours)',
    description:
      'We send you 3 to 5 hand-picked YouTube creator profiles, complete with their confirmed rates and audience data.',
  },
  {
    id: '03',
    icon: Rocket,
    title: 'Pick Your Creator & We Manage the Rest',
    description:
      'You choose the creator you like best. We handle the product shipping, video briefing, and ensure the video is published on time.',
  },
];

const Features = () => {
  return (
    <section id="features" className="bg-[#f7f4f4] py-24 font-lexend sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-6xl text-center">
          <div className="inline-flex items-center rounded-full bg-[#f6eadb] px-6 py-2 text-sm font-bold uppercase tracking-wide text-[#f59b00]">
            Simple Process
          </div>

          <h2 className="mt-8 text-4xl font-extrabold leading-tight tracking-[-0.03em] text-[#0d1633] sm:text-5xl lg:text-[72px]">
            Launch Your Campaign in{' '}
            <span className="text-[#f59b00]">3 Simple Steps</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="mt-20 grid gap-14 md:grid-cols-3 md:gap-10 lg:mt-24 lg:gap-14">
          {processSteps.map((step) => {
            const Icon = step.icon;

            return (
              <div key={step.id} className="text-center">
                <div className="relative mx-auto mb-10 flex h-[108px] w-[108px] items-center justify-center rounded-full border-2 border-[#f3d5a9] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                  <Icon className="h-10 w-10 text-[#f59b00]" strokeWidth={2.2} />

                  <div className="absolute right-0 top-0 flex h-10 w-10 translate-x-[10%] -translate-y-[8%] items-center justify-center rounded-full bg-[#ffa000] text-sm font-extrabold text-white shadow-md">
                    {step.id}
                  </div>
</div>

                <h3 className="mx-auto max-w-md text-2xl font-extrabold leading-snug text-[#11182f] sm:text-[26px]">
                  {step.title}
</h3>

                <p className="mx-auto mt-5 max-w-md text-lg leading-9 text-[#465466]">
                  {step.description}
                </p>
</div>
            );
          })}
        </div>
</div>
    </section>
  );
};

export default Features;