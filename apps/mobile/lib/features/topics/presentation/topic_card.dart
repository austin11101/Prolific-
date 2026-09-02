import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/widgets/app_card.dart';
import 'topic_preview.dart';

class TopicCard extends StatelessWidget {
  const TopicCard({required this.topic, required this.onTap, super.key});

  final TopicPreview topic;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      semanticLabel:
          '${topic.title}, ${topic.difficulty.label}, ${topic.language}',
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(topic.icon, size: ProlificSizes.iconLarge),
          const SizedBox(height: ProlificSpacing.sm),
          Text(topic.title, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: ProlificSpacing.xs),
          Text(topic.description),
          const Spacer(),
          const SizedBox(height: ProlificSpacing.sm),
          Wrap(
            spacing: ProlificSpacing.xs,
            runSpacing: ProlificSpacing.xs,
            children: [
              Chip(
                avatar: const Icon(Icons.signal_cellular_alt_rounded, size: 18),
                label: Text(topic.difficulty.label),
              ),
              Chip(
                avatar: const Icon(Icons.language_rounded, size: 18),
                label: Text(topic.language),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
