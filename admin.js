console.log('Admin Script Loaded');

(function () {
    let isAdminOpen = false;
    let currentImages = [];

    // --- CONFIG ---
    const MAX_IMAGE_WIDTH = 800;
    const JPEG_QUALITY = 0.7;

    // --- UI ELEMENTS ---
    const createAdminUI = () => {
        const adminOverlay = document.createElement('div');
        adminOverlay.id = 'admin-overlay';
        adminOverlay.style.display = 'none';
        adminOverlay.innerHTML = `
      <div class="admin-panel">
        <div class="admin-header">
          <h2>Gallery Admin</h2>
          <button id="admin-close">X</button>
        </div>
        
        <div id="admin-login-view">
          <p>Enter Password to Manage Images</p>
          <input type="password" id="admin-password" placeholder="Password" />
          <button id="admin-login-btn">Login</button>
          <p id="login-error" style="color:red; display:none;">Incorrect Password</p>
        </div>

        <div id="admin-dashboard-view" style="display:none;">
          <div class="admin-controls">
            <label class="upload-btn-wrapper">
              <button class="btn">Add Images</button>
              <input type="file" id="admin-file-input" multiple accept="image/*">
            </label>
            <span id="admin-count">0 Images</span>
            <button id="admin-save-btn" class="primary-btn">💾 Save Changes (Permanent)</button>
          </div>
          
          <div id="admin-grid" class="admin-grid">
            <!-- Images will be rendered here -->
          </div>
          <div class="admin-footer">
            <p><strong>Note:</strong> "Save Changes" will download a new 'gallery-data.js'. Replace the file in your project folder to make changes permanent.</p>
          </div>
        </div>
      </div>
    `;
        document.body.appendChild(adminOverlay);

        // Event Listeners
        document.getElementById('admin-close').addEventListener('click', toggleAdmin);
        document.getElementById('admin-login-btn').addEventListener('click', handleLogin);
        document.getElementById('admin-file-input').addEventListener('change', handleUpload);
        document.getElementById('admin-save-btn').addEventListener('click', handleSave);
    };

    // --- LOGIC ---

    window.toggleAdmin = () => {
        const overlay = document.getElementById('admin-overlay');
        if (!overlay) createAdminUI();

        const ui = document.getElementById('admin-overlay');
        isAdminOpen = !isAdminOpen;
        ui.style.display = isAdminOpen ? 'flex' : 'none';

        if (isAdminOpen) {
            // Check if already logged in (session)
            if (sessionStorage.getItem('admin_auth') === 'true') {
                showDashboard();
            }
        }
    };

    const handleLogin = () => {
        const pass = document.getElementById('admin-password').value;
        // Simple client-side check. 
        // In a real app, this is insecure, but fine for a static personal site tool.
        if (pass === 'admin') {
            sessionStorage.setItem('admin_auth', 'true');
            showDashboard();
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    };

    const showDashboard = () => {
        document.getElementById('admin-login-view').style.display = 'none';
        document.getElementById('admin-dashboard-view').style.display = 'flex';

        // Load images from window.galleryData
        if (window.galleryData && window.galleryData.images) {
            currentImages = [...window.galleryData.images];
        }
        renderGrid();
    };

    const renderGrid = () => {
        const grid = document.getElementById('admin-grid');
        grid.innerHTML = '';
        document.getElementById('admin-count').innerText = `${currentImages.length} Images`;

        currentImages.forEach((src, index) => {
            const item = document.createElement('div');
            item.className = 'admin-grid-item';
            item.innerHTML = `
        <img src="${src}" />
        <button class="delete-btn" data-index="${index}">🗑️</button>
      `;
            grid.appendChild(item);
        });

        // Add delete listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.target.dataset.index);
                currentImages.splice(idx, 1);
                renderGrid();
            });
        });
    };

    const handleUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        for (const file of files) {
            const base64 = await compressAndToBase64(file);
            currentImages.push(base64);
        }
        renderGrid();
        // Reset input
        e.target.value = '';
    };

    const compressAndToBase64 = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > MAX_IMAGE_WIDTH) {
                        height = Math.round(height * (MAX_IMAGE_WIDTH / width));
                        width = MAX_IMAGE_WIDTH;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG
                    const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleSave = () => {
        const dataContent = `// This file contains the gallery data. 
// It is updated via the Admin Interface "Save Changes" feature.

window.galleryData = {
  images: ${JSON.stringify(currentImages, null, 2)}
};
`;
        // Create download link
        const blob = new Blob([dataContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gallery-data.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('File downloaded! Please replace "e:\\spacial-gallery\\gallery-data.js" with this new file to make changes permanent.');

        // Also update live view immediately
        window.galleryData.images = [...currentImages];
        if (window.renderGallery && typeof window.renderGallery === 'function') {
            window.renderGallery(window.galleryData.images);
        }
    };

    // Setup Keyboard Trigger (Ctrl + Shift + A)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
            toggleAdmin();
        }
    });

})();
