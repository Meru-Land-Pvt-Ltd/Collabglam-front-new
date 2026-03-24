"use client";
import { useState } from "react";
import {
  Zap, Crown, Star, TrendingUp, Users, Eye, DollarSign,
  Check, Calendar, BarChart2, CreditCard, PlusCircle, Wallet,
  ChevronRight
} from "lucide-react";

const plans = [
  {
    name: "Basic Boost",
    price: "$29.99",
    duration: "7 Days",
    features: [
      "Higher ranking in discovery feeds",
      "Increased visibility by 25%",
      "Priority support (standard)",
    ],
  },
  {
    name: "Standard Boost",
    price: "$59.99",
    duration: "14 Days",
    popular: true,
    features: [
      "All Basic Boost benefits",
      "Featured in brand recommendations",
      "Increased visibility by 50%",
      "Dedicated boost performance report",
    ],
  },
  {
    name: "Premium Boost",
    price: "$99.99",
    duration: "30 Days",
    features: [
      "All Standard Boost benefits",
      "Guaranteed top ranking in discovery",
      "Increased visibility by 100%",
      "Exclusive brand partnership opportunities",
      "24/7 priority support",
    ],
  },
];

const benefits = [
  {
    icon: <Crown size={28} />,
    title: "Higher Ranking",
    desc: "Your profile appears higher in brand search results.",
  },
  {
    icon: <Star size={28} />,
    title: "Featured Recommendations",
    desc: "Get prominently displayed to relevant brands looking for creators.",
  },
  {
    icon: <Eye size={28} />,
    title: "Increased Exposure",
    desc: "Reach a wider audience of brands and attract new collaborations.",
  },
  {
    icon: <DollarSign size={28} />,
    title: "More Opportunities",
    desc: "Boosted profiles attract more paid campaign invitations.",
  },
];

const history = [
  { date: "2023-11-15", plan: "Basic Boost", result: "Gained 500 impressions, 3 new brand connections." },
  { date: "2023-10-01", plan: "Standard Boost", result: "Increased profile views by 70%, 5 campaign inquiries." },
  { date: "2023-09-01", plan: "Basic Boost", result: "Profile ranking improved by 15 positions." },
];

export default function BoostProfile() {
  const [selectedPlan, setSelectedPlan] = useState("Standard Boost");
  const [paymentMethod, setPaymentMethod] = useState("wallet");

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-900">
      <div className="space-y-8">

        {/* Page Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Boost Profile</h1>
            <p className="text-sm text-gray-500 mt-1">Increase your visibility and get discovered by more brands.</p>
          </div>
          <button
            style={{ backgroundColor: "#FFBF00" }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-900 hover:opacity-90 transition-opacity shadow-sm"
          >
            <Zap size={15} fill="#1a1a1a" />
            Boost Now
          </button>
        </div>

        {/* Choose Your Boost Plan */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">Choose Your Boost Plan</h2>
          <div className="grid grid-cols-3 gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.name;
              return (
                <div
                  key={plan.name}
                  onClick={() => setSelectedPlan(plan.name)}
                  className={`bg-white rounded-2xl p-5 border-2 cursor-pointer transition-all hover:shadow-md relative flex flex-col ${
                    isSelected ? "shadow-md" : "border-gray-100"
                  }`}
                  style={isSelected ? { borderColor: "#FFBF00" } : {}}
                >
                  {plan.popular && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-3 py-1 rounded-full text-gray-900"
                      style={{ backgroundColor: "#FFBF00" }}
                    >
                      Popular
                    </span>
                  )}
                  <p className="text-sm font-semibold text-gray-700 mb-1">{plan.name}</p>
                  <p className="text-3xl font-extrabold text-gray-900 mb-1">{plan.price}</p>
                  <p className="text-xs text-gray-400 mb-4">{plan.duration}</p>
                  <ul className="space-y-2 mb-5 flex-grow">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                        <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: "#FFBF00" }} strokeWidth={3} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    style={{ backgroundColor: isSelected ? "#FFBF00" : "#fff", borderColor: "#FFBF00" }}
                    className={`mt-auto w-full py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                      isSelected ? "text-gray-900" : "text-yellow-600 hover:bg-yellow-50"
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* How Boosting Helps You */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-4">How Boosting Helps You</h2>
          <div className="grid grid-cols-4 gap-4">
            {benefits.map((b) => (
              <div key={b.title} className="bg-white rounded-2xl p-5 border border-gray-100 text-center hover:shadow-sm transition-shadow">
                <div className="flex justify-center mb-3" style={{ color: "#FFBF00" }}>
                  {b.icon}
                </div>
                <p className="text-xs font-bold text-gray-800 mb-1">{b.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Active Boost Status + Payment */}
        <div className="grid grid-cols-2 gap-4">
          {/* Active Boost Status */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Active Boost Status</h3>
            <div className="flex items-end justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Remaining Days</p>
                <p className="text-4xl font-extrabold text-gray-900">12</p>
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-100">
                Profile views +25%
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={13} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Boost Expiry Date</p>
                <p className="text-xs font-semibold text-gray-700">December 25, 2024</p>
              </div>
            </div>
            <button className="w-full py-2 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200 flex items-center justify-center gap-1.5">
              <BarChart2 size={13} />
              View Boost Analytics
            </button>
          </div>

          {/* Payment Integration */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Payment Integration</h3>

            {/* Wallet option */}
            <div
              onClick={() => setPaymentMethod("wallet")}
              className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer mb-2 transition-all ${
                paymentMethod === "wallet" ? "bg-yellow-50" : "border-gray-100 hover:bg-gray-50"
              }`}
              style={paymentMethod === "wallet" ? { borderColor: "#FFBF00" } : {}}
            >
              <div className="flex items-center gap-2">
                <Wallet size={15} className="text-gray-500" />
                <div>
                  <p className="text-xs font-semibold text-gray-700">Wallet Balance</p>
                  <p className="text-xs text-gray-400">Current balance: $450.00</p>
                </div>
              </div>
              <button
                style={{ backgroundColor: "#FFBF00" }}
                className="text-xs font-bold text-gray-900 px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                Pay with Wallet
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 my-2">Or</p>

            {/* Add payment */}
            <div
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer mb-4 transition-all ${
                paymentMethod === "card" ? "bg-yellow-50" : "border-gray-100 hover:bg-gray-50"
              }`}
              style={paymentMethod === "card" ? { borderColor: "#FFBF00" } : {}}
            >
              <CreditCard size={15} className="text-gray-400" />
              <p className="text-xs font-semibold text-gray-500">Add New Payment Method</p>
            </div>

            {/* Confirm */}
            <button
              style={{ backgroundColor: "#FFBF00" }}
              className="w-full py-2.5 rounded-xl text-sm font-bold text-gray-900 hover:opacity-90 transition-opacity shadow-sm"
            >
              Confirm Boost
            </button>
          </div>
        </div>

        {/* Boost History */}
        <section className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Boost History</h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-gray-400 font-semibold pb-2 pr-4">Date</th>
                <th className="text-left text-gray-400 font-semibold pb-2 pr-4">Boost Plan</th>
                <th className="text-left text-gray-400 font-semibold pb-2">Results Summary</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{row.date}</td>
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-gray-700">{row.plan}</span>
                  </td>
                  <td className="py-3 text-gray-500">{row.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

      </div>
    </div>
  );
}