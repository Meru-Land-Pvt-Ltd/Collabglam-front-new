'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqItems = [
  {
    question: 'How do you find the right creators for my brand?',
    answer:
      'We use a combination of data analysis and human expertise. We look at your product category, target audience, and budget, then search our network of 2,500+ verified creators to find the perfect match based on their past performance and audience demographics.',
  },
  {
    question: 'How long does a typical campaign take?',
    answer:
      'Most campaigns take between 2 to 6 weeks depending on creator availability, product shipping timelines, revisions, and publishing schedules.',
  },
  {
    question: 'What if I am not satisfied with the creator matches?',
    answer:
      'If the initial matches do not feel right, we refine the shortlist and provide alternative creators that better fit your brand, audience, and campaign goals.',
  },
  {
    question: 'Is there a minimum budget required?',
    answer:
      'We work with a range of campaign budgets. The ideal budget depends on your product category, creator tier, and target market.',
  },
  {
    question: 'Do you work with Amazon sellers?',
    answer:
      'Yes. We regularly work with Amazon sellers and help them connect with YouTube creators who can drive awareness, trust, and sales.',
  },
];

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(-1);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id='faq' className="bg-[#f7f4f4] py-20 font-lexend lg:py-24">
        
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center">
          <h2 className="text-4xl font-extrabold leading-tight tracking-[-0.03em] text-[#0b1633] sm:text-5xl lg:text-[72px]">
            Frequently Asked{' '}
            <span className="text-[#f59b00]">Questions</span>
          </h2>
        </div>

        {/* FAQ List */}
        <div className="mx-auto mt-16 max-w-4xl space-y-4 lg:mt-20">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={index}
                className="overflow-hidden rounded-[20px] border border-[#dddddd] bg-white"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(index)}
                  className="flex w-full items-center justify-between px-7 py-6 text-left sm:px-8"
                >
                  <span className="pr-6 text-xl font-extrabold leading-snug text-[#11182f]">
                    {item.question}
                  </span>

                  <ChevronDown
                    className={`h-6 w-6 shrink-0 text-[#f59b00] transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                    strokeWidth={2.2}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-[#e6e6e6] bg-[#f3f6f8] px-7 py-6 sm:px-8">
                    <p className="text-lg leading-9 text-[#435166]">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FAQPage;