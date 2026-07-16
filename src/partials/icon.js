const paths = {
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>', 'arrow-right-long': '<path d="M3 12h18M15 6l6 6-6 6"/>', bars: '<path d="M4 6h16M4 12h16M4 18h16"/>', xmark: '<path d="M6 6l12 12M18 6 6 18"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'location-dot': '<path d="M12 21s7-5.1 7-11A7 7 0 0 0 5 10c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.25"/>', phone: '<path d="M8 3H5.5A2.5 2.5 0 0 0 3 5.5C3 14.1 9.9 21 18.5 21a2.5 2.5 0 0 0 2.5-2.5V16l-4-1.5-1.5 2.5a14 14 0 0 1-8.5-8.5L9.5 7 8 3Z"/>', envelope: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m4 7 8 6 8-6"/>',
  'scale-balanced': '<path d="M12 3v18M6 6h12M4 10l-2 6h8l-2-6M20 10l2 6h-8l-2-6"/>', 'graduation-cap': '<path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11.5V16c3.5 2.5 8.5 2.5 12 0v-4.5M22 9v6"/>', 'file-contract': '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h4"/>',
  'house-chimney': '<path d="m3 11 9-8 9 8v9H5v-9Z"/><path d="M9 20v-6h6v6M16 6V3h2v5"/>', 'people-roof': '<path d="m3 10 9-7 9 7M5 20v-6h14v6M8 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM16 13a2 2 0 1 0 0-4 2 2 0 0 4Z"/>', briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18M10 12v2h4v-2"/>',
  building: '<path d="M5 21V4h10v17M15 9h4v12M3 21h18M8 8h1M11 8h1M8 12h1M11 12h1M8 16h1M11 16h1"/>', 'plane-departure': '<path d="m3 13.5 18-6.5-7.6 7.6-3 5.4-1.8-5.4L3 13.5Z"/><path d="m8.6 14.6 5.3-4.5M10.4 20l3-5.4"/>', landmark: '<path d="M3 21h18M5 18h14M6 16V9M10 16V9M14 16V9M18 16V9M4 7h16L12 3 4 7Z"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>', 'file-signature': '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 16c2-3 3 2 5-1 1-1 2-1 3 0M9 11h5"/>', children: '<circle cx="9" cy="7" r="2"/><circle cx="16" cy="8" r="1.5"/><path d="M5 20v-4a4 4 0 0 1 8 0v4M14 20v-3a3 3 0 0 1 6 0v3"/>',
  'hand-holding-dollar': '<path d="M3 15h4l3 3h7a3 3 0 0 0 0-6h-5l-2-2H6"/><circle cx="16" cy="7" r="3"/><path d="M16 5v4M15 6h2"/>', comments: '<path d="M4 5h11a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-5 3v-3a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z"/><path d="M8 10h6M8 13h4"/>', 'people-group': '<circle cx="12" cy="7" r="2"/><circle cx="6" cy="9" r="1.5"/><circle cx="18" cy="9" r="1.5"/><path d="M8 20v-3a4 4 0 0 1 8 0v3M3 20v-2a3 3 0 0 1 3-3M21 20v-2a3 3 0 0 0-3-3"/>',
  'book-open': '<path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H11v17H5.5A2.5 2.5 0 0 0 3 22V5.5ZM21 5.5A2.5 2.5 0 0 1 18.5 3H13v17h5.5A2.5 2.5 0 0 1 21 22V5.5Z"/>', 'universal-access': '<circle cx="12" cy="4" r="2"/><path d="M4 8h16M12 6v14M8 21l4-7 4 7M8 14l4-3 4 3"/>', 'building-columns': '<path d="M3 21h18M5 18h14M6 16V9M10 16V9M14 16V9M18 16V9M3 7h18L12 3 3 7Z"/>',
  'shield-halved': '<path d="M12 3 5 6v5c0 4.5 2.7 8.6 7 10 4.3-1.4 7-5.5 7-10V6l-7-3Z"/><path d="M12 3v18"/>', 'people-arrows-left-right': '<circle cx="6" cy="8" r="2"/><circle cx="18" cy="16" r="2"/><path d="M3 18v-2a3 3 0 0 1 6 0v2M15 8V6a3 3 0 0 1 6 0v2M10 8h5M13 5l3 3-3 3M14 16H9M11 13l-3 3 3 3"/>', users: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M15 15a5 5 0 0 1 6 4v2"/>',
  'helmet-safety': '<path d="M4 14a8 8 0 0 1 16 0v2H4v-2ZM12 6v8M3 19h18"/>', 'clipboard-check': '<rect x="6" y="4" width="12" height="17" rx="1"/><path d="M9 4V3h6v1M9 13l2 2 4-4"/>', 'folder-open': '<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/>',
  'map-location-dot': '<path d="M3 6 9 3l6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/><circle cx="15" cy="11" r="1.5"/>', 'file-lines': '<path d="M6 3h9l3 3v15H6z"/><path d="M15 3v4h4M9 12h6M9 16h6M9 8h2"/>', 'magnifying-glass': '<circle cx="11" cy="11" r="6"/><path d="m16 16 5 5"/>',
  whatsapp: '<path d="M20 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20l1.2-4.1A8.5 8.5 0 1 1 20 11.5Z"/><path d="M8 8.5c.4 3 2.3 4.9 5.3 5.3l1.2-1.2 1.4.7c.2.1.3.4.2.6-.4.9-1.3 1.4-2.2 1.3-4.1-.6-6.8-3.3-7.4-7.4-.1-.9.4-1.8 1.3-2.2.2-.1.5 0 .6.2l.7 1.4L8 8.5Z"/>', instagram: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".75" fill="currentColor" stroke="none"/>',
  'linkedin-in': '<path d="M6 9v9M6 6v.01M10 18v-5a3 3 0 0 1 6 0v5M10 9v9"/>', 'facebook-f': '<path d="M14 21v-8h3l.5-3H14V8.5A1.5 1.5 0 0 1 15.5 7H18V4.2c-.7-.1-1.5-.2-2.4-.2A4.6 4.6 0 0 0 11 8.6V10H8v3h3v8"/>', 'x-twitter': '<path d="M5 4l14 16M19 4 5 20"/>',
};

function icon(name, classes = '', size = '1em') {
  const path = paths[name];
  if (!path) throw new Error(`Unsupported icon: ${name}`);
  return `<svg class="${classes}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${path}</svg>`;
}

function fontAwesomeSize(classes) {
  const namedSizes = { '2xs': '.625em', xs: '.75em', sm: '.875em', lg: '1.25em', xl: '1.5em', '2xl': '2em' };
  const namedSize = classes.match(/\bfa-(2xs|xs|sm|lg|xl|2xl)\b/);
  if (namedSize) return namedSizes[namedSize[1]];
  const scaledSize = classes.match(/\bfa-(\d+(?:\.\d+)?)x\b/);
  return scaledSize ? `${scaledSize[1]}em` : '1em';
}

function replaceFontAwesomeIcons(content) {
  return content.replace(/<i class="([^"]*)"(?: aria-hidden="true")?><\/i>/g, (match, classes) => {
    const matchClass = classes.match(/\bfa-(?:solid|regular|brands)\s+(fa-[\w-]+)/);
    if (!matchClass) return match;
    const svgClasses = classes.replace(/\bfa-(?:solid|regular|brands|[\w-]+)\b/g, '').trim();
    return icon(matchClass[1].slice(3), svgClasses, fontAwesomeSize(classes));
  });
}

module.exports = { icon, replaceFontAwesomeIcons };
