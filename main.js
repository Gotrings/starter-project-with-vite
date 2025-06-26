(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const s of r.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&o(s)}).observe(document,{childList:!0,subtree:!0});function e(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(i){if(i.ep)return;i.ep=!0;const r=e(i);fetch(i.href,r)}})();class u{constructor(){this.baseUrl="https://story-api.dicoding.dev/v1",this.token=localStorage.getItem("token")}setToken(t){this.token=t,t?localStorage.setItem("token",t):localStorage.removeItem("token")}async register(t){try{return await(await fetch(`${this.baseUrl}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json()}catch(e){throw console.error("Error registering:",e),e}}async login(t){var e;try{const i=await(await fetch(`${this.baseUrl}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json();return!i.error&&((e=i.loginResult)!=null&&e.token)&&this.setToken(i.loginResult.token),i}catch(o){throw console.error("Error logging in:",o),o}}logout(){this.setToken(null)}async getStories(t=1,e=10,o=0){try{const i={};this.token&&(i.Authorization=`Bearer ${this.token}`);const r=await fetch(`${this.baseUrl}/stories?page=${t}&size=${e}&location=${o}`,{headers:i});if(r.status===401)throw this.setToken(null),new Error("Session expired. Please login again.");if(!r.ok)throw new Error(`HTTP error! status: ${r.status}`);const s=await r.json();if(s.error)throw new Error(s.message);try{localStorage.setItem("cachedStories",JSON.stringify(s.listStory))}catch(a){console.warn("Gagal menyimpan stories ke cache:",a)}return s.listStory}catch(i){console.error("Error fetching stories:",i);const r=localStorage.getItem("cachedStories");if(r)try{return JSON.parse(r)}catch{throw i}throw i}}async addStory(t){try{const e=new FormData;e.append("description",t.description),e.append("photo",t.photo),t.lat&&e.append("lat",t.lat),t.lon&&e.append("lon",t.lon);const o={};return this.token&&(o.Authorization=`Bearer ${this.token}`),await(await fetch(`${this.baseUrl}/stories`,{method:"POST",headers:o,body:e})).json()}catch(e){throw console.error("Error adding story:",e),e}}async addStoryAsGuest(t){try{const e=new FormData;return e.append("description",t.description),e.append("photo",t.photo),t.lat&&e.append("lat",t.lat),t.lon&&e.append("lon",t.lon),await(await fetch(`${this.baseUrl}/stories/guest`,{method:"POST",body:e})).json()}catch(e){throw console.error("Error adding story as guest:",e),e}}async subscribeToNotifications(t){try{const o=await(await fetch(`${this.baseUrl}/notifications/subscribe`,{method:"POST",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:t.endpoint,keys:{p256dh:t.keys.p256dh,auth:t.keys.auth}})})).json();if(o.error)throw new Error(o.message);return o}catch(e){throw console.error("Error subscribing to notifications:",e),e}}async unsubscribeFromNotifications(t){try{const o=await(await fetch(`${this.baseUrl}/notifications/subscribe`,{method:"DELETE",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:t})})).json();if(o.error)throw new Error(o.message);return o}catch(e){throw console.error("Error unsubscribing from notifications:",e),e}}async getStoryById(t){try{const e={};this.token&&(e.Authorization=`Bearer ${this.token}`);const o=await fetch(`${this.baseUrl}/stories/${t}`,{headers:e});if(!o.ok)throw new Error(`HTTP error! status: ${o.status}`);const i=await o.json();if(i.error)throw new Error(i.message);return i.story}catch(e){throw console.error("Error fetching story:",e),e}}}class g{constructor(){this.appElement=document.getElementById("app"),this.map=null,this.markers=null,this.cameraStream=null,this.setupNotificationPermission(),this.setupNotificationContainer()}setupNotificationContainer(){const t=document.createElement("div");t.id="notification-container",t.className="notification-container",document.body.appendChild(t)}showNotification(t,e="info"){const o=document.getElementById("notification-container"),i=document.createElement("div");i.className=`notification notification-${e}`,i.textContent=t,o.appendChild(i),setTimeout(()=>{i.classList.add("fade-out"),setTimeout(()=>{i.remove()},300)},3e3)}showError(t){this.showNotification(t,"error")}showSuccess(t){this.showNotification(t,"success")}async setupNotificationPermission(){"Notification"in window&&"serviceWorker"in navigator&&await Notification.requestPermission()==="granted"&&this.registerServiceWorker()}async registerServiceWorker(){try{const o=await navigator.serviceWorker.register("/starter-project-with-vite/sw.js");if(localStorage.getItem("notificationsEnabled")==="true"){const r=await o.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"});r&&await new u().subscribeToNotifications({endpoint:r.endpoint,keys:{p256dh:btoa(String.fromCharCode.apply(null,new Uint8Array(r.getKey("p256dh")))),auth:btoa(String.fromCharCode.apply(null,new Uint8Array(r.getKey("auth"))))}})}return o}catch(t){console.error("Error registering service worker:",t)}}async sendNotification(t,e){try{await(await navigator.serviceWorker.ready).showNotification(t,e)}catch(o){console.error("Error sending notification:",o)}}renderHome(){const t=localStorage.getItem("token")!==null;this.appElement.innerHTML=`
            <section class="hero">
                <h2>Welcome to Story Documentation</h2>
                <p>Share your stories with the world!</p>
                ${t?`
                    <button id="logout-btn" class="btn"><i class="fas fa-sign-out-alt"></i> Logout</button>
                `:`
                    <div class="auth-buttons">
                        <button id="login-btn" class="btn"><i class="fas fa-sign-in-alt"></i> Login</button>
                        <button id="register-btn" class="btn"><i class="fas fa-user-plus"></i> Register</button>
                    </div>
                `}
            </section>
        `,t&&document.getElementById("logout-btn").addEventListener("click",()=>{localStorage.removeItem("token"),this.showSuccess("Logged out successfully!"),setTimeout(()=>{window.location.reload()},1e3)})}renderLogin(){this.appElement.innerHTML=`
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
        `}renderStories(t){const e=localStorage.getItem("token")!==null;this.appElement.innerHTML=`
            <section class="stories">
                <h2>Stories</h2>
                <div class="stories-grid">
                    ${t.map(o=>this.createStoryCard(o)).join("")}
                </div>
                <div id="map" class="map-container"></div>
                ${e?`
                    <button id="add-story-btn" class="btn">Add New Story</button>
                `:`
                    <button id="add-story-guest-btn" class="btn">Add Story as Guest</button>
                `}
            </section>
        `,this.initializeMap(t)}createStoryCard(t){return`
            <article class="story-card">
                <img src="${t.photoUrl}" alt="${t.description}" loading="lazy">
                <div class="story-content">
                    <h3>${t.name}</h3>
                    <p>${t.description}</p>
                    ${t.lat&&t.lon?`
                        <p>Location: ${t.lat}, ${t.lon}</p>
                    `:""}
                    <p>Created: ${new Date(t.createdAt).toLocaleDateString()}</p>
                    <button class="btn view-details" data-id="${t.id}">
                        <i class="fas fa-info-circle"></i> Selengkapnya
                    </button>
                </div>
            </article>
        `}renderStoryDetail(t){this.appElement.innerHTML=`
            <section class="story-detail">
                <button class="btn back-btn" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i> Kembali
                </button>
                <div class="detail-content">
                    <h2>${t.name}</h2>
                    <div class="detail-info">
                        <p><i class="fas fa-user"></i> Pembuat: ${t.name}</p>
                        <p><i class="fas fa-calendar"></i> Tanggal Dibuat: ${new Date(t.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div class="detail-image">
                        <img src="${t.photoUrl}" alt="${t.description}">
                    </div>
                    <div class="detail-description">
                        <h3>Deskripsi</h3>
                        <p>${t.description}</p>
                    </div>
                    ${t.lat&&t.lon?`
                        <div class="detail-location">
                            <h3>Lokasi</h3>
                            <div id="detail-map" class="map-container"></div>
                            <div class="coordinates">
                                <p><i class="fas fa-map-marker-alt"></i> Latitude: ${t.lat}</p>
                                <p><i class="fas fa-map-marker-alt"></i> Longitude: ${t.lon}</p>
                            </div>
                        </div>
                    `:""}
                    <button class="btn save-report" data-id="${t.id}">
                        <i class="fas fa-save"></i> Simpan Laporan
                    </button>
                </div>
            </section>
        `,t.lat&&t.lon&&this.initializeDetailMap(t);const e=this.appElement.querySelector(".save-report");e&&e.addEventListener("click",()=>{this.saveReport(t)})}initializeDetailMap(t){const e=L.map("detail-map").setView([t.lat,t.lon],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}).addTo(e),L.marker([t.lat,t.lon]).addTo(e).bindPopup(`
                <div class="story-popup">
                    <h3>${t.name}</h3>
                    <p>${t.description}</p>
                </div>
            `)}saveReport(t){const e=JSON.parse(localStorage.getItem("savedReports")||"[]");if(e.some(r=>r.id===t.id)){this.showError("Laporan sudah tersimpan");return}const i={...t,savedAt:new Date().toISOString()};e.push(i),localStorage.setItem("savedReports",JSON.stringify(e)),this.showSuccess("Laporan berhasil disimpan")}renderAddStory(t=!1){this.appElement.innerHTML=`
            <section class="add-story">
                <h2>${t?"Add Story as Guest":"Add New Story"}</h2>
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
        `,this.initializeLocationMap(),this.setupCameraHandlers(),this.setupStoryForm()}setupCameraHandlers(){const t=document.getElementById("start-camera"),e=document.getElementById("capture-photo"),o=document.getElementById("camera-preview"),i=document.getElementById("photo-canvas"),r=document.getElementById("photo"),s=document.getElementById("photo-preview");t.addEventListener("click",async()=>{try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),o.srcObject=this.cameraStream,o.style.display="block",t.style.display="none",e.style.display="inline-block",s.style.display="none"}catch(a){this.showError("Failed to access camera"),console.error("Camera error:",a)}}),e.addEventListener("click",()=>{if(!this.cameraStream)return;const a=i.getContext("2d");i.width=o.videoWidth,i.height=o.videoHeight,a.drawImage(o,0,0),i.toBlob(c=>{const m=new File([c],"photo.jpg",{type:"image/jpeg"}),d=new DataTransfer;d.items.add(m),r.files=d.files,this.stopCameraStream();const p=URL.createObjectURL(c);s.src=p,s.style.display="block",s.onload=()=>{URL.revokeObjectURL(p)},this.showSuccess("Photo captured successfully!")},"image/jpeg",.95)}),window.addEventListener("hashchange",()=>{this.stopCameraStream()})}stopCameraStream(){if(this.cameraStream){this.cameraStream.getTracks().forEach(i=>i.stop()),this.cameraStream=null;const t=document.getElementById("camera-preview");t&&(t.srcObject=null,t.style.display="none");const e=document.getElementById("start-camera"),o=document.getElementById("capture-photo");e&&(e.style.display="inline-block"),o&&(o.style.display="none")}}initializeMap(t){this.map&&(this.map.remove(),this.map=null),this.map=L.map("map").setView([0,0],2);const e={OpenStreetMap:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}),Satellite:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),Dark:L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© CARTO"})};e.OpenStreetMap.addTo(this.map),L.control.layers(e).addTo(this.map),this.markers&&this.markers.clearLayers(),this.markers=L.markerClusterGroup(),t.forEach(o=>{if(o.lat&&o.lon){const i=L.marker([o.lat,o.lon]).bindPopup(`
                        <div class="story-popup">
                            <img src="${o.photoUrl}" alt="${o.description}" style="max-width: 200px; border-radius: 4px;">
                            <h3>${o.name}</h3>
                            <p>${o.description}</p>
                        </div>
                    `);this.markers.addLayer(i)}}),this.map.addLayer(this.markers),this.markers.getLayers().length>0&&this.map.fitBounds(this.markers.getBounds())}initializeLocationMap(){const t=document.getElementById("location-map");t._leaflet_id&&L.map(t).remove();const e=L.map("location-map").setView([0,0],2),o={OpenStreetMap:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}),Satellite:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),Dark:L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© CARTO"})};o.OpenStreetMap.addTo(e),L.control.layers(o).addTo(e);let i=null;const r=document.getElementById("coordinates-display");e.on("click",s=>{i&&e.removeLayer(i),i=L.marker(s.latlng).addTo(e),document.getElementById("lat").value=s.latlng.lat,document.getElementById("lon").value=s.latlng.lng,r.textContent=`Latitude: ${s.latlng.lat.toFixed(6)}, Longitude: ${s.latlng.lng.toFixed(6)}`})}setupStoryForm(){const t=document.getElementById("story-form");t.addEventListener("submit",async e=>{e.preventDefault();const o=new FormData(t);o.get("description"),o.get("photo"),o.get("lat"),o.get("lon");try{const i=t.querySelector('button[type="submit"]');i.disabled=!0,i.textContent="Submitting...",await new Promise(r=>setTimeout(r,1e3)),this.showSuccess("Story submitted successfully!"),window.location.hash="#/stories"}catch(i){this.showError("Failed to submit story"),console.error("Error submitting story:",i)}finally{const i=t.querySelector('button[type="submit"]');i.disabled=!1,i.textContent="Submit Story"}})}renderSavedReports(t){this.appElement.innerHTML=`
            <section class="saved-reports">
                <h2>Saved Reports</h2>
                ${t.length===0?`
                    <p class="no-reports">No saved reports yet.</p>
                `:`
                    <div class="reports-grid">
                        ${t.map(o=>`
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
        `,this.appElement.querySelectorAll(".delete-report").forEach(o=>{o.addEventListener("click",()=>{const i=o.dataset.id,s=JSON.parse(localStorage.getItem("savedReports")||"[]").filter(a=>a.id!==i);localStorage.setItem("savedReports",JSON.stringify(s)),this.showSuccess("Report deleted successfully"),this.renderSavedReports(s)})})}}class f{constructor(t,e){this.model=t,this.view=e,this.notificationEnabled=!1,this.initializeNotifications()}async initializeNotifications(){if("serviceWorker"in navigator)try{const e=await(await navigator.serviceWorker.ready).pushManager.getSubscription(),o=localStorage.getItem("notificationsEnabled")==="true";this.notificationEnabled=e!==null&&o,this.setupNotificationToggle()}catch(t){console.error("Error initializing notifications:",t),this.notificationEnabled=!1,this.setupNotificationToggle()}else console.warn("Service workers are not supported in this browser"),this.notificationEnabled=!1,this.setupNotificationToggle()}setupNotificationToggle(){const t=document.getElementById("notification-toggle"),e=document.getElementById("notification-status");t&&e&&(this.updateNotificationStatus(),t.addEventListener("click",async o=>{if(o.preventDefault(),this.notificationEnabled)try{const r=await(await navigator.serviceWorker.ready).pushManager.getSubscription();r&&(await r.unsubscribe(),await this.model.unsubscribeFromNotifications(r.endpoint)),this.notificationEnabled=!1,this.updateNotificationStatus()}catch(i){console.error("Error disabling notifications:",i),this.view.showError("Failed to disable notifications")}else try{const r=await(await navigator.serviceWorker.ready).pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"});await this.model.subscribeToNotifications({endpoint:r.endpoint,keys:{p256dh:btoa(String.fromCharCode.apply(null,new Uint8Array(r.getKey("p256dh")))),auth:btoa(String.fromCharCode.apply(null,new Uint8Array(r.getKey("auth"))))}}),this.notificationEnabled=!0,this.updateNotificationStatus()}catch(i){console.error("Error enabling notifications:",i),this.view.showError("Failed to enable notifications")}}))}updateNotificationStatus(){const t=document.getElementById("notification-status"),e=document.querySelector("#notification-toggle i");t&&(t.textContent=this.notificationEnabled?"Notifikasi Hidup":"Notifikasi Mati"),e&&(e.className=this.notificationEnabled?"fas fa-bell":"fas fa-bell-slash"),localStorage.setItem("notificationsEnabled",String(this.notificationEnabled))}async handleRoute(t){switch(t){case"#/home":this.view.renderHome(),this.setupAuthButtons();break;case"#/login":this.view.renderLogin(),this.setupLoginForm();break;case"#/register":this.view.renderRegister(),this.setupRegisterForm();break;case"#/stories":await this.handleStories();break;case"#/add-story":this.handleAddStory();break;case"#/add-story-guest":this.handleAddStory(!0);break;case"#/saved-reports":this.handleSavedReports();break;default:window.location.hash="#/home"}}setupAuthButtons(){const t=document.getElementById("login-btn"),e=document.getElementById("register-btn"),o=document.getElementById("logout-btn");t&&t.addEventListener("click",()=>{window.location.hash="#/login"}),e&&e.addEventListener("click",()=>{window.location.hash="#/register"}),o&&o.addEventListener("click",()=>{this.model.logout(),window.location.hash="#/home"})}setupLoginForm(){const t=document.getElementById("login-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();const o=new FormData(t),i={email:o.get("email"),password:o.get("password")};try{const r=await this.model.login(i);if(r.error)this.view.showError(r.message||"Login failed");else{try{const s=await this.view.registerServiceWorker();s&&await this.model.subscribeToNotifications(s)}catch(s){console.error("Failed to subscribe to notifications:",s)}this.view.showSuccess("Login successful!"),setTimeout(()=>{window.location.hash="#/stories"},1e3)}}catch(r){this.view.showError("Login failed: "+r.message)}})}setupRegisterForm(){const t=document.getElementById("register-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();const o=new FormData(t),i={name:o.get("name"),email:o.get("email"),password:o.get("password")};try{const r=await this.model.register(i);r.error?this.view.showError(r.message):(this.view.showSuccess("Registration successful! Please login."),window.location.hash="#/login")}catch{this.view.showError("Registration failed")}})}async handleStories(){try{const t=await this.model.getStories();this.view.renderStories(t),this.setupStoryButtons(),this.setupDetailButtons()}catch(t){t.message.includes("Session expired")||t.message.includes("401")?(this.model.logout(),this.view.showError("Session expired. Please login again."),setTimeout(()=>{window.location.hash="#/login"},1e3)):this.view.showError(t.message||"Failed to load stories")}}setupStoryButtons(){const t=document.getElementById("add-story-btn"),e=document.getElementById("add-story-guest-btn");t&&t.addEventListener("click",()=>{window.location.hash="#/add-story"}),e&&e.addEventListener("click",()=>{window.location.hash="#/add-story-guest"})}setupDetailButtons(){document.querySelectorAll(".view-details").forEach(e=>{e.addEventListener("click",async()=>{const o=e.dataset.id;try{const i=await this.model.getStoryById(o);i?this.view.renderStoryDetail(i):this.view.showError("Story not found")}catch{this.view.showError("Failed to load story details")}})})}handleAddStory(t=!1){this.view.renderAddStory(t),this.setupStoryForm(t)}setupStoryForm(t){const e=document.getElementById("story-form");e&&e.addEventListener("submit",async o=>{o.preventDefault();const i=new FormData(e),r={description:i.get("description"),photo:i.get("photo"),lat:i.get("lat"),lon:i.get("lon")};try{const s=t?await this.model.addStoryAsGuest(r):await this.model.addStory(r);if(s.error)this.view.showError(s.message);else if(this.view.showSuccess("Story added successfully!"),this.notificationEnabled)try{await(await navigator.serviceWorker.ready).showNotification("Story berhasil dibuat",{body:`Anda telah membuat story baru dengan deskripsi: ${r.description}`,icon:"./images/logo.png",badge:"./favicon.png",data:{url:"/stories"}})}catch(a){console.error("Error sending notification:",a)}}catch{this.view.showError("Failed to add story")}})}handleSavedReports(){const t=JSON.parse(localStorage.getItem("savedReports")||"[]");this.view.renderSavedReports(t)}}class w{constructor(){this.dbName="saved-reports",this.dbVersion=1,this.db=null}async init(){return new Promise((t,e)=>{const o=indexedDB.open(this.dbName,this.dbVersion);o.onerror=i=>{console.error("Error opening database:",i.target.error),e("Error opening database")},o.onsuccess=i=>{this.db=i.target.result,console.log("Database initialized successfully"),t(this.db)},o.onupgradeneeded=i=>{const r=i.target.result;if(!r.objectStoreNames.contains("reports")){const s=r.createObjectStore("reports",{keyPath:"id",autoIncrement:!0});s.createIndex("timestamp","timestamp",{unique:!1}),s.createIndex("title","title",{unique:!1}),console.log("Database and object store created")}}})}async saveReport(t){return this.db||await this.init(),new Promise((e,o)=>{const r=this.db.transaction(["reports"],"readwrite").objectStore("reports"),s={...t,timestamp:new Date().toISOString()},a=r.add(s);a.onsuccess=()=>{console.log("Report saved successfully"),e(a.result)},a.onerror=c=>{console.error("Error saving report:",c.target.error),o("Error saving report")}})}async getAllReports(){return this.db||await this.init(),new Promise((t,e)=>{const r=this.db.transaction(["reports"],"readonly").objectStore("reports").getAll();r.onsuccess=()=>{t(r.result)},r.onerror=s=>{console.error("Error getting reports:",s.target.error),e("Error getting reports")}})}async deleteReport(t){return this.db||await this.init(),new Promise((e,o)=>{const s=this.db.transaction(["reports"],"readwrite").objectStore("reports").delete(t);s.onsuccess=()=>{console.log("Report deleted successfully"),e(!0)},s.onerror=a=>{console.error("Error deleting report:",a.target.error),o("Error deleting report")}})}}const l=new w;l.init().catch(console.error);"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw-new.js",{scope:"/"}).then(n=>{console.log("ServiceWorker registration successful with scope: ",n.scope),n.addEventListener("updatefound",()=>{const t=n.installing;console.log("New service worker found:",t),t.addEventListener("statechange",()=>{console.log("Service worker state changed to:",t.state)})}),n.waiting&&console.log("Service worker waiting to activate"),n.active&&console.log("Service worker active")}).catch(n=>{console.error("ServiceWorker registration failed: ",n)}),navigator.serviceWorker.addEventListener("controllerchange",()=>{console.log("Controller changed, reloading page..."),window.location.reload()})});let h=!1;navigator.serviceWorker.addEventListener("controllerchange",()=>{h||(window.location.reload(),h=!0)});class y{constructor(){this.model=new u,this.view=new g,this.presenter=new f(this.model,this.view),this.setupRouter(),this.setupViewTransitions(),this.setupSkipToContent(),this.setupSaveReportHandler(),l.init().catch(console.error)}setupSaveReportHandler(){document.addEventListener("saveReport",async t=>{try{const e=t.detail,o=await l.saveReport(e);console.log("Report saved with ID:",o);const i=new CustomEvent("reportSaved",{detail:{...e,id:o}});document.dispatchEvent(i)}catch(e){console.error("Failed to save report:",e);const o=new CustomEvent("reportSaveError",{detail:{error:e.message||"Failed to save report"}});document.dispatchEvent(o)}})}setupSkipToContent(){const t=document.querySelector("#main-content");document.querySelector(".skip-link").addEventListener("click",function(o){o.preventDefault(),o.stopPropagation(),t.focus(),t.scrollIntoView({behavior:"smooth"})})}setupRouter(){window.addEventListener("hashchange",()=>{const t=window.location.hash||"#/home";this.presenter.handleRoute(t)}),window.dispatchEvent(new Event("hashchange"))}setupViewTransitions(){document.startViewTransition&&document.addEventListener("click",t=>{const e=t.target.closest("a");if(!e)return;const o=e.getAttribute("href");o.startsWith("#")&&(t.preventDefault(),document.startViewTransition(()=>{window.location.hash=o}))})}}new y;
