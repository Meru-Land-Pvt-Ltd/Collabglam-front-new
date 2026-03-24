'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { post } from '@/lib/api';
import Footer from '@/components/common/Footer';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { motion, AnimatePresence } from 'framer-motion';
import { DM_Sans } from 'next/font/google';

const dmSans = DM_Sans({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

type FAQ = {
  faqId: string;
  question: string;
  answer: string;
};

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<FAQ[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch FAQs
  useEffect(() => {
    (async () => {
      try {
        const data = await post<FAQ[]>('/faqs/get');
        setFaqs(data);
        setFilteredFaqs(data);
      } catch (err) {
        console.error(err);
        setError('Failed to load FAQs. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFaqs(faqs);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredFaqs(
        faqs.filter(
          ({ question, answer }) =>
            question.toLowerCase().includes(term) ||
            answer.toLowerCase().includes(term)
        )
      );
    }
  }, [searchTerm, faqs]);

  return (
    <div
      className={`${dmSans.className} flex flex-col min-h-screen bg-pink-50 text-gray-900`}
    >
      <Head>
        <title>Frequently Asked Questions | Collabglam</title>
        <meta
          name="description"
          content="Frequently asked questions about Collabglam services."
        />
      </Head>

      {/* Fixed Header */}
      <header className="fixed inset-x-0 top-0 bg-white shadow-sm z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Collabglam Logo"
              className="h-8 w-auto"
            />
            <span className="text-xl font-bold text-gray-800">
              Collabglam
            </span>
          </Link>
        </div>
      </header>
      {/* Spacer */}
      <div className="h-16" aria-hidden />

      <main className="container mx-auto px-6 py-12 flex-grow">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Frequently Asked Questions
        </h1>

        <div className="mb-8 flex justify-center">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 bg-white"
          />
        </div>

        {loading && (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-lg" />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence>
            {filteredFaqs.length > 0 ? (
              <Accordion
                type="single"
                collapsible
                className="space-y-4"
              >
                {filteredFaqs.map((faq) => (
                  <AccordionItem
                    key={faq.faqId}
                    value={faq.faqId}
                    className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <AccordionTrigger className="flex justify-between items-center px-4 py-3">
                      <span className="text-lg font-medium">
                        {faq.question}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-gray-700 whitespace-pre-line">
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {faq.answer}
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center text-gray-500">
                No FAQs found for “{searchTerm}”.
              </div>
            )}
          </AnimatePresence>
        )}
      </main>

      <Footer />
    </div>
  );
}
