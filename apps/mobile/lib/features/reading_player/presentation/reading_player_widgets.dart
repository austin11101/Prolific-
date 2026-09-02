import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';
import 'reading_player_model.dart';

class PlayerPhaseBadge extends StatelessWidget {
  const PlayerPhaseBadge({required this.phase, super.key});

  final ReadingPlayerPresentationPhase phase;

  String get label => switch (phase) {
    ReadingPlayerPresentationPhase.ready => 'Tutorial - Ready',
    ReadingPlayerPresentationPhase.tutorialPreview => 'Tutorial - Playing',
    ReadingPlayerPresentationPhase.tutorialPaused => 'Tutorial - Paused',
    ReadingPlayerPresentationPhase.practiceReady => 'Practice - Ready',
    ReadingPlayerPresentationPhase.practicePreview =>
      'Practice - Auto-advancing',
    ReadingPlayerPresentationPhase.previewComplete =>
      'Practice - Visual preview complete',
  };

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Current phase: $label',
      excludeSemantics: true,
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(ProlificRadii.pill),
          border: Border.all(color: Theme.of(context).colorScheme.primary),
        ),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: ProlificSpacing.sm,
            vertical: ProlificSpacing.xs,
          ),
          child: Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}

class PlayerMetadataPanel extends StatelessWidget {
  const PlayerMetadataPanel({
    required this.lesson,
    required this.phase,
    super.key,
  });

  final ReadingLessonPreview lesson;
  final ReadingPlayerPresentationPhase phase;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Lesson setup', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ProlificSpacing.sm),
          PlayerPhaseBadge(phase: phase),
          const SizedBox(height: ProlificSpacing.md),
          _MetadataRow(label: 'Topic', value: lesson.topic),
          _MetadataRow(label: 'Language', value: lesson.language),
          _MetadataRow(label: 'Difficulty', value: lesson.difficulty),
          _MetadataRow(label: 'Pace', value: lesson.pace),
        ],
      ),
    );
  }
}

class _MetadataRow extends StatelessWidget {
  const _MetadataRow({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: ProlificSpacing.sm),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          Text(value, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}

class ReadingSurface extends StatelessWidget {
  const ReadingSurface({
    required this.lesson,
    required this.selectedWordIndex,
    super.key,
  });

  final ReadingLessonPreview lesson;
  final int selectedWordIndex;

  @override
  Widget build(BuildContext context) {
    final effectiveIndex = selectedWordIndex.clamp(0, lesson.words.length - 1);
    final baseStyle = Theme.of(context).textTheme.headlineSmall?.copyWith(
      height: 1.65,
      color: Theme.of(context).colorScheme.onSurface,
    );
    final selectedStyle = baseStyle?.copyWith(
      fontWeight: FontWeight.w800,
      decoration: TextDecoration.underline,
      decorationThickness: 3,
      backgroundColor: Theme.of(context).colorScheme.primaryContainer,
    );

    return Semantics(
      container: true,
      label:
          'Reading preview. Current word ${lesson.words[effectiveIndex]}, word ${effectiveIndex + 1} of ${lesson.words.length}.',
      liveRegion: false,
      child: AppCard(
        child: ConstrainedBox(
          key: const Key('reading-surface-width'),
          constraints: const BoxConstraints(
            maxWidth: ProlificSizes.readingMaxWidth,
          ),
          child: ExcludeSemantics(
            child: RichText(
              key: const Key('reading-paragraph'),
              text: TextSpan(
                style: baseStyle,
                children: [
                  for (final segment in lesson.segments)
                    TextSpan(
                      text: segment.text,
                      style: segment.wordIndex == effectiveIndex
                          ? selectedStyle
                          : baseStyle,
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class ReadingPositionLabel extends StatelessWidget {
  const ReadingPositionLabel({
    required this.current,
    required this.total,
    super.key,
  });

  final int current;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Reading position, word $current of $total',
      excludeSemantics: true,
      child: Text(
        'Word $current of $total',
        key: const Key('reading-position'),
        style: Theme.of(context).textTheme.titleMedium,
      ),
    );
  }
}

class PlayerControlBar extends StatelessWidget {
  const PlayerControlBar({
    required this.canMovePrevious,
    required this.canMoveNext,
    required this.onPrevious,
    required this.onNext,
    required this.onRestart,
    this.showManualControls = true,
    this.isPaused = false,
    this.onPause,
    this.onResume,
    super.key,
  });

  final bool canMovePrevious;
  final bool canMoveNext;
  final VoidCallback onPrevious;
  final VoidCallback onNext;
  final VoidCallback onRestart;

  /// When false, prev/next word buttons are hidden (practice auto-advance mode).
  final bool showManualControls;

  /// Whether practice is currently paused (used to label the pause/resume button).
  final bool isPaused;

  /// Callback invoked to pause practice. Non-null only when in active practice.
  final VoidCallback? onPause;

  /// Callback invoked to resume practice. Non-null only when practice is paused.
  final VoidCallback? onResume;

  @override
  Widget build(BuildContext context) {
    final hasPracticeControl = onPause != null || onResume != null;
    return Semantics(
      container: true,
      label: showManualControls
          ? 'Manual word navigation controls'
          : 'Practice playback controls',
      child: Wrap(
        spacing: ProlificSpacing.sm,
        runSpacing: ProlificSpacing.sm,
        children: [
          if (showManualControls) ...[
            SecondaryButton(
              label: 'Previous word',
              icon: Icons.skip_previous_rounded,
              onPressed: canMovePrevious ? onPrevious : null,
            ),
            SecondaryButton(
              label: 'Next word',
              icon: Icons.skip_next_rounded,
              onPressed: canMoveNext ? onNext : null,
            ),
          ],
          if (hasPracticeControl)
            SecondaryButton(
              label: isPaused ? 'Resume' : 'Pause',
              icon: isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
              onPressed: isPaused ? onResume : onPause,
            ),
          SecondaryButton(
            label: 'Restart preview',
            icon: Icons.restart_alt_rounded,
            onPressed: onRestart,
          ),
        ],
      ),
    );
  }
}
