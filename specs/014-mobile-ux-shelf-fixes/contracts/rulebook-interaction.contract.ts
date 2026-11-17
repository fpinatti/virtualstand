export interface RulebookItemDisplay {
  id: number;
  label: string;
  docType: string;
  pageCount: number | null;
  fileSizeBytes: number;
  lastViewedPage: number;
}

export interface RulebookInteractionHandlers {
  /**
   * Tapping a rulebook item card directly triggers opening the viewer.
   */
  handleCardPress: (rulebookId: number) => void;
  /**
   * Closes the parent details modal before navigating to avoid trapped screens.
   */
  handleCloseParentModal: () => void;
}
