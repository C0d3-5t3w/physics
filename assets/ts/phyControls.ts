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
        
        this.world = new PhysicsWorld(canvasId);
        
        
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
        
        
        this.setupEventListeners();
    }

    setupEventListeners(): void {
        
        this.gravitySlider.addEventListener('input', () => {
            const value = parseFloat(this.gravitySlider.value);
            this.gravityValue.textContent = value.toFixed(1);
            this.world.setGravity(0, value);
        });
        
        
        this.frictionSlider.addEventListener('input', () => {
            const value = parseFloat(this.frictionSlider.value);
            this.frictionValue.textContent = value.toFixed(2);
            this.world.setGlobalFriction(value);
        });
        
        
        this.elasticitySlider.addEventListener('input', () => {
            const value = parseFloat(this.elasticitySlider.value);
            this.elasticityValue.textContent = value.toFixed(2);
            this.world.setGlobalElasticity(value);
        });
        
        
        this.addBallBtn.addEventListener('click', () => {
            const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2); 
            this.world.addCircle(x, y);
        });
        
        
        this.addBoxBtn.addEventListener('click', () => {
            const canvas = document.getElementById('physics-canvas') as HTMLCanvasElement;
            const x = Math.random() * canvas.width;
            const y = Math.random() * (canvas.height / 2); 
            this.world.addBox(x, y);
        });
        
        
        this.resetBtn.addEventListener('click', () => {
            this.world.clearObjects();
        });
        
        
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


document.addEventListener('DOMContentLoaded', () => {
    new PhysicsControls('physics-canvas');
});
