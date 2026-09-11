/*
 LAKE VIEW Complex Property
 Supabase-enabled data + image storage.

 Data:
   site_settings  -> business information
   services       -> accommodation/service records
   gallery        -> gallery image records
 Storage:
   lakeview-images -> logo, hero, service and gallery images

 The browser only uses the Supabase publishable/anon key.
 NEVER put a service_role/secret key in this file.
*/

const DEFAULT_DATA = {
  bizInfo: {
    name: "LAKE VIEW Complex Property",
    phone: "+27662744119",
    whatsapp: "+27662744119",
    address: "97 Joubert St, eMakhazeni, 1100",
    heroSub: "Modern, secure, and comfortable accommodation located in the heart of eMakhazeni. Experience luxury living with peaceful lake views.",
    logo: "",
    heroImg: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"
  },
  services: [
    {id:1,title:"Standard Studio Room",price:"R550 / Night",desc:"Comfortable single studio equipped with double bed, en-suite bathroom, smart TV, and free Wi-Fi.",image:"https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80"},
    {id:2,title:"Luxury Executive Suite",price:"R850 / Night",desc:"Spacious luxury suite with modern furnishings, kitchenette, beautiful view, and dedicated workspace.",image:"https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=600&q=80"},
    {id:3,title:"2-Bedroom Family Apartment",price:"R1,200 / Night",desc:"Full 2-bedroom self-catering unit ideal for long stays or family trips. Includes fully equipped kitchen and lounge.",image:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80"}
  ],
  gallery: [
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80"
  ]
};

let siteData = null;
let supabase = null;
let supabaseReady = false;
let isRendering = false;

function hasSupabaseConfig() {
  return window.SUPABASE_URL &&
    window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_YOUR") &&
    !window.SUPABASE_ANON_KEY.includes("PASTE_YOUR");
}

function initSupabase() {
  if (!hasSupabaseConfig()) return false;
  if (!window.supabase) {
    console.error("Supabase JS library was not loaded.");
    return false;
  }
  supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
  supabaseReady = true;
  return true;
}

function cloneDefaults() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function normalizeWhatsApp(value) {
  return String(value || "").replace(/[^0-9]/g, "");
}

function getPublicUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from(window.SUPABASE_BUCKET).getPublicUrl(path);
  return data?.publicUrl || "";
}

function fileExtension(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g,"");
  return ext || "jpg";
}

async function uploadImage(file, folder) {
  if (!supabaseReady) throw new Error("Supabase is not configured yet.");
  if (!file || !file.type.startsWith("image/")) throw new Error("Please select an image file.");
  // Keep browser uploads reasonably small for the standard upload method.
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Please use an image smaller than 6 MB.");
  }
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2,10)}.${fileExtension(file)}`;
  const path = `${folder}/${safeName}`;
  const { error } = await supabase.storage.from(window.SUPABASE_BUCKET).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;
  return { path, url: getPublicUrl(path) };
}

function pathFromPublicUrl(url) {
  if (!url || !supabaseReady) return null;
  const marker = `/storage/v1/object/public/${window.SUPABASE_BUCKET}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

async function deleteStoredImage(url) {
  const path = pathFromPublicUrl(url);
  if (!path) return;
  const { error } = await supabase.storage.from(window.SUPABASE_BUCKET).remove([path]);
  if (error) console.warn("Storage delete warning:", error);
}

async function loadFromSupabase() {
  const [{ data: settings, error: settingsError },
         { data: services, error: servicesError },
         { data: gallery, error: galleryError }] = await Promise.all([
    supabase.from("site_settings").select("*").eq("id", 1).maybeSingle(),
    supabase.from("services").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true }),
    supabase.from("gallery").select("*").order("sort_order", { ascending: true }).order("created_at", { ascending: true })
  ]);

  if (settingsError) throw settingsError;
  if (servicesError) throw servicesError;
  if (galleryError) throw galleryError;

  const data = cloneDefaults();
  if (settings) {
    data.bizInfo = {
      name: settings.name || DEFAULT_DATA.bizInfo.name,
      phone: settings.phone || "",
      whatsapp: settings.whatsapp || "",
      address: settings.address || "",
      heroSub: settings.hero_sub || "",
      logo: settings.logo_url || "",
      heroImg: settings.hero_url || DEFAULT_DATA.bizInfo.heroImg
    };
  }
  if (Array.isArray(services) && services.length) {
    data.services = services.map(s => ({
      id: s.id, title: s.title, price: s.price, desc: s.description, image: s.image_url || ""
    }));
  }
  data.gallery = (gallery || []).map(g => g.image_url).filter(Boolean);
  siteData = data;
  return data;
}

async function ensureSeeded() {
  // The SQL setup file already seeds the site. This is just a safety net if
  // the tables exist but are empty.
  const { data: settings } = await supabase.from("site_settings").select("id").eq("id",1).maybeSingle();
  if (!settings) {
    const d = cloneDefaults();
    await supabase.from("site_settings").upsert({
      id:1,name:d.bizInfo.name,phone:d.bizInfo.phone,whatsapp:d.bizInfo.whatsapp,
      address:d.bizInfo.address,hero_sub:d.bizInfo.heroSub,logo_url:d.bizInfo.logo,
      hero_url:d.bizInfo.heroImg
    });
  }
}

async function getData() {
  if (siteData) return siteData;
  if (!supabaseReady) {
    const local = localStorage.getItem("lakeview_data");
    siteData = local ? JSON.parse(local) : cloneDefaults();
    return siteData;
  }
  try {
    await ensureSeeded();
    return await loadFromSupabase();
  } catch (error) {
    console.error("Supabase load failed:", error);
    const local = localStorage.getItem("lakeview_data");
    siteData = local ? JSON.parse(local) : cloneDefaults();
    showStatus("Supabase could not be reached. Check your Supabase setup.", true);
    return siteData;
  }
}

function showStatus(message, isError=false) {
  let box = document.getElementById("supabase-status");
  if (!box) {
    box = document.createElement("div");
    box.id = "supabase-status";
    box.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:99999;max-width:360px;padding:12px 15px;border-radius:10px;background:#111;color:#fff;font:14px Arial;box-shadow:0 5px 25px rgba(0,0,0,.25)";
    document.body.appendChild(box);
  }
  box.textContent = message;
  box.style.background = isError ? "#b42318" : "#087443";
  clearTimeout(box._timer);
  box._timer = setTimeout(()=>box.remove(), 5000);
}

async function saveBusinessInfoFromForm() {
  const payload = {
    id: 1,
    name: document.getElementById("admin-biz-name").value.trim(),
    phone: document.getElementById("admin-biz-phone").value.trim(),
    whatsapp: document.getElementById("admin-biz-whatsapp").value.trim(),
    address: document.getElementById("admin-biz-address").value.trim(),
    hero_sub: document.getElementById("admin-hero-sub").value.trim()
  };
  const { error } = await supabase.from("site_settings").upsert(payload, { onConflict: "id" });
  if (error) throw error;
  await refreshFromCloud();
}

async function refreshFromCloud() {
  if (!supabaseReady) return;
  siteData = null;
  await loadFromSupabase();
  renderWebsite();
}

function renderWebsite() {
  if (!siteData || isRendering) return;
  isRendering = true;
  const data = siteData;

  document.getElementById("site-title-text").innerText = data.bizInfo.name;
  document.getElementById("hero-title-display").innerText = data.bizInfo.name;
  document.getElementById("hero-subtitle-display").innerText = data.bizInfo.heroSub;
  document.getElementById("contact-address-display").innerText = data.bizInfo.address;
  document.getElementById("contact-phone-display").innerText = data.bizInfo.phone;
  document.getElementById("contact-whatsapp-display").innerText = data.bizInfo.whatsapp;
  document.getElementById("footer-biz-name").innerText = data.bizInfo.name;
  document.getElementById("year").innerText = new Date().getFullYear();

  if (data.bizInfo.heroImg) {
    document.querySelector(".hero-section").style.backgroundImage = `url("${data.bizInfo.heroImg}")`;
  }

  const logoContainer = document.getElementById("site-logo-container");
  if (data.bizInfo.logo) {
    logoContainer.innerHTML = `<img src="${escapeHtml(data.bizInfo.logo)}" alt="Logo"> <span id="site-title-text">${escapeHtml(data.bizInfo.name)}</span>`;
  }

  const servicesGrid = document.getElementById("services-grid");
  servicesGrid.innerHTML = "";
  data.services.forEach(service => {
    const waMsg = encodeURIComponent(`Hello, I want to enquire about booking the ${service.title} at ${service.price}.`);
    const image = service.image || "https://via.placeholder.com/400x250";
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${escapeHtml(image)}" class="card-img" alt="${escapeHtml(service.title)}">
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(service.title)}</h3>
        <div class="card-price">${escapeHtml(service.price)}</div>
        <p class="card-desc">${escapeHtml(service.desc)}</p>
        <a href="https://wa.me/${normalizeWhatsApp(data.bizInfo.whatsapp)}?text=${waMsg}" target="_blank" class="btn btn-whatsapp">
          <i class="fa-brands fa-whatsapp"></i> Enquiry on WhatsApp
        </a>
      </div>`;
    servicesGrid.appendChild(card);
  });

  const galleryGrid = document.getElementById("gallery-grid");
  galleryGrid.innerHTML = "";
  data.gallery.forEach(imgUrl => {
    const item = document.createElement("div");
    item.className = "gallery-item";
    item.innerHTML = `<img src="${escapeHtml(imgUrl)}" alt="Lake View Accommodations">`;
    galleryGrid.appendChild(item);
  });

  document.getElementById("admin-biz-name").value = data.bizInfo.name;
  document.getElementById("admin-biz-phone").value = data.bizInfo.phone;
  document.getElementById("admin-biz-whatsapp").value = data.bizInfo.whatsapp;
  document.getElementById("admin-biz-address").value = data.bizInfo.address;
  document.getElementById("admin-hero-sub").value = data.bizInfo.heroSub;
  renderAdminLists(data);
  isRendering = false;
}

function renderAdminLists(data) {
  const list = document.getElementById("admin-services-list");
  list.innerHTML = "";
  data.services.forEach(service => {
    const item = document.createElement("div");
    item.className = "admin-item";
    item.innerHTML = `<div><strong>${escapeHtml(service.title)}</strong> - ${escapeHtml(service.price)}</div>
      <div><button class="btn btn-primary" onclick="editService(${service.id})"><i class="fa-solid fa-pen"></i></button>
      <button class="btn btn-danger" onclick="deleteService(${service.id})"><i class="fa-solid fa-trash"></i></button></div>`;
    list.appendChild(item);
  });

  const galleryList = document.getElementById("admin-gallery-list");
  galleryList.innerHTML = "";
  data.gallery.forEach((imgUrl,index) => {
    const item = document.createElement("div");
    item.className = "admin-gallery-thumb";
    item.innerHTML = `<img src="${escapeHtml(imgUrl)}"><button class="btn btn-danger" onclick="deleteGalleryImage(${index})">&times;</button>`;
    galleryList.appendChild(item);
  });
}

function setupDropZone(dropZoneId, inputId, onFile) {
  const zone = document.getElementById(dropZoneId);
  const input = document.getElementById(inputId);
  const choose = (file) => file && onFile(file);
  zone.addEventListener("click", () => input.click());
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("dragover"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
  zone.addEventListener("drop", e => {
    e.preventDefault(); zone.classList.remove("dragover");
    choose(e.dataTransfer.files[0]);
  });
  input.addEventListener("change", e => choose(e.target.files[0]));
}

document.addEventListener("DOMContentLoaded", async () => {
  initSupabase();
  try {
    await getData();
    renderWebsite();
    if (supabaseReady) showStatus("Connected to Supabase — changes are shared across devices.");
    else showStatus("Supabase is not configured yet.", true);
  } catch (e) {
    console.error(e);
  }

  document.getElementById("mobile-toggle").addEventListener("click", () => {
    document.getElementById("nav-menu").classList.toggle("active");
  });

  const modal = document.getElementById("admin-modal");
  document.getElementById("admin-nav-btn").addEventListener("click", e => {
    e.preventDefault(); modal.style.display = "block";
  });
  document.getElementById("close-admin").addEventListener("click", () => modal.style.display = "none");

  document.getElementById("business-info-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!supabaseReady) return alert("Configure Supabase first.");
    try {
      await saveBusinessInfoFromForm();
      alert("Business information saved to Supabase.");
    } catch (err) {
      console.error(err); alert("Could not save business information: " + err.message);
    }
  });

  document.getElementById("service-form").addEventListener("submit", async e => {
    e.preventDefault();
    if (!supabaseReady) return alert("Configure Supabase first.");
    const id = document.getElementById("service-id").value;
    const title = document.getElementById("service-title").value.trim();
    const price = document.getElementById("service-price").value.trim();
    const desc = document.getElementById("service-desc").value.trim();
    const image = document.getElementById("service-image-data").value.trim() ||
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=600&q=80";

    try {
      if (id) {
        const { error } = await supabase.from("services").update({title,price,description:desc,image_url:image}).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("services").insert({title,price,description:desc,image_url:image});
        if (error) throw error;
      }
      await refreshFromCloud();
      document.getElementById("service-form").reset();
      document.getElementById("service-id").value = "";
      document.getElementById("service-image-data").value = "";
      document.getElementById("save-service-btn").innerText = "Add Accommodation";
      alert("Accommodation saved to Supabase.");
    } catch (err) {
      console.error(err); alert("Could not save accommodation: " + err.message);
    }
  });

  setupDropZone("drop-zone-logo","file-input-logo", async file => {
    if (!supabaseReady) return alert("Configure Supabase first.");
    try {
      const uploaded = await uploadImage(file,"logo");
      const oldUrl = siteData.bizInfo.logo;
      const { error } = await supabase.from("site_settings").update({logo_url:uploaded.url}).eq("id",1);
      if (error) throw error;
      if (oldUrl) await deleteStoredImage(oldUrl);
      await refreshFromCloud();
      alert("Logo uploaded to Supabase Storage.");
    } catch (err) {
      console.error(err); alert("Logo upload failed: " + err.message);
    }
  });

  setupDropZone("drop-zone-hero","file-input-hero", async file => {
    if (!supabaseReady) return alert("Configure Supabase first.");
    try {
      const uploaded = await uploadImage(file,"hero");
      const oldUrl = siteData.bizInfo.heroImg;
      const { error } = await supabase.from("site_settings").update({hero_url:uploaded.url}).eq("id",1);
      if (error) throw error;
      if (oldUrl && pathFromPublicUrl(oldUrl)) await deleteStoredImage(oldUrl);
      await refreshFromCloud();
      alert("Hero image uploaded to Supabase Storage.");
    } catch (err) {
      console.error(err); alert("Hero upload failed: " + err.message);
    }
  });

  setupDropZone("drop-zone-service","file-input-service", async file => {
    if (!supabaseReady) return alert("Configure Supabase first.");
    try {
      const uploaded = await uploadImage(file,"services");
      document.getElementById("service-image-data").value = uploaded.url;
      document.getElementById("service-image-data").dataset.storagePath = uploaded.path;
      alert("Service image uploaded. Now click Save Accommodation.");
    } catch (err) {
      console.error(err); alert("Service image upload failed: " + err.message);
    }
  });

  setupDropZone("drop-zone-gallery","file-input-gallery", async file => {
    if (!supabaseReady) return alert("Configure Supabase first.");
    try {
      const uploaded = await uploadImage(file,"gallery");
      const { error } = await supabase.from("gallery").insert({image_url:uploaded.url,storage_path:uploaded.path});
      if (error) throw error;
      await refreshFromCloud();
      alert("Gallery image uploaded to Supabase Storage.");
    } catch (err) {
      console.error(err); alert("Gallery upload failed: " + err.message);
    }
  });
});

window.editService = function(id) {
  const service = siteData?.services.find(s => s.id == id);
  if (!service) return;
  document.getElementById("service-id").value = service.id;
  document.getElementById("service-title").value = service.title;
  document.getElementById("service-price").value = service.price;
  document.getElementById("service-desc").value = service.desc;
  document.getElementById("service-image-data").value = service.image || "";
  document.getElementById("save-service-btn").innerText = "Update Accommodation";
};

window.deleteService = async function(id) {
  if (!confirm("Are you sure you want to delete this accommodation?")) return;
  const service = siteData?.services.find(s => s.id == id);
  try {
    const { error } = await supabase.from("services").delete().eq("id",id);
    if (error) throw error;
    if (service?.image) await deleteStoredImage(service.image);
    await refreshFromCloud();
  } catch (err) {
    console.error(err); alert("Could not delete accommodation: " + err.message);
  }
};

window.deleteGalleryImage = async function(index) {
  if (!confirm("Delete this gallery image?")) return;
  const imgUrl = siteData?.gallery[index];
  try {
    const { data: row } = await supabase.from("gallery").select("id,storage_path,image_url").eq("image_url",imgUrl).maybeSingle();
    if (row) {
      const { error } = await supabase.from("gallery").delete().eq("id",row.id);
      if (error) throw error;
      if (row.storage_path) await supabase.storage.from(window.SUPABASE_BUCKET).remove([row.storage_path]);
    }
    await refreshFromCloud();
  } catch (err) {
    console.error(err); alert("Could not delete gallery image: " + err.message);
  }
};

// Refresh open pages when another browser tab changes the data.
// For devices, each page simply reloads the cloud data on load.
window.addEventListener("focus", async () => {
  if (supabaseReady) {
    try { await refreshFromCloud(); } catch (e) { console.warn(e); }
  }
});
