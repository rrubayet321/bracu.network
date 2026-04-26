'use client';

import { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { DEPARTMENT_OPTIONS, ROLE_OPTIONS } from '@/types/member';

interface FilterState {
  departments: string[];
  roles: string[];
  openToHire: boolean;
}

interface FilterDropdownProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

export default function FilterDropdown({ filters, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeCount = filters.departments.length + filters.roles.length + (filters.openToHire ? 1 : 0);

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
    onChange({ departments: [], roles: [], openToHire: false });
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

          {/* Header */}
          <div className="filter-panel-header">
            <span className="filter-group-title" style={{ margin: 0 }}>Filters</span>
            {activeCount > 0 && (
              <button className="filter-clear-btn" onClick={clearAll}>
                <X size={11} /> clear all
              </button>
            )}
          </div>

          {/* Availability toggle */}
          <div className="filter-block">
            <div className="filter-block-title">Availability</div>
            <button
              type="button"
              className={`filter-chip${filters.openToHire ? ' active' : ''}`}
              onClick={() => onChange({ ...filters, openToHire: !filters.openToHire })}
            >
              Open to hire
            </button>
          </div>

          {/* Departments */}
          <div className="filter-block">
            <div className="filter-block-title">Department</div>
            <div className="filter-chip-group">
              {DEPARTMENT_OPTIONS.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  className={`filter-chip${filters.departments.includes(dept) ? ' active' : ''}`}
                  onClick={() => toggleDept(dept)}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Roles */}
          <div className="filter-block">
            <div className="filter-block-title">Role</div>
            <div className="filter-chip-group">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role}
                  type="button"
                  className={`filter-chip${filters.roles.includes(role) ? ' active' : ''}`}
                  onClick={() => toggleRole(role)}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
