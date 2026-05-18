import React from "react";
import { Wrench, Clock, Rocket } from "lucide-react";

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative flex items-center justify-center">

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-black to-purple-900 animate-pulse opacity-80"></div>

      {/* Floating Glow Circles */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-cyan-500 rounded-full blur-[120px] opacity-20 animate-bounce"></div>

      <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-500 rounded-full blur-[120px] opacity-20 animate-pulse"></div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

      {/* Main Card */}
      <div className="relative z-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl p-10 w-[90%] max-w-3xl text-center">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400 blur-3xl opacity-40 animate-ping rounded-full"></div>

            <div className="relative bg-cyan-500/20 border border-cyan-400 p-6 rounded-full">
              <Wrench size={60} className="text-cyan-300 animate-spin" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
          Website Under Maintenance
        </h1>

        {/* Subtitle */}
        <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8">
          We’re currently improving our website to give you a better experience.
          Our team is working hard behind the scenes.
        </p>

        {/* Status Cards */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">

          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 hover:scale-105 transition duration-500">
            <Clock className="mx-auto text-cyan-300 mb-3" size={35} />
            <h2 className="font-semibold text-lg">Estimated Time</h2>
            <p className="text-gray-400 mt-2">Back Soon</p>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 hover:scale-105 transition duration-500">
            <Rocket className="mx-auto text-purple-300 mb-3 animate-bounce" size={35} />
            <h2 className="font-semibold text-lg">Upgrading</h2>
            <p className="text-gray-400 mt-2">Performance & UI</p>
          </div>

          <div className="bg-white/10 border border-white/10 rounded-2xl p-5 hover:scale-105 transition duration-500">
            <Wrench className="mx-auto text-pink-300 mb-3 animate-spin" size={35} />
            <h2 className="font-semibold text-lg">Maintenance</h2>
            <p className="text-gray-400 mt-2">Server Optimization</p>
          </div>

        </div>

        {/* Loading Animation */}
        <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-[loading_3s_ease-in-out_infinite]"></div>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-400">
          © 2026 Kpt Admissions
        </p>

      </div>

      {/* Tailwind Custom Animation */}
      <style>{`
        @keyframes loading {
          0% {
            width: 0%;
          }
          50% {
            width: 70%;
          }
          100% {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}