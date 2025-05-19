"use client";
import React, { useState, useEffect, useRef } from "react";

const useCases = [
  {
    title: "Create Shareable Links Instantly",
    description: "Generate a link for any file or note—right from ChatGPT, Claude, or your favorite AI tool.",
    image: "/icon.png",
  },
  {
    title: "Reuse Notes Across Chats",
    description: "Save important info and pull it up in any conversation, any time.",
    image: "/icon.png",
  },
  {
    title: "Share Images, Diagrams, or CSVs",
    description: "Send visuals and data to anyone with a single click—no email or signup needed.",
    image: "/icon.png",
  },
  {
    title: "Use One File in Any AI System",
    description: "Upload once, access from any AI assistant—no more re-uploading.",
    image: "/icon.png",
  },
  {
    title: "Store Metrics for Experiments",
    description: "Keep track of results, logs, or metrics for your AI projects and experiments.",
    image: "/icon.png",
  },
  {
    title: "Long-Term AI Memory",
    description: "Build a persistent memory for your AI—store facts, context, or reminders for future use.",
    image: "/icon.png",
  },
];

export default function Carousel() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Autoplay: advance every 4 seconds
  useEffect(() => {
    timeoutRef.current && clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIndex((i) => (i === useCases.length - 1 ? 0 : i + 1));
    }, 4000);
    return () => timeoutRef.current && clearTimeout(timeoutRef.current);
  }, [index]);

  const prev = () => setIndex((i) => (i === 0 ? useCases.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === useCases.length - 1 ? 0 : i + 1));

  return (
    <div className="my-12 flex flex-col items-center">
      <div className="relative w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center border border-gray-200 min-h-[340px] transition-all duration-500">
          <img
            src={useCases[index].image}
            alt={useCases[index].title}
            className="w-32 h-32 object-contain rounded-xl mb-6 shadow-md bg-gray-50"
            style={{ background: "#f9fafb" }}
          />
          <h3 className="text-2xl font-bold text-gray-800 mb-3 text-center">
            {useCases[index].title}
          </h3>
          <p className="text-gray-600 text-lg text-center max-w-xl">
            {useCases[index].description}
          </p>
        </div>
        {/* Navigation Buttons */}
        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-blue-100 text-blue-600 rounded-full shadow p-3 text-2xl transition-all"
          aria-label="Previous use case"
          style={{ zIndex: 2 }}
        >
          ◀
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 hover:bg-blue-100 text-blue-600 rounded-full shadow p-3 text-2xl transition-all"
          aria-label="Next use case"
          style={{ zIndex: 2 }}
        >
          ▶
        </button>
      </div>
      {/* Dots */}
      <div className="flex gap-2 mt-4">
        {useCases.map((_, i) => (
          <span
            key={i}
            className={`inline-block w-3 h-3 rounded-full transition-all duration-300 ${i === index ? "bg-blue-500 scale-125" : "bg-gray-300"}`}
          />
        ))}
      </div>
    </div>
  );
}
