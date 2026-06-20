import {
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  PencilSquareIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { motion, useReducedMotion } from "motion/react";

const steps = [
  {
    label: "Cadrage",
    Icon: ChatBubbleBottomCenterTextIcon,
    className: "left-[6%] top-10 rotate-[-5deg] bg-[#ffd9e4]",
  },
  {
    label: "Offres",
    Icon: PencilSquareIcon,
    className: "left-1/2 top-24 -translate-x-1/2 rotate-[4deg] bg-[#ffdcbd]",
  },
  {
    label: "Clarté",
    Icon: SparklesIcon,
    className: "right-[6%] top-10 rotate-[-2deg] bg-[#f6f3f2]",
  },
];

export function ServiceWorkbench({ className = "" }: { className?: string }) {
  const reducedMotion = useReducedMotion();

  return (
    <div
      className={`relative h-[230px] w-full max-w-[560px] overflow-hidden rounded-[32px] border border-border-accent bg-white/70 shadow-[0_24px_70px_rgba(91,65,55,0.08)] dark:border-white/10 dark:bg-white/5 sm:h-[260px] ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="absolute inset-x-8 bottom-10 h-2 rounded-full bg-[#eee9e8] dark:bg-white/10 sm:inset-x-12" />

      {steps.map(({ label, Icon, className: tileClassName }, index) => (
        <motion.div
          key={label}
          className={`absolute flex h-[92px] w-[116px] flex-col justify-between rounded-2xl border border-white/70 p-4 text-left text-[#1c1b1b] shadow-[0_18px_35px_rgba(91,65,55,0.12)] sm:h-[118px] sm:w-[158px] sm:p-5 ${tileClassName}`}
          initial={reducedMotion ? false : { opacity: 0, y: 28, rotate: 0 }}
          animate={
            reducedMotion
              ? undefined
              : {
                  opacity: 1,
                  y: [0, -6, 0],
                }
          }
          transition={{
            opacity: { delay: index * 0.12, duration: 0.35 },
            y: {
              delay: index * 0.16,
              duration: 3.4,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        >
          <Icon className="size-5 text-[#854d63]" />
          <span className="text-[12px] font-semibold uppercase tracking-[1.4px]">{label}</span>
        </motion.div>
      ))}

      <motion.div
        className="absolute bottom-8 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-[#854d63] text-white shadow-[0_16px_36px_rgba(133,77,99,0.24)]"
        animate={reducedMotion ? undefined : { rotate: 360 }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      >
        <ArrowPathIcon className="size-5" />
      </motion.div>
    </div>
  );
}
