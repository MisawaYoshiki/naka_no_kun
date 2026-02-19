const fs = require('fs');

const geojson = JSON.parse(fs.readFileSync('nakano.json', 'utf8'));
const features = geojson.features;

// ID Mapping
const idMap = {
    "Kamitakada": "kamitakada",
    "Higashinakano": "higashinakano",
    "Chuo": "chuo",
    "Honcho": "honcho",
    "Yayoicho": "yayoimachi", // Remap to match config.js
    "Minamidai": "minamidai",
    "Nakano": "nakano",
    "Kamisaginomiya": "kamisaginomiya",
    "Saginomiya": "saginomiya",
    "Eharacho": "eharacho",
    "Egoda": "egota", // Remap to match config.js
    "Matsugaoka": "matsugaoka",
    "Maruyama": "maruyama",
    "Shirasagi": "shirasagi",
    "Wakamiya": "wakamiya",
    "Yamatocho": "yamatocho", // Note: Yamatocho vs Yamato-cho
    "numabukuro": "numabukuro", // Lowercase in JSON?
    "Numabukuro": "numabukuro", // Just in case
    "Arai": "arai",
    "Nogata": "nogata"
};

// Calculate Bounding Box
let minLon = Infinity, maxLon = -Infinity;
let minLat = Infinity, maxLat = -Infinity;

features.forEach(f => {
    // Handle Polygon and MultiPolygon
    const coords = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.flat() : f.geometry.coordinates;
    coords.forEach(ring => {
        ring.forEach(pt => {
            const [lon, lat] = pt;
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        });
    });
});

console.log(`Bounds: Lon[${minLon}, ${maxLon}], Lat[${minLat}, ${maxLat}]`);

// Setup SVG ViewBox
const width = 600;
const height = 800; // Target size

const lonSpan = maxLon - minLon;
const latSpan = maxLat - minLat;

// Determine scale to fit
const scaleX = width / lonSpan;
const scaleY = height / latSpan;
const scale = Math.min(scaleX, scaleY) * 0.95; // 95% fit to leave some margin

console.log(`Scale: ${scale}`);

// Calculate logic offsets to center it
const mkWidth = lonSpan * scale;
const mkHeight = latSpan * scale;
const offsetX = (width - mkWidth) / 2;
const offsetY = (height - mkHeight) / 2;

const mapPaths = {};

features.forEach(f => {
    let rawName = f.properties.CITY_NAME;
    let id = idMap[rawName] || rawName.toLowerCase();

    // Check if Numabukuro is lowercase in JSON source (it appeared as "numabukuro" in snippets)

    let pathStr = "";

    const polygons = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];

    polygons.forEach(poly => {
        poly.forEach((ring, index) => {
            // Move to first point
            const pts = ring.map(pt => {
                const [lon, lat] = pt;
                const x = (lon - minLon) * scale + offsetX;
                // SVG Y is Top-Down, Lat is Bottom-Up -> Invert Lat
                const y = height - ((lat - minLat) * scale + offsetY);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            });

            pathStr += "M " + pts.join(" L ") + " Z ";
        });
    });

    mapPaths[id] = pathStr.trim();
});

console.log("const mapPaths = " + JSON.stringify(mapPaths, null, 4) + ";");
