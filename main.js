(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&o(i)}).observe(document,{childList:!0,subtree:!0});function t(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(r){if(r.ep)return;r.ep=!0;const s=t(r);fetch(r.href,s)}})();class f{constructor(){this.dbName="story-app-db",this.dbVersion=2,this.db=null}async clearAndReinit(){return new Promise((e,t)=>{const o=indexedDB.deleteDatabase(this.dbName);o.onsuccess=()=>{console.log("Database deleted successfully"),this.db=null,this.init().then(e).catch(t)},o.onerror=r=>{console.error("Error deleting database:",r.target.error),t("Error deleting database")},o.onblocked=()=>{console.error("Database deletion blocked"),t("Database deletion blocked. Please close all other tabs using this database.")}})}async init(){return new Promise((e,t)=>{const o=indexedDB.open(this.dbName,this.dbVersion);o.onerror=r=>{console.error("Error opening database:",r.target.error),t("Error opening database")},o.onsuccess=r=>{this.db=r.target.result,console.log("Database initialized successfully"),e(this.db)},o.onupgradeneeded=r=>{const s=r.target.result;if(!s.objectStoreNames.contains("reports")){const i=s.createObjectStore("reports",{keyPath:"id",autoIncrement:!0});i.createIndex("timestamp","timestamp",{unique:!1}),i.createIndex("title","title",{unique:!1}),console.log("Reports store created")}if(s.objectStoreNames.contains("stories")||(s.createObjectStore("stories",{keyPath:"id"}).createIndex("createdAt","createdAt",{unique:!1}),console.log("Stories store created")),!s.objectStoreNames.contains("savedReports"))try{s.createObjectStore("savedReports",{keyPath:"id"}).createIndex("savedAt","savedAt",{unique:!1}),console.log("Saved reports store created")}catch(i){throw console.error("Error creating savedReports store:",i),indexedDB.deleteDatabase(this.dbName),i}}})}async saveStories(e){return this.db||await this.init(),new Promise((t,o)=>{const s=this.db.transaction(["stories"],"readwrite").objectStore("stories"),i=s.clear();i.onsuccess=()=>{const a=e.map(c=>new Promise((d,h)=>{const p=s.add({...c,id:c.id,createdAt:new Date().toISOString()});p.onsuccess=()=>d(),p.onerror=u=>{console.error("Error adding story:",u),h(u)}}));Promise.all(a).then(()=>t()).catch(c=>o(c))},i.onerror=a=>{console.error("Error clearing stories:",a),o(a)}})}async getStories(){return this.db||await this.init(),new Promise((e,t)=>{const s=this.db.transaction(["stories"],"readonly").objectStore("stories").getAll();s.onsuccess=()=>e(s.result||[]),s.onerror=i=>{console.error("Error getting stories:",i),t(i)}})}async ensureDatabase(){this.db||await this.init(),this.db.objectStoreNames.contains("savedReports")||(console.warn("savedReports store not found, recreating database..."),await this.clearAndReinit())}async saveReport(e){return await this.ensureDatabase(),this.db||await this.init(),new Promise((t,o)=>{const s=this.db.transaction(["savedReports"],"readwrite").objectStore("savedReports"),i=s.get(e.id);i.onsuccess=()=>{if(i.result){o(new Error("Laporan sudah tersimpan"));return}const a={...e,savedAt:new Date().toISOString()},c=s.add(a);c.onsuccess=()=>t(a),c.onerror=d=>{console.error("Error saving report:",d),o(d)}},i.onerror=a=>{console.error("Error checking report existence:",a),o(a)}})}async getSavedReports(){return await this.ensureDatabase(),new Promise((e,t)=>{const s=this.db.transaction(["savedReports"],"readonly").objectStore("savedReports").getAll();s.onsuccess=()=>e(s.result||[]),s.onerror=i=>{console.error("Error getting saved reports:",i),t(i)}})}async deleteReport(e){return await this.ensureDatabase(),new Promise((t,o)=>{const i=this.db.transaction(["savedReports"],"readwrite").objectStore("savedReports").delete(e);i.onsuccess=()=>t(),i.onerror=a=>{console.error("Error deleting report:",a),o(a)}})}async saveReportToReports(e){return this.db||await this.init(),new Promise((t,o)=>{const s=this.db.transaction(["reports"],"readwrite").objectStore("reports"),i={...e,timestamp:new Date().toISOString()},a=s.add(i);a.onsuccess=()=>{console.log("Report saved successfully"),t(a.result)},a.onerror=c=>{console.error("Error saving report:",c.target.error),o("Error saving report")}})}async getAllReports(){return this.db||await this.init(),new Promise((e,t)=>{const s=this.db.transaction(["reports"],"readonly").objectStore("reports").getAll();s.onsuccess=()=>e(s.result||[]),s.onerror=i=>{console.error("Error getting reports:",i),t(i)}})}}const l=new f;l.init().catch(console.error);class g{constructor(){this.baseUrl="https://story-api.dicoding.dev/v1",this.token=localStorage.getItem("token")}setToken(e){this.token=e,e?localStorage.setItem("token",e):localStorage.removeItem("token")}async register(e){try{return await(await fetch(`${this.baseUrl}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).json()}catch(t){throw console.error("Error registering:",t),t}}async login(e){var t;try{const r=await(await fetch(`${this.baseUrl}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)})).json();return!r.error&&((t=r.loginResult)!=null&&t.token)&&this.setToken(r.loginResult.token),r}catch(o){throw console.error("Error logging in:",o),o}}logout(){this.setToken(null)}async getStories(e=1,t=10,o=0){try{const r={};this.token&&(r.Authorization=`Bearer ${this.token}`);const s=await fetch(`${this.baseUrl}/stories?page=${e}&size=${t}&location=${o}`,{headers:r});if(s.status===401)throw this.setToken(null),new Error("Session expired. Please login again.");if(!s.ok)throw new Error(`HTTP error! status: ${s.status}`);const i=await s.json();if(i.error)throw new Error(i.message);try{await l.saveStories(i.listStory)}catch(a){console.warn("Gagal menyimpan stories ke IndexedDB:",a)}return i.listStory}catch(r){console.error("Error fetching stories:",r);try{const s=await l.getStories();if(s&&s.length>0)return s;throw r}catch(s){throw console.warn("Gagal mengambil stories dari IndexedDB:",s),r}}}async addStory(e){try{const t=new FormData;t.append("description",e.description),t.append("photo",e.photo),e.lat&&t.append("lat",e.lat),e.lon&&t.append("lon",e.lon);const o={};return this.token&&(o.Authorization=`Bearer ${this.token}`),await(await fetch(`${this.baseUrl}/stories`,{method:"POST",headers:o,body:t})).json()}catch(t){throw console.error("Error adding story:",t),t}}async addStoryAsGuest(e){try{const t=new FormData;return t.append("description",e.description),t.append("photo",e.photo),e.lat&&t.append("lat",e.lat),e.lon&&t.append("lon",e.lon),await(await fetch(`${this.baseUrl}/stories/guest`,{method:"POST",body:t})).json()}catch(t){throw console.error("Error adding story as guest:",t),t}}async subscribeToNotifications(e){try{const o=await(await fetch(`${this.baseUrl}/notifications/subscribe`,{method:"POST",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:e.endpoint,keys:{p256dh:e.keys.p256dh,auth:e.keys.auth}})})).json();if(o.error)throw new Error(o.message);return o}catch(t){throw console.error("Error subscribing to notifications:",t),t}}async unsubscribeFromNotifications(e){try{const o=await(await fetch(`${this.baseUrl}/notifications/subscribe`,{method:"DELETE",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:e})})).json();if(o.error)throw new Error(o.message);return o}catch(t){throw console.error("Error unsubscribing from notifications:",t),t}}async getStoryById(e){try{const t={};this.token&&(t.Authorization=`Bearer ${this.token}`);const o=await fetch(`${this.baseUrl}/stories/${e}`,{headers:t});if(!o.ok)throw new Error(`HTTP error! status: ${o.status}`);const r=await o.json();if(r.error)throw new Error(r.message);return r.story}catch(t){throw console.error("Error fetching story:",t),t}}}class w{constructor(){this.appElement=document.getElementById("app"),this.map=null,this.markers=null,this.cameraStream=null,this.setupNotificationPermission(),this.setupNotificationContainer()}setupNotificationContainer(){const e=document.createElement("div");e.id="notification-container",e.className="notification-container",document.body.appendChild(e)}showNotification(e,t="info"){const o=document.getElementById("notification-container"),r=document.createElement("div");r.className=`notification notification-${t}`,r.textContent=e,o.appendChild(r),setTimeout(()=>{r.classList.add("fade-out"),setTimeout(()=>{r.remove()},300)},3e3)}showError(e){this.showNotification(e,"error")}showSuccess(e){this.showNotification(e,"success")}async setupNotificationPermission(){"Notification"in window&&"serviceWorker"in navigator&&await Notification.requestPermission()==="granted"&&this.registerServiceWorker()}async registerServiceWorker(){try{const o=await navigator.serviceWorker.register("/starter-project-with-vite/sw.js");if(localStorage.getItem("notificationsEnabled")==="true"){const s=await o.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"});s&&await new g().subscribeToNotifications({endpoint:s.endpoint,keys:{p256dh:btoa(String.fromCharCode.apply(null,new Uint8Array(s.getKey("p256dh")))),auth:btoa(String.fromCharCode.apply(null,new Uint8Array(s.getKey("auth"))))}})}return o}catch(e){console.error("Error registering service worker:",e)}}async sendNotification(e,t){try{await(await navigator.serviceWorker.ready).showNotification(e,t)}catch(o){console.error("Error sending notification:",o)}}renderHome(){const e=localStorage.getItem("token")!==null;this.appElement.innerHTML=`
            <section class="hero">
                <h2>Welcome to Story Documentation</h2>
                <p>Share your stories with the world!</p>
                ${e?`
                    <button id="logout-btn" class="btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
                `:`
                    <div class="auth-buttons">
                        <button id="login-btn" class="btn"><i class="fas fa-sign-in-alt"></i> Login</button>
                        <button id="register-btn" class="btn"><i class="fas fa-user-plus"></i> Register</button>
                    </div>
                `}
            </section>
        `,e&&document.getElementById("logout-btn").addEventListener("click",()=>{localStorage.removeItem("token"),this.showSuccess("Logged out successfully!"),setTimeout(()=>{window.location.reload()},1e3)})}renderLogin(){this.appElement.innerHTML=`
            <section class="auth-form">
                <h2>Login</h2>
                <form id="login-form">
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit" class="btn">Login</button>
                </form>
            </section>
        `}renderRegister(){this.appElement.innerHTML=`
            <section class="auth-form">
                <h2>Register</h2>
                <form id="register-form">
                    <div class="form-group">
                        <label for="name">Name</label>
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required minlength="8">
                    </div>
                    <button type="submit" class="btn">Register</button>
                </form>
            </section>
        `}renderStories(e){const t=localStorage.getItem("token")!==null;this.appElement.innerHTML=`
            <section class="stories">
                <h2>Stories</h2>
                <div class="stories-grid">
                    ${e.map(o=>this.createStoryCard(o)).join("")}
                </div>
                <div id="map" class="map-container"></div>
                ${t?`
                    <button id="add-story-btn" class="btn">Add New Story</button>
                `:`
                    <button id="add-story-guest-btn" class="btn">Add Story as Guest</button>
                `}
            </section>
        `,this.initializeMap(e)}createStoryCard(e){return`
            <article class="story-card">
                <img src="${e.photoUrl}" alt="${e.description}" loading="lazy">
                <div class="story-content">
                    <h3>${e.name}</h3>
                    <p>${e.description}</p>
                    ${e.lat&&e.lon?`
                        <p>Location: ${e.lat}, ${e.lon}</p>
                    `:""}
                    <p>Created: ${new Date(e.createdAt).toLocaleDateString()}</p>
                    <button class="btn view-details" data-id="${e.id}">
                        <i class="fas fa-info-circle"></i> Selengkapnya
                    </button>
                </div>
            </article>
        `}renderStoryDetail(e){this.appElement.innerHTML=`
            <section class="story-detail">
                <button class="btn back-btn" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <div class="detail-content">
                    <h2>${e.name}</h2>
                    <div class="detail-info">
                        <p><i class="fas fa-user"></i> Pembuat: ${e.name}</p>
                        <p><i class="fas fa-calendar"></i> Tanggal Dibuat: ${new Date(e.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="detail-image">
                        <img src="${e.photoUrl}" alt="${e.description}">
                    </div>
                    <div class="detail-description">
                        <h3>Deskripsi</h3>
                        <p>${e.description}</p>
                    </div>
                    ${e.lat&&e.lon?`
                        <div class="detail-location">
                            <h3>Lokasi</h3>
                            <div id="detail-map" class="map-container"></div>
                            <div class="coordinates">
                                <p><i class="fas fa-map-marker-alt"></i> Latitude: ${e.lat}</p>
                                <p><i class="fas fa-map-marker-alt"></i> Longitude: ${e.lon}</p>
                            </div>
                        </div>
                    `:""}
                    <button class="btn save-report" data-id="${e.id}">
                        <i class="fas fa-save"></i> Simpan Laporan
                    </button>
                </div>
            </section>
        `,e.lat&&e.lon&&this.initializeDetailMap(e);const t=this.appElement.querySelector(".save-report");t&&t.addEventListener("click",()=>{this.saveReport(e)})}initializeDetailMap(e){const t=L.map("detail-map").setView([e.lat,e.lon],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(t),L.marker([e.lat,e.lon]).addTo(t).bindPopup(`
                <div class="story-popup">
                    <h3>${e.name}</h3>
                    <p>${e.description}</p>
                </div>
            `)}async saveReport(e){try{return await l.saveReport(e),this.showSuccess("Laporan berhasil disimpan"),!0}catch(t){if(console.error("Error saving report:",t),this.showError(t.message||"Gagal menyimpan laporan"),t.name==="NotFoundError"||t.message.includes("object store"))try{return await l.clearAndReinit(),await l.saveReport(e),this.showSuccess("Laporan berhasil disimpan"),!0}catch(o){console.error("Error retrying save after reinitialization:",o)}return!1}}renderAddStory(e=!1){this.appElement.innerHTML=`
            <section class="add-story">
                <h2>${e?"Add Story as Guest":"Add New Story"}</h2>
                <form id="story-form">
                    <div class="form-group">
                        <label for="photo">Photo</label>
                        <div class="camera-container">
                            <video id="camera-preview" autoplay playsinline style="display: none;"></video>
                            <canvas id="photo-canvas" style="display: none;"></canvas>
                            <img id="photo-preview" style="display: none; max-width: 100%; margin-top: 1rem;">
                            <button type="button" id="start-camera" class="btn">Start Camera</button>
                            <button type="button" id="capture-photo" class="btn" style="display: none;">Capture Photo</button>
                            <input type="file" id="photo" name="photo" accept="image/*" style="display: none;">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="description">Description</label>
                        <textarea id="description" name="description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="location">Location</label>
                        <div id="location-map" class="map-container"></div>
                        <div id="coordinates-display" class="coordinates-display"></div>
                        <input type="hidden" id="lat" name="lat">
                        <input type="hidden" id="lon" name="lon">
                    </div>
                    <button type="submit" class="btn">Submit Story</button>
                </form>
            </section>
        `,this.initializeLocationMap(),this.setupCameraHandlers(),this.setupStoryForm()}setupCameraHandlers(){const e=document.getElementById("start-camera"),t=document.getElementById("capture-photo"),o=document.getElementById("camera-preview"),r=document.getElementById("photo-canvas"),s=document.getElementById("photo"),i=document.getElementById("photo-preview");e.addEventListener("click",async()=>{try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),o.srcObject=this.cameraStream,o.style.display="block",e.style.display="none",t.style.display="inline-block",i.style.display="none"}catch(a){this.showError("Failed to access camera"),console.error("Camera error:",a)}}),t.addEventListener("click",()=>{if(!this.cameraStream)return;const a=r.getContext("2d");r.width=o.videoWidth,r.height=o.videoHeight,a.drawImage(o,0,0),r.toBlob(c=>{const d=new File([c],"photo.jpg",{type:"image/jpeg"}),h=new DataTransfer;h.items.add(d),s.files=h.files,this.stopCameraStream();const p=URL.createObjectURL(c);i.src=p,i.style.display="block",i.onload=()=>{URL.revokeObjectURL(p)},this.showSuccess("Photo captured successfully!")},"image/jpeg",.95)}),window.addEventListener("hashchange",()=>{this.stopCameraStream()})}stopCameraStream(){if(this.cameraStream){this.cameraStream.getTracks().forEach(r=>r.stop()),this.cameraStream=null;const e=document.getElementById("camera-preview");e&&(e.srcObject=null,e.style.display="none");const t=document.getElementById("start-camera"),o=document.getElementById("capture-photo");t&&(t.style.display="inline-block"),o&&(o.style.display="none")}}initializeMap(e){this.map&&(this.map.remove(),this.map=null),this.map=L.map("map").setView([0,0],2);const t={OpenStreetMap:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}),Satellite:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),Dark:L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© CARTO"})};t.OpenStreetMap.addTo(this.map),L.control.layers(t).addTo(this.map),this.markers&&this.markers.clearLayers(),this.markers=L.markerClusterGroup(),e.forEach(o=>{if(o.lat&&o.lon){const r=L.marker([o.lat,o.lon]).bindPopup(`
                        <div class="story-popup">
                            <img src="${o.photoUrl}" alt="${o.description}" style="max-width: 200px; border-radius: 4px;">
                            <h3>${o.name}</h3>
                            <p>${o.description}</p>
                        </div>
                    `);this.markers.addLayer(r)}}),this.map.addLayer(this.markers),this.markers.getLayers().length>0&&this.map.fitBounds(this.markers.getBounds())}initializeLocationMap(){const e=document.getElementById("location-map");e._leaflet_id&&L.map(e).remove();const t=L.map("location-map").setView([0,0],2),o={OpenStreetMap:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}),Satellite:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),Dark:L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© CARTO"})};o.OpenStreetMap.addTo(t),L.control.layers(o).addTo(t);let r=null;const s=document.getElementById("coordinates-display");t.on("click",i=>{r&&t.removeLayer(r),r=L.marker(i.latlng).addTo(t),document.getElementById("lat").value=i.latlng.lat,document.getElementById("lon").value=i.latlng.lng,s.textContent=`Latitude: ${i.latlng.lat.toFixed(6)}, Longitude: ${i.latlng.lng.toFixed(6)}`})}setupStoryForm(){const e=document.getElementById("story-form");e.addEventListener("submit",async t=>{t.preventDefault();const o=new FormData(e);o.get("description"),o.get("photo"),o.get("lat"),o.get("lon");try{const r=e.querySelector('button[type="submit"]');r.disabled=!0,r.textContent="Submitting...",await new Promise(s=>setTimeout(s,1e3)),this.showSuccess("Story submitted successfully!"),window.location.hash="#/stories"}catch(r){this.showError("Failed to submit story"),console.error("Error submitting story:",r)}finally{const r=e.querySelector('button[type="submit"]');r.disabled=!1,r.textContent="Submit Story"}})}async renderSavedReports(e=null){if(this.appElement.innerHTML=`
            <section class="saved-reports">
                <h2>Saved Reports</h2>
                <div class="loading">Memuat laporan tersimpan...</div>
            </section>
        `,!e)try{e=await l.getSavedReports()}catch(o){console.error("Error loading saved reports:",o),this.showError("Gagal memuat laporan tersimpan. Silakan muat ulang halaman."),this.appElement.querySelector(".saved-reports").innerHTML=`
                    <h2>Saved Reports</h2>
                    <div class="error">Gagal memuat laporan tersimpan. <button id="retry-load">Coba Lagi</button></div>
                `;const r=this.appElement.querySelector("#retry-load");r&&r.addEventListener("click",()=>this.renderSavedReports());return}this.appElement.innerHTML=`
            <section class="saved-reports">
                <h2>Saved Reports</h2>
                ${e.length===0?`
                    <p class="no-reports">No saved reports yet.</p>
                `:`
                    <div class="reports-grid">
                        ${e.map(o=>`
                            <article class="report-card">
                                <img src="${o.photoUrl}" alt="${o.description}" loading="lazy">
                                <div class="report-content">
                                    <h3>${o.name}</h3>
                                    <p>${o.description}</p>
                                    ${o.lat&&o.lon?`
                                        <p>Location: ${o.lat}, ${o.lon}</p>
                                    `:""}
                                    <p>Saved: ${new Date(o.savedAt).toLocaleDateString()}</p>
                                    <button class="btn delete-report" data-id="${o.id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </article>
                        `).join("")}
                    </div>
                `}
            </section>
        `,this.appElement.querySelectorAll(".delete-report").forEach(o=>{o.addEventListener("click",async()=>{const r=o.dataset.id;try{await l.deleteReport(r);const s=await l.getSavedReports();this.showSuccess("Laporan berhasil dihapus"),this.renderSavedReports(s)}catch(s){console.error("Error deleting report:",s),this.showError("Gagal menghapus laporan")}})})}}class b{constructor(e,t){this.model=e,this.view=t,this.notificationEnabled=!1,this.initializeNotifications()}async initializeNotifications(){if("serviceWorker"in navigator)try{const t=await(await navigator.serviceWorker.ready).pushManager.getSubscription(),o=localStorage.getItem("notificationsEnabled")==="true";this.notificationEnabled=t!==null&&o,this.setupNotificationToggle()}catch(e){console.error("Error initializing notifications:",e),this.notificationEnabled=!1,this.setupNotificationToggle()}else console.warn("Service workers are not supported in this browser"),this.notificationEnabled=!1,this.setupNotificationToggle()}setupNotificationToggle(){const e=document.getElementById("notification-toggle"),t=document.getElementById("notification-status");e&&t&&(this.updateNotificationStatus(),e.addEventListener("click",async o=>{if(o.preventDefault(),this.notificationEnabled)try{const s=await(await navigator.serviceWorker.ready).pushManager.getSubscription();s&&(await s.unsubscribe(),await this.model.unsubscribeFromNotifications(s.endpoint)),this.notificationEnabled=!1,this.updateNotificationStatus()}catch(r){console.error("Error disabling notifications:",r),this.view.showError("Failed to disable notifications")}else try{const s=await(await navigator.serviceWorker.ready).pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"});await this.model.subscribeToNotifications({endpoint:s.endpoint,keys:{p256dh:btoa(String.fromCharCode.apply(null,new Uint8Array(s.getKey("p256dh")))),auth:btoa(String.fromCharCode.apply(null,new Uint8Array(s.getKey("auth"))))}}),this.notificationEnabled=!0,this.updateNotificationStatus()}catch(r){console.error("Error enabling notifications:",r),this.view.showError("Failed to enable notifications")}}))}updateNotificationStatus(){const e=document.getElementById("notification-status"),t=document.querySelector("#notification-toggle i");e&&(e.textContent=this.notificationEnabled?"Notifikasi Hidup":"Notifikasi Mati"),t&&(t.className=this.notificationEnabled?"fas fa-bell":"fas fa-bell-slash"),localStorage.setItem("notificationsEnabled",String(this.notificationEnabled))}async handleRoute(e){switch(e){case"#/home":this.view.renderHome(),this.setupAuthButtons();break;case"#/login":this.view.renderLogin(),this.setupLoginForm();break;case"#/register":this.view.renderRegister(),this.setupRegisterForm();break;case"#/stories":await this.handleStories();break;case"#/add-story":this.handleAddStory();break;case"#/add-story-guest":this.handleAddStory(!0);break;case"#/saved-reports":this.handleSavedReports();break;default:window.location.hash="#/home"}}setupAuthButtons(){const e=document.getElementById("login-btn"),t=document.getElementById("register-btn"),o=document.getElementById("logout-btn");e&&e.addEventListener("click",()=>{window.location.hash="#/login"}),t&&t.addEventListener("click",()=>{window.location.hash="#/register"}),o&&o.addEventListener("click",()=>{this.model.logout(),window.location.hash="#/home"})}setupLoginForm(){const e=document.getElementById("login-form");e&&e.addEventListener("submit",async t=>{t.preventDefault();const o=new FormData(e),r={email:o.get("email"),password:o.get("password")};try{const s=await this.model.login(r);if(s.error)this.view.showError(s.message||"Login failed");else{try{const i=await this.view.registerServiceWorker();i&&await this.model.subscribeToNotifications(i)}catch(i){console.error("Failed to subscribe to notifications:",i)}this.view.showSuccess("Login successful!"),setTimeout(()=>{window.location.hash="#/stories"},1e3)}}catch(s){this.view.showError("Login failed: "+s.message)}})}setupRegisterForm(){const e=document.getElementById("register-form");e&&e.addEventListener("submit",async t=>{t.preventDefault();const o=new FormData(e),r={name:o.get("name"),email:o.get("email"),password:o.get("password")};try{const s=await this.model.register(r);s.error?this.view.showError(s.message):(this.view.showSuccess("Registration successful! Please login."),window.location.hash="#/login")}catch{this.view.showError("Registration failed")}})}async handleStories(){try{const e=await this.model.getStories();this.view.renderStories(e),this.setupStoryButtons(),this.setupDetailButtons()}catch(e){e.message.includes("Session expired")||e.message.includes("401")?(this.model.logout(),this.view.showError("Session expired. Please login again."),setTimeout(()=>{window.location.hash="#/login"},1e3)):this.view.showError(e.message||"Failed to load stories")}}setupStoryButtons(){const e=document.getElementById("add-story-btn"),t=document.getElementById("add-story-guest-btn");e&&e.addEventListener("click",()=>{window.location.hash="#/add-story"}),t&&t.addEventListener("click",()=>{window.location.hash="#/add-story-guest"})}setupDetailButtons(){document.querySelectorAll(".view-details").forEach(t=>{t.addEventListener("click",async()=>{const o=t.dataset.id;try{const r=await this.model.getStoryById(o);r?this.view.renderStoryDetail(r):this.view.showError("Story not found")}catch{this.view.showError("Failed to load story details")}})})}handleAddStory(e=!1){this.view.renderAddStory(e),this.setupStoryForm(e)}setupStoryForm(e){const t=document.getElementById("story-form");t&&t.addEventListener("submit",async o=>{o.preventDefault();const r=new FormData(t),s={description:r.get("description"),photo:r.get("photo"),lat:r.get("lat"),lon:r.get("lon")};try{const i=e?await this.model.addStoryAsGuest(s):await this.model.addStory(s);if(i.error)this.view.showError(i.message);else if(this.view.showSuccess("Story added successfully!"),this.notificationEnabled)try{await(await navigator.serviceWorker.ready).showNotification("Story berhasil dibuat",{body:`Anda telah membuat story baru dengan deskripsi: ${s.description}`,icon:"./images/logo.png",badge:"./favicon.png",data:{url:"/stories"}})}catch(a){console.error("Error sending notification:",a)}}catch{this.view.showError("Failed to add story")}})}async handleSavedReports(){try{await this.view.renderSavedReports()}catch(e){console.error("Error handling saved reports:",e),this.view.showError("Gagal memuat laporan tersimpan")}}}"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw-new.js",{scope:"/"}).then(n=>{console.log("ServiceWorker registration successful with scope: ",n.scope),n.addEventListener("updatefound",()=>{const e=n.installing;console.log("New service worker found:",e),e.addEventListener("statechange",()=>{console.log("Service worker state changed to:",e.state)})}),n.waiting&&console.log("Service worker waiting to activate"),n.active&&console.log("Service worker active")}).catch(n=>{console.error("ServiceWorker registration failed: ",n)}),navigator.serviceWorker.addEventListener("controllerchange",()=>{console.log("Controller changed, reloading page..."),window.location.reload()})});let m=!1;navigator.serviceWorker.addEventListener("controllerchange",()=>{m||(window.location.reload(),m=!0)});class y{constructor(){this.model=new g,this.view=new w,this.presenter=new b(this.model,this.view),this.setupRouter(),this.setupViewTransitions(),this.setupSkipToContent(),this.setupSaveReportHandler(),l.init().catch(console.error)}setupSaveReportHandler(){document.addEventListener("saveReport",async e=>{try{const t=e.detail,o=await l.saveReport(t);console.log("Report saved with ID:",o);const r=new CustomEvent("reportSaved",{detail:{...t,id:o}});document.dispatchEvent(r)}catch(t){console.error("Failed to save report:",t);const o=new CustomEvent("reportSaveError",{detail:{error:t.message||"Failed to save report"}});document.dispatchEvent(o)}})}setupSkipToContent(){const e=document.querySelector("#main-content");document.querySelector(".skip-link").addEventListener("click",function(o){o.preventDefault(),o.stopPropagation(),e.focus(),e.scrollIntoView({behavior:"smooth"})})}setupRouter(){window.addEventListener("hashchange",()=>{const e=window.location.hash||"#/home";this.presenter.handleRoute(e)}),window.dispatchEvent(new Event("hashchange"))}setupViewTransitions(){document.startViewTransition&&document.addEventListener("click",e=>{const t=e.target.closest("a");if(!t)return;const o=t.getAttribute("href");o.startsWith("#")&&(e.preventDefault(),document.startViewTransition(()=>{window.location.hash=o}))})}}new y;
