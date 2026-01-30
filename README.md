### Tracking Timer (YouTrack App)

A lightweight widget for YouTrack that lets you start/stop a timer on an issue and quickly save the tracked time as a work item.

#### Features
- Start/stop timer directly from an issue.
- Save elapsed time to a work item in one click.
- Visible on issues of type `Task` (configurable via manifest guard).

#### Requirements
- Node.js v18 (see `.nvmrc`)
- YouTrack permissions to read and write issues and work items

#### Quick start (development)
```bash
npm install
npm run dev
```
This runs the app with Vite and React. The widget source lives under `src/widgets/simple-timer` and is built into `dist/`.

#### Build & package
```bash
npm run build     # type-check + production build
npm run pack      # produces time-tracking-app.zip from dist/
```

#### Upload to YouTrack
After `npm run build`, either:
- `npm run upload` to upload the built app using YouTrack Apps Tools, or
- In YouTrack: Settings → Apps → Upload app → select the `dist/` folder or the generated ZIP.

Once installed, add the widget to the Issue panel. It appears in the first field panel area (`ISSUE_FIELD_PANEL_FIRST`).

#### Scripts
- `dev` — start Vite dev server
- `build` — type-check and build to `dist/`
- `pack` — zip the build output
- `upload` — upload the app to YouTrack

#### License
Apache 2.0 — see `LICENSE.txt`.
