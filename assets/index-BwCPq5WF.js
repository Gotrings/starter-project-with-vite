(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&o(r)}).observe(document,{childList:!0,subtree:!0});function e(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function o(i){if(i.ep)return;i.ep=!0;const s=e(i);fetch(i.href,s)}})();class p{constructor(){this.baseUrl="https://story-api.dicoding.dev/v1",this.token=localStorage.getItem("token")}setToken(t){this.token=t,t?localStorage.setItem("token",t):localStorage.removeItem("token")}async register(t){try{return await(await fetch(`${this.baseUrl}/register`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json()}catch(e){throw console.error("Error registering:",e),e}}async login(t){var e;try{const i=await(await fetch(`${this.baseUrl}/login`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json();return!i.error&&((e=i.loginResult)!=null&&e.token)&&this.setToken(i.loginResult.token),i}catch(o){throw console.error("Error logging in:",o),o}}logout(){this.setToken(null)}async getStories(t=1,e=10,o=0){try{const i={};this.token&&(i.Authorization=`Bearer ${this.token}`);const s=await fetch(`${this.baseUrl}/stories?page=${t}&size=${e}&location=${o}`,{headers:i});if(s.status===401)throw this.setToken(null),new Error("Session expired. Please login again.");if(!s.ok)throw new Error(`HTTP error! status: ${s.status}`);const r=await s.json();if(r.error)throw new Error(r.message);return r.listStory}catch(i){throw console.error("Error fetching stories:",i),i}}async addStory(t){try{const e=new FormData;e.append("description",t.description),e.append("photo",t.photo),t.lat&&e.append("lat",t.lat),t.lon&&e.append("lon",t.lon);const o={};return this.token&&(o.Authorization=`Bearer ${this.token}`),await(await fetch(`${this.baseUrl}/stories`,{method:"POST",headers:o,body:e})).json()}catch(e){throw console.error("Error adding story:",e),e}}async addStoryAsGuest(t){try{const e=new FormData;return e.append("description",t.description),e.append("photo",t.photo),t.lat&&e.append("lat",t.lat),t.lon&&e.append("lon",t.lon),await(await fetch(`${this.baseUrl}/stories/guest`,{method:"POST",body:e})).json()}catch(e){throw console.error("Error adding story as guest:",e),e}}async subscribeToNotifications(t){try{const o=await(await fetch(`${this.baseUrl}/notifications/subscribe`,{method:"POST",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:t.endpoint,keys:{p256dh:t.keys.p256dh,auth:t.keys.auth}})})).json();if(o.error)throw new Error(o.message);return o}catch(e){throw console.error("Error subscribing to notifications:",e),e}}async unsubscribeFromNotifications(t){try{const o=await(await fetch(`${this.baseUrl}/notifications/subscribe`,{method:"DELETE",headers:{Authorization:`Bearer ${this.token}`,"Content-Type":"application/json"},body:JSON.stringify({endpoint:t})})).json();if(o.error)throw new Error(o.message);return o}catch(e){throw console.error("Error unsubscribing from notifications:",e),e}}async getStoryById(t){try{const e={};this.token&&(e.Authorization=`Bearer ${this.token}`);const o=await fetch(`${this.baseUrl}/stories/${t}`,{headers:e});if(!o.ok)throw new Error(`HTTP error! status: ${o.status}`);const i=await o.json();if(i.error)throw new Error(i.message);return i.story}catch(e){throw console.error("Error fetching story:",e),e}}}class u{constructor(){this.appElement=document.getElementById("app"),this.map=null,this.markers=null,this.cameraStream=null,this.setupNotificationPermission(),this.setupNotificationContainer()}setupNotificationContainer(){const t=document.createElement("div");t.id="notification-container",t.className="notification-container",document.body.appendChild(t)}showNotification(t,e="info"){const o=document.getElementById("notification-container"),i=document.createElement("div");i.className=`notification notification-${e}`,i.textContent=t,o.appendChild(i),setTimeout(()=>{i.classList.add("fade-out"),setTimeout(()=>{i.remove()},300)},3e3)}showError(t){this.showNotification(t,"error")}showSuccess(t){this.showNotification(t,"success")}async setupNotificationPermission(){"Notification"in window&&"serviceWorker"in navigator&&await Notification.requestPermission()==="granted"&&this.registerServiceWorker()}async registerServiceWorker(){try{const t=await navigator.serviceWorker.register("/sw.js");if(localStorage.getItem("notificationsEnabled")==="true"){const o=await t.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"});o&&await new p().subscribeToNotifications({endpoint:o.endpoint,keys:{p256dh:btoa(String.fromCharCode.apply(null,new Uint8Array(o.getKey("p256dh")))),auth:btoa(String.fromCharCode.apply(null,new Uint8Array(o.getKey("auth"))))}})}return t}catch(t){console.error("Error registering service worker:",t)}}async sendNotification(t,e){try{await(await navigator.serviceWorker.ready).showNotification(t,e)}catch(o){console.error("Error sending notification:",o)}}renderHome(){const t=localStorage.getItem("token")!==null;this.appElement.innerHTML=`
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
            `)}saveReport(t){const e=JSON.parse(localStorage.getItem("savedReports")||"[]");if(e.some(s=>s.id===t.id)){this.showError("Laporan sudah tersimpan");return}const i={...t,savedAt:new Date().toISOString()};e.push(i),localStorage.setItem("savedReports",JSON.stringify(e)),this.showSuccess("Laporan berhasil disimpan")}renderAddStory(t=!1){this.appElement.innerHTML=`
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
        `,this.initializeLocationMap(),this.setupCameraHandlers(),this.setupStoryForm()}setupCameraHandlers(){const t=document.getElementById("start-camera"),e=document.getElementById("capture-photo"),o=document.getElementById("camera-preview"),i=document.getElementById("photo-canvas"),s=document.getElementById("photo"),r=document.getElementById("photo-preview");t.addEventListener("click",async()=>{try{this.cameraStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"},audio:!1}),o.srcObject=this.cameraStream,o.style.display="block",t.style.display="none",e.style.display="inline-block",r.style.display="none"}catch(a){this.showError("Failed to access camera"),console.error("Camera error:",a)}}),e.addEventListener("click",()=>{if(!this.cameraStream)return;const a=i.getContext("2d");i.width=o.videoWidth,i.height=o.videoHeight,a.drawImage(o,0,0),i.toBlob(c=>{const h=new File([c],"photo.jpg",{type:"image/jpeg"}),l=new DataTransfer;l.items.add(h),s.files=l.files,this.stopCameraStream();const d=URL.createObjectURL(c);r.src=d,r.style.display="block",r.onload=()=>{URL.revokeObjectURL(d)},this.showSuccess("Photo captured successfully!")},"image/jpeg",.95)}),window.addEventListener("hashchange",()=>{this.stopCameraStream()})}stopCameraStream(){if(this.cameraStream){this.cameraStream.getTracks().forEach(i=>i.stop()),this.cameraStream=null;const t=document.getElementById("camera-preview");t&&(t.srcObject=null,t.style.display="none");const e=document.getElementById("start-camera"),o=document.getElementById("capture-photo");e&&(e.style.display="inline-block"),o&&(o.style.display="none")}}initializeMap(t){this.map&&(this.map.remove(),this.map=null),this.map=L.map("map").setView([0,0],2);const e={OpenStreetMap:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}),Satellite:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),Dark:L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© CARTO"})};e.OpenStreetMap.addTo(this.map),L.control.layers(e).addTo(this.map),this.markers&&this.markers.clearLayers(),this.markers=L.markerClusterGroup(),t.forEach(o=>{if(o.lat&&o.lon){const i=L.marker([o.lat,o.lon]).bindPopup(`
                        <div class="story-popup">
                            <img src="${o.photoUrl}" alt="${o.description}" style="max-width: 200px; border-radius: 4px;">
                            <h3>${o.name}</h3>
                            <p>${o.description}</p>
                        </div>
                    `);this.markers.addLayer(i)}}),this.map.addLayer(this.markers),this.markers.getLayers().length>0&&this.map.fitBounds(this.markers.getBounds())}initializeLocationMap(){const t=document.getElementById("location-map");t._leaflet_id&&L.map(t).remove();const e=L.map("location-map").setView([0,0],2),o={OpenStreetMap:L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"© OpenStreetMap contributors"}),Satellite:L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",{attribution:"© Esri"}),Dark:L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"© CARTO"})};o.OpenStreetMap.addTo(e),L.control.layers(o).addTo(e);let i=null;const s=document.getElementById("coordinates-display");e.on("click",r=>{i&&e.removeLayer(i),i=L.marker(r.latlng).addTo(e),document.getElementById("lat").value=r.latlng.lat,document.getElementById("lon").value=r.latlng.lng,s.textContent=`Latitude: ${r.latlng.lat.toFixed(6)}, Longitude: ${r.latlng.lng.toFixed(6)}`})}setupStoryForm(){const t=document.getElementById("story-form");t.addEventListener("submit",async e=>{e.preventDefault();const o=new FormData(t);o.get("description"),o.get("photo"),o.get("lat"),o.get("lon");try{const i=t.querySelector('button[type="submit"]');i.disabled=!0,i.textContent="Submitting...",await new Promise(s=>setTimeout(s,1e3)),this.showSuccess("Story submitted successfully!"),window.location.hash="#/stories"}catch(i){this.showError("Failed to submit story"),console.error("Error submitting story:",i)}finally{const i=t.querySelector('button[type="submit"]');i.disabled=!1,i.textContent="Submit Story"}})}renderSavedReports(t){this.appElement.innerHTML=`
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
        `,this.appElement.querySelectorAll(".delete-report").forEach(o=>{o.addEventListener("click",()=>{const i=o.dataset.id,r=JSON.parse(localStorage.getItem("savedReports")||"[]").filter(a=>a.id!==i);localStorage.setItem("savedReports",JSON.stringify(r)),this.showSuccess("Report deleted successfully"),this.renderSavedReports(r)})})}}class m{constructor(t,e){this.model=t,this.view=e,this.notificationEnabled=localStorage.getItem("notificationsEnabled")==="true",this.setupNotificationToggle()}setupNotificationToggle(){const t=document.getElementById("notification-toggle"),e=document.getElementById("notification-status");t&&e&&(this.updateNotificationStatus(),t.addEventListener("click",async o=>{if(o.preventDefault(),this.notificationEnabled)try{const s=await(await navigator.serviceWorker.ready).pushManager.getSubscription();s&&(await s.unsubscribe(),await this.model.unsubscribeFromNotifications(s.endpoint)),this.notificationEnabled=!1,localStorage.setItem("notificationsEnabled","false"),this.view.showSuccess("Notifications disabled")}catch(i){console.error("Error disabling notifications:",i),this.view.showError("Failed to disable notifications")}else try{const s=await(await navigator.serviceWorker.ready).pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:"BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk"});await this.model.subscribeToNotifications({endpoint:s.endpoint,keys:{p256dh:btoa(String.fromCharCode.apply(null,new Uint8Array(s.getKey("p256dh")))),auth:btoa(String.fromCharCode.apply(null,new Uint8Array(s.getKey("auth"))))}}),this.notificationEnabled=!0,localStorage.setItem("notificationsEnabled","true"),this.view.showSuccess("Notifications enabled")}catch(i){console.error("Error enabling notifications:",i),this.view.showError("Failed to enable notifications")}this.updateNotificationStatus()}))}updateNotificationStatus(){const t=document.getElementById("notification-status");t&&(t.textContent=this.notificationEnabled?"Notifikasi Hidup":"Notifikasi Mati")}async handleRoute(t){switch(t){case"#/home":this.view.renderHome(),this.setupAuthButtons();break;case"#/login":this.view.renderLogin(),this.setupLoginForm();break;case"#/register":this.view.renderRegister(),this.setupRegisterForm();break;case"#/stories":await this.handleStories();break;case"#/add-story":this.handleAddStory();break;case"#/add-story-guest":this.handleAddStory(!0);break;case"#/saved-reports":this.handleSavedReports();break;default:window.location.hash="#/home"}}setupAuthButtons(){const t=document.getElementById("login-btn"),e=document.getElementById("register-btn"),o=document.getElementById("logout-btn");t&&t.addEventListener("click",()=>{window.location.hash="#/login"}),e&&e.addEventListener("click",()=>{window.location.hash="#/register"}),o&&o.addEventListener("click",()=>{this.model.logout(),window.location.hash="#/home"})}setupLoginForm(){const t=document.getElementById("login-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();const o=new FormData(t),i={email:o.get("email"),password:o.get("password")};try{const s=await this.model.login(i);if(s.error)this.view.showError(s.message||"Login failed");else{try{const r=await this.view.registerServiceWorker();r&&await this.model.subscribeToNotifications(r)}catch(r){console.error("Failed to subscribe to notifications:",r)}this.view.showSuccess("Login successful!"),setTimeout(()=>{window.location.hash="#/stories"},1e3)}}catch(s){this.view.showError("Login failed: "+s.message)}})}setupRegisterForm(){const t=document.getElementById("register-form");t&&t.addEventListener("submit",async e=>{e.preventDefault();const o=new FormData(t),i={name:o.get("name"),email:o.get("email"),password:o.get("password")};try{const s=await this.model.register(i);s.error?this.view.showError(s.message):(this.view.showSuccess("Registration successful! Please login."),window.location.hash="#/login")}catch{this.view.showError("Registration failed")}})}async handleStories(){try{const t=await this.model.getStories();this.view.renderStories(t),this.setupStoryButtons(),this.setupDetailButtons()}catch(t){t.message.includes("Session expired")||t.message.includes("401")?(this.model.logout(),this.view.showError("Session expired. Please login again."),setTimeout(()=>{window.location.hash="#/login"},1e3)):this.view.showError(t.message||"Failed to load stories")}}setupStoryButtons(){const t=document.getElementById("add-story-btn"),e=document.getElementById("add-story-guest-btn");t&&t.addEventListener("click",()=>{window.location.hash="#/add-story"}),e&&e.addEventListener("click",()=>{window.location.hash="#/add-story-guest"})}setupDetailButtons(){document.querySelectorAll(".view-details").forEach(e=>{e.addEventListener("click",async()=>{const o=e.dataset.id;try{const i=await this.model.getStoryById(o);i?this.view.renderStoryDetail(i):this.view.showError("Story not found")}catch{this.view.showError("Failed to load story details")}})})}handleAddStory(t=!1){this.view.renderAddStory(t),this.setupStoryForm(t)}setupStoryForm(t){const e=document.getElementById("story-form");e&&e.addEventListener("submit",async o=>{o.preventDefault();const i=new FormData(e),s={description:i.get("description"),photo:i.get("photo"),lat:i.get("lat"),lon:i.get("lon")};try{const r=t?await this.model.addStoryAsGuest(s):await this.model.addStory(s);if(r.error)this.view.showError(r.message);else if(this.view.showSuccess("Story added successfully!"),this.notificationEnabled)try{await(await navigator.serviceWorker.ready).showNotification("Story berhasil dibuat",{body:`Anda telah membuat story baru dengan deskripsi: ${s.description}`,icon:"./images/logo.png",badge:"./favicon.png",data:{url:"/stories"}})}catch(a){console.error("Error sending notification:",a)}}catch{this.view.showError("Failed to add story")}})}handleSavedReports(){const t=JSON.parse(localStorage.getItem("savedReports")||"[]");this.view.renderSavedReports(t)}}class g{constructor(){this.model=new p,this.view=new u,this.presenter=new m(this.model,this.view),this.setupRouter(),this.setupViewTransitions(),this.setupSkipToContent()}setupSkipToContent(){const t=document.querySelector("#main-content");document.querySelector(".skip-link").addEventListener("click",function(o){o.preventDefault(),o.stopPropagation(),t.focus(),t.scrollIntoView({behavior:"smooth"})})}setupRouter(){window.addEventListener("hashchange",()=>{const t=window.location.hash||"#/home";this.presenter.handleRoute(t)}),window.dispatchEvent(new Event("hashchange"))}setupViewTransitions(){document.startViewTransition&&document.addEventListener("click",t=>{const e=t.target.closest("a");if(!e)return;const o=e.getAttribute("href");o.startsWith("#")&&(t.preventDefault(),document.startViewTransition(()=>{window.location.hash=o}))})}}new g;
