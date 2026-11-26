'use client';

import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from 'react';
import {
  Loader2,
  ChevronDown,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
} from 'lucide-react';

/* ============================================================================
 * 1. BUTTON & ICON BUTTON
 * ========================================================================== */

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isSelected?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isSelected = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-[6px]',
    md: 'px-4 py-2 text-xs gap-2 rounded-[8px]',
    lg: 'px-5 py-2.5 text-sm gap-2 rounded-[8px]',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] hover:bg-[var(--ds-primary-hover)] active:translate-y-[0.5px] border border-transparent',
    secondary:
      'bg-[var(--ds-secondary)] text-[var(--ds-secondary-foreground)] hover:bg-[var(--ds-secondary-hover)] border border-indigo-200/60 dark:border-indigo-800/60',
    outline:
      'bg-[var(--ds-surface)] text-[var(--ds-foreground)] border border-[var(--ds-border-strong)] hover:bg-[var(--ds-muted)]',
    ghost:
      'bg-transparent text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)] border border-transparent',
    danger:
      'bg-[var(--ds-error)] text-white hover:opacity-95 border border-transparent',
  };

  const selectedRing = isSelected
    ? 'ring-2 ring-[var(--ds-accent)] ring-offset-1 ring-offset-[var(--ds-background)]'
    : '';

  return (
    <button
      type="button"
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-pressed={isSelected || undefined}
      className={`inline-flex items-center justify-center font-semibold whitespace-nowrap shrink-0 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)] disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${selectedRing} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  isSelected?: boolean;
  icon: React.ReactNode;
}

export function IconButton({
  label,
  variant = 'outline',
  size = 'md',
  isLoading = false,
  isSelected = false,
  icon,
  disabled,
  className = '',
  ...props
}: IconButtonProps) {
  const isDisabled = disabled || isLoading;

  const sizeClasses: Record<ButtonSize, string> = {
    sm: 'w-8 h-8 rounded-[6px]',
    md: 'w-9 h-9 rounded-[8px]',
    lg: 'w-10 h-10 rounded-[8px]',
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--ds-primary)] text-[var(--ds-primary-foreground)] hover:bg-[var(--ds-primary-hover)]',
    secondary:
      'bg-[var(--ds-secondary)] text-[var(--ds-secondary-foreground)] hover:bg-[var(--ds-secondary-hover)]',
    outline:
      'bg-[var(--ds-surface)] text-[var(--ds-foreground)] border border-[var(--ds-border-strong)] hover:bg-[var(--ds-muted)]',
    ghost:
      'bg-transparent text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]',
    danger: 'bg-[var(--ds-error)] text-white hover:opacity-90',
  };

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={isDisabled}
      aria-pressed={isSelected || undefined}
      className={`inline-flex items-center justify-center shrink-0 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)] disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${
        isSelected ? 'ring-2 ring-[var(--ds-accent)]' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
    </button>
  );
}

/* ============================================================================
 * 2. ACCESSIBLE TABS
 * ========================================================================== */

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  ariaLabel: string;
  variant?: 'segmented' | 'underline';
}

export function Tabs({
  items,
  activeId,
  onChange,
  ariaLabel,
  variant = 'segmented',
}: TabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const enabledItems = items.filter((item) => !item.disabled);
    const currentEnabledIdx = enabledItems.findIndex(
      (item) => item.id === items[index].id
    );
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = enabledItems[(currentEnabledIdx + 1) % enabledItems.length];
      if (next) onChange(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev =
        enabledItems[
          (currentEnabledIdx - 1 + enabledItems.length) % enabledItems.length
        ];
      if (prev) onChange(prev.id);
    }
  };

  if (variant === 'underline') {
    return (
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="flex items-center gap-6 border-b border-[var(--ds-border)] overflow-x-auto"
      >
        {items.map((item, idx) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={item.disabled}
              onClick={() => !item.disabled && onChange(item.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`inline-flex items-center gap-2 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ds-focus)] disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? 'border-[var(--ds-accent)] text-[var(--ds-foreground)]'
                  : 'border-transparent text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="inline-flex flex-wrap items-center gap-1 p-1 bg-[var(--ds-muted)] border border-[var(--ds-border)] rounded-[8px]"
    >
      {items.map((item, idx) => {
        const isActive = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={item.disabled}
            onClick={() => !item.disabled && onChange(item.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--ds-focus)] disabled:opacity-40 disabled:cursor-not-allowed ${
              isActive
                ? 'bg-[var(--ds-surface)] text-[var(--ds-foreground)] font-semibold shadow-2xs'
                : 'text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)]'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 3. ACCESSIBLE DROPDOWN MENU
 * ========================================================================== */

export interface DropdownOption {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownMenuProps {
  triggerLabel: string;
  options: DropdownOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
}

export function DropdownMenu({
  triggerLabel,
  options,
  selectedId,
  onSelect,
  align = 'left',
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <Button
        variant="outline"
        size="md"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setIsOpen(false);
          if (e.key === 'ArrowDown' && !isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        rightIcon={
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        }
      >
        {triggerLabel}
      </Button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={triggerLabel}
          className={`absolute z-50 mt-1.5 w-64 bg-[var(--ds-surface-elevated)] border border-[var(--ds-border-strong)] rounded-[8px] shadow-lg py-1 divide-y divide-[var(--ds-border)] ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {options.map((opt) => {
            const isSelected = opt.id === selectedId;
            return (
              <li key={opt.id} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onSelect(opt.id);
                      setIsOpen(false);
                    }
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs flex items-start gap-2.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    isSelected
                      ? 'bg-[var(--ds-secondary)] text-[var(--ds-secondary-foreground)] font-semibold'
                      : 'text-[var(--ds-foreground)] hover:bg-[var(--ds-muted)]'
                  }`}
                >
                  {opt.icon && <span className="mt-0.5 shrink-0">{opt.icon}</span>}
                  <div className="min-w-0 flex-1">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-[11px] text-[var(--ds-muted-foreground)] font-normal mt-0.5">
                        {opt.description}
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ============================================================================
 * 4. ACCESSIBLE TOOLTIP
 * ========================================================================== */

export interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className=" absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 px-2.5 py-1.5 text-[11px] font-medium text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-950 rounded-[6px] shadow-md whitespace-nowrap pointer-events-none"
        >
          {content}
        </span>
      )}
    </span>
  );
}

/* ============================================================================
 * 5. ACCESSIBLE MODAL DIALOG
 * ========================================================================== */

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
}: DialogProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ds-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[var(--ds-surface-elevated)] border border-[var(--ds-border-strong)] rounded-[12px] shadow-xl overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--ds-border)]">
          <div>
            <h3
              id="ds-dialog-title"
              className="font-display text-base font-bold text-[var(--ds-foreground)]"
            >
              {title}
            </h3>
            {description && (
              <p className="text-xs text-[var(--ds-muted-foreground)] mt-1">
                {description}
              </p>
            )}
          </div>
          <IconButton
            label="Close dialog"
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
          />
        </div>

        <div className="p-5 text-sm text-[var(--ds-foreground)]">{children}</div>

        {footer && (
          <div className="px-5 py-3.5 bg-[var(--ds-muted)] border-t border-[var(--ds-border)] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
 * 6. ACCESSIBLE SLIDE-OVER DRAWER
 * ========================================================================== */

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  side?: 'left' | 'right';
  children: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  side = 'right',
  children,
}: DrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md bg-[var(--ds-surface-elevated)] border-[var(--ds-border-strong)] h-full flex flex-col justify-between shadow-2xl ${
          side === 'right' ? 'ml-auto border-l' : 'mr-auto border-r'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--ds-border)]">
          <div>
            <h3 className="font-display text-base font-bold text-[var(--ds-foreground)]">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[var(--ds-muted-foreground)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <IconButton
            label="Close drawer"
            variant="ghost"
            size="sm"
            icon={<X className="w-4 h-4" />}
            onClick={onClose}
          />
        </div>

        <div className="p-5 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================================
 * 7. ACCESSIBLE ACCORDION
 * ========================================================================== */

export interface AccordionItemSpec {
  id: string;
  title: string;
  metadata?: string;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemSpec[];
  defaultOpenIds?: string[];
}

export function Accordion({ items, defaultOpenIds = [] }: AccordionProps) {
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds);

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="divide-y divide-[var(--ds-border)] border border-[var(--ds-border)] rounded-[10px] bg-[var(--ds-surface)] overflow-hidden">
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => toggleItem(item.id)}
              className="w-full px-5 py-3.5 text-left flex items-center justify-between gap-4 hover:bg-[var(--ds-muted)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--ds-focus)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display text-sm font-bold text-[var(--ds-foreground)]">
                  {item.title}
                </span>
                {item.metadata && (
                  <span className="text-xs font-mono text-[var(--ds-muted-foreground)]">
                    · {item.metadata}
                  </span>
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--ds-muted-foreground)] transition-transform duration-150 shrink-0 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {isOpen && (
              <div
                id={`accordion-panel-${item.id}`}
                role="region"
                className="px-5 py-4 text-xs text-[var(--ds-muted-foreground)] bg-[var(--ds-background)]/50 border-t border-[var(--ds-border)] leading-relaxed"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================================
 * 8. TOAST NOTIFICATION SYSTEM
 * ========================================================================== */

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  pushToast: (msg: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (msg: Omit<ToastMessage, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { ...msg, id }].slice(-4));
      setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, pushToast, dismissToast }}>
      {children}
      {/* Accessible Live Region Toast Viewport */}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none"
      >
        {toasts.map((t) => {
          const toneConfig: Record<
            ToastTone,
            { icon: React.ReactNode; label: string; borderClass: string }
          > = {
            info: {
              icon: <Info className="w-4 h-4 text-[var(--ds-accent)] shrink-0" />,
              label: 'INFO',
              borderClass: 'border-[var(--ds-border-strong)]',
            },
            success: {
              icon: <CheckCircle2 className="w-4 h-4 text-[var(--ds-success)] shrink-0" />,
              label: 'VERIFIED',
              borderClass: 'border-[var(--ds-success-border)]',
            },
            warning: {
              icon: <AlertTriangle className="w-4 h-4 text-[var(--ds-warning)] shrink-0" />,
              label: 'CAUTION',
              borderClass: 'border-[var(--ds-warning-border)]',
            },
            error: {
              icon: <AlertOctagon className="w-4 h-4 text-[var(--ds-error)] shrink-0" />,
              label: 'ERROR',
              borderClass: 'border-[var(--ds-error-border)]',
            },
          };

          const cfg = toneConfig[t.tone];

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 bg-[var(--ds-surface-elevated)] border ${cfg.borderClass} rounded-[10px] shadow-lg`}
            >
              <div className="flex items-start gap-2.5">
                {cfg.icon}
                <div className="text-xs">
                  <div className="font-mono text-[10px] font-bold text-[var(--ds-muted-foreground)]">
                    {cfg.label}
                  </div>
                  <div className="font-semibold text-[var(--ds-foreground)] mt-0.5">
                    {t.title}
                  </div>
                  {t.description && (
                    <div className="text-[var(--ds-muted-foreground)] mt-0.5">
                      {t.description}
                    </div>
                  )}
                </div>
              </div>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismissToast(t.id)}
                className="text-[var(--ds-muted-foreground)] hover:text-[var(--ds-foreground)] p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
