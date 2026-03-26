export default function Footer() {
  return (
    <footer className="bg-dark border-t border-dark-border py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <span className="bg-gold text-dark text-xs font-bold rounded px-1.5 py-0.5">PC</span>
            <span className="text-white font-semibold text-sm">The Performance Consultant</span>
          </div>
          <p className="text-gray-500 text-xs mt-1">Science-based nutrition & performance coaching</p>
        </div>
        <div className="text-center sm:text-right text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} Dr Will Dyson. All rights reserved.</p>
          <p className="mt-0.5">theperformanceconsultant.net</p>
        </div>
      </div>
    </footer>
  );
}
