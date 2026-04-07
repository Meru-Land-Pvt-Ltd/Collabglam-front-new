import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const CredibilitySection = () => {
  const highlights = [
    '500+ campaigns successfully delivered',
    '2.5 billion monthly YouTube users reached',
    '70% of viewers buy after YouTube discovery',
  ];

  return (
    <section className="overflow-hidden bg-[#06133a] py-20 font-lexend lg:py-24">
        
      <div className="w-full pl-6 pr-0 sm:pl-8 sm:pr-0 lg:pl-12 lg:pr-0 xl:pl-16">
        <div className="grid items-center gap-12 lg:grid-cols-[660px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[720px_minmax(0,1fr)]">
          {/* Left Content */}
          <div className="w-full text-left">
            <div className="inline-flex items-center rounded-full bg-white/10 px-5 py-2 text-sm font-bold uppercase tracking-wide text-[#f5a000]">
              Our Expertise
            </div>

            <h2 className="mt-6 text-left text-4xl font-extrabold leading-[0.98] tracking-[-0.03em] text-white sm:text-5xl lg:text-[72px]">
              <span className="block">
                Built by YouTube{' '}
                <span className="text-[#f5a000]">Campaign</span>
              </span>
              <span className="block text-[#f5a000]">Experts</span>
            </h2>

            <p className="mt-8 max-w-[640px] text-left text-lg leading-9 text-white/80">
              CollabGlam was built by a team that has successfully managed over
              500 YouTube brand campaigns. We understand the ecosystem from both
              sides—we know exactly what brands need to see a return on
              investment, and we know what creators expect to produce their best
              work.
            </p>

            <p className="mt-8 max-w-[640px] text-left text-lg leading-9 text-white/80">
              Video marketing is no longer optional. YouTube reaches over 2.5
              billion active users monthly, and 70% of viewers have bought a
              brand as a result of seeing it on YouTube. We bridge the gap
              between your brand and those viewers.
            </p>

            <div className="mt-10 space-y-5">
              {highlights.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-[#f5a000]" />
                  <span className="text-lg font-medium text-white/90">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Image */}
          <div className="relative w-full justify-self-end pr-6 sm:pr-8 lg:pr-10 xl:pr-12">
            <div className="ml-auto w-full max-w-[980px] overflow-hidden rounded-[28px] shadow-2xl">
              <img
                src="/brand/credibility-team.png"
                alt="CollabGlam campaign experts team"
                className="block h-[360px] w-full object-cover object-center sm:h-[430px] lg:h-[540px] xl:h-[620px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CredibilitySection;