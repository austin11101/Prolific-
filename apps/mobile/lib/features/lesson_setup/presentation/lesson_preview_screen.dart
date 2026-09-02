import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../reading_player/presentation/reading_player_model.dart';
import 'lesson_setup_frame.dart';

class LessonPreviewScreen extends StatelessWidget {
  const LessonPreviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return LessonSetupFrame(
      title: 'Preview your reading practice',
      description:
          'This deterministic preview demonstrates the setup layout. It is not a published lesson or backend response.',
      stepIndex: 4,
      currentRoute: AppRoutes.lessonPreview,
      continueLabel: 'Open player preview',
      onContinue: () => Navigator.of(context).pushNamed(
        AppRoutes.readingPlayer,
        arguments: ReadingPlayerArguments.landscapePreview,
      ),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'South African Landscapes',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: ProlificSpacing.sm),
            ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: ProlificSizes.readingMaxWidth,
              ),
              child: Text(
                'South Africa has many landscapes, from grasslands and mountains to forests and coastlines. Each environment supports different plants, animals, and communities.',
                style: Theme.of(context).textTheme.bodyLarge,
              ),
            ),
            const SizedBox(height: ProlificSpacing.md),
            const Text('Preview values: English - Beginner - Easy 100 WPM'),
          ],
        ),
      ),
    );
  }
}
