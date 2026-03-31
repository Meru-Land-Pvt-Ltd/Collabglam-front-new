"use client";

import React, { useEffect, useState } from "react";
import { HiXCircle } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FloatingSelect,
  SelectItem,
} from "@/components/ui/selectComp";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem as DefaultSelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { apiListCountries } from "@/app/influencer/services/influencerApi";

export interface BankInfo {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  swift: string;
  bankName: string;
  branch: string;
  countryId: string;
  countryName: string;
}

export interface PaypalInfo {
  username: string;
  email: string;
}

export interface PaymentMethod {
  paymentId?: string;
  _id?: string;
  type: 0 | 1;
  bank?: BankInfo;
  paypal?: PaypalInfo;
  isDefault: boolean;
}

export interface FormState {
  paymentId?: string;
  _id?: string;
  type: 0 | 1;
  isDefault: boolean;
  bank: BankInfo;
  paypal: PaypalInfo;
}

type CountryOption = {
  value: string;
  label: string;
  countryName: string;
};

type CountryRow = {
  _id?: string;
  countryName?: string;
  flag?: string;
};

export default function PaymentDetailsOverlay({
  initial = null,
  onCancel,
  onSubmit,
}: {
  initial?: PaymentMethod | null;
  onCancel: () => void;
  onSubmit: (data: FormState) => Promise<void> | void;
}) {
  const [type, setType] = useState<0 | 1>(initial?.type ?? 0);
  const [isDefault, setIsDefault] = useState<boolean>(
    initial?.isDefault ?? false
  );

  const [bank, setBank] = useState<BankInfo>({
    accountHolder: initial?.bank?.accountHolder ?? "",
    accountNumber: initial?.bank?.accountNumber ?? "",
    bankName: initial?.bank?.bankName ?? "",
    branch: initial?.bank?.branch ?? "",
    countryId: initial?.bank?.countryId ?? "",
    ifsc: initial?.bank?.ifsc ?? "",
    swift: initial?.bank?.swift ?? "",
    countryName: initial?.bank?.countryName ?? "",
  });

  const [paypal, setPaypal] = useState<PaypalInfo>({
    username: initial?.paypal?.username ?? "",
    email: initial?.paypal?.email ?? "",
  });

  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await apiListCountries();
        const options: CountryOption[] = (res || [])
          .filter((c: CountryRow) => c?._id && c?.countryName)
          .map((c: CountryRow) => ({
            value: c._id as string,
            label: `${c.flag ?? ""} ${c.countryName ?? ""}`.trim(),
            countryName: c.countryName as string,
          }));

        setCountries(options);
      } catch {
        setCountries([]);
      }
    };

    fetchCountries();
  }, []);

  const validate = (): string | null => {
    if (type === 1) {
      if (!bank.accountHolder.trim()) return "Account holder is required";
      if (!bank.accountNumber.trim()) return "Account number is required";
      if (!bank.bankName.trim()) return "Bank name is required";
      if (!bank.countryId) return "Country is required";
    } else {
      if (!paypal.username.trim()) return "PayPal username is required";
      if (!paypal.email.trim()) return "PayPal email is required";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setErr(validationError);
      return;
    }

    setErr(null);
    setSaving(true);

    try {
      await onSubmit({
        paymentId: initial?.paymentId,
        _id: initial?._id,
        type,
        isDefault,
        bank,
        paypal,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {initial ? "Edit" : "Add"} Payment Details
          </h2>

          <button
            type="button"
            onClick={onCancel}
            className="text-slate-500 transition hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={String(type)}
              onValueChange={(value) => setType(Number(value) as 0 | 1)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select payment type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <DefaultSelectItem value="0">PayPal</DefaultSelectItem>
                <DefaultSelectItem value="1">Bank</DefaultSelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 1 ? (
            <BankFields
              bank={bank}
              setBank={setBank}
              countries={countries}
            />
          ) : (
            <PaypalFields paypal={paypal} setPaypal={setPaypal} />
          )}

          <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-3">
            <Checkbox
              checked={isDefault}
              onCheckedChange={(checked) => setIsDefault(checked === true)}
            />
            <Label className="cursor-pointer text-sm text-slate-900">
              Make this default payment method
            </Label>
          </div>

          {err && (
            <p className="flex items-center text-sm text-red-600">
              <HiXCircle className="mr-1" /> {err}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="border-black bg-white text-black hover:bg-gray-100"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={saving}
              className="bg-black text-white hover:bg-black/90"
            >
              {saving ? "Saving..." : initial ? "Update" : "Add Details"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BankFields({
  bank,
  setBank,
  countries,
}: {
  bank: BankInfo;
  setBank: React.Dispatch<React.SetStateAction<BankInfo>>;
  countries: CountryOption[];
}) {
  const updateField = (key: keyof BankInfo, value: string) => {
    setBank((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid gap-3">
      <TextField
        label="Account Holder"
        value={bank.accountHolder}
        onChange={(value) => updateField("accountHolder", value)}
        required
      />

      <TextField
        label="Account Number"
        value={bank.accountNumber}
        onChange={(value) => updateField("accountNumber", value)}
        required
      />

      <TextField
        label="Bank Name"
        value={bank.bankName}
        onChange={(value) => updateField("bankName", value)}
        required
      />

      <TextField
        label="Branch"
        value={bank.branch}
        onChange={(value) => updateField("branch", value)}
      />

      <FloatingSelect
        label="Country"
        value={bank.countryId}
        onValueChange={(value) => {
          const selected = countries.find((country) => country.value === value);

          setBank((prev) => ({
            ...prev,
            countryId: value,
            countryName: selected?.countryName ?? "",
          }));
        }}
        searchable
        searchPlaceholder="Search country"
      >
        {countries.map((country) => (
          <SelectItem key={country.value} value={country.value}>
            {country.label}
          </SelectItem>
        ))}
      </FloatingSelect>

      <TextField
        label="IFSC"
        value={bank.ifsc}
        onChange={(value) => updateField("ifsc", value)}
      />

      <TextField
        label="SWIFT"
        value={bank.swift}
        onChange={(value) => updateField("swift", value)}
      />
    </div>
  );
}

function PaypalFields({
  paypal,
  setPaypal,
}: {
  paypal: PaypalInfo;
  setPaypal: React.Dispatch<React.SetStateAction<PaypalInfo>>;
}) {
  const updateField = (key: keyof PaypalInfo, value: string) => {
    setPaypal((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid gap-3">
      <TextField
        label="Username"
        value={paypal.username}
        onChange={(value) => updateField("username", value)}
        required
      />

      <TextField
        label="PayPal Email"
        value={paypal.email}
        onChange={(value) => updateField("email", value)}
        required
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}