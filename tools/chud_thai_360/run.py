#!/usr/bin/env python3
"""Portable Chud Thai image-based 360 viewer pipeline.

Examples:
  python3 tools/chud_thai_360/run.py build-viewer --frames /path/to/frames --output output/viewer
  python3 tools/chud_thai_360/run.py run --raw /path/to/raw --output output
"""
from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path

import cv2
import numpy as np

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def images(folder: Path) -> list[Path]:
    def sort_key(path: Path) -> tuple[int, int | str]:
        """Keep camera sequences such as 1.jpg … 18.jpg in capture order."""
        return (0, int(path.stem)) if path.stem.isdigit() else (1, path.name.lower())

    return sorted(
        (p for p in folder.iterdir() if p.suffix.lower() in IMAGE_EXTENSIONS),
        key=sort_key,
    )


def preprocess(raw: Path, output: Path) -> list[Path]:
    output.mkdir(parents=True, exist_ok=True)
    result = []
    for source in images(raw):
        image = cv2.imread(str(source))
        if image is None:
            raise RuntimeError(f"Could not read {source}")
        h, w = image.shape[:2]
        image = cv2.resize(image, (round(w * 1000 / h), 1000), interpolation=cv2.INTER_AREA)
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(l)
        image = cv2.cvtColor(cv2.merge([l, a, b]), cv2.COLOR_LAB2BGR)
        h, w = image.shape[:2]
        crop_w, crop_h = round(w * .62), round(h * .94)
        x0, y0 = (w - crop_w) // 2, (h - crop_h) // 2
        destination = output / f"{source.stem}_pre.png"
        cv2.imwrite(str(destination), image[y0:y0 + crop_h, x0:x0 + crop_w])
        result.append(destination)
    return result


def align(sources: list[Path], output: Path) -> list[Path]:
    output.mkdir(parents=True, exist_ok=True)
    loaded = [cv2.imread(str(p)) for p in sources]
    orb, matcher = cv2.ORB_create(nfeatures=4000), cv2.BFMatcher(cv2.NORM_HAMMING)
    result, cumulative = [], np.eye(3)
    for index, image in enumerate(loaded):
        if index:
            kp_a, desc_a = orb.detectAndCompute(loaded[index - 1], None)
            kp_b, desc_b = orb.detectAndCompute(image, None)
            homography = None
            if desc_a is not None and desc_b is not None:
                good = [m for m, n in matcher.knnMatch(desc_a, desc_b, k=2) if m.distance < .8 * n.distance]
                if len(good) >= 12:
                    src = np.float32([kp_a[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
                    dst = np.float32([kp_b[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
                    homography, mask = cv2.findHomography(dst, src, cv2.RANSAC, 4.0)
                    if homography is None or int(mask.sum()) < 25:
                        homography = None
            cumulative = cumulative @ (homography if homography is not None else np.eye(3))
            image = cv2.warpPerspective(image, cumulative, (loaded[0].shape[1], loaded[0].shape[0]), borderMode=cv2.BORDER_REPLICATE)
        destination = output / f"{sources[index].stem.replace('_pre', '')}_aligned.png"
        cv2.imwrite(str(destination), image)
        result.append(destination)
    return result


def interpolate(sources: list[Path], output: Path, between: int) -> list[Path]:
    output.mkdir(parents=True, exist_ok=True)
    loaded = [cv2.resize(cv2.imread(str(p)), (520, 1050)) for p in sources]
    frames = []
    def save(image):
        name = f"frame_{len(frames):03d}.jpg"
        cv2.imwrite(str(output / name), image)
        frames.append(name)
    for first, second in zip(loaded, loaded[1:]):
        save(first)
        flow = cv2.calcOpticalFlowFarneback(cv2.cvtColor(first, cv2.COLOR_BGR2GRAY), cv2.cvtColor(second, cv2.COLOR_BGR2GRAY), None, .5, 3, 25, 3, 5, 1.2, 0)
        grid_x, grid_y = np.meshgrid(np.arange(520), np.arange(1050))
        for number in range(1, between + 1):
            t = number / (between + 1)
            warped = cv2.remap(first, (grid_x + flow[..., 0] * t).astype(np.float32), (grid_y + flow[..., 1] * t).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
            save(cv2.addWeighted(warped, 1 - t, second, t, 0))
    save(loaded[-1])
    (output / "frames.json").write_text(json.dumps(frames, indent=2))
    return frames


def build_viewer(frames: Path, output: Path) -> None:
    names = [p.name for p in images(frames) if p.name.startswith("frame_")]
    if not names:
        raise ValueError(f"No frame_*.jpg images found in {frames}")
    target = output / "frames"
    target.mkdir(parents=True, exist_ok=True)
    for name in names:
        shutil.copy2(frames / name, target / name)
    (target / "frames.json").write_text(json.dumps(names, indent=2))
    max_index = len(names) - 1
    html = f'''<!doctype html><meta charset="utf-8"><title>Chud Thai 360</title>
<style>body{{margin:0;background:#111;color:#ead9af;font:16px system-ui;text-align:center}}img{{max-height:82vh;max-width:94vw;display:block;margin:12px auto;user-select:none}}input{{width:min(94vw,520px)}}</style>
<h1>Chud Thai — image-based 360° viewer</h1><img id="image" src="frames/{names[0]}" alt="360 frame"><input id="range" type="range" min="0" max="{max_index}" value="0"><p id="label">1 / {len(names)}</p>
<script>const names={json.dumps(names)},image=document.querySelector('#image'),range=document.querySelector('#range'),label=document.querySelector('#label');function show(i){{i=(+i+names.length)%names.length;image.src='frames/'+names[i];range.value=i;label.textContent=(i+1)+' / '+names.length}}range.oninput=e=>show(e.target.value);let x;image.onpointerdown=e=>x=e.clientX;image.onpointermove=e=>{{if(x!==undefined){{let d=e.clientX-x;if(Math.abs(d)>8){{show(+range.value+(d<0?1:-1));x=e.clientX}}}}}};image.onpointerup=()=>x=undefined;</script>'''
    (output / "index.html").write_text(html)
    print(f"Viewer ready: {output / 'index.html'} ({len(names)} frames)")


def main() -> None:
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    run = commands.add_parser("run")
    run.add_argument("--raw", type=Path, required=True)
    run.add_argument("--output", type=Path, required=True)
    run.add_argument("--between", type=int, default=6)
    viewer = commands.add_parser("build-viewer")
    viewer.add_argument("--frames", type=Path, required=True)
    viewer.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "build-viewer":
        build_viewer(args.frames, args.output)
        return
    pre = preprocess(args.raw, args.output / "01_preprocessed")
    aligned = align(pre, args.output / "02_aligned")
    interpolate(aligned, args.output / "03_frames", args.between)
    build_viewer(args.output / "03_frames", args.output / "04_viewer")


if __name__ == "__main__":
    main()
