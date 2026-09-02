import 'package:flutter/material.dart';

enum TopicDifficulty { beginner, intermediate, advanced }

extension TopicDifficultyLabel on TopicDifficulty {
  String get label => switch (this) {
    TopicDifficulty.beginner => 'Beginner',
    TopicDifficulty.intermediate => 'Intermediate',
    TopicDifficulty.advanced => 'Advanced',
  };
}

@immutable
class TopicPreview {
  const TopicPreview({
    required this.title,
    required this.category,
    required this.description,
    required this.difficulty,
    required this.language,
    required this.icon,
  });

  final String title;
  final String category;
  final String description;
  final TopicDifficulty difficulty;
  final String language;
  final IconData icon;
}

/// Temporary deterministic presentation data. This is not seed, domain, or API data.
const topicPreviews = <TopicPreview>[
  TopicPreview(
    title: 'Amazing African Animals',
    category: 'Animals',
    description: 'Meet remarkable animals and learn how they live.',
    difficulty: TopicDifficulty.beginner,
    language: 'English',
    icon: Icons.pets_rounded,
  ),
  TopicPreview(
    title: 'South African Landscapes',
    category: 'South African Knowledge',
    description: 'Explore the places and environments around our country.',
    difficulty: TopicDifficulty.beginner,
    language: 'English',
    icon: Icons.landscape_rounded,
  ),
  TopicPreview(
    title: 'Stories from History',
    category: 'History',
    description: 'Discover people and moments that shaped the world.',
    difficulty: TopicDifficulty.intermediate,
    language: 'English',
    icon: Icons.history_edu_rounded,
  ),
  TopicPreview(
    title: 'How Technology Connects Us',
    category: 'Technology',
    description: 'Learn how everyday digital tools share information.',
    difficulty: TopicDifficulty.advanced,
    language: 'English',
    icon: Icons.devices_rounded,
  ),
  TopicPreview(
    title: 'Healthy Daily Habits',
    category: 'Health',
    description: 'Read about simple habits that support wellbeing.',
    difficulty: TopicDifficulty.intermediate,
    language: 'English',
    icon: Icons.favorite_outline_rounded,
  ),
  TopicPreview(
    title: 'Facts That Make You Wonder',
    category: 'Facts',
    description: 'Enjoy surprising facts about our world.',
    difficulty: TopicDifficulty.beginner,
    language: 'English',
    icon: Icons.lightbulb_outline_rounded,
  ),
];
