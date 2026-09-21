export enum GroupCategory {
  DRAWING_PAINTING = 'Drawing & Painting',
  PHOTOGRAPHY = 'Photography',
  VIDEO_GAMING = 'Video Gaming',
  COOKING = 'Cooking',
  BOOKS_LITERATURE = 'Books & Literature',
  BOARD_GAMES = 'Board Games & Tabletop',
  GARDENING = 'Gardening',
  MUSIC_AUDIO = 'Music & Audio',
  FITNESS_SPORTS = 'Fitness & Sports',
  TECH_CODING = 'Tech & Coding',
  CRAFTS_DIY = 'Crafts & DIY',
  OTHER = 'Other',
}

export const GROUP_CATEGORIES = [
  GroupCategory.DRAWING_PAINTING,
  GroupCategory.PHOTOGRAPHY,
  GroupCategory.VIDEO_GAMING,
  GroupCategory.COOKING,
  GroupCategory.BOOKS_LITERATURE,
  GroupCategory.BOARD_GAMES,
  GroupCategory.GARDENING,
  GroupCategory.MUSIC_AUDIO,
  GroupCategory.FITNESS_SPORTS,
  GroupCategory.TECH_CODING,
  GroupCategory.CRAFTS_DIY,
  GroupCategory.OTHER,
] as const;
