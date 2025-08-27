'use client';
import { div } from 'framer-motion/client';
import React, { useState, useEffect } from 'react'
import { useCodeEditorState } from '@/store/useCodeEditorState';
import { LANGUAGE_CONFIG } from '../_constants';
import Image from 'next/image';
import { ChevronDownIcon, LockIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

function LanguageSelector({ hasAccess }: { hasAccess: boolean }) {

  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage } = useCodeEditorState();
  const [mounted, setMounted] = useState(false);
  const dropDownRef = React.useRef<HTMLDivElement>(null);
  const currentLangObj = LANGUAGE_CONFIG[language || 'cpp'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropDownRef.current && !dropDownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setMounted(true);
    console.log("Language Config:", currentLangObj);
  }, []);

  const handleLanguageChange = (langID: string) => {
    if(!hasAccess && langID !== 'cpp') return;

    setLanguage(langID);
    setIsOpen(false);
  }

  if (!mounted) return null;

  return (
    <div className='relative' ref={dropDownRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative flex items-center gap-3 px-4 py-2.5 bg-[#1e1e2e]/80 
        rounded-lg transition-all duration-200 border border-gray-800/50 hover:border-gray-700
       ${!hasAccess && language !== "cpp" ? "opacity-50 cursor-not-allowed" : ""}`}
      >

        {/* Decoration */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/5 
        rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />

        <div className="size-6 rounded-md bg-gray-800/50 p-0.5 group-hover:scale-110 transition-transform">
          <Image
          src={currentLangObj.logoPath}
          alt={currentLangObj.label}
          width={24}
          height={24}
          className="w-full h-full object-contain relative z-10"
          />
        </div>

        <span className="text-gray-200 min-w-[80px] text-left group-hover:text-white transition-colors">
          {currentLangObj.label}
        </span>

        <ChevronDownIcon
          className={`size-4 text-gray-400 transition-all duration-300 group-hover:text-gray-300
            ${isOpen ? "rotate-180" : ""}`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full left-0 mt-2 w-full min-w-[240px] bg-[#1e1e2e]/95 backdrop-blur-xl rounded-xl border border-[#313244] shadow-2xl py-2 z-50`}
          >
            <div className='px-2 pb-2 mb-2 border-b border-gray-800/50'>
              <p className='text-xs font-medium text-gray-400 px-2'>Select Language</p>
            </div>

            {Object.entries(LANGUAGE_CONFIG).map(([langID, langObj], index) => (
              <motion.button
                key={langID}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative group w-full flex items-center gap-3 px-5 py-2.5 hover:bg-[#262637] transition-all duration-200
                        ${language === langID ? "bg-blue-500/10 text-blue-400" : "text-gray-300"}
                        ${!hasAccess && langID !== "cpp" ? "opacity-50 text-gray-500 cursor-not-allowed" : ""}`}
                onClick={() => {
                  // if (hasAccess || langID === "cpp") {
                  //   setLanguage(langID);
                  //   setIsOpen(false);
                  // }
                  handleLanguageChange(langID);
                }}
              >

              <div className='min-w-full flex gap-6'>
                <div className="size-6  rounded-md bg-gray-800/50 p-0.5">
                  <Image
                    src={langObj.logoPath}
                    alt={langObj.label}
                    width={30}
                    height={30}
                    className="w-full h-full object-contain"
                  />
                </div>

                <span>{langObj.label}</span>

                {/* Show lock icon if not accessible and not cpp */}
                {!hasAccess && langID !== "cpp" && (
                  <LockIcon 
                  width={16}
                  className='text-gray-500 ml-auto'
                   />
                )}
              </div>
                

              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default LanguageSelector