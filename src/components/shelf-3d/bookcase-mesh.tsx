import React from 'react';
import * as THREE from 'three';
import { ShelfDimensions } from './types';
import { tokens } from '@/ui';

interface BookcaseMeshProps {
  shelf: ShelfDimensions;
}

export function BookcaseMesh({ shelf }: BookcaseMeshProps) {
  const { rows, cols, cubbyWidth, cubbyHeight, cubbyDepth, thickness } = shelf;

  const totalWidth = cols * cubbyWidth + (cols + 1) * thickness;
  const totalHeight = rows * cubbyHeight + (rows + 1) * thickness;
  const shelfMaterial = new THREE.MeshStandardMaterial({
    color: tokens.colors.shelf3d.frameWood,
    roughness: 0.78,
    metalness: 0.08,
  });

  const backboardMaterial = new THREE.MeshStandardMaterial({
    color: tokens.colors.shelf3d.backingBoard,
    roughness: 0.9,
    metalness: 0.05,
  });

  return (
    <group>
      {/* Backboard panel */}
      <mesh
        position={[0, 0, -cubbyDepth / 2 - thickness / 4]}
        material={backboardMaterial}
      >
        <boxGeometry args={[totalWidth, totalHeight, thickness / 2]} />
      </mesh>

      {/* Top & Bottom outer planks */}
      <mesh
        position={[0, totalHeight / 2 - thickness / 2, 0]}
        material={shelfMaterial}
      >
        <boxGeometry args={[totalWidth, thickness, cubbyDepth]} />
      </mesh>
      <mesh
        position={[0, -totalHeight / 2 + thickness / 2, 0]}
        material={shelfMaterial}
      >
        <boxGeometry args={[totalWidth, thickness, cubbyDepth]} />
      </mesh>

      {/* Left & Right outer vertical planks */}
      <mesh
        position={[-totalWidth / 2 + thickness / 2, 0, 0]}
        material={shelfMaterial}
      >
        <boxGeometry args={[thickness, totalHeight, cubbyDepth]} />
      </mesh>
      <mesh
        position={[totalWidth / 2 - thickness / 2, 0, 0]}
        material={shelfMaterial}
      >
        <boxGeometry args={[thickness, totalHeight, cubbyDepth]} />
      </mesh>

      {/* Horizontal shelf dividers */}
      {Array.from({ length: rows - 1 }).map((_, rIdx) => {
        const y =
          totalHeight / 2 - thickness - (rIdx + 1) * (cubbyHeight + thickness) + thickness / 2;
        return (
          <mesh key={`h-shelf-${rIdx}`} position={[0, y, 0]} material={shelfMaterial}>
            <boxGeometry args={[totalWidth - 2 * thickness, thickness, cubbyDepth]} />
          </mesh>
        );
      })}

      {/* Vertical inner cubby dividers */}
      {Array.from({ length: cols - 1 }).map((_, cIdx) => {
        const x =
          -totalWidth / 2 + thickness + (cIdx + 1) * (cubbyWidth + thickness) - thickness / 2;
        return (
          <mesh key={`v-divider-${cIdx}`} position={[x, 0, 0]} material={shelfMaterial}>
            <boxGeometry args={[thickness, totalHeight - 2 * thickness, cubbyDepth]} />
          </mesh>
        );
      })}
    </group>
  );
}
