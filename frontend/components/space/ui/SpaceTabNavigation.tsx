"use client";

import { RetroButton } from "@/components/common/RetroButton";

interface Tab {
  id: string;
  label: string;
  icon: string;
}

interface SpaceTabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function SpaceTabNavigation({ tabs, activeTab, onTabChange }: SpaceTabNavigationProps) {
  return (
    <div className="flex gap-1">
      {tabs.map((tab) => (
        <RetroButton
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          variant={activeTab === tab.id ? "primary" : "secondary"}
          size="sm"
          className="flex-1 flex items-center justify-center gap-1"
        >
          <span className="text-sm">{tab.icon}</span>
          <span className="hidden sm:inline">{tab.label}</span>
        </RetroButton>
      ))}
    </div>
  );
}
