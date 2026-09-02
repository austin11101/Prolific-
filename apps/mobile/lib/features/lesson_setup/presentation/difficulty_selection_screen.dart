import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import 'lesson_setup_frame.dart';

class DifficultySelectionScreen extends StatefulWidget {
  const DifficultySelectionScreen({super.key});

  @override
  State<DifficultySelectionScreen> createState() =>
      _DifficultySelectionScreenState();
}

class _DifficultySelectionScreenState extends State<DifficultySelectionScreen> {
  String? _selected;

  static const options = <(String, String)>[
    ('Beginner', 'Clear language and an approachable lesson structure.'),
    ('Intermediate', 'More detail and a moderate reading challenge.'),
    ('Advanced', 'Richer vocabulary and denser ideas.'),
  ];

  @override
  Widget build(BuildContext context) {
    return LessonSetupFrame(
      title: 'Choose a lesson difficulty',
      description:
          'Difficulty describes the content challenge. Reading pace is selected separately.',
      stepIndex: 2,
      currentRoute: AppRoutes.difficultySelection,
      continueLabel: 'Continue to pace',
      onContinue: _selected == null
          ? null
          : () => Navigator.of(context).pushNamed(AppRoutes.paceSelection),
      child: Column(
        children: [
          for (final option in options) ...[
            SetupOptionCard(
              title: option.$1,
              description: option.$2,
              selected: _selected == option.$1,
              onTap: () => setState(() => _selected = option.$1),
            ),
            const SizedBox(height: ProlificSpacing.sm),
          ],
        ],
      ),
    );
  }
}
