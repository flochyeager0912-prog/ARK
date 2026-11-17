"use client";

import { useEffect, useRef } from "react";
import type { Color } from "three";

/**
 * Fixed, full-viewport 3D backdrop for the public site.
 *
 * A calm composition: a bevelled ivory cross in a soft beam of light, two slow halo rings, an
 * orbit of light "nodes" joined by fine lines (the church family), a faint perspective floor and
 * drifting motes of light. The camera glides with scroll progress and eases toward the pointer;
 * the cross always turns to face the viewer, so it never reads as a thin bar.
 *
 * Layout: on wide screens the projection is shifted (camera view offset) so the centrepiece sits
 * in the open column to the right of the hero copy instead of behind the text.
 *
 * Robustness:
 *  - three.js is imported lazily, so it never blocks first paint or hydration.
 *  - No WebGL → the CSS gradient underneath is the whole background (nothing breaks).
 *  - prefers-reduced-motion → one static frame (re-rendered on resize only).
 *  - The render loop pauses while the tab is hidden; everything is disposed on unmount.
 */
export function SceneBackground() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      if (disposed) return;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const small = () => window.innerWidth < 768;

      let renderer: import("three").WebGLRenderer;
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      } catch {
        return; // WebGL unavailable — keep the CSS background.
      }
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x03050c, 0.045);
      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);

      const BLUE = new THREE.Color("#9db1ff");
      const GOLD = new THREE.Color("#f3cf7a");
      const disposables: { dispose: () => void }[] = [];
      const keep = <T extends { dispose: () => void }>(x: T) => (disposables.push(x), x);

      // Lights
      scene.add(new THREE.AmbientLight(0xb8c4ff, 0.55));
      const key = new THREE.DirectionalLight(0xc9d4ff, 1.1);
      key.position.set(4, 6, 6);
      scene.add(key);
      const warm = new THREE.PointLight(0xf3cf7a, 14, 14, 1.6);
      warm.position.set(0, 0.6, 1.4);
      scene.add(warm);
      // Cool rim light from behind gives the cross a clean, defined edge.
      const rim = new THREE.DirectionalLight(0x9db1ff, 0.9);
      rim.position.set(-3, 2, -5);
      scene.add(rim);

      // Everything that forms the centrepiece lives in one group so it can be offset as a whole.
      const world = new THREE.Group();
      scene.add(world);

      // Soft radial glow sprite (canvas texture)
      const glowTex = (() => {
        const c = document.createElement("canvas");
        c.width = c.height = 128;
        const g = c.getContext("2d")!;
        const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        grd.addColorStop(0, "rgba(255,255,255,1)");
        grd.addColorStop(0.25, "rgba(255,255,255,0.45)");
        grd.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = grd;
        g.fillRect(0, 0, 128, 128);
        return keep(new THREE.CanvasTexture(c));
      })();
      const glow = (color: Color, size: number, opacity: number) => {
        const s = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending })));
        s.scale.setScalar(size);
        return s;
      };

      // Soft vertical beam of light behind the cross (canvas texture, additive).
      const beamTex = (() => {
        const c = document.createElement("canvas");
        c.width = 64;
        c.height = 256;
        const g = c.getContext("2d")!;
        const across = g.createLinearGradient(0, 0, 64, 0);
        across.addColorStop(0, "rgba(255,255,255,0)");
        across.addColorStop(0.5, "rgba(255,255,255,1)");
        across.addColorStop(1, "rgba(255,255,255,0)");
        g.fillStyle = across;
        g.fillRect(0, 0, 64, 256);
        g.globalCompositeOperation = "destination-in";
        const along = g.createLinearGradient(0, 0, 0, 256);
        along.addColorStop(0, "rgba(0,0,0,0)");
        along.addColorStop(0.35, "rgba(0,0,0,1)");
        along.addColorStop(0.75, "rgba(0,0,0,0.6)");
        along.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = along;
        g.fillRect(0, 0, 64, 256);
        return keep(new THREE.CanvasTexture(c));
      })();
      const beam = new THREE.Sprite(keep(new THREE.SpriteMaterial({ map: beamTex, color: GOLD, transparent: true, opacity: 0.16, depthWrite: false, blending: THREE.AdditiveBlending })));
      beam.scale.set(1.6, 9, 1);
      beam.position.set(0, 1.2, -0.6);
      world.add(beam);

      // Cross: one extruded outline with rounded (bevelled) edges, so it reads as a single clean form.
      const cross = new THREE.Group();
      const crossShape = (() => {
        const w = 0.1, top = 1.12, bottom = -1.12, arm = 0.64, y = 0.42, t = 0.1;
        const sh = new THREE.Shape();
        sh.moveTo(-w, bottom);
        [[w, bottom], [w, y - t], [arm, y - t], [arm, y + t], [w, y + t], [w, top], [-w, top], [-w, y + t], [-arm, y + t], [-arm, y - t], [-w, y - t]].forEach(([x, yy]) => sh.lineTo(x!, yy!));
        sh.closePath();
        return sh;
      })();
      const crossGeo = keep(new THREE.ExtrudeGeometry(crossShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.035, bevelSegments: 5, curveSegments: 4 }));
      crossGeo.translate(0, 0, -0.06);
      const crossMat = keep(
        new THREE.MeshPhysicalMaterial({ color: 0xf7f2e8, emissive: GOLD, emissiveIntensity: 0.2, metalness: 0.1, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.3 }),
      );
      cross.add(new THREE.Mesh(crossGeo, crossMat), glow(GOLD, 4.4, 0.3));
      world.add(cross);

      // Halo rings
      const ringMat = (color: Color, opacity: number) =>
        keep(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.55, transparent: true, opacity, metalness: 0.1, roughness: 0.5 }));
      const halo = new THREE.Mesh(keep(new THREE.TorusGeometry(2.25, 0.022, 12, 180)), ringMat(BLUE, 0.75));
      halo.rotation.x = Math.PI * 0.42;
      const halo2 = new THREE.Mesh(keep(new THREE.TorusGeometry(2.9, 0.012, 8, 200)), ringMat(GOLD, 0.45));
      halo2.rotation.x = Math.PI * 0.58;
      halo2.rotation.y = 0.35;
      // Large, faint outer arc (like a horizon of light)
      const arc = new THREE.Mesh(keep(new THREE.TorusGeometry(6.2, 0.05, 10, 240)), ringMat(new THREE.Color("#5e6fb8"), 0.22));
      arc.rotation.set(0.15, 0.4, 0.2);
      world.add(halo, halo2, arc);

      // Orbiting nodes connected to the centre
      const ORBIT = 3.9;
      const nodeCount = small() ? 6 : 9;
      const nodeGeo = keep(new THREE.SphereGeometry(1, 24, 24));
      const nodes = Array.from({ length: nodeCount }, (_, i) => {
        const color = i % 3 === 0 ? GOLD : BLUE;
        const mesh = new THREE.Mesh(nodeGeo, keep(new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6, roughness: 0.4 })));
        const size = 0.06 + ((i * 37) % 7) * 0.012;
        mesh.scale.setScalar(size);
        mesh.add(glow(color, 9, 0.35));
        world.add(mesh);
        return { mesh, phase: (i / nodeCount) * Math.PI * 2, speed: 0.05 + (i % 4) * 0.012, tilt: ((i % 5) - 2) * 0.18, r: ORBIT * (0.82 + (i % 3) * 0.12) };
      });
      const orbitRing = new THREE.Mesh(keep(new THREE.TorusGeometry(ORBIT, 0.008, 6, 240)), ringMat(BLUE, 0.28));
      orbitRing.rotation.x = Math.PI / 2;
      orbitRing.scale.set(1, 1, 1);
      world.add(orbitRing);

      const lineGeo = keep(new THREE.BufferGeometry());
      const linePos = new Float32Array(nodeCount * 2 * 3 * 2); // spoke to centre + link to next node
      lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
      const lines = new THREE.LineSegments(lineGeo, keep(new THREE.LineBasicMaterial({ color: 0x9db1ff, transparent: true, opacity: 0.16, depthWrite: false })));
      world.add(lines);

      // Floating soft shapes
      const shapeMat = (c: string) => keep(new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: 0.22, roughness: 0.25, metalness: 0.2 }));
      const floaters = [
        { geo: new THREE.OctahedronGeometry(0.5), mat: shapeMat("#f3cf7a"), pos: [-4.6, 1.8, -2] },
        { geo: new THREE.TorusGeometry(0.45, 0.16, 16, 48), mat: shapeMat("#9db1ff"), pos: [4.8, -1.4, -1.5] },
        { geo: new THREE.IcosahedronGeometry(0.55, 0), mat: shapeMat("#c8d2ff"), pos: [-3.6, -2.2, 1] },
        { geo: new THREE.BoxGeometry(0.6, 0.6, 0.6), mat: shapeMat("#9db1ff"), pos: [3.4, 2.6, -3] },
      ].map(({ geo, mat, pos }, i) => {
        keep(geo);
        const m = new THREE.Mesh(geo, mat);
        m.position.set(pos[0]!, pos[1]!, pos[2]!);
        world.add(m);
        return { m, base: m.position.y, phase: i * 1.7 };
      });

      // Floor grid
      const grid = new THREE.GridHelper(90, 90, 0x3a4a8a, 0x1c2550);
      const gridMat = grid.material as import("three").Material;
      gridMat.transparent = true;
      gridMat.opacity = 0.2;
      grid.position.y = -3.4;
      keep(grid.geometry);
      keep(gridMat);
      scene.add(grid);

      // Motes of light
      const moteCount = small() ? 160 : 420;
      const motePos = new Float32Array(moteCount * 3);
      for (let i = 0; i < moteCount; i++) {
        motePos[i * 3] = (Math.random() - 0.5) * 34;
        motePos[i * 3 + 1] = (Math.random() - 0.5) * 18;
        motePos[i * 3 + 2] = (Math.random() - 0.5) * 26;
      }
      const moteGeo = keep(new THREE.BufferGeometry());
      moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));
      const motes = new THREE.Points(
        moteGeo,
        keep(new THREE.PointsMaterial({ size: 0.045, map: glowTex, color: 0xdfe6ff, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true })),
      );
      scene.add(motes);

      // ---------------------------------------------------------------- layout & input
      const target = { progress: 0, px: 0, py: 0 };
      const current = { progress: 0, px: 0, py: 0 };

      const resize = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        // Desktop: shift the whole projection so the centrepiece sits right of the content column
        // (a view offset moves the picture, not the world, so it stays put as the camera orbits).
        // Phones and tablets: centred and quieter behind the full-width panels.
        // Between 1024 and 1280 the hero card takes more of the width, so the picture moves
        // further right and is drawn a little smaller to fit the narrower free column.
        if (w >= 1024) camera.setViewOffset(w, h, -w * (w >= 1280 ? 0.23 : 0.33), 0, w, h);
        else camera.clearViewOffset();
        camera.zoom = w >= 1280 || w < 1024 ? 1 : 0.74;
        camera.updateProjectionMatrix();
        renderer.domElement.style.opacity = w < 768 ? "0.5" : "1";
      };
      const readScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        target.progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      };
      const onPointer = (e: PointerEvent) => {
        target.px = (e.clientX / window.innerWidth) * 2 - 1;
        target.py = (e.clientY / window.innerHeight) * 2 - 1;
      };

      let last = performance.now();
      let elapsed = 0;
      const frame = (animate: boolean) => {
        const now = performance.now();
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        if (animate) elapsed += dt;
        const ease = animate ? 1 - Math.pow(0.0015, dt) : 1; // frame-rate independent damping
        current.progress += (target.progress - current.progress) * ease;
        current.px += (target.px - current.px) * ease * 0.6;
        current.py += (target.py - current.py) * ease * 0.6;

        const p = current.progress;
        const theta = -0.35 + p * Math.PI * 0.85;
        const radius = 10.5 - Math.sin(p * Math.PI) * 3.2;
        camera.position.set(
          Math.sin(theta) * radius + current.px * 0.5,
          0.9 - p * 1.6 - current.py * 0.35,
          Math.cos(theta) * radius,
        );
        camera.lookAt(0, -0.1 - p * 0.4, 0);

        const t = elapsed;
        // Face the camera, with only a gentle sway — the cross never turns edge-on.
        cross.rotation.y = Math.atan2(camera.position.x, camera.position.z) + Math.sin(t * 0.3) * 0.22;
        cross.position.y = Math.sin(t * 0.6) * 0.06;
        beam.material.opacity = 0.13 + Math.sin(t * 0.4) * 0.03;
        halo.rotation.z = t * 0.08;
        halo2.rotation.z = -t * 0.05;
        arc.rotation.z = t * 0.012;

        let k = 0;
        const push = (x: number, y: number, z: number) => {
          linePos[k++] = x;
          linePos[k++] = y;
          linePos[k++] = z;
        };
        nodes.forEach((n, i) => {
          const a = n.phase + t * n.speed;
          n.mesh.position.set(Math.cos(a) * n.r, Math.sin(a * 2 + i) * 0.25 + n.tilt, Math.sin(a) * n.r);
        });
        nodes.forEach((n, i) => {
          const a = n.mesh.position;
          const b = nodes[(i + 1) % nodes.length]!.mesh.position;
          push(0, 0.42, 0);
          push(a.x, a.y, a.z);
          push(a.x, a.y, a.z);
          push(b.x, b.y, b.z);
        });
        lineGeo.attributes.position!.needsUpdate = true;

        floaters.forEach((f) => {
          f.m.rotation.x = t * 0.15 + f.phase;
          f.m.rotation.y = t * 0.2 + f.phase;
          f.m.position.y = f.base + Math.sin(t * 0.5 + f.phase) * 0.2;
        });
        motes.rotation.y = t * 0.01;
        motes.position.y = Math.sin(t * 0.1) * 0.3;

        renderer.render(scene, camera);
      };

      let raf = 0;
      const loop = () => {
        frame(true);
        raf = requestAnimationFrame(loop);
      };
      const start = () => {
        if (!raf && !reduceMotion && document.visibilityState === "visible") {
          last = performance.now();
          raf = requestAnimationFrame(loop);
        }
      };
      const stop = () => {
        cancelAnimationFrame(raf);
        raf = 0;
      };
      const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());
      const onResize = () => {
        resize();
        if (reduceMotion) frame(false);
      };

      resize();
      readScroll();
      frame(false);
      host.dataset.ready = "true";
      start();

      window.addEventListener("resize", onResize);
      window.addEventListener("scroll", readScroll, { passive: true });
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      cleanup = () => {
        stop();
        window.removeEventListener("resize", onResize);
        window.removeEventListener("scroll", readScroll);
        window.removeEventListener("pointermove", onPointer);
        document.removeEventListener("visibilitychange", onVisibility);
        disposables.forEach((d) => d.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Base gradient: always present, and the full background when WebGL is unavailable. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 600px at 78% 30%, rgb(76 98 196 / 0.22), transparent 65%), radial-gradient(700px 500px at 12% 85%, rgb(243 207 122 / 0.07), transparent 60%), linear-gradient(180deg, #050812 0%, #03050c 100%)",
        }}
      />
      <div
        ref={hostRef}
        className="absolute inset-0 opacity-0 transition-opacity duration-[1400ms] data-[ready=true]:opacity-100 [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
      />
      {/* Vignette keeps text contrast high at the edges */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(120% 90% at 50% 40%, transparent 55%, rgb(3 5 12 / 0.75) 100%)" }} />
    </div>
  );
}
