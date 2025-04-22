# Physics Engine Simulation

A web-based physics engine simulation built with TypeScript, SCSS, and HTML5 Canvas.

## Features

- 2D physics simulation with circles and boxes
- Adjustable gravity, friction, and elasticity
- Add objects dynamically
- Collision detection and response
- Controls panel for easy interaction

## Development

### Prerequisites

- Node.js and npm installed

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

This will compile the TypeScript and SCSS files, watch for changes, and start a live server.

### Build

To build the project for production:

```bash
npm run build
```

This will compile the TypeScript files to JavaScript and SCSS to CSS in the `dist` directory.

## GitHub Pages Deployment

This project is automatically deployed to GitHub Pages using GitHub Actions. When you push to the main branch, the workflow defined in `.github/workflows/static.yaml` will:

1. Compile TypeScript to JavaScript
2. Compile SCSS to CSS
3. Deploy the site to GitHub Pages

## License

MIT 