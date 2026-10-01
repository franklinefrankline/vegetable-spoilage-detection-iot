import React from 'react';
import { Search, X, ChevronDown, RefreshCw } from 'lucide-react';

/**
 * FilterSelect: Standardized 42px dropdown with category icon and custom SVG chevron.
 */
export function FilterSelect({
  icon,
  value,
  onChange,
  children,
  ariaLabel,
  className = '',
  variant, // 'role', 'status', 'sort', 'device'
  disabled = false,
  title,
  id,
  name,
  style,
  ...rest
}) {
  const variantClass = variant ? `filter-${variant}-select` : '';

  return (
    <div className={`filter-select-wrapper admin-filter-select-wrap ${variantClass} ${className}`.trim()} style={style}>
      {icon && <span className="select-icon" aria-hidden="true">{icon}</span>}
      <select
        id={id}
        name={name}
        className="admin-select-field toolbar-select admin-filter-select"
        value={value}
        onChange={onChange}
        aria-label={ariaLabel}
        disabled={disabled}
        title={title}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown size={14} className="filter-select-chevron" aria-hidden="true" />
    </div>
  );
}

/**
 * FilterIconButton: Standardized 42px x 42px square icon button (e.g. Refresh).
 */
export function FilterIconButton({
  icon,
  onClick,
  disabled = false,
  loading = false,
  title = 'Refresh',
  ariaLabel = 'Refresh',
  className = '',
  type = 'button',
  ...rest
}) {
  return (
    <button
      type={type}
      className={`btn-secondary toolbar-icon-btn admin-filter-refresh-btn ${className}`.trim()}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel}
      {...rest}
    >
      {icon || <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />}
    </button>
  );
}

/**
 * AdminFilterBar: Unified, compact, high-precision toolbar for Admin Search & Filters.
 */
export function AdminFilterBar({
  searchValue,
  onSearchChange,
  onSearchClear,
  searchPlaceholder = 'Search...',
  searchAriaLabel = 'Search',
  searchDisabled = false,
  children,
  className = '',
  style,
  actions,
  ...rest
}) {
  const hasControlledSearch = typeof searchValue !== 'undefined';

  const handleClear = () => {
    if (onSearchClear) {
      onSearchClear();
    } else if (onSearchChange) {
      onSearchChange('');
    }
  };

  return (
    <div
      className={`admin-toolbar-card admin-filter-bar ${className}`.trim()}
      style={style}
      role="search"
      aria-label="Filter and search controls"
      {...rest}
    >
      {hasControlledSearch && (
        <div className="toolbar-search-col admin-filter-search-group">
          <div className="search-input-wrapper admin-filter-search-wrap">
            <Search size={16} className="search-icon filter-search-icon" aria-hidden="true" />
            <input
              type="text"
              className="admin-input-field toolbar-search-input admin-filter-search-input"
              placeholder={searchPlaceholder}
              aria-label={searchAriaLabel}
              value={searchValue}
              disabled={searchDisabled}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
            {searchValue && (
              <button
                type="button"
                className="search-clear-btn filter-search-clear"
                onClick={handleClear}
                title="Clear search"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {(children || actions) && (
        <div className="toolbar-filters-col admin-filter-controls-group">
          {children}
          {actions}
        </div>
      )}
    </div>
  );
}

AdminFilterBar.Select = FilterSelect;
AdminFilterBar.IconButton = FilterIconButton;

export default AdminFilterBar;
