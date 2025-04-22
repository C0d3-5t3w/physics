// Physics Engine
// Define vector class for physics calculations
class Vector2D {
    constructor(public x: number = 0, public y: number = 0) {}

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

// Base physics object interface
interface PhysicsObject {
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

// Circle physics object
class Circle implements PhysicsObject {
    constructor(
        public position: Vector2D,
        public radius: number,
        public mass: number = 1,
        public velocity: Vector2D = new Vector2D(),
        public acceleration: Vector2D = new Vector2D(),
        public elasticity: number = 0.7,
        public friction: number = 0.1,
        public color: string = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
    ) {}

    update(dt: number): void {
        // Update velocity and position based on acceleration and time
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = this.position.add(this.velocity.multiply(dt));
        
        // Reset acceleration for next frame
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
        // F = ma, so a = F/m
        const acceleration = force.multiply(1 / this.mass);
        this.acceleration = this.acceleration.add(acceleration);
    }

    contains(point: Vector2D): boolean {
        const distance = point.subtract(this.position).magnitude();
        return distance <= this.radius;
    }
}

// Box physics object
class Box implements PhysicsObject {
    public width: number;
    public height: number;
    public rotation: number = 0;
    public angularVelocity: number = 0;

    constructor(
        public position: Vector2D,
        width: number,
        height: number,
        public mass: number = 1,
        public velocity: Vector2D = new Vector2D(),
        public acceleration: Vector2D = new Vector2D(),
        public elasticity: number = 0.7,
        public friction: number = 0.1,
        public color: string = `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`
    ) {
        this.width = width;
        this.height = height;
    }

    update(dt: number): void {
        // Update velocity and position based on acceleration and time
        this.velocity = this.velocity.add(this.acceleration.multiply(dt));
        this.position = this.position.add(this.velocity.multiply(dt));
        
        // Update rotation
        this.rotation += this.angularVelocity * dt;
        
        // Reset acceleration for next frame
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
        // F = ma, so a = F/m
        const acceleration = force.multiply(1 / this.mass);
        this.acceleration = this.acceleration.add(acceleration);
    }

    // Simple AABB collision check (doesn't account for rotation)
    contains(point: Vector2D): boolean {
        // Transform point to local coordinates
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

// Physics world that manages all objects and interactions
class PhysicsWorld {
    private objects: PhysicsObject[] = [];
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private running: boolean = true;
    private lastTimestamp: number = 0;
    private gravity: Vector2D = new Vector2D(0, 9.8);
    
    constructor(canvasId: string) {
        this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
        if (!this.canvas) throw new Error(`Canvas with id ${canvasId} not found`);
        
        const ctx = this.canvas.getContext('2d');
        if (!ctx) throw new Error('Could not get canvas context');
        this.ctx = ctx;
        
        // Set canvas dimensions
        this.resetCanvasSize();
        
        // Start animation loop
        requestAnimationFrame(this.update.bind(this));
        
        // Handle window resize
        window.addEventListener('resize', this.resetCanvasSize.bind(this));
        
        // Add click handler for object addition
        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    }
    
    resetCanvasSize(): void {
        // Make canvas fill its container
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
    }
    
    handleCanvasClick(event: MouseEvent): void {
        // Add object on click (for testing)
        const rect = this.canvas.getBoundingClientRect();
        const clickPos = new Vector2D(
            event.clientX - rect.left,
            event.clientY - rect.top
        );
        
        // Default to adding a circle
        this.addCircle(clickPos.x, clickPos.y);
    }
    
    update(timestamp: number): void {
        if (!this.running) return;
        
        // Calculate delta time in seconds
        const dt = (this.lastTimestamp) ? (timestamp - this.lastTimestamp) / 1000 : 1/60;
        this.lastTimestamp = timestamp;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply forces and update all objects
        for (const obj of this.objects) {
            // Apply gravity
            obj.applyForce(this.gravity.multiply(obj.mass));
            
            // Update physics
            obj.update(dt);
            
            // Check boundaries
            this.checkBoundaries(obj);
            
            // Draw object
            obj.draw(this.ctx);
        }
        
        // Check collisions between objects
        this.checkCollisions();
        
        // Schedule next frame
        requestAnimationFrame(this.update.bind(this));
    }
    
    checkBoundaries(obj: PhysicsObject): void {
        if (obj instanceof Circle) {
            // Bottom boundary
            if (obj.position.y + obj.radius > this.canvas.height) {
                obj.position.y = this.canvas.height - obj.radius;
                obj.velocity.y = -obj.velocity.y * obj.elasticity;
                
                // Apply friction to x velocity when on the ground
                obj.velocity.x *= (1 - obj.friction);
            }
            
            // Top boundary
            if (obj.position.y - obj.radius < 0) {
                obj.position.y = obj.radius;
                obj.velocity.y = -obj.velocity.y * obj.elasticity;
            }
            
            // Right boundary
            if (obj.position.x + obj.radius > this.canvas.width) {
                obj.position.x = this.canvas.width - obj.radius;
                obj.velocity.x = -obj.velocity.x * obj.elasticity;
            }
            
            // Left boundary
            if (obj.position.x - obj.radius < 0) {
                obj.position.x = obj.radius;
                obj.velocity.x = -obj.velocity.x * obj.elasticity;
            }
        } else if (obj instanceof Box) {
            // Simplified boundary check for boxes (doesn't account for rotation)
            
            // Bottom boundary
            if (obj.position.y + obj.height/2 > this.canvas.height) {
                obj.position.y = this.canvas.height - obj.height/2;
                obj.velocity.y = -obj.velocity.y * obj.elasticity;
                obj.velocity.x *= (1 - obj.friction);
                obj.angularVelocity *= 0.8; // Reduce angular velocity
            }
            
            // Top boundary
            if (obj.position.y - obj.height/2 < 0) {
                obj.position.y = obj.height/2;
                obj.velocity.y = -obj.velocity.y * obj.elasticity;
            }
            
            // Right boundary
            if (obj.position.x + obj.width/2 > this.canvas.width) {
                obj.position.x = this.canvas.width - obj.width/2;
                obj.velocity.x = -obj.velocity.x * obj.elasticity;
            }
            
            // Left boundary
            if (obj.position.x - obj.width/2 < 0) {
                obj.position.x = obj.width/2;
                obj.velocity.x = -obj.velocity.x * obj.elasticity;
            }
        }
    }
    
    checkCollisions(): void {
        // Simple collision detection between objects
        for (let i = 0; i < this.objects.length; i++) {
            for (let j = i + 1; j < this.objects.length; j++) {
                const objA = this.objects[i];
                const objB = this.objects[j];
                
                // Circle to circle collision
                if (objA instanceof Circle && objB instanceof Circle) {
                    this.handleCircleToCircleCollision(objA, objB);
                }
                // Other collision types would be implemented here
            }
        }
    }
    
    handleCircleToCircleCollision(circleA: Circle, circleB: Circle): void {
        // Calculate distance between circles
        const distance = circleA.position.subtract(circleB.position).magnitude();
        const minDistance = circleA.radius + circleB.radius;
        
        // Check if circles are colliding
        if (distance < minDistance) {
            // Calculate collision normal
            const normal = circleA.position.subtract(circleB.position).normalize();
            
            // Calculate relative velocity
            const relativeVelocity = circleA.velocity.subtract(circleB.velocity);
            
            // Calculate relative velocity along normal
            const velocityAlongNormal = relativeVelocity.dot(normal);
            
            // If objects are moving away from each other, skip
            if (velocityAlongNormal > 0) return;
            
            // Calculate elasticity
            const e = Math.min(circleA.elasticity, circleB.elasticity);
            
            // Calculate impulse scalar
            let j = -(1 + e) * velocityAlongNormal;
            j /= 1/circleA.mass + 1/circleB.mass;
            
            // Apply impulse
            const impulse = normal.multiply(j);
            circleA.velocity = circleA.velocity.add(impulse.multiply(1/circleA.mass));
            circleB.velocity = circleB.velocity.subtract(impulse.multiply(1/circleB.mass));
            
            // Move circles apart to avoid sticking
            const correctionPercent = 0.8;
            const correction = normal.multiply((minDistance - distance) * correctionPercent);
            circleA.position = circleA.position.add(correction.multiply(1/circleA.mass / (1/circleA.mass + 1/circleB.mass)));
            circleB.position = circleB.position.subtract(correction.multiply(1/circleB.mass / (1/circleA.mass + 1/circleB.mass)));
        }
    }
    
    addCircle(x: number, y: number, radius?: number, mass?: number): Circle {
        const circle = new Circle(
            new Vector2D(x, y),
            radius || 20 + Math.random() * 20,
            mass || 1 + Math.random() * 5
        );
        this.objects.push(circle);
        return circle;
    }
    
    addBox(x: number, y: number, width?: number, height?: number, mass?: number): Box {
        const box = new Box(
            new Vector2D(x, y),
            width || 30 + Math.random() * 40,
            height || 30 + Math.random() * 40,
            mass || 1 + Math.random() * 5
        );
        this.objects.push(box);
        return box;
    }
    
    setGravity(x: number, y: number): void {
        this.gravity = new Vector2D(x, y);
    }
    
    setGlobalElasticity(elasticity: number): void {
        for (const obj of this.objects) {
            obj.elasticity = elasticity;
        }
    }
    
    setGlobalFriction(friction: number): void {
        for (const obj of this.objects) {
            obj.friction = friction;
        }
    }
    
    clearObjects(): void {
        this.objects = [];
    }
    
    pauseSimulation(): void {
        this.running = !this.running;
        if (this.running) {
            this.lastTimestamp = 0;
            requestAnimationFrame(this.update.bind(this));
        }
    }

    getRunningState(): boolean {
        return this.running;
    }
}

// Export the physics engine
export { Vector2D, Circle, Box, PhysicsObject, PhysicsWorld };
