(function() {
  const scripts = document.getElementsByTagName('script');
  const currentScript = scripts[scripts.length - 1];
  
  if (!currentScript.hasAttribute('data-webring')) return;
  
  const user = currentScript.getAttribute('data-user');
  if (!user) {
    console.error('bracu.network webring: Missing data-user attribute');
    return;
  }

  const API_URL = 'https://bracu.network/api/members';
  const SITE_URL = 'https://bracu.network';

  /** Escape HTML special chars to prevent XSS when injecting into attributes or text. */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /** Only allow http/https URLs to prevent javascript: injection. */
  function safeUrl(url) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
      return parsed.href;
    } catch {
      return null;
    }
  }

  const container = document.createElement('div');
  container.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 16px;
    padding: 8px 16px;
    border: 1px solid #2A2A2A;
    border-radius: 8px;
    background: #0A0A0A;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    color: #A0A0A0;
  `;

  container.innerHTML = '<span style="color: #555;">Loading webring...</span>';
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  fetch(API_URL)
    .then(function(res) { return res.json(); })
    .then(function(members) {
      if (!Array.isArray(members) || members.length === 0) throw new Error('No members found');
      
      const idx = members.findIndex(function(m) { return m.slug === user; });
      if (idx === -1) {
        container.textContent = 'User not found in webring';
        return;
      }

      const prevIdx = (idx - 1 + members.length) % members.length;
      const nextIdx = (idx + 1) % members.length;
      
      const prev = members[prevIdx];
      const next = members[nextIdx];

      const prevUrl = safeUrl(prev.website);
      const nextUrl = safeUrl(next.website);

      if (!prevUrl || !nextUrl) {
        console.error('bracu.network webring: Invalid member URL');
        container.style.display = 'none';
        return;
      }

      // Build DOM nodes instead of innerHTML to avoid XSS
      const linkStyle = 'color: #A0A0A0; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;';

      const prevLink = document.createElement('a');
      prevLink.href = prevUrl;
      prevLink.title = escapeHtml(prev.name);
      prevLink.setAttribute('style', linkStyle);
      prevLink.textContent = '\u25C4 prev';
      prevLink.addEventListener('mouseover', function() { this.style.color = '#f5f5f5'; });
      prevLink.addEventListener('mouseout', function() { this.style.color = '#A0A0A0'; });

      const hubLink = document.createElement('a');
      hubLink.href = SITE_URL;
      hubLink.title = 'bracu.network';
      hubLink.setAttribute('style', 'color: #5e6ad2; text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 6px;');
      hubLink.textContent = '[B] bracu.network';

      const nextLink = document.createElement('a');
      nextLink.href = nextUrl;
      nextLink.title = escapeHtml(next.name);
      nextLink.setAttribute('style', linkStyle);
      nextLink.textContent = 'next \u25BA';
      nextLink.addEventListener('mouseover', function() { this.style.color = '#f5f5f5'; });
      nextLink.addEventListener('mouseout', function() { this.style.color = '#A0A0A0'; });

      container.innerHTML = '';
      container.appendChild(prevLink);
      container.appendChild(hubLink);
      container.appendChild(nextLink);
    })
    .catch(function(err) {
      console.error('bracu.network webring error:', err);
      container.style.display = 'none';
    });
})();
