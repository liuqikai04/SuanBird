# Agent Handoff README

## 1. Project purpose

This project is a Vite frontend tool for:

- uploading a template image
- entering a user prompt or analyzed complaint prompt
- building a template-aware generation prompt
- calling an image generation API
- rendering the returned image
- optionally post-processing the image title
- downloading the final result

The app is designed as a **single shared workflow with per-template strategy switching**.

## 2. Runtime and commands

`package.json`

- `npm run dev`
  Starts the local Vite dev server.
- `npm run build`
  Builds the production bundle into `dist/`.
- `npm run preview`
  Serves the built bundle.
- `npm test`
  Runs the Node test suite in `tests/`.
- `npm run build:single`
  Builds and inlines the app into `dist/index.single.html`.

## 3. Main entrypoints

### UI bootstrap

File: `src/main.js`

- imports styles
- calls `initApp(root)` from `src/app.js`

### UI controller

File: `src/app.js`

Main exported entry:

```js
initApp(root: HTMLElement): void
```

Responsibilities:

- render the full page UI
- let the user upload a template image
- let the user input prompt text
- let the user choose a template profile
- let the user switch between:
  - style-only mode
  - strong template-image reference mode
- preview the final prompt
- call the generation pipeline
- overlay the result title
- support download

## 4. Model API integration

File: `src/config/imageModelConfig.js`

### Current hardcoded config

```js
const API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const API_KEY = "...";
const MODEL_NAME = "doubao-seedream-5-0-260128";
```

Important:

- The API key is currently hardcoded for testing.
- For production, move it behind a backend proxy or environment-based server layer.

### Exported functions

```js
getConfigStatus(): {
  ready: boolean,
  apiUrl: string,
  apiKey: string
}
```

Used by the UI to decide whether generation can start.

```js
getRequestConfig(): {
  apiUrl: string,
  apiKey: string,
  model: string,
  timeoutMs: number
}
```

Used by the request service.

```js
buildImageRequestPayload({
  prompt,
  templateImage,
  fileName,
  useTemplateImage
}): object
```

Current payload shape:

```json
{
  "model": "doubao-seedream-5-0-260128",
  "prompt": "...",
  "size": "2K",
  "response_format": "url",
  "watermark": false,
  "metadata": {
    "template_image_name": "example.png",
    "use_template_image": false
  },
  "image": "data:image/png;base64,..."
}
```

Notes:

- `image` is only attached when `useTemplateImage === true`.
- This keeps style-only and image-reference modes under the same interface.

```js
resolveImageUrlFromResponse(responseJson): string
```

Currently supports:

- `responseJson.image_url`
- `responseJson.url`
- `responseJson.output`
- `responseJson.output[0]`
- `responseJson.data[0].url`
- `responseJson.data[0].b64_json`

If the model provider changes, this is one of the two primary functions to adapt.

## 5. Image generation service

File: `src/services/templateFusionService.js`

### Exported functions

```js
createFusionImage({
  payload,
  resolveImageUrlFromResponse
}): Promise<{
  imageUrl: string,
  raw: object
}>
```

Responsibilities:

- reads request config from `getRequestConfig()`
- performs the POST request
- applies timeout control
- throws on non-2xx responses
- returns:
  - `imageUrl`
  - raw response JSON

```js
fileToDataUrl(file: File): Promise<string>
```

Used to convert uploaded template images into `data:image/...;base64,...`.

```js
triggerImageDownload(imageUrl: string, fileName: string): void
```

Used by the UI download button.

## 6. Prompt composition interface

File: `src/services/promptComposer.js`

### Exported functions

```js
buildTemplateAwarePrompt({
  userPrompt,
  fileName,
  templateProfile
}): string
```

This is the core prompt-builder interface. It combines:

- template intro
- template-wide style summary
- user prompt
- template-specific extra rules
- composition instructions
- final goal statement

```js
inferTitleHint(
  userPrompt,
  fileName,
  templateProfile
): string
```

Used to infer a stable display title from:

1. explicit title text inside the prompt
2. keyword rules
3. file-name fallback rules
4. template default title

## 7. Template profile strategy contract

File: `src/config/templateProfiles.js`

This file is the main extension point for adding new templates.

### Public exports

```js
DEFAULT_TEMPLATE_PROFILE
getTemplateProfile(templateId?: string): TemplateProfile
listTemplateProfiles(): Array<{ id: string, label: string }>
```

### Required shape of a profile

```js
{
  id: string,
  label: string,
  promptIntro: string,
  styleSummary: string[],
  extraRules: string[],
  compositionTemplate(titleHint: string): string,
  goal: string,
  explicitTitlePattern: RegExp,
  titleRules: Array<{
    keywords: string[],
    title: string
  }>,
  fileNameRules: Array<{
    includes: string,
    title: string
  }>,
  defaultTitle: string
}
```

### Current template IDs

```txt
monster-atlas
creature-flashcard
furry-mascot-sheet
pastel-plush-bestiary
```

### Current semantic meaning

- `monster-atlas`
  Black-background, white-icon meme monster atlas.
- `creature-flashcard`
  Animal-mutation encyclopedia card.
- `furry-mascot-sheet`
  Same furry mascot repeated across different situations.
- `pastel-plush-bestiary`
  White-background pastel purple/pink cute complaint creature sheet.

## 8. Result post-processing interface

File: `src/services/resultImagePostprocess.js`

### Exported function

```js
overlayResultTitle(imageUrl: string, title: string): Promise<string>
```

Behavior:

- loads the model result image
- creates a canvas
- draws a black title band at the bottom
- writes a white title in the band
- returns a PNG data URL

Current limitation:

- This post-process is best aligned with the first template.
- Other templates may eventually need their own post-process strategies.

## 9. Browser-side state model

Current UI state in `src/app.js` includes:

```js
{
  templateFile,
  templatePreviewUrl,
  resultUrl,
  finalPrompt,
  resultTitle,
  templateProfile,
  useTemplateImage,
  isLoading,
  errorMessage
}
```

This can be reused if another agent wants to:

- split the app into components
- port to React/Vue
- expose the same logic through another shell

## 10. End-to-end workflow contract

Current browser flow:

1. User uploads template image.
2. User enters prompt text.
3. User selects template profile.
4. App builds `finalPrompt`.
5. App optionally converts the template image to Base64.
6. App builds the request payload.
7. App calls the model API.
8. App resolves the returned image URL.
9. App overlays title text.
10. App renders the result and supports download.

## 11. Test surface

File: `tests/template-fusion-service.test.js`

Current test coverage includes:

- config readiness
- payload building
- style-only payload behavior
- response URL extraction
- base64 response extraction
- unknown response error path
- prompt enhancement behavior
- explicit title preference
- title inference
- template profile registry contract

## 12. Tooling scripts

Folder: `tools/`

Current helper scripts:

- `build-single.mjs`
  Inlines the production build into one HTML file.
- `run-social-style-test.mjs`
- `run-noise-style-test.mjs`
- `run-noise-style-v2-test.mjs`
- `run-second-template-noise-test.mjs`
- `run-third-template-noise-test.mjs`
- `run-fourth-template-noise-test.mjs`

These scripts are used to quickly test one template strategy with a real prompt against the current API.

## 13. Integration guidance for another agent

If another agent needs to add a new template, the minimum path is:

1. Add one new profile object in `src/config/templateProfiles.js`.
2. Register it in `TEMPLATE_PROFILES`.
3. Optionally add one quick test script in `tools/`.
4. Optionally extend `tests/template-fusion-service.test.js`.

If another agent needs to adapt to a new model provider, only these places should change first:

1. `src/config/imageModelConfig.js`
   - config constants
   - `buildImageRequestPayload`
   - `resolveImageUrlFromResponse`
2. optionally `src/services/templateFusionService.js` if auth or transport changes

If another agent needs per-template post-processing, the clean next step is:

1. keep the shared generation pipeline
2. add post-process strategy fields per template profile
3. dispatch the renderer in `src/app.js`

## 14. Known limitations

- API key is hardcoded in the frontend.
- Some PowerShell output in this environment shows mojibake for Chinese, but the actual files are still usable.
- The current UI is plain JS, not componentized.
- Post-processing is still mostly optimized for template 1.
- The model can only approximate template style; stronger template matching may require:
  - template-specific layout post-processing
  - stronger image-edit models
  - server-side orchestration

## 15. Recommended handoff starting points

For UI changes:

- start at `src/app.js`

For template-style changes:

- start at `src/config/templateProfiles.js`
- then check `src/services/promptComposer.js`

For model API changes:

- start at `src/config/imageModelConfig.js`
- then check `src/services/templateFusionService.js`

For output styling changes:

- start at `src/services/resultImagePostprocess.js`
