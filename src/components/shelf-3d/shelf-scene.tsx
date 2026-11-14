import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { BookcaseMesh } from './bookcase-mesh';
import { GameBoxMesh } from './game-box-mesh';
import { PlacedBoxCoords, ShelfDimensions } from './types';
import { spineGeneratorService } from '@/services/spine-generator.service';
import { tokens } from '@/ui';

interface ShelfSceneProps {
  shelf: ShelfDimensions;
  boxes: PlacedBoxCoords[];
  onOpenGameDetails: (bggId: number) => void;
}

export function ShelfScene({ shelf, boxes, onOpenGameDetails }: ShelfSceneProps) {
  const [selectedBggId, setSelectedBggId] = useState<number | null>(null);

  useEffect(() => {
    // Cleanup GPU resources on unmount
    return () => {
      spineGeneratorService.dispose();
    };
  }, []);

  const handleSelectBox = (bggId: number) => {
    setSelectedBggId(bggId);
  };

  const handleDeselect = () => {
    setSelectedBggId(null);
  };

  return (
    <View style={styles.container}>
      <Canvas
        camera={{ position: [0, 0, 9], fov: 45, near: 0.1, far: 100 }}
        style={styles.canvas}
        onPointerMissed={handleDeselect}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[5, 10, 7]} intensity={1.25} castShadow />
        <directionalLight position={[-5, 5, 5]} intensity={0.55} />

        <BookcaseMesh shelf={shelf} />

        {boxes.map((box) => (
          <GameBoxMesh
            key={box.bggId}
            box={box}
            isSelected={selectedBggId === box.bggId}
            onSelect={handleSelectBox}
            onOpenDetails={onOpenGameDetails}
          />
        ))}
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.surface.sunken,
  },
  canvas: {
    flex: 1,
  },
});
