import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import 'lesson_setup_frame.dart';

class LanguageSelectionScreen extends StatefulWidget {
  const LanguageSelectionScreen({super.key});

  @override
  State<LanguageSelectionScreen> createState() =>
      _LanguageSelectionScreenState();
}

class _LanguageSelectionScreenState extends State<LanguageSelectionScreen> {
  String? _selected;

  @override
  Widget build(BuildContext context) {
    return LessonSetupFrame(
      title: 'Choose a content language',
      description:
          'The launch languages are English, isiZulu, and Sepedi. This preview does not claim lesson availability.',
      stepIndex: 1,
      currentRoute: AppRoutes.languageSelection,
      continueLabel: 'Continue to difficulty',
      onContinue: _selected == null
          ? null
          : () =>
                Navigator.of(context).pushNamed(AppRoutes.difficultySelection),
      child: Column(
        children: [
          for (final language in const ['English', 'isiZulu', 'Sepedi']) ...[
            SetupOptionCard(
              title: language,
              description: 'Read lesson content in $language.',
              selected: _selected == language,
              onTap: () => setState(() => _selected = language),
            ),
            const SizedBox(height: ProlificSpacing.sm),
          ],
        ],
      ),
    );
  }
}
