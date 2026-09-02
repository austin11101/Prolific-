import 'package:flutter/foundation.dart';

enum ReadingPlayerPresentationPhase {
  ready,
  tutorialPreview,
  tutorialPaused,
  practiceReady,
  practicePreview,
  previewComplete,
}

@immutable
class PreviewTextSegment {
  const PreviewTextSegment({required this.text, this.wordIndex});

  final String text;
  final int? wordIndex;

  bool get isEligibleWord => wordIndex != null;
}

@immutable
class ReadingLessonPreview {
  const ReadingLessonPreview({
    required this.title,
    required this.topic,
    required this.language,
    required this.difficulty,
    required this.pace,
    required this.paragraph,
    required this.segments,
    required this.words,
  });

  factory ReadingLessonPreview.fromLocalText({
    required String title,
    required String topic,
    required String language,
    required String difficulty,
    required String pace,
    required String paragraph,
  }) {
    final tokenized = tokenizePreviewText(paragraph);
    return ReadingLessonPreview(
      title: title,
      topic: topic,
      language: language,
      difficulty: difficulty,
      pace: pace,
      paragraph: paragraph,
      segments: tokenized.segments,
      words: tokenized.words,
    );
  }

  final String title;
  final String topic;
  final String language;
  final String difficulty;
  final String pace;
  final String paragraph;
  final List<PreviewTextSegment> segments;
  final List<String> words;

  bool get isUsable =>
      title.trim().isNotEmpty &&
      topic.trim().isNotEmpty &&
      language.trim().isNotEmpty &&
      difficulty.trim().isNotEmpty &&
      pace.trim().isNotEmpty &&
      paragraph.trim().isNotEmpty &&
      words.isNotEmpty;
}

@immutable
class ReadingPlayerArguments {
  const ReadingPlayerArguments({
    required this.lesson,
    this.initialWordIndex = 0,
  });

  static final landscapePreview = ReadingPlayerArguments(
    lesson: ReadingLessonPreview.fromLocalText(
      title: 'South African Landscapes',
      topic: 'South African Knowledge',
      language: 'English',
      difficulty: 'Beginner',
      pace: 'Easy - 100 WPM',
      paragraph:
          'South Africa has many landscapes, from grasslands and mountains to forests and coastlines. Each environment supports different plants, animals, and communities.',
    ),
  );

  final ReadingLessonPreview lesson;
  final int initialWordIndex;
}

@immutable
class PreviewTokenizationResult {
  const PreviewTokenizationResult({
    required this.segments,
    required this.words,
  });

  final List<PreviewTextSegment> segments;
  final List<String> words;
}

/// Parses the WPM value from a pace string such as 'Easy - 100 WPM'.
/// Returns 150 if no value can be parsed.
int parsePaceWpm(String pace) {
  final match = RegExp(
    r'\b(\d+)\s*WPM\b',
    caseSensitive: false,
  ).firstMatch(pace);
  if (match != null) return int.tryParse(match.group(1) ?? '') ?? 150;
  return 150;
}

/// Temporary presentation-only segmentation. It is not the package tokenizer,
/// a Reading Position mapping, or an audio-alignment algorithm.
PreviewTokenizationResult tokenizePreviewText(String text) {
  final pieces = RegExp(
    r"\s+|[\p{L}\p{N}'\-]+|[^\s\p{L}\p{N}'\-]+",
    unicode: true,
  ).allMatches(text);
  final words = <String>[];
  final segments = <PreviewTextSegment>[];
  final eligiblePattern = RegExp(r"^[\p{L}\p{N}'\-]+$", unicode: true);

  for (final piece in pieces) {
    final value = piece.group(0)!;
    if (eligiblePattern.hasMatch(value)) {
      final index = words.length;
      words.add(value);
      segments.add(PreviewTextSegment(text: value, wordIndex: index));
    } else {
      segments.add(PreviewTextSegment(text: value));
    }
  }

  return PreviewTokenizationResult(
    segments: List.unmodifiable(segments),
    words: List.unmodifiable(words),
  );
}
