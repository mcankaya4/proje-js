// Gezi bölgelerinin tanımlanması
const zones = [
    { 
        id: 1, 
        name: "Bölge 1", 
        lat: 38.736002, 
        lng: 29.749615, 
        audioSrc: "audio/bolge1.ogg"
    },
    { 
        id: 2, 
        name: "Bölge 2", 
        lat: 38.736035, 
        lng: 29.749325, 
        audioSrc: "audio/bolge2.ogg"
    },
    { 
        id: 3, 
        name: "Bölge 3", 
        lat: 38.735853, 
        lng: 29.749367, 
        audioSrc: "audio/bolge3.ogg"
    }
];

let watchId = null;
let map = null;
let userMarker = null;
let zoneCircles = [];
let activeZoneId = null;
let audioElements = {};
let audioLoadPromises = [];

// Ses dosyalarını önceden yükle
async function preloadAudio() {
    document.getElementById('status').textContent = "Ses dosyaları yükleniyor...";

    // Her bölge için ses yükleme promise'i oluştur
    audioLoadPromises = zones.map(zone => {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                audioElements[zone.id] = audio;
                resolve();
            }, { once: true });

            audio.addEventListener('error', (e) => {
                reject(new Error(`Ses dosyası yüklenemedi: ${zone.audioSrc}`));
            });

            audio.src = zone.audioSrc;
            audio.preload = 'auto';
        });
    });

    try {
        // Tüm ses dosyalarının yüklenmesini bekle
        await Promise.all(audioLoadPromises);
        document.getElementById('status').textContent = "Ses dosyaları hazır, konum bekleniyor...";
        return true;
    } catch (error) {
        console.error('Ses yükleme hatası:', error);
        document.getElementById('status').textContent = "Ses dosyaları yüklenirken hata oluştu!";
        return false;
    }
}

// Ses çalma fonksiyonu
function playZoneAudio(zoneId) {
    // Eğer ses yüklü değilse çalma
    if (!audioElements[zoneId]) {
        console.log("Ses dosyası henüz hazır değil");
        return;
    }

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

// Uygulama başlatma
document.addEventListener('DOMContentLoaded', async () => {
    // Önce ses dosyalarını yükle
    const audioLoaded = await preloadAudio();
    if (audioLoaded) {
        // Sesler yüklendikten sonra konum takibini başlat
        startLocationTracking();
    }
});

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

// Ses durdurma fonksiyonu
function stopCurrentAudio() {
    if (activeZoneId && audioElements[activeZoneId]) {
        audioElements[activeZoneId].pause();
        audioElements[activeZoneId].currentTime = 0;
    }
    activeZoneId = null;
} 