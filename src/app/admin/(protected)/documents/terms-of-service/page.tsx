"use client";

import React, { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { post } from "@/lib/api";

interface Policy {
  policyId?: string;
  policyType: string;
  effectiveDate: string;
  content: string;
}

export default function PrivacyPolicyAdmin() {
  const [policyText, setPolicyText] = useState("");
  const [effectiveDate, setEffectiveDate] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Load existing policy
  useEffect(() => {
    post<Policy>('/policy/getlist', { policyType: 'Terms of Service' })
      .then(res => {
        setEffectiveDate(res.effectiveDate.split('T')[0]);
        setPolicyText(res.content);
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: Partial<Policy> = {
      policyType: 'Terms of Service',
      effectiveDate,
      content: policyText,
    };

    try {
      await post<Policy>('/policy/update', payload);
    } catch (err) {
      await post<Policy>('/policy/create', payload);
    } finally {
      setSaving(false);
      setDirty(false);
    }
  };

  if (loading) return <CardContent>Loading…</CardContent>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Terms of Service Admin</h1>

      <div className="mb-4">
        <label className="block mb-1 font-medium">Effective Date</label>
        <Input
          type="date"
          value={effectiveDate}
          onChange={e => { setEffectiveDate(e.target.value); setDirty(true); }}
        />
      </div>

      <div className="mb-6">
        <label className="block mb-1 font-medium">Terms of Service Content</label>
        <Textarea
          rows={15}
          value={policyText}
          onChange={e => { setPolicyText(e.target.value); setDirty(true); }}
        />
      </div>

      <Button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="bg-[#ef2f5b] text-white hover:bg-[#ef2f5b]/80 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  );
}
