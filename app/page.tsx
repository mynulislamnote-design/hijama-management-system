"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  Trash2,
  Lock,
  ShieldAlert,
  LogOut,
  EyeOff,
  Printer,
  Download,
  FileSpreadsheet,
  Copy,
  MessageSquare,
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

interface ScheduledMsg {
  id: string;
  category: string;
  timeSlot: string;
  dayNumber?: number;
  date?: string;
  message: string;
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
    STAFF_SALARY: "স্টাফ/থেরাপিস্ট সম্মানী",
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
  // ১. পাসওয়ার্ড সিকিউরিটি স্টেট (Remember Me সুবিধা সহ)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [inputPassword, setInputPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [passwordError, setPasswordError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const localAuth = localStorage.getItem("hijama_admin_auth");
    const sessionAuth = sessionStorage.getItem("hijama_admin_auth");
    if (localAuth === "true" || sessionAuth === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword =
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "Addawah@2026";

    if (inputPassword.trim() === correctPassword.trim()) {
      if (rememberMe) {
        localStorage.setItem("hijama_admin_auth", "true");
      } else {
        sessionStorage.setItem("hijama_admin_auth", "true");
      }
      setIsAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("hijama_admin_auth");
    sessionStorage.removeItem("hijama_admin_auth");
    setIsAuthenticated(false);
    setInputPassword("");
  };

  // মূল ড্যাশবোর্ড স্টেটসমূহ
  const [activeTab, setActiveTab] = useState<
    "PATIENTS" | "TRANSACTIONS" | "MESSAGES"
  >("PATIENTS");
  const [patientViewMode, setPatientViewMode] = useState<
    "ALL" | "TODAY_FOLLOWUP"
  >("ALL");

  const [patients, setPatients] = useState<Patient[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [raqis, setRaqis] = useState<Raqi[]>([]);
  const [scheduledMsgs, setScheduledMsgs] = useState<ScheduledMsg[]>([]);
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

  // নতুন শিডিউল মেসেজ ফর্ম স্টেট
  const [msgCategory, setMsgCategory] = useState("ALL");
  const [msgTimeSlot, setMsgTimeSlot] = useState("MORNING");
  const [msgDayNumber, setMsgDayNumber] = useState("");
  const [msgSpecificDate, setMsgSpecificDate] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [isSubmittingMsg, setIsSubmittingMsg] = useState(false);

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
      const [pRes, tRes, rRes, mRes] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/transactions"),
        fetch("/api/raqis"),
        fetch("/api/scheduled-messages"),
      ]);
      const pData = await pRes.json();
      const tData = await tRes.json();
      const rData = await rRes.json();
      const mData = await mRes.json();

      if (Array.isArray(pData)) setPatients(pData);
      if (Array.isArray(tData)) setTransactions(tData);
      if (Array.isArray(mData)) setScheduledMsgs(mData);
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
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  // ভুল এন্ট্রি হওয়া রোগী ডিলিট ফাংশন
  const handleDeletePatient = async (id: string, patientName: string) => {
    if (
      !confirm(
        `⚠️ সতর্কবার্তা!\nআপনি কি নিশ্চিত যে "${patientName}"-এর তথ্য স্থায়ীভাবে মুছে ফেলতে চান?`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/patients?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPatients((prev) => prev.filter((p) => p.id !== id));
        setSuccessMsg(
          `রোগী "${patientName}" সফলভাবে তালিকা থেকে মুছে ফেলা হয়েছে।`,
        );
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        alert("ডিলিট করা সম্ভব হয়নি!");
      }
    } catch (err) {
      alert("সার্ভার এরর");
    }
  };

  // শিডিউল মেসেজ সাবমিট ও ডিলিট
  const handleScheduleMsgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgContent.trim()) return;

    setIsSubmittingMsg(true);
    try {
      const res = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: msgCategory,
          timeSlot: msgTimeSlot,
          dayNumber: msgDayNumber ? parseInt(msgDayNumber) : null,
          date: msgSpecificDate || null,
          message: msgContent,
        }),
      });

      if (res.ok) {
        setSuccessMsg(
          "নতুন আমল / মেসেজ সফলভাবে শিডিউল তালিকায় সংরক্ষিত হয়েছে!",
        );
        setMsgContent("");
        setMsgDayNumber("");
        setMsgSpecificDate("");
        await fetchData();
        setTimeout(() => setSuccessMsg(""), 5000);
      }
    } catch (err) {
      alert("মেসেজ সংরক্ষণ ব্যর্থ হয়েছে");
    } finally {
      setIsSubmittingMsg(false);
    }
  };

  const handleDeleteScheduledMsg = async (id: string) => {
    if (!confirm("আপনি কি এই শিডিউল মেসেজটি ডিলিট করতে চান?")) return;
    try {
      const res = await fetch(`/api/scheduled-messages?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setScheduledMsgs((prev) => prev.filter((m) => m.id !== id));
      }
    } catch (err) {
      alert("সার্ভার এরর");
    }
  };

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
      }
    } catch (err) {
      alert("সার্ভার এরর");
    } finally {
      setIsSubmittingRaqi(false);
    }
  };

  const handleDeleteRaqi = async (id: string, raqiTitle: string) => {
    if (!confirm(`আপনি কি "${raqiTitle}"-কে তালিকা থেকে মুছে ফেলতে চান?`))
      return;
    try {
      const res = await fetch(`/api/raqis?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRaqis((prev) => prev.filter((r) => r.id !== id));
        if (raqiName === raqiTitle) setRaqiName("");
        alert("রাক্বী সফলভাবে মুছে ফেলা হয়েছে!");
      }
    } catch (err) {
      alert("সার্ভার এরর");
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

  // মোট অল-টাইম নিট ক্যাশ ব্যালেন্স
  const totalLifetimeCashBalance = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    return inc - exp;
  }, [transactions]);

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
          `আলহামদুলিল্লাহ! ${name}-এর তথ্য সেভ হয়েছে এবং ফি আয়-ব্যয় লেজারে যোগ হয়েছে।`,
        );
        setName("");
        setPhone("");
        setProblem("");
        setFeePaid("");
        setNextFollowUp("");
        await fetchData();
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
          `আলহামদুলিল্লাহ! ${patientForAttendance.name}-এর সেশন সম্পন্ন হয়েছে ও ফি লেজারে যুক্ত হয়েছে।`,
        );
        setPatientForAttendance(null);
        setSessionFee("");
        setNewNextFollowUp("");
        setUpdatedProblemNote("");
        await fetchData();
        setTimeout(() => setSuccessMsg(""), 6000);
      }
    } catch (err) {
      alert(`সার্ভার এরর: ${err}`);
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
        await fetchData();
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

_আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট_`;

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

  // ১-ক্লিকে মাসের রোগীদের সারাংশ ক্লিপবোর্ডে কপি
  const handleCopyMonthSummary = () => {
    if (filteredPatients.length === 0) {
      alert("কপি করার মতো কোনো রোগীর তথ্য নেই!");
      return;
    }
    const lines = filteredPatients.map(
      (p, i) =>
        `${i + 1}. ${p.name} | ${p.phone} | ${p.problemCategory || "JINN"} | ফি: ৳${p.feePaid} | সেশন: ${p.sessionDate}`,
    );
    const summaryText =
      `📋 *আদ দাওয়াহ রোগী তালিকা সারাংশ*\nমোট রোগী: ${filteredPatients.length} জন\n\n` +
      lines.join("\n");

    navigator.clipboard.writeText(summaryText);
    alert(
      "✅ সফলভাবে ক্লিপবোর্ডে কপি হয়েছে! আপনি এখন যেকোনো জায়গায় পেস্ট করতে পারবেন।",
    );
  };

  // এক্সেল এক্সপোর্ট
  const exportPatientsToCSV = () => {
    if (filteredPatients.length === 0) {
      alert("এক্সপোর্ট করার মতো কোনো রোগীর তথ্য নেই!");
      return;
    }
    const headers = [
      "রোগীর নাম",
      "মোবাইল",
      "চিকিৎসক/রাক্বী",
      "রোগের ধরন",
      "গৃহীত সেবা",
      "সমস্যা/নোট",
      "চিকিৎসার তারিখ",
      "পরবর্তী ফলো-আপ",
      "মোট ফি (টাকা)",
    ];
    const rows = filteredPatients.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.phone}"`,
      `"${(p.raqiName || "প্রধান রাক্বী").replace(/"/g, '""')}"`,
      `"${p.problemCategory || "JINN"}"`,
      `"${p.serviceType === "RUKYAH" ? "শরঈ রুকিয়াহ" : p.serviceType === "HIJAMA" ? "সুন্নতি হিজামা" : "রুকিয়াহ + হিজামা"}"`,
      `"${(p.problem || "").replace(/"/g, '""')}"`,
      `"${p.sessionDate}"`,
      `"${p.nextFollowUp || "—"}"`,
      p.feePaid,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Patients_Report_${todayStr || "export"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportTransactionsToCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("এক্সপোর্ট করার মতো কোনো লেনদেনের তথ্য নেই!");
      return;
    }
    const headers = ["তারিখ", "খাত", "বিবরণ", "লেনদেনের ধরন", "পরিমাণ (টাকা)"];
    const rows = filteredTransactions.map((t) => [
      `"${t.date}"`,
      `"${getCategoryNameBn(t.category)}"`,
      `"${(t.note || "").replace(/"/g, '""')}"`,
      `"${t.type === "INCOME" ? "আয়" : "ব্যয়"}"`,
      t.type === "INCOME" ? t.amount : -t.amount,
    ]);
    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Transactions_Report_${todayStr || "export"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // রিসিট স্লিপ
  const handlePrintReceipt = (p: Patient) => {
    const printWindow = window.open("", "_blank", "width=550,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>মানি রিসিট - ${p.name}</title>
          <style>
            body { font-family: 'SolaimanLipi', sans-serif, system-ui; padding: 30px; color: #1e293b; }
            .receipt-box { border: 2px dashed #059669; padding: 25px; border-radius: 16px; max-width: 450px; margin: auto; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; margin-bottom: 18px; }
            .header h2 { margin: 0; color: #065f46; font-size: 20px; font-weight: 800; }
            .header p { margin: 4px 0 0; font-size: 11px; color: #64748b; }
            .row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .label { color: #64748b; font-weight: 600; }
            .val { font-weight: 700; color: #0f172a; }
            .fee-box { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 12px; border-radius: 10px; margin: 18px 0; display: flex; justify-content: space-between; font-size: 16px; font-weight: 800; color: #065f46; }
            .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8; padding-top: 25px; }
            .sign { border-top: 1px solid #94a3b8; width: 130px; text-align: center; padding-top: 6px; }
          </style>
        </head>
        <body>
          <div class="receipt-box">
            <div class="header">
              <h2>আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট</h2>
              <p>রোগী চিকিৎসা ও সেবা রসিদ</p>
            </div>
            <div class="row"><span class="label">রসিদ নং:</span><span class="val">#${p.id.slice(-6).toUpperCase()}</span></div>
            <div class="row"><span class="label">তারিখ:</span><span class="val">${p.sessionDate}</span></div>
            <div class="row"><span class="label">রোগীর নাম:</span><span class="val">${p.name}</span></div>
            <div class="row"><span class="label">মোবাইল:</span><span class="val">${p.phone}</span></div>
            <div class="row"><span class="label">চিকিৎসক / রাক্বী:</span><span class="val">${p.raqiName || "প্রধান রাক্বী"}</span></div>
            <div class="row"><span class="label">গৃহীত সেবা:</span><span class="val">${p.serviceType === "RUKYAH" ? "শরঈ রুকিয়াহ" : p.serviceType === "HIJAMA" ? "সুন্নতি হিজামা" : "রুকিয়াহ + হিজামা"}</span></div>
            <div class="row"><span class="label">পরবর্তী সেশন:</span><span class="val">${p.nextFollowUp || "নির্ধারিত নেই"}</span></div>
            <div class="fee-box"><span>পরিশোধিত ফি:</span><span>৳${p.feePaid}</span></div>
            <div class="footer">
              <div>মুদ্রণ: ${new Date().toLocaleDateString("bn-BD")}</div>
              <div class="sign">কর্তৃপক্ষের স্বাক্ষর</div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // সিকিউরিটি লগইন স্ক্রিন (ব্রাউজারে পাসওয়ার্ড সেভ করার প্রপার ফরম্যাট সহ)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans text-slate-100">
        <div className="w-full max-w-sm bg-slate-800/90 backdrop-blur-md rounded-3xl p-6 shadow-2xl border border-slate-700 space-y-5 animate-in fade-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-black text-white">
              রুকইয়াহ ও হিজামা অ্যাডমিন পোর্টাল
            </h2>
            <p className="text-xs text-slate-400">
              এই পেজটি শুধুমাত্র সেন্টারের কর্তৃপক্ষের জন্য সংরক্ষিত
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {/* ব্রাউজার যাতে বুঝতে পারে এটি একটি অ্যাডমিন অ্যাকাউন্ট */}
            <input
              type="text"
              name="username"
              autoComplete="username"
              value="admin"
              readOnly
              className="hidden"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                মাস্টার সিক্রেট পাসওয়ার্ড দিন:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={inputPassword}
                  onChange={(e) => {
                    setInputPassword(e.target.value);
                    setPasswordError(false);
                  }}
                  required
                  className="w-full text-sm pl-4 pr-10 py-3 rounded-xl bg-slate-950/70 border border-slate-600 focus:border-emerald-500 focus:outline-none text-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* পাসওয়ার্ড মনে রাখার অপশন */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-600 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs font-bold text-slate-400 cursor-pointer select-none"
                >
                  ব্রাউজারে পাসওয়ার্ড মনে রাখুন (Remember Me)
                </label>
              </div>

              {passwordError && (
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1 mt-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> ভুল পাসওয়ার্ড! আবার
                  চেষ্টা করুন।
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-3 rounded-xl text-xs shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>ড্যাশবোর্ডে প্রবেশ করুন</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

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
                আদ দাওয়াহ রুকইয়াহ এন্ড হিজামা সাপোর্ট
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
            <button
              onClick={handleAdminLogout}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
              title="অ্যাডমিন প্যানেল লক করুন"
            >
              <LogOut className="w-3.5 h-3.5" />
              লক / লগআউট
            </button>
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
              <DollarSign className="w-3.5 h-3.5 text-blue-600" /> মোট নিট ক্যাশ
              ব্যালেন্স
            </span>
            <div className="text-xl sm:text-2xl font-black text-blue-700">
              ৳{totalLifetimeCashBalance}
            </div>
          </div>
        </div>

        {/* প্রধান ৩টি ট্যাব সুইচ */}
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
            <Users className="w-4 h-4" /> রোগী ব্যবস্থাপনা ({patients.length})
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
            <DollarSign className="w-4 h-4" /> আয়-ব্যয় লেজার (
            {transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MESSAGES")}
            className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === "MESSAGES"
                ? "bg-emerald-700 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" /> আমল ও মেসেজ শিডিউলার (
            {scheduledMsgs.length})
          </button>
        </div>

        {/* ট্যাব ১: রোগী ব্যবস্থাপনা */}
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

            {/* ডান পাশ: রোগী তালিকা ও অ্যাকশন */}
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
                    {/* কপি সামারি বাটন */}
                    <button
                      type="button"
                      onClick={handleCopyMonthSummary}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      title="রোগীদের সংক্ষিপ্ত তালিকা কপি করুন"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-600" />
                      <span>কপি তালিকা</span>
                    </button>

                    {/* এক্সেল বাটন */}
                    <button
                      type="button"
                      onClick={exportPatientsToCSV}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                      title="এক্সেল ডাউনলোড করুন"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600" />
                      <span>এক্সেল</span>
                    </button>

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

              {/* রোগী তালিকা টেবিল */}
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">রোগীর নাম ও ফোন</th>
                      <th className="p-3">সমস্যা ও রাক্বী</th>
                      <th className="p-3">তারিখ</th>
                      <th className="p-3">ফলো-আপ</th>
                      <th className="p-3 text-center">উপস্থিতি / অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center p-8 text-slate-400"
                        >
                          কোনো রোগীর তথ্য পাওয়া যায়নি।
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
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
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
                                  onClick={() => handlePrintReceipt(p)}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all"
                                  title="মানি রিসিট প্রিন্ট করুন"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setSelectedPatientForView(p)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all"
                                  title="বিস্তারিত দেখুন"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>

                                {/* ভুল এন্ট্রি মুছে ফেলার বাটন */}
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeletePatient(p.id, p.name)
                                  }
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-all"
                                  title="ভুল এন্ট্রি মুছে ফেলুন"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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

              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={txTypeFilter}
                    onChange={(e) => setTxTypeFilter(e.target.value)}
                    className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    <option value="ALL">আয় ও ব্যয় উভয়ই</option>
                    <option value="INCOME">শুধু আয় (+)</option>
                    <option value="EXPENSE">শুধু ব্যয় (-)</option>
                  </select>

                  <select
                    value={txCategoryFilter}
                    onChange={(e) => setTxCategoryFilter(e.target.value)}
                    className="text-xs font-bold p-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none"
                  >
                    <option value="ALL">সকল খাত</option>
                    <optgroup label="আয়ের খাতসমূহ">
                      <option value="PATIENT_FEE">রোগীর ফি</option>
                      <option value="PRODUCTS_SALE">তেল/মধু বিক্রয়</option>
                      <option value="DONATION_GIFT">হাদিয়া / অনুদান</option>
                      <option value="OTHER_INCOME">অন্যান্য আয়</option>
                    </optgroup>
                    <optgroup label="ব্যয়ের খাতসমূহ">
                      <option value="RENT">সেন্টার ভাড়া</option>
                      <option value="MEDICINE_CUPS">হিজামা সামগ্রী</option>
                      <option value="STAFF_SALARY">স্টাফ সম্মানী</option>
                      <option value="UTILITY">বিদ্যুৎ ও নেট বিল</option>
                      <option value="OTHER_EXPENSE">অন্যান্য ব্যয়</option>
                    </optgroup>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={exportTransactionsToCSV}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>লেজার এক্সেল ডাউনলোড</span>
                </button>
              </div>
            </div>

            {/* সামারি কার্ডস */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 block">
                    নির্বাচিত সময়ের আয়
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
                    নির্বাচিত সময়ের ব্যয়
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-rose-950 mt-1 block">
                    ৳{filteredExpense}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-3xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-800 block">
                    নির্বাচিত সময়ের নিট লাভ
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-blue-900 mt-1 block">
                    ৳{filteredNetBalance}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* লেনদেন এন্ট্রি ও টেবিল */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
                <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" /> নতুন
                  আয়/ব্যয় এন্ট্রি
                </h2>

                <form onSubmit={handleTxSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleTypeChange("INCOME")}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        txType === "INCOME"
                          ? "bg-emerald-700 text-white border-emerald-700"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      🟢 আয়
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTypeChange("EXPENSE")}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        txType === "EXPENSE"
                          ? "bg-rose-600 text-white border-rose-600"
                          : "bg-white text-slate-600"
                      }`}
                    >
                      🔴 ব্যয়
                    </button>
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
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 font-bold"
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
                      বিবরণ / নোট:
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: বিদ্যুৎ বিল পরিশোধ"
                      value={txNote}
                      onChange={(e) => setTxNote(e.target.value)}
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingTx}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
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
                    লেনদেন লেজার তালিকা
                  </h2>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    মোট: {filteredTransactions.length} টি
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
                      {filteredTransactions.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50">
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ট্যাব ৩: আমল ও মেসেজ শিডিউলার */}
        {activeTab === "MESSAGES" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* নতুন শিডিউল মেসেজ ফর্ম */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-4">
              <h2 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b pb-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" /> নতুন
                মেসেজ শিডিউল করুন
              </h2>

              <form onSubmit={handleScheduleMsgSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    রোগীর ক্যাটাগরি:
                  </label>
                  <select
                    value={msgCategory}
                    onChange={(e) => setMsgCategory(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:outline-none"
                  >
                    <option value="ALL">সকল রোগী (সকলের জন্য)</option>
                    <option value="JINN">👿 শুধু জ্বিনের রোগী</option>
                    <option value="SIHR">🪄 শুধু যাদুর রোগী</option>
                    <option value="AYN">👁️ শুধু বদনজরের রোগী</option>
                    <option value="PHYSICAL_HIJAMA">🩸 শুধু হিজামা রোগী</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      সময় (Slot):
                    </label>
                    <select
                      value={msgTimeSlot}
                      onChange={(e) => setMsgTimeSlot(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    >
                      <option value="MORNING">সকাল ৮:০০ টা</option>
                      <option value="EVENING">বিকেল ৫:০০ টা</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      কততম দিন (১-৩০):
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ১ বা ২"
                      value={msgDayNumber}
                      onChange={(e) => setMsgDayNumber(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">
                    অথবা নির্দিষ্ট তারিখ (ঐচ্ছিক):
                  </label>
                  <input
                    type="date"
                    value={msgSpecificDate}
                    onChange={(e) => setMsgSpecificDate(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50/50"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-bold text-slate-600">
                      হোয়াটসঅ্যাপ মেসেজের বার্তা:
                    </label>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      রোগীর নাম = {"{name}"}
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    placeholder="আসসালামু আলাইকুম {name}! আজকের বিশেষ আমল হলো..."
                    value={msgContent}
                    onChange={(e) => setMsgContent(e.target.value)}
                    required
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingMsg}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {isSubmittingMsg ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>মেসেজ সংরক্ষণ করুন</span>
                </button>
              </form>
            </div>

            {/* সংরক্ষিত মেসেজ তালিকা */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col p-4 space-y-3">
              <div className="border-b pb-2 flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800">
                  নির্ধারিত শিডিউল মেসেজ তালিকা ({scheduledMsgs.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  অটোমেটিক সকাল/বিকেলে যাবে
                </p>
              </div>

              <div className="overflow-y-auto max-h-[550px] space-y-3 pr-1">
                {scheduledMsgs.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-xs">
                    এখনো কোনো কাস্টম মেসেজ যোগ করা হয়নি। ডিফল্ট মাসনুন আমল
                    যাচ্ছে।
                  </div>
                ) : (
                  scheduledMsgs.map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 relative"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              m.timeSlot === "MORNING"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-800"
                            }`}
                          >
                            {m.timeSlot === "MORNING"
                              ? "☀️ সকাল ৮:০০ টা"
                              : "🌙 বিকেল ৫:০০ টা"}
                          </span>
                          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {m.category === "ALL" ? "সকল রোগী" : m.category}
                          </span>
                          {m.dayNumber && (
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              দিন {m.dayNumber}
                            </span>
                          )}
                          {m.date && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              তারিখ: {m.date}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledMsg(m.id)}
                          className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans">
                        {m.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* রাক্বী অ্যাড মডাল */}
      {isAddRaqiOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                নতুন রাক্বী যোগ করুন
              </h3>
              <button
                onClick={() => setIsAddRaqiOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 border-b pb-3">
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                {raqis.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200"
                  >
                    <span className="font-bold text-xs text-slate-800">
                      {r.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRaqi(r.id, r.name)}
                      className="p-1.5 text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddRaqiSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="রাক্বীর নাম (টাইটেল সহ)"
                value={newRaqiName}
                onChange={(e) => setNewRaqiName(e.target.value)}
                required
                className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="submit"
                disabled={isSubmittingRaqi}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs"
              >
                সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}

      {/* সেশন উপস্থিতি মডাল */}
      {patientForAttendance && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                উপস্থিতি ও সেশন সম্পন্ন
              </h3>
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
                  className="w-full text-xs font-bold p-3 rounded-xl border border-slate-200 bg-slate-50 text-emerald-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  পরবর্তী ফলো-আপ তারিখ:
                </label>
                <input
                  type="date"
                  value={newNextFollowUp}
                  onChange={(e) => setNewNextFollowUp(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  সমস্যা / নোট আপডেট:
                </label>
                <input
                  type="text"
                  placeholder="যেমন: উন্নতি হচ্ছে"
                  value={updatedProblemNote}
                  onChange={(e) => setUpdatedProblemNote(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingSession}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold py-3.5 rounded-2xl text-xs"
              >
                সেশন সম্পন্ন ও রসিদ পাঠান
              </button>
            </form>
          </div>
        </div>
      )}

      {/* বিস্তারিত ভিউ মডাল */}
      {selectedPatientForView && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm">
                {selectedPatientForView.name}
              </h3>
              <button
                onClick={() => setSelectedPatientForView(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between border-b pb-1">
                <span>মোবাইল:</span>
                <span className="font-bold">
                  {selectedPatientForView.phone}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>চিকিৎসক:</span>
                <span className="font-bold text-emerald-800">
                  {selectedPatientForView.raqiName || "প্রধান রাক্বী"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>সমস্যা:</span>
                <div>
                  {getProblemBadge(selectedPatientForView.problemCategory)}
                </div>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>পরবর্তী ফলো-আপ:</span>
                <span className="font-bold text-amber-800">
                  {selectedPatientForView.nextFollowUp || "নেই"}
                </span>
              </div>
              <p className="p-2 bg-white rounded-xl border border-slate-200 mt-2">
                {selectedPatientForView.problem || "কোনো নোট নেই"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/${selectedPatientForView.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" /> হোয়াটসঅ্যাপ
              </a>
              <a
                href={`tel:${selectedPatientForView.phone}`}
                className="py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" /> কল করুন
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
