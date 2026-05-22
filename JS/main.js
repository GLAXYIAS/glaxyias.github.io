// Splash screen fix - force hide if disabled
// This is a placeholder for now. Real logic below.

document.addEventListener('DOMContentLoaded', () => {
  const cloak = document.getElementById('educational-cloak');
  const disableCloak = localStorage.getItem('disableAcademicSplash') === 'true';
  
  if (cloak && disableCloak) {
    cloak.style.display = 'none';
    cloak.style.visibility = 'hidden';
  }
});

// Rest of your existing code...
console.log('Splash screen fix applied');