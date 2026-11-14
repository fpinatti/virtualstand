describe('Box Interaction & 3D Rotation State', () => {
  type InteractionState = 'RESTING' | 'ANIMATING_OUT' | 'EXTRACTED' | 'ANIMATING_IN';

  function transitionState(
    current: InteractionState,
    event: 'TAP_BOX' | 'ANIMATION_END' | 'TAP_BACKGROUND'
  ): InteractionState {
    switch (current) {
      case 'RESTING':
        return event === 'TAP_BOX' ? 'ANIMATING_OUT' : 'RESTING';
      case 'ANIMATING_OUT':
        return event === 'ANIMATION_END' ? 'EXTRACTED' : 'ANIMATING_OUT';
      case 'EXTRACTED':
        return event === 'TAP_BACKGROUND' ? 'ANIMATING_IN' : 'EXTRACTED';
      case 'ANIMATING_IN':
        return event === 'ANIMATION_END' ? 'RESTING' : 'ANIMATING_IN';
    }
  }

  it('cycles correctly through extraction and return states', () => {
    let state: InteractionState = 'RESTING';

    state = transitionState(state, 'TAP_BOX');
    expect(state).toBe('ANIMATING_OUT');

    state = transitionState(state, 'ANIMATION_END');
    expect(state).toBe('EXTRACTED');

    state = transitionState(state, 'TAP_BACKGROUND');
    expect(state).toBe('ANIMATING_IN');

    state = transitionState(state, 'ANIMATION_END');
    expect(state).toBe('RESTING');
  });

  it('calculates touch delta rotation values smoothly', () => {
    const sensitivity = 0.005;
    const deltaX = 50; // 50px drag horizontally
    const deltaY = -30; // 30px drag vertically

    const rotY = deltaX * sensitivity;
    const rotX = deltaY * sensitivity;

    expect(rotY).toBe(0.25);
    expect(rotX).toBe(-0.15);
  });
});

