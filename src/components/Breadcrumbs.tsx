import React from 'react';
import { ChevronRight, Home, Building2, Utensils, ShieldCheck, Printer, ChefHat, BarChart3, QrCode } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-neutral-400 font-medium py-2 px-1 ${className}`}>
      <ol className="flex items-center flex-wrap gap-1 sm:gap-1.5 list-none m-0 p-0">
        <li className="flex items-center gap-1.5">
          <a
            href="/"
            onClick={(e) => {
              if (items[0]?.onClick) {
                e.preventDefault();
                items[0].onClick();
              }
            }}
            className="flex items-center gap-1 text-neutral-400 hover:text-amber-400 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Snack Box</span>
          </a>
        </li>

        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-1 sm:gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              {isLast || !item.onClick ? (
                <span 
                  className={`flex items-center gap-1.5 ${
                    isLast ? 'text-amber-400 font-semibold' : 'text-neutral-300'
                  }`}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="flex items-center gap-1.5 text-neutral-400 hover:text-amber-400 transition-colors cursor-pointer"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
