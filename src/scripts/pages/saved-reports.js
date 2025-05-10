import { getSavedReports, deleteReport } from '../utils/index.js';

class SavedReportsPage {
  async render() {
    const container = document.createElement('div');
    container.className = 'saved-reports-container';
    container.innerHTML = `
      <h2 style="margin-bottom:2rem;"><i class="fas fa-bookmark"></i> Laporan Tersimpan</h2>
      <div id="saved-reports-list"></div>
    `;

    const listEl = container.querySelector('#saved-reports-list');
    async function renderList() {
      const reports = await getSavedReports();
      if (!reports.length) {
        listEl.innerHTML = '<p style="color:#888;">Belum ada laporan yang disimpan.</p>';
        return;
      }
      listEl.innerHTML = reports.map(r => `
        <div class="saved-report-item" style="background:#f7f7f7; border-radius:6px; padding:1rem; margin-bottom:1rem; position:relative; display:flex; align-items:center; gap:1rem;">
          <img src="${r.photoUrl || ''}" alt="${r.name}" style="width:64px; height:64px; object-fit:cover; border-radius:4px; background:#eee;">
          <div style="flex:1;">
            <div style="font-weight:600; color:#4A90E2;">${r.name}</div>
            <div style="color:#333; margin:0.5rem 0;">${r.description}</div>
            <div style="font-size:0.9em; color:#888;">${new Date(r.createdAt).toLocaleString('id-ID')}</div>
          </div>
          <button class="btn-detail" data-id="${r.id}" style="margin-right:1rem; background:#4A90E2; color:#fff; border:none; border-radius:4px; padding:0.5rem 1rem; cursor:pointer;">Lihat Detail</button>
          <button class="btn-delete" data-id="${r.id}" style="background:transparent; border:none; color:#EF5350; cursor:pointer; font-size:1.2em;" title="Hapus laporan"><i class="fa-solid fa-trash"></i></button>
        </div>
      `).join('');
      // Event: lihat detail
      listEl.querySelectorAll('.btn-detail').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.hash = `#/detail?id=${btn.dataset.id}`;
        });
      });
      // Event: hapus laporan
      listEl.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
          await deleteReport(btn.dataset.id);
          renderList();
        });
      });
    }
    renderList();
    return container;
  }
}

export default SavedReportsPage; 