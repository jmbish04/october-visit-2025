import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  name: string;
  category: string;
  description?: string;
}

export interface MapRoute {
  id: string;
  coordinates: [number, number][];
}

export interface MapProps {
  markers: MapMarker[];
  routes?: MapRoute[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  accessToken: string;
}

const Map = ({ markers, routes = [], selectedId, onSelect, accessToken }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRefs = useRef<Record<string, mapboxgl.Marker>>({});
  const routeIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = accessToken;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [-122.4194, 37.7749],
      zoom: 9
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accessToken]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const drawMarkers = () => {
      Object.values(markerRefs.current).forEach((marker) => marker.remove());
      markerRefs.current = {};

      markers.forEach((marker) => {
        const el = document.createElement("div");
        el.className = `cursor-pointer rounded-full border-2 border-white bg-muted-green px-2 py-1 text-xs font-semibold text-white shadow-lg transition-transform ${
          marker.id === selectedId ? "scale-110" : "scale-95"
        }`;
        el.textContent = marker.name;
        el.addEventListener("click", () => onSelect?.(marker.id));

        const mbMarker = new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .addTo(map);
        markerRefs.current[marker.id] = mbMarker;
      });

      if (markers.length) {
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach((marker) => bounds.extend([marker.lng, marker.lat]));
        map.fitBounds(bounds, { padding: 40, maxZoom: 12 });
      }
    };

    if (map.isStyleLoaded()) {
      drawMarkers();
    } else {
      map.once("load", drawMarkers);
    }
  }, [markers, onSelect, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const drawRoutes = () => {
      for (const id of routeIdsRef.current) {
        const sourceId = `route-${id}`;
        if (map.getLayer(sourceId)) {
          map.removeLayer(sourceId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }
      routeIdsRef.current = [];

      routes.forEach((route) => {
        const sourceId = `route-${route.id}`;
        map.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: route.coordinates
            }
          }
        });

        map.addLayer({
          id: sourceId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#7a9a8c",
            "line-width": 4,
            "line-opacity": 0.85
          }
        });
        routeIdsRef.current.push(route.id);
      });
    };

    if (map.isStyleLoaded()) {
      drawRoutes();
    } else {
      map.once("load", drawRoutes);
    }
  }, [routes]);

  return <div ref={mapContainer} className="h-full w-full rounded-2xl" />;
};

export default Map;
