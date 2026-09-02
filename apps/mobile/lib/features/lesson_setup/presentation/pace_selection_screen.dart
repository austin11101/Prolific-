import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import 'lesson_setup_frame.dart';

class PaceSelectionScreen extends StatefulWidget {
  const PaceSelectionScreen({super.key});

  @override
  State<PaceSelectionScreen> createState() => _PaceSelectionScreenState();
}

class _PaceSelectionScreenState extends State<PaceSelectionScreen> {
  String? _selected;

  static const options = <(String, String)>[
    ('Easy - 100 WPM', 'A calm pace for careful reading.'),
    ('Medium - 150 WPM', 'A balanced pace for steady practice.'),
    ('Hard - 200 WPM', 'A faster pace for a stronger challenge.'),
  ];

  @override
  Widget build(BuildContext context) {
    return LessonSetupFrame(
      title: 'Choose your reading pace',
      description:
          'These are the approved MVP presets. You can choose a pace for each practice session.',
      stepIndex: 3,
      currentRoute: AppRoutes.paceSelection,
      continueLabel: 'Review lesson setup',
      onContinue: _selected == null
          ? null
          : () => Navigator.of(context).pushNamed(AppRoutes.lessonPreview),
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
