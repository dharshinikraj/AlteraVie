import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AssessmentProvider } from "./context/AssessmentContext";
import Navbar from "./components/Navbar";
import MobileBottomNav from "./components/MobileBottomNav";
import SplashScreen from "./components/SplashScreen";
import Home from "./pages/Home";
import ProfileForm from "./pages/ProfileForm";
import Prediction from "./pages/Prediction";
import Nutrition from "./pages/Nutrition";
import Recommendations from "./pages/Recommendations";
import FoodVision from "./pages/FoodVision";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import DoctorFinder from "./pages/DoctorFinder";
import ChatAssistant from "./pages/ChatAssistant";
import Supplements from "./pages/Supplements";
import PantryChef from "./pages/PantryChef";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <AssessmentProvider>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        </AnimatePresence>
        <div className="min-h-screen overflow-x-hidden bg-[#F7F9F7] dark:bg-[#0B1220] text-slate-800 dark:text-slate-100 transition-colors duration-300">
          <Navbar />
          <main className="app-shell-main">
            <Routes>
              <Route path="/" element={<Home showSplash={showSplash} />} />
              <Route path="/profile" element={<ProfileForm />} />
              <Route path="/prediction" element={<Prediction />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/recommendations" element={<Recommendations />} />
              <Route path="/food-vision" element={<FoodVision />} />
              <Route path="/doctors" element={<DoctorFinder />} />
              <Route path="/chat" element={<ChatAssistant />} />
              <Route path="/pantry" element={<PantryChef />} />
              <Route path="/deals" element={<Supplements />} />
              <Route path="/supplements" element={<Supplements />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </main>
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </AssessmentProvider>
  );
}
