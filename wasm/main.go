package main

import (
	"fmt"
	"math"
	"syscall/js"
)

// Vector2D represents a 2D vector
type Vector2D struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// Fluid simulation parameters
type FluidParams struct {
	Density       float64
	Viscosity     float64
	Resolution    int
	Iterations    int
	DiffusionRate float64
}

// Main function runs when WASM module loads
func main() {
	fmt.Println("Go WebAssembly Physics Module Initialized")

	// Register physics functions
	js.Global().Set("goCalculateGravitationalForce", js.FuncOf(calculateGravitationalForce))
	js.Global().Set("goCalculateOrbit", js.FuncOf(calculateOrbit))
	js.Global().Set("goCalculateProjectileTrajectory", js.FuncOf(calculateProjectileTrajectory))

	// Register fluid dynamics functions
	js.Global().Set("goCalculateFluidFlow", js.FuncOf(calculateFluidFlow))
	js.Global().Set("goCalculateDrag", js.FuncOf(calculateDragForce))
	js.Global().Set("goSimulateWave", js.FuncOf(simulateWave))
	js.Global().Set("goUpdateDOMElement", js.FuncOf(updateDOMElement))

	// Keep the program running
	<-make(chan bool)
}

// calculateGravitationalForce calculates the gravitational force between two objects
func calculateGravitationalForce(this js.Value, args []js.Value) interface{} {
	if len(args) != 4 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid number of arguments. Expected: mass1, mass2, distance, gravitationalConstant",
		})
	}

	mass1 := args[0].Float()
	mass2 := args[1].Float()
	distance := args[2].Float()
	G := args[3].Float()

	force := G * mass1 * mass2 / (distance * distance)

	return js.ValueOf(force)
}

// calculateOrbit calculates orbital parameters
func calculateOrbit(this js.Value, args []js.Value) interface{} {
	if len(args) != 3 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid number of arguments. Expected: centralMass, distance, gravitationalConstant",
		})
	}

	centralMass := args[0].Float()
	distance := args[1].Float()
	G := args[2].Float()

	// Calculate orbital velocity
	velocity := math.Sqrt(G * centralMass / distance)

	// Calculate orbital period
	period := 2 * math.Pi * distance / velocity

	return js.ValueOf(map[string]interface{}{
		"velocity": velocity,
		"period":   period,
	})
}

// calculateProjectileTrajectory calculates the trajectory points of a projectile
func calculateProjectileTrajectory(this js.Value, args []js.Value) interface{} {
	if len(args) != 5 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid arguments. Expected: initialVelocity, angle, gravity, timeStep, duration",
		})
	}

	initialVelocity := args[0].Float()
	angle := args[1].Float() * math.Pi / 180 // Convert degrees to radians
	gravity := args[2].Float()
	timeStep := args[3].Float()
	duration := args[4].Float()

	// Initial velocity components
	vx := initialVelocity * math.Cos(angle)
	vy := initialVelocity * math.Sin(angle)

	// Calculate trajectory points
	points := []interface{}{}
	x, y := 0.0, 0.0

	for t := 0.0; t <= duration; t += timeStep {
		x = vx * t
		y = vy*t - 0.5*gravity*t*t

		if y < 0 {
			break // Stop when the projectile hits the ground
		}

		points = append(points, map[string]interface{}{
			"x": x,
			"y": y,
			"t": t,
		})
	}

	return js.ValueOf(map[string]interface{}{
		"initialVx": vx,
		"initialVy": vy,
		"points":    points,
		"range":     x,
		"maxHeight": (vy * vy) / (2 * gravity),
	})
}

// calculateFluidFlow calculates fluid velocities in a 2D grid
func calculateFluidFlow(this js.Value, args []js.Value) interface{} {
	if len(args) != 5 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid arguments. Expected: density, viscosity, gridSize, timeStep, forces",
		})
	}

	density := args[0].Float()
	viscosity := args[1].Float()
	gridSize := args[2].Int()
	dt := args[3].Float()

	// Process forces array
	forces := make([][]float64, gridSize)
	for i := range forces {
		forces[i] = make([]float64, gridSize)
		for j := 0; j < gridSize; j++ {
			if j < args[4].Length() && i < args[4].Index(j).Length() {
				forces[i][j] = args[4].Index(j).Index(i).Float()
			}
		}
	}

	// Simulate simple diffusion
	result := make([]interface{}, gridSize)
	for i := 0; i < gridSize; i++ {
		row := make([]interface{}, gridSize)
		for j := 0; j < gridSize; j++ {
			// Simple diffusion equation
			diffusion := 0.0
			count := 0

			for ni := i - 1; ni <= i+1; ni++ {
				for nj := j - 1; nj <= j+1; nj++ {
					if ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize && !(ni == i && nj == j) {
						diffusion += forces[ni][nj]
						count++
					}
				}
			}

			if count > 0 {
				diffusion /= float64(count)
			}

			// Update cell with diffusion and viscosity effects
			value := forces[i][j] + (diffusion-forces[i][j])*viscosity*dt

			// Apply density factor
			value *= density

			row[j] = value
		}
		result[i] = row
	}

	return js.ValueOf(map[string]interface{}{
		"velocities": result,
		"maxValue":   findMaxValue(result),
		"minValue":   findMinValue(result),
	})
}

// calculateDragForce calculates the drag force on an object in a fluid
func calculateDragForce(this js.Value, args []js.Value) interface{} {
	if len(args) != 5 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid arguments. Expected: fluidDensity, velocity, dragCoefficient, area, objectShape",
		})
	}

	fluidDensity := args[0].Float()
	velocity := args[1].Float()
	dragCoefficient := args[2].Float()
	area := args[3].Float()
	objectShape := args[4].String()

	// Adjust drag coefficient based on shape
	switch objectShape {
	case "sphere":
		dragCoefficient *= 0.47
	case "cube":
		dragCoefficient *= 1.05
	case "cylinder":
		dragCoefficient *= 0.82
	case "streamlined":
		dragCoefficient *= 0.04
	}

	// Drag equation: F_d = 1/2 * ρ * v² * C_d * A
	dragForce := 0.5 * fluidDensity * velocity * velocity * dragCoefficient * area

	return js.ValueOf(map[string]interface{}{
		"dragForce":               dragForce,
		"adjustedDragCoefficient": dragCoefficient,
	})
}

// simulateWave generates wave propagation data
func simulateWave(this js.Value, args []js.Value) interface{} {
	if len(args) != 5 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid arguments. Expected: amplitude, frequency, damping, resolution, time",
		})
	}

	amplitude := args[0].Float()
	frequency := args[1].Float()
	damping := args[2].Float()
	resolution := args[3].Int()
	time := args[4].Float()

	points := make([]interface{}, resolution)

	for i := 0; i < resolution; i++ {
		x := float64(i) / float64(resolution) * 2 * math.Pi

		// Calculate wave height with damping
		distance := math.Abs(x - math.Pi)
		dampingFactor := math.Exp(-damping * distance)
		y := amplitude * math.Sin(frequency*x+time) * dampingFactor

		points[i] = map[string]interface{}{
			"x": x,
			"y": y,
		}
	}

	return js.ValueOf(map[string]interface{}{
		"waveData": points,
		"timeStep": time,
	})
}

// updateDOMElement demonstrates how Go can update the DOM
func updateDOMElement(this js.Value, args []js.Value) interface{} {
	if len(args) != 2 {
		return js.ValueOf(map[string]interface{}{
			"error": "Invalid arguments. Expected: elementId, data",
		})
	}

	elementId := args[0].String()
	data := args[1]

	// Get the DOM element
	document := js.Global().Get("document")
	element := document.Call("getElementById", elementId)

	if element.IsUndefined() || element.IsNull() {
		return js.ValueOf(map[string]interface{}{
			"error": "Element not found: " + elementId,
		})
	}

	// Update element based on type
	if element.Get("tagName").String() == "CANVAS" {
		// Draw on canvas
		ctx := element.Call("getContext", "2d")
		width := element.Get("width").Int()
		height := element.Get("height").Int()

		// Clear canvas
		ctx.Call("clearRect", 0, 0, width, height)

		// Set drawing style
		ctx.Set("fillStyle", "rgba(0, 150, 255, 0.5)")
		ctx.Set("strokeStyle", "rgb(0, 100, 255)")
		ctx.Set("lineWidth", 2)

		// Draw data points if they exist
		if !data.Get("waveData").IsUndefined() && data.Get("waveData").Length() > 0 {
			waveData := data.Get("waveData")
			length := waveData.Length()

			// Begin path for line
			ctx.Call("beginPath")

			for i := 0; i < length; i++ {
				point := waveData.Index(i)
				x := point.Get("x").Float() / (2 * math.Pi) * float64(width)

				// Fix: Convert height to float64 before arithmetic operations
				heightFloat := float64(height)
				y := heightFloat/2 - point.Get("y").Float()*(heightFloat/4)

				if i == 0 {
					ctx.Call("moveTo", x, y)
				} else {
					ctx.Call("lineTo", x, y)
				}
			}

			// Stroke the line
			ctx.Call("stroke")
		}

		return js.ValueOf(map[string]interface{}{
			"success":     true,
			"elementType": "canvas",
		})
	} else {
		// For other elements, set text content
		element.Set("textContent", data.String())
		return js.ValueOf(map[string]interface{}{
			"success":     true,
			"elementType": element.Get("tagName").String(),
		})
	}
}

// Helper functions
func findMaxValue(data []interface{}) float64 {
	max := -math.MaxFloat64

	for _, row := range data {
		rowArray := row.([]interface{})
		for _, val := range rowArray {
			if val.(float64) > max {
				max = val.(float64)
			}
		}
	}

	return max
}

func findMinValue(data []interface{}) float64 {
	min := math.MaxFloat64

	for _, row := range data {
		rowArray := row.([]interface{})
		for _, val := range rowArray {
			if val.(float64) < min {
				min = val.(float64)
			}
		}
	}

	return min
}
