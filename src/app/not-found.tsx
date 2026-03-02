// File: app/admin/not-found.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";

export default function AdminNotFound() {
  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full p-6 bg-white text-center min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Animated Icon */}
      <motion.div
        className="text-red-500 mb-6"
        animate={{ y: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <AlertCircle size={80} />
      </motion.div>

      {/* Bouncing “404” */}
      <motion.h1
        className="text-7xl font-extrabold text-gray-800 mb-4"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        404
      </motion.h1>

      {/* Fade-in message */}
      <motion.p
        className="text-xl text-gray-600 mb-8 text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        Sorry, the page you’re looking for doesn’t exist or has been moved.
      </motion.p>

      {/* Pulse “Back to Dashboard” button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      >
        <Link
          href="/admin"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition"
        >
          Back to Dashboard
        </Link>
      </motion.div>
    </motion.div>
  );
}
