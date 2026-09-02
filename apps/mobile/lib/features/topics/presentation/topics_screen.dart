import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/layout/responsive_layout.dart';
import '../../../core/presentation/widgets/state_panel.dart';
import 'topic_card.dart';
import 'topic_preview.dart';

class TopicsScreen extends StatefulWidget {
  const TopicsScreen({super.key});

  @override
  State<TopicsScreen> createState() => _TopicsScreenState();
}

class _TopicsScreenState extends State<TopicsScreen> {
  String _query = '';
  String _category = 'All';

  static const categories = <String>[
    'All',
    'Animals',
    'South African Knowledge',
    'History',
    'Technology',
    'Health',
    'Facts',
  ];

  List<TopicPreview> get _visibleTopics {
    final normalizedQuery = _query.trim().toLowerCase();
    return topicPreviews
        .where((topic) {
          final categoryMatches =
              _category == 'All' || topic.category == _category;
          final queryMatches =
              normalizedQuery.isEmpty ||
              topic.title.toLowerCase().contains(normalizedQuery) ||
              topic.description.toLowerCase().contains(normalizedQuery);
          return categoryMatches && queryMatches;
        })
        .toList(growable: false);
  }

  void _showTopicPlaceholder(TopicPreview topic) {
    Navigator.of(context).pushNamed(AppRoutes.topicDetails, arguments: topic);
  }

  @override
  Widget build(BuildContext context) {
    final visibleTopics = _visibleTopics;
    return ProlificScaffold(
      title: 'Browse Topics',
      currentRoute: AppRoutes.topics,
      showPrimaryNavigation: true,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final columns = prolificGridColumnsFor(constraints.maxWidth);
          final textScale = MediaQuery.textScalerOf(context).scale(1);
          final scaledCardHeight = (460 + ((textScale - 1).clamp(0, 1) * 650))
              .toDouble();

          return CustomScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Find something worth reading',
                      style: Theme.of(context).textTheme.headlineMedium,
                    ),
                    const SizedBox(height: ProlificSpacing.xs),
                    Text(
                      'Explore preview topics and choose what sparks your curiosity.',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: ProlificSpacing.md),
                    TextField(
                      decoration: const InputDecoration(
                        labelText: 'Search topics',
                        hintText: 'Try animals or health',
                        prefixIcon: Icon(Icons.search_rounded),
                      ),
                      textInputAction: TextInputAction.search,
                      onChanged: (value) => setState(() => _query = value),
                    ),
                    const SizedBox(height: ProlificSpacing.md),
                    Semantics(
                      label: 'Topic category filters',
                      child: SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            for (final category in categories) ...[
                              FilterChip(
                                label: Text(category),
                                selected: _category == category,
                                onSelected: (_) =>
                                    setState(() => _category = category),
                              ),
                              const SizedBox(width: ProlificSpacing.xs),
                            ],
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: ProlificSpacing.md),
                  ],
                ),
              ),
              if (visibleTopics.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: StatePanel(
                    title: 'No topics found',
                    message: 'Try a different search or show all categories.',
                    actionLabel: 'Clear filters',
                    onAction: () => setState(() {
                      _query = '';
                      _category = 'All';
                    }),
                  ),
                )
              else
                SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: columns,
                    crossAxisSpacing: ProlificSpacing.md,
                    mainAxisSpacing: ProlificSpacing.md,
                    mainAxisExtent: scaledCardHeight,
                  ),
                  delegate: SliverChildBuilderDelegate((context, index) {
                    final topic = visibleTopics[index];
                    return TopicCard(
                      key: ValueKey(topic.title),
                      topic: topic,
                      onTap: () => _showTopicPlaceholder(topic),
                    );
                  }, childCount: visibleTopics.length),
                ),
            ],
          );
        },
      ),
    );
  }
}
