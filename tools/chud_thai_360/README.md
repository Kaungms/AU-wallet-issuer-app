# Portable Chud Thai 360 pipeline

This is a portable version of the supplied image-based rendering project. It
does not use a trained model. It builds a 360°-style viewer from ordered photos
using preprocessing, ORB/RANSAC alignment, Farneback optical-flow interpolation,
and an HTML frame viewer.

## Run the supplied result now

```bash
python3 tools/chud_thai_360/run.py build-viewer \
  --frames /Users/kyii/Downloads/chud_thai_360/frames \
  --output output/chud_thai_360/viewer
python3 -m http.server 8000 -d output/chud_thai_360/viewer
```

Open `http://localhost:8000` and drag the picture or use the slider.

## Rebuild from original photos

Put the ordered rotation photos in one folder (ideally 24–36 photos, with a
constant distance and lighting). Then run:

```bash
python3 -m pip install -r tools/chud_thai_360/requirements.txt
python3 tools/chud_thai_360/run.py run \
  --raw /absolute/path/to/raw_photos \
  --output output/chud_thai_360
python3 -m http.server 8000 -d output/chud_thai_360/04_viewer
```

With 14 source photos and `--between 6` (the default), the output is
`14 + 13 × 6 = 92` frames.
