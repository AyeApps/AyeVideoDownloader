# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Creators, developers, audio producers, and digital power-users who need lossless, high-speed media downloads (4K, 1080p, 60fps HDR, MP3 320kbps, lossless WAV) from major platforms without advertising spam, shady redirects, or arbitrary quality compression.

## Product Purpose

AyeVideoDownloader exists to provide an uncompromising, studio-grade multimedia extraction and downloading utility that is fast, transparent, and private. Success is a zero-friction workflow: paste URL, detect authentic streams, choose bitrate/resolution, and download directly.

## Positioning

Unlike mass-market video downloaders cluttered with scam popups, tracking scripts, and downsampled audio, AyeVideoDownloader is a precision tool part of the AyeApps Software Atelier. Powered by an enterprise server-side engine running `yt-dlp` and `ffmpeg`, it preserves original codec bitstreams (AV1, VP9, Opus, AAC) with real-time SSE telemetry.

## Operating Context

Web browser usage on desktop and mobile (`https://video.ayeapps.com`). Often used alongside video editing software, audio workstations, or research archives. Requires authentication via `aye-auth` to manage download history, preferences, and concurrent multi-thread queues.

## Capabilities and Constraints

- Capabilities:
  - Video stream extraction up to 4K / 8K (HDR, 60fps).
  - High-fidelity audio demuxing (MP3 320kbps, WAV, FLAC, M4A).
  - Multi-platform extraction: YouTube, TikTok, Instagram (Reels & Posts), X / Twitter, Facebook, Vimeo, Twitch, Soundcloud.
  - Server-Sent Events (SSE) real-time download and transcoding progress.
  - Centralized single-sign-on (SSO) via `aye-auth` with Google, Apple, and Email.
  - Dark / Light modes matching AyeApps Atelier design tokens.
- Constraints:
  - Requires active session token for interactive tool execution.
  - Public landing page must index cleanly on search engines (SEO, Core Web Vitals, JSON-LD schema, `llms.txt`).

## Brand Commitments

- Name: AyeVideoDownloader (part of AyeApps suite).
- Design System: "The Precision Atelier" — Obsidiana Profunda (`#050505`), Cyber-Amber (`#FE9D01`), Paper White (`#fafafa`), solid drop shadows (`3px 3px 0px 0px`), `.geo-badge`, `.bracket-corners`, and interactive dot matrix.
- Typography: Geist Sans & Geist Mono (JetBrains Mono/Monaco for telemetry).

## Evidence on Hand

- Functional FastAPI backend with `yt-dlp` in `/api`.
- Client-side React 19 downloader app in `/frontend/src/App.jsx`.
- Shared Atelier authentication screen in `/frontend/src/components/AuthScreen.jsx`.
- Interactive dot matrix canvas in `/frontend/src/components/InteractiveDots.jsx`.
- macOS native SwiftUI client in `/AyeVIdeoDownloader`.

## Product Principles

1. Zero Bloat & Zero Deception: No third-party ads, no deceptive fake download buttons.
2. Codec Fidelity: Deliver the exact streams requested without unneeded compression or quality downgrade.
3. Architectural Rigor: Every UI element and interaction adheres to the AyeApps Atelier standards.
4. Transparent Telemetry: Give power users full insight into resolution, codec, and progress.

## Accessibility & Inclusion

- WCAG AA contrast ratio compliance across dark and light palettes.
- Semantic HTML tags (`<h1>`, `<nav>`, `<main>`, `<section>`, `<footer>`).
- `prefers-reduced-motion` fallbacks for all grid and bracket animations.
