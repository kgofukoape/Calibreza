'use client';

import { useEffect, useState } from 'react';

interface ProfileMapProps {
  lat: number;
  lng: number;
  name: string;
  address?: string;
}

export default function ProfileMap({ lat, lng, name, address }: ProfileMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <div className="w-full h-[280px] bg-[#13151A] border border-white/5 rounded-sm flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#C9922A] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return <LeafletProfileMap lat={lat} lng={lng} name={name} address={address} />;
}

function LeafletProfileMap({ lat, lng, name, address }: ProfileMapProps) {
  useEffect(() => {
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
    <div className="w-full rounded-sm overflow-hidden border border-white/5" style={{ height: '280px' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>
            <div style={{ fontFamily: 'Arial, sans-serif', minWidth: '160px' }}>
              <strong style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>{name}</strong>
              {address && <span style={{ fontSize: '11px', color: '#666' }}>{address}</span>}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
