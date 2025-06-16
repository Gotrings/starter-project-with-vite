// This script handles the service worker registration and PWA installation

// Only run in browser context
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Wait for the window to load
  window.addEventListener('load', () => {
    // Register the service worker
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        // Check for updates
        registration.update().catch(err => 
          console.log('Error checking for service worker updates:', err)
        );
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });

    // Listen for updates
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  });

  // Handle the beforeinstallprompt event
  let deferredPrompt;
  const installButton = document.getElementById('install-button');
  
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    
    // Show the install button if it exists
    if (installButton) {
      installButton.style.display = 'block';
      
      installButton.addEventListener('click', () => {
        // Hide the install button
        installButton.style.display = 'none';
        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      });
    }
  });

  // Listen for appinstalled event
  window.addEventListener('appinstalled', (e) => {
    console.log('PWA was installed');
    if (installButton) {
      installButton.style.display = 'none';
    }
  });

  // Check if the app is running in standalone mode
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('App is running in standalone mode');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }
}
