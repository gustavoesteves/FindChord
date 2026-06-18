import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface TabConfig<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

interface StandardLayoutProps<T extends string> {
  tabs?: TabConfig<T>[];
  activeTab?: T;
  onTabChange?: (id: T) => void;
  children: ReactNode;
  headerContent?: ReactNode; // Optional top bar content
}

export function StandardLayout<T extends string>({
  tabs = [],
  activeTab,
  onTabChange,
  children,
  headerContent
}: StandardLayoutProps<T>) {
  return (
    <div className="w-full flex flex-col gap-6 text-zinc-100">
      {headerContent && (
        <div className="w-full">
          {headerContent}
        </div>
      )}

      {tabs.length > 0 && activeTab && onTabChange && (
        <div className="flex border-b border-zinc-800 pb-0.5 overflow-x-auto gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                id={`standard-tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-0.5 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isActive
                    ? "border-purple-500 text-purple-400 font-extrabold"
                    : "border-transparent text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {tab.label}
                {tab.badge !== undefined && (
                  <span className="ml-1 bg-purple-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-6 animate-scale-up">
        {children}
      </div>
    </div>
  );
}
