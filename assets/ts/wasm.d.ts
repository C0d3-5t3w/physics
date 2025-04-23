declare function goCalculateGravitationalForce(mass1: number, mass2: number, distance: number, gravitationalConstant: number): number;

declare function goCalculateOrbit(centralMass: number, distance: number, gravitationalConstant: number): {
  velocity: number;
  period: number;
};

declare function goCalculateProjectileTrajectory(
  initialVelocity: number, 
  angle: number, 
  gravity: number, 
  timeStep: number, 
  duration: number
): {
  initialVx: number;
  initialVy: number;
  points: Array<{x: number, y: number, t: number}>;
  range: number;
  maxHeight: number;
};

declare function goCalculateFluidFlow(
  density: number,
  viscosity: number, 
  gridSize: number, 
  timeStep: number, 
  forces: number[][]
): {
  velocities: any[][];
  maxValue: number;
  minValue: number;
};

declare function goCalculateDrag(
  fluidDensity: number, 
  velocity: number, 
  dragCoefficient: number, 
  area: number, 
  objectShape: string
): {
  dragForce: number;
  adjustedDragCoefficient: number;
};

declare function goSimulateWave(
  amplitude: number, 
  frequency: number, 
  damping: number, 
  resolution: number, 
  time: number
): {
  waveData: Array<{x: number, y: number}>;
  timeStep: number;
};

declare function goUpdateDOMElement(elementId: string, data: any): {
  success: boolean;
  elementType: string;
};
