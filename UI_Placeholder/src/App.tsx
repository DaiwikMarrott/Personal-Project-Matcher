/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import Splash from "./components/Splash";
import Landing from "./components/Landing";
import SignIn from "./components/SignIn";
import SignUp1 from "./components/SignUp1";
import SignUp2 from "./components/SignUp2";
import MainLayout from "./components/MainLayout";

export type View =
  | "splash"
  | "landing"
  | "signin"
  | "signup1"
  | "signup2"
  | "main";

export default function App() {
  const [view, setView] = useState<View>("splash");

  useEffect(() => {
    if (view === "splash") {
      const timer = setTimeout(() => setView("landing"), 3000);
      return () => clearTimeout(timer);
    }
  }, [view]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfbf7] to-[#e6f7ed] text-stone-800 font-sans selection:bg-emerald-200">
      <AnimatePresence mode="wait">
        {view === "splash" && <Splash key="splash" />}
        {view === "landing" && (
          <Landing key="landing" onNext={() => setView("signin")} />
        )}
        {view === "signin" && (
          <SignIn
            key="signin"
            onSignUp={() => setView("signup1")}
            onSignIn={() => setView("main")}
          />
        )}
        {view === "signup1" && (
          <SignUp1
            key="signup1"
            onNext={() => setView("signup2")}
            onBack={() => setView("signin")}
          />
        )}
        {view === "signup2" && (
          <SignUp2
            key="signup2"
            onNext={() => setView("main")}
            onBack={() => setView("signup1")}
          />
        )}
        {view === "main" && (
          <MainLayout key="main" onLogout={() => setView("landing")} />
        )}
      </AnimatePresence>
    </div>
  );
}
