# 3D Livery Previewer

A web-based 3D vehicle livery previewer built with React, Three.js, and Tailwind CSS.

## Features

- **3D Model Viewing**: Load and view police/emergency vehicle GLB models with orbit controls
- **Color Customization**: Change vehicle body color with a color picker
- **Livery Textures**: Upload custom decal textures for specific panels (Left, Right, Top, Front, Back)
- **ELS Support**: Emergency Lighting System pattern playback
- **Screenshot Capture**: Export preview images
- **Dark Theme UI**: Modern, clean interface

## Installation

```bash
cd previewer
pnpm install
pnpm run dev
```

## Usage

1. **Select a Model**: Choose from the library or upload your own .glb file
2. **Change Color**: Use the color picker to customize the vehicle body color
3. **Upload Livery**: Add texture decals to specific panels
4. **ELS Patterns**: Input JSON pattern data for emergency lights
5. **Capture**: Take a screenshot of your livery

## Technical Stack

- **React 18** - UI framework
- **Three.js** - 3D rendering
- **Tailwind CSS v4** - Styling
- **Vite** - Build tool
- **Lucide React** - Icons

## Model Requirements

GLB models should use specific material naming conventions for body panels:
- `Right1`, `Right2`, etc. - Right side panels
- `Left1`, `Left2`, etc. - Left side panels
- `Top1`, `Top2`, etc. - Roof panels
- `Front1`, `Front2`, etc. - Front panels
- `Back1`, `Back2`, etc. - Rear panels
- `NoDecal1`, etc. - Other paintable surfaces

Materials with these prefixes will be colored when using the color picker.

## License

MIT