'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS } from '@/types/member';

interface FilterState {
  departments: string[];
  roles: string[];
}

interface FilterDropdownProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function FilterDropdown({ filters, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCount = filters.departments.length + filters.roles.length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function toggleDept(dept: string) {
    const next = filters.departments.includes(dept)
      ? filters.departments.filter((d) => d !== dept)
      : [...filters.departments, dept];
    onChange({ ...filters, departments: next });
  }

  function toggleRole(role: string) {
    const next = filters.roles.includes(role)
      ? filters.roles.filter((r) => r !== role)
      : [...filters.roles, role];
    onChange({ ...filters, roles: next });
  }

  function clearAll() {
    onChange({ departments: [], roles: [] });
  }

  return (
    <div className="filter-dropdown-wrapper" ref={ref}>
      <button className="filter-btn" onClick={() => setOpen((o) => !o)} id="filter-toggle-btn">
        <SlidersHorizontal size={14} />
        filters
        {activeCount > 0 && <span className="filter-badge">{activeCount}</span>}
      </button>

      {open && (
        <div className="filter-dropdown-panel" id="filter-dropdown-panel">
          <div className="flex-between" style={{ gridColumn: '1 / -1' }}>
            <span className="filter-group-title" style={{ margin: 0 }}>
              Filter members
            </span>
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <X size={12} /> clear all
              </button>
            )}
          </div>

          {/* Departments */}
          <div className="filter-section">
            <div className="filter-section-title">Department</div>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <label key={dept} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.departments.includes(dept)}
                  onChange={() => toggleDept(dept)}
                />
                {dept}
              </label>
            ))}
          </div>

          {/* Roles */}
          <div className="filter-section">
            <div className="filter-section-title">Role</div>
            {ROLE_OPTIONS.map((role) => (
              <label key={role} className="filter-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.roles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
