'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';
import { get, post } from '@/lib/api';

interface FAQ {
    faqId: string;
    question: string;
    answer: string;
}

export default function AdminFAQPage() {
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [question, setQuestion] = useState<string>('');
    const [answer, setAnswer] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [saving, setSaving] = useState<boolean>(false);
    const router = useRouter();

    // Load all FAQs
  useEffect(() => {
    (async () => {
      try {
        const data = await post<FAQ[]>('/faqs/get');
        setFaqs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

    // When a FAQ is selected
    const handleSelect = (id: string) => {
        setSelectedId(id);
        const faq = faqs.find(f => f.faqId === id);
        if (faq) {
            setQuestion(faq.question);
            setAnswer(faq.answer);
        }
    };

    // Reset form for new FAQ
    const handleNew = () => {
        setSelectedId('');
        setQuestion('');
        setAnswer('');
    };

    // Save (create or update)
    const handleSave = async () => {
        if (!question.trim() || !answer.trim()) {
            Swal.fire({ icon: 'warning', title: 'Validation', text: 'Question and answer cannot be empty.', timer: 1500, timerProgressBar: true, showConfirmButton: false });
            return;
        }
        setSaving(true);
        try {
            if (selectedId) {
                await post<void>('/faqs/updateById', { faqId: selectedId, question, answer });
            } else {
                await post<void>('/faqs/create', { question, answer });
            }
            await Swal.fire({ icon: 'success', title: 'Saved', timer: 1500, timerProgressBar: true, showConfirmButton: false });
            router.refresh();
        } catch (err: any) {
            console.error(err);
            await Swal.fire({ icon: 'error', title: 'Save Failed', text: err.message || '', timer: 1500, timerProgressBar: true, showConfirmButton: false });
        } finally {
            setSaving(false);
        }
    };

    // Delete selected FAQ
    const handleDelete = async () => {
        if (!selectedId) return;
        const result = await Swal.fire({ icon: 'warning', title: 'Delete FAQ?', text: 'This cannot be undone.', showCancelButton: true });
        if (!result.isConfirmed) return;
        setSaving(true);
        try {
            await post<void>('/faqs/deleteById', { faqId: selectedId });
            await Swal.fire({ icon: 'success', title: 'Deleted', timer: 1500, timerProgressBar: true, showConfirmButton: false });
            router.refresh();
        } catch (err: any) {
            console.error(err);
            await Swal.fire({ icon: 'error', title: 'Delete Failed', text: err.message || '', timer: 1500, timerProgressBar: true, showConfirmButton: false });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="p-6 text-gray-500">Loading FAQs...</p>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto bg-white shadow-md rounded-lg">
            <h1 className="text-3xl font-semibold mb-6">Manage FAQs</h1>

            <div className="mb-4">
                <label htmlFor="selectFaq" className="block mb-2 font-medium">Select FAQ:</label>
                <div className="flex gap-2">
                    <select
                        id="selectFaq"
                        value={selectedId}
                        onChange={(e) => handleSelect(e.target.value)}
                        disabled={saving}
                        className="flex-1 border rounded p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    >
                        <option value="">-- New FAQ --</option>
                        {faqs.map(f => (
                            <option key={f.faqId} value={f.faqId}>
                                {f.question.slice(0, 40)}...
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleNew}
                        disabled={saving}
                        className="px-4 py-2 bg-[#ef2f5b] text-white rounded hover:bg-[#ef2f5b]/80 disabled:opacity-50"
                    >
                        New
                    </button>
                </div>
            </div>

            <div className="mb-4">
                <label htmlFor="question" className="block mb-2 font-medium">Question:</label>
                <input
                    id="question"
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    disabled={saving}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
            </div>

            <div className="mb-6">
                <label htmlFor="answer" className="block mb-2 font-medium">Answer:</label>
                <textarea
                    id="answer"
                    rows={6}
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    disabled={saving}
                    className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
            </div>

            <div className="flex gap-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-[#ef2f5b] text-white rounded hover:bg-[#ef2f5b]/80 disabled:opacity-50 transition"
                >
                    {selectedId ? (saving ? 'Saving...' : 'Update') : (saving ? 'Saving...' : 'Create')}
                </button>
                {selectedId && (
                    <button
                        onClick={handleDelete}
                        disabled={saving}
                        className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition"
                    >
                        {saving ? 'Deleting...' : 'Delete'}
                    </button>
                )}
            </div>
        </div>
    );
}
