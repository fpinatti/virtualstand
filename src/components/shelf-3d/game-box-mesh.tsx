import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { Box3DProps } from './types';
import { spineGeneratorService, getDeterministicColorFromTitle } from '@/services/spine-generator.service';
import { tokens } from '@/ui';

export function GameBoxMesh({ box, isSelected, onSelect, onOpenDetails }: Box3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [w, h, d] = box.size;
  const isDragging = useRef(false);
  const previousPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const themeColor = useMemo(() => getDeterministicColorFromTitle(box.title), [box.title]);

  // Box materials
  const materials = useMemo(() => {
    const sideMaterial = new THREE.MeshStandardMaterial({
      color: tokens.colors.text.primary,
      roughness: 0.7,
      metalness: 0.05,
    });

    const frontMaterial = new THREE.MeshStandardMaterial({
      color: themeColor,
      roughness: 0.4,
      metalness: 0.1,
    });

    const spineTexture = spineGeneratorService.createSpineTexture(box.title, 128, 512, themeColor);
    const spineMaterial = new THREE.MeshStandardMaterial({
      color: spineTexture ? '#ffffff' : themeColor,
      map: spineTexture || null,
      roughness: 0.4,
      metalness: 0.1,
    });

    // 0: +X, 1: -X, 2: +Y, 3: -Y, 4: +Z, 5: -Z
    return [
      sideMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
      frontMaterial,
      spineMaterial,
    ];
  }, [box.title, themeColor]);

  // Frame animation: lerp between resting and extracted positions
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetPos = isSelected ? box.extractedPosition : box.position;
    const lerpSpeed = 10 * delta;

    meshRef.current.position.x = THREE.MathUtils.lerp(
      meshRef.current.position.x,
      targetPos[0],
      lerpSpeed
    );
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetPos[1],
      lerpSpeed
    );
    meshRef.current.position.z = THREE.MathUtils.lerp(
      meshRef.current.position.z,
      targetPos[2],
      lerpSpeed
    );

    // If not selected, smoothly return rotation to resting alignment
    if (!isSelected) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, lerpSpeed);
      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, 0, lerpSpeed);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, lerpSpeed);
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (isSelected) {
      isDragging.current = true;
      previousPointer.current = { x: e.clientX || 0, y: e.clientY || 0 };
    }
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isSelected && isDragging.current && meshRef.current) {
      e.stopPropagation();
      const currentX = e.clientX || 0;
      const currentY = e.clientY || 0;
      const deltaX = currentX - previousPointer.current.x;
      const deltaY = currentY - previousPointer.current.y;

      meshRef.current.rotation.y += deltaX * 0.01;
      meshRef.current.rotation.x += deltaY * 0.01;

      previousPointer.current = { x: currentX, y: currentY };
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (isSelected) {
      onOpenDetails(box.bggId);
    } else {
      onSelect(box.bggId);
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={box.position}
      material={materials}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[w, h, d]} />
    </mesh>
  );
}
