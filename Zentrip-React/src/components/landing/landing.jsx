import { useNavigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import LogosBar from "./components/LogosBar";
import HowItWorks from "./components/HowItWorks";
import Features from "./components/Features";
import PetSection from "./components/PetSection";
import Testimonials from "./components/Testimonials";
import CTABanner from "./components/CTABanner";
import Footer from "./components/Footer";

export default function Landing() {
  const navigate = useNavigate();

  const goLogin = () => navigate("/Auth/Login");
  const goRegister = () => navigate("/Auth/Register");

  return (
    <div className="font-sans">
      <Navbar onLogin={goLogin} onRegister={goRegister} />
      <Hero onRegister={goRegister} />
      <LogosBar />
      <HowItWorks />
      <Features />
      <PetSection />
      <Testimonials />
      <CTABanner onRegister={goRegister} onLogin={goLogin} />
      <Footer />
    </div>
  );
}
