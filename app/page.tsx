import dynamic from "next/dynamic";
import Nav from "@/components/site/Nav";
import Hero from "@/components/site/Hero";
import Band from "@/components/site/Band";
import Converge from "@/components/site/Converge";
import HarnessGrid from "@/components/site/HarnessGrid";

const Architecture = dynamic(() => import("@/components/site/Architecture"));
const LiveDemo = dynamic(() => import("@/components/site/LiveDemo"));
const Capabilities = dynamic(() => import("@/components/site/Capabilities"));
const Roadmap = dynamic(() => import("@/components/site/Roadmap"));
const Safety = dynamic(() => import("@/components/site/Safety"));
const Footer = dynamic(() => import("@/components/site/Footer"));

export default function Home() {
  return (
    <main className="relative">
      <Nav />
      <Hero />
      <Band />
      <Converge />
      <HarnessGrid />
      <Architecture />
      <Capabilities />
      <LiveDemo />
      <Safety />
      <Roadmap />
      <Footer />
    </main>
  );
}
