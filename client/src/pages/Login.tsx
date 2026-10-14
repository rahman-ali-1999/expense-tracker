import React, { useState } from "react";
import API from "../services/api";

interface LoginProps {
  onLoginSuccess: () => void;
  switchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({
  onLoginSuccess,
  switchToRegister,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      onLoginSuccess();
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Login fail ho gaya. Kripya dobara try karein.",
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-white">
          Expense Tracker Login
        </h2>

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">
              Email Address
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 mt-1 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 mt-1 bg-slate-800 text-white border border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
          >
            Sign In
          </button>
        </form>

        <p className="text-sm text-center text-slate-400">
          Account nahi hai?{" "}
          <button
            onClick={switchToRegister}
            className="text-blue-400 hover:underline font-medium"
          >
            Register karein
          </button>
        </p>
      </div>
    </div>
  );
};
