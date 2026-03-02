"use client";

import React, { useEffect, useState, useCallback } from "react";
import { get, post } from "@/lib/api";
import Swal from "sweetalert2";
import {
  HiPlus,
  HiOutlineTrash,
  HiPencil,
  HiCheckCircle,
  HiXCircle,
} from "react-icons/hi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

/* ──────────────────────────────────────────────────────────────────── */
/* Types                                                               */
/* ──────────────────────────────────────────────────────────────────── */
export interface BankInfo {
  accountHolder: string;
  accountNumber: string;
  ifsc: string;
  swift: string;
  bankName: string;
  branch: string;
  countryId: string; // single-select country
  countryName:string
}

export interface PaypalInfo {
  username: string;
  email: string;
}

export interface PaymentMethod {
  paymentId: string;
  type: 0 | 1; // 0 PayPal, 1 Bank
  bank?: BankInfo;
  paypal?: PaypalInfo;
  isDefault: boolean;
}

interface ViewResponse {
  influencerId: string;
  type: 0 | 1;
  paymentMethods: PaymentMethod[];
}

interface Country {
  _id: string;
  countryName: string;
  flag: string;
}
interface CountryOption {
  value: string;
  label: string;
}
const buildCountryOptions = (arr: Country[]): CountryOption[] =>
  arr.map((c) => ({ value: c._id, label: `${c.flag} ${c.countryName}` }));

/* ──────────────────────────────────────────────────────────────────── */
/* Helpers                                                             */
/* ──────────────────────────────────────────────────────────────────── */
const toast = (
  icon: "success" | "error",
  title: string,
  text?: string
) =>
  Swal.fire({
    icon,
    title,
    text,
    timer: 1400,
    showConfirmButton: false,
    timerProgressBar: true,
  });

const confirmDelete = async () => {
  const res = await Swal.fire({
    title: "Delete this payment method?",
    text: "This action cannot be undone.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete it",
    cancelButtonText: "Cancel",
    reverseButtons: true,
    focusCancel: true,
  });
  return res.isConfirmed;
};

const mask = (val = "", keep = 4) =>
  val.length <= keep ? val : "*".repeat(val.length - keep) + val.slice(-keep);

/* ──────────────────────────────────────────────────────────────────── */
/* Page Component                                                      */
/* ──────────────────────────────────────────────────────────────────── */
export default function InfluencerPaymentMethodsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;
      if (!influencerId) throw new Error("No influencerId found");

      const [banks, paypals] = await Promise.all([
        post<ViewResponse>("/influencer/viewPaymentByType", {
          influencerId,
          type: 1,
        }),
        post<ViewResponse>("/influencer/viewPaymentByType", {
          influencerId,
          type: 0,
        }),
      ]);

      setMethods([...banks.paymentMethods, ...paypals.paymentMethods]);
    } catch (e: any) {
      setError(e.message || "Failed to load payment methods");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onDelete = async (paymentId: string) => {
    try {
      if (!(await confirmDelete())) return;

      const influencerId =
        typeof window !== "undefined"
          ? localStorage.getItem("influencerId")
          : null;
      if (!influencerId) throw new Error("No influencerId found");

      await post("/influencer/deletePaymentMethod", { paymentId, influencerId });
      toast("success", "Deleted");
      fetchAll();
    } catch (e: any) {
      toast("error", "Delete failed", e.message);
    }
  };

  const onSubmit = async (data: FormState) => {
    const influencerId =
      typeof window !== "undefined" ? localStorage.getItem("influencerId") : null;
    if (!influencerId) {
      toast("error", "Save failed", "No influencerId found");
      return;
    }

    const endpoint = editing
      ? "/influencer/updatePaymentMethod"
      : "/influencer/addPaymentMethod";

    const payload: any = {
      influencerId,
      type: data.type,
      isDefault: data.isDefault,
      paymentId: editing?.paymentId,
    };

    if (data.type === 1) payload.bank = data.bank;
    else payload.paypal = data.paypal;

    try {
      await post(endpoint, payload);
      toast("success", editing ? "Updated" : "Added");
      setShowForm(false);
      setEditing(null);
      fetchAll();
    } catch (e: any) {
      toast("error", "Save failed", e.message);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payment Methods</h1>
        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
        >
          <HiPlus className="mr-2" /> Add Method
        </Button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : methods.length === 0 ? (
        <EmptyState
          onAdd={() => {
            setEditing(null);
            setShowForm(true);
          }}
        />
      ) : (
        <MethodList
          methods={methods}
          onEdit={(m) => {
            setEditing(m);
            setShowForm(true);
          }}
          onDelete={onDelete}
        />
      )}

      {showForm && (
        <PaymentForm
          initial={editing}
          onCancel={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={onSubmit}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────── */
/* Re-usable sub components                                            */
/* ─────────────────────────────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="max-w-md mx-auto text-center bg-white">
      <CardHeader>
        <CardTitle>No payment methods yet</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Add a PayPal or Bank account to receive payouts.
        </p>
        <Button
          onClick={onAdd}
          className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
        >
          Add Payment Method
        </Button>
      </CardContent>
    </Card>
  );
}

function MethodList({
  methods,
  onEdit,
  onDelete,
}: {
  methods: PaymentMethod[];
  onEdit: (m: PaymentMethod) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {methods.map((m) => (
        <Card key={m.paymentId} className="relative bg-white">
          {m.isDefault && (
            <span className="absolute right-3 top-3 inline-flex items-center text-xs font-semibold text-green-700">
              <HiCheckCircle className="mr-1" /> Default
            </span>
          )}
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>{m.type === 1 ? "Bank" : "PayPal"}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {m.type === 1 && m.bank ? (
              <>
                <Row label="Account Holder" value={m.bank.accountHolder} />
                <Row label="Account #" value={mask(m.bank.accountNumber)} />
                <Row label="Bank" value={m.bank.bankName} />
                {m.bank.branch && <Row label="Branch" value={m.bank.branch} />}
                {m.bank.countryId && (
                  <Row label="Country Name" value={m.bank.countryName} />
                )}
                {m.bank.ifsc && <Row label="IFSC" value={m.bank.ifsc} />}
                {m.bank.swift && <Row label="SWIFT" value={m.bank.swift} />}
              </>
            ) : m.paypal ? (
              <>
                <Row label="Username" value={m.paypal.username} />
                <Row label="Paypal Email" value={m.paypal.email} />
              </>
            ) : null}

            <div className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="icon" onClick={() => onEdit(m)}>
                <HiPencil />
              </Button>
              <Button
                variant="outline"
                className="bg-white text-red-500"
                size="icon"
                onClick={() => onDelete(m.paymentId)}
              >
                <HiOutlineTrash />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="ml-2 font-medium text-gray-800 break-all">{value}</span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Payment Form                                                        */
/* ──────────────────────────────────────────────────────────────────── */
interface FormState {
  paymentId?: string;
  type: 0 | 1;
  isDefault: boolean;
  bank: BankInfo;
  paypal: PaypalInfo;
}

function PaymentForm({
  initial,
  onCancel,
  onSubmit,
}: {
  initial: PaymentMethod | null;
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
    countryName: initial?.bank?.countryName ?? ""
  });
  const [paypal, setPaypal] = useState<PaypalInfo>({
    username: initial?.paypal?.username ?? "",
    email: initial?.paypal?.email ?? "",
  });
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* fetch countries once */
  useEffect(() => {
    get<Country[]>("/country/getall")
      .then((res) => setCountries(buildCountryOptions(res)))
      .catch(() => setCountries([]));
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
    const v = validate();
    if (v) {
      setErr(v);
      return;
    }
    setErr(null);
    setSaving(true);
    try {
      await onSubmit({
        paymentId: initial?.paymentId,
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
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {initial ? "Edit" : "Add"} Payment Method
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
          {/* Type */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={String(type)}
              onValueChange={(v) => setType(Number(v) as 0 | 1)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="0">PayPal</SelectItem>
                <SelectItem value="1">Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic fields */}
          {type === 1 ? (
            <BankFields bank={bank} setBank={setBank} countries={countries} />
          ) : (
            <PaypalFields paypal={paypal} setPaypal={setPaypal} />
          )}

          {/* Default toggle */}
          <div className="flex items-center gap-2 p-2 bg-white rounded-md shadow-sm border border-gray-200">
            <Checkbox
              checked={isDefault}
              onCheckedChange={(c) => setIsDefault(c === true)}
            />
            <Label className="cursor-pointer text-sm text-gray-900">
              Make default
            </Label>
          </div>

          {/* Error */}
          {err && (
            <p className="text-sm text-red-600 flex items-center">
              <HiXCircle className="mr-1" /> {err}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-[#FFBF00] to-[#FFDB58] text-gray-800"
            >
              {saving ? "Saving…" : initial ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Field Groups                                                        */
/* ──────────────────────────────────────────────────────────────────── */
function BankFields({
  bank,
  setBank,
  countries,
}: {
  bank: BankInfo;
  setBank: (b: BankInfo) => void;
  countries: CountryOption[];
}) {
  const upd = (k: keyof BankInfo, v: string) => setBank({ ...bank, [k]: v });
  return (
    <div className="grid gap-3">
      <TextField
        label="Account Holder"
        value={bank.accountHolder}
        onChange={(v) => upd("accountHolder", v)}
        required
      />
      <TextField
        label="Account Number"
        value={bank.accountNumber}
        onChange={(v) => upd("accountNumber", v)}
        required
      />
      <TextField
        label="Bank Name"
        value={bank.bankName}
        onChange={(v) => upd("bankName", v)}
        required
      />
      <TextField
        label="Branch"
        value={bank.branch ?? ""}
        onChange={(v) => upd("branch", v)}
        required
      />

      {/* Country */}
      <div className="space-y-1">
        <Label>
          Country<span className="text-red-500"> *</span>
        </Label>
        <Select
          value={bank.countryId ?? ""}
          onValueChange={(v) => upd("countryId", v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent className="bg-white h-64 overflow-y-auto">
            {countries.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TextField
        label="IFSC"
        value={bank.ifsc ?? ""}
        onChange={(v) => upd("ifsc", v)}
        required
      />
      <TextField
        label="SWIFT"
        value={bank.swift ?? ""}
        onChange={(v) => upd("swift", v)}
        required
      />
    </div>
  );
}

function PaypalFields({
  paypal,
  setPaypal,
}: {
  paypal: PaypalInfo;
  setPaypal: (p: PaypalInfo) => void;
}) {
  const upd = (k: keyof PaypalInfo, v: string) =>
    setPaypal({ ...paypal, [k]: v });
  return (
    <div className="grid gap-3">
      <TextField
        label="Username"
        value={paypal.username}
        onChange={(v) => upd("username", v)}
        required
      />
      <TextField
        label="Paypal Email"
        value={paypal.email}
        onChange={(v) => upd("email", v)}
        required
      />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────── */
/* Text field helper                                                   */
/* ──────────────────────────────────────────────────────────────────── */
function TextField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
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
