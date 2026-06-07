# OpenDoodler — Whiteboard Animation Editor

React-based whiteboard animation editor with self-hosted AI image generation (SD-Turbo).

## Project structure

```
├── docker-compose.yml
├── run.sh                          ← always use this to start
├── .devcontainer/
│   └── devcontainer.json           ← auto-starts on Codespace open
├── react-app/                      ← CRA React frontend
│   ├── Dockerfile
│   ├── package.json
│   ├── public/
│   └── src/
└── sd-api/                         ← FastAPI + SD-Turbo backend
    ├── Dockerfile
    └── main.py
```

## Quick start (GitHub Codespaces)

```bash
chmod +x run.sh
./run.sh
```

Then in the **Ports tab**: right-click port `8000` → **Port Visibility → Public**.

Open port `3000` in browser → your app is running.

## Quick start (local)

```bash
./run.sh
# App: http://localhost:3000
# API: http://localhost:8000
```

## Commands

```bash
./run.sh            # start
./run.sh --build    # force rebuild Docker images
docker compose logs -f            # live logs
docker compose logs -f sd-api     # API only
docker compose down               # stop
docker compose down -v            # stop + wipe model cache
```

## First-start times

| Step | Duration |
|------|----------|
| Docker image build | ~4 min |
| SD-Turbo model download (~2GB, once) | ~3 min |
| React compile | ~30s |

Subsequent starts: ~30 seconds total.

## Image generation performance

| Hardware | 1 step | 4 steps |
|----------|--------|---------|
| NVIDIA GPU | ~0.5s | ~1.5s |
| Apple M2 | ~3s | ~10s |
| CPU (Codespaces) | ~8s | ~25s |

Use **1–2 steps** for quick iteration on CPU.

## API

- `GET  http://localhost:8000/`        → health + device info  
- `GET  http://localhost:8000/status`  → `{ ready: true }`  
- `POST http://localhost:8000/generate` → base64 PNG  
- `GET  http://localhost:8000/docs`    → interactive Swagger UI
