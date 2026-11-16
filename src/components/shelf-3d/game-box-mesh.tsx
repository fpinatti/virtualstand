import React, { useRef, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedAisleBox } from './types';
import {
  spineGeneratorService,
  getDeterministicColorFromTitle,
} from '@/services/spine-generator.service';
import { tokens } from '@/ui';

export interface AisleGameBoxMeshProps {
  box: PlacedAisleBox;
  isSelected: boolean;
  onSelect: (box: PlacedAisleBox) => void;
  onOpenDetails: (bggId: number) => void;
}

export function GameBoxMesh({
  box,
  isSelected,
  onSelect,
  onOpenDetails,
}: AisleGameBoxMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [w, h, d] = box.size;
  const isDragging = useRef(false);
  const previousPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const themeColor = useMemo(
    () => getDeterministicColorFromTitle(box.title),
    [box.title]
  );

  // Box materials:
  // When placed on LEFT wall (baseRotationY = +PI/2), local +Z face points toward +X (aisle center).
  // When placed on RIGHT wall (baseRotationY = -PI/2), local +Z face points toward -X (aisle center).
  const materials = useMemo(() => {
    const cardboardEdgeMaterial = new THREE.MeshStandardMaterial({
      color: tokens.colors.text.primary,
      roughness: 0.72,
      metalness: 0.05,
    });

    const coverSideMaterial = new THREE.MeshStandardMaterial({
      color: themeColor,
      roughness: 0.42,
      metalness: 0.1,
    });

    const spineTexture = spineGeneratorService.createSpineTexture(
      box.title,
      128,
      512,
      themeColor
    );
    const spineMaterial = new THREE.MeshStandardMaterial({
      color: spineTexture ? '#ffffff' : themeColor,
      map: spineTexture || null,
      roughness: 0.38,
      metalness: 0.1,
    });

    // 0: +X (cover), 1: -X (cover), 2: +Y (top), 3: -Y (bottom), 4: +Z (inward aisle spine), 5: -Z (back spine)
    return [
      coverSideMaterial,
      coverSideMaterial,
      cardboardEdgeMaterial,
      cardboardEdgeMaterial,
      spineMaterial,
      spineMaterial,
    ];
  }, [box.title, themeColor]);

  // Frame animation: lerp between resting shelf position and extracted aisle position
  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const targetPos = isSelected ? box.extractedPosition : box.position;
    const lerpSpeed = Math.min(1, 10 * delta);

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

    if (!isSelected) {
      meshRef.current.rotation.x = THREE.MathUtils.lerp(
        meshRef.current.rotation.x,
        0,
        lerpSpeed
      );
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        box.baseRotationY,
        lerpSpeed
      );
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z,
        0,
        lerpSpeed
      );
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (isSelected) {
      e.stopPropagation();
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
      onSelect(box);
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={box.position}
      rotation={[0, box.baseRotationY, 0]}
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
