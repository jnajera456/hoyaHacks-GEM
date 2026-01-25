export class AudioFeedback {
  private correctSound: HTMLAudioElement;
  private incorrectSound: HTMLAudioElement;

  constructor() {
    this.correctSound = new Audio('/sounds/correct.mp3');
    this.incorrectSound = new Audio('/sounds/incorrect.mp3');
  }

  playCorrect(): void {
    this.correctSound.currentTime = 0;
    this.correctSound.play().catch((error) => {
      console.warn('Failed to play correct sound:', error);
    });
  }

  playIncorrect(): void {
    this.incorrectSound.currentTime = 0;
    this.incorrectSound.play().catch((error) => {
      console.warn('Failed to play incorrect sound:', error);
    });
  }
}
