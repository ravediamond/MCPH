import React, { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Feedback from "../ui/Feedback";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-grow px-4 py-6 md:py-8 md:px-6 lg:px-8">
        {children}
      </main>
      <Footer />
      <Feedback />
    </div>
  );
}
