export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} PratibhaScan. All rights reserved.</p>
        <p className="flex items-center gap-4">
          <span className="hover:text-slate-800 cursor-pointer">Privacy Policy</span>
          <span>•</span>
          <span className="hover:text-slate-800 cursor-pointer">Assessment Guidelines</span>
          <span>•</span>
          <span className="hover:text-slate-800 cursor-pointer">Terms of Service</span>
        </p>
      </div>
    </footer>
  );
}
