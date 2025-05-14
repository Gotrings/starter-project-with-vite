import NetworkHelper from './network-helper';
import FavoriteStoryIdb from '../data/favorite-story-idb';

const AppShellInitiator = {
  async init({ appShell }) {
    this._appShell = appShell;
    this._initialAppShell();

    // Initialize network status listeners
    NetworkHelper.initNetworkListeners();
    this._initialNetworkListener();
  },

  _initialAppShell() {
    // Render initial app shell
    const appShellContainer = document.querySelector('#app');
    this._appShell.render().then(html => {
      appShellContainer.innerHTML = html;
      this._appShell.afterRender();
    });
  },

  _initialNetworkListener() {
    window.addEventListener('load', async () => {
      const isOnline = await NetworkHelper.isOnline();
      this._appShell.updateHeader(isOnline);
    });

    document.addEventListener('network-status-changed', async (event) => {
      const isOnline = event.detail.isOnline;
      this._appShell.updateHeader(isOnline);

      if (!isOnline) {
        // When offline, try to load data from IndexedDB
        const stories = await FavoriteStoryIdb.getAllStories();
        if (stories.length > 0) {
          // Update UI with cached data
          this._appShell.updateMainContent({
            render: async () => {
              return `
                <div class="stories-list">
                  <h2>Cerita Tersimpan (Mode Offline)</h2>
                  ${stories.map(story => `
                    <article class="story-item">
                      <h3>${story.title}</h3>
                      <p>${story.description}</p>
                    </article>
                  `).join('')}
                </div>
              `;
            },
            afterRender: async () => {}
          });
        }
      }
    });
  }
};

export default AppShellInitiator;