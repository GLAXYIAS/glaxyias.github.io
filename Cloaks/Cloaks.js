// This file acts as your cloak database
export const cloaks = [
  {
    name: "Google Classroom",
    title: "Classes",
    icon: "https://ssl.gstatic.com/classroom/favicon.png"
  },
  {
    name: "Google Drive",
    title: "My Drive - Google Drive",
    icon: "https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_32dp.png"
  },
  {
    name: "Clever",
    title: "Clever | Portal",
    icon: "https://assets.clever.com/launchpad/902161f3a/favicon.ico"
  }
];

// Function to actually change the tab
export function applyCloak(cloakName) {
  const selected = cloaks.find(c => c.name === cloakName);
  if (selected) {
    document.title = selected.title;
    
    // Change the favicon
    let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = selected.icon;
    document.getElementsByTagName('head')[0].appendChild(link);
    
    // Save to memory
    localStorage.setItem('savedCloak', cloakName);
  }
}
