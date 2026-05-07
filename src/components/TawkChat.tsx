import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function TawkChat() {
  const [tawkId, setTawkId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        setTawkId(docSnap.data().tawkId || import.meta.env.VITE_TAWK_ID || '69efd3426757b41c3bd093e6');
      } else {
        setTawkId(import.meta.env.VITE_TAWK_ID || '69efd3426757b41c3bd093e6');
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!tawkId) return;

    const PROPERTY_ID = tawkId;
    const WIDGET_ID = 'default';

    const tawkScript = document.createElement("script");
    tawkScript.async = true;
    tawkScript.src = `https://embed.tawk.to/${PROPERTY_ID}/${WIDGET_ID}`;
    tawkScript.charset = 'UTF-8';
    tawkScript.setAttribute('crossorigin', '*');

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(tawkScript, firstScript);
    } else {
      document.head.appendChild(tawkScript);
    }

    window.Tawk_API = window.Tawk_API || {};
    
    return () => {
      // Removing scripts injected by tawk.to on unmount is complex, 
      // but we can at least try to hide the widget if needed.
    };
  }, [tawkId]);

  return null;
}

// Add Tawk_API to global window type for TS
declare global {
  interface Window {
    Tawk_API: any;
    Tawk_LoadStart: any;
  }
}
