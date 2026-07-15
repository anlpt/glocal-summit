# Demo recording

`record-demo.mjs` drives a real browser (Playwright) through the whole app and
records a ~45s walkthrough video: participant login → multi-select → save →
live view (bubbles / bar race / treemap / leaderboard + detail drawer) →
admin CMS (overview, groups & units, participants, selections).

## Regenerate

```bash
# 1. Start the dev server (offline seed data is fine)
npm run dev            # http://localhost:5173

# 2. In another terminal, install the one-off tooling and record
npm i --no-save playwright ffmpeg-static
node demo/record-demo.mjs           # writes demo/video/*.webm

# 3. (optional) convert to mp4
node -e "console.log(require('ffmpeg-static'))"   # prints ffmpeg path
# then: <that-path> -i demo/video/<file>.webm -c:v libx264 -pix_fmt yuv420p \
#       -movflags +faststart demo/glocal-summit-demo.mp4
```

The generated `.webm` / `.mp4` files are git-ignored (binaries).
