class CosmicSneaker3D {
    constructor(canvasId) {
        try {
            this.canvas = document.getElementById(canvasId);
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            
            this.width = this.canvas.width;
            this.height = this.canvas.height;
            
            // 3D rotation angles
            this.angleY = 0.02; // Initial rotation rate
            this.angleX = 0.2;  // Tilted forward slightly
            this.angleZ = 0;
            
            this.targetAngleX = 0.2;
            this.targetAngleY = 0;
            
            this.zoom = 150;
            this.isHovered = false;
            
            // Setup coordinates
            this.initPoints();
            this.initParticles();
            this.setupEvents();
            this.animate();
        } catch (e) {
            console.error("3D Sneaker Init Error:", e);
            this.initError = e.message;
        }
    }

    initPoints() {
        this.points = [];
        this.lines = [];
        
        // Helper to add a 3D point and return its index
        const addPt = (x, y, z) => {
            this.points.push({ x, y: -y, z }); // Invert Y for screen space
            return this.points.length - 1;
        };
        
        // Helper to add a line between point indices
        const addLn = (p1, p2, color = 'rgba(139, 92, 246, 0.7)', width = 2) => {
            this.lines.push({ p1, p2, color, width });
        };

        // --- 3D SNEAKER COORDINATES (Air Jordan 1 Silhouette) ---
        // Side width factor for 3D depth
        const w = 0.35;
        const wInner = 0.3;

        // 1. Sole / Midsole points (Base)
        // Outer edge
        const s1_o = addPt(1.2, -0.4, w);     // Toe outer
        const s2_o = addPt(0.8, -0.42, w * 1.1);
        const s3_o = addPt(0.3, -0.44, w * 1.15); // Arch
        const s4_o = addPt(-0.4, -0.45, w * 1.1);
        const s5_o = addPt(-0.9, -0.43, w * 0.9);
        const s6_o = addPt(-1.2, -0.4, w * 0.7);  // Heel outer
        
        // Inner edge
        const s1_i = addPt(1.2, -0.4, -w);    // Toe inner
        const s2_i = addPt(0.8, -0.42, -w * 0.8);
        const s3_i = addPt(0.3, -0.44, -w * 0.65); // Arch inner
        const s4_i = addPt(-0.4, -0.45, -w * 0.8);
        const s5_i = addPt(-0.9, -0.43, -w * 0.85);
        const s6_i = addPt(-1.2, -0.4, -w * 0.7); // Heel inner

        // Connect Sole loop
        addLn(s1_o, s2_o); addLn(s2_o, s3_o); addLn(s3_o, s4_o); addLn(s4_o, s5_o); addLn(s5_o, s6_o);
        addLn(s1_i, s2_i); addLn(s2_i, s3_i); addLn(s3_i, s4_i); addLn(s4_i, s5_i); addLn(s5_i, s6_i);
        addLn(s6_o, s6_i); // Heel back connect
        addLn(s1_o, s1_i); // Toe front connect

        // 2. Midsole upper edge (create volume for sole)
        const m1_o = addPt(1.2, -0.3, w);
        const m2_o = addPt(0.8, -0.32, w * 1.1);
        const m3_o = addPt(0.3, -0.34, w * 1.15);
        const m4_o = addPt(-0.4, -0.35, w * 1.1);
        const m5_o = addPt(-0.9, -0.33, w * 0.9);
        const m6_o = addPt(-1.2, -0.3, w * 0.7);

        const m1_i = addPt(1.2, -0.3, -w);
        const m2_i = addPt(0.8, -0.32, -w * 0.8);
        const m3_i = addPt(0.3, -0.34, -w * 0.65);
        const m4_i = addPt(-0.4, -0.35, -w * 0.8);
        const m5_i = addPt(-0.9, -0.33, -w * 0.85);
        const m6_i = addPt(-1.2, -0.3, -w * 0.7);

        // Connect Midsole loop
        addLn(m1_o, m2_o); addLn(m2_o, m3_o); addLn(m3_o, m4_o); addLn(m4_o, m5_o); addLn(m5_o, m6_o);
        addLn(m1_i, m2_i); addLn(m2_i, m3_i); addLn(m3_i, m4_i); addLn(m4_i, m5_i); addLn(m5_i, m6_i);
        addLn(m6_o, m6_i); addLn(m1_o, m1_i);

        // Connect Sole to Midsole (Vertical pillars)
        addLn(s1_o, m1_o); addLn(s3_o, m3_o); addLn(s5_o, m5_o); addLn(s6_o, m6_o);
        addLn(s1_i, m1_i); addLn(s3_i, m3_i); addLn(s5_i, m5_i); addLn(s6_i, m6_i);

        // Color theme palettes
        const neonCyan = 'rgba(6, 182, 212, 0.85)';
        const neonPurple = 'rgba(139, 92, 246, 0.85)';
        const neonPink = 'rgba(244, 114, 182, 0.85)';

        // 3. Toe Box Upper
        const t1_o = addPt(1.0, -0.15, w * 0.7);
        const t1_i = addPt(1.0, -0.15, -w * 0.7);
        const t2_c = addPt(0.9, -0.12, 0); // Center toe box

        addLn(m1_o, t1_o, neonCyan);
        addLn(m1_i, t1_i, neonCyan);
        addLn(t1_o, t2_c, neonCyan);
        addLn(t1_i, t2_c, neonCyan);
        addLn(t1_o, t1_i, neonCyan, 1);

        // 4. Laces Area (Tongue)
        const l1 = addPt(0.7, -0.05, 0);   // Lower laces center
        const l2 = addPt(0.5, 0.15, 0);
        const l3 = addPt(0.3, 0.35, 0);
        const l4 = addPt(0.1, 0.55, 0);    // Upper tongue center

        // Laces wings (Eyelets)
        const w1_o = addPt(0.7, -0.05, w * 0.8);
        const w2_o = addPt(0.5, 0.15, w * 0.85);
        const w3_o = addPt(0.3, 0.35, w * 0.85);
        const w4_o = addPt(0.1, 0.55, w * 0.75);

        const w1_i = addPt(0.7, -0.05, -w * 0.8);
        const w2_i = addPt(0.5, 0.15, -w * 0.8);
        const w3_i = addPt(0.3, 0.35, -w * 0.75);
        const w4_i = addPt(0.1, 0.55, -w * 0.65);

        // Connect laces wings to midsole
        addLn(t1_o, w1_o, neonPurple); addLn(t1_i, w1_i, neonPurple);
        addLn(w1_o, w2_o, neonPurple); addLn(w2_o, w3_o, neonPurple); addLn(w3_o, w4_o, neonPurple);
        addLn(w1_i, w2_i, neonPurple); addLn(w2_i, w3_i, neonPurple); addLn(w3_i, w4_i, neonPurple);

        // Connect laces (Crosses)
        addLn(w1_o, l1, neonPink, 1.5); addLn(w1_i, l1, neonPink, 1.5);
        addLn(w2_o, l2, neonPink, 1.5); addLn(w2_i, l2, neonPink, 1.5);
        addLn(w3_o, l3, neonPink, 1.5); addLn(w3_i, l3, neonPink, 1.5);
        addLn(w4_o, l4, neonPink, 1.5); addLn(w4_i, l4, neonPink, 1.5);

        // 5. Ankle Collar (High-Top)
        const c1_o = addPt(-0.2, 0.8, w * 0.6); // Front collar top outer
        const c1_i = addPt(-0.2, 0.8, -w * 0.5);
        const c2_o = addPt(-0.7, 0.75, w * 0.55); // Back collar top outer
        const c2_i = addPt(-0.7, 0.75, -w * 0.45);
        const c3_c = addPt(-0.85, 0.5, 0);       // Ankle back center

        // Connect collar rim loop
        addLn(w4_o, c1_o, neonCyan); addLn(w4_i, c1_i, neonCyan);
        addLn(c1_o, c2_o, neonCyan); addLn(c1_i, c2_i, neonCyan);
        addLn(c2_o, c3_c, neonCyan); addLn(c2_i, c3_c, neonCyan);
        addLn(c1_o, c1_i, neonCyan, 1);

        // 6. Heel Counter & Side Panels
        const h1_o = addPt(-1.1, 0.1, w * 0.65); // Heel outer side
        const h1_i = addPt(-1.1, 0.1, -w * 0.65);
        const h2_c = addPt(-1.2, 0.05, 0);      // Mid heel center back

        // Connect upper ankle collar down to heel
        addLn(c3_c, h2_c, neonPurple);
        addLn(c2_o, h1_o, neonPurple); addLn(c2_i, h1_i, neonPurple);
        addLn(h1_o, h2_c, neonPurple); addLn(h1_i, h2_c, neonPurple);

        // Connect heel counter to midsole
        addLn(h2_c, m6_o, neonPurple); addLn(h2_c, m6_i, neonPurple);
        addLn(h1_o, m5_o, neonPurple); addLn(h1_i, m5_i, neonPurple);

        // 7. Iconic Nike Swoosh (Side Panels)
        // Outer Swoosh
        const sw1_o = addPt(0.4, 0.0, w * 0.95);    // Front Swoosh tip
        const sw2_o = addPt(-0.1, 0.15, w * 0.9);   // Curve peak
        const sw3_o = addPt(-0.8, 0.45, w * 0.65);  // Swoosh back tail
        
        addLn(sw1_o, sw2_o, neonPink, 3);
        addLn(sw2_o, sw3_o, neonPink, 3.5);
        addLn(sw3_o, c2_o, neonPink, 1.5); // anchor to collar

        // Inner Swoosh
        const sw1_i = addPt(0.4, 0.0, -w * 0.95);
        const sw2_i = addPt(-0.1, 0.15, -w * 0.9);
        const sw3_i = addPt(-0.8, 0.45, -w * 0.65);

        addLn(sw1_i, sw2_i, neonPink, 3);
        addLn(sw2_i, sw3_i, neonPink, 3.5);
        addLn(sw3_i, c2_i, neonPink, 1.5);
    }

    initParticles() {
        this.particles = [];
        for (let i = 0; i < 40; i++) {
            this.particles.push({
                x: (Math.random() - 0.5) * 4,
                y: (Math.random() - 0.5) * 2 - 0.2,
                z: (Math.random() - 0.5) * 4,
                speed: 0.01 + Math.random() * 0.015,
                angle: Math.random() * Math.PI * 2,
                radius: 1 + Math.random() * 2,
                color: Math.random() > 0.5 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(244, 114, 182, 0.6)'
            });
        }
    }

    setupEvents() {
        window.addEventListener('resize', () => this.resize());
        this.resize();

        const container = this.canvas.parentElement;
        if (!container) return;

        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const mouseX = (e.clientX - rect.left) / rect.width - 0.5;
            const mouseY = (e.clientY - rect.top) / rect.height - 0.5;
            
            // Adjust angles slightly based on mouse
            this.targetAngleY = mouseX * 2.5;
            this.targetAngleX = 0.2 + mouseY * 1.5;
            this.isHovered = true;
        });

        container.addEventListener('mouseleave', () => {
            this.isHovered = false;
            this.targetAngleX = 0.2;
        });
    }

    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.width = rect.width || 500;
        this.height = rect.height || 500;
        
        // High DPI canvas support
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        this.canvas.style.width = `${this.width}px`;
        this.canvas.style.height = `${this.height}px`;
        
        this.zoom = Math.min(this.width, this.height) * 0.32;
    }

    project(pt, radX, radY, radZ) {
        // Rotate Z
        let x1 = pt.x * Math.cos(radZ) - pt.y * Math.sin(radZ);
        let y1 = pt.x * Math.sin(radZ) + pt.y * Math.cos(radZ);
        let z1 = pt.z;

        // Rotate Y
        let x2 = x1 * Math.cos(radY) - z1 * Math.sin(radY);
        let y2 = y1;
        let z2 = x1 * Math.sin(radY) + z1 * Math.cos(radY);

        // Rotate X
        let x3 = x2;
        let y3 = y2 * Math.cos(radX) - z2 * Math.sin(radX);
        let z3 = y2 * Math.sin(radX) + z2 * Math.cos(radX);

        // Perspective Projection
        const distance = 4;
        const perspective = distance / (distance - z3);
        
        const projX = x3 * this.zoom * perspective + this.width / 2;
        const projY = y3 * this.zoom * perspective + this.height / 2;

        return { x: projX, y: projY, depth: z3 };
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.initError) {
            this.ctx.fillStyle = '#ff6b6b';
            this.ctx.font = '14px sans-serif';
            this.ctx.fillText("Init Error: " + this.initError, 20, 40);
            return;
        }

        // Fallback for zoom to ensure sneaker is highly visible
        if (!this.zoom || this.zoom < 100) {
            this.zoom = Math.min(this.width, this.height) * 0.32;
            if (this.zoom < 100) this.zoom = 150;
        }

        // Handle auto-rotation vs mouse tracking
        if (!this.isHovered) {
            this.angleY += 0.015; // smooth orbit spin
        } else {
            this.angleY += (this.targetAngleY - this.angleY) * 0.1;
        }
        this.angleX += (this.targetAngleX - this.angleX) * 0.1;

        // Project all points
        const projected = this.points.map(pt => this.project(pt, this.angleX, this.angleY, this.angleZ));

        // Draw futuristic cosmic grid platform underneath
        this.drawPlatform();

        // Draw glowing particles orbiting the sneaker
        this.drawParticles();

        // Sort lines by average Z depth for correct painters algorithm rendering
        const sortedLines = this.lines.map((line, idx) => {
            const p1 = projected[line.p1];
            const p2 = projected[line.p2];
            const z1 = p1 ? p1.depth : 0;
            const z2 = p2 ? p2.depth : 0;
            return { line, avgDepth: (z1 + z2) / 2 };
        }).sort((a, b) => a.avgDepth - b.avgDepth);

        // Draw wireframe outlines with neon glow styles
        sortedLines.forEach(({ line }) => {
            try {
                const p1 = projected[line.p1];
                const p2 = projected[line.p2];
                if (!p1 || !p2) return;

                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                
                // Set neon line styles
                this.ctx.shadowBlur = this.isHovered ? 15 : 10;
                this.ctx.shadowColor = line.color;
                this.ctx.strokeStyle = line.color;
                this.ctx.lineWidth = line.width;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            } catch (err) {
                console.error("Line draw error:", err, line);
            }
        });

        // Reset shadow effects
        this.ctx.shadowBlur = 0;
    }

    drawPlatform() {
        const platformY = this.height * 0.72;
        const platformX = this.width / 2;
        const radX = 80;
        const radY = 24;

        // Draw multiple glowing neon space rings under the shoe
        for (let i = 3; i > 0; i--) {
            this.ctx.beginPath();
            this.ctx.ellipse(platformX, platformY + (i * 4), radX * (1 + i * 0.15), radY * (1 + i * 0.15), 0, 0, Math.PI * 2);
            this.ctx.strokeStyle = i === 1 ? 'rgba(6, 182, 212, 0.8)' : `rgba(139, 92, 246, ${0.4 / i})`;
            this.ctx.lineWidth = 4 - i;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
            this.ctx.stroke();
        }
        this.ctx.shadowBlur = 0;
    }

    drawParticles() {
        this.particles.forEach(p => {
            // Orbit calculation
            p.angle += p.speed;
            const orbitX = p.x * Math.cos(p.angle) - p.z * Math.sin(p.angle);
            const orbitZ = p.x * Math.sin(p.angle) + p.z * Math.cos(p.angle);
            const orbitY = p.y + Math.sin(p.angle * 2) * 0.1;

            // Project particle
            const pt = { x: orbitX, y: -orbitY, z: orbitZ };
            const proj = this.project(pt, this.angleX, this.angleY, this.angleZ);

            // Draw particle glow
            this.ctx.beginPath();
            const rad = Math.max(0.1, p.radius * (1 + proj.depth * 0.5));
            this.ctx.arc(proj.x, proj.y, rad, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;
    }
}

// Initialize when DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    new CosmicSneaker3D('sneaker3dCanvas');
});
