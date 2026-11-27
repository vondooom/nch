"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LngLatBounds, Map, NavigationControl, Popup, setWorkerUrl, type LngLatBoundsLike, type MapLayerMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { postalToSlug } from "@/lib/maps/postal";

/** OpenFreeMap public style. Commercial use is allowed. https://openfreemap.org/tos/ */
export const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

// Keep the national map useful at phone width without fitting Alaska's
// antimeridian-spanning outline together with the contiguous states.
const US_VIEWS = {
  contiguous: { label: "Lower 48", frame: [[-125, 24], [-66.5, 49.5]], limits: [[-152, 3], [-42, 70]] },
  alaska: { label: "Alaska", frame: [[-188.5, 51], [-129.5, 72]], limits: [[-225, 32], [-96, 83]] },
  hawaii: { label: "Hawaii", frame: [[-160.5, 18.8], [-154.7, 22.5]], limits: [[-166, 13], [-149, 28]] },
} satisfies Record<string, { label: string; frame: LngLatBoundsLike; limits: LngLatBoundsLike }>;
type UsView = keyof typeof US_VIEWS;

function frameUsView(map: Map, region: UsView) {
  const { frame, limits } = US_VIEWS[region];
  map.setMinZoom(0);
  map.setMaxBounds(null);
  const camera = map.cameraForBounds(frame, { padding: 16 });
  if (!camera || camera.zoom === undefined) return;
  map.setMinZoom(camera.zoom);
  map.setMaxBounds(limits);
  map.jumpTo(camera);
}

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
  const router = useRouter();
  const node = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const regionRef = useRef<UsView>("contiguous");
  const [region, setRegion] = useState<UsView>("contiguous");
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
      ...(variant === "national" ? { dragRotate: false, pitchWithRotate: false, maxPitch: 0 } : {}),
    });
    map.addControl(new NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    if (variant === "national") {
      map.touchZoomRotate.disableRotation();
      frameUsView(map, regionRef.current);
      map.on("resize", () => frameUsView(map, regionRef.current));
    }

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
        setStatus(`${states.features.length} state outlines loaded.`);
        map.on("click", "states", (event) => {
          const code = event.features?.[0]?.properties?.STUSPS;
          const slug = typeof code === "string" ? postalToSlug[code] : undefined;
          if (slug) router.push(`/hunt/${slug}`);
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
  }, [router, variant]);

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
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="U.S. map views">
            {(Object.keys(US_VIEWS) as UsView[]).map((view) => (
              <button
                key={view}
                type="button"
                aria-pressed={region === view}
                className="min-h-11 rounded-sm border border-[#5C543F] px-3 font-serif text-sm text-[#3B3526] aria-pressed:bg-[#2F4A2C] aria-pressed:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C75B12]"
                onClick={() => {
                  regionRef.current = view;
                  setRegion(view);
                  if (mapRef.current) frameUsView(mapRef.current, view);
                }}
              >
                {US_VIEWS[view].label}
              </button>
            ))}
          </div>
          <p className="font-serif text-[15px] text-[#5C543F]">
            Select a state to open its hub, or <Link href="/hunt" className="underline">browse the state list</Link>.
          </p>
        </div>
      )}
      <div
        ref={node}
        className={`w-full border-2 border-[#211D14] ${variant === "national" ? "h-[320px] sm:h-[480px]" : "h-[480px]"}`}
      />
      <p className="mt-2 font-serif text-[14px] text-[#5C543F]" data-map-status={status}>
        {status}
      </p>
    </div>
  );
}
