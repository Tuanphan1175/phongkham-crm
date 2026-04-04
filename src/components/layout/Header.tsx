"use client";

import { signOut } from "next-auth/react";
import { ROLE_LABELS } from "@/lib/utils";
import type { Role } from "@prisma/client";

interface HeaderProps {
  userName: string;
  userRole: Role;
}

export default function Header({ userName, userRole }: HeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 shrink-0 shadow-sm relative z-30">
      <div className="flex items-center gap-3">
        <label 
          htmlFor="mobile-menu" 
          className="p-1.5 -ml-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden cursor-pointer transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </label>
        <div className="font-semibold text-slate-800 lg:hidden text-sm sm:text-base truncate">
          Menu
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* User info */}
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-800">{userName}</p>
          <p className="text-xs text-slate-500">{ROLE_LABELS[userRole]}</p>
        </div>

        {/* Avatar */}
        <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
          {userName.charAt(0).toUpperCase()}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200" />

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50"
          title="Đăng xuất"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  );
}
