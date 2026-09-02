import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/layout/responsive_layout.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';

const lessonSetupSteps = <String>[
  'Topic',
  'Language',
  'Difficulty',
  'Pace',
  'Preview',
];

class LessonSetupFrame extends StatelessWidget {
  const LessonSetupFrame({
    required this.title,
    required this.description,
    required this.stepIndex,
    required this.currentRoute,
    required this.child,
    this.continueLabel,
    this.onContinue,
    super.key,
  });

  final String title;
  final String description;
  final int stepIndex;
  final String currentRoute;
  final Widget child;
  final String? continueLabel;
  final VoidCallback? onContinue;

  @override
  Widget build(BuildContext context) {
    return ProlificScaffold(
      title: 'Lesson setup',
      currentRoute: currentRoute,
      showPrimaryNavigation: true,
      child: ProlificResponsiveBuilder(
        builder: (context, constraints, windowClass) {
          final content = ConstrainedBox(
            constraints: const BoxConstraints(
              maxWidth: ProlificSizes.readingMaxWidth,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(title, style: Theme.of(context).textTheme.headlineMedium),
                const SizedBox(height: ProlificSpacing.xs),
                Text(description, style: Theme.of(context).textTheme.bodyLarge),
                const SizedBox(height: ProlificSpacing.lg),
                child,
                if (continueLabel != null) ...[
                  const SizedBox(height: ProlificSpacing.lg),
                  PrimaryButton(
                    label: continueLabel!,
                    icon: Icons.arrow_forward_rounded,
                    onPressed: onContinue,
                  ),
                ],
              ],
            ),
          );

          return SingleChildScrollView(
            child: windowClass == ProlificWindowClass.expanded
                ? Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      SizedBox(
                        width: 220,
                        child: _SetupStepList(stepIndex: stepIndex),
                      ),
                      const SizedBox(width: ProlificSpacing.xl),
                      Expanded(child: Center(child: content)),
                    ],
                  )
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _CompactStepIndicator(stepIndex: stepIndex),
                      const SizedBox(height: ProlificSpacing.lg),
                      content,
                    ],
                  ),
          );
        },
      ),
    );
  }
}

class SetupOptionCard extends StatelessWidget {
  const SetupOptionCard({
    required this.title,
    required this.description,
    required this.selected,
    required this.onTap,
    this.focusNode,
    super.key,
  });

  final String title;
  final String description;
  final bool selected;
  final VoidCallback onTap;
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      semanticLabel: '$title, ${selected ? 'selected' : 'not selected'}',
      onTap: onTap,
      focusNode: focusNode,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            selected
                ? Icons.radio_button_checked_rounded
                : Icons.radio_button_unchecked_rounded,
            color: Theme.of(context).colorScheme.primary,
          ),
          const SizedBox(width: ProlificSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: ProlificSpacing.xs),
                Text(description),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SetupStepList extends StatelessWidget {
  const _SetupStepList({required this.stepIndex});

  final int stepIndex;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Lesson setup progress, step ${stepIndex + 1} of 5',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Your choices', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ProlificSpacing.md),
          for (var index = 0; index < lessonSetupSteps.length; index++)
            ListTile(
              selected: index == stepIndex,
              leading: CircleAvatar(child: Text('${index + 1}')),
              title: Text(lessonSetupSteps[index]),
            ),
        ],
      ),
    );
  }
}

class _CompactStepIndicator extends StatelessWidget {
  const _CompactStepIndicator({required this.stepIndex});

  final int stepIndex;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Lesson setup progress, step ${stepIndex + 1} of 5',
      child: Row(
        children: [
          Expanded(child: LinearProgressIndicator(value: (stepIndex + 1) / 5)),
          const SizedBox(width: ProlificSpacing.sm),
          Text('Step ${stepIndex + 1} of 5'),
        ],
      ),
    );
  }
}
