# Video Analysis & Motion Tracking (PhysicsKit)

A modern, high-precision, web-based video analysis and kinematics modeling simulation built for **The Thinking Experiment** curriculum. Replicates Logger Pro and Vernier Video Physics capabilities in a 100% free, private, client-side web application.

## Key Capabilities
- **Universal Video Support:** Drag and drop MP4, WebM, and MOV video files directly into the browser. No uploads to external servers; all data remains 100% local on student machines.
- **Built-in Lab Presets:** Includes synthetic high-speed video experiments:
  1. 2D Projectile Motion
  2. Free Fall ($g = 9.8\text{ m/s}^2$)
  3. Simple Harmonic Pendulum
  4. Elastic Cart Collision
- **Calibration Stick:** Precision draggable scale reference converting pixels to physical SI units (meters).
- **Coordinate Axes:** Draggable $(0, 0)$ origin with rotation angle controls.
- **Sub-Pixel Loupe Magnifier:** Floating zoom loupe allows sub-pixel center-of-mass tracking.
- **Kinematics Engine:** Centered 3-point numerical differentiation calculates instantaneous velocities ($v_x, v_y$) and accelerations.
- **Multi-Object Tracking:** Supports Series A (Amber `#d67b19`) and Series B (Teal `#0f7e9b`).
- **Synchronized Charts & Table:** Live Chart.js scatter plots with linear ($v$) and quadratic ($a$) regression fits, accompanied by synchronized data tables and one-click CSV export.

## Design System Adherence
- Strictly light mode (`color-scheme: light`, `#ffffff` background).
- Teal (`#0f7e9b`) headers and structural anchors.
- Amber (`#d67b19`) active tools and key accents.
- Inter and IBM Plex Sans typography.

## License
Free and open educational resource for physics educators and students. Part of The Thinking Experiment series.
