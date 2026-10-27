# Garden of Light — ZEMNE redesign

Owner-authorized visual redesign, October 27, 2026. Scope: Codex frontend, architecture, assets and accessibility. Backend routes, shared API contracts, DB, token handling and AI generation are unchanged.

## Design

An enclosed contemporary sanctuary replaces the freestanding pergola. A glazed light court, solid timber-lined ceiling and central rooflight frame a long memorial axis. Honed pale stone, smoked oak, olive upholstery and satin bronze provide contrast without decorative memorial clichés. Custom bench profiles, lathed lecterns, curved book pages, ceramic vessels, foliage, flowers and engraved destinations are modeled in Blender; this is an original room, not a downloaded model.

The neutral framed relief is original abstract artwork, not a portrait of a real person. The existing ZEMNE logo, favicon and metadata are retained. Newsreader and DM Sans are locally hosted under their included OFL licenses. Forest, ivory and restrained bronze extend through creation, organizer, forms and source dialogs.

The landing page uses matching Cycles stills from this exact model. Entering the hall loads actual glTF geometry in R3F, with raycast interactions on the guestbook, lectern and memory wall. Stills never replace interactive WebGL. `/experience` uses the existing fictional P6 memorial through real APIs; `/demo` remains an explicitly labeled development fixture preview. There is no simulated production endpoint.

## Asset pipeline and provenance

- Source: `scripts/3d/build-sanctuary.py`, deterministic seed 17; Blender 4.5.15 LTS downloaded from the [official Blender release directory](https://download.blender.org/release/Blender4.5/) with published SHA-256 verification.
- Maps: Poly Haven oak_wood_planks, beige_wall_001, marble_01, studio_small_09 HDR, under [CC0](https://polyhaven.com/license). Exact map URLs and checksums: `public/3d/material-provenance.json`. No Poly Haven preview renders or branding are used.
- Geometry and material compression: [glTF Transform CLI](https://gltf-transform.dev/cli) 4.5.1, Meshopt and WebP, preserving destination extras. CLI tooling is outside the application dependency tree.
- `public/3d/sanctuary-mobile.glb`: **876,964 bytes**, 22 meshes / 22 primitives, **60,449 actual triangles**, nine embedded 1K image maps. Original source export: 6,384,472 bytes. No remote texture URLs.
- HDR: 1,615,248 bytes. Combined model + HDR: **2,492,212 bytes** before HTTP overhead. WebP reduces transfer size; it is not a GPU block-compressed texture format.
- Cycles stills: entrance 1600×1050; destination cards 1000×800. Static marketing images use Next Image responsive delivery.
- Render policy: demand frames, capped DPR 1.25, one 1024 shadow map, no SSAO/bloom/physics/avatars. Runtime glazing uses inexpensive alpha instead of refraction. Camera movement is bounded and snaps for reduced motion.

Rebuild (PowerShell; choose local tool paths):

```powershell
./scripts/3d/fetch-materials.ps1 -Destination C:/local/zemne-maps
& C:/local/blender/blender.exe -b --python scripts/3d/build-sanctuary.py -- --root $PWD --materials C:/local/zemne-maps
# Run glTF Transform 4.5.1 from your local tooling installation:
gltf-transform optimize public/3d/sanctuary.glb public/3d/sanctuary-mobile.glb --compress meshopt --texture-compress webp --texture-size 1024 --simplify false --join false --flatten false --palette false --instance false
node scripts/3d/inspect-model.mjs
# Keep the raw source export outside the deployed public directory after optimizing.
```

## Accessibility and interactions

Persistent labeled controls are equivalent to every physical destination. On mobile, controls stay in the thumb zone; selection focuses the reading/form panel, and Return to sanctuary restores the room. Tribute composition is a full-width reading surface. Successful submission focuses its receipt heading. The source dialog uses native modal focus handling. Reduced motion disables interpolation and image-hover movement. A manual 2D toggle, load error boundary and WebGL context-loss fallback preserve all DOM forms and actions.

No percentage is invented: the room download reports real loaded/total bytes. No secret links or configuration values appear in screenshots. The existing consent, synthetic-only notice, approval filtering, claim-fragment cleanup and genuine AI error states remain.

## Validation and limits

See tracker addendum and `docs/evidence/redesign/` for current command results and captures. Before images are historical P2/P6 evidence, copied with their original filenames recorded below; they are not new captures of the old branch. After images are actual browser screenshots of this redesign; Cycles asset renders are separately identified.

- Before landing: `docs/evidence/p2/landing-desktop.png` and `landing-mobile-390.png`.
- Before room: historical P6 mobile room capture copied as `before-hall-mobile.png`.
- Browser: desktop 1440px, mobile 375px and 390px. This is desktop viewport emulation, **not physical iPhone/Android GPU testing**.
- Direct modeled lectern and memory-wall clicks opened their real frontend actions; approved fixture source opened in a modal. A synthetic mobile tribute submission produced pending feedback. These preview checks do not prove a fresh production Gemma/Atlas round trip.
- Hardware/browser endurance and forced context-loss testing remain required. The fallback text in a canvas accessibility subtree is not evidence of a real GPU context loss.
- Lighting: Cycles stills have offline indirect illumination. Runtime uses environment and direct lighting; **no baked GI or AO** is claimed. The result is a materially richer architectural WebGL scene, not verified photorealism across devices.
- Local real-API showcase requires MongoDB/session configuration. The public showcase depends on the existing synthetic P6 memorial remaining available in Atlas; API errors are explicit, never replaced by fixture content.
- No deployment is implied by local screenshots or successful build. Antigravity must repeat the live lifecycle and device checks on the deployed revision before acceptance.

Standard final npm test result: 203 passed, nine live tests skipped, one Claude-owned health-route import timeout at 5 seconds (BUG-P7-03). The longer-timeout diagnostic run passed 204; the default-command issue remains open.
