// Gezi bölgelerinin tanımlanması
const zones = [
    { id: 1, name: "Bölge 1", lat: 38.736002, lng: 29.749615, audioSrc: "audio/bolge1.mp3" },
    { id: 2, name: "Bölge 2", lat: 38.736035, lng: 29.749325, audioSrc: "audio/bolge2.mp3" },
    { id: 3, name: "Bölge 3", lat: 38.735853, lng: 29.749367, audioSrc: "audio/bolge3.mp3" },
];

let currentAudio = null;
let watchId = null;
let map = null;
let userMarker = null;
let zoneCircles = [];

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
            radius: 4 // 4 metre yarıçap
        }).addTo(map);

        zoneCircles.push(circle);
    });
}

// Ses çalma fonksiyonu
function playZoneAudio(audioSrc) {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(audioSrc);
    currentAudio.play();
}

// Ses durdurma fonksiyonu
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
}

// İki nokta arasındaki mesafeyi hesaplama (metre cinsinden)
function calculateDistance(lat1, lon1, lat2, lon2) {
    return map.distance([lat1, lon1], [lat2, lon2]);
}

// Konum kontrolü ve ses çalma/durdurma mantığı
function checkLocation(position) {
    const currentLat = position.coords.latitude;
    const currentLng = position.coords.longitude;
    
    // Kullanıcı konumunu güncelle
    userMarker.setLatLng([currentLat, currentLng]);
    
    document.getElementById('latitude').textContent = currentLat.toFixed(6);
    document.getElementById('longitude').textContent = currentLng.toFixed(6);

    let inZone = false;
    
    for (const zone of zones) {
        const distance = calculateDistance(currentLat, currentLng, zone.lat, zone.lng);
        
        if (distance <= 4) { // 4 metre yarıçap
            inZone = true;
            document.getElementById('zone-name').textContent = zone.name;
            document.getElementById('status').textContent = `${zone.name} içerisindesiniz`;
            playZoneAudio(zone.audioSrc);
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
    startLocationTracking();
}); 