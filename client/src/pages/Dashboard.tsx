import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Expense {
  id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
}

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await API.get("/expenses");
      setExpenses(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("Fetch expenses error:", err.response?.data || err.message);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !amount || !category) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const payload = {
        title: title.trim(),
        amount: Number(amount),
        category,
        date: date || new Date().toISOString().split("T")[0],
      };

      console.log("Submitting Expense Payload:", payload);

      await API.post("/expenses", payload);

      // Reset form on success
      setTitle("");
      setAmount("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);

      // Refresh list
      fetchExpenses();
    } catch (err: any) {
      console.error("Add expense error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message ||
          "Failed to add expense. Please check your network or server logs.",
      );
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      setError("");
      await API.delete(`/expenses/${id}`);
      fetchExpenses();
    } catch (err: any) {
      console.error("Delete expense error:", err.response?.data || err.message);
      setError("Failed to delete expense. Please try again.");
    }
  };

  // Reset Filters Function
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert("No expenses available to export!");
      return;
    }

    const headers = ["ID", "Title", "Category", "Amount (INR)", "Date"];
    const rows = filteredExpenses.map((exp) => [
      exp.id,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${exp.category.replace(/"/g, '""')}"`,
      exp.amount,
      exp.date ? new Date(exp.date).toLocaleDateString() : "",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `expenses_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Safe Filtered Expenses logic
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      (exp.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (exp.category?.toLowerCase() || "").includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" ||
      (exp.category?.toLowerCase() || "") === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  // Unique Categories List for Filter Dropdown
  const uniqueCategories = [
    "All",
    ...Array.from(new Set(expenses.map((e) => e.category).filter(Boolean))),
  ];

  // Total amount calculation
  const totalAmount = expenses.reduce(
    (acc, curr) => acc + Number(curr.amount || 0),
    0,
  );

  // Category-wise totals for Analytics Chart
  const categoryTotals: { [key: string]: number } = {};
  expenses.forEach((exp) => {
    const cat = exp.category || "Uncategorized";
    categoryTotals[cat] = (categoryTotals[cat] || 0) + Number(exp.amount || 0);
  });

  const chartData = {
    labels: Object.keys(categoryTotals),
    datasets: [
      {
        label: "Expense (₹)",
        data: Object.values(categoryTotals),
        backgroundColor: [
          "#3b82f6",
          "#10b981",
          "#f59e0b",
          "#ef4444",
          "#8b5cf6",
          "#ec4899",
          "#14b8a6",
        ],
        borderColor: "#0f172a",
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <h1 className="text-2xl font-bold text-white">
            Expense Tracker Dashboard
          </h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-white bg-red-600/80 rounded-lg hover:bg-red-600 transition font-semibold shadow-lg shadow-red-900/20"
          >
            Logout
          </button>
        </div>

        {/* Summary & Analytics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-400">
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-emerald-400 mt-2">
              ₹{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-400">
              Total Transactions
            </h3>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {expenses.length}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-400">
              Active Categories
            </h3>
            <p className="text-3xl font-bold text-amber-400 mt-2">
              {Object.keys(categoryTotals).length}
            </p>
          </div>
        </div>

        {/* Category Chart Section */}
        {expenses.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              Category Analytics
            </h2>
            <div className="flex flex-col md:flex-row items-center justify-around gap-6">
              <div className="w-64 h-64">
                <Doughnut
                  data={chartData}
                  options={{
                    maintainAspectRatio: true,
                    plugins: { legend: { labels: { color: "#94a3b8" } } },
                  }}
                />
              </div>
              <div className="w-full md:w-1/2 space-y-2">
                {Object.entries(categoryTotals).map(([cat, amt]) => {
                  const percentage =
                    totalAmount > 0
                      ? ((amt / totalAmount) * 100).toFixed(1)
                      : "0";
                  return (
                    <div
                      key={cat}
                      className="flex justify-between items-center p-2 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <span className="text-slate-300 font-medium">{cat}</span>
                      <div className="text-right">
                        <span className="text-emerald-400 font-semibold mr-2">
                          ₹{amt}
                        </span>
                        <span className="text-xs text-slate-400">
                          ({percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* English Error Banner */}
        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg">
            {error}
          </div>
        )}

        {/* Add Expense Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xl font-semibold text-white">Add New Expense</h2>
          <form
            onSubmit={handleAddExpense}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            <input
              type="text"
              placeholder="Title (e.g., Coffee, Fuel)"
              required
              className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              type="number"
              placeholder="Amount (₹)"
              min="1"
              required
              className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <select
              required
              className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>
                Select Category
              </option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Bills">Bills</option>
              <option value="Shopping">Shopping</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              required
              className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button
              type="submit"
              className="py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition font-semibold shadow-lg shadow-blue-600/20"
            >
              Add Expense
            </button>
          </form>
        </div>

        {/* Search, Filter, and Export Controls */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-white">Your Expenses</h2>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                placeholder="Search expense..."
                className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-full sm:w-auto"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <select
                className="px-4 py-2 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm w-full sm:w-auto"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Clear Filters Button */}
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-lg transition w-full sm:w-auto"
              >
                Clear Filters
              </button>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 text-xs font-medium text-white bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 rounded-lg transition w-full sm:w-auto shadow-md"
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          {loading ? (
            <p className="text-slate-400 py-4 text-center">
              Loading expenses...
            </p>
          ) : filteredExpenses.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-slate-400">
                {expenses.length === 0
                  ? "No expenses found. Add your first expense above!"
                  : "No expenses match the current filter criteria."}
              </p>
              {expenses.length > 0 &&
                (searchQuery || selectedCategory !== "All") && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-blue-400 underline hover:text-blue-300"
                  >
                    View All Expenses
                  </button>
                )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-sm">
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => (
                    <tr
                      key={exp.id}
                      className="border-b border-slate-800/60 hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3 px-4 text-slate-200 font-medium">
                        {exp.title}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        <span className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-full">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-sm">
                        {exp.date
                          ? new Date(exp.date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        ₹{exp.amount}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="px-3 py-1 text-sm text-white bg-red-600/80 rounded hover:bg-red-600 transition shadow-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
