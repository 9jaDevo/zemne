"""Assemble an explicitly edited walkthrough from genuine CUA screenshots.

Usage: python assemble_walkthrough.py FFMPEG WORK_DIRECTORY
Narration WAV files (0.wav..15.wav) are generated locally with Windows TTS.
This script performs media assembly only; it never controls a browser.
"""
import json
import subprocess
import sys
import textwrap
import wave
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent
ffmpeg, work = sys.argv[1], Path(sys.argv[2])
scenes = json.loads((root / "walkthrough-scenes.json").read_text(encoding="utf-8-sig"))
font = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 20)
title_font = ImageFont.truetype("C:/Windows/Fonts/seguisb.ttf", 29)
small = ImageFont.truetype("C:/Windows/Fonts/segoeui.ttf", 16)
durations = []
for i, scene in enumerate(scenes):
    screenshot = Image.open(root / scene["image"]).convert("RGB")
    width, height = screenshot.size
    crop_height = min(height, int(width * (2.1 if width < 600 else 0.72)))
    top = {"top": 0, "middle": (height - crop_height) // 2,
           "bottom": height - crop_height}[scene["focus"]]
    screenshot = screenshot.crop((0, top, width, top + crop_height))
    screenshot.thumbnail((1160, 530), Image.Resampling.LANCZOS)
    frame = Image.new("RGB", (1280, 720), "#f5f3ec")
    draw = ImageDraw.Draw(frame)
    draw.text((42, 18), f"ZEMNE  /  {i + 1:02d}    {scene['title']}",
              font=title_font, fill="#193a2e")
    x, y = (1280 - screenshot.width) // 2, 70 + (530 - screenshot.height) // 2
    frame.paste(screenshot, (x, y))
    draw.text((42, 622), "Actual live UI captures · edited sequence · fictional demonstration data",
              font=font, fill="#193a2e")
    draw.text((42, 655), "Local synthetic narration · generation wait compressed · tested commit 95992fc",
              font=small, fill="#4d6157")
    still = work / f"{i}.png"
    frame.save(still)
    with wave.open(str(work / f"{i}.wav")) as audio:
        duration = audio.getnframes() / audio.getframerate() / 1.05 + 0.45
    durations.append(duration)
    subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-loop", "1",
                    "-framerate", "15", "-i", str(still), "-i", str(work / f"{i}.wav"),
                    "-t", str(duration), "-vf", "format=yuv420p", "-c:v", "libx264",
                    "-preset", "fast", "-crf", "24", "-c:a", "aac", "-b:a", "96k",
                    "-af", "atempo=1.05,apad", str(work / f"{i}.mp4")], check=True)
(work / "concat.txt").write_text("".join(f"file '{i}.mp4'\n" for i in range(len(scenes))))
subprocess.run([ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0",
                "-i", str(work / "concat.txt"), "-c", "copy", "-movflags", "+faststart",
                str(root / "zemne-walkthrough.mp4")], check=True)
elapsed = 0
subtitles = []
def stamp(seconds):
    millis = round(seconds * 1000)
    return f"{millis // 3600000:02}:{millis // 60000 % 60:02}:{millis // 1000 % 60:02},{millis % 1000:03}"
for i, (scene, duration) in enumerate(zip(scenes, durations)):
    subtitles.append(f"{i+1}\n{stamp(elapsed)} --> {stamp(elapsed+duration)}\n{scene['text']}\n")
    elapsed += duration
(root / "walkthrough.srt").write_text("\n".join(subtitles), encoding="utf-8")
(root / "video-metadata.json").write_text(json.dumps({
    "duration_seconds": elapsed, "resolution": "1280x720", "fps": 15,
    "format": "Edited still-capture walkthrough, not continuous screen recording",
    "narration": "Locally generated Windows System.Speech synthetic voice",
    "scenes": len(scenes), "bytes": (root / "zemne-walkthrough.mp4").stat().st_size,
    "source_commit": "95992fc1cff564bfae041a823a10d2f854520415"
}, indent=2), encoding="utf-8")
print(json.dumps({"duration_seconds": elapsed, "bytes": (root / "zemne-walkthrough.mp4").stat().st_size}))
