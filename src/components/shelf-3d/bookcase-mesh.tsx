import React, { useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { AisleShelfDimensions, AisleSide } from './types';
import { tokens } from '@/ui';

interface BookcaseMeshProps {
  aisle: AisleShelfDimensions;
  onSelectSide?: (side: AisleSide) => void;
}

export function BookcaseMesh({ aisle, onSelectSide }: BookcaseMeshProps) {
  const {
    rows,
    cols,
    cubbyWidth,
    cubbyHeight,
    cubbyDepth,
    thickness,
    aisleWidth,
    totalLength,
    totalHeight,
  } = aisle;

  const halfAisle = aisleWidth / 2;
  const centerZ = -totalLength / 2;

  const materials = useMemo(() => {
    const shelfMaterial = new THREE.MeshStandardMaterial({
      color: '#D8CFC2', // Warm architectural ivory/birch shelving matching reference library
      roughness: 0.65,
      metalness: 0.08,
    });

    const trimMaterial = new THREE.MeshStandardMaterial({
      color: tokens.colors.accent.primary,
      roughness: 0.45,
      metalness: 0.25,
    });

    const backboardMaterial = new THREE.MeshStandardMaterial({
      color: tokens.colors.shelf3d.frameWood,
      roughness: 0.85,
      metalness: 0.05,
    });

    const floorMaterial = new THREE.MeshStandardMaterial({
      color: '#2A2B30', // Textured dark slate/charcoal library carpet runner
      roughness: 0.92,
      metalness: 0.02,
    });

    const ceilingMaterial = new THREE.MeshStandardMaterial({
      color: '#EAE3D5', // Warm cream library ceiling
      roughness: 0.8,
      metalness: 0.05,
    });

    const lightFixtureMaterial = new THREE.MeshStandardMaterial({
      color: '#FFFDF7',
      emissive: '#FFE8B8',
      emissiveIntensity: 1.4,
      roughness: 0.2,
    });

    const farWindowMaterial = new THREE.MeshStandardMaterial({
      color: '#F5EFE4',
      emissive: '#F5E6C8',
      emissiveIntensity: 0.65,
      roughness: 0.3,
    });

    return {
      shelfMaterial,
      trimMaterial,
      backboardMaterial,
      floorMaterial,
      ceilingMaterial,
      lightFixtureMaterial,
      farWindowMaterial,
    };
  }, []);

  const handleWallClick = (side: AisleSide) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (onSelectSide) {
      onSelectSide(side);
    }
  };

  const renderWall = (side: AisleSide) => {
    const sign = side === 'LEFT' ? -1 : 1;
    const wallCenterX = sign * (halfAisle + cubbyDepth / 2);
    const backPanelX = sign * (halfAisle + cubbyDepth + thickness / 4);
    const frontEdgeX = sign * (halfAisle + 0.02);

    return (
      <group key={`wall-${side}`} onClick={handleWallClick(side)}>
        {/* Outer Backing Board */}
        <mesh
          position={[backPanelX, 0, centerZ]}
          material={materials.backboardMaterial}
        >
          <boxGeometry args={[thickness / 2, totalHeight, totalLength]} />
        </mesh>

        {/* Horizontal Shelf Planks (rows + 1 planks from top to bottom) */}
        {Array.from({ length: rows + 1 }).map((_, rIdx) => {
          const y = totalHeight / 2 - thickness / 2 - rIdx * (cubbyHeight + thickness);
          return (
            <mesh
              key={`plank-${side}-${rIdx}`}
              position={[wallCenterX, y, centerZ]}
              material={materials.shelfMaterial}
              receiveShadow
            >
              <boxGeometry args={[cubbyDepth, thickness, totalLength]} />
            </mesh>
          );
        })}

        {/* Vertical Bay Dividers along corridor Z */}
        {Array.from({ length: cols + 1 }).map((_, cIdx) => {
          const z = -(thickness / 2 + cIdx * (cubbyWidth + thickness));
          return (
            <mesh
              key={`divider-${side}-${cIdx}`}
              position={[wallCenterX, 0, z]}
              material={materials.shelfMaterial}
            >
              <boxGeometry args={[cubbyDepth, totalHeight, thickness]} />
            </mesh>
          );
        })}
      </group>
    );
  };

  const fullCorridorSpanX = aisleWidth + cubbyDepth * 2 + thickness * 2;

  return (
    <group>
      {/* Left & Right Parallel Shelf Walls */}
      {renderWall('LEFT')}
      {renderWall('RIGHT')}

      {/* Central Aisle Carpet Floor */}
      <mesh
        position={[0, -totalHeight / 2 - 0.05, centerZ]}
        material={materials.floorMaterial}
        receiveShadow
      >
        <boxGeometry args={[fullCorridorSpanX, 0.1, totalLength + 4]} />
      </mesh>

      {/* Architectural Ceiling */}
      <mesh
        position={[0, totalHeight / 2 + 0.35, centerZ]}
        material={materials.ceilingMaterial}
      >
        <boxGeometry args={[fullCorridorSpanX, 0.12, totalLength + 4]} />
      </mesh>

      {/* Dual Rows of Recessed Linear Ceiling Light Panels (like reference image) */}
      {Array.from({ length: cols }).map((_, idx) => {
        const z = -(thickness + idx * (cubbyWidth + thickness) + cubbyWidth / 2);
        return (
          <group key={`ceiling-lights-${idx}`}>
            <mesh
              position={[-0.75, totalHeight / 2 + 0.27, z]}
              material={materials.lightFixtureMaterial}
            >
              <boxGeometry args={[0.42, 0.04, cubbyWidth * 0.62]} />
            </mesh>
            <mesh
              position={[0.75, totalHeight / 2 + 0.27, z]}
              material={materials.lightFixtureMaterial}
            >
              <boxGeometry args={[0.42, 0.04, cubbyWidth * 0.62]} />
            </mesh>
          </group>
        );
      })}

      {/* Illuminated Far-End Library Window Panel */}
      <mesh
        position={[0, 0, -totalLength - 0.4]}
        material={materials.farWindowMaterial}
      >
        <boxGeometry args={[aisleWidth + 0.4, totalHeight + 0.6, 0.15]} />
      </mesh>
    </group>
  );
}
