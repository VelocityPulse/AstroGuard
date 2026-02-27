#!/usr/bin/env python3
"""
AstroGuard — Surveillance des conditions astronomiques
Notifie via Discord quand une fenêtre d'observation se présente.
"""

import requests
import yaml
import json
from datetime import datetime, timedelta
from pathlib import Path

# ── Config ──────────────────────────────────────────────────────────────────

CONFIG_PATH = Path(__file__).parent / "config.yml"

def load_config():
    with open(CONFIG_PATH) as f:
        return yaml.safe_load(f)

# ── Open-Meteo : nuages, humidité, vent ─────────────────────────────────────

def fetch_openmeteo(lat, lon):
    url = (
        f"https://api.open-meteo.com/v1/forecast"
        f"?latitude={lat}&longitude={lon}"
        f"&hourly=cloudcover,relativehumidity_2m,windspeed_10m"
        f"&timezone=Europe/Paris&forecast_days=3"
    )
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.json()

# ── 7timer : seeing & transparence ──────────────────────────────────────────

def fetch_7timer(lat, lon):
    url = (
        f"https://www.7timer.info/bin/api.pl"
        f"?lon={lon}&lat={lat}&product=astro&output=json"
    )
    r = requests.get(url, timeout=10)
    r.raise_for_status()
    return r.json()

# ── Analyse des fenêtres ─────────────────────────────────────────────────────

def find_windows(config):
    lat = config["location"]["latitude"]
    lon = config["location"]["longitude"]
    thresholds = config["thresholds"]

    meteo = fetch_openmeteo(lat, lon)
    astro = fetch_7timer(lat, lon)

    times = meteo["hourly"]["time"]
    clouds = meteo["hourly"]["cloudcover"]
    humidity = meteo["hourly"]["relativehumidity_2m"]
    wind = meteo["hourly"]["windspeed_10m"]

    # Build 7timer seeing map (init_time + 3h steps)
    seeing_map = {}
    init_str = astro["init"]  # format: "2026020718"
    init_dt = datetime.strptime(init_str, "%Y%m%d%H")
    for i, entry in enumerate(astro["dataseries"]):
        t = init_dt + timedelta(hours=i * 3)
        key = t.strftime("%Y-%m-%dT%H:00")
        seeing_map[key] = entry.get("seeing", 0)

    windows = []
    now = datetime.now()

    for i, t_str in enumerate(times):
        t = datetime.fromisoformat(t_str)
        if t < now:
            continue
        # Only check night hours (20h → 5h)
        if not (t.hour >= 20 or t.hour <= 5):
            continue

        cloud = clouds[i]
        hum = humidity[i]
        spd = wind[i]

        # Get closest seeing value
        seeing_key = t.strftime("%Y-%m-%dT%H:00")
        # Round to nearest 3h
        rounded_hour = (t.hour // 3) * 3
        seeing_key_rounded = t.replace(hour=rounded_hour, minute=0).strftime("%Y-%m-%dT%H:00")
        seeing = seeing_map.get(seeing_key, seeing_map.get(seeing_key_rounded, 0))

        good = (
            cloud <= thresholds["cloud_cover_max"]
            and hum <= thresholds["humidity_max"]
            and spd <= thresholds["wind_max"]
            and seeing >= thresholds["seeing_min"]
        )

        if good:
            windows.append({
                "time": t,
                "cloud": cloud,
                "humidity": hum,
                "wind": spd,
                "seeing": seeing,
            })

    return windows

# ── Discord notification ─────────────────────────────────────────────────────

def format_seeing(s):
    stars = "⭐" * s + "☆" * (8 - s)
    return stars

def send_discord(webhook_url, windows):
    if not windows:
        return

    # Group consecutive hours
    lines = []
    for w in windows:
        t = w["time"].strftime("%d/%m %Hh")
        lines.append(
            f"• **{t}** — ☁️ {w['cloud']}% | 💧 {w['humidity']}% | 💨 {w['wind']}km/h | "
            f"👁️ Seeing {w['seeing']}/8"
        )

    first = windows[0]["time"].strftime("%A %d %B")
    message = {
        "username": "AstroGuard 🔭",
        "content": (
            f"🌌 **Fenêtre astronomique détectée !**\n"
            f"📍 Rueil-Malmaison — {first}\n\n"
            + "\n".join(lines[:8])
            + "\n\n_Prépare le matos ! 🚀_"
        )
    }

    r = requests.post(webhook_url, json=message, timeout=10)
    r.raise_for_status()
    print(f"✅ Notification envoyée — {len(windows)} créneau(x) détecté(s)")

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M')}] AstroGuard check...")
    config = load_config()
    windows = find_windows(config)

    if windows:
        print(f"🌟 {len(windows)} créneau(x) favorable(s) trouvé(s) !")
        send_discord(config["notification"]["discord_webhook"], windows)
    else:
        print("⛅ Aucune fenêtre favorable pour le moment.")

if __name__ == "__main__":
    main()
