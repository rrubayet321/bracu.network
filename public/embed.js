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

  // Placeholder while loading
  container.innerHTML = `<span style="color: #555;">Loading webring...</span>`;
  currentScript.parentNode.insertBefore(container, currentScript.nextSibling);

  fetch(API_URL)
    .then(res => res.json())
    .then(members => {
      if (!Array.isArray(members) || members.length === 0) throw new Error('No members found');
      
      const idx = members.findIndex(m => m.slug === user);
      if (idx === -1) {
        container.innerHTML = `<span>User not found in webring</span>`;
        return;
      }

      const prevIdx = (idx - 1 + members.length) % members.length;
      const nextIdx = (idx + 1) % members.length;
      
      const prev = members[prevIdx];
      const next = members[nextIdx];

      container.innerHTML = `
        <a href="${prev.website}" title="${prev.name}" style="color: #A0A0A0; text-decoration: none; display: flex; align-items: center; gap: 4px; transition: color 0.15s;" onmouseover="this.style.color='#f5f5f5'" onmouseout="this.style.color='#A0A0A0'">
          ◀ prev
        </a>
        <a href="${SITE_URL}" style="color: #4A6CF7; text-decoration: none; font-weight: 600; display: flex; align-items: center; gap: 6px;" title="bracu.network">
          [B] bracu.network
        </a>
        <a href="${next.website}" title="${next.name}" style="color: #A0A0A0; text-decoration: none; display: flex; align-items: center; gap: 4px; transition: color 0.15s;" onmouseover="this.style.color='#f5f5f5'" onmouseout="this.style.color='#A0A0A0'">
          next ▶
        </a>
      `;
    })
    .catch(err => {
      console.error('bracu.network webring error:', err);
      container.style.display = 'none';
    });
})();
