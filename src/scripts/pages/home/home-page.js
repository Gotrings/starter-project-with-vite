import StoryModel from '../../models/story.js';
import IndexedDBService from '../../services/idb.js';

export default class HomePage {
  constructor() {
    this.storyModel = new StoryModel();
  }

  async render() {
    return `
      <section class="container stories-container">
        <h1>Cerita Terbaru</h1>
        <div id="stories-list" class="stories-grid">
          <!-- Stories will be dynamically inserted here -->
        </div>
        <div id="stories-pagination" class="pagination">
          <!-- Pagination controls will be added here -->
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storiesList = document.getElementById('stories-list');
    
    try {
      // Fetch stories from API
      const stories = await this.storyModel.getAllStories();

      // Save stories to IndexedDB
      await Promise.all(stories.map(async (story) => {
        try {
          await IndexedDBService.addStory(story);
        } catch (dbError) {
          console.warn(`Could not save story ${story.id} to IndexedDB:`, dbError);
        }
      }));

      // Render stories
      storiesList.innerHTML = stories.map(story => `
        <div class="story-card" data-id="${story.id}">
          <img src="${story.photoUrl}" alt="${story.description}" class="story-image">
          <div class="story-content">
            <h2>${story.name}</h2>
            <p>${story.description}</p>
            <div class="story-meta">
              <span>${new Date(story.createdAt).toLocaleDateString()}</span>
              <a href="#/stories/${story.id}" class="btn btn-sm btn-primary">
                Lihat Detail
              </a>
            </div>
          </div>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading stories:', error);
      storiesList.innerHTML = `
        <p class="error">Gagal memuat cerita. ${error.message}</p>
      `;
    }
  }
}
