import { useEffect } from 'react';

interface UseSEOProps {
  title: string;
  description?: string;
}

export function useSEO({ title, description }: UseSEOProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} | Sidak BGN` : 'Sidak BGN';

    const metaDescription = document.querySelector('meta[name="description"]');
    let prevDescription = '';
    if (metaDescription) {
      prevDescription = metaDescription.getAttribute('content') || '';
      if (description) {
        metaDescription.setAttribute('content', description);
      }
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) {
      ogDesc.setAttribute('content', description);
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', title);
    }

    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc && description) {
      twitterDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (metaDescription && prevDescription) {
        metaDescription.setAttribute('content', prevDescription);
      }
    };
  }, [title, description]);
}
