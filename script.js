// --- Initial Default Data ---
const defaultData = {
    bizInfo: {
        name: "LAKE VIEW Complex Property",
        phone: "+27662744119",
        whatsapp: "+27662744119",
        address: "97 Joubert St, eMakhazeni, 1100",
        heroSub: "Modern, secure, and comfortable accommodation located in the heart of eMakhazeni. Experience luxury living with peaceful lake views.",
        logo: "", // Data URL or empty
        heroImg: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"
    },
    services: [
        {
            id: 1,
            title: "Standard Studio Room",
            price: "R550 / Night",
            desc: "Comfortable single studio equipped with double bed, en-suite bathroom, smart TV, and free Wi-Fi.",
            image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"
        },
        {
            id: 2,
            title: "Luxury Executive Suite",
            price: "R850 / Night",
            desc: "Spacious luxury suite with modern furnishings, kitchenette, beautiful view, and dedicated workspace.",
            image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80"
        },
        {
            id: 3,
            title: "2-Bedroom Family Apartment",
            price: "R1,200 / Night",
            desc: "Full 2-bedroom self-catering unit ideal for long stays or family trips. Includes fully equipped kitchen and lounge.",
            image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"
        }
    ],
    gallery: [
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
        "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80"
    ]
};

// --- Storage Handlers ---
function getStoredData() {
    const data = localStorage.getItem('lakeview_data');
    return data ? JSON.parse(data) : defaultData;
}

function saveData(data) {
    localStorage.setItem('lakeview_data', JSON.stringify(data));
    renderWebsite();
}

// --- DOM Rendering Function ---
function renderWebsite() {
    const data = getStoredData();

    // Render Business Info
    document.getElementById('site-title-text').innerText = data.bizInfo.name;
    document.getElementById('hero-title-display').innerText = data.bizInfo.name;
    document.getElementById('hero-subtitle-display').innerText = data.bizInfo.heroSub;
    document.getElementById('contact-address-display').innerText = data.bizInfo.address;
    document.getElementById('contact-phone-display').innerText = data.bizInfo.phone;
    document.getElementById('contact-whatsapp-display').innerText = data.bizInfo.whatsapp;
    document.getElementById('footer-biz-name').innerText = data.bizInfo.name;
    document.getElementById('year').innerText = new Date().getFullYear();

    // Hero Background
    if (data.bizInfo.heroImg) {
        document.querySelector('.hero-section').style.backgroundImage = `url('${data.bizInfo.heroImg}')`;
    }

    // Logo Update
    const logoContainer = document.getElementById('site-logo-container');
    if (data.bizInfo.logo) {
        logoContainer.innerHTML = `<img src="${data.bizInfo.logo}" alt="Logo"> <span>${data.bizInfo.name}</span>`;
    }

    // Render Services
    const servicesGrid = document.getElementById('services-grid');
    servicesGrid.innerHTML = '';
    data.services.forEach(service => {
        const waMsg = encodeURIComponent(`Hello, I want to enquire about booking the ${service.title} at ${service.price}.`);
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${service.image || 'https://via.placeholder.com/400x250'}" class="card-img" alt="${service.title}">
            <div class="card-body">
                <h3 class="card-title">${service.title}</h3>
                <div class="card-price">${service.price}</div>
                <p class="card-desc">${service.desc}</p>
                <a href="https://wa.me/${data.bizInfo.whatsapp.replace(/[^0-9]/g, '')}?text=${waMsg}" target="_blank" class="btn btn-whatsapp">
                    <i class="fa-brands fa-whatsapp"></i> Enquiry on WhatsApp
                </a>
            </div>
        `;
        servicesGrid.appendChild(card);
    });

    // Render Gallery
    const galleryGrid = document.getElementById('gallery-grid');
    galleryGrid.innerHTML = '';
    data.gallery.forEach(imgUrl => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        item.innerHTML = `<img src="${imgUrl}" alt="Lake View Accommodations">`;
        galleryGrid.appendChild(item);
    });

    // Populating Admin Values
    document.getElementById('admin-biz-name').value = data.bizInfo.name;
    document.getElementById('admin-biz-phone').value = data.bizInfo.phone;
    document.getElementById('admin-biz-whatsapp').value = data.bizInfo.whatsapp;
    document.getElementById('admin-biz-address').value = data.bizInfo.address;
    document.getElementById('admin-hero-sub').value = data.bizInfo.heroSub;

    renderAdminLists(data);
}

// Render Admin Lists
function renderAdminLists(data) {
    // Services List in Admin
    const adminServicesList = document.getElementById('admin-services-list');
    adminServicesList.innerHTML = '';
    data.services.forEach(service => {
        const item = document.createElement('div');
        item.className = 'admin-item';
        item.innerHTML = `
            <div><strong>${service.title}</strong> - ${service.price}</div>
            <div>
                <button class="btn btn-primary" onclick="editService(${service.id})"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-danger" onclick="deleteService(${service.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        adminServicesList.appendChild(item);
    });

    // Gallery List in Admin
    const adminGalleryList = document.getElementById('admin-gallery-list');
    adminGalleryList.innerHTML = '';
    data.gallery.forEach((imgUrl, index) => {
        const thumb = document.createElement('div');
        thumb.className = 'admin-gallery-thumb';
        thumb.innerHTML = `
            <img src="${imgUrl}">
            <button class="btn btn-danger" onclick="deleteGalleryImage(${index})">&times;</button>
        `;
        adminGalleryList.appendChild(thumb);
    });
}

// Helper to convert Image to Base64 String (Offline LocalStorage Save)
function fileToBase64(file, callback) {
    const reader = new FileReader();
    reader.onload = function (e) {
        callback(e.target.result);
    };
    reader.readAsDataURL(file);
}

// Setup Drag & Drop Helper
function setupDropZone(dropZoneId, inputId, onFileProcessed) {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);

    dropZone.addEventListener('click', () => input.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            fileToBase64(e.dataTransfer.files[0], onFileProcessed);
        }
    });

    input.addEventListener('change', (e) => {
        if (e.target.files.length) {
            fileToBase64(e.target.files[0], onFileProcessed);
        }
    });
}

// --- Event Listeners & Actions ---
document.addEventListener('DOMContentLoaded', () => {
    renderWebsite();

    // Mobile Navbar Toggle
    document.getElementById('mobile-toggle').addEventListener('click', () => {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Admin Modal Logic
    const modal = document.getElementById('admin-modal');
    document.getElementById('admin-nav-btn').addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });
    document.getElementById('close-admin').addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Save Business Information Form
    document.getElementById('business-info-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getStoredData();
        data.bizInfo.name = document.getElementById('admin-biz-name').value;
        data.bizInfo.phone = document.getElementById('admin-biz-phone').value;
        data.bizInfo.whatsapp = document.getElementById('admin-biz-whatsapp').value;
        data.bizInfo.address = document.getElementById('admin-biz-address').value;
        data.bizInfo.heroSub = document.getElementById('admin-hero-sub').value;
        saveData(data);
        alert('Business info updated successfully!');
    });

    // Save/Add Service Form
    document.getElementById('service-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const data = getStoredData();
        const id = document.getElementById('service-id').value;
        const title = document.getElementById('service-title').value;
        const price = document.getElementById('service-price').value;
        const desc = document.getElementById('service-desc').value;
        const image = document.getElementById('service-image-data').value || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80';

        if (id) {
            // Edit existing
            const index = data.services.findIndex(s => s.id == id);
            if (index !== -1) {
                data.services[index] = { id: parseInt(id), title, price, desc, image };
            }
        } else {
            // Add new
            const newId = Date.now();
            data.services.push({ id: newId, title, price, desc, image });
        }

        saveData(data);
        document.getElementById('service-form').reset();
        document.getElementById('service-id').value = '';
        document.getElementById('service-image-data').value = '';
        alert('Accommodation saved!');
    });

    // Drag-and-Drop Uploader Handlers
    setupDropZone('drop-zone-logo', 'file-input-logo', (base64) => {
        const data = getStoredData();
        data.bizInfo.logo = base64;
        saveData(data);
        alert('Logo updated!');
    });

    setupDropZone('drop-zone-hero', 'file-input-hero', (base64) => {
        const data = getStoredData();
        data.bizInfo.heroImg = base64;
        saveData(data);
        alert('Hero background updated!');
    });

    setupDropZone('drop-zone-service', 'file-input-service', (base64) => {
        document.getElementById('service-image-data').value = base64;
        alert('Service image loaded! Now click Save Accommodation.');
    });

    setupDropZone('drop-zone-gallery', 'file-input-gallery', (base64) => {
        const data = getStoredData();
        data.gallery.push(base64);
        saveData(data);
        alert('New gallery image uploaded!');
    });
});

// Admin Service Edit Trigger
window.editService = function(id) {
    const data = getStoredData();
    const service = data.services.find(s => s.id == id);
    if (service) {
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-title').value = service.title;
        document.getElementById('service-price').value = service.price;
        document.getElementById('service-desc').value = service.desc;
        document.getElementById('service-image-data').value = service.image;
        document.getElementById('save-service-btn').innerText = "Update Accommodation";
    }
};

// Admin Service Delete Trigger
window.deleteService = function(id) {
    if (confirm("Are you sure you want to delete this accommodation?")) {
        const data = getStoredData();
        data.services = data.services.filter(s => s.id != id);
        saveData(data);
    }
};

// Admin Gallery Image Delete Trigger
window.deleteGalleryImage = function(index) {
    if (confirm("Delete this gallery image?")) {
        const data = getStoredData();
        data.gallery.splice(index, 1);
        saveData(data);
    }
};