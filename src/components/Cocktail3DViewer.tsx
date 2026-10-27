import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Sun, 
  Flame, 
  Wine, 
  Maximize2,
  Volume2
} from 'lucide-react';
import { sounds } from '../utils/audio';

export type GlassStyle = 'coupe' | 'highball' | 'rocks';

interface Cocktail3DViewerProps {
  colorTheme?: string;
  cocktailName?: string;
  initialGlass?: string;
  spiritBase?: string;
  sweetness?: number;
  fruitiness?: number;
  onShake?: () => void;
  heightClass?: string;
}

export const Cocktail3DViewer: React.FC<Cocktail3DViewerProps> = ({
  colorTheme = 'tropical',
  cocktailName = 'Signature Mix',
  initialGlass,
  spiritBase = 'Vodka',
  sweetness = 3,
  fruitiness = 4,
  onShake,
  heightClass = 'h-[320px] sm:h-[380px]',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Glass style selection
  const resolveInitialGlass = (): GlassStyle => {
    const g = (initialGlass || '').toLowerCase();
    if (g.includes('coupe') || g.includes('martini') || g.includes('saucer')) return 'coupe';
    if (g.includes('highball') || g.includes('collins') || g.includes('long')) return 'highball';
    return 'rocks';
  };

  const [glassStyle, setGlassStyle] = useState<GlassStyle>(resolveInitialGlass());
  const [hasIce, setHasIce] = useState<boolean>(true);
  const [hasGarnish, setHasGarnish] = useState<boolean>(true);
  const [lightingMode, setLightingMode] = useState<'lounge' | 'neon' | 'sun'>('lounge');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);

  // References for animation loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cocktailGroupRef = useRef<THREE.Group | null>(null);
  const liquidMeshRef = useRef<THREE.Mesh | null>(null);
  const iceGroupRef = useRef<THREE.Group | null>(null);
  const garnishGroupRef = useRef<THREE.Group | null>(null);
  const bubblesGroupRef = useRef<THREE.Points | null>(null);
  const lightsRef = useRef<{
    keyLight?: THREE.DirectionalLight;
    rimLight?: THREE.DirectionalLight;
    fillLight?: THREE.DirectionalLight;
    ambient?: THREE.AmbientLight;
  }>({});

  const animationFrameIdRef = useRef<number | null>(null);
  const shakeStartTimeRef = useRef<number | null>(null);

  // Interaction drag rotation
  const isDraggingRef = useRef<boolean>(false);
  const prevMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationVelocityRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const targetRotationRef = useRef<{ x: number; y: number }>({ x: 0.15, y: 0 });

  // Map theme or spirits to liquid colors
  const liquidColors = useMemo(() => {
    const t = colorTheme.toLowerCase();
    if (t.includes('berry') || t.includes('velvet') || t.includes('black')) {
      return { main: 0x8a0f3e, specular: 0xff3377, depth: 0x3d0216, foam: 0xff99bb };
    }
    if (t.includes('tropical') || t.includes('passion') || t.includes('spritz')) {
      return { main: 0xf39c12, specular: 0xffe680, depth: 0x8d4800, foam: 0xfffae6 };
    }
    if (t.includes('citrus') || t.includes('mojito') || t.includes('fresh') || t.includes('basilic')) {
      return { main: 0x27ae60, specular: 0xa8f5b8, depth: 0x0c4a22, foam: 0xebfaef };
    }
    if (t.includes('floral') || t.includes('rose') || t.includes('lavender')) {
      return { main: 0xba55d3, specular: 0xf8bfff, depth: 0x4a1259, foam: 0xfcedff };
    }
    if (t.includes('bitter') || t.includes('aperitif') || t.includes('negroni')) {
      return { main: 0xd32f2f, specular: 0xff7961, depth: 0x5a0b0b, foam: 0xffcdd2 };
    }
    if (t.includes('warm') || t.includes('whisky') || t.includes('bourbon') || t.includes('spiced')) {
      return { main: 0xb8621b, specular: 0xfcd088, depth: 0x4e2300, foam: 0xfff0db };
    }
    // Default refined amber-sunset
    return { main: 0xdd5b45, specular: 0xff9575, depth: 0x5e1509, foam: 0xffded6 };
  }, [colorTheme, spiritBase, sweetness, fruitiness]);

  // Handle shake trigger
  const triggerShake = () => {
    sounds.playGlassClink();
    setIsShaking(true);
    shakeStartTimeRef.current = performance.now();
    if (onShake) onShake();
    setTimeout(() => {
      setIsShaking(false);
      shakeStartTimeRef.current = null;
    }, 1200);
  };

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // Detect software rendering
    let isSoftwareGl = false;
    try {
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          const rendererStr = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
          if (rendererStr.includes('swiftshader') || rendererStr.includes('llvmpipe') || rendererStr.includes('software')) {
            isSoftwareGl = true;
          }
        }
      }
    } catch {
      // fallback safe
    }

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 0.8, 4.2);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSoftwareGl ? 1 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    rendererRef.current = renderer;

    // 3. Lighting setup (studio aesthetic)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xfff5e6, 2.8);
    keyLight.position.set(3, 4, 3);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xff77aa, 2.2);
    rimLight.position.set(-3, 3, -2);
    scene.add(rimLight);

    const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.4);
    fillLight.position.set(0, -2, 2.5);
    scene.add(fillLight);

    lightsRef.current = { keyLight, rimLight, fillLight, ambient: ambientLight };

    // 4. Subtle Ground Pedestal with reflections
    const pedestalGeo = new THREE.CylinderGeometry(1.6, 1.8, 0.08, 48);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      metalness: 0.85,
      roughness: 0.25,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -1.25;
    scene.add(pedestal);

    // Pedestal rim glow ring
    const ringGeo = new THREE.RingGeometry(1.6, 1.63, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: liquidColors.main,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const glowRing = new THREE.Mesh(ringGeo, ringMat);
    glowRing.rotation.x = -Math.PI / 2;
    glowRing.position.y = -1.2;
    scene.add(glowRing);

    // 5. Main Cocktail Container Group
    const cocktailGroup = new THREE.Group();
    cocktailGroup.position.y = -0.15;
    scene.add(cocktailGroup);
    cocktailGroupRef.current = cocktailGroup;

    // Build the glassware & cocktail contents
    rebuildGlassware();

    // 6. Responsive Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 7. Drag rotation event handlers
    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - prevMousePosRef.current.x;
      const deltaY = e.clientY - prevMousePosRef.current.y;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };

      targetRotationRef.current.y += deltaX * 0.008;
      targetRotationRef.current.x = Math.max(-0.4, Math.min(0.6, targetRotationRef.current.x + deltaY * 0.008));
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // 8. Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animationFrameIdRef.current = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();

      // Shake animation effect
      let shakeOffsetX = 0;
      let shakeOffsetY = 0;
      let shakeRotZ = 0;

      if (shakeStartTimeRef.current !== null) {
        const shakeDuration = 1.2;
        const elapsedShake = (performance.now() - shakeStartTimeRef.current) / 1000;
        if (elapsedShake < shakeDuration) {
          const intensity = Math.sin((elapsedShake / shakeDuration) * Math.PI) * 0.12;
          shakeOffsetX = Math.sin(elapsedShake * 35) * intensity;
          shakeOffsetY = Math.cos(elapsedShake * 28) * (intensity * 0.8);
          shakeRotZ = Math.sin(elapsedShake * 30) * (intensity * 0.5);
        }
      }

      // Smooth camera / object rotation with damping
      if (cocktailGroupRef.current) {
        if (autoRotate && !isDraggingRef.current && shakeStartTimeRef.current === null) {
          targetRotationRef.current.y += 0.004;
        }

        // Apply smooth interpolation
        cocktailGroupRef.current.rotation.y += (targetRotationRef.current.y - cocktailGroupRef.current.rotation.y) * 0.08;
        cocktailGroupRef.current.rotation.x += (targetRotationRef.current.x - cocktailGroupRef.current.rotation.x) * 0.08;
        
        cocktailGroupRef.current.position.x = shakeOffsetX;
        cocktailGroupRef.current.position.y = -0.15 + shakeOffsetY;
        cocktailGroupRef.current.rotation.z = shakeRotZ;
      }

      // Floating ice cubes gentle movement
      if (iceGroupRef.current) {
        iceGroupRef.current.children.forEach((cube: THREE.Object3D, i: number) => {
          cube.rotation.x += 0.005 * (i % 2 === 0 ? 1 : -1);
          cube.rotation.y += 0.004;
          cube.position.y += Math.sin(elapsedTime * 2 + i) * 0.0006;
        });
      }

      // Micro-bubbles rising
      if (bubblesGroupRef.current) {
        const posAttr = bubblesGroupRef.current.geometry.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          let y = posAttr.getY(i);
          y += 0.006;
          if (y > 0.85) {
            y = -0.6; // reset to bottom
          }
          posAttr.setY(i, y);
        }
        posAttr.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      resizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      // Clean up Three.js resources
      scene.clear();
      renderer.dispose();
    };
  }, []);

  // Update lighting theme
  useEffect(() => {
    const lights = lightsRef.current;
    if (!lights.keyLight || !lights.rimLight || !lights.fillLight || !lights.ambient) return;

    if (lightingMode === 'lounge') {
      lights.ambient.color.setHex(0xffffff);
      lights.ambient.intensity = 0.9;
      lights.keyLight.color.setHex(0xffecd2);
      lights.keyLight.intensity = 2.8;
      lights.rimLight.color.setHex(0xf472b6);
      lights.rimLight.intensity = 2.0;
      lights.fillLight.color.setHex(0x38bdf8);
      lights.fillLight.intensity = 1.3;
    } else if (lightingMode === 'neon') {
      lights.ambient.color.setHex(0x1a1236);
      lights.ambient.intensity = 0.6;
      lights.keyLight.color.setHex(0xe879f9);
      lights.keyLight.intensity = 3.6;
      lights.rimLight.color.setHex(0x22d3ee);
      lights.rimLight.intensity = 3.2;
      lights.fillLight.color.setHex(0xc084fc);
      lights.fillLight.intensity = 2.0;
    } else {
      // sun golden hour
      lights.ambient.color.setHex(0xffeedd);
      lights.ambient.intensity = 1.1;
      lights.keyLight.color.setHex(0xfbbf24);
      lights.keyLight.intensity = 3.2;
      lights.rimLight.color.setHex(0xf97316);
      lights.rimLight.intensity = 2.4;
      lights.fillLight.color.setHex(0xffedd5);
      lights.fillLight.intensity = 1.4;
    }
  }, [lightingMode]);

  // Rebuild glass and cocktail when glassStyle, hasIce, or hasGarnish changes
  const rebuildGlassware = () => {
    const group = cocktailGroupRef.current;
    if (!group) return;

    // Clear existing children
    while (group.children.length > 0) {
      const obj = group.children[0];
      group.remove(obj);
    }

    // High quality glass material with transmission
    const glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.96,
      opacity: 1,
      transparent: true,
      roughness: 0.04,
      ior: 1.52,
      thickness: 1.2,
      specularIntensity: 1.0,
      specularColor: 0xffffff,
      depthWrite: false,
    });

    // Liquid material
    const liquidMaterial = new THREE.MeshPhysicalMaterial({
      color: liquidColors.main,
      emissive: liquidColors.depth,
      emissiveIntensity: 0.25,
      transmission: 0.75,
      opacity: 0.95,
      transparent: true,
      roughness: 0.12,
      ior: 1.38,
      thickness: 1.8,
      specularIntensity: 0.9,
    });

    if (glassStyle === 'coupe') {
      // 1. Coupe Bowl (Lathe Geometry for graceful curve)
      const points: THREE.Vector2[] = [];
      points.push(new THREE.Vector2(0.01, -0.2));
      points.push(new THREE.Vector2(0.2, -0.18));
      points.push(new THREE.Vector2(0.55, -0.1));
      points.push(new THREE.Vector2(0.95, 0.15));
      points.push(new THREE.Vector2(1.18, 0.45));
      points.push(new THREE.Vector2(1.22, 0.5)); // rim outer
      points.push(new THREE.Vector2(1.17, 0.5)); // rim inner
      points.push(new THREE.Vector2(0.92, 0.17));
      points.push(new THREE.Vector2(0.52, -0.06));
      points.push(new THREE.Vector2(0.18, -0.14));
      points.push(new THREE.Vector2(0.01, -0.16));

      const bowlGeo = new THREE.LatheGeometry(points, 48);
      const bowlMesh = new THREE.Mesh(bowlGeo, glassMaterial);
      group.add(bowlMesh);

      // Coupe Stem & Foot
      const stemGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.95, 24);
      const stemMesh = new THREE.Mesh(stemGeo, glassMaterial);
      stemMesh.position.y = -0.68;
      group.add(stemMesh);

      const footPoints: THREE.Vector2[] = [];
      footPoints.push(new THREE.Vector2(0.01, -1.15));
      footPoints.push(new THREE.Vector2(0.65, -1.16));
      footPoints.push(new THREE.Vector2(0.66, -1.14));
      footPoints.push(new THREE.Vector2(0.05, -1.13));
      const footGeo = new THREE.LatheGeometry(footPoints, 36);
      const footMesh = new THREE.Mesh(footGeo, glassMaterial);
      group.add(footMesh);

      // Coupe Liquid Body
      const liquidPoints: THREE.Vector2[] = [];
      liquidPoints.push(new THREE.Vector2(0.01, -0.14));
      liquidPoints.push(new THREE.Vector2(0.35, -0.09));
      liquidPoints.push(new THREE.Vector2(0.75, 0.08));
      liquidPoints.push(new THREE.Vector2(1.02, 0.3));
      liquidPoints.push(new THREE.Vector2(0.01, 0.3)); // flat top surface
      const liquidGeo = new THREE.LatheGeometry(liquidPoints, 48);
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMaterial);
      group.add(liquidMesh);
      liquidMeshRef.current = liquidMesh;

      // Foam ring at surface
      const foamGeo = new THREE.RingGeometry(0.7, 1.02, 36);
      const foamMat = new THREE.MeshStandardMaterial({
        color: liquidColors.foam,
        transparent: true,
        opacity: 0.65,
        roughness: 0.8,
      });
      const foamMesh = new THREE.Mesh(foamGeo, foamMat);
      foamMesh.rotation.x = -Math.PI / 2;
      foamMesh.position.y = 0.301;
      group.add(foamMesh);

    } else if (glassStyle === 'highball') {
      // Highball tall cylinder
      const points: THREE.Vector2[] = [];
      points.push(new THREE.Vector2(0.01, -1.1));
      points.push(new THREE.Vector2(0.55, -1.1));
      points.push(new THREE.Vector2(0.62, -1.05));
      points.push(new THREE.Vector2(0.68, 0.95)); // top rim
      points.push(new THREE.Vector2(0.64, 0.95));
      points.push(new THREE.Vector2(0.58, -0.95)); // inner bottom
      points.push(new THREE.Vector2(0.01, -0.95));

      const highballGeo = new THREE.LatheGeometry(points, 48);
      const highballMesh = new THREE.Mesh(highballGeo, glassMaterial);
      group.add(highballMesh);

      // Highball Liquid
      const liquidPoints: THREE.Vector2[] = [];
      liquidPoints.push(new THREE.Vector2(0.01, -0.94));
      liquidPoints.push(new THREE.Vector2(0.57, -0.94));
      liquidPoints.push(new THREE.Vector2(0.64, 0.68));
      liquidPoints.push(new THREE.Vector2(0.01, 0.68));
      const liquidGeo = new THREE.LatheGeometry(liquidPoints, 48);
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMaterial);
      group.add(liquidMesh);
      liquidMeshRef.current = liquidMesh;

      // Glass Straw
      const strawGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.2, 16);
      const strawMat = new THREE.MeshPhysicalMaterial({
        color: 0x93c5fd,
        transmission: 0.9,
        transparent: true,
        roughness: 0.1,
      });
      const straw = new THREE.Mesh(strawGeo, strawMat);
      straw.position.set(0.25, 0.15, 0.1);
      straw.rotation.z = -0.22;
      straw.rotation.x = 0.1;
      group.add(straw);

    } else {
      // Rocks / Old Fashioned Glass (short, heavy base)
      const points: THREE.Vector2[] = [];
      points.push(new THREE.Vector2(0.01, -1.15));
      points.push(new THREE.Vector2(0.72, -1.15));
      points.push(new THREE.Vector2(0.76, -1.08));
      points.push(new THREE.Vector2(0.85, 0.45)); // rim
      points.push(new THREE.Vector2(0.79, 0.45));
      points.push(new THREE.Vector2(0.7, -0.85)); // thick base inner
      points.push(new THREE.Vector2(0.01, -0.85));

      const rocksGeo = new THREE.LatheGeometry(points, 48);
      const rocksMesh = new THREE.Mesh(rocksGeo, glassMaterial);
      group.add(rocksMesh);

      // Rocks Liquid
      const liquidPoints: THREE.Vector2[] = [];
      liquidPoints.push(new THREE.Vector2(0.01, -0.84));
      liquidPoints.push(new THREE.Vector2(0.69, -0.84));
      liquidPoints.push(new THREE.Vector2(0.78, 0.15));
      liquidPoints.push(new THREE.Vector2(0.01, 0.15));
      const liquidGeo = new THREE.LatheGeometry(liquidPoints, 48);
      const liquidMesh = new THREE.Mesh(liquidGeo, liquidMaterial);
      group.add(liquidMesh);
      liquidMeshRef.current = liquidMesh;
    }

    // Ice Cubes
    if (hasIce) {
      const iceGroup = new THREE.Group();
      iceGroupRef.current = iceGroup;

      const iceMat = new THREE.MeshPhysicalMaterial({
        color: 0xf0f9ff,
        transmission: 0.94,
        transparent: true,
        opacity: 0.9,
        roughness: 0.08,
        ior: 1.31,
        thickness: 0.8,
        specularIntensity: 0.95,
      });

      if (glassStyle === 'rocks') {
        // One large artisanal block
        const iceGeo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
        const bigCube = new THREE.Mesh(iceGeo, iceMat);
        bigCube.position.set(0, -0.3, 0);
        bigCube.rotation.set(0.18, 0.35, 0.1);
        iceGroup.add(bigCube);
      } else {
        // Floating regular ice cubes
        const cubeCount = glassStyle === 'highball' ? 4 : 2;
        const cubeSize = glassStyle === 'highball' ? 0.35 : 0.28;
        const iceGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

        for (let i = 0; i < cubeCount; i++) {
          const cube = new THREE.Mesh(iceGeo, iceMat);
          const yPos = glassStyle === 'highball' ? -0.5 + i * 0.32 : 0.1 + i * 0.08;
          const xOffset = (Math.random() - 0.5) * 0.25;
          const zOffset = (Math.random() - 0.5) * 0.25;
          cube.position.set(xOffset, yPos, zOffset);
          cube.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
          iceGroup.add(cube);
        }
      }
      group.add(iceGroup);
    }

    // Garnish (Lime wheel, Passion fruit half, or Rosemary sprig)
    if (hasGarnish) {
      const garnishGroup = new THREE.Group();
      garnishGroupRef.current = garnishGroup;

      if (glassStyle === 'coupe') {
        // Floating Passion Fruit / Citrus slice on top
        const fruitGroup = new THREE.Group();
        fruitGroup.position.set(0.15, 0.32, 0.1);
        fruitGroup.rotation.x = -Math.PI / 2 + 0.15;
        fruitGroup.rotation.z = 0.4;

        // Rind ring
        const rindGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.04, 32);
        const rindMat = new THREE.MeshStandardMaterial({
          color: 0x4a1236, // dark passionfruit shell
          roughness: 0.7,
        });
        const rind = new THREE.Mesh(rindGeo, rindMat);
        fruitGroup.add(rind);

        // Pulp disc
        const pulpGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.045, 32);
        const pulpMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b, // glowing yellow passion pulp
          roughness: 0.4,
          metalness: 0.1,
        });
        const pulp = new THREE.Mesh(pulpGeo, pulpMat);
        fruitGroup.add(pulp);

        // Black seeds
        for (let s = 0; s < 7; s++) {
          const seedGeo = new THREE.SphereGeometry(0.025, 8, 8);
          const seedMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
          const seed = new THREE.Mesh(seedGeo, seedMat);
          const angle = (s / 7) * Math.PI * 2;
          const dist = 0.12 + Math.random() * 0.12;
          seed.position.set(Math.cos(angle) * dist, 0.025, Math.sin(angle) * dist);
          fruitGroup.add(seed);
        }
        garnishGroup.add(fruitGroup);

      } else if (glassStyle === 'highball') {
        // Lime wedge on rim + Mint sprig
        const rimSliceGroup = new THREE.Group();
        rimSliceGroup.position.set(0.66, 0.95, 0);
        rimSliceGroup.rotation.z = -0.4;

        const sliceGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.03, 32, 1, false, 0, Math.PI);
        const rindMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
        const slice = new THREE.Mesh(sliceGeo, rindMat);
        slice.rotation.x = Math.PI / 2;
        rimSliceGroup.add(slice);

        // Mint leaf
        const mintGeo = new THREE.ConeGeometry(0.14, 0.38, 5);
        const mintMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.5 });
        const mint = new THREE.Mesh(mintGeo, mintMat);
        mint.position.set(-0.25, 0.9, -0.1);
        mint.rotation.z = 0.45;
        garnishGroup.add(mint);

        garnishGroup.add(rimSliceGroup);

      } else {
        // Rocks: Orange zest twist or Berry skewer
        const twistGeo = new THREE.TorusGeometry(0.4, 0.04, 16, 40, Math.PI * 1.6);
        const twistMat = new THREE.MeshStandardMaterial({
          color: 0xe65100, // orange peel
          roughness: 0.45,
        });
        const twist = new THREE.Mesh(twistGeo, twistMat);
        twist.position.set(0.35, 0.3, 0);
        twist.rotation.set(0.8, 0.5, 0.3);
        garnishGroup.add(twist);

        // 2 Blackberries
        for (let b = 0; b < 2; b++) {
          const berryGeo = new THREE.SphereGeometry(0.12, 16, 16);
          const berryMat = new THREE.MeshStandardMaterial({
            color: 0x2e081d,
            roughness: 0.3,
            metalness: 0.1,
          });
          const berry = new THREE.Mesh(berryGeo, berryMat);
          berry.position.set(-0.15 + b * 0.18, 0.22, 0.12);
          garnishGroup.add(berry);
        }
      }
      group.add(garnishGroup);
    }

    // Micro-bubbles rising through liquid
    const bubbleCount = glassStyle === 'highball' ? 45 : 25;
    const bubbleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount; i++) {
      const radius = Math.random() * (glassStyle === 'highball' ? 0.45 : 0.6);
      const angle = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = -0.7 + Math.random() * 1.1;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const bubbleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.035,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const bubbles = new THREE.Points(bubbleGeo, bubbleMat);
    group.add(bubbles);
    bubblesGroupRef.current = bubbles;
  };

  // Re-run glassware build when options change
  useEffect(() => {
    rebuildGlassware();
  }, [glassStyle, hasIce, hasGarnish, liquidColors]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-radial from-[#1A1829] via-[#0E1017] to-[#08090D] border border-white/10 shadow-2xl ${heightClass} flex flex-col justify-between select-none touch-none`}>
      {/* 3D WebGL Canvas */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Top Overlaid Interactive Bar */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Glass selector */}
          <div className="flex items-center gap-1 p-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px]">
            <button
              onClick={() => {
                sounds.playTap();
                setGlassStyle('coupe');
              }}
              className={`px-2.5 py-1 rounded-full transition-all ${
                glassStyle === 'coupe' ? 'bg-white/20 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Coupe
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setGlassStyle('highball');
              }}
              className={`px-2.5 py-1 rounded-full transition-all ${
                glassStyle === 'highball' ? 'bg-white/20 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Highball
            </button>
            <button
              onClick={() => {
                sounds.playTap();
                setGlassStyle('rocks');
              }}
              className={`px-2.5 py-1 rounded-full transition-all ${
                glassStyle === 'rocks' ? 'bg-white/20 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Rocks
            </button>
          </div>
        </div>

        {/* Lighting mood toggle */}
        <div className="flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => {
              sounds.playTap();
              setLightingMode((prev) => (prev === 'lounge' ? 'neon' : prev === 'neon' ? 'sun' : 'lounge'));
            }}
            title="Ambiance lumineuse"
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 flex items-center justify-center text-white transition-all active:scale-95 shadow-sm"
          >
            {lightingMode === 'lounge' && <Wine className="w-3.5 h-3.5 text-pink-300" />}
            {lightingMode === 'neon' && <Sparkles className="w-3.5 h-3.5 text-cyan-300" />}
            {lightingMode === 'sun' && <Sun className="w-3.5 h-3.5 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Bottom Floating Interactive Controls */}
      <div className="relative z-10 p-3 flex items-center justify-between pointer-events-none">
        {/* Toggle Toggles (Ice & Garnish) */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => {
              sounds.playTap();
              setHasIce(!hasIce);
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md transition-all active:scale-95 ${
              hasIce 
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200' 
                : 'bg-black/50 border-white/10 text-slate-400'
            }`}
          >
            🧊 Glaçons
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setHasGarnish(!hasGarnish);
            }}
            className={`px-2.5 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md transition-all active:scale-95 ${
              hasGarnish 
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200' 
                : 'bg-black/50 border-white/10 text-slate-400'
            }`}
          >
            🌿 Garniture
          </button>
        </div>

        {/* Shake & Auto-Rotate Action Buttons */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Auto-rotate toggle */}
          <button
            onClick={() => {
              sounds.playTap();
              setAutoRotate(!autoRotate);
            }}
            title={autoRotate ? 'Arrêter la rotation' : 'Rotation auto'}
            className={`w-7 h-7 rounded-full border backdrop-blur-md flex items-center justify-center transition-all ${
              autoRotate ? 'bg-white/20 border-white/30 text-white' : 'bg-black/50 border-white/10 text-slate-400'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>

          {/* Shake Button */}
          <button
            onClick={triggerShake}
            disabled={isShaking}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md active:scale-95 transition-all hover:brightness-110"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>{isShaking ? 'Shake...' : 'Secouer'}</span>
          </button>
        </div>
      </div>

      {/* Subtle Hint */}
      <div className="absolute bottom-1 inset-x-0 text-center pointer-events-none">
        <span className="text-[9px] text-white/40 tracking-wider">
          GLISSER POUR PIVOTER EN 360°
        </span>
      </div>
    </div>
  );
};
