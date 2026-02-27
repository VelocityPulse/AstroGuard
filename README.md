# 🔭 AstroGuard

**AstroGuard** surveille les conditions astronomiques à Rueil-Malmaison et notifie via Discord dès qu'une fenêtre d'observation se présente.

## Features

- ☁️ Couverture nuageuse (Open-Meteo)
- 🌬️ Seeing atmosphérique & transparence (7timer.info)
- 🌙 Phase de lune + lever/coucher
- 💧 Humidité & vent en altitude
- 🔔 Notification Discord automatique

## Stack

- Python 3
- Cron (VPS)
- Open-Meteo API (gratuit)
- 7timer API (gratuit)
- Discord Webhook

## Usage

```bash
pip install -r requirements.txt
cp config.example.yml config.yml
# Éditer config.yml avec tes seuils et webhook Discord
python astroguard.py
```
