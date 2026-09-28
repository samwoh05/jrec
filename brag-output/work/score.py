"""Score for the Jensen brag video: D minor, 96 BPM, one piece with its SFX.

The "clock" (tick-tock on 8ths, 16th hats in the groove) runs from frame 0 and stops dead
at 20.0s when the nav clock flips to 21:00 on the final hit.
Writes work/score_raw.wav (48 kHz stereo); ffmpeg does the final loudness pass.
"""
import numpy as np, wave, os

SR = 48000
DUR = 22.0
N = int(SR * DUR)
B = 60 / 96                      # one beat = 0.625s
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), 'score_raw.wav')

HZ = dict(A1=55.0, Bb1=58.27, C2=65.41, D1=36.71, D2=73.42, F2=87.31, A2=110.0, Bb2=116.54,
          C3=130.81, Cs3=138.59, D3=146.83, E3=164.81, F3=174.61, G3=196.0, A3=220.0,
          C4=261.63, D4=293.66, E4=329.63, F4=349.23, A4=440.0, D5=587.33, A5=880.0, D6=1174.66)

def T(n): return np.arange(n) / SR
def S(sec): return int(round(sec * SR))

# ---------- spectral filters (whole-signal, zero-phase) ----------
def filt(x, lo=None, hi=None, order=2):
    X = np.fft.rfft(x, axis=0)
    f = np.fft.rfftfreq(x.shape[0], 1 / SR)
    g = np.ones_like(f)
    if hi: g /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo: g /= np.sqrt(1 + (lo / np.maximum(f, 1e-6)) ** (2 * order))
    if x.ndim == 2: g = g[:, None]
    return np.fft.irfft(X * g, n=x.shape[0], axis=0)

def stereo(x, pan=0.0):
    a = (pan + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], axis=1)

def place(buf, x, at, gain=1.0):
    i = S(at)
    if i >= buf.shape[0]: return
    x = x[: buf.shape[0] - i]
    buf[i:i + x.shape[0]] += x * gain

def env(n, a=0.005, r=0.1, hold=None, curve=4.0):
    e = np.ones(n)
    na = max(1, S(a))
    e[:na] = np.linspace(0, 1, na)
    if hold is None:  # exponential decay after attack
        tt = T(n - na)
        e[na:] = np.exp(-tt * curve / max(r, 1e-3))
    else:
        nh = S(hold); nr = max(1, S(r))
        e[na + nh:] = 0
        if nh >= nr: e[na + nh - nr: na + nh] = np.linspace(1, 0, nr)
    return e

def saw(f, n, harm=28, roll=1.35, phase=None):
    tt = T(n); x = np.zeros(n)
    ph = rng.uniform(0, 2 * np.pi) if phase is None else phase
    for k in range(1, harm + 1):
        if f * k > 14000: break
        x += np.sin(2 * np.pi * f * k * tt + ph * k) / k ** roll
    return x

# ---------- stems ----------
pad = np.zeros((N, 2)); bass = np.zeros((N, 2)); drums = np.zeros((N, 2))
tick = np.zeros((N, 2)); fx = np.zeros((N, 2)); hits = np.zeros((N, 2))

# Pad: warm detuned saws, chords change on the scene cuts
chords = [
    (0.00, 3.125, ['D3', 'F3', 'A3'], 0.55),
    (3.125, 4.6875, ['D3', 'F3', 'A3'], 0.8), (4.6875, 6.25, ['Bb2', 'D3', 'F3'], 0.8),
    (6.25, 8.125, ['F3', 'A3', 'C4'], 0.85), (8.125, 10.0, ['C3', 'E3', 'G3'], 0.85),
    (10.0, 11.5625, ['D3', 'F3', 'A3'], 0.85), (11.5625, 13.125, ['Bb2', 'D3', 'F3'], 0.9),
    (13.125, 15.0, ['F3', 'A3', 'C4', 'F4'], 1.0), (15.0, 16.875, ['C3', 'E3', 'G3', 'C4'], 1.0),
    (16.875, 18.4375, ['Bb2', 'D3', 'F3'], 0.85), (18.4375, 20.0, ['A2', 'Cs3', 'E3'], 0.95),
    (20.0, 22.0, ['D3', 'F3', 'A3', 'E4'], 1.1),
]
for (a, b, notes, lvl) in chords:
    n = S(b - a + 0.6)
    e = np.ones(n); na = S(0.25 if a > 0 else 0.6); nr = S(0.6)
    e[:na] = np.linspace(0, 1, na) ** 1.5; e[-nr:] *= np.linspace(1, 0, nr)
    for nt in notes:
        for cents, pan in ((-8, -0.6), (0, 0.0), (8, 0.6)):
            x = saw(HZ[nt] * 2 ** (cents / 1200), n) * e * lvl
            place(pad, stereo(x, pan), a, 0.066)
pad = filt(pad, lo=110, hi=2600, order=2)

# Kick-driven pump for pad + bass
kicks = [k * B for k in range(5, 27)]            # 3.125 .. 16.25 (4-on-floor, drops out for the breakdown)
pump = np.ones(N)
for k in kicks:
    i = S(k); n = S(0.45)
    pump[i:i + n] *= 1 - 0.45 * np.exp(-T(n) / 0.11)

# Bass: 8th pulses on the roots through the groove, long notes in the breakdown
roots = [(3.125, 4.6875, 'D2'), (4.6875, 6.25, 'Bb1'), (6.25, 8.125, 'F2'), (8.125, 10.0, 'C2'),
         (10.0, 11.5625, 'D2'), (11.5625, 13.125, 'Bb1'), (13.125, 15.0, 'F2'), (15.0, 16.875, 'C2')]
for (a, b, nt) in roots:
    t0 = a
    while t0 < b - 1e-6:
        n = S(0.29); tt = T(n); f = HZ[nt]
        x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(4 * np.pi * f * tt) + 0.12 * np.sin(6 * np.pi * f * tt)
        x = np.tanh(1.6 * x) * env(n, a=0.004, hold=0.29 - 0.004, r=0.07)
        place(bass, stereo(x), t0, 0.12)
        t0 += B / 2
for (a, b, nt) in ((16.875, 18.4375, 'Bb1'), (18.4375, 20.0, 'A1')):
    n = S(b - a); tt = T(n); f = HZ[nt]
    x = np.tanh(1.3 * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)))
    e = np.ones(n); e[:S(.08)] = np.linspace(0, 1, S(.08)); e[-S(.1):] = np.linspace(1, 0, S(.1))
    place(bass, stereo(x * e), a, 0.10)
bass = filt(bass, hi=900)
pad *= pump[:, None]; bass *= pump[:, None]

# Kick
def kick_sample(big=False):
    n = S(0.55 if big else 0.4); tt = T(n)
    f = 45 + 95 * np.exp(-tt / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-tt / (0.22 if big else 0.14))
    click = rng.normal(0, 1, n) * np.exp(-tt / 0.003) * 0.25
    return np.tanh(1.4 * (x + filt(click, lo=1500)))
for k in kicks:
    place(drums, stereo(kick_sample()), k, 0.55)

# Clap on 2 & 4 through the groove
def clap_sample():
    n = S(0.35); tt = T(n); x = np.zeros(n)
    for d in (0, 0.011, 0.023):
        i = S(d); m = n - i
        x[i:] += rng.normal(0, 1, m) * np.exp(-T(m) / (0.012 if d < 0.02 else 0.09))
    return filt(x, lo=900, hi=5000)
for k in range(11, 27, 2):
    place(drums, stereo(clap_sample(), 0.05), k * B, 0.13)

# The clock: tick-tock blips on 8ths (in key: A5 / D6), 16th noise hats in the groove
def tickblip(f, loud):
    n = S(0.06); tt = T(n)
    x = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.012)
    nz = filt(rng.normal(0, 1, n) * np.exp(-tt / 0.006), lo=5000)
    return (0.6 * x + 0.5 * nz) * loud
eighth = B / 2
k = 0; t0 = 0.0
while t0 < 20.0 - 1e-6:
    groove = 6.25 <= t0 < 16.875
    brk = t0 >= 16.875
    loud = 0.8 if t0 < 3.125 else 0.35 if groove else 0.55 + 0.45 * (t0 - 16.875) / 3.125 if brk else 0.45
    place(tick, stereo(tickblip(HZ['D6'] if k % 2 == 0 else HZ['A5'], loud), -0.35 if k % 2 == 0 else 0.35), t0, 0.07)
    k += 1; t0 += eighth
t0 = 6.25; k = 0
while t0 < 16.875 - 1e-6:
    n = S(0.045); tt = T(n)
    x = filt(rng.normal(0, 1, n), lo=7000) * np.exp(-tt / (0.02 if k % 4 == 2 else 0.009))
    place(tick, stereo(x, 0.25), t0, 0.05 if k % 2 else 0.028)
    k += 1; t0 += B / 4

# Arp: quiet 8th-note plucks on the chord tones through the groove (mid/high movement)
arp = np.zeros((N, 2))
arp_notes = [(6.25, 8.125, ['F4', 'A4', 'C4', 'A4']), (8.125, 10.0, ['C4', 'E4', 'G3', 'E4']),
             (10.0, 11.5625, ['D4', 'F4', 'A3', 'F4']), (11.5625, 13.125, ['D4', 'F4', 'A3', 'F4']),
             (13.125, 15.0, ['F4', 'A4', 'C4', 'A4']), (15.0, 16.875, ['E4', 'G3', 'C4', 'E4'])]
HZ.update(G3=196.0)
for (a, b, seq) in arp_notes:
    t0 = a; k = 0
    while t0 < b - 1e-6:
        f = HZ[seq[k % len(seq)]] * 2
        n = S(0.3); x = saw(f, n, harm=10, roll=1.6) * np.exp(-T(n) / 0.07)
        place(arp, stereo(x, -0.3 if k % 2 else 0.3), t0, 0.030)
        k += 1; t0 += B / 2
arp = filt(arp, lo=300, hi=4200)
d = S(B * 0.75)
echo = np.zeros_like(arp); echo[d:, 1] += arp[:-d, 0] * 0.45; echo[d:, 0] += arp[:-d, 1] * 0.45
echo[2 * d:, 0] += arp[:-2 * d, 0] * 0.2; echo[2 * d:, 1] += arp[:-2 * d, 1] * 0.2
arp = (arp + filt(echo, hi=3000)) * pump[:, None]

# ---------- FX ----------
def whoosh(dur, lo, hi, peak_at):
    n = S(dur); tt = T(n)
    x = filt(rng.normal(0, 1, n), lo=lo, hi=hi, order=1)
    p = S(peak_at)
    e = np.zeros(n); e[:p] = (np.linspace(0, 1, p)) ** 2.2; e[p:] = np.exp(-T(n - p) / 0.06)
    return x * e
def riser(dur, f0, f1):
    n = S(dur); tt = T(n)
    f = f0 * (f1 / f0) ** (tt / dur)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.35
    nz = filt(rng.normal(0, 1, n), lo=1200, hi=9000, order=1) * 0.6
    e = (tt / dur) ** 2.6
    return (tone + nz) * e
def click(bright=True):
    n = S(0.03); tt = T(n)
    x = filt(rng.normal(0, 1, n), lo=2500 if bright else 1200, hi=9000) * np.exp(-tt / 0.0025)
    x += np.sin(2 * np.pi * HZ['A5'] * 2 * tt) * np.exp(-tt / 0.006) * 0.25
    return x
def shutter():
    n = S(0.14); x = np.zeros(n)
    for d, g in ((0.0, 1.0), (0.052, 0.7)):
        i = S(d); m = S(0.03)
        x[i:i + m] += filt(rng.normal(0, 1, m), lo=1800, hi=7000) * np.exp(-T(m) / 0.004) * g
    return x

place(fx, stereo(riser(1.05, 110, 440), 0.0), 0.20, 0.13)                    # swell into JENSEN
place(fx, stereo(whoosh(0.5, 300, 5000, 0.42), 0.0), 2.70, 0.16)            # orange wipe
place(fx, stereo(click(), 0.2), 7.30, 0.22)                                  # chip click
place(fx, stereo(shutter(), 0.1), 8.58, 0.30)                                # photo opens: shutter
place(fx, stereo(click(False), 0.2), 11.66, 0.22)                            # play
place(fx, stereo(riser(1.25, 180, 720), 0.0), 11.875, 0.20)                  # into the Haus
place(fx, stereo(riser(1.25, 146.8, 587.3), 0.0), 18.75, 0.22)               # into 21:00
place(fx, stereo(whoosh(0.35, 200, 2500, 0.3), -0.1), 16.60, 0.10)           # cut to dark

# ---------- hits (tuned to D) ----------
def boom(f=HZ['D1'], dur=1.6):
    n = S(dur); tt = T(n)
    ff = f + f * 1.2 * np.exp(-tt / 0.05)
    x = np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-tt / (dur / 3.2))
    return np.tanh(1.8 * x)
def stab(notes, dur=1.4, lvl=1.0):
    n = S(dur); x = np.zeros(n)
    for nt in notes:
        for c in (-6, 6):
            x += saw(HZ[nt] * 2 ** (c / 1200), n, harm=20, roll=1.2)
    return filt(x * env(n, 0.003, dur, curve=4.5), hi=3200) * lvl
def crash(dur=1.8):
    n = S(dur); tt = T(n)
    return filt(rng.normal(0, 1, n), lo=4000, hi=12000, order=1) * np.exp(-tt / (dur / 4.5))
def impact():
    n = S(0.25); tt = T(n)
    return filt(rng.normal(0, 1, n), hi=1800) * np.exp(-tt / 0.05)

# JENSEN lands (1.25s)
place(hits, stereo(boom(dur=1.3)), 1.25, 0.42); place(hits, stereo(impact()), 1.25, 0.25)
place(hits, stereo(stab(['D3', 'A3'], 1.2, 0.5)), 1.25, 0.05)
# Lights on: the Haus (13.125s)
place(hits, stereo(boom(HZ['F2'] / 2, 1.2)), 13.125, 0.38); place(hits, stereo(crash(2.0), 0.15), 13.125, 0.09)
place(hits, stereo(stab(['F3', 'A3', 'C4', 'F4'], 1.2, 0.7)), 13.125, 0.05); place(hits, stereo(impact()), 13.125, 0.22)
# 21:00, clocked out (20.0s)
place(hits, stereo(boom(dur=2.0)), 20.0, 0.55); place(hits, stereo(impact()), 20.0, 0.3)
place(hits, stereo(crash(2.2), -0.1), 20.0, 0.11)
place(hits, stereo(stab(['D3', 'F3', 'A3', 'E4'], 2.0, 1.0)), 20.0, 0.07)

# ---------- space: one shared room ----------
def ir(sec=2.2, decay=0.45, seed=3):
    r = np.random.default_rng(seed); n = S(sec); tt = T(n)
    L = r.normal(0, 1, n) * np.exp(-tt / decay); R = r.normal(0, 1, n) * np.exp(-tt / decay)
    h = filt(np.stack([L, R], axis=1), lo=200, hi=5500)
    return h / np.sqrt((h ** 2).sum(axis=0))
def reverb(x, h):
    L = x.shape[0] + h.shape[0]; nfft = 1 << (L - 1).bit_length()
    y = np.stack([np.fft.irfft(np.fft.rfft(x[:, c], nfft) * np.fft.rfft(h[:, c], nfft), nfft)[: x.shape[0]] for c in range(2)], axis=1)
    return y
H = ir()
send = 0.30 * pad + 0.25 * drums * np.array([0, 1]) + 0.35 * tick + 0.35 * fx + 0.45 * hits + 0.35 * arp
wet = reverb(send, H) * 0.55

mix = 1.0 * pad + 1.0 * bass + 0.9 * drums + 0.8 * tick + 0.9 * fx + 1.0 * hits + 1.0 * arp + wet
mix = filt(mix, lo=28)
# gentle bus glue, then fade the very end so nothing clicks
mix = np.tanh(mix * 1.25) / 1.25
fade = np.ones(N); nf = S(0.6); end = S(21.2667)
fade[end - nf:end] = np.linspace(1, 0, nf) ** 1.5; fade[end:] = 0
mix *= fade[:, None]
mix = mix[:end]
mix /= np.max(np.abs(mix)) + 1e-9
mix *= 10 ** (-1.0 / 20)

with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print('wrote', OUT, f'{mix.shape[0] / SR:.3f}s')
