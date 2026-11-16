/**
 * Contract: Per-Game Sleeve Information Display (Feature 007)
 */

export interface GameSleeveRequirementView {
  id?: number;
  bggId: number;
  cardSetName: string;
  formatName: string;
  widthMm: number;
  heightMm: number;
  cardCount: number;
}

export interface GameSleeveInfoProps {
  bggId: number;
}
