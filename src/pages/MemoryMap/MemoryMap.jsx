import { useEffect, useMemo, useState, useRef } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";

import L from "leaflet";

import PageLayout from "../../ui/PageLayout/PageLayout";
import Container from "../../ui/Container/Container";
import Navbar from "../../components/Navbar/Navbar";

import styles from "./MemoryMap.module.css";

import { getMyStory } from "../../services/story/getStory";
import { getMoments } from "../../services/moment/getMoments";
import { geocodeLocation } from "../../services/map/geocodeLocation";

import JourneyTimeline from "./components/JourneyTimeline";
import HeroCard from "./components/HeroCard";
import MemoryPopup from "./components/MemoryPopup";
import MapControls from "./components/MapControls";
import getMarkerIcon from "./components/getMarkerIcon";

function MapAutoFit({
  markers,
  mapRef,
}) {
  const map = useMap();

  useEffect(() => {
    mapRef.current = map;

    if (!markers.length) return;

    const bounds = L.latLngBounds(
      markers.map((m) => [
        m.lat,
        m.lng,
      ])
    );

    map.fitBounds(bounds, {
      padding: [80, 80],
    });
  }, [markers, map]);

  return null;
}

function FlyToMarker({
  marker,
}) {
  const map = useMap();

  useEffect(() => {
    if (!marker) return;

    map.flyTo(
      [marker.lat, marker.lng],
      13,
      {
        duration: 1.5,
      }
    );
  }, [marker, map]);

  return null;
}

function MemoryMap() {
  const [moments, setMoments] =
    useState([]);

  const [markers, setMarkers] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [selected, setSelected] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [
    favoritesOnly,
    setFavoritesOnly,
  ] = useState(false);

  const mapRef = useRef(null);

  useEffect(() => {
    async function loadMemories() {
      try {
        const story =
          await getMyStory();

        if (!story) {
          setMoments([]);
          return;
        }

        const data =
          await getMoments(
            story.id
          );

        setMoments(data || []);

        const mapped = [];

        for (const moment of data || []) {
          if (!moment.location)
            continue;

          const coords =
            await geocodeLocation(
              moment.location
            );

          if (!coords) continue;

          mapped.push({
            ...moment,
            ...coords,
          });
        }

        mapped.sort(
          (a, b) =>
            new Date(
              a.memory_date
            ) -
            new Date(
              b.memory_date
            )
        );

        setMarkers(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMemories();
  }, []);

  const filteredMarkers =
    useMemo(() => {
      return markers.filter(
        (marker) => {
          const query =
            search.toLowerCase();

          const matchesSearch =
            marker.title
              ?.toLowerCase()
              .includes(query) ||
            marker.location
              ?.toLowerCase()
              .includes(query);

          const matchesFavorite =
            !favoritesOnly ||
            marker.is_favorite;

          return (
            matchesSearch &&
            matchesFavorite
          );
        }
      );
    }, [
      markers,
      search,
      favoritesOnly,
    ]);

  const selectedMarker =
    useMemo(() => {
      if (!selected)
        return null;

      return filteredMarkers.find(
        (m) =>
          m.id === selected.id
      );
    }, [
      selected,
      filteredMarkers,
    ]);

  const journeyPath =
    useMemo(() => {
      return filteredMarkers.map(
        (m) => [
          m.lat,
          m.lng,
        ]
      );
    }, [filteredMarkers]);
      //---------------------------------------

  const locateMe = () => {
    if (!navigator.geolocation || !mapRef.current)
      return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        mapRef.current.flyTo(
          [
            coords.latitude,
            coords.longitude,
          ],
          13,
          {
            duration: 1.5,
          }
        );
      }
    );
  };

  //---------------------------------------

  const fitAllMarkers = () => {
    if (
      !mapRef.current ||
      !filteredMarkers.length
    )
      return;

    const bounds =
      L.latLngBounds(
        filteredMarkers.map(
          (m) => [
            m.lat,
            m.lng,
          ]
        )
      );

    mapRef.current.fitBounds(
      bounds,
      {
        padding: [80, 80],
      }
    );
  };

  //---------------------------------------

  if (loading) {
    return (
      <PageLayout>
        <Container>
          <Navbar />

          <h2>
            Loading your memories...
          </h2>
        </Container>
      </PageLayout>
    );
  }

  //---------------------------------------

  return (
    <PageLayout>
      <Container>
        <Navbar />

        <div className={styles.heroHeader}>
          <span
            className={styles.badge}
          >
            🗺 Interactive Journey
          </span>

          <h1>
            Memory Map
          </h1>

          <p>
            Every place you've visited
            together beautifully
            connected into one story.
          </p>
        </div>

        <div className={styles.stats}>
          <HeroCard
            icon="❤️"
            title="Memories"
            value={moments.length}
            delay={0}
          />

          <HeroCard
            icon="📍"
            title="Places"
            value={
              new Set(
                moments
                  .filter(
                    (m) =>
                      m.location
                  )
                  .map(
                    (m) =>
                      m.location
                  )
              ).size
            }
            delay={0.15}
          />

          <HeroCard
            icon="⭐"
            title="Favorites"
            value={
              moments.filter(
                (m) =>
                  m.is_favorite
              ).length
            }
            delay={0.3}
          />
        </div>

        <div className={styles.layout}>
          <JourneyTimeline
            moments={moments}
            selected={selected?.id}
            onSelect={
              setSelected
            }
          />

          <div
            className={
              styles.mapContainer
            }
          >
            <MapControls
              search={search}
              setSearch={
                setSearch
              }
              favoritesOnly={
                favoritesOnly
              }
              setFavoritesOnly={
                setFavoritesOnly
              }
              onLocate={
                locateMe
              }
              onFitAll={
                fitAllMarkers
              }
            />

            <MapContainer
              center={[
                20.5937,
                78.9629,
              ]}
              zoom={5}
              scrollWheelZoom
              className={
                styles.map
              }
            >
              <TileLayer
                attribution="© OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapAutoFit
                markers={
                  filteredMarkers
                }
                mapRef={mapRef}
              />

              <FlyToMarker
                marker={
                  selectedMarker
                }
              />
                            {filteredMarkers.map(
                (marker, index) => (
                  <Marker
                    key={marker.id}
                    position={[
                      marker.lat,
                      marker.lng,
                    ]}
                    icon={getMarkerIcon(
                      marker,
                      selected?.id === marker.id,
                      index + 1
                    )}
                    eventHandlers={{
                      click: () =>
                        setSelected(marker),
                    }}
                  >
                    <Popup
                      closeButton={false}
                      minWidth={320}
                    >
                      <MemoryPopup
                        moment={marker}
                      />
                    </Popup>
                  </Marker>
                )
              )}
            </MapContainer>
          </div>
        </div>
      </Container>
    </PageLayout>
  );
}

export default MemoryMap;