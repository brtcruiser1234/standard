# Blender MCP 3D Modeling Skill

## Purpose
Generate, modify, and enhance 3D models in Blender using AI-powered natural language commands through the Model Context Protocol (MCP).

## What You Can Do
- Create 3D objects by describing them in natural language
- Modify existing Blender objects (scale, rotate, position, color)
- Apply materials and textures to models
- Generate complex scenes with multiple objects
- Export models to STL, OBJ, FBX, STEP, and other formats
- Use Claude to iteratively refine 3D designs
- Control Blender programmatically without manual interaction

## Prerequisites

### 1. Install Blender
Download and install Blender 4.0+ from https://www.blender.org/download/

### 2. Install Blender MCP
```bash
pip install blender-mcp
```

### 3. Configure Claude Code
Add the MCP server to `~/.claude/settings.json`:
```json
{
  "mcpServers": {
    "blender": {
      "command": "blender-mcp",
      "args": ["--port", "9091"]
    }
  }
}
```

### 4. Start Blender
```bash
blender &
```
Or in headless mode:
```bash
blender --background &
```

## How to Use

### Basic Workflow
1. **Start Blender** - Run Blender application (or headless mode)
2. **Describe your model** - Tell Claude what you want to create
3. **Claude generates commands** - The MCP translates your request to Blender operations
4. **Refine iteratively** - Ask Claude to modify the model until satisfied
5. **Export the result** - Save to your desired format

### Example Prompts

**Simple object:**
> Create a red cube at the origin, 5 units on each side

**Complex scene:**
> Create a desk scene with a wooden desk, a laptop on top, and a desk lamp. Use realistic materials and lighting.

**Modification:**
> Scale the cube to 10 units on the X axis, keep Y and Z at 5 units

**Material application:**
> Apply a metallic silver material to the cube with some roughness

## Supported Operations

### Object Creation
- Primitives: Cube, Sphere, Cylinder, Cone, Torus, UV Sphere
- Text objects
- Camera and lighting objects
- Custom mesh objects

### Object Manipulation
- Position (X, Y, Z coordinates)
- Rotation (Euler angles or quaternions)
- Scale (uniform or per-axis)
- Boolean operations (union, difference, intersection)
- Duplication and instancing

### Materials & Appearance
- Color/diffuse settings
- Metallic and roughness properties
- Normal maps and texture mapping
- Emission properties for lights
- Transparency and alpha blending

### Scene Management
- Light setup (directional, point, area lights)
- Camera positioning and framing
- Background and world settings
- Rendering setup

### Export
- STL (for 3D printing)
- OBJ (widely compatible)
- FBX (animation-friendly)
- STEP (CAD format)
- GLB/GLTF (web/game engines)
- PNG/EXR (rendered images)

## Output Directory
Exported models are typically saved to your Blender project directory or specified export path.

For 3D printing, save STL files to: `/home/brandon/3d-prints/`

## Tips

### For Best Results
- **Be specific**: "A blue metallic sphere" works better than "a sphere"
- **Use measurements**: Specify dimensions in Blender units (default is meters)
- **Reference existing objects**: "Make it the same size as the cube"
- **Iterate**: Ask for refinements rather than starting over
- **Test exports**: Verify exports with small models first

### Common Use Cases
- **3D Printing**: Create printable parts with proper dimensions
- **Game Assets**: Generate models for game engines (export as FBX/GLB)
- **Product Design**: Prototype products with realistic materials
- **Visualization**: Create scenes for presentations or marketing
- **CAD Work**: Export to STEP for further engineering work

### Combining with Other Skills
- **build123d**: Use for parametric engineering parts
- **Blender MCP**: Use for artistic/visual design
- **ClaudeCAD**: Use for sketch-based modeling

## Environment Setup

### Check Blender Installation
```bash
blender --version
```

### Verify MCP Connection
```bash
# The MCP server should be running
ps aux | grep blender-mcp
```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| "Blender not found" | Install Blender or add to PATH |
| "MCP connection refused" | Start Blender and blender-mcp server |
| "Command failed" | Verify object names match, check Blender console |
| "Export not working" | Ensure write permissions to export directory |

## Requirements
- Blender 4.0 or newer
- blender-mcp package (pip install blender-mcp)
- Python 3.8+
- Blender running with MCP server enabled

## Resources
- **Official**: https://blender-mcp.com/
- **GitHub**: https://github.com/ahujasid/blender-mcp
- **PyPI**: https://pypi.org/project/blender-mcp/
- **Blender Documentation**: https://docs.blender.org/

## Last Updated
2026-02-18
