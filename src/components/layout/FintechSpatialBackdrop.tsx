import React, { useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import * as THREE from 'three';
import { ENV_CONFIG } from '../../config/envConfig';

interface FintechCameraPreset {
  pitch: number;
  yaw: number;
  camY: number;
  camZ: number;
  waveAmp: number;
  waveSpeed: number;
}

const CAMERA_PRESETS: FintechCameraPreset[] = [
  // 01. Isometric Settlement Grid (Default balanced corporate perspective)
  { pitch: 0.42, yaw: -0.18, camY: 135, camZ: 640, waveAmp: 22, waveSpeed: 0.55 },
  // 02. BCNF Double-Entry Topology (Slightly elevated wide node graph)
  { pitch: 0.58, yaw: 0.22, camY: 180, camZ: 600, waveAmp: 16, waveSpeed: 0.45 },
  // 03. SSI Vector Horizon (Low-angle horizon sweep)
  { pitch: 0.24, yaw: 0.04, camY: 75, camZ: 560, waveAmp: 28, waveSpeed: 0.65 },
  // 04. Zero-Trust Node Cluster (Angled deep-field node focus)
  { pitch: 0.36, yaw: -0.42, camY: 115, camZ: 520, waveAmp: 19, waveSpeed: 0.5 },
  // 05. Zenith Wireframe Plane (High architectural plan view)
  { pitch: 0.78, yaw: 0.0, camY: 240, camZ: 690, waveAmp: 14, waveSpeed: 0.4 },
];

interface Node3D {
  baseX: number;
  baseY: number;
  baseZ: number;
  phaseX: number;
  phaseY: number;
  phaseZ: number;
  speed: number;
  radius: number;
  tone: 'orange' | 'amber' | 'platinum';
}

function createDeterministicNodes(count: number): Node3D[] {
  const nodes: Node3D[] = [];
  for (let i = 0; i < count; i++) {
    // Golden-ratio quasi-random sequence for balanced, non-cluttered spatial distribution
    const u = (i * 0.61803398875) % 1;
    const v = (i * 1.32471795724 + 0.23) % 1;
    const w = (i * 0.75487766624 + 0.51) % 1;

    const tone: Node3D['tone'] =
      i % 5 === 0 ? 'orange' : i % 3 === 0 ? 'amber' : 'platinum';

    nodes.push({
      baseX: (u - 0.5) * 1240,
      baseY: (0.55 - v) * 420 + 20,
      baseZ: (w - 0.45) * 680,
      phaseX: i * 1.17,
      phaseY: i * 2.03,
      phaseZ: i * 0.83,
      speed: 0.22 + (i % 7) * 0.035,
      radius: tone === 'orange' ? 2.4 : tone === 'amber' ? 1.9 : 1.4,
      tone,
    });
  }
  return nodes;
}

/**
 * Generates a procedural soft radial glow sprite texture in memory (zero external 404 assets).
 */
function createProceduralNodeSpriteTexture(): THREE.CanvasTexture {
  const size = 64;
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = size;
  spriteCanvas.height = size;
  const ctx = spriteCanvas.getContext('2d');
  if (ctx) {
    const center = size / 2;
    const grad = ctx.createRadialGradient(center, center, 1, center, center, center);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.28, 'rgba(255, 235, 210, 0.88)');
    grad.addColorStop(0.62, 'rgba(255, 120, 20, 0.24)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(spriteCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface FintechSpatialBackdropProps {
  activeCameraIndex: number;
  isFullCanvasMode: boolean;
  onExitFullCanvasMode: () => void;
}

export const FintechSpatialBackdrop: React.FC<FintechSpatialBackdropProps> = ({
  activeCameraIndex,
  isFullCanvasMode,
  onExitFullCanvasMode,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const targetPresetRef = useRef<FintechCameraPreset>(
    CAMERA_PRESETS[activeCameraIndex] ?? CAMERA_PRESETS[0]
  );
  const isFullCanvasRef = useRef<boolean>(isFullCanvasMode);

  useEffect(() => {
    targetPresetRef.current =
      CAMERA_PRESETS[activeCameraIndex] ?? CAMERA_PRESETS[0];
  }, [activeCameraIndex]);

  useEffect(() => {
    isFullCanvasRef.current = isFullCanvasMode;
  }, [isFullCanvasMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL (SwiftShader / llvmpipe / Basic Render) to pace frame draws
    const isSoftwareGl = (() => {
      try {
        const probeCanvas = document.createElement('canvas');
        const gl = probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let width = Math.max(1, window.innerWidth);
    let height = Math.max(1, window.innerHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#101010');
    scene.fog = new THREE.FogExp2('#101010', 0.00095);

    const camera = new THREE.PerspectiveCamera(52, width / height, 10, 2600);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.domElement.setAttribute('data-testid', 'fintech-3d-canvas');
    renderer.domElement.className = 'block w-full h-full';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // -------------------------------------------------------------------------
    // 1. SINGLE SHARED THREE.BufferGeometry FOR ALL DATA NODES (1 Draw Call)
    // -------------------------------------------------------------------------
    const nodeCount = ENV_CONFIG.fintech3D.nodeCount;
    const nodes = createDeterministicNodes(nodeCount);
    const sharedNodesGeometry = new THREE.BufferGeometry();

    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeColors = new Float32Array(nodeCount * 3);

    // Factory Palette Data Accents: Signal Orange (#ee6018), Metric Green (#a0ca92), Bone (#eeeeee)
    const colorOrange = new THREE.Color('#ee6018');
    const colorAmber = new THREE.Color('#a0ca92');
    const colorPlatinum = new THREE.Color('#eeeeee');

    for (let i = 0; i < nodeCount; i++) {
      const n = nodes[i];
      const idx = i * 3;
      nodePositions[idx] = n.baseX;
      nodePositions[idx + 1] = n.baseY;
      nodePositions[idx + 2] = n.baseZ;

      const c =
        n.tone === 'orange'
          ? colorOrange
          : n.tone === 'amber'
            ? colorAmber
            : colorPlatinum;
      nodeColors[idx] = c.r;
      nodeColors[idx + 1] = c.g;
      nodeColors[idx + 2] = c.b;
    }

    const nodePositionAttr = new THREE.BufferAttribute(nodePositions, 3);
    nodePositionAttr.setUsage(THREE.DynamicDrawUsage);
    const nodeColorAttr = new THREE.BufferAttribute(nodeColors, 3);

    sharedNodesGeometry.setAttribute('position', nodePositionAttr);
    sharedNodesGeometry.setAttribute('color', nodeColorAttr);
    sharedNodesGeometry.computeBoundingSphere();

    const spriteTexture = createProceduralNodeSpriteTexture();
    const nodesMaterial = new THREE.PointsMaterial({
      size: 18,
      map: spriteTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const dataNodesPoints = new THREE.Points(sharedNodesGeometry, nodesMaterial);
    dataNodesPoints.frustumCulled = false;
    scene.add(dataNodesPoints);

    // -------------------------------------------------------------------------
    // 2. SINGLE SHARED THREE.BufferGeometry FOR PROXIMATE NODE LINKS (1 Draw Call)
    // -------------------------------------------------------------------------
    const maxPossibleLinks = (nodeCount * (nodeCount - 1)) / 2;
    const linkPositions = new Float32Array(maxPossibleLinks * 6);
    const sharedLinksGeometry = new THREE.BufferGeometry();
    const linkPositionAttr = new THREE.BufferAttribute(linkPositions, 3);
    linkPositionAttr.setUsage(THREE.DynamicDrawUsage);
    sharedLinksGeometry.setAttribute('position', linkPositionAttr);

    const linksMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#ee6018'),
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    });
    const nodeLinksSegments = new THREE.LineSegments(
      sharedLinksGeometry,
      linksMaterial
    );
    nodeLinksSegments.frustumCulled = false;
    scene.add(nodeLinksSegments);

    // -------------------------------------------------------------------------
    // 3. SINGLE SHARED THREE.BufferGeometry FOR TOPOGRAPHIC WAVE MESH (1 Draw Call)
    // -------------------------------------------------------------------------
    const gridCols = 22;
    const gridRows = 14;
    const gridSpacingX = 72;
    const gridSpacingZ = 60;
    const gridVertexCount = gridCols * gridRows;
    const gridPositions = new Float32Array(gridVertexCount * 3);

    const gridIndices: number[] = [];
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const current = r * gridCols + c;
        if (c + 1 < gridCols) {
          gridIndices.push(current, current + 1);
        }
        if (r + 1 < gridRows) {
          gridIndices.push(current, current + gridCols);
        }
      }
    }

    const sharedGridGeometry = new THREE.BufferGeometry();
    const gridPositionAttr = new THREE.BufferAttribute(gridPositions, 3);
    gridPositionAttr.setUsage(THREE.DynamicDrawUsage);
    sharedGridGeometry.setAttribute('position', gridPositionAttr);
    sharedGridGeometry.setIndex(gridIndices);

    const gridMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color('#3d3a39'),
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    const gridWireframe = new THREE.LineSegments(sharedGridGeometry, gridMaterial);
    gridWireframe.frustumCulled = false;
    scene.add(gridWireframe);

    // Pre-warm shaders on hardware GPUs
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // -------------------------------------------------------------------------
    // 4. INTERACTION & CAMERA KINEMATICS (Zero GC Allocations in Loop)
    // -------------------------------------------------------------------------
    const pointer = { targetX: 0, targetY: 0, currentX: 0, currentY: 0 };
    const handlePointerMove = (e: MouseEvent) => {
      pointer.targetX = (e.clientX / Math.max(width, 1) - 0.5) * 2;
      pointer.targetY = (e.clientY / Math.max(height, 1) - 0.5) * 2;
    };

    const handleResize = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    const reducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    const currentCam = { ...targetPresetRef.current };
    let frameId = 0;
    let timerId = 0;
    let isDisposed = false;
    let prevTime = performance.now();
    const startTime = prevTime;

    function afterDraw(cb: () => void) {
      if (isDisposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext | WebGLRenderingContext;
      if (gl && 'fenceSync' in gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            timerId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            timerId = window.setTimeout(cb, 80);
          }
        };
        timerId = window.setTimeout(poll, 5);
      } else {
        timerId = window.setTimeout(cb, 80);
      }
    }

    const tick = () => {
      if (isDisposed) return;
      const now = performance.now();
      const dt = Math.min(0.1, Math.max(0.001, (now - prevTime) * 0.001));
      prevTime = now;
      const elapsed = reducedMotion ? 0 : (now - startTime) * 0.001;

      const target = targetPresetRef.current;
      currentCam.pitch = THREE.MathUtils.damp(currentCam.pitch, target.pitch, 4.5, dt);
      currentCam.yaw = THREE.MathUtils.damp(currentCam.yaw, target.yaw, 4.5, dt);
      currentCam.camY = THREE.MathUtils.damp(currentCam.camY, target.camY, 4.5, dt);
      currentCam.camZ = THREE.MathUtils.damp(currentCam.camZ, target.camZ, 4.5, dt);
      currentCam.waveAmp = THREE.MathUtils.damp(currentCam.waveAmp, target.waveAmp, 4.5, dt);
      currentCam.waveSpeed = THREE.MathUtils.damp(
        currentCam.waveSpeed,
        target.waveSpeed,
        4.5,
        dt
      );

      pointer.currentX = THREE.MathUtils.damp(pointer.currentX, pointer.targetX, 3.8, dt);
      pointer.currentY = THREE.MathUtils.damp(pointer.currentY, pointer.targetY, 3.8, dt);

      const effectiveYaw = currentCam.yaw + pointer.currentX * 0.14;
      const effectivePitch = currentCam.pitch + pointer.currentY * 0.08;

      const radius = currentCam.camZ;
      camera.position.set(
        Math.sin(effectiveYaw) * Math.cos(effectivePitch) * radius,
        currentCam.camY + Math.sin(effectivePitch) * radius * 0.42,
        Math.cos(effectiveYaw) * Math.cos(effectivePitch) * radius
      );
      camera.lookAt(0, -35, 0);

      // Sync 3D spatial scene palette with active theme mode (Dark Mode vs Light Mode)
      const isLightTheme =
        typeof document !== 'undefined' &&
        document.documentElement.getAttribute('data-theme') === 'light';
      const targetBgHex = isLightTheme ? 0xe5e2dc : 0x101010;
      if ((scene.background as THREE.Color).getHex() !== targetBgHex) {
        (scene.background as THREE.Color).setHex(targetBgHex);
        if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.setHex(targetBgHex);
        }
        gridMaterial.color.setHex(isLightTheme ? 0x8a8380 : 0x3d3a39);
        nodesMaterial.blending = isLightTheme
          ? THREE.NormalBlending
          : THREE.AdditiveBlending;
        nodesMaterial.needsUpdate = true;
      }

      // Update material opacities smoothly based on full-canvas showcase mode
      gridMaterial.opacity = isFullCanvasRef.current
        ? isLightTheme
          ? 0.45
          : 0.3
        : isLightTheme
          ? 0.32
          : 0.2;
      linksMaterial.opacity = isFullCanvasRef.current
        ? isLightTheme
          ? 0.35
          : 0.24
        : isLightTheme
          ? 0.24
          : 0.15;

      // Update shared topographic grid BufferGeometry in-place
      const phase = elapsed * currentCam.waveSpeed;
      let vIdx = 0;
      for (let r = 0; r < gridRows; r++) {
        const gz = (r - gridRows * 0.48) * gridSpacingZ;
        for (let c = 0; c < gridCols; c++) {
          const gx = (c - (gridCols - 1) * 0.5) * gridSpacingX;
          const waveY =
            -145 +
            Math.sin(gx * 0.0055 + phase) *
              Math.cos(gz * 0.0065 + phase * 0.8) *
              currentCam.waveAmp +
            Math.sin((gx + gz) * 0.003 - phase * 0.6) *
              (currentCam.waveAmp * 0.45);

          gridPositionAttr.setXYZ(vIdx, gx, waveY, gz);
          vIdx++;
        }
      }
      gridPositionAttr.needsUpdate = true;

      // Update single shared data nodes BufferGeometry in-place
      for (let i = 0; i < nodeCount; i++) {
        const n = nodes[i];
        const x3 = n.baseX + Math.sin(elapsed * n.speed + n.phaseX) * 28;
        const y3 = n.baseY + Math.cos(elapsed * (n.speed * 0.85) + n.phaseY) * 20;
        const z3 = n.baseZ + Math.sin(elapsed * (n.speed * 0.65) + n.phaseZ) * 24;
        nodePositionAttr.setXYZ(i, x3, y3, z3);
      }
      nodePositionAttr.needsUpdate = true;

      // Update proximate settlement link segments in-place
      const maxDistSq = 290 * 290;
      let activeLinkVertices = 0;
      for (let i = 0; i < nodeCount; i++) {
        const ax = nodePositionAttr.getX(i);
        const ay = nodePositionAttr.getY(i);
        const az = nodePositionAttr.getZ(i);

        for (let j = i + 1; j < nodeCount; j++) {
          const bx = nodePositionAttr.getX(j);
          const by = nodePositionAttr.getY(j);
          const bz = nodePositionAttr.getZ(j);

          const dx = ax - bx;
          const dy = ay - by;
          const dz = az - bz;
          if (dx * dx + dy * dy + dz * dz < maxDistSq) {
            linkPositionAttr.setXYZ(activeLinkVertices, ax, ay, az);
            linkPositionAttr.setXYZ(activeLinkVertices + 1, bx, by, bz);
            activeLinkVertices += 2;
          }
        }
      }
      sharedLinksGeometry.setDrawRange(0, activeLinkVertices);
      linkPositionAttr.needsUpdate = true;

      renderer.render(scene, camera);

      if (!reducedMotion) {
        if (isSoftwareGl) {
          afterDraw(tick);
        } else {
          frameId = window.requestAnimationFrame(tick);
        }
      }
    };

    tick();

    return () => {
      isDisposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timerId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);

      sharedNodesGeometry.dispose();
      sharedLinksGeometry.dispose();
      sharedGridGeometry.dispose();
      nodesMaterial.dispose();
      linksMaterial.dispose();
      gridMaterial.dispose();
      spriteTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <>
      <div
        ref={mountRef}
        className="fixed inset-0 z-0 pointer-events-none"
      />

      {isFullCanvasMode && (
        <div className="fixed top-20 right-6 z-40 pointer-events-auto">
          <button
            type="button"
            onClick={onExitFullCanvasMode}
            className="py-2.5 px-5 rounded-full btn-blaze-orange text-xs flex items-center gap-2 shadow-2xl"
          >
            <Layers className="w-4 h-4" />
            <span>Return to Jain Pay 3D Command Deck</span>
          </button>
        </div>
      )}
    </>
  );
};

