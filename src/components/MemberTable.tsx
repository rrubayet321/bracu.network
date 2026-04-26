'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import SocialIcons from './SocialIcons';
import FilterDropdown from './FilterDropdown';
import type { Member } from '@/types/member';
import { Search } from 'lucide-react';

interface FilterState {
  departments: string[];
  roles: string[];
}

type MemberTypeFilter = 'all' | 'student' | 'alumni';

interface MemberTableProps {
  members: Member[];
  onHover?: (slug: string | null) => void;
  highlightSlug?: string | null;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}

export default function MemberTable({ members, onHover, highlightSlug }: MemberTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({ departments: [], roles: [] });
  const [memberTypeFilter, setMemberTypeFilter] = useState<MemberTypeFilter>('all');

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return members.filter((m) => {
      // Text search
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.department?.toLowerCase().includes(q) ||
        (m.website?.toLowerCase().includes(q) ?? false);

      // Department filter
      const matchesDept =
        filters.departments.length === 0 ||
        (m.department && filters.departments.includes(m.department));

      // Role filter
      const matchesRole =
        filters.roles.length === 0 ||
        m.roles.some((r) => filters.roles.includes(r));

      const matchesMemberType =
        memberTypeFilter === 'all' || m.member_type === memberTypeFilter;

      return matchesQuery && matchesDept && matchesRole && matchesMemberType;
    });
  }, [members, searchQuery, filters, memberTypeFilter]);

  return (
    <div>
      {/* Search + Filter bar */}
      <div className="search-bar-wrapper">
        <div className="search-input-container">
          <Search size={14} className="search-icon" />
          <input
            id="member-search"
            className="search-input"
            type="text"
            placeholder="search by name, department, or site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
        <FilterDropdown filters={filters} onChange={setFilters} />
        <select
          className="filter-member-type-select"
          value={memberTypeFilter}
          onChange={(e) => setMemberTypeFilter(e.target.value as MemberTypeFilter)}
          aria-label="Filter by member type"
        >
          <option value="all">all members</option>
          <option value="student">students</option>
          <option value="alumni">alumni</option>
        </select>
      </div>

      {/* Table */}
      <div className="member-table-container">
        {filtered.length === 0 ? (
          <div className="empty-state">
            {searchQuery || filters.departments.length || filters.roles.length
              || memberTypeFilter !== 'all'
              ? 'No members match your search.'
              : 'No members yet. Be the first to join!'}
          </div>
        ) : (
          <table className="member-table" id="member-directory-table">
            <thead>
              <tr>
                <th>name</th>
                <th>department</th>
                <th>site</th>
                <th>links</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr
                  key={member.id}
                  id={`member-row-${member.slug}`}
                  className={highlightSlug === member.slug ? 'is-highlighted' : undefined}
                  onMouseEnter={() => onHover?.(member.slug)}
                  onMouseLeave={() => onHover?.(null)}
                  onClick={() => member.website && window.open(member.website, '_blank', 'noopener')}
                  style={{ cursor: member.website ? 'pointer' : 'default' }}
                >
                  {/* Name + Avatar */}
                  <td>
                    <div className="member-name-cell">
                      {member.profile_pic ? (
                        <Image
                          src={member.profile_pic}
                          alt={member.name}
                          width={36}
                          height={36}
                          className="member-avatar"
                        />
                      ) : (
                        <div className="member-avatar-fallback">
                          {getInitials(member.name)}
                        </div>
                      )}
                      <span className="member-name">{member.name}</span>
                      {member.member_type === 'alumni' && (
                        <span className="member-type-badge alumni">alumni</span>
                      )}
                      {member.member_type === 'student' && (
                        <span className="member-type-badge">current</span>
                      )}
                    </div>
                  </td>

                  {/* Department */}
                  <td>
                    <span className="member-dept" title={member.department}>
                      {member.department ?? '—'}
                    </span>
                  </td>

                  {/* Website */}
                  <td>
                    {member.website ? (
                      <a
                        href={member.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="member-site-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {stripProtocol(member.website)}
                      </a>
                    ) : (
                      <span className="member-site-link" style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>

                  {/* Social Icons */}
                  <td>
                    <SocialIcons member={member} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Member count */}
        {filtered.length > 0 && (
          <p className="text-muted" style={{ fontSize: 12, marginTop: 16 }}>
            {filtered.length} of {members.length} member{members.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </div>
  );
}
