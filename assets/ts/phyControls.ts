import { PhysicsWorld } from './physicsEng.js';

interface ControlElements {
    gravitySlider: HTMLInputElement;
    gravityValue: HTMLSpanElement;
    frictionSlider: HTMLInputElement;
    frictionValue: HTMLSpanElement;
    elasticitySlider: HTMLInputElement;
    elasticityValue: HTMLSpanElement;
    addBallBtn: HTMLButtonElement;
    addBoxBtn: HTMLButtonElement;
    resetBtn: HTMLButtonElement;
    pauseBtn: HTMLButtonElement;
}

export class PhysicsControls {
    private readonly world: PhysicsWorld;
    private readonly elements: ControlElements;
    private initialized: boolean = false;

    constructor(canvasId: string) {
        // Initialize the physics world
        try {
            this.world = new PhysicsWorld(canvasId);
        } catch (error) {
            console.error('Failed to initialize physics world:', error);
            throw error;
        }
        
        // Get UI elements
        this.elements = {
            gravitySlider: document.getElementById('gravity') as HTMLInputElement,
            gravityValue: document.getElementById('gravity-value') as HTMLSpanElement,
            frictionSlider: document.getElementById('friction') as HTMLInputElement,
            frictionValue: document.getElementById('friction-value') as HTMLSpanElement,
            elasticitySlider: document.getElementById('elasticity') as HTMLInputElement,
            elasticityValue: document.getElementById('elasticity-value') as HTMLSpanElement,
            addBallBtn: document.getElementById('add-ball') as HTMLButtonElement,
            addBoxBtn: document.getElementById('add-box') as HTMLButtonElement,
            resetBtn: document.getElementById('reset') as HTMLButtonElement,
            pauseBtn: document.getElementById('pause') as HTMLButtonElement
        };
        
        // Validate that all elements exist
        try {
            this.validateElements();
            this.initialized = true;
            this.setupEventListeners();
            console.log('PhysicsControls initialized successfully');
        } catch (error) {
            console.error('Failed to initialize controls:', error);
            throw error;
        }
    }

    private validateElements(): void {
        const missingElements: string[] = [];
        
        (Object.entries(this.elements) as [string, HTMLElement | null][]).forEach(([name, element]) => {
            if (!element) {
                missingElements.push(name);
            }
        });
        
        if (missingElements.length > 0) {
            throw new Error(`Missing UI elements: ${missingElements.join(', ')}`);
        }
    }

    private setupEventListeners(): void {
        // Gravity slider
        this.elements.gravitySlider.addEventListener('input', () => {
            const value = parseFloat(this.elements.gravitySlider.value);
            this.elements.gravityValue.textContent = value.toFixed(1);
            this.world.setGravity(0, value);
        });
        
        // Friction slider
        this.elements.frictionSlider.addEventListener('input', () => {
            const value = parseFloat(this.elements.frictionSlider.value);
            this.elements.frictionValue.textContent = value.toFixed(2);
            this.world.setGlobalFriction(value);
        });
        
        // Elasticity slider
        this.elements.elasticitySlider.addEventListener('input', () => {
            const value = parseFloat(this.elements.elasticitySlider.value);
            this.elements.elasticityValue.textContent = value.toFixed(2);
            this.world.setGlobalElasticity(value);
        });
        
        // Add ball button
        this.elements.addBallBtn.addEventListener('click', () => {
            const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
            if (canvas) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * (canvas.height / 2); 
                this.world.addCircle(x, y);
            }
        });
        
        // Add box button
        this.elements.addBoxBtn.addEventListener('click', () => {
            const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
            if (canvas) {
                const x = Math.random() * canvas.width;
                const y = Math.random() * (canvas.height / 2); 
                this.world.addBox(x, y);
            }
        });
        
        // Reset button
        this.elements.resetBtn.addEventListener('click', () => {
            this.world.clearObjects();
        });
        
        // Pause/resume button
        this.elements.pauseBtn.addEventListener('click', () => {
            this.world.pauseSimulation();
            this.elements.pauseBtn.textContent = this.world.getRunningState() ? 'Pause' : 'Resume';
        });
    }
}

// Initialize the controls when the DOM is fully loaded
const initializePhysics = () => {
    try {
        new PhysicsControls('physics-canvas');
    } catch (error) {
        console.error('Failed to initialize physics simulation:', error);
        // Retry once after a short delay in case of timing issues
        setTimeout(() => {
            try {
                new PhysicsControls('physics-canvas');
                console.log('Physics simulation initialized successfully on retry');
            } catch (retryError) {
                console.error('Failed to initialize physics simulation after retry:', retryError);
            }
        }, 500);
    }
};

// Use 'load' event instead of 'DOMContentLoaded' for more reliable initialization
if (document.readyState === 'loading') {
    window.addEventListener('load', initializePhysics);
} else {
    // If already loaded (rare), initialize immediately
    initializePhysics();
}
