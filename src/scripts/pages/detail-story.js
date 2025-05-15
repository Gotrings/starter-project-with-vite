import { StoryModel } from '../models/story.js';
import IndexedDBService from '../services/idb.js';
import { saveReport, addComment, getCommentsByStoryId, deleteComment } from '../utils/index.js';
import pushNotificationService from '../services/pushNotification.js';
import { showLocalNotification } from '../index.js';

class DetailStoryPage {
  constructor() {
    this.model = new StoryModel();
    this.storyModel = new StoryModel();
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

      // Save story to IndexedDB
      try {
        await IndexedDBService.addStory(story);
      } catch (dbError) {
        console.warn(`Could not save story ${storyId} to IndexedDB:`, dbError);
      }

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
        try {
          // Simpan ke IndexedDB
          const reportData = { 
            id: story.id, 
            name, 
            description, 
            photoUrl, 
            lat, 
            lon, 
            createdAt: story.createdAt 
          };
          await saveReport(reportData);

          // Update UI
          saveBtn.innerHTML = 'Tersimpan <i class="fa-solid fa-check"></i>';
          saveBtn.disabled = true;
          saveBtn.style.background = '#4CAF50';
          saveBtn.style.color = '#fff';
          saveBtn.style.border = 'none';
          
          if (this.view && this.view.showSuccess) {
            this.view.showSuccess('Laporan berhasil disimpan!');
          } else {
            alert('Laporan berhasil disimpan!');
          }
          showLocalNotification('Story Notification', 'Laporan telah tersimpan');
        } catch (error) {
          console.error('Error saving report:', error);
          if (this.view && this.view.showError) {
            this.view.showError('Gagal menyimpan laporan: ' + error.message);
          } else {
            alert('Gagal menyimpan laporan: ' + error.message);
          }
        }
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
        showLocalNotification('Story Notification', 'Komentar kamu berhasil di tambahkan');
      });

    } catch (error) {
      console.error('Error loading story:', error);

      // Fallback: coba ambil dari IndexedDB jika error 404
      if (String(error).includes('404')) {
        try {
          const db = await openDB();
          const tx = db.transaction('savedReports', 'readonly');
          const store = tx.objectStore('savedReports');
          const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
          const storyId = urlParams.get('id');
          const localStory = await store.get(storyId);

          if (localStory) {
            // Render detail dari data lokal
            const name = localStory.name || '-';
            const createdAt = localStory.createdAt ? new Date(localStory.createdAt) : null;
            const formattedDate = createdAt ? createdAt.toLocaleDateString('id-ID', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : '-';
            const lat = localStory.lat !== undefined ? localStory.lat : '-';
            const lon = localStory.lon !== undefined ? localStory.lon : '-';
            const photoUrl = localStory.photoUrl || '';
            const description = localStory.description || '-';
            const ownerName = '- (offline)';

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
                      <button class="back-button" onclick="window.location.hash = '#/stories'">
                        <i class="fas fa-arrow-left"></i> Kembali ke Stories
                      </button>
                    </div>
                  </div>
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
            return detailContainer;
          }
        } catch (localErr) {
          console.error('Error loading local story:', localErr);
        }
      }

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