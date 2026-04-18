# Simple Flasher

A stripped-back firmware flasher built for GitHub Pages.

## What it does

- requires desktop Brave for flashing
- connects directly in flash mode with Web Serial
- supports online firmware selection from `terrafirma2021/MAKCM_v2_files`
- supports offline `.bin` uploads
- forces encrypted flashing on every write
- deploys automatically to GitHub Pages from `main`

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Notes

- Put the device into flash mode before pressing `Connect device`.
- The flasher logic vendors the local `esptool-js` fork from the main website project.
- GitHub Pages deployment is handled by [deploy.yml](./.github/workflows/deploy.yml).
