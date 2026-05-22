"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AnimatedCardProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export default function AnimatedCard({ children, className, delay = 0 }: AnimatedCardProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.42, ease: "easeOut", delay }}
      whileHover={{ y: -3 }}
    >
      {children}
    </motion.div>
  );
}

