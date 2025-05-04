# N-Dimensional Chess: Beyond the Standard Board

Welcome to N-Dimensional Chess, an advanced chess simulation that extends the traditional game into higher dimensions! This guide will help you understand how to navigate and play this mathematically-enriched chess experience.

## Authors
This project was created as a collaborative effort by:

Timothy Winans and Owen McMann

We developed the concepts, mathematical framework, and the interactive game as part of the Univerity of Maryland Baltimore County HONR 300 – Mathematics of the Universe course in Spring 2025.

## Getting Started

1. **Access the Game**: Open the application in your web browser by navigating to the URL or running the application locally.
2. **Basic Controls**:
   - Use the **mouse** to rotate the view by clicking and dragging
   - Use the **scroll wheel** to zoom in and out
   - Click on chess pieces to select them
   - Click on valid highlighted tiles to move

## Game Interface

The interface includes several panels to help you navigate the n-dimensional space:

- **Game Status Panel**: Shows the current turn and complexity score
- **Dimensional Controls**: Toggle dimensions on/off and adjust visualization
- **Mathematical Insights**: Displays formulas and explanations about the current dimensional space
- **Captured Pieces**: Shows pieces captured by each player

## Understanding Dimensions

The game starts in 3D mode (three dimensions), but you can expand it to higher dimensions:

- **Dimension 1 (D1)**: X-axis (horizontal)
- **Dimension 2 (D2)**: Z-axis (depth)
- **Dimension 3 (D3)**: Y-axis (vertical)
- **Dimension 4-6 (D4-D6)**: Higher dimensions, invisible but mathematically accessible

Use the dimension toggle buttons to add or remove dimensions from the game. The color-coded dimension axes help visualize directions.

## Chess Pieces

### Standard Pieces
All traditional chess pieces are available with their standard movement patterns in 2D:
- **Pawn**: Moves forward one square, captures diagonally
- **Rook**: Moves horizontally or vertically any number of squares
- **Knight**: Moves in an L-shape (2 squares in one direction, then 1 square perpendicular)
- **Bishop**: Moves diagonally any number of squares
- **Queen**: Combines rook and bishop movements
- **King**: Moves one square in any direction

### Hyperpieces
When you enable dimensions beyond the 3rd, special hyperpieces become available:

- **Hyperrook**: Can move along any dimension, one dimension at a time
- **Hyperbishop**: Moves along diagonal paths in higher dimensions
- **Hyperknight**: Makes L-shaped jumps that can pass through higher dimensions

Hyperpieces are visually distinguished by their glowing auras and pulsing animations.

## Special Mechanics

### Dimensional Transport
Pieces can move through higher dimensions to reach positions that appear disconnected in lower dimensions. This creates powerful shortcuts through space.

### Dimensional Fatigue
Using multiple higher dimensions simultaneously reduces a piece's range. The formula for dimensional fatigue is:

```
Range = Base Range / (2^(dimensions_used-1))
```

This mechanic balances the power of higher-dimensional movement.

### Mathematical Complexity Score
Each move receives a complexity score based on:
- The piece type (hyperpieces score higher)
- Number of dimensions used
- Distance traveled
- Whether a capture occurred

Higher complexity scores indicate more mathematically sophisticated moves. Watch for special notifications when you make particularly complex moves!

## View Controls

Use the view controls to change how you visualize the n-dimensional space:
- **3D View**: Shows three dimensions simultaneously
- **2D View**: Shows only two dimensions at once
- **Slice View**: Shows a specific slice of higher dimensions

You can also select which dimensions to map to the X, Y, and Z axes in the physical view.

## Mathematical Foundations of N-Dimensional Chess

### Euclidean Spaces and Coordinates

The game is built on the concept of n-dimensional Euclidean spaces (ℝⁿ), where each point is represented by an n-tuple of coordinates:

- In 1D: Points are represented as (x)
- In 2D: Points are represented as (x, y)
- In 3D: Points are represented as (x, y, z)
- In 4D: Points are represented as (x, y, z, w)
- And so on...

The distance between two points in n-dimensional space is calculated using the Euclidean distance formula:

```
d = √((x₂-x₁)² + (y₂-y₁)² + (z₂-z₁)² + ... + (wₙ-w₁)²)
```

### Hypergeometry Concepts

#### Tesseract (4D Hypercube)

A tesseract is the 4-dimensional analog of a cube, much like a cube is the 3D analog of a square. It has:
- 16 vertices
- 32 edges
- 24 squares
- 8 cubic cells

In the game, 4D movements can be visualized as "shortcuts" through this tesseract structure.

#### Penteract and Hexeract (5D and 6D Hypercubes)

As dimensions increase, the complexity grows exponentially:
- A 5D hypercube (penteract) has 32 vertices, 80 edges, 80 squares, 40 cubes, and 10 tesseracts
- A 6D hypercube (hexeract) has 64 vertices, 192 edges, 240 squares, 160 cubes, 60 tesseracts, and 12 penteracts

### Movement Geometries

#### Manhattan Distance (L¹ Norm)

The hyperrook uses Manhattan distance (also called taxicab geometry), defined as:

```
d₁(p,q) = |p₁-q₁| + |p₂-q₂| + ... + |pₙ-qₙ|
```

This measures the total distance traveled along each axis separately.

#### Euclidean Distance (L² Norm)

The hyperbishop uses Euclidean distance, which measures the straight-line distance through n-dimensional space:

```
d₂(p,q) = √((p₁-q₁)² + (p₂-q₂)² + ... + (pₙ-qₙ)²)
```

#### Hyperknight Movement

The hyperknight's movement pattern is defined by coordinates where:
- Exactly two components differ from the starting position
- One component differs by 1, another by 2
- All other components remain unchanged

This generalizes the knight's L-shape movement to higher dimensions.

### Dimensional Fatigue Mathematics

Dimensional fatigue in the game is based on the concept that coordinating movement through multiple dimensions simultaneously requires dividing attention. The formula:

```
Range = ⌊Base / 2^(d-1)⌋
```

Where:
- Base = the piece's standard movement range
- d = number of dimensions being utilized simultaneously

This creates an exponential decrease in effectiveness as more dimensions are used, reflecting the increased complexity of coordination.

### Complexity Scoring System

The mathematical complexity score for each move is calculated as:

```
Complexity = (Piece_Weight + Capture_Bonus) + (Distance * Distance_Weight) +
            (Dimensions_Used * Dimension_Weight) + Higher_Dimension_Bonus
```

For hyperpieces using multiple dimensions, additional complexity is added based on unique dimension pairs:

```
Hyperpiece_Bonus = UniqueDirectionPairs * 2
```

## Mathematical Insights

The mathematical insights panel provides formulas and explanations about:
- The properties of the current dimensional space
- The movement patterns of hyperpieces
- The mathematical concepts behind dimensional transport

Pay attention to the mathematical notifications that appear during gameplay to learn more about the theory behind n-dimensional spaces.

## Dimensional Transport Theory

Dimensional transport can be thought of as a mathematical transformation T: ℝⁿ → ℝⁿ that preserves most coordinates while changing others. In simplified terms:

1. **Embedding**: The lower dimensional space is embedded within a higher dimensional space
2. **Path Shortening**: Moving through the higher dimension creates a "shortcut" that connects distant points
3. **Projection**: When viewed in the original lower dimensional space, the movement appears discontinuous

This is analogous to how a 2D being restricted to a paper surface could escape from a circle by moving through the 3rd dimension (up off the page and back down elsewhere).

## Tips for New Players

1. **Start simple**: Begin by playing in 3D mode to get familiar with the basic controls
2. **Experiment with dimensions**: Gradually add higher dimensions to explore new movement possibilities
3. **Watch the axes**: The colored arrows indicate the orientation of each dimension
4. **Use hyperpieces wisely**: Their ability to move through higher dimensions makes them powerful but complex
5. **Plan your dimensional moves**: Higher-dimensional moves can create surprising tactical opportunities

## Advanced Strategies

- Use dimensional transport to escape checkmate by moving through a higher dimension
- Set up multi-dimensional forks where threats exist in different dimensional planes
- Create fortress positions that are defended from multiple dimensions
- Achieve higher complexity scores by making mathematically sophisticated moves
- Use dimensional fatigue strategically by forcing opponents to divide attention across many dimensions

## Real-World Mathematical Connections

The concepts in this game connect to several advanced mathematical fields:

- **Topology**: The study of properties preserved under continuous deformations
- **Differential Geometry**: The study of curved spaces and manifolds
- **Linear Algebra**: The mathematics of vector spaces and transformations
- **Graph Theory**: Analyzing connectivity patterns relevant to chess piece movements
- **Combinatorial Game Theory**: Mathematical analysis of games like chess

Enjoy exploring the mathematical beauty of n-dimensional chess!

Copyright (c) 2025 Timothy Winans and Owen McMann

All rights reserved.

Permission is hereby granted to use, share, and adapt this software and associated materials for **non-commercial**, **academic**, and **educational** purposes only, provided that proper attribution is given to the original authors.

Commercial use, redistribution, or derivative works intended for profit are **strictly prohibited** without prior written consent from the authors.

This includes, but is not limited to:
- Paid software
- Monetized educational content
- Games distributed via online stores
- Commercial presentations or exhibitions

To inquire about commercial licensing, please contact:
- Timothy Winans – timothyrwinans@gmail.com

No warranty is provided. Use at your own risk.
