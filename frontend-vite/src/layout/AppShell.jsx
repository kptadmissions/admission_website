import { motion } from "framer-motion";

export default function AppShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col">

      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-100 via-white to-slate-100 -z-20" />

      {/* Floating Blobs */}
      <motion.div
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="fixed w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-20 top-10 left-10 -z-10"
      />
      <motion.div
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="fixed w-96 h-96 bg-yellow-300 rounded-full blur-3xl opacity-20 bottom-10 right-10 -z-10"
      />

      {/* PAGE CONTENT */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex-grow"
      >
        {children}
      </motion.main>

      {/* 🔥 MATCHED FOOTER (KPT THEME) */}
      <footer className="relative text-slate-300 overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900" />

        {/* Glow Effects */}
        <div className="absolute -top-20 left-1/4 w-72 h-72 bg-yellow-400 opacity-10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-500 opacity-20 blur-3xl rounded-full" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">

          {/* About */}
          <div>
            <h2 className="text-xl font-bold text-white mb-3">
              KPT Admissions
            </h2>
            <p className="text-sm leading-relaxed text-slate-300">
              Karnataka (Govt.) Polytechnic, Mangalore Admissions Portal.
              Designed for efficient and transparent student application management.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-3 border-b border-yellow-400 inline-block pb-1">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-yellow-300 transition cursor-pointer">Dashboard</li>
              <li className="hover:text-yellow-300 transition cursor-pointer">Applications</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3 border-b border-yellow-400 inline-block pb-1">
              Contact
            </h3>
            <p className="text-sm">KPT Mangalore</p>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="relative z-10 border-t border-slate-700 text-center py-4 text-xs text-slate-400">
          © {new Date().getFullYear()} KPT Admissions System • Designed & Developed by Team KPT Admissions
        </div>

      </footer>
    </div>
  );
}