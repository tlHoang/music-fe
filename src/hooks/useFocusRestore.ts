import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage focus restoration and modal cleanup
 * Fixes the issue where pages become unresponsive after closing modals/dropdowns
 */
export const useFocusRestore = (modalStates: boolean[]) => {
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Store focused element before opening any modal
  const storeFocusedElement = () => {
    lastFocusedElement.current = document.activeElement as HTMLElement;
  };

  // Comprehensive cleanup function
  const restoreFocus = () => {
    setTimeout(() => {
      // Remove all focus guards and portal containers
      document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal]').forEach(el => {
        el.remove();
      });
      
      // Reset body styles that might be set by the dialog
      document.body.style.pointerEvents = '';
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      
      // Clear any inert attributes
      document.querySelectorAll('[inert]').forEach(el => {
        el.removeAttribute('inert');
      });
      
      // Force focus back to the previously focused element or page
      if (lastFocusedElement.current && document.contains(lastFocusedElement.current)) {
        lastFocusedElement.current.focus();
      } else if (pageRef.current) {
        pageRef.current.focus();
      } else {
        document.body.focus();
      }
      
      // Ensure the page is interactive
      if (pageRef.current) {
        pageRef.current.style.pointerEvents = 'auto';
      }
    }, 50);
  };

  // Enhanced close handler that includes cleanup
  const createCloseHandler = (closeFunction: () => void) => {
    return () => {
      closeFunction();
      restoreFocus();
    };
  };

  // Monitor modal states for cleanup
  useEffect(() => {
    const anyModalOpen = modalStates.some(state => state);
    
    if (!anyModalOpen) {
      const timer = setTimeout(() => {
        document.querySelectorAll('[data-radix-focus-guard]').forEach(trap => trap.remove());
        if (document.activeElement !== document.body) {
          document.body.focus();
          document.body.blur();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, modalStates);

  // Emergency click handler to restore interactivity
  useEffect(() => {
    const handleGlobalClick = () => {
      const anyModalOpen = modalStates.some(state => state);
      
      if (!anyModalOpen) {
        document.querySelectorAll('[data-radix-focus-guard], [data-radix-portal]').forEach(el => {
          el.remove();
        });
        document.body.style.pointerEvents = '';
        document.body.style.overflow = '';
        document.querySelectorAll('[inert]').forEach(el => {
          el.removeAttribute('inert');
        });
      }
    };

    document.addEventListener('click', handleGlobalClick, true);
    return () => document.removeEventListener('click', handleGlobalClick, true);
  }, modalStates);

  return {
    pageRef,
    storeFocusedElement,
    restoreFocus,
    createCloseHandler
  };
};
