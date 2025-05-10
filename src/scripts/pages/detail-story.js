import { StoryModel } from '../models/story.js';
// import { StoryView } from '../views/story.js';
// import { StoryPresenter } from '../presenters/story.js';
import { saveReport, addComment, getCommentsByStoryId, deleteComment } from '../utils/index.js';

class DetailStoryPage {
  constructor() {
    this.model = new StoryModel();
    // this.view = new StoryView();
    // this.presenter = new StoryPresenter(this.model, this.view);
  }

  async render() {
    this.model.token = localStorage.getItem('token') || null;
    const detailContainer = document.createElement('div');
    detailContainer.classList.add('detail-story-container');

    // Show loading state
    detailContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Loading story details...</p>
      </div>
    `;

    try {
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
      const storyId = urlParams.get('id');

      if (!storyId) {
        throw new Error('Story ID not found');
      }

      const story = await this.model.getStoryById(storyId);
      if (!story) {
        throw new Error('Story not found');
      }

      // Validasi data penting
      const name = story.name || '-';
      const createdAt = story.createdAt ? new Date(story.createdAt) : null;
      const formattedDate = createdAt ? createdAt.toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      }) : '-';
      const lat = story.lat !== undefined ? story.lat : '-';
      const lon = story.lon !== undefined ? story.lon : '-';
      const photoUrl = story.photoUrl || '';
      const description = story.description || '-';
      const ownerName = story.owner && story.owner.name ? story.owner.name : '-';

      detailContainer.innerHTML = `
        <div class="detail-story">
          <div class="detail-header">
            <h2>${name}</h2>
            <p class="detail-date">${formattedDate}</p>
            <p class="detail-author">Dibuat oleh: ${ownerName}</p>
          </div>
          <div class="detail-content">
            <div class="detail-image">
              ${photoUrl ? `<img src="${photoUrl}" alt="${name}" loading="lazy">` : '<span>Tidak ada foto</span>'}
            </div>
            <div class="detail-description">
              <h3>Deskripsi</h3>
              <p>${description}</p>
            </div>
            <div class="detail-location">
              <h3>Lokasi</h3>
              <p>Latitude: ${lat}</p>
              <p>Longitude: ${lon}</p>
              <div id="map" class="detail-map"></div>
            </div>
            <hr />
            <div class="aksi-section">
              <h3>Aksi</h3>
              <div style="display: flex; gap: 1rem; margin-bottom: 2rem;">
                <button id="save-report-btn" class="btn" style="border:1px solid #ccc; background:#fff; color:#222;" title="Simpan laporan">
                  Simpan laporan <i class="fa-regular fa-bookmark"></i>
                </button>
                <button class="btn" style="border:1px solid #ccc; background:#fff; color:#222;" title="Try Notify Me">
                  Try Notify Me <i class="fa-regular fa-bell"></i>
                </button>
              </div>
            </div>
            <hr />
            <div class="tanggapan-section" style="margin-top:2rem;">
              <h3>Beri Komentar</h3>
              <form class="tanggapan-form">
                <textarea id="comment-textarea" style="width:100%; min-height:120px; margin-bottom:1rem; padding:1rem; border-radius:8px; border:1px solid #ccc;" placeholder="Beri tanggapan terkait laporan."></textarea>
                <br />
                <button type="submit" class="btn" style="background:#4A90E2; color:#fff;">Submit</button>
              </form>
              <div id="comments-list" style="margin-top:2rem;"></div>
            </div>
          </div>
          <div class="detail-actions">
            <button class="back-button" onclick="window.location.hash = '#/stories'">
              <i class="fas fa-arrow-left"></i> Kembali
            </button>
          </div>
        </div>
      `;

      // Inisialisasi peta jika data lat/lon valid
      if (lat !== '-' && lon !== '-') {
        setTimeout(() => {
          const map = L.map('map').setView([lat, lon], 13);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          L.marker([lat, lon])
            .addTo(map)
            .bindPopup(name)
            .openPopup();
        }, 0);
      } else {
        document.getElementById('map').innerHTML = '<p>Lokasi tidak tersedia</p>';
      }

      // IndexedDB: Simpan laporan
      const saveBtn = detailContainer.querySelector('#save-report-btn');
      saveBtn.addEventListener('click', async () => {
        await saveReport({ id: story.id, name, description, photoUrl, lat, lon, createdAt: story.createdAt });
        saveBtn.innerHTML = 'Tersimpan <i class="fa-solid fa-check"></i>';
        saveBtn.disabled = true;
      });

      // IndexedDB: Komentar
      const commentsList = detailContainer.querySelector('#comments-list');
      async function renderComments() {
        const comments = await getCommentsByStoryId(story.id);
        if (!comments.length) {
          commentsList.innerHTML = '<p style="color:#888;">Belum ada komentar.</p>';
          return;
        }
        commentsList.innerHTML = comments.map(c => `
          <div class="comment-item" style="background:#f7f7f7; border-radius:6px; padding:1rem; margin-bottom:1rem; position:relative;">
            <div style="font-weight:600; color:#4A90E2;">${c.user || 'Anonymous'}</div>
            <div style="margin:0.5rem 0; color:#333;">${c.message}</div>
            <div style="font-size:0.85em; color:#888;">${new Date(c.createdAt).toLocaleString('id-ID')}</div>
            <button data-id="${c.commentId}" class="delete-comment-btn" style="position:absolute; top:1rem; right:1rem; background:transparent; border:none; color:#EF5350; cursor:pointer; font-size:1.1em;" title="Hapus komentar"><i class="fa-solid fa-trash"></i></button>
          </div>
        `).join('');
        // Hapus komentar
        commentsList.querySelectorAll('.delete-comment-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            await deleteComment(Number(btn.dataset.id));
            renderComments();
          });
        });
      }
      renderComments();

      // Submit komentar
      const form = detailContainer.querySelector('.tanggapan-form');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const textarea = form.querySelector('#comment-textarea');
        const message = textarea.value.trim();
        if (!message) return;
        const user = localStorage.getItem('userName') || 'Anonymous';
        await addComment(story.id, user, message);
        textarea.value = '';
        renderComments();
      });

    } catch (error) {
      console.error('Error loading story:', error);
      // Auto-retry reload sekali jika error 401
      if (String(error).includes('401') && !sessionStorage.getItem('detail-story-retried')) {
        sessionStorage.setItem('detail-story-retried', '1');
        window.location.reload();
        return detailContainer;
      } else {
        sessionStorage.removeItem('detail-story-retried');
      }
      detailContainer.innerHTML = `
        <div class="error-container">
          <i class="fas fa-exclamation-circle"></i>
          <h3>Error</h3>
          <p>${error.message || 'Failed to load story details'}</p>
          <button class="back-button" onclick="window.location.hash = '#/stories'">
            <i class="fas fa-arrow-left"></i> Kembali ke Stories
          </button>
        </div>
      `;
    }

    return detailContainer;
  }
}

export default DetailStoryPage; 