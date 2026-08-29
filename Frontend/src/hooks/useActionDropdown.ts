import { useEffect, useState, type MouseEvent } from 'react';

type DropdownCoords = { top?: number; bottom?: number; left: number };

export function useActionDropdown(menuHeight = 140) {
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState<DropdownCoords | null>(null);

  useEffect(() => {
    const handleClose = (e: Event) => {
      if (e.type === 'click') {
        const target = e.target as HTMLElement;
        if (target.closest('.ir-action-dropdown-container') || target.closest('.ss-action-dropdown')) {
          return;
        }
      }
      setActiveDropdownId(null);
      setDropdownCoords(null);
    };
    document.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      document.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  const handleActionMenuToggle = (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.stopPropagation();
    if (activeDropdownId === id) {
      setActiveDropdownId(null);
      setDropdownCoords(null);
      return;
    }
    const dropdownWidth = 168;
    const rect = e.currentTarget.getBoundingClientRect();
    let top: number | undefined;
    let bottom: number | undefined;
    const left = Math.max(8, Math.min(window.innerWidth - dropdownWidth - 8, rect.right - dropdownWidth));
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
      bottom = window.innerHeight - rect.top + 4;
    } else {
      top = rect.bottom + 4;
    }
    setDropdownCoords({ top, bottom, left });
    setActiveDropdownId(id);
  };

  const closeActionMenu = () => {
    setActiveDropdownId(null);
    setDropdownCoords(null);
  };

  return { activeDropdownId, dropdownCoords, handleActionMenuToggle, closeActionMenu };
}
