"use client";

import { motion, AnimatePresence } from "framer-motion";

export function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[#0f172a]/50 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 8 }}
            className="relative z-10 w-full max-w-[440px] rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-lg"
          >
            <h3 className="text-xl font-semibold text-[#0f172a]">Request full demo</h3>
            <p className="mt-2 text-sm text-[#475569]">
              Tell us how we can reach you — we&apos;ll get back within one business day.
            </p>
            <form
              className="mt-6 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <div>
                <label htmlFor="c-name" className="mb-1.5 block text-xs font-medium text-[#475569]">
                  Name
                </label>
                <input
                  id="c-name"
                  name="name"
                  required
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <label htmlFor="c-email" className="mb-1.5 block text-xs font-medium text-[#475569]">
                  Work email
                </label>
                <input
                  id="c-email"
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  placeholder="you@forwarder.com"
                />
              </div>
              <div>
                <label htmlFor="c-co" className="mb-1.5 block text-xs font-medium text-[#475569]">
                  Company
                </label>
                <input
                  id="c-co"
                  name="company"
                  className="w-full rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  placeholder="Your freight company"
                />
              </div>
              <div>
                <label htmlFor="c-msg" className="mb-1.5 block text-xs font-medium text-[#475569]">
                  Notes
                </label>
                <textarea
                  id="c-msg"
                  name="message"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                  placeholder="What would you like to see?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-[#e2e8f0] py-3 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#2563eb] py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]"
                >
                  Submit
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
