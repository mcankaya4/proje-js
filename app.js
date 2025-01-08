// Gezi bölgelerinin tanımlanması
const zones = [
    { id: 1, name: "Bölge 1", lat: 38.735948, lng: 29.749371, audioSrc: "audio/bolge11.mp3" },
    //{ id: 2, name: "Bölge 2", lat: 38.736035, lng: 29.749325, audioSrc: "audio/bolge22.mp3" },
    //{ id: 3, name: "Bölge 3", lat: 38.735853, lng: 29.749367, audioSrc: "audio/bolge33.mp3" },
];

let currentAudio = null;
let watchId = null;
let map = null;
let userMarker = null;
let zoneCircles = [];
let activeZoneId = null;
let audioElements = {};

// Ses dosyalarını önceden yükle
function preloadAudio() {
    zones.forEach(zone => {
        const audio = new Audio();
        audio.src = zone.audioSrc;
        audio.preload = 'auto';
        audioElements[zone.id] = audio;
    });
}

// Ses çalma fonksiyonu
function playZoneAudio(zoneId) {
    // Eğer aynı bölgedeyse ve ses zaten çalıyorsa, bir şey yapma
    if (activeZoneId === zoneId && !audioElements[zoneId].paused) {
        return;
    }

    // Önceki sesi durdur
    if (activeZoneId && audioElements[activeZoneId]) {
        audioElements[activeZoneId].pause();
        audioElements[activeZoneId].currentTime = 0;
    }

    // Yeni sesi çal
    activeZoneId = zoneId;
    audioElements[zoneId].currentTime = 0;
    audioElements[zoneId].play().catch(error => {
        console.log("Ses çalma hatası:", error);
    });
}

// Ses durdurma fonksiyonu
function stopCurrentAudio() {
    if (activeZoneId && audioElements[activeZoneId]) {
        audioElements[activeZoneId].pause();
        audioElements[activeZoneId].currentTime = 0;
    }
    activeZoneId = null;
}

// İki nokta arasındaki mesafeyi hesaplama (metre cinsinden)
function calculateDistance(lat1, lon1, lat2, lon2) {
    return map.distance([lat1, lon1], [lat2, lon2]);
}

// Haritayı başlat
function initMap(lat, lng) {
    map = L.map('map').setView([lat, lng], 18);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Kullanıcı konumu için marker
    userMarker = L.marker([lat, lng]).addTo(map);

    // Bölgeleri haritaya ekle
    zones.forEach(zone => {
        const circle = L.circle([zone.lat, zone.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.3,
            radius: 5 // 5 metre yarıçap
        }).addTo(map);

        zoneCircles.push(circle);
    });
}

// Konum kontrolü ve ses çalma/durdurma mantığı
function checkLocation(position) {
    const currentLat = position.coords.latitude;
    const currentLng = position.coords.longitude;
    
    userMarker.setLatLng([currentLat, currentLng]);
    
    document.getElementById('latitude').textContent = currentLat.toFixed(6);
    document.getElementById('longitude').textContent = currentLng.toFixed(6);

    let inZone = false;
    
    for (const zone of zones) {
        const distance = calculateDistance(currentLat, currentLng, zone.lat, zone.lng);
        
        if (distance <= 5) {
            inZone = true;
            document.getElementById('zone-name').textContent = zone.name;
            document.getElementById('status').textContent = `${zone.name} içerisindesiniz`;
            playZoneAudio(zone.id);
            break;
        }
    }

    if (!inZone) {
        document.getElementById('zone-name').textContent = "Bölge dışında";
        document.getElementById('status').textContent = "Herhangi bir bölge içerisinde değilsiniz";
        stopCurrentAudio();
    }
}

// Konum izleme başlatma
function startLocationTracking() {
    if ("geolocation" in navigator) {
        document.getElementById('status').textContent = "Konum takip ediliyor...";
        
        // İlk konum alımı
        navigator.geolocation.getCurrentPosition(
            (position) => {
                initMap(position.coords.latitude, position.coords.longitude);
                checkLocation(position);
            },
            (error) => {
                document.getElementById('status').textContent = "Konum hatası: " + error.message;
            }
        );

        // Sürekli konum takibi
        watchId = navigator.geolocation.watchPosition(
            checkLocation,
            (error) => {
                document.getElementById('status').textContent = "Konum hatası: " + error.message;
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000,
                secure: true
            }
        );
    } else {
        document.getElementById('status').textContent = "Tarayıcınız konum özelliğini desteklemiyor.";
    }
}

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', () => {
    preloadAudio(); // Ses dosyalarını önceden yükle
    startLocationTracking();
}); 