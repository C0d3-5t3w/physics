export class Vector2D {
    constructor(public readonly x: number = 0, public readonly y: number = 0) {}

    add(v: Vector2D): Vector2D {
        return new Vector2D(this.x + v.x, this.y + v.y);
    }

    subtract(v: Vector2D): Vector2D {
        return new Vector2D(this.x - v.x, this.y - v.y);
    }

    multiply(scalar: number): Vector2D {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize(): Vector2D {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D();
        return new Vector2D(this.x / mag, this.y / mag);
    }

    dot(v: Vector2D): number {
        return this.x * v.x + this.y * v.y;
    }
}

export interface PhysicsObject {
    position: Vector2D;
    velocity: Vector2D;
    acceleration: Vector2D;
    mass: number;
    elasticity: number;
    friction: number;
    update(dt: number): void;
    draw(ctx: CanvasRenderingContext2D): void;
    applyForce(force: Vector2D): void;
    contains(point: Vector2D): boolean;
}

export interface CircleParams {
    position: Vector2D;
    radius: number;
    mass?: number;
    velocity?: Vector2D;
    acceleration?: Vector2D;
    elasticity?: number;
    friction?: number;
    color?: string;
}

export class Circle implements PhysicsObject {
    public position: Vector2D;
    public velocity: Vector2D;
    public acceleration: Vector2D;
    public readonly radius: number;
    public readonly mass: number;
    public elasticity: number;
    public friction: number;
    public readonly color: string;

    constructor({
        position,
        radius,
        mass = 1,
        velocity = new Vector2D(),
        acceleration = new Vector2D(),
        elasticity = 0.7,
        friction = 0.1,
        color = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
    }: CircleParams) {
        this.position = position;
        this.radius = radius;
        this.mass = mass;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.elasticity = elasticity;
        this.friction = friction;
        this.color = color;
    }

    update(dt: number): void {
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = this.position.add(this.velocity.multiply(dt));
        this.acceleration = new Vector2D();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.beginPath();
        ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
    }

    applyForce(force: Vector2D): void {
        const acceleration = force.multiply(1 / this.mass);
        this.acceleration = this.acceleration.add(acceleration);
    }

    contains(point: Vector2D): boolean {
        const distance = point.subtract(this.position).magnitude();
        return distance <= this.radius;
    }
}

export interface BoxParams {
    position: Vector2D;
    width: number;
    height: number;
    mass?: number;
    velocity?: Vector2D;
    acceleration?: Vector2D;
    elasticity?: number;
    friction?: number;
    color?: string;
}

export class Box implements PhysicsObject {
    public position: Vector2D;
    public velocity: Vector2D;
    public acceleration: Vector2D;
    public readonly width: number;
    public readonly height: number;
    public readonly mass: number;
    public elasticity: number;
    public friction: number;
    public readonly color: string;
    public rotation: number = 0;
    public angularVelocity: number = 0;

    constructor({
        position,
        width,
        height,
        mass = 1,
        velocity = new Vector2D(),
        acceleration = new Vector2D(),
        elasticity = 0.7,
        friction = 0.1,
        color = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
    }: BoxParams) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.mass = mass;
        this.velocity = velocity;
        this.acceleration = acceleration;
        this.elasticity = elasticity;
        this.friction = friction;
        this.color = color;
    }

    update(dt: number): void {
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = this.position.add(this.velocity.multiply(dt));
        this.rotation += this.angularVelocity * dt;
        this.acceleration = new Vector2D();
    }

    draw(ctx: CanvasRenderingContext2D): void {
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.rotate(this.rotation);
        
        ctx.beginPath();
        ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.closePath();
        
        ctx.restore();
    }

    applyForce(force: Vector2D): void {
        const acceleration = force.multiply(1 / this.mass);
        this.acceleration = this.acceleration.add(acceleration);
    }

    contains(point: Vector2D): boolean {
        const localPoint = new Vector2D(
            (point.x - this.position.x) * Math.cos(-this.rotation) - (point.y - this.position.y) * Math.sin(-this.rotation),
            (point.x - this.position.x) * Math.sin(-this.rotation) + (point.y - this.position.y) * Math.cos(-this.rotation)
        );
        
        return (
            localPoint.x >= -this.width / 2 &&
            localPoint.x <= this.width / 2 &&
            localPoint.y >= -this.height / 2 &&
            localPoint.y <= this.height / 2
        );
    }
}

export class PhysicsWorld {
    private readonly objects: PhysicsObject[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private running: boolean = true;
    private lastTimestamp: number = 0;
    private gravity: Vector2D = new Vector2D(0, 9.8);
    private initialized: boolean = false;
    
    constructor(canvasId: string) {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            throw new Error('PhysicsWorld should be initialized after DOM is fully loaded');
        }
        
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas with id ${canvasId} not found. Will retry when DOM is loaded.`);
            // Create a placeholder canvas until the real one is available
            this.canvas = document.createElement('canvas');
            this.ctx = this.canvas.getContext('2d') as CanvasRenderingContext2D;
            
            // Try to find the canvas once DOM is fully loaded
            if (document.readyState !== 'complete') {
                window.addEventListener('DOMContentLoaded', () => this.initializeCanvas(canvasId));
            } else {
                // If DOM is already complete but canvas wasn't found, something else is wrong
                console.error('DOM is loaded but canvas was not found. Check your HTML structure.');
            }
        } else {
            this.canvas = canvas;
            const ctx = this.canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Could not get canvas context');
            }
            this.ctx = ctx;
            this.initialize();
        }
    }
    
    private initializeCanvas(canvasId: string): void {
        const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!canvas) {
            console.error(`Canvas with id ${canvasId} still not found after DOM loaded`);
            return;
        }
        
        this.canvas = canvas;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get canvas context');
            return;
        }
        this.ctx = ctx;
        this.initialize();
    }
    
    private initialize(): void {
        if (this.initialized) return;
        
        this.resetCanvasSize();
        window.addEventListener('resize', this.resetCanvasSize.bind(this));
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
        
        this.update = this.update.bind(this);
        this.initialized = true;
        
        // Start animation loop
        requestAnimationFrame(this.update);
        console.log('PhysicsWorld initialized successfully');
    }
    
    private resetCanvasSize(): void {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }
    
    private handleCanvasClick(event: MouseEvent): void {
        const rect = this.canvas.getBoundingClientRect();
        const clickPos = new Vector2D(
            event.clientX - rect.left,
            event.clientY - rect.top
        );
        
        this.addCircle(clickPos.x, clickPos.y);
    }
    
    private update(timestamp: number): void {
        if (!this.initialized) {
            requestAnimationFrame(this.update);
            return;
        }
        
        if (!this.running) {
            requestAnimationFrame(this.update);
            return;
        }
        
        const dt = (this.lastTimestamp) ? (timestamp - this.lastTimestamp) / 1000 : 1/60;
        this.lastTimestamp = timestamp;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (const obj of this.objects) {
            obj.applyForce(this.gravity.multiply(obj.mass));
            obj.update(dt);
            this.checkBoundaries(obj);
            obj.draw(this.ctx);
        }
        
        this.checkCollisions();
        
        requestAnimationFrame(this.update);
    }
    
    private checkBoundaries(obj: PhysicsObject): void {
        if (obj instanceof Circle) {
            if (obj.position.y + obj.radius > this.canvas.height) {
                obj.position = new Vector2D(obj.position.x, this.canvas.height - obj.radius);
                obj.velocity = new Vector2D(
                    obj.velocity.x * (1 - obj.friction), 
                    -obj.velocity.y * obj.elasticity
                );
            }
            
            if (obj.position.y - obj.radius < 0) {
                obj.position = new Vector2D(obj.position.x, obj.radius);
                obj.velocity = new Vector2D(
                    obj.velocity.x, 
                    -obj.velocity.y * obj.elasticity
                );
            }
            
            if (obj.position.x + obj.radius > this.canvas.width) {
                obj.position = new Vector2D(this.canvas.width - obj.radius, obj.position.y);
                obj.velocity = new Vector2D(
                    -obj.velocity.x * obj.elasticity, 
                    obj.velocity.y
                );
            }
            
            if (obj.position.x - obj.radius < 0) {
                obj.position = new Vector2D(obj.radius, obj.position.y);
                obj.velocity = new Vector2D(
                    -obj.velocity.x * obj.elasticity, 
                    obj.velocity.y
                );
            }
        } else if (obj instanceof Box) {
            if (obj.position.y + obj.height/2 > this.canvas.height) {
                obj.position = new Vector2D(obj.position.x, this.canvas.height - obj.height/2);
                obj.velocity = new Vector2D(
                    obj.velocity.x * (1 - obj.friction), 
                    -obj.velocity.y * obj.elasticity
                );
                obj.angularVelocity *= 0.8;
            }
            
            if (obj.position.y - obj.height/2 < 0) {
                obj.position = new Vector2D(obj.position.x, obj.height/2);
                obj.velocity = new Vector2D(
                    obj.velocity.x, 
                    -obj.velocity.y * obj.elasticity
                );
            }
            
            if (obj.position.x + obj.width/2 > this.canvas.width) {
                obj.position = new Vector2D(this.canvas.width - obj.width/2, obj.position.y);
                obj.velocity = new Vector2D(
                    -obj.velocity.x * obj.elasticity, 
                    obj.velocity.y
                );
            }
            
            if (obj.position.x - obj.width/2 < 0) {
                obj.position = new Vector2D(obj.width/2, obj.position.y);
                obj.velocity = new Vector2D(
                    -obj.velocity.x * obj.elasticity, 
                    obj.velocity.y
                );
            }
        }
    }
    
    private checkCollisions(): void {
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const objA = this.objects[i];
                const objB = this.objects[j];
                
                if (objA instanceof Circle && objB instanceof Circle) {
                    this.handleCircleToCircleCollision(objA, objB);
                }
            }
        }
    }
    
    private handleCircleToCircleCollision(circleA: Circle, circleB: Circle): void {
        const distance = circleA.position.subtract(circleB.position).magnitude();
        const minDistance = circleA.radius + circleB.radius;
        
        if (distance < minDistance) {
            const normal = circleA.position.subtract(circleB.position).normalize();
            const relativeVelocity = circleA.velocity.subtract(circleB.velocity);
            const velocityAlongNormal = relativeVelocity.dot(normal);
            
            if (velocityAlongNormal > 0) return;
            
            const e = Math.min(circleA.elasticity, circleB.elasticity);
            
            let j = -(1 + e) * velocityAlongNormal;
            j /= 1/circleA.mass + 1/circleB.mass;
            
            const impulse = normal.multiply(j);
            
            circleA.velocity = circleA.velocity.add(impulse.multiply(1/circleA.mass));
            circleB.velocity = circleB.velocity.subtract(impulse.multiply(1/circleB.mass));
            
            const correctionPercent = 0.8;
            const correction = normal.multiply((minDistance - distance) * correctionPercent);
            
            const totalInverseMass = 1/circleA.mass + 1/circleB.mass;
            const ratioA = 1/circleA.mass / totalInverseMass;
            const ratioB = 1/circleB.mass / totalInverseMass;
            
            circleA.position = circleA.position.add(correction.multiply(ratioA));
            circleB.position = circleB.position.subtract(correction.multiply(ratioB));
        }
    }
    
    public addCircle(x: number, y: number, radius?: number, mass?: number): Circle {
        const circle = new Circle({
            position: new Vector2D(x, y),
            radius: radius ?? (20 + Math.random() * 20),
            mass: mass ?? (1 + Math.random() * 5)
        });
        this.objects.push(circle);
        return circle;
    }
    
    public addBox(x: number, y: number, width?: number, height?: number, mass?: number): Box {
        const box = new Box({
            position: new Vector2D(x, y),
            width: width ?? (30 + Math.random() * 40),
            height: height ?? (30 + Math.random() * 40),
            mass: mass ?? (1 + Math.random() * 5)
        });
        this.objects.push(box);
        return box;
    }
    
    public setGravity(x: number, y: number): void {
        this.gravity = new Vector2D(x, y);
    }
    
    public setGlobalElasticity(elasticity: number): void {
        for (const obj of this.objects) {
            obj.elasticity = elasticity;
        }
    }
    
    public setGlobalFriction(friction: number): void {
        for (const obj of this.objects) {
            obj.friction = friction;
        }
    }
    
    public clearObjects(): void {
        this.objects.length = 0;
    }
    
    public pauseSimulation(): void {
        this.running = !this.running;
        if (this.running && this.lastTimestamp === 0) {
            this.lastTimestamp = performance.now();
            requestAnimationFrame(this.update);
        }
    }
    
    public getRunningState(): boolean {
        return this.running;
    }
}
