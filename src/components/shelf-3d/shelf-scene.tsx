import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { BookcaseMesh } from './bookcase-mesh';
import { GameBoxMesh } from './game-box-mesh';
import {
  AisleCameraBounds,
  AisleShelfDimensions,
  AisleSide,
  CameraFocusSide,
  PlacedAisleBox,
} from './types';
import { spineGeneratorService } from '@/services/spine-generator.service';
import { aisleCameraController } from '@/services/aisle-camera.service';
import { tokens } from '@/ui';

interface AisleCameraRigProps {
  targetZ: number;
  focusSide: CameraFocusSide;
  bounds: AisleCameraBounds;
}

function AisleCameraRig({ targetZ, focusSide, bounds }: AisleCameraRigProps) {
  const { camera } = useThree();
  const currentPosRef = useRef(new THREE.Vector3(0, 0.15, bounds.defaultZ));
  const currentYawRef = useRef(0);

  useFrame((_, delta) => {
    const pose = aisleCameraController.computeCameraPose(targetZ, focusSide, bounds);
    const lerpFactor = Math.min(1, 7.5 * delta);

    currentPosRef.current.x = THREE.MathUtils.lerp(
      currentPosRef.current.x,
      pose.position[0],
      lerpFactor
    );
    currentPosRef.current.y = THREE.MathUtils.lerp(
      currentPosRef.current.y,
      pose.position[1],
      lerpFactor
    );
    currentPosRef.current.z = THREE.MathUtils.lerp(
      currentPosRef.current.z,
      pose.position[2],
      lerpFactor
    );

    currentYawRef.current = THREE.MathUtils.lerp(
      currentYawRef.current,
      pose.yawRadians,
      lerpFactor
    );

    camera.position.copy(currentPosRef.current);

    // Compute look-at target 6 units ahead along the current yaw angle
    const lookDistance = 6;
    const lookX =
      currentPosRef.current.x - Math.sin(currentYawRef.current) * lookDistance;
    const lookY = currentPosRef.current.y - 0.05;
    const lookZ =
      currentPosRef.current.z - Math.cos(currentYawRef.current) * lookDistance;

    camera.lookAt(lookX, lookY, lookZ);
  });

  return null;
}

interface ShelfSceneProps {
  aisle: AisleShelfDimensions;
  boxes: PlacedAisleBox[];
  cameraBounds: AisleCameraBounds;
  focusSide: CameraFocusSide;
  targetZ: number;
  onChangeFocusSide: (side: CameraFocusSide) => void;
  onChangeTargetZ: (updater: (prevZ: number) => number) => void;
  onOpenGameDetails: (bggId: number) => void;
}

export function ShelfScene({
  aisle,
  boxes,
  cameraBounds,
  focusSide,
  targetZ,
  onChangeFocusSide,
  onChangeTargetZ,
  onOpenGameDetails,
}: ShelfSceneProps) {
  const [selectedBggId, setSelectedBggId] = useState<number | null>(null);
  const lastPanYRef = useRef(0);
  const wasDragRef = useRef(false);

  useEffect(() => {
    return () => {
      spineGeneratorService.dispose();
    };
  }, []);

  // Vertical swipe / drag gesture to walk forward & backward along the corridor
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        aisleCameraController.isDragGesture(gestureState.dx, gestureState.dy),
      onPanResponderGrant: () => {
        lastPanYRef.current = 0;
        wasDragRef.current = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (aisleCameraController.isDragGesture(gestureState.dx, gestureState.dy)) {
          wasDragRef.current = true;
        }
        const stepDeltaY = gestureState.dy - lastPanYRef.current;
        lastPanYRef.current = gestureState.dy;

        onChangeTargetZ((prevZ) =>
          aisleCameraController.applyWalkDelta(prevZ, stepDeltaY, cameraBounds)
        );
      },
      onPanResponderRelease: () => {
        setTimeout(() => {
          wasDragRef.current = false;
        }, 60);
      },
    })
  ).current;

  const handleSelectSide = (side: AisleSide) => {
    if (wasDragRef.current) return;
    onChangeFocusSide(side);
  };

  const handleSelectBox = (box: PlacedAisleBox) => {
    if (wasDragRef.current) return;
    setSelectedBggId(box.bggId);
    onChangeFocusSide(box.side);
    // Smoothly align camera longitudinal Z near the selected box
    onChangeTargetZ(() =>
      aisleCameraController.clampCameraZ(box.position[2] + 2.1, cameraBounds)
    );
  };

  const handleDeselect = () => {
    if (wasDragRef.current) return;
    setSelectedBggId(null);
  };

  return (
    <View
      style={styles.container}
      {...panResponder.panHandlers}
      // Support mouse wheel walking on Web Localhost
      // @ts-expect-error onWheel is supported by react-native-web View
      onWheel={(e: { nativeEvent?: { deltaY?: number }; deltaY?: number }) => {
        const dy = e?.nativeEvent?.deltaY ?? e?.deltaY ?? 0;
        if (dy !== 0) {
          onChangeTargetZ((prevZ) =>
            aisleCameraController.applyWalkDelta(prevZ, dy * 0.45, cameraBounds)
          );
        }
      }}
    >
      <Canvas
        camera={{
          position: [0, 0.15, cameraBounds.defaultZ],
          fov: 54,
          near: 0.1,
          far: 120,
        }}
        style={styles.canvas}
        onPointerMissed={handleDeselect}
      >
        <color attach="background" args={['#1A1815']} />
        <fog attach="fog" args={['#1A1815', 8, Math.max(24, aisle.totalLength + 8)]} />

        <ambientLight intensity={0.95} color="#FFF8EC" />
        <directionalLight position={[0, 6, 4]} intensity={1.1} color="#FFF3DC" castShadow />
        <pointLight position={[0, aisle.totalHeight / 2, -aisle.totalLength * 0.35]} intensity={1.2} color="#FFE4B5" distance={18} />
        <pointLight position={[0, aisle.totalHeight / 2, -aisle.totalLength * 0.75]} intensity={1.2} color="#FFE4B5" distance={18} />

        <AisleCameraRig
          targetZ={targetZ}
          focusSide={focusSide}
          bounds={cameraBounds}
        />

        <BookcaseMesh aisle={aisle} onSelectSide={handleSelectSide} />

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
