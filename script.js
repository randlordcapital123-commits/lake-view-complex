// --- 1. SUPABASE CLIENT SETUP ---
const SUPABASE_URL = "https://obglvzlccknnstsuerpb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iZ2x2emxjY2tubnN0c3VlcnBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxMzAwNzksImV4cCI6MjEwNDcwNjA3OX0.tHVC7eAXg6wEQMN-lM7KPJfdLzxLrsME98hIPdzQPLI";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- 2. IMAGE UPLOAD FUNCTION ---
async function uploadImageToSupabase(file) {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabaseClient
        .storage
        .from('property-images')
        .upload(filePath, file);

    if (error) {
        console.error("Storage upload error:", error);
        alert("Image upload failed! Ensure the 'property-images' bucket exists and is public.");
        return null;
    }

    const { data: publicUrlData } = supabaseClient
        .storage
        .from('property-images')
        .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
}

// --- 3. FETCH & RENDER DATA FROM DATABASE ---
async function loadWebsiteData() {
    // Fetch Business Information
    const { data: info, error: infoErr } = await supabaseClient
        .from('business_info')
        .select('*')
        .eq('id', 1)
        .maybeSingle();

    if (info) {
        document.getElementById('site-title-text').innerText = info.name;
        document.getElementById('hero-title-display').innerText = info.name;
        document.getElementById('hero-subtitle-display').innerText = info.hero_sub;
        document.getElementById('contact-address-display').innerText = info.address;
        document.getElementById('contact-phone-display').innerText = info.phone;
        document.getElementById('contact-whatsapp-display').innerText = info.whatsapp;
        document.getElementById('footer-biz-name').innerText = info.name;
        document.getElementById('year').innerText = new Date().getFullYear();

        if (info.hero_img) {
            document.querySelector('.hero-section').style.backgroundImage = `url('${info.hero_img}')`;
        }
        if (info.logo_url) {
            document.getElementById('site-logo-container').innerHTML = `<img src="${info.logo_url}" alt="Logo"> <span>${info.name}</span>`;
        }

        // Fill Admin Fields
        document.getElementById('admin-biz-name').value = info.name || '';
        document.getElementById('admin-biz-phone').value = info.phone || '';
        document.getElementById('admin-biz-whatsapp').value = info.whatsapp || '';
        document.getElementById('admin-biz-address').value = info.address || '';
        document.getElementById('admin-hero-sub').value = info.hero_sub || '';
    }

    // Fetch Accommodations / Services
    const { data: services } = await supabaseClient.from('services').select('*').order('id', { ascending: false });
    renderServices(services || [], info?.whatsapp || '+27662744119');

    // Fetch Gallery
    const { data: gallery } = await supabaseClient.from('gallery').select('*').order('id', { ascending: false });
    renderGallery(gallery || []);
}

// --- 4. RENDER UI FUNCTIONS ---
function renderServices(services, whatsappNum) {
    const servicesGrid = document.getElementById('services-grid');
    const adminServicesList = document.getElementById('admin-services-list');
    servicesGrid.innerHTML = '';
    adminServicesList.innerHTML = '';

    const cleanPhone = whatsappNum.replace(/[^0-9]/g, '');

    services.forEach(service => {
        const waMsg = encodeURIComponent(`Hello, I am enquiring about: ${service.title} (${service.price}).`);
        
        // Public Card
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <img src="${service.image_url}" class="card-img" alt="${service.title}">
            <div class="card-body">
                <h3 class="card-title">${service.title}</h3>
                <div class="card-price">${service.price}</div>
                <p class="card-desc">${service.description}</p>
                <a href="https://wa.me/${cleanPhone}?text=${waMsg}" target="_blank" class="btn btn-whatsapp">
                    <i class="fa-brands fa-whatsapp"></i> WhatsApp Enquiry
                </a>
            </div>
        `;
        servicesGrid.appendChild(card);

        // Admin List Item
        const adminItem = document.createElement('div');
        adminItem.className = 'admin-item';
        adminItem.innerHTML = `
            <div><strong>${service.title}</strong> - ${service.price}</div>
            <div>
                <button class="btn btn-danger" onclick="deleteService(${service.id})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        adminServicesList.appendChild(adminItem);
    });
}

function renderGallery(gallery) {
    const galleryGrid = document.getElementById('gallery-grid');
    const adminGalleryList = document.getElementById('admin-gallery-list');
    galleryGrid.innerHTML = '';
    adminGalleryList.innerHTML = '';

    gallery.forEach(item => {
        const galCard = document.createElement('div');
        galCard.className = 'gallery-item';
        galCard.innerHTML = `<img src="${item.image_url}" alt="Gallery photo">`;
        galleryGrid.appendChild(galCard);

        const thumb = document.createElement('div');
        thumb.className = 'admin-gallery-thumb';
        thumb.innerHTML = `
            <img src="${item.image_url}">
            <button class="btn btn-danger" onclick="deleteGalleryImage(${item.id})">&times;</button>
        `;
        adminGalleryList.appendChild(thumb);
    });
}

// --- 5. DRAG & DROP BINDINGS ---
function setupDropZone(dropZoneId, inputId, onFileSelect) {
    const dropZone = document.getElementById(dropZoneId);
    const input = document.getElementById(inputId);

    if (!dropZone || !input) return;

    dropZone.addEventListener('click', () => input.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    });
    input.addEventListener('change', (e) => {
        if (e.target.files.length) {
            onFileSelect(e.target.files[0]);
        }
    });
}

// --- 6. INITIALIZATION & FORM SUBMISSIONS ---
document.addEventListener('DOMContentLoaded', () => {
    loadWebsiteData();

    // Mobile Navigation Toggle
    document.getElementById('mobile-toggle').addEventListener('click', () => {
        document.getElementById('nav-menu').classList.toggle('active');
    });

    // Admin Modal Controls
    const modal = document.getElementById('admin-modal');
    document.getElementById('admin-nav-btn').addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'block';
    });
    document.getElementById('close-admin').addEventListener('click', () => modal.style.display = 'none');

    // Save Business Details Form
    document.getElementById('business-info-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const { error } = await supabaseClient.from('business_info').upsert({
            id: 1,
            name: document.getElementById('admin-biz-name').value,
            phone: document.getElementById('admin-biz-phone').value,
            whatsapp: document.getElementById('admin-biz-whatsapp').value,
            address: document.getElementById('admin-biz-address').value,
            hero_sub: document.getElementById('admin-hero-sub').value
        });

        if (error) alert("Error updating info: " + error.message);
        else alert('Business details updated globally!');
        loadWebsiteData();
    });

    // Save Accommodation Listing Form
    document.getElementById('service-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('file-input-service');

        if (!fileInput.files.length) {
            alert("Please select or drop an image for this listing!");
            return;
        }

        const imageUrl = await uploadImageToSupabase(fileInput.files[0]);
        if (!imageUrl) return;

        const { error } = await supabaseClient.from('services').insert([{
            id: Date.now(),
            title: document.getElementById('service-title').value,
            price: document.getElementById('service-price').value,
            description: document.getElementById('service-desc').value,
            image_url: imageUrl
        }]);

        if (error) alert("Error inserting service: " + error.message);
        else alert('Listing published across all devices!');

        document.getElementById('service-form').reset();
        loadWebsiteData();
    });

    // Drag-and-Drop Image Handlers
    setupDropZone('drop-zone-logo', 'file-input-logo', async (file) => {
        const logoUrl = await uploadImageToSupabase(file);
        if (logoUrl) {
            await supabaseClient.from('business_info').upsert({ id: 1, logo_url: logoUrl });
            alert('Logo uploaded globally!');
            loadWebsiteData();
        }
    });

    setupDropZone('drop-zone-hero', 'file-input-hero', async (file) => {
        const heroUrl = await uploadImageToSupabase(file);
        if (heroUrl) {
            await supabaseClient.from('business_info').upsert({ id: 1, hero_img: heroUrl });
            alert('Hero background uploaded globally!');
            loadWebsiteData();
        }
    });

    setupDropZone('drop-zone-gallery', 'file-input-gallery', async (file) => {
        const imageUrl = await uploadImageToSupabase(file);
        if (imageUrl) {
            await supabaseClient.from('gallery').insert([{ image_url: imageUrl }]);
            alert('Gallery image uploaded globally!');
            loadWebsiteData();
        }
    });
});

// Admin Delete Functions
window.deleteService = async function(id) {
    if (confirm("Remove this listing from Supabase?")) {
        await supabaseClient.from('services').delete().eq('id', id);
        loadWebsiteData();
    }
};

window.deleteGalleryImage = async function(id) {
    if (confirm("Remove this photo from Supabase gallery?")) {
        await supabaseClient.from('gallery').delete().eq('id', id);
        loadWebsiteData();
    }
};