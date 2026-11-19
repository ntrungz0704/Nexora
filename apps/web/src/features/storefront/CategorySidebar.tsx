import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CategoryDto } from '@nexora/shared';

interface CategorySidebarProps {
  categories: CategoryDto[];
}

export const CategorySidebar: React.FC<CategorySidebarProps> = ({ categories }) => {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <div className="relative bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl overflow-visible">
      {/* Category List */}
      <ul className="py-2 divide-y divide-slate-800/40 text-xs">
        {categories.map((cat) => {
          const isHovered = hoveredSlug === cat.slug;
          return (
            <li
              key={cat.id}
              onMouseEnter={() => setHoveredSlug(cat.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              className="relative group"
            >
              <Link
                to={`/category/${cat.slug}`}
                className={`flex items-center justify-between px-3.5 py-2.5 transition-colors ${
                  isHovered
                    ? 'bg-blue-600/15 text-blue-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <i
                    className={`${cat.icon || 'fa-solid fa-microchip'} w-4 text-center text-slate-400 group-hover:text-blue-400 transition-colors`}
                  ></i>
                  <span className="truncate">{cat.name}</span>
                </div>
                <i className="fa-solid fa-chevron-right text-[10px] text-slate-500 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5"></i>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
