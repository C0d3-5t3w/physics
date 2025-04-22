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
    
    <script type="module" src="assets/js/physicsEng.js"></script>
    <script type="module" src="assets/js/phyControls.js"></script>
</body>
</html>
