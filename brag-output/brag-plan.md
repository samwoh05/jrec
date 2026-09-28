# Brag plan: Jensen × After Work Haus

## Answers
- **What is it?** A portfolio site for Jensen (photographer, filmmaker, rider) that doubles as the pitch for his media agency, After Work Haus.
- **Who is it for?** Brands, crews and event organisers who want photo and film shot after hours. The site shows them the work and gets them to book.
- **What sets it apart?** The whole site is one evening. Every section is stamped with a time (17:00 → 20:59), and a clock in the nav runs from 17:00 to 21:00 as you scroll. The hero is a camera viewfinder with REC and a running timecode.
- **Most impressive / funniest claim:** "Nine-to-five pays the bills. *Five-to-nine* is where the good stuff happens." The agency's own line: "Our 5–9 after the 9–5."
- **Visual hook:** night riders on headlights, framed in a viewfinder, as "JENSEN" rises letter by letter.
- **Real UI to show:** the hero, filtering Stills to Automotive, opening the photo viewer, the letterboxed film opening full-frame, the light "Haus" section, and "Last call".
- **Tone:** cinematic (inferred): nocturnal, trailer-scale type, cuts on the beat, one colour wipe.
- **Share caption:** "Built a portfolio for Jensen and his agency @afterworkhaus that runs on his hours. The clock in the nav goes from 17:00 to 21:00 as you scroll."

## Angle
**"The 5–9, in 21 seconds."** The video runs on the site's own clock. The real nav stays on screen the whole time: its TC clock advances scene by scene (17:00 → 18:30 → 19:15 → 20:00 → 20:59), and the last musical hit lands exactly as it flips to **21:00 · Clocked out**.

## Format
Landscape 1920×1080, 30fps, 21.25s. Music at 96 BPM (beat 0.625s), so every cut lands on a beat.

## Storyboard

| # | Time | Scene | On screen | Motion / transition | Sound |
|---|---|---|---|---|---|
| 1 | 0.00–3.125 | **Hook: the hero** | Night-ride video, viewfinder corners, REC + timecode from 17:00:00:00, kicker "PHOTOGRAPHER / FILMMAKER / RIDER", **JENSEN** | Corners draw in; letters rise and settle on beat 2 (1.25s); lede and CTAs fade in; slow push-in; ticker drifts | Clock ticks + low drone, sub hit as JENSEN lands |
| 2 | 3.125–6.25 | **The idea** | Stamp "17:00 CLOCK OUT"; "Nine-to-five pays the bills." then "*Five-to-nine* is where the good stuff happens."; rider photo on the right | Orange ticker-colour wipe in; lines rise (line 1 in by 3.4s, line 2 by 4.05s); photo curtain reveal | Groove starts: kick + bass pulse |
| 3 | 6.25–10.0 | **Stills** | "18:30 STILLS (12)", filter chips, masonry of photos | Cursor clicks **Automotive** (7.4s); count → (3); grid swaps to 3 cars; click the R34 → viewer zooms in: "TAILLIGHT RED · AUTOMOTIVE · FR.022" | Full groove; soft shutter on the clicks |
| 4 | 10.0–13.125 | **Motion** | "19:15 MOTION"; 2.39:1 reel playing; "TWO WHEELS, *one take*"; Pause preview; play disc | Curtain reveal; cursor clicks Play (11.8s); letterbox opens to full frame | Riser building into the drop |
| 5 | 13.125–16.875 | **The Haus** | Bone background: **AFTER / WORK / HAUS**, spinning 5–9 badge, "Our *5–9* after the 9–5.", the five services | Bone panel wipes up ("lights on"); lockup slams one line per 8th note; badge scales in; services appear one by one | Drop: big hit, brighter chords |
| 6 | 16.875–21.25 | **Last call → clocked out** | "20:59 LAST CALL"; "GOT SOMETHING THAT *moves?*"; talkafterwork@gmail.com; @afterworkhaus; sunset rider | Lines rise; at 20.0s the nav clock flips to **21:00**, the REC dot goes out, and "21:00 · CLOCKED OUT" stamps in; hold | Breakdown → riser → final hit on 21:00, tail rings out; ticking stops |

Durations: 3.125 + 3.125 + 3.75 + 3.125 + 3.75 + 4.375 = **21.25s**.

## Visual identity (from the site's CSS)
- Colours: asphalt `#0B0A09`, bone `#F1EBE1` / `#EEE7DC`, taillight `#FF4B1F`, accent ink `#B8300B`.
- Type: Archivo (expanded 900 for display), Instrument Serif italic for single words, JetBrains Mono for stamps and HUD.
- Reuses the site's real stylesheet, markup classes, images and both videos.

## Readability
Every line meant to be read is fully visible for at least 0.3s per word: line 1 of the statement for 2.85s and line 2 for 2.2s; "Taillight Red" for 0.9s; the tagline for 2.3s; the outro title for 4s.

## Sound
One piece in D minor at 96 BPM, synthesised in numpy and mixed with ffmpeg. The "clock" is a soft ticking hi-hat that stops at 21:00. Hits are tuned to D; the shutter clicks and whooshes sit under the music.

## Note
All photos and video are placeholder stock (Pexels) until Jensen's own work goes in. Re-render after the swap before posting this anywhere as his portfolio.
