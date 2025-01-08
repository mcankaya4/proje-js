// Gezi bölgelerinin tanımlanması
const zones = [
    { id: 1, name: "Bölge 1", lat: 38.735948, lng: 29.749371, audioSrc: "audio/bolge11.mp3" },
    //{ id: 1, name: "Bölge 1", lat: 38.736002, lng: 29.749615, audioSrc: "audio/bolge11.mp3" },
    //{ id: 2, name: "Bölge 2", lat: 38.736035, lng: 29.749325, audioSrc: "audio/bolge22.mp3" },
    //{ id: 3, name: "Bölge 3", lat: 38.735853, lng: 29.749367, audioSrc: "audio/bolge33.mp3" },
];

let currentAudio = null;
let watchId = null;
let map = null;
let userMarker = null;
let zoneCircles = [];
let activeZoneId = null; // Aktif bölge takibi için

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

// Ses çalma fonksiyonu
function playZoneAudio(audioSrc, zone) {
    // Eğer aynı bölgedeyse tekrar sorma
    if (activeZoneId === zone.id) {
        if (!currentAudio || currentAudio.paused) {
            currentAudio = new Audio(audioSrc);
            currentAudio.play().catch(error => {
                console.log("Ses çalma hatası:", error);
            });
        }
        return;
    }

    // Yeni bir bölgeye girildiğinde
    const playPrompt = confirm(`${zone.name} bölgesine girdiniz. Sesli anlatımı dinlemek için Tamam'a tıklayın.`);
    
    if (playPrompt) {
        activeZoneId = zone.id; // Aktif bölgeyi kaydet
        
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
        }

        currentAudio = new Audio(audioSrc);
        currentAudio.play().catch(error => {
            console.log("Ses çalma hatası:", error);
            alert("Ses çalınamadı. Lütfen tekrar deneyin.");
        });
    }
}

// Ses durdurma fonksiyonu
function stopCurrentAudio() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
    }
    activeZoneId = null; // Bölgeden çıkınca aktif bölgeyi sıfırla
}

// İki nokta arasındaki mesafeyi hesaplama (metre cinsinden)
function calculateDistance(lat1, lon1, lat2, lon2) {
    return map.distance([lat1, lon1], [lat2, lon2]);
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
            playZoneAudio(zone.audioSrc, zone);
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