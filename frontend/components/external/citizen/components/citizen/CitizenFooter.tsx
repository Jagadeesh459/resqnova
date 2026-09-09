import React from 'react';

export const CitizenFooter: React.FC = () => {
  return (
    <footer className="w-full bg-[#040f1c] py-8 border-t border-[#3c494e]/20 shadow-[0_-4px_24px_rgba(0,0,0,0.3)] mb-16 md:mb-0">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
        <div className="flex flex-col gap-1">
          <span className="font-['Plus_Jakarta_Sans'] font-bold text-base text-[#d8e3f7]">
            RESQNOVA Disaster Response Network
          </span>
          <p className="text-xs text-[#bbc9cf]">
            Integrated Civil Defense, Disaster Relief &amp; Evacuation Management System.
          </p>
        </div>
        <div className="flex items-center gap-6">
          <a
            href="tel:112"
            className="text-xs font-semibold text-[#4ae183] hover:underline"
          >
            24/7 National Emergency: Dial 112
          </a>
          <span className="text-xs text-[#859398]">
            &copy; 2024 NTR District Emergency Cell
          </span>
        </div>
      </div>
    </footer>
  );
};
