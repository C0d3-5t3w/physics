<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Physics</title>
    <link rel="stylesheet" href="assets/css/global.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>Physics Simulation</h1>
        </header>
        
        <div class="simulation-container">
            <canvas id="physics-canvas"></canvas>
        </div>
        
        <div class="simulation-container">
            <canvas id="fluid-canvas" width="500" height="300"></canvas>
            <div class="simulation-stats" id="fluid-stats"></div>
        </div>
        
        <div class="controls-panel">
            <h2>Controls</h2>
            
            <div class="control-group">
                <label for="gravity">Gravity:</label>
                <input type="range" id="gravity" min="0" max="20" value="9.8" step="0.1">
                <span id="gravity-value">9.8</span>
            </div>
            
            <div class="control-group">
                <label for="friction">Friction:</label>
                <input type="range" id="friction" min="0" max="1" value="0.1" step="0.01">
                <span id="friction-value">0.1</span>
            </div>
            
            <div class="control-group">
                <label for="elasticity">Elasticity:</label>
                <input type="range" id="elasticity" min="0" max="1" value="0.7" step="0.01">
                <span id="elasticity-value">0.7</span>
            </div>
            
            <div class="btn-group">
                <button id="add-ball">Add Ball</button>
                <button id="add-box">Add Box</button>
                <button id="reset">Reset</button>
                <button id="pause">Pause</button>
            </div>
        </div>
    </div>
    
    <!-- Add error handling for script loading -->
    <script>
        // Monitor script loading errors
        window.addEventListener('error', function(e) {
            if (e.target && e.target.tagName === 'SCRIPT') {
                console.error('Error loading script:', e.target.src);
            }
        }, true);
    </script>
    
    <!-- Make sure scripts are loaded with defer to ensure DOM is ready -->
    <script type="module" src="assets/js/physicsEng.js"></script>
    <script type="module" src="assets/js/phyControls.js"></script>
    <script src="assets/js/wasm_exec.js"></script>
    
    <script>
        // Initialize Go WASM
        const go = new Go();
        
        WebAssembly.instantiateStreaming(fetch("assets/wasm/main.wasm"), go.importObject)
            .then((result) => {
                go.run(result.instance);
                console.log("WASM loaded successfully");
                
                // Example usage after WASM is loaded:
                const force = goCalculateGravitationalForce(100, 200, 10, 6.67430e-11);
                console.log("Gravitational force:", force);
                
                const orbit = goCalculateOrbit(5.97e24, 3.84e8, 6.67430e-11);
                console.log("Orbital velocity:", orbit.velocity, "m/s");
                console.log("Orbital period:", orbit.period, "s");
                
                const trajectory = goCalculateProjectileTrajectory(10, 45, 9.8, 0.1, 5);
                console.log("Projectile trajectory:", trajectory);
            }).catch(err => {
                console.error("WASM failed to load:", err);
            });
    </script>
    
    <script>
        // After the WASM is loaded
        document.addEventListener("wasmLoaded", function() {
            // Create a fluid simulation
            const fluidCanvas = document.getElementById("fluid-canvas");
            const fluidStats = document.getElementById("fluid-stats");
            
            // Simulation parameters
            const gridSize = 50;
            const density = 1.0;
            const viscosity = 0.1;
            let time = 0;
            
            // Create initial forces grid (e.g., from mouse input or initial conditions)
            let forces = Array(gridSize).fill().map(() => Array(gridSize).fill(0));
            
            // Add some initial force at the center
            forces[Math.floor(gridSize/2)][Math.floor(gridSize/2)] = 5;
            
            // Animation loop
            function animate() {
                // Calculate fluid flow
                const fluidData = goCalculateFluidFlow(density, viscosity, gridSize, 0.1, forces);
                
                // Update forces for next frame based on calculated velocities
                for (let i = 0; i < gridSize; i++) {
                    for (let j = 0; j < gridSize; j++) {
                        forces[i][j] = fluidData.velocities[i][j];
                    }
                }
                
                // Generate a wave visualization
                time += 0.05;
                const waveData = goSimulateWave(1.0, 2.0, 0.5, 100, time);
                
                // Update the canvas with wave data
                goUpdateDOMElement("fluid-canvas", waveData);
                
                // Update stats
                fluidStats.textContent = `Max Velocity: ${fluidData.maxValue.toFixed(2)}, Min Velocity: ${fluidData.minValue.toFixed(2)}`;
                
                // Continue animation
                requestAnimationFrame(animate);
            }
            
            // Start animation
            animate();
            
            // Example of drag force calculation
            const sphere = {
                velocity: 10, // m/s
                area: 0.5,    // m²
                shape: "sphere"
            };
            
            const dragResult = goCalculateDrag(1.2, sphere.velocity, 0.5, sphere.area, sphere.shape);
            console.log(`Drag force on sphere: ${dragResult.dragForce.toFixed(2)} N`);
        });
    </script>
</body>
</html>
