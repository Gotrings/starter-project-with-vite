class AppShell {
  constructor({
    header,
    main,
    footer,
  }) {
    this._header = header;
    this._main = main;
    this._footer = footer;
  }

  async render() {
    return `
      <header class="header" id="header">
        ${await this._header.render()}
      </header>
      <main id="mainContent">
        ${await this._main.render()}
      </main>
      <footer>
        ${await this._footer.render()}
      </footer>
    `;
  }

  async afterRender() {
    await this._header.afterRender();
    await this._main.afterRender();
    await this._footer.afterRender();
  }

  // Method untuk memperbarui konten utama
  async updateMainContent(content) {
    const mainContainer = document.querySelector('#mainContent');
    mainContainer.innerHTML = await content.render();
    await content.afterRender();
  }

  // Method untuk memperbarui header
  async updateHeader(isOnline) {
    const headerContainer = document.querySelector('#header');
    headerContainer.classList.toggle('offline', !isOnline);
    
    if (!isOnline) {
      headerContainer.innerHTML += '<div class="offline-indicator">Offline Mode</div>';
    } else {
      const offlineIndicator = headerContainer.querySelector('.offline-indicator');
      if (offlineIndicator) {
        offlineIndicator.remove();
      }
    }
  }
}

export default AppShell;