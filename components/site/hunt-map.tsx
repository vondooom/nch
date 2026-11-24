"use client";

import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map, NavigationControl, Popup, setWorkerUrl, type MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { postalToSlug } from "@/lib/maps/postal";

/** OpenFreeMap public style. Commercial use is allowed. https://openfreemap.org/tos/ */
export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

type FeatureCollection = {
  type: "FeatureCollection";
  features: { type: "Feature"; properties: Record<string, string | null>; geometry: { type: string; coordinates: unknown } }[];
};

function extendBounds(coords: unknown, bounds: LngLatBounds) {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    bounds.extend([coords[0] as number, coords[1] as number]);
    return;
  }
  for (const child of coords) extendBounds(child, bounds);
}

export function HuntMap({ variant }: { variant: "national" | "california" }) {
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [deerOn, setDeerOn] = useState(true);
  const [waterfowlOn, setWaterfowlOn] = useState(true);
  const [status, setStatus] = useState("Loading the map.");

  useEffect(() => {
    if (!node.current || mapRef.current) return;
    setWorkerUrl("/maplibre-gl-worker.mjs");
    const map = new Map({
      container: node.current,
      style: OPENFREEMAP_STYLE,
      center: variant === "california" ? [-119.5, 37.2] : [-98, 39],
      zoom: variant === "california" ? 5 : 3,
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    map.on("load", async () => {
      try {
      if (variant === "national") {
        const states = (await fetch("/maps/us-states.geojson").then((response) => response.json())) as FeatureCollection;
        map.addSource("states", { type: "geojson", data: states as GeoJSON.FeatureCollection });
        map.addLayer({
          id: "states",
          type: "fill",
          source: "states",
          paint: { "fill-color": "#2F4A2C", "fill-opacity": 0.62 },
        });
        map.addLayer({
          id: "state-lines",
          type: "line",
          source: "states",
          paint: { "line-color": "#C75B12", "line-width": 1.5 },
        });
        const bounds = new LngLatBounds();
        for (const feature of states.features) extendBounds(feature.geometry.coordinates, bounds);
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 24, duration: 0 });
        setStatus(`${states.features.length} state outlines loaded.`);
        map.on("click", "states", (event) => {
          const code = event.features?.[0]?.properties?.STUSPS;
          const slug = typeof code === "string" ? postalToSlug[code] : undefined;
          if (slug) window.location.assign(`/hunt/${slug}`);
        });
        map.on("mouseenter", "states", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "states", () => {
          map.getCanvas().style.cursor = "";
        });
        return;
      }

      const [deer, waterfowl] = await Promise.all([
        fetch("/maps/ca-deer-zones.geojson").then((response) => response.json()) as Promise<FeatureCollection>,
        fetch("/maps/ca-waterfowl-zones.geojson").then((response) => response.json()) as Promise<FeatureCollection>,
      ]);
      map.addSource("deer", { type: "geojson", data: deer as GeoJSON.FeatureCollection });
      map.addSource("waterfowl", { type: "geojson", data: waterfowl as GeoJSON.FeatureCollection });
      map.addLayer({
        id: "waterfowl",
        type: "fill",
        source: "waterfowl",
        paint: { "fill-color": "#3d6b8a", "fill-opacity": 0.35 },
      });
      map.addLayer({
        id: "waterfowl-line",
        type: "line",
        source: "waterfowl",
        paint: { "line-color": "#1C3A4A", "line-width": 1.2 },
      });
      map.addLayer({
        id: "deer",
        type: "fill",
        source: "deer",
        paint: { "fill-color": "#C75B12", "fill-opacity": 0.18 },
      });
      map.addLayer({
        id: "deer-line",
        type: "line",
        source: "deer",
        paint: { "line-color": "#1C2B1A", "line-width": 1 },
      });
      const bounds = new LngLatBounds();
      for (const feature of [...deer.features, ...waterfowl.features]) extendBounds(feature.geometry.coordinates, bounds);
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 24, duration: 0 });
      setStatus(`${deer.features.length} deer zones and ${waterfowl.features.length} waterfowl zones loaded.`);

      const popup = new Popup({ closeButton: false, offset: 8 });
      const show = (event: MapLayerMouseEvent, label: string) => {
        const name = event.features?.[0]?.properties?.[label];
        if (!event.lngLat || typeof name !== "string") return;
        popup.setLngLat(event.lngLat).setText(name).addTo(map);
      };
      map.on("mousemove", "deer", (event) => show(event, "Zone_Nam"));
      map.on("mousemove", "waterfowl", (event) => show(event, "Zone"));
      map.on("mouseleave", "deer", () => popup.remove());
      map.on("mouseleave", "waterfowl", () => popup.remove());
      } catch {
        setStatus("The map data did not load.");
      }
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [variant]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || variant !== "california") return;
    const apply = () => {
      const set = (id: string, on: boolean) => {
        if (map.getLayer(id)) map.setLayoutProperty(id, "visibility", on ? "visible" : "none");
      };
      set("deer", deerOn);
      set("deer-line", deerOn);
      set("waterfowl", waterfowlOn);
      set("waterfowl-line", waterfowlOn);
    };
    if (!map.isStyleLoaded()) {
      map.once("idle", apply);
      return;
    }
    apply();
  }, [deerOn, waterfowlOn, variant]);

  return (
    <div>
      {variant === "california" ? (
        <div className="mb-3 flex flex-wrap gap-4 font-serif text-[15px] text-[#3B3526]">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={deerOn} onChange={(event) => setDeerOn(event.target.checked)} />
            Deer hunt zones
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={waterfowlOn} onChange={(event) => setWaterfowlOn(event.target.checked)} />
            Waterfowl hunt zones
          </label>
        </div>
      ) : (
        <p className="mb-3 font-serif text-[15px] text-[#5C543F]">Click a state to open its hub.</p>
      )}
      <div ref={node} className="h-[480px] w-full border-2 border-[#211D14]" />
      <p className="mt-2 font-serif text-[14px] text-[#5C543F]" data-map-status={status}>
        {status}
      </p>
    </div>
  );
}
