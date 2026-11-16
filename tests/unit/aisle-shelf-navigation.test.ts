import { shelfLayoutEngine } from '@/services/shelf-layout.service';
import {
  aisleCameraController,
  SIDE_LATERAL_STEP_X,
  SIDE_YAW_RADIANS,
} from '@/services/aisle-camera.service';
import { GameDimensionsSource } from '@/components/shelf-3d/types';

function makeMockGames(count: number): GameDimensionsSource[] {
  return Array.from({ length: count }).map((_, i) => ({
    bggId: 1000 + i,
    title: `Board Game ${i + 1}`,
    widthCm: 29.5,
    heightCm: 29.5,
    depthCm: 7.2,
    isEstimated: false,
    thumbnailUri: null,
  }));
}

describe('3D Parallel Aisle Shelf Layout & First-Person Navigation (Feature 006)', () => {
  describe('US1: Bilateral Corridor Packing & Vertical Walk Clamping', () => {
    it('distributes games across both LEFT and RIGHT walls of the corridor with minimum depth columns', () => {
      const games = makeMockGames(16);
      const result = shelfLayoutEngine.calculateAisleLayout(games);

      expect(result.aisle.rows).toBe(4);
      expect(result.aisle.cols).toBeGreaterThanOrEqual(4);
      expect(result.aisle.aisleWidth).toBeGreaterThan(3.0);
      expect(result.boxes).toHaveLength(16);

      const leftBoxes = result.boxes.filter((b) => b.side === 'LEFT');
      const rightBoxes = result.boxes.filter((b) => b.side === 'RIGHT');

      expect(leftBoxes.length).toBeGreaterThan(0);
      expect(rightBoxes.length).toBeGreaterThan(0);

      // Left boxes rest on negative X side; Right boxes rest on positive X side
      for (const lb of leftBoxes) {
        expect(lb.position[0]).toBeLessThan(-result.aisle.aisleWidth / 2);
      }
      for (const rb of rightBoxes) {
        expect(rb.position[0]).toBeGreaterThan(result.aisle.aisleWidth / 2);
      }
    });

    it('clamps camera Z position within corridor walking bounds [minZ, maxZ]', () => {
      const bounds = { minZ: -12, maxZ: 1.8, defaultZ: 1.2 };

      expect(aisleCameraController.clampCameraZ(0, bounds)).toBe(0);
      expect(aisleCameraController.clampCameraZ(10, bounds)).toBe(1.8);
      expect(aisleCameraController.clampCameraZ(-25, bounds)).toBe(-12);
      expect(aisleCameraController.clampCameraZ(NaN, bounds)).toBe(1.2);
    });

    it('moves camera forward and backward along Z when sliding finger up or down', () => {
      const bounds = { minZ: -12, maxZ: 1.8, defaultZ: 1.2 };

      // Sliding finger up (negative deltaY) moves deeper into the corridor (-Z)
      const movedForward = aisleCameraController.applyWalkDelta(0, -100, bounds);
      expect(movedForward).toBeLessThan(0);

      // Sliding finger down (positive deltaY) moves back toward the entrance (+Z)
      const movedBackward = aisleCameraController.applyWalkDelta(-5, 100, bounds);
      expect(movedBackward).toBeGreaterThan(-5);
    });
  });

  describe('US2: Lateral Camera Turn (LEFT / RIGHT) & Return to Central View (CENTER)', () => {
    const bounds = { minZ: -12, maxZ: 1.8, defaultZ: 1.2 };

    it('turns camera toward LEFT shelf and steps slightly right for optimal framing', () => {
      const pose = aisleCameraController.computeCameraPose(-3.5, 'LEFT', bounds);
      expect(pose.focusSide).toBe('LEFT');
      expect(pose.yawRadians).toBeCloseTo(SIDE_YAW_RADIANS, 3);
      expect(pose.position[0]).toBeCloseTo(SIDE_LATERAL_STEP_X, 3);
      expect(pose.position[2]).toBeCloseTo(-3.5, 3);
    });

    it('turns camera toward RIGHT shelf and steps slightly left for optimal framing', () => {
      const pose = aisleCameraController.computeCameraPose(-3.5, 'RIGHT', bounds);
      expect(pose.focusSide).toBe('RIGHT');
      expect(pose.yawRadians).toBeCloseTo(-SIDE_YAW_RADIANS, 3);
      expect(pose.position[0]).toBeCloseTo(-SIDE_LATERAL_STEP_X, 3);
      expect(pose.position[2]).toBeCloseTo(-3.5, 3);
    });

    it('restores default central corridor alignment when focusSide is CENTER', () => {
      const pose = aisleCameraController.computeCameraPose(-3.5, 'CENTER', bounds);
      expect(pose.focusSide).toBe('CENTER');
      expect(pose.yawRadians).toBe(0);
      expect(pose.position[0]).toBe(0);
      expect(pose.position[2]).toBeCloseTo(-3.5, 3);
    });

    it('distinguishes vertical drag gestures from simple taps using DRAG_THRESHOLD_PX', () => {
      expect(aisleCameraController.isDragGesture(2, 3)).toBe(false);
      expect(aisleCameraController.isDragGesture(0, 20)).toBe(true);
    });
  });

  describe('US3: Inward Aisle Box Extraction & Spine Orientation', () => {
    it('orients spines toward the corridor center and extracts boxes inward (+X for LEFT, -X for RIGHT)', () => {
      const games = makeMockGames(12);
      const { boxes } = shelfLayoutEngine.calculateAisleLayout(games);

      for (const box of boxes) {
        if (box.side === 'LEFT') {
          expect(box.baseRotationY).toBeCloseTo(Math.PI / 2, 4);
          // Extracted X must be closer to corridor center (greater X) than resting position
          expect(box.extractedPosition[0]).toBeGreaterThan(box.position[0]);
        } else {
          expect(box.baseRotationY).toBeCloseTo(-Math.PI / 2, 4);
          // Extracted X must be closer to corridor center (smaller X) than resting position
          expect(box.extractedPosition[0]).toBeLessThan(box.position[0]);
        }
      }
    });
  });
});
