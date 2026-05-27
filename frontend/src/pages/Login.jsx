import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService.js";
import loginImage from "../assets/SLTMobitel_Logo.svg";
import { motion } from "framer-motion";
import { useToast } from "../components/ToastProvider.jsx";

const Login = () => {
  const [isAzureLoading, setIsAzureLoading] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Clear Azure loading state on mount (in case user came back from Azure)
  useEffect(() => {
    console.log("Login component mounted, clearing Azure state...");

    const wasAzureLoading = sessionStorage.getItem("azureLoginInProgress");
    if (wasAzureLoading) {
      console.log("Found stale azureLoginInProgress flag, clearing...");
      sessionStorage.removeItem("azureLoginInProgress");
    }

    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("msal.")) {
          keysToRemove.push(key);
        }
      }
      if (keysToRemove.length > 0) {
        console.log("Clearing MSAL session storage:", keysToRemove);
        keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      }
    } catch (e) {
      console.log("Error clearing MSAL storage:", e);
    }

    setIsAzureLoading(false);

    return () => {
      if (!sessionStorage.getItem("azureLoginInProgress")) {
        console.log("Component unmounting, clearing MSAL state...");
        try {
          const keysToRemove = [];
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith("msal.")) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((key) => sessionStorage.removeItem(key));
        } catch (e) {
          console.log("Error in cleanup:", e);
        }
      }
    };
  }, []);

  const handleAzureLogin = async () => {
    if (isAzureLoading) {
      console.log("Azure login already in progress, ignoring click");
      return;
    }

    console.log("Starting Azure login...");
    setIsAzureLoading(true);

    try {
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes("msal") || key.includes("azure"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      console.log("Cleared MSAL session storage items:", keysToRemove);
    } catch (e) {
      console.log("Error clearing session storage:", e);
    }

    sessionStorage.setItem("azureLoginInProgress", "true");

    try {
      await authService.azureLogin();
      // Redirects to Microsoft — code below won't execute
    } catch (error) {
      console.error("Azure login error:", error);
      showToast(
        error.message || "Azure login failed. Please try again.",
        "error"
      );
      setIsAzureLoading(false);
      sessionStorage.removeItem("azureLoginInProgress");
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-tr from-indigo-900 via-blue-800 to-blue-600">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5 backdrop-blur-sm"
            style={{
              width: `${Math.random() * 300 + 100}px`,
              height: `${Math.random() * 300 + 100}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${Math.random() * 10 + 15}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative flex justify-center items-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-4xl flex flex-col md:flex-row rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md bg-white/10"
        >
          {/* Left side — Branding */}
          <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-900 to-indigo-900 p-8 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl" />
            <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 backdrop-blur-sm" />

            <div className="relative z-10 space-y-6">
              <div className="flex justify-center py-6">
                <img
                  src={loginImage}
                  alt="SLT Mobitel"
                  className="w-3/4 drop-shadow-lg filter brightness-110"
                />
              </div>

              <div className="space-y-4 text-white">
                <h2 className="text-2xl font-bold tracking-tight">
                  Welcome to Gate Pass Portal
                </h2>
                <p className="opacity-80 leading-relaxed">
                  Secure, efficient, and user-friendly access management for SLT
                  premises.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <div className="h-1 w-16 bg-blue-400 mb-6" />
              <p className="text-blue-100 text-sm">
                © 2025 SLT-MOBITEL. All rights reserved.
              </p>
            </div>
          </div>

          {/* Right side — Microsoft SSO only */}
          <div className="w-full md:w-7/12 bg-white p-8 md:p-12 flex flex-col justify-center">
            <div className="max-w-md mx-auto w-full">
              <h1 className="text-3xl font-extrabold mb-3 text-gray-800">
                Sign In
              </h1>
              <p className="mb-10 text-gray-500 font-medium">
                Use your SLT Microsoft account to access the portal
              </p>

              {/* Microsoft / Azure SSO Button */}
              <button
                onClick={handleAzureLogin}
                disabled={isAzureLoading}
                className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold text-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-1"
              >
                {isAzureLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing in with Microsoft...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-3"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                    </svg>
                    Sign in with Microsoft
                  </>
                )}
              </button>

              {/* Security note */}
              <div className="mt-8 flex items-start gap-3 bg-blue-50 rounded-xl p-4">
                <svg
                  className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <p className="text-sm text-blue-700 leading-relaxed">
                  Your sign-in is secured by Microsoft Azure Active Directory
                  and SLT corporate security policies.
                </p>
              </div>

              <div className="mt-8 text-center">
                <p className="text-sm text-gray-500">
                  Don't have access?{" "}
                  <a
                    href="#"
                    className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Contact administrator
                  </a>
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;