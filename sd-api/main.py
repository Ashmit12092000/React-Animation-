"""
OpenDoodler AI Image Generation Service
Model: stabilityai/sd-turbo (CPU-safe, auto-detects GPU if available)
"""

import io
import base64
import logging
import time
from contextlib import asynccontextmanager
from typing import Optional

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from diffusers import AutoPipelineForText2Image

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

pipeline = None
device_info = {}


def load_pipeline():
    global pipeline, device_info

    if torch.cuda.is_available():
        device, dtype, variant = "cuda", torch.float16, "fp16"
        log.info(f"GPU: {torch.cuda.get_device_name(0)}")
    elif torch.backends.mps.is_available():
        device, dtype, variant = "mps", torch.float16, "fp16"
        log.info("Apple MPS detected")
    else:
        device, dtype, variant = "cpu", torch.float32, None
        log.info("CPU mode — expect ~15–25s per image")

    device_info = {
        "device": device,
        "dtype": str(dtype),
        "cuda_available": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
    }

    log.info("Loading stabilityai/sd-turbo…")
    t0 = time.time()

    kwargs = {"torch_dtype": dtype}
    if variant:
        kwargs["variant"] = variant

    pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", **kwargs)
    pipe = pipe.to(device)

    if device == "cuda":
        pipe.enable_attention_slicing()

    global pipeline
    pipeline = pipe
    log.info(f"Pipeline ready in {time.time() - t0:.1f}s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_pipeline()
    yield
    global pipeline
    pipeline = None
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


app = FastAPI(title="OpenDoodler Image Service", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=1000)
    negative_prompt: Optional[str] = Field(default="", max_length=500)
    steps: int = Field(default=4, ge=1, le=8)
    guidance_scale: float = Field(default=0.0, ge=0.0, le=2.0)
    width: int = Field(default=512, ge=256, le=1024)
    height: int = Field(default=512, ge=256, le=1024)
    seed: Optional[int] = Field(default=None)


class GenerateResponse(BaseModel):
    image: str
    width: int
    height: int
    seed: int
    elapsed_ms: int


@app.get("/")
def health():
    return {"status": "ok", "model": "stabilityai/sd-turbo", "pipeline_loaded": pipeline is not None, **device_info}


@app.get("/status")
def status():
    return {"ready": pipeline is not None, "device": device_info.get("device", "unknown")}


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Pipeline not loaded yet.")

    seed = req.seed if req.seed is not None else int(time.time() * 1000) % (2 ** 32)
    generator = torch.Generator(device=device_info["device"]).manual_seed(seed)

    log.info(f"Generating '{req.prompt[:60]}' steps={req.steps} {req.width}x{req.height} seed={seed}")
    t0 = time.time()

    try:
        result = pipeline(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt or None,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance_scale,
            width=req.width,
            height=req.height,
            generator=generator,
        )
    except Exception as e:
        log.error(f"Pipeline error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

    elapsed_ms = int((time.time() - t0) * 1000)
    image = result.images[0]

    buf = io.BytesIO()
    image.save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    log.info(f"Done in {elapsed_ms}ms")
    return GenerateResponse(
        image=f"data:image/png;base64,{b64}",
        width=image.width,
        height=image.height,
        seed=seed,
        elapsed_ms=elapsed_ms,
    )
