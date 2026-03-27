import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { HiInformationCircle, HiX } from 'react-icons/hi';

export default function InfoPopup({ children, dark = true }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs cursor-pointer transition-colors ${
          dark
            ? 'text-gold hover:text-gold-light'
            : 'text-gold-dark hover:text-gold'
        }`}
        aria-label="More information"
      >
        <HiInformationCircle className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <Motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -5, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`absolute z-50 left-1/2 -translate-x-1/2 mt-2 w-72 sm:w-80 p-4 rounded-lg shadow-xl text-sm leading-relaxed ${
                dark
                  ? 'bg-dark-card border border-dark-border text-gray-300'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              <button
                onClick={() => setOpen(false)}
                className={`absolute top-2 right-2 cursor-pointer ${dark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <HiX className="w-4 h-4" />
              </button>
              {children}
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </span>
  );
}
