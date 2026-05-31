# Demo GIF Placeholder

Record a 30-second GIF showing:
1. User types "Write a server with user authentication"
2. Blue Team writes the code
3. Red Team finds a vulnerability (e.g., missing rate limiting)
4. Blue Team auto-patches
5. Red Team confirms secure

Tools to record:
- macOS: `gifcap` or OBS + ffmpeg
- Linux: `peek` or `byzanz`
- Convert: `ffmpeg -i demo.mp4 -vf "fps=15,scale=800:-1" demo.gif`

Place the output as `docs/demo.gif`.
