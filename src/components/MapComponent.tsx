'use client';

import { useEffect, useState } from 'react';

interface MapProps {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  zoom?: number;
}

export default function MapComponent({ lat, lng, name, address, zoom = 14 }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return (
    <div className="w-full h-full bg-[#13151A] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return <LeafletMap lat={lat} lng={lng} name={name} address={address} zoom={zoom} />;
}

function LeafletMap({ lat, lng, name, address, zoom }: MapProps) {
  useEffect(() => {
    // Fix Leaflet default marker icons
    const L = require('leaflet');
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const { MapContainer, TileLayer, Marker, Popup } = require('react-leaflet');
  require('leaflet/dist/leaflet.css');

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={zoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]}>
        <Popup>
          <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '140px' }}>
            <strong style={{ fontSize: '13px' }}>{name}</strong>
            {address && <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#666' }}>{address}</p>}
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
