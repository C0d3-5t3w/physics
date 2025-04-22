// Import physics engine
import { PhysicsWorld } from './physicsEng';

class PhysicsControls {
    private world: PhysicsWorld;
    private gravitySlider: HTMLInputElement;
    private gravityValue: HTMLSpanElement;
    private frictionSlider: HTMLInputElement;
    private frictionValue: HTMLSpanElement;
    private elasticitySlider: HTMLInputElement;
    private elasticityValue: HTMLSpanElement;
    private addBallBtn: HTMLButtonElement;
    private addBoxBtn: HTMLButtonElement;
    private resetBtn: HTMLButtonElement;
    private pauseBtn: HTMLButtonElement;

    constructor(canvasId: string) {
        // Initialize physics world
        this.world = new PhysicsWorld(canvasId);
        
        // Get control elements
        this.gravitySlider = document.getElementById('gravity') as HTMLInputElement;
        this.gravityValue = document.getElementById('gravity-value') as HTMLSpanElement;
        this.frictionSlider = document.getElementById('friction') as HTMLInputElement;
        this.frictionValue = document.getElementById('friction-value') as HTMLSpanElement;
        this.elasticitySlider = document.getElementById('elasticity') as HTMLInputElement;
        this.elasticityValue = document.getElementById('elasticity-value') as HTMLSpanElement;
        this.addBallBtn = document.getElementById('add-ball') as HTMLButtonElement;
        this.addBoxBtn = document.getElementById('add-box') as HTMLButtonElement;
        this.resetBtn = document.getElementById('reset') as HTMLButtonElement;
        this.pauseBtn = document.getElementById('pause') as HTMLButtonElement;
        
        // Set up event listeners
        this.setupEventListeners();
    }

    setupEventListeners(): void {
        // Gravity slider
        this.gravitySlider.addEventListener('input', () => {
            const value = parseFloat(this.gravitySlider.value);
            this.gravityValue.textContent = value.toFixed(1);
            this.world.setGravity(0, value);
        });
        
        // Friction slider
        this.frictionSlider.addEventListener('input', () => {
            const value = parseFloat(this.frictionSlider.value);
            this.frictionValue.textContent = value.toFixed(2);
            this.world.setGlobalFriction(value);
        });
        
        // Elasticity slider
        this.elasticitySlider.addEventListener('input', () => {
            const value = parseFloat(this.elasticitySlider.value);
            this.elasticityValue.textContent = value.toFixed(2);
            this.world.setGlobalElasticity(value);
        });
        
        // Add ball button
        this.addBallBtn.addEventListener('click', () => {
            const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2); // Start from top half
            this.world.addCircle(x, y);
        });
        
        // Add box button
        this.addBoxBtn.addEventListener('click', () => {
            const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2); // Start from top half
            this.world.addBox(x, y);
        });
        
        // Reset button
        this.resetBtn.addEventListener('click', () => {
            this.world.clearObjects();
        });
        
        // Pause button
        this.pauseBtn.addEventListener('click', () => {
            this.world.pauseSimulation();
            if (this.world.getRunningState()) {
                this.pauseBtn.textContent = 'Pause';
            } else {
                this.pauseBtn.textContent = 'Resume';
            }
        });
    }
}

// Initialize controls when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PhysicsControls('physics-canvas');
});
