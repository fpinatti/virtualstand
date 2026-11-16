import React, { useRef, useMemo, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { PlacedAisleBox } from './types';
import {
  spineGeneratorService,
  getDeterministicColorFromTitle,
} from '@/services/spine-generator.service';

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
  const [loadedCover, setLoadedCover] = useState<{
    coverTexture: THREE.Texture;
    image: HTMLImageElement | null;
  } | null>(null);

  const themeColor = useMemo(
    () => getDeterministicColorFromTitle(box.title),
    [box.title]
  );

  useEffect(() => {
    let active = true;
    if (box.thumbnailUri) {
      spineGeneratorService.loadCoverArt(box.thumbnailUri, (res) => {
        if (active) {
          setLoadedCover(res);
        }
      });
    } else {
      setLoadedCover(null);
    }
    return () => {
      active = false;
    };
  }, [box.thumbnailUri]);

  // Box materials:
  // 0 (+X) & 1 (-X): Main Box Cover faces (full BGG cover art)
  // 2 (+Y), 3 (-Y): Top and bottom box lid
  // 4 (+Z), 5 (-Z): Lateral spine faces (facing the aisle)
  const materials = useMemo(() => {
    const hasCover = Boolean(loadedCover?.coverTexture);

    const coverSideMaterial = new THREE.MeshStandardMaterial({
      color: hasCover ? '#ffffff' : themeColor,
      map: loadedCover?.coverTexture || null,
      roughness: 0.35,
      metalness: 0.08,
    });

    const spineTexture = spineGeneratorService.createSpineTexture(
      box.title,
      256,
      1024,
      themeColor,
      loadedCover?.image ?? null
    );

    const resolvedSpineMap = spineTexture || loadedCover?.coverTexture || null;

    const lateralWrapMaterial = new THREE.MeshStandardMaterial({
      color: resolvedSpineMap ? '#ffffff' : themeColor,
      map: resolvedSpineMap,
      roughness: 0.38,
      metalness: 0.08,
    });

    const topBottomMaterial = new THREE.MeshStandardMaterial({
      color: hasCover ? '#D8D0C5' : themeColor,
      map: loadedCover?.coverTexture || null,
      roughness: 0.5,
      metalness: 0.05,
    });

    return [
      coverSideMaterial,
      coverSideMaterial,
      topBottomMaterial,
      topBottomMaterial,
      lateralWrapMaterial,
      lateralWrapMaterial,
    ];
  }, [box.title, themeColor, loadedCover]);

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
    } else if (!isDragging.current) {
      // When extracted into the corridor, angle the box so its full Front Cover (+X / -X) faces the user
      const inspectRotY =
        box.side === 'LEFT' ? box.baseRotationY - 0.95 : box.baseRotationY + 0.95;
      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        inspectRotY,
        lerpSpeed * 0.6
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
