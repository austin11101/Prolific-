import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';
import '../../../core/presentation/widgets/state_panel.dart';
import 'topic_preview.dart';

class TopicDetailsScreen extends StatelessWidget {
  const TopicDetailsScreen({required this.topic, super.key});

  final TopicPreview? topic;

  @override
  Widget build(BuildContext context) {
    final selectedTopic = topic;
    if (selectedTopic == null) {
      return ProlificScaffold(
        title: 'Topic details',
        currentRoute: AppRoutes.topicDetails,
        showPrimaryNavigation: true,
        child: StatePanel(
          kind: StatePanelKind.error,
          title: 'Choose a topic first',
          message:
              'This preview route needs a local topic selection. No lesson data was loaded.',
          actionLabel: 'Browse topics',
          onAction: () =>
              Navigator.of(context).pushReplacementNamed(AppRoutes.topics),
        ),
      );
    }

    return ProlificScaffold(
      title: 'Topic details',
      currentRoute: AppRoutes.topicDetails,
      showPrimaryNavigation: true,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(
            maxWidth: ProlificSizes.readingMaxWidth,
          ),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AppCard(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(selectedTopic.icon, size: 48),
                      const SizedBox(height: ProlificSpacing.md),
                      Text(
                        selectedTopic.title,
                        style: Theme.of(context).textTheme.headlineMedium,
                      ),
                      const SizedBox(height: ProlificSpacing.sm),
                      Text(
                        selectedTopic.description,
                        style: Theme.of(context).textTheme.bodyLarge,
                      ),
                      const SizedBox(height: ProlificSpacing.md),
                      Text(
                        '${selectedTopic.category} - ${selectedTopic.difficulty.label} - ${selectedTopic.language}',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: ProlificSpacing.lg),
                PrimaryButton(
                  label: 'Set up a lesson preview',
                  icon: Icons.tune_rounded,
                  onPressed: () => Navigator.of(
                    context,
                  ).pushNamed(AppRoutes.languageSelection),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
