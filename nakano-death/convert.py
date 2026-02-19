import json
import math

with open('nakano.json', 'r') as f:
    geojson = json.load(f)

features = geojson['features']

# ID Mapping
id_map = {
    "Kamitakada": "kamitakada",
    "Higashinakano": "higashinakano",
    "Chuo": "chuo",
    "Honcho": "honcho",
    "Yayoicho": "yayoimachi", 
    "Minamidai": "minamidai",
    "Nakano": "nakano",
    "Kamisaginomiya": "kamisaginomiya",
    "Saginomiya": "saginomiya",
    "Eharacho": "eharacho",
    "Egoda": "egota", 
    "Matsugaoka": "matsugaoka",
    "Maruyama": "maruyama",
    "Shirasagi": "shirasagi",
    "Wakamiya": "wakamiya",
    "Yamatocho": "yamatocho",
    "numabukuro": "numabukuro",
    "Numabukuro": "numabukuro",
    "Arai": "arai",
    "Nogata": "nogata"
}

# Calculate Bounding Box
min_lon = float('inf')
max_lon = float('-inf')
min_lat = float('inf')
max_lat = float('-inf')

for f in features:
    geom = f['geometry']
    coords = geom['coordinates']
    if geom['type'] == 'MultiPolygon':
        # List of Polygons -> List of Rings -> List of Points
        for poly in coords:
            for ring in poly:
                for pt in ring:
                    lon, lat = pt
                    min_lon = min(min_lon, lon)
                    max_lon = max(max_lon, lon)
                    min_lat = min(min_lat, lat)
                    max_lat = max(max_lat, lat)
    else:
         for ring in coords:
                for pt in ring:
                    lon, lat = pt
                    min_lon = min(min_lon, lon)
                    max_lon = max(max_lon, lon)
                    min_lat = min(min_lat, lat)
                    max_lat = max(max_lat, lat)

print(f"Bounds: Lon[{min_lon}, {max_lon}], Lat[{min_lat}, {max_lat}]")

# Setup SVG ViewBox
width = 600
height = 800

lon_span = max_lon - min_lon
lat_span = max_lat - min_lat

# Determine scale to fit
scale_x = width / lon_span
scale_y = height / lat_span
scale = min(scale_x, scale_y) * 0.95 

# Calculate offsets to center
mk_width = lon_span * scale
mk_height = lat_span * scale
offset_x = (width - mk_width) / 2
offset_y = (height - mk_height) / 2

map_paths = {}

for f in features:
    raw_name = f['properties'].get('CITY_NAME')
    if not raw_name: # Handle lowercase keys if present
         raw_name = f['properties'].get('city_name')
         
    id_key = id_map.get(raw_name, raw_name.lower())
    
    path_str = ""
    geom = f['geometry']
    coords = geom['coordinates']
    polygons = coords if geom['type'] == 'MultiPolygon' else [coords]
    
    for poly in polygons:
        for ring in poly:
            pts_str = []
            for pt in ring:
                lon, lat = pt
                x = (lon - min_lon) * scale + offset_x
                # Invert Y
                y = height - ((lat - min_lat) * scale + offset_y)
                pts_str.append(f"{x:.1f},{y:.1f}")
            
            path_str += "M " + " L ".join(pts_str) + " Z "

    map_paths[id_key] = path_str.strip()

print("const mapPaths = " + json.dumps(map_paths, indent=4, ensure_ascii=False) + ";")
