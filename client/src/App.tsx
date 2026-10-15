import { useState, useEffect } from "react";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState<"login" | "register">("login");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    setCurrentView("login");
  };

  if (isAuthenticated) {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <>
      {currentView === "login" ? (
        <Login
          onLoginSuccess={() => setIsAuthenticated(true)}
          switchToRegister={() => setCurrentView("register")}
        />
      ) : (
        <Register switchToLogin={() => setCurrentView("login")} />
      )}
    </>
  );
}

export default App;
