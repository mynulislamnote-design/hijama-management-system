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
  Clock,
  Sparkles,
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

export default function HijamaAdminDashboard() {
  const [activeTab, setActiveTab] = useState<"PATIENTS" | "TRANSACTIONS">(
    "PATIENTS",
  );
  const [patientViewMode, setPatientViewMode] = useState<
    "ALL" | "TODAY_FOLLOWUP"
  >("ALL");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  // সার্চ ও ফিল্টারিং স্টেট
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedServiceFilter, setSelectedServiceFilter] = useState("ALL");

  // রোগীর হিস্ট্রি ভিউ মডাল
  const [selectedPatientForView, setSelectedPatientForView] =
    useState<Patient | null>(null);

  // ১-ক্লিক সেশন সম্পন্ন ও উপস্থিতি মডাল স্টেট
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
  const [serviceType, setServiceType] = useState("RUKYAH");
  const [feePaid, setFeePaid] = useState("");

  const [todayStr, setTodayStr] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setTodayStr(today);
    setSessionDate(today);
    setTxDate(today);
  }, []);

  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);

  // আয়-ব্যয় ফর্ম স্টেট
  const [txType, setTxType] = useState("INCOME");
  const [txCategory, setTxCategory] = useState("PATIENT_FEE");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState("");
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/transactions"),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      if (Array.isArray(pData)) setPatients(pData);
      if (Array.isArray(tData)) setTransactions(tData);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // আজকের ফলো-আপ রোগী
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
        p.phone.includes(searchQuery);

      const matchesService =
        selectedServiceFilter === "ALL" ||
        p.serviceType === selectedServiceFilter;

      return matchesSearch && matchesService;
    });
  }, [
    patients,
    todayFollowUpPatients,
    patientViewMode,
    searchQuery,
    selectedServiceFilter,
  ]);

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
          serviceType,
          feePaid: Number(feePaid),
          sessionDate: sessionDate || todayStr,
          nextFollowUp: nextFollowUp || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(
          "আলহামদুলিল্লাহ! রোগীর তথ্য সফলভাবে সেভ হয়েছে এবং হোয়াটসঅ্যাপে রসিদ পাঠানো হয়েছে।",
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

      if (res.ok) {
        setSuccessMsg(
          `আলহামদুলিল্লাহ! ${patientForAttendance.name}-এর আজকের সেশন সম্পন্ন হয়েছে এবং হোয়াটসঅ্যাপে আপডেট রসিদ পাঠানো হয়েছে।`,
        );
        setPatientForAttendance(null);
        setSessionFee("");
        setNewNextFollowUp("");
        setUpdatedProblemNote("");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 6000);
      } else {
        alert("সেশন আপডেট করা যায়নি!");
      }
    } catch (err) {
      alert("সার্ভার এরর হয়েছে।");
    } finally {
      setIsUpdatingSession(false);
    }
  };

  const handleTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount) {
      alert("টাকার পরিমাণ দিন!");
      return;
    }

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

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("লেনদেন সফলভাবে রেকর্ড করা হয়েছে।");
        setTxAmount("");
        setTxNote("");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        alert(`রেকর্ড করা যায়নি! কারণ: ${data.error || "অজানা সমস্যা"}`);
      }
    } catch (err) {
      alert(`সার্ভার এরর: ${err}`);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const handleSendTodayReminder = async (patient: Patient) => {
    const text = `📅 *জরুরি সেশন রিমাইন্ডার*

আসসালামু আলাইকুম ${patient.name}!
আজকে (${todayStr}) আমাদের সেন্টারে আপনার নির্ধারিত রুকইয়াহ/হিজামা সেশন রয়েছে। অনুগ্রহ করে সুবিধাজনক সময়ে উপস্থিত হওয়ার অনুরোধ করা হলো।

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
    const pFee = todayPatients.reduce((sum, p) => sum + p.feePaid, 0);
    const otherIncome = transactions
      .filter((t) => t.date === todayStr && t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    return pFee + otherIncome;
  }, [todayPatients, transactions, todayStr]);

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
                রোগী ব্যবস্থাপনা, ফলো-আপ শিডিউল ও অটোমেটেড হোয়াটসঅ্যাপ
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
        {/* সফলতার অ্যালার্ট */}
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
            <DollarSign className="w-4 h-4" /> আয়-ব্যয় লেজার
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
                    মূল সমস্যা (সংক্ষেপে):
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: জাদুকরি প্রভাব / কোমর ব্যথা"
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
                    placeholder="নাম বা মোবাইল দিয়ে তাৎক্ষণিক খুঁজুন..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* রোগী তালিকা টেবিল */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">রোগীর নাম ও ফোন</th>
                      <th className="p-3">সার্ভিস</th>
                      <th className="p-3">চিকিৎসার তারিখ</th>
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
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  p.serviceType === "RUKYAH"
                                    ? "bg-amber-100 text-amber-800"
                                    : p.serviceType === "HIJAMA"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-purple-100 text-purple-800"
                                }`}
                              >
                                {p.serviceType === "RUKYAH"
                                  ? "রুকিয়াহ"
                                  : p.serviceType === "HIJAMA"
                                    ? "হিজামা"
                                    : "রুকিয়াহ + হিজামা"}
                              </span>
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
                                {/* ১-ক্লিক উপস্থিতি ও সেশন সম্পন্ন বাটন */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPatientForAttendance(p);
                                    setSessionFee("500"); // ডিফল্ট ফি সাজেশন
                                    setUpdatedProblemNote(p.problem);
                                  }}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1"
                                  title="উপস্থিতি ও সেশন সম্পন্ন করুন"
                                >
                                  <UserCheck className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-bold hidden sm:inline">
                                    সেশন সম্পন্ন
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

        {/* ট্যাব ২: আয়-ব্যয় লেজার */}
        {activeTab === "TRANSACTIONS" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                <DollarSign className="w-4 h-4 text-emerald-600" /> আয় কিংবা
                ব্যয় রেকর্ড করুন
              </h2>

              <form onSubmit={handleTxSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    লেনদেনের ধরন:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxType("INCOME")}
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
                      onClick={() => setTxType("EXPENSE")}
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
                    খাত বা ক্যাটাগরি:
                  </label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
                  >
                    <option value="PATIENT_FEE">রোগীর ফি (Patient Fee)</option>
                    <option value="RENT">সেন্টার ভাড়া (Rent)</option>
                    <option value="MEDICINE_CUPS">
                      মেডিসিন ও কাপ খরচ (Supplies)
                    </option>
                    <option value="UTILITY">
                      বিদ্যুৎ ও ইন্টারনেট বিল (Utility)
                    </option>
                    <option value="OTHER">অন্যান্য (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    টাকার পরিমাণ (টাকা):
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

            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800">
                  সকল লেনদেন লেজার
                </h2>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  মোট এন্ট্রি: {transactions.length} টি
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
                    {transactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center p-8 text-slate-400"
                        >
                          এখনো কোনো আয় বা ব্যয়ের হিসাব নেই।
                        </td>
                      </tr>
                    ) : (
                      transactions.map((t) => (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="p-3.5 text-slate-500">{t.date}</td>
                          <td className="p-3.5 font-bold text-slate-800">
                            {t.category}
                          </td>
                          <td className="p-3.5 text-slate-600 max-w-[130px] truncate">
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
        )}
      </main>

      {/* নতুন ফিচার: ১-ক্লিক উপস্থিতি ও সেশন সম্পন্ন মডাল */}
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
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
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

      {/* রোগীর হিস্ট্রি ও প্রোফাইল মডাল */}
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
                  রোগীর সমস্যা / নোট:
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
