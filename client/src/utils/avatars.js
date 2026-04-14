export const AVATARS = [
  { id: 'cat',     emoji: '🐱', label: 'Cat' },
  { id: 'dog',     emoji: '🐶', label: 'Dog' },
  { id: 'fox',     emoji: '🦊', label: 'Fox' },
  { id: 'frog',    emoji: '🐸', label: 'Frog' },
  { id: 'lion',    emoji: '🦁', label: 'Lion' },
  { id: 'tiger',   emoji: '🐯', label: 'Tiger' },
  { id: 'bear',    emoji: '🐻', label: 'Bear' },
  { id: 'panda',   emoji: '🐼', label: 'Panda' },
  { id: 'unicorn', emoji: '🦄', label: 'Unicorn' },
  { id: 'dragon',  emoji: '🐲', label: 'Dragon' },
  { id: 'eagle',   emoji: '🦅', label: 'Eagle' },
  { id: 'octopus', emoji: '🐙', label: 'Octopus' },
  { id: 'shark',   emoji: '🦈', label: 'Shark' },
  { id: 'wolf',    emoji: '🐺', label: 'Wolf' },
  { id: 'robot',   emoji: '🤖', label: 'Robot' },
  { id: 'alien',   emoji: '👽', label: 'Alien' },
];

export function getAvatar(id) {
  return AVATARS.find(a => a.id === id) ?? AVATARS[14]; // default robot
}

export function getAvatarEmoji(id) {
  return getAvatar(id).emoji;
}
