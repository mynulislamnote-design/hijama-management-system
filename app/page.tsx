"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  DollarSign,
  Calendar,
  Phone,
  PlusCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  HeartPulse,
  Search,
  Filter,
  Eye,
  X,
  MessageCircle,
  CalendarCheck,
  Send,
  UserCheck,
  CalendarRange,
  ArrowDownRight,
  ArrowUpRight,
  UserCheck2,
  Plus,
} from "lucide-react";

interface Patient {
  id: string;
  name: string;
  phone: string;
  problem: string;
  serviceType: string;
  feePaid: number;
  sessionDate: string;
  nextFollowUp?: string;
  raqiName?: string;
  problemCategory?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  note?: string;
  date: string;
}

interface Raqi {
  id: string;
  name: string;
  phone?: string;
}

const getCategoryNameBn = (cat: string) => {
  const map: Record<string, string> = {
    PATIENT_FEE: "রোগীর ফি",
    PRODUCTS_SALE: "তেল/মধু/সামগ্রী বিক্রয়",
    DONATION_GIFT: "হাদিয়া / অনুদান",
    OTHER_INCOME: "অন্যান্য আয়",
    RENT: "সেন্টার ভাড়া",
    MEDICINE_CUPS: "কাপ ও সার্জিক্যাল সামগ্রী",
    PRODUCTS_PURCHASE: "তেল/মধু স্টক ক্রয়",
    UTILITY: "বিদ্যুৎ ও নেট বিল",
    STAFF_SALARY: "স্টাফ সম্মানী",
    CONVEYANCE: "যাতায়াত খরচ",
    REFRESHMENT: "মেহমানদারি ও নাস্তা",
    OTHER_EXPENSE: "অন্যান্য ব্যয়",
    OTHER: "অন্যান্য",
  };
  return map[cat] || cat;
};

const getProblemBadge = (cat?: string) => {
  switch (cat) {
    case "SIHR":
      return (
        <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
          🪄 যাদু (সিহর)
        </span>
      );
    case "JINN":
      return (
        <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
          👿 জ্বিনের আসর
        </span>
      );
    case "AYN":
      return (
        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
          👁️ বদনজর
        </span>
      );
    case "PHYSICAL_HIJAMA":
      return (
        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
          🩸 শারীরিক / হিজামা
        </span>
      );
    case "WASWASAH":
      return (
        <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
          🧠 ওয়াসওয়াসা
        </span>
      );
    default:
      return (
        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
          📌 সাধারণ
        </span>
      );
  }
};

export default function HijamaAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"PATIENTS" | "TRANSACTIONS">(
    "PATIENTS",
  );
  const [patientViewMode, setPatientViewMode] = useState<
    "ALL" | "TODAY_FOLLOWUP"
  >("ALL");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [raqis, setRaqis] = useState<Raqi[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  // নতুন রাক্বী পপআপ
  const [isAddRaqiOpen, setIsAddRaqiOpen] = useState(false);
  const [newRaqiName, setNewRaqiName] = useState("");
  const [newRaqiPhone, setNewRaqiPhone] = useState("");
  const [isSubmittingRaqi, setIsSubmittingRaqi] = useState(false);

  // সার্চ ও ফিল্টার
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("ALL");
  const [selectedProblemFilter, setSelectedProblemFilter] = useState("ALL");

  // মডাল স্টেট
  const [selectedPatientForView, setSelectedPatientForView] =
    useState<Patient | null>(null);
  const [patientForAttendance, setPatientForAttendance] =
    useState<Patient | null>(null);
  const [sessionFee, setSessionFee] = useState("");
  const [newNextFollowUp, setNewNextFollowUp] = useState("");
  const [updatedProblemNote, setUpdatedProblemNote] = useState("");
  const [isUpdatingSession, setIsUpdatingSession] = useState(false);

  // পেশেন্ট ফর্ম স্টেট
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [problem, setProblem] = useState("");
  const [problemCategory, setProblemCategory] = useState("JINN");
  const [raqiName, setRaqiName] = useState("");
  const [serviceType, setServiceType] = useState("RUKYAH");
  const [feePaid, setFeePaid] = useState("");

  const [todayStr, setTodayStr] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  // আয়-ব্যয় ফিল্টার
  const [txTimeFilter, setTxTimeFilter] = useState<
    "TODAY" | "THIS_MONTH" | "LAST_MONTH" | "ALL" | "CUSTOM"
  >("THIS_MONTH");
  const [txCategoryFilter, setTxCategoryFilter] = useState("ALL");
  const [txTypeFilter, setTxTypeFilter] = useState("ALL");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("INCOME");
  const [txCategory, setTxCategory] = useState("PATIENT_FEE");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    setSessionDate(today);
    setTxDate(today);
    setCustomStartDate(today);
    setCustomEndDate(today);
  }, []);

  const handleTypeChange = (type: "INCOME" | "EXPENSE") => {
    setTxType(type);
    if (type === "INCOME") {
      setTxCategory("PATIENT_FEE");
    } else {
      setTxCategory("RENT");
    }
  };

  const fetchData = async () => {
    try {
      const [pRes, tRes, rRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/transactions"),
        fetch("/api/raqis"),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      const rData = await rRes.json();

      if (Array.isArray(pData)) setPatients(pData);
      if (Array.isArray(tData)) setTransactions(tData);
      if (Array.isArray(rData)) {
        setRaqis(rData);
        if (rData.length > 0 && !raqiName) {
          setRaqiName(rData[0].name);
        }
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddRaqiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRaqiName) return;

    setIsSubmittingRaqi(true);
    try {
      const res = await fetch("/api/raqis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRaqiName, phone: newRaqiPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setRaqis((prev) => [...prev, data.raqi]);
        setRaqiName(data.raqi.name);
        setNewRaqiName("");
        setNewRaqiPhone("");
        setIsAddRaqiOpen(false);
        alert("নতুন রাক্বী সফলভাবে তালিকায় যুক্ত হয়েছে!");
      } else {
        alert("রাক্বী যোগ করা সম্ভব হয়নি!");
      }
    } catch (err) {
      alert("সার্ভার এরর");
    } finally {
      setIsSubmittingRaqi(false);
    }
  };

  const todayFollowUpPatients = useMemo(() => {
    if (!todayStr) return [];
    return patients.filter((p) => p.nextFollowUp === todayStr);
  }, [patients, todayStr]);

  const filteredPatients = useMemo(() => {
    let list =
      patientViewMode === "TODAY_FOLLOWUP" ? todayFollowUpPatients : patients;

    return list.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery) ||
        (p.raqiName &&
          p.raqiName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesService =
        selectedServiceFilter === "ALL" ||
        p.serviceType === selectedServiceFilter;

      const matchesProblem =
        selectedProblemFilter === "ALL" ||
        p.problemCategory === selectedProblemFilter;

      return matchesSearch && matchesService && matchesProblem;
    });
  }, [
    patients,
    todayFollowUpPatients,
    patientViewMode,
    searchQuery,
    selectedServiceFilter,
    selectedProblemFilter,
  ]);

  const filteredTransactions = useMemo(() => {
    if (!todayStr) return transactions;
    const now = new Date(todayStr);
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const thisMonthPrefix = `${currentYear}-${currentMonth}`;

    const lastMonthDate = new Date(currentYear, now.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    return transactions.filter((t) => {
      let matchesTime = true;
      if (txTimeFilter === "TODAY") {
        matchesTime = t.date === todayStr;
      } else if (txTimeFilter === "THIS_MONTH") {
        matchesTime = (t.date || "").startsWith(thisMonthPrefix);
      } else if (txTimeFilter === "LAST_MONTH") {
        matchesTime = (t.date || "").startsWith(lastMonthPrefix);
      } else if (txTimeFilter === "CUSTOM") {
        if (customStartDate && customEndDate) {
          matchesTime =
            (t.date || "") >= customStartDate &&
            (t.date || "") <= customEndDate;
        }
      }

      const matchesType = txTypeFilter === "ALL" || t.type === txTypeFilter;
      const matchesCategory =
        txCategoryFilter === "ALL" || t.category === txCategoryFilter;

      return matchesTime && matchesType && matchesCategory;
    });
  }, [
    transactions,
    txTimeFilter,
    txTypeFilter,
    txCategoryFilter,
    todayStr,
    customStartDate,
    customEndDate,
  ]);

  const filteredIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredExpense = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);

  const filteredNetBalance = filteredIncome - filteredExpense;

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !feePaid) {
      alert("দয়া করে নাম, ফোন এবং ফি এর পরিমাণ দিন!");
      return;
    }

    setIsSubmittingPatient(true);
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          problem: problem || "সাধারণ সমস্যা",
          problemCategory,
          raqiName: raqiName || "প্রধান রাক্বী",
          serviceType,
          feePaid: Number(feePaid),
          sessionDate: sessionDate || todayStr,
          nextFollowUp: nextFollowUp || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(
          "আলহামদুলিল্লাহ! রোগীর তথ্য সেভ হয়েছে এবং ফি আয়-ব্যয় লেজারে যোগ হয়েছে।",
        );
        setName("");
        setPhone("");
        setProblem("");
        setFeePaid("");
        setNextFollowUp("");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        alert(`সেভ হয়নি! কারণ: ${data.error || "অজানা সমস্যা"}`);
      }
    } catch (err) {
      alert(`সার্ভার কানেকশন এরর: ${err}`);
    } finally {
      setIsSubmittingPatient(false);
    }
  };

  // ১-ক্লিক উপস্থিতি ও সেশন সম্পন্ন হ্যান্ডলার
  const handleCompleteSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientForAttendance) return;

    setIsUpdatingSession(true);
    try {
      const res = await fetch("/api/patients", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: patientForAttendance.id,
          newFee: Number(sessionFee || 0),
          nextFollowUp: newNextFollowUp || null,
          problemUpdate: updatedProblemNote || patientForAttendance.problem,
          sessionDate: todayStr,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(
          `আলহামদুলিল্লাহ! ${patientForAttendance.name}-এর সেশন সফলভাবে সম্পন্ন হয়েছে ও ফি লেজারে যুক্ত হয়েছে।`,
        );
        setPatientForAttendance(null);
        setSessionFee("");
        setNewNextFollowUp("");
        setUpdatedProblemNote("");
        await fetchData(); // ডাটা রিফ্রেশ করা যাতে সাথে সাথে টেবিল ও লেজার আপডেট হয়
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        alert(`সেশন আপডেট হয়নি! কারণ: ${data.error || "অজানা সমস্যা"}`);
      }
    } catch (err) {
      alert(`সার্ভার কানেকশন এরর: ${err}`);
    } finally {
      setIsUpdatingSession(false);
    }
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount) return;

    setIsSubmittingTx(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: txType,
          category: txCategory,
          amount: Number(txAmount),
          note: txNote,
          date: txDate || todayStr,
        }),
      });

      if (res.ok) {
        setSuccessMsg("লেনদেন সফলভাবে রেকর্ড করা হয়েছে।");
        setTxAmount("");
        setTxNote("");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {
      alert("সার্ভার এরর");
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleSendTodayReminder = async (patient: Patient) => {
    const text = `📅 *জরুরি সেশন রিমাইন্ডার*

আসসালামু আলাইকুম ${patient.name}!
আজকে (${todayStr}) আমাদের সেন্টারে আপনার নির্ধারিত সেশন রয়েছে।
চিকিৎসায় থাকবেন: ${patient.raqiName || "প্রধান রাক্বী"}।
সুবিধাজনক সময়ে উপস্থিত হওয়ার অনুরোধ করা হলো।

_শরঈ রুকইয়াহ ও সুন্নতি হিজামা সেন্টার_`;

    const clean = patient.phone.replace(/\D/g, "");
    window.open(
      `https://wa.me/${clean.startsWith("01") ? "88" + clean : clean}?text=${encodeURIComponent(text)}`,
      "_blank",
    );
  };

  const todayPatients = useMemo(() => {
    if (!todayStr) return [];
    return patients.filter((p) => p.sessionDate === todayStr);
  }, [patients, todayStr]);

  const todayIncome = useMemo(() => {
    if (!todayStr) return 0;
    return transactions
      .filter((t) => t.date === todayStr && t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayStr]);

  const todayExpense = useMemo(() => {
    if (!todayStr) return 0;
    return transactions
      .filter((t) => t.date === todayStr && t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, todayStr]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* হেডার */}
      <header className="bg-emerald-800 text-white shadow-md py-4 px-4 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 border border-emerald-500/40 flex items-center justify-center text-amber-300 shadow-inner">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight">
                শরঈ রুকইয়াহ ও সুন্নতি হিজামা সেন্টার
              </h1>
              <p className="text-[11px] text-emerald-200">
                রোগী ব্যবস্থাপনা, ফলো-আপ শিডিউল ও আয়-ব্যয় রিপোর্ট
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                alert("রিপোর্ট তৈরি করে পাঠানো হচ্ছে...");
                const res = await fetch("/api/test-summary", {
                  method: "POST",
                });
                if (res.ok)
                  alert(
                    "✅ আজকের সারসংক্ষেপ রিপোর্ট পরিচালক ও চেয়ারম্যানের হোয়াটসঅ্যাপে চলে গেছে!",
                  );
                else alert("রিপোর্ট পাঠানো যায়নি!");
              }}
              className="bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl shadow transition-all flex items-center gap-1.5 active:scale-95"
            >
              📊 টেস্ট সামারি পাঠান
            </button>
            <span className="hidden md:inline-block bg-emerald-900 text-emerald-200 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-600">
              🟢 সিস্টেম সচল
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6 space-y-6">
        {successMsg && (
          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg flex items-center gap-3 animate-in fade-in duration-300">
            <CheckCircle2 className="w-6 h-6 shrink-0 text-amber-300" />
            <p className="text-xs sm:text-sm font-bold">{successMsg}</p>
          </div>
        )}

        {/* ওভারভিউ কার্ডস */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-emerald-600" /> আজকের নতুন রোগী
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-800">
              {todayPatients.length} জন
            </div>
          </div>

          <div
            onClick={() => {
              setActiveTab("PATIENTS");
              setPatientViewMode("TODAY_FOLLOWUP");
            }}
            className="bg-amber-50/70 hover:bg-amber-100/70 cursor-pointer p-4 rounded-2xl border border-amber-200 shadow-xs space-y-1 transition-all"
          >
            <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1">
              <CalendarCheck className="w-3.5 h-3.5 text-amber-600" /> আজকের
              ফলো-আপ
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-900">
              {todayFollowUpPatients.length} জন
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> আজকের মোট
              আয়
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700">
              ৳{todayIncome}
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> আজকের ব্যয়
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600">
              ৳{todayExpense}
            </div>
          </div>
        </div>

        {/* প্রধান ট্যাব সুইচ */}
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("PATIENTS")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === "PATIENTS"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" /> রোগী এন্ট্রি ও তালিকা (
            {patients.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("TRANSACTIONS")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === "TRANSACTIONS"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <DollarSign className="w-4 h-4" /> আয়-ব্যয় লেজার ও রিপোর্ট (
            {transactions.length})
          </button>
        </div>

        {/* ট্যাব ১: রোগী এন্ট্রি ও সার্চ ফিল্টার */}
        {activeTab === "PATIENTS" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* নতুন রোগী এন্ট্রি ফর্ম */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                <PlusCircle className="w-4 h-4 text-emerald-600" /> নতুন রোগী
                রেজিস্ট্রেশন
              </h2>

              <form onSubmit={handlePatientSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    রোগীর নাম:
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: মো. আব্দুল্লাহ"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    হোয়াটসঅ্যাপ নাম্বার:
                  </label>
                  <input
                    type="tel"
                    placeholder="যেমন: 01700000000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* রাক্বী ড্রপডাউন ও নতুন রাক্বী বাটন */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      চিকিৎসক / রাক্বী:
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddRaqiOpen(true)}
                      className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 hover:bg-emerald-100 flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> নতুন রাক্বী
                    </button>
                  </div>
                  <select
                    value={raqiName}
                    onChange={(e) => setRaqiName(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                  >
                    {raqis.map((r) => (
                      <option key={r.id} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    রোগ বা সমস্যার ধরন:
                  </label>
                  <select
                    value={problemCategory}
                    onChange={(e) => setProblemCategory(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                  >
                    <option value="JINN">👿 জ্বিনের সমস্যা / আসর (Jinn)</option>
                    <option value="SIHR">🪄 যাদু / সিহর (Black Magic)</option>
                    <option value="AYN">👁️ বদনজর / হাসাদ (Evil Eye)</option>
                    <option value="PHYSICAL_HIJAMA">
                      🩸 শারীরিক সমস্যা / শুধু হিজামা
                    </option>
                    <option value="WASWASAH">
                      🧠 অতিরিক্ত ওয়াসওয়াসা ও মানসিক
                    </option>
                    <option value="OTHER">📌 অন্যান্য / যৌথ সমস্যা</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    সার্ভিস ক্যাটাগরি:
                  </label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                  >
                    <option value="RUKYAH">শরঈ রুকইয়াহ</option>
                    <option value="HIJAMA">সুন্নতি হিজামা</option>
                    <option value="BOTH">উভয় সার্ভিস (রুকিয়াহ + হিজামা)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    নির্দিষ্ট সমস্যা / নোট (সংক্ষেপে):
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: রাতে ঘুম নেই, বুকে প্রচণ্ড ভার"
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    চিকিৎসা ফি (টাকা):
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৫০০"
                    value={feePaid}
                    onChange={(e) => setFeePaid(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none font-bold text-emerald-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      আজকের তারিখ:
                    </label>
                    <input
                      type="date"
                      value={sessionDate}
                      onChange={(e) => setSessionDate(e.target.value)}
                      className="w-full text-[11px] p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">
                      পরবর্তী ফলো-আপ:
                    </label>
                    <input
                      type="date"
                      value={nextFollowUp}
                      onChange={(e) => setNextFollowUp(e.target.value)}
                      className="w-full text-[11px] p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPatient}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  {isSubmittingPatient ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>রোগী এন্ট্রি ও রসিদ পাঠান</span>
                </button>
              </form>
            </div>

            {/* ডান পাশ: লাইভ সার্চ, ফলো-আপ ভিউ ও টেবিল */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col space-y-3 p-4">
              <div className="space-y-2 border-b pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPatientViewMode("ALL")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        patientViewMode === "ALL"
                          ? "bg-white text-emerald-950 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      সকল রোগী ({patients.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPatientViewMode("TODAY_FOLLOWUP")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        patientViewMode === "TODAY_FOLLOWUP"
                          ? "bg-amber-400 text-slate-950 shadow-xs"
                          : "text-slate-600"
                      }`}
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      আজকের ফলো-আপ ({todayFollowUpPatients.length})
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedProblemFilter}
                      onChange={(e) => setSelectedProblemFilter(e.target.value)}
                      className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    >
                      <option value="ALL">সব সমস্যা</option>
                      <option value="JINN">জ্বিন</option>
                      <option value="SIHR">যাদু</option>
                      <option value="AYN">বদনজর</option>
                      <option value="PHYSICAL_HIJAMA">হিজামা</option>
                    </select>

                    <select
                      value={selectedServiceFilter}
                      onChange={(e) => setSelectedServiceFilter(e.target.value)}
                      className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                    >
                      <option value="ALL">সব সার্ভিস</option>
                      <option value="RUKYAH">রুকিয়াহ</option>
                      <option value="HIJAMA">হিজামা</option>
                      <option value="BOTH">উভয়</option>
                    </select>
                  </div>
                </div>

                <div className="relative w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="রোগীর নাম, মোবাইল বা রাক্বীর নাম দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">রোগীর নাম ও ফোন</th>
                      <th className="p-3">সমস্যা ও রাক্বী</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">ফলো-আপ</th>
                      <th className="p-3 text-right">ফি</th>
                      <th className="p-3 text-center">উপস্থিতি / অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="text-center p-8 text-slate-400"
                        >
                          {patientViewMode === "TODAY_FOLLOWUP"
                            ? "আজকে কোনো রোগীর ফলো-আপ নির্ধারিত নেই।"
                            : "কোনো রোগীর তথ্য পাওয়া যায়নি।"}
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((p) => {
                        const isTodayFollowUp =
                          todayStr && p.nextFollowUp === todayStr;

                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50 transition-colors ${isTodayFollowUp ? "bg-amber-50/40" : ""}`}
                          >
                            <td className="p-3">
                              <span className="font-bold text-slate-800 block">
                                {p.name}
                              </span>
                              <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-emerald-600" />{" "}
                                {p.phone}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                {getProblemBadge(p.problemCategory)}
                                <span className="text-[10px] text-slate-500 block truncate max-w-[130px]">
                                  রাক্বী: {p.raqiName || "প্রধান রাক্বী"}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-slate-500">
                              {p.sessionDate}
                            </td>
                            <td className="p-3">
                              {p.nextFollowUp ? (
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                    isTodayFollowUp
                                      ? "bg-amber-400 text-slate-950 shadow-xs"
                                      : "bg-slate-100 text-slate-700"
                                  }`}
                                >
                                  {p.nextFollowUp} {isTodayFollowUp && "(আজকে)"}
                                </span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                            <td className="p-3 font-black text-right text-emerald-700">
                              ৳{p.feePaid}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPatientForAttendance(p);
                                    setSessionFee("500");
                                    setUpdatedProblemNote(p.problem);
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1"
                                  title="উপস্থিতি ও সেশন সম্পন্ন করুন"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold hidden sm:inline">
                                    সেশন
                                  </span>
                                </button>

                                {isTodayFollowUp && (
                                  <button
                                    type="button"
                                    onClick={() => handleSendTodayReminder(p)}
                                    className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition-all"
                                    title="আজকের সেশনের রিমাইন্ডার হোয়াটসঅ্যাপ পাঠান"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => setSelectedPatientForView(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                  title="রোগীর বিস্তারিত হিস্ট্রি দেখুন"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ট্যাব ২: আয়-ব্যয় লেজার ও রিপোর্ট */}
        {activeTab === "TRANSACTIONS" && (
          <div className="space-y-6">
            {/* ফিল্টার বার */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-emerald-600" />
                  আয়-ব্যয়ের রিপোর্ট ফিল্টার করুন:
                </span>

                <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setTxTimeFilter("TODAY")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      txTimeFilter === "TODAY"
                        ? "bg-white text-emerald-950 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    আজকে
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTimeFilter("THIS_MONTH")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      txTimeFilter === "THIS_MONTH"
                        ? "bg-white text-emerald-950 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    চলতি মাস
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTimeFilter("LAST_MONTH")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      txTimeFilter === "LAST_MONTH"
                        ? "bg-white text-emerald-950 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    গত মাস
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTimeFilter("ALL")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      txTimeFilter === "ALL"
                        ? "bg-white text-emerald-950 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    সকল লেনদেন
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxTimeFilter("CUSTOM")}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                      txTimeFilter === "CUSTOM"
                        ? "bg-amber-400 text-slate-950 shadow-xs"
                        : "text-slate-600"
                    }`}
                  >
                    <CalendarRange className="w-3 h-3" /> কাস্টম রেঞ্জ
                  </button>
                </div>
              </div>

              {txTimeFilter === "CUSTOM" && (
                <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-200 flex flex-wrap items-center gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <span>শুরুর তারিখ:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="p-1.5 rounded-xl border border-amber-300 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                    <span>শেষের তারিখ:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="p-1.5 rounded-xl border border-amber-300 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">
                    ধরন:
                  </span>
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    <option value="ALL">আয় ও ব্যয় উভয়ই</option>
                    <option value="INCOME">শুধু আয় (+)</option>
                    <option value="EXPENSE">শুধু ব্যয় (-)</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500">
                    খাত:
                  </span>
                  <select
                    value={txCategoryFilter}
                    onChange={(e) => setTxCategoryFilter(e.target.value)}
                    className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    <option value="ALL">সকল খাত</option>
                    <optgroup label="আয়ের খাতসমূহ">
                      <option value="PATIENT_FEE">রোগীর ফি</option>
                      <option value="PRODUCTS_SALE">
                        তেল/মধু/সামগ্রী বিক্রয়
                      </option>
                      <option value="DONATION_GIFT">হাদিয়া / অনুদান</option>
                      <option value="OTHER_INCOME">অন্যান্য আয়</option>
                    </optgroup>
                    <optgroup label="ব্যয়ের খাতসমূহ">
                      <option value="RENT">সেন্টার ভাড়া</option>
                      <option value="MEDICINE_CUPS">
                        কাপ ও সার্জিক্যাল সামগ্রী
                      </option>
                      <option value="PRODUCTS_PURCHASE">
                        তেল/মধু স্টক ক্রয়
                      </option>
                      <option value="UTILITY">বিদ্যুৎ ও নেট বিল</option>
                      <option value="STAFF_SALARY">স্টাফ সম্মানী</option>
                      <option value="CONVEYANCE">যাতায়াত খরচ</option>
                      <option value="REFRESHMENT">মেহমানদারি ও নাস্তা</option>
                      <option value="OTHER_EXPENSE">অন্যান্য ব্যয়</option>
                    </optgroup>
                  </select>
                </div>
              </div>
            </div>

            {/* ফিল্টার করা সময়ের সামারি কার্ডস */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    নির্বাচিত সময়ের মোট আয়
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-950 mt-1 block">
                    ৳{filteredIncome}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-rose-800 block">
                    নির্বাচিত সময়ের মোট ব্যয়
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-rose-950 mt-1 block">
                    ৳{filteredExpense}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>

              <div
                className={`rounded-3xl p-4 border flex items-center justify-between ${
                  filteredNetBalance >= 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-700 block">
                    নিট ব্যালেন্স / উদ্বৃত্ত
                  </span>
                  <span
                    className={`text-xl sm:text-2xl font-black mt-1 block ${
                      filteredNetBalance >= 0
                        ? "text-blue-900"
                        : "text-amber-900"
                    }`}
                  >
                    ৳{filteredNetBalance}
                  </span>
                </div>
                <div
                  className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center ${
                    filteredNetBalance >= 0 ? "bg-blue-600" : "bg-amber-600"
                  }`}
                >
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* নতুন লেনদেন ফর্ম */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> নতুন
                  আয়/ব্যয় এন্ট্রি
                </h2>

                <form onSubmit={handleTxSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      লেনদেনের ধরন:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleTypeChange("INCOME")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          txType === "INCOME"
                            ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        🟢 আয় (Income)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTypeChange("EXPENSE")}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          txType === "EXPENSE"
                            ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                            : "bg-white text-slate-600 border-slate-200"
                        }`}
                      >
                        🔴 ব্যয় (Expense)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      {txType === "INCOME" ? "আয়ের খাত:" : "ব্যয়ের খাত:"}
                    </label>
                    <select
                      value={txCategory}
                      onChange={(e) => setTxCategory(e.target.value)}
                      className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
                    >
                      {txType === "INCOME" ? (
                        <>
                          <option value="PATIENT_FEE">
                            রোগীর ফি (Patient Fee)
                          </option>
                          <option value="PRODUCTS_SALE">
                            তেল/মধু/সামগ্রী বিক্রয় (Products Sale)
                          </option>
                          <option value="DONATION_GIFT">
                            হাদিয়া / অনুদান (Donation/Gift)
                          </option>
                          <option value="OTHER_INCOME">
                            অন্যান্য আয় (Other Income)
                          </option>
                        </>
                      ) : (
                        <>
                          <option value="RENT">সেন্টার ভাড়া (Rent)</option>
                          <option value="MEDICINE_CUPS">
                            হিজামা কাপ ও সার্জিক্যাল সামগ্রী (Supplies)
                          </option>
                          <option value="PRODUCTS_PURCHASE">
                            তেল, মধু ও কাঁচামাল ক্রয় (Stock Purchase)
                          </option>
                          <option value="UTILITY">
                            বিদ্যুৎ, পানি ও ইন্টারনেট বিল (Utility)
                          </option>
                          <option value="STAFF_SALARY">
                            স্টাফ / থেরাপিস্ট সম্মানী (Salary)
                          </option>
                          <option value="CONVEYANCE">
                            যাতায়াত ও পরিবহন খরচ (Conveyance)
                          </option>
                          <option value="REFRESHMENT">
                            মেহমানদারি ও নাস্তা (Refreshment)
                          </option>
                          <option value="OTHER_EXPENSE">
                            অন্যান্য ব্যয় (Other Expense)
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      টাকার পরিমাণ:
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ১০০০"
                      value={txAmount}
                      onChange={(e) => setTxAmount(e.target.value)}
                      required
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      তারিখ:
                    </label>
                    <input
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      বিবরণ / নোট (ঐচ্ছিক):
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: মাসিক দোকান ভাড়া পরিশোধ"
                      value={txNote}
                      onChange={(e) => setTxNote(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSubmittingTx ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PlusCircle className="w-4 h-4" />
                    )}
                    <span>হিসাব সংরক্ষণ করুন</span>
                  </button>
                </form>
              </div>

              {/* ফিল্টার করা লেনদেন তালিকা টেবিল */}
              <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-slate-800">
                      লেনদেন লেজার রিপোর্ট
                    </h2>
                    <p className="text-[10px] text-slate-400">
                      সকল রোগীর ফি ও আয়-ব্যয়ের হিসাব সমন্বিত
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    মোট: {filteredTransactions.length} টি এন্ট্রি
                  </span>
                </div>

                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">তারিখ</th>
                        <th className="p-3.5">খাত</th>
                        <th className="p-3.5">বিবরণ</th>
                        <th className="p-3.5">ধরন</th>
                        <th className="p-3.5 text-right">পরিমাণ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTransactions.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center p-8 text-slate-400"
                          >
                            নির্বাচিত সময়ে কোনো লেনদেনের রেকর্ড পাওয়া যায়নি।
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.map((t) => (
                          <tr
                            key={t.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3.5 text-slate-500">{t.date}</td>
                            <td className="p-3.5 font-bold text-slate-800">
                              {getCategoryNameBn(t.category)}
                            </td>
                            <td className="p-3.5 text-slate-600 max-w-[140px] truncate">
                              {t.note || "—"}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                                  t.type === "INCOME"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-rose-100 text-rose-800"
                                }`}
                              >
                                {t.type === "INCOME" ? "🟢 আয়" : "🔴 ব্যয়"}
                              </span>
                            </td>
                            <td
                              className={`p-3.5 font-black text-right ${t.type === "INCOME" ? "text-emerald-700" : "text-rose-600"}`}
                            >
                              {t.type === "INCOME" ? "+" : "-"}৳{t.amount}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* নতুন রাক্বী যুক্ত করার মডাল */}
      {isAddRaqiOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border border-emerald-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <UserCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    নতুন চিকিৎসক / রাক্বী যোগ করুন
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    তালিকায় নতুন রাক্বীর নাম যুক্ত হবে
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddRaqiOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRaqiSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  রাক্বীর নাম (টাইটেল সহ):
                </label>
                <input
                  type="text"
                  placeholder="যেমন: হাফেজ ক্বারী মাওলানা আব্দুল্লাহ"
                  value={newRaqiName}
                  onChange={(e) => setNewRaqiName(e.target.value)}
                  required
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  মোবাইল নাম্বার (ঐচ্ছিক):
                </label>
                <input
                  type="tel"
                  placeholder="যেমন: 01700000000"
                  value={newRaqiPhone}
                  onChange={(e) => setNewRaqiPhone(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRaqi}
                className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isSubmittingRaqi ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                <span>রাক্বী সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ১-ক্লিক উপস্থিতি ও সেশন সম্পন্ন মডাল */}
      {patientForAttendance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border border-emerald-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    উপস্থিতি ও সেশন সম্পন্ন
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {patientForAttendance.name} ({patientForAttendance.phone})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPatientForAttendance(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCompleteSessionSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  আজকের সেশন ফি (টাকা):
                </label>
                <input
                  type="number"
                  placeholder="যেমন: ৫০০"
                  value={sessionFee}
                  onChange={(e) => setSessionFee(e.target.value)}
                  required
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  পরবর্তী ফলো-আপের নতুন তারিখ:
                </label>
                <input
                  type="date"
                  value={newNextFollowUp}
                  onChange={(e) => setNewNextFollowUp(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  বর্তমান অবস্থা / সমস্যা আপডেট (ঐচ্ছিক):
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ব্যথা ৫০% কমেছে, আরও ১টি সেশন লাগবে"
                  value={updatedProblemNote}
                  onChange={(e) => setUpdatedProblemNote(e.target.value)}
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingSession}
                className="w-full mt-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                {isUpdatingSession ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>সেশন সম্পন্ন ও রসিদ পাঠান</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* রোগীর বিস্তারিত হিস্ট্রি ও প্রোফাইল মডাল */}
      {selectedPatientForView && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  👤
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {selectedPatientForView.name}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    রোগীর প্রোফাইল ও ট্রিটমেন্ট হিস্ট্রি
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">মোবাইল:</span>
                <span className="font-bold text-slate-900">
                  {selectedPatientForView.phone}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">চিকিৎসক / রাক্বী:</span>
                <span className="font-bold text-emerald-800">
                  {selectedPatientForView.raqiName || "প্রধান রাক্বী"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">রোগের ধরন:</span>
                <div>
                  {getProblemBadge(selectedPatientForView.problemCategory)}
                </div>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">গৃহীত সেবা:</span>
                <span className="font-bold text-emerald-800">
                  {selectedPatientForView.serviceType === "RUKYAH"
                    ? "শরঈ রুকিয়াহ"
                    : selectedPatientForView.serviceType === "HIJAMA"
                      ? "সুন্নতি হিজামা"
                      : "রুকিয়াহ + হিজামা"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">চিকিৎসার তারিখ:</span>
                <span className="font-bold text-slate-900">
                  {selectedPatientForView.sessionDate}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">মোট প্রদত্ত ফি:</span>
                <span className="font-black text-emerald-700">
                  ৳{selectedPatientForView.feePaid}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-slate-200">
                <span className="text-slate-500">পরবর্তী ফলো-আপ:</span>
                <span className="font-bold text-amber-800">
                  {selectedPatientForView.nextFollowUp || "নির্ধারিত নেই"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block mb-0.5">
                  নির্দিষ্ট সমস্যা / নোট:
                </span>
                <p className="font-medium text-slate-800 bg-white p-2 rounded-xl border border-slate-200">
                  {selectedPatientForView.problem || "কোনো বিবরণ নেই"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href={`https://wa.me/${selectedPatientForView.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ
              </a>
              <a
                href={`tel:${selectedPatientForView.phone}`}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" /> সরাসরি কল
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
