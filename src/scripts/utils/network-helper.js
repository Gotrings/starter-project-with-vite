const NetworkHelper = {
  async isOnline() {
    const condition = navigator.onLine;
    
    if (condition) {
      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/health');
        return response.ok;
      } catch {
        return false;
      }
    }
    
    return false;
  },

  // Event listeners for online/offline status
  initNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('Aplikasi online kembali');
      this._dispatchNetworkEvent('online');
    });

    window.addEventListener('offline', () => {
      console.log('Aplikasi offline');
      this._dispatchNetworkEvent('offline');
    });
  },

  _dispatchNetworkEvent(status) {
    document.dispatchEvent(new CustomEvent('network-status-changed', {
      detail: { isOnline: status === 'online' }
    }));
  }
};

export default NetworkHelper;