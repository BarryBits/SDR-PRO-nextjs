"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DashboardContextType {
  period: string;
  setPeriod: (period: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState('30d');

  return (
    <DashboardContext.Provider value={{ period, setPeriod }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

