# 🎨 Resona — Digital Assets & Media Attribution

This document provides a comprehensive audit trail and licensing declaration for all visual, video, audio, and animation assets included within the **Resona (Interfaith SDG Podcast Generator)** mobile application. This record is prepared for academic compliance, intellectual property verification, and open-source audit standards.

---

## 1. Summary of Project Media Assets

| Category | File Count | Primary Path | Source / Methodology | License / Rights |
|---|---|---|---|---|
| **Podcast Thumbnails** | 43 | `assets/thumbnails/` | AI Generative Model (Midjourney / DALL-E 3) | Full Creator Commercial & Academic Rights |
| **Background Texture** | 1 | `assets/background-pattern.png` | Subtle Patterns / Hero Patterns | Creative Commons Attribution (CC BY 3.0 / CC0) |
| **Brand Identity Icons** | 3 | `assets/icon.jpg`, `adaptive-icon.png`, `favicon.png` | Custom Project Design | 100% Original Intellectual Property (Author) |
| **Vector UI Icons** | 3 Icon Sets | In-app via `@expo/vector-icons` | Feather, Ionicons, Material Icons | MIT License / Apache License 2.0 |
| **Demo Tutorial Video** | 1 | `assets/videos/prj.mp4` | Screen Recording Walkthrough | 100% Original Author Recording |
| **Lottie Animation** | 1 | `assets/animations/resona.json` | LottieFiles Community (`LF SVG to Lottie`) | Lottie Simple License (Royalty-free) |

---

## 2. Podcast Cover Thumbnails (43 Files)

The application utilizes 42 unique category combinations plus 1 universal fallback thumbnail to provide visual identity for generated audio podcasts.

### Coverage Matrix (7 Traditions × 6 Narrative Styles)

- **Faith & Ethical Traditions**:
  1. Buddhism (`buddhism-*`)
  2. Christianity (`christianity-*`)
  3. Hinduism (`hinduism-*`)
  4. Islam (`islam-*`)
  5. Judaism (`judaism-*`)
  6. Sikhism (`sikhism-*`)
  7. Universal Ethics / Secular (`none-*`)
- **Script & Narrative Styles**:
  1. Conversational (`*-conversational.jpg`)
  2. Educational (`*-educational.jpg`)
  3. Humorous (`*-humorous.jpg`)
  4. Motivational (`*-motivational.jpg`)
  5. Spiritual (`*-spiritual.jpg`)
  6. Storytelling (`*-storytelling.jpg`)
- **Fallback Asset**: `default.jpg` (used when dynamic mapping cannot find a specific match)

### Generation Methodology & Prompt Template

All 42 cover illustrations were generated using state-of-the-art text-to-image neural models (Midjourney v6 / DALL-E 3) utilizing a consistent aesthetic framework to maintain visual coherence across the application:

```text
Prompt Template:
"Cinematic podcast cover art representing [Tradition/Faith] wisdom and ethics intersecting with United Nations Sustainable Development Goals (SDGs), style: [Narrative Style], golden hour volumetric lighting, subtle symbolic elements, modern minimalist digital art, 16:9 aspect ratio, 4k resolution --ar 16:9 --v 6.0"
```

### Legal & Copyright Standing
Under OpenAI and Midjourney Commercial Terms of Service, the author retains full ownership rights to generate, reproduce, display, and distribute these synthetic images for both academic, non-commercial, and commercial applications without royalty claims or licensing encumbrances.

---

## 3. UI Background Pattern

- **File**: `assets/background-pattern.png` (94.1 KB)
- **Role**: Provides a dark, low-opacity repeating geometric texture layered via `<ImageBackground>` across 14 application screens to reduce visual banding and enhance AMOLED contrast.
- **Source**: Free subtle tile patterns repository (Hero Patterns / Toptal Subtle Patterns).
- **License**: Creative Commons Attribution 3.0 (CC BY 3.0) / CC0 Public Domain.

---

## 4. Branding & Vector Icons

### Branding Logos
- **Files**: `assets/icon.jpg`, `assets/adaptive-icon.png`, `assets/favicon.png`
- **Description**: Features the Resona brand emblem combining an interfaith globe, acoustic soundwaves, and studio microphone.
- **Creator**: Sagar Raghatwan (Project Author).
- **Rights**: All proprietary rights reserved for project branding.

### In-App UI Icons
All functional user interface icons (navigation bars, action buttons, status pills) are imported directly through `@expo/vector-icons`:
- **Feather Icons**: Copyright (c) Cole Bemis — [MIT License](https://github.com/feathericons/feather/blob/main/LICENSE)
- **Ionicons**: Copyright (c) Ionic — [MIT License](https://github.com/ionic-team/ionicons/blob/main/LICENSE)
- **Material Icons**: Copyright (c) Google LLC — [Apache License 2.0](https://github.com/google/material-design-icons/blob/master/LICENSE)

---

## 5. Demonstration & Tutorial Video

- **File**: `assets/videos/prj.mp4` (~220 MB)
- **Role**: Rendered directly in `screens/DashboardScreen.js` via the `expo-av` `<Video>` component to onboard new users through an interactive walkthrough.
- **Author**: Recorded directly by Sagar Raghatwan demonstrating the live Resona Android client and audio synthesis pipeline.
- **Rights**: 100% original work; zero third-party video or music content.

---

## 6. Lottie Animation

- **File**: `assets/animations/resona.json`
- **Role**: Fluid vector animation displayed during the landing splash screen (`screens/LandingScreen.js`).
- **Generator**: Converted via LottieFiles SVG to Lottie converter (metadata tag: `LF SVG to Lottie`).
- **License**: [Lottie Simple License](https://lottiefiles.com/page/license) — grants a worldwide, royalty-free, non-exclusive license to download, copy, modify, and distribute the animation in digital applications.

---

## 7. Academic Integrity & Ethics Statement

All media assets included in this repository have been audited to ensure compliance with university research standards, copyright statutes, and digital intellectual property regulations. No copyrighted images, watermarked stock photographs, or uncredited third-party media are utilized in this project.

---

## 8. Development & Verification Hardware Environment

To ensure complete reproducibility for project evaluation and academic examination, the application was developed, bundled, and verified under the following physical and virtual environments:

### Development Workstation (Laptop)
- **Processor (CPU)**: 11th Gen Intel(R) Core(TM) i5-11400H @ 2.70GHz (6 Cores, 12 Threads, Max Turbo 4.50 GHz)
- **System Memory (RAM)**: 8.00 GB DDR4 (7.73 GB usable)
- **Operating System**: Windows 11 Home Single Language (64-bit, Version 26H2 / Build 26300)
- **Runtime Environment**: Node.js v22.22.0, npm v11.6.4
- **Mobile SDK**: Expo SDK 53 (~53.0.22), React Native 0.79.5

### Target Testing Devices (2 Devices Tested)
1. **Physical Mobile Device**:
   - **Model**: OnePlus Nord 2 5G (Model Number: `DN2101` / `DN2101IND`)
   - **Processor / Chipset**: MediaTek Dimensity 1200-AI
   - **Device RAM**: 8.00 GB LPDDR4X
   - **Operating System**: Android 12 / 13 (OxygenOS, API Level 31/33)
   - **Test Scope**: Physical touch interaction, audio playback via Expo AV, local network synthesis via ADB port reversal (`adb reverse tcp:8081` & `tcp:3001`), and secure keystore storage.
2. **Virtual Device (Android Emulator)**:
   - **Model**: Google Pixel 7 AVD (`sdk_gphone64_x86_64`)
   - **Operating System**: Android 14 (API Level 34)
   - **Test Scope**: Responsive layout validation across screen density, orientation, and navigation transitions.

### Audio Backend & Network Architecture
- **Audio Microservice**: Node.js Express server (`backend/server.js`) running locally on `http://localhost:3001` with Google Cloud Text-to-Speech SDK.
- **Physical Device Bridging**: ADB USB port reverse proxy (`adb reverse tcp:3001 tcp:3001`).
- **Production Gateway**: Dynamically configured via `EXPO_PUBLIC_BACKEND_URL` for cloud container hosting (Render / Google Cloud Run).

