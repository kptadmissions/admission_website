// src/App.jsx

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-black text-white px-6">
      
      <div className="text-center max-w-2xl">
        
        {/* Logo/Icon */}
        <div className="text-6xl mb-6">🚧</div>

        {/* Title */}
        <h1 className="text-5xl font-extrabold mb-4 tracking-wide">
          KPT Admissions
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl md:text-3xl font-semibold text-blue-300 mb-6">
          Website Under Maintenance
        </h2>

        {/* Message */}
        <p className="text-slate-300 text-lg leading-relaxed">
          We are currently upgrading the admission portal to improve
          performance, security, and user experience.
          <br />
          Please check back again later.
        </p>

        {/* Status Box */}
        <div className="mt-10 inline-block px-6 py-3 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
          <p className="text-green-400 font-semibold animate-pulse">
            Maintenance in Progress...
          </p>
        </div>

        {/* Footer */}
        <p className="mt-12 text-slate-500 text-sm">
          © 2026 Karnataka Polytechnic Mangalore
        </p>
      </div>
    </div>
  );
}