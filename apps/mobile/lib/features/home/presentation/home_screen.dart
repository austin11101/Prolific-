import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/layout/responsive_layout.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ProlificScaffold(
      title: 'Home',
      showBackButton: false,
      currentRoute: AppRoutes.home,
      showPrimaryNavigation: true,
      actions: [
        Semantics(
          label: 'Guest mode information',
          button: true,
          child: IconButton(
            tooltip: 'Guest mode',
            onPressed: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('You are exploring Prolific as a guest.'),
              ),
            ),
            icon: const Icon(Icons.person_outline_rounded),
          ),
        ),
      ],
      child: ProlificResponsiveBuilder(
        builder: (context, constraints, windowClass) {
          final expanded = windowClass == ProlificWindowClass.expanded;
          final cardWidth = expanded
              ? (constraints.maxWidth - ProlificSpacing.lg) / 2
              : constraints.maxWidth;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Hello, reader!',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: ProlificSpacing.xs),
                Text(
                  'What would you like to learn today?',
                  style: Theme.of(context).textTheme.bodyLarge,
                ),
                const SizedBox(height: ProlificSpacing.lg),
                Align(
                  alignment: Alignment.centerLeft,
                  child: SizedBox(
                    width: expanded ? 320 : double.infinity,
                    child: PrimaryButton(
                      label: 'Browse Topics',
                      icon: Icons.grid_view_rounded,
                      onPressed: () =>
                          Navigator.of(context).pushNamed(AppRoutes.topics),
                    ),
                  ),
                ),
                const SizedBox(height: ProlificSpacing.xl),
                Wrap(
                  spacing: ProlificSpacing.lg,
                  runSpacing: ProlificSpacing.lg,
                  children: [
                    SizedBox(
                      width: cardWidth,
                      child: const _ContinueReadingCard(),
                    ),
                    SizedBox(
                      width: cardWidth,
                      child: const _GuestProgressCard(),
                    ),
                    SizedBox(
                      width: cardWidth,
                      child: const _ReadingSetupCard(),
                    ),
                    SizedBox(
                      width: cardWidth,
                      child: const _AccountPromptCard(),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ContinueReadingCard extends StatelessWidget {
  const _ContinueReadingCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      semanticLabel: 'Continue reading placeholder',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.auto_stories_outlined,
            size: ProlificSizes.iconLarge,
          ),
          const SizedBox(width: ProlificSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Continue Reading',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                const SizedBox(height: ProlificSpacing.xs),
                const Text(
                  'Choose a topic to begin your first practice lesson.',
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReadingSetupCard extends StatelessWidget {
  const _ReadingSetupCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const ListTile(
            contentPadding: EdgeInsets.zero,
            leading: Icon(Icons.language_rounded),
            title: Text('Content language'),
            subtitle: Text('English'),
          ),
          Text(
            'Reading pace options',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: ProlificSpacing.sm),
          const Wrap(
            spacing: ProlificSpacing.xs,
            runSpacing: ProlificSpacing.xs,
            children: [
              Chip(label: Text('Easy - 100 WPM')),
              Chip(label: Text('Medium - 150 WPM')),
              Chip(label: Text('Hard - 200 WPM')),
            ],
          ),
        ],
      ),
    );
  }
}

class _GuestProgressCard extends StatelessWidget {
  const _GuestProgressCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Progress in guest mode',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: ProlificSpacing.xs),
          const Text(
            'Your activity is not saved. No reading statistics are available in this preview.',
          ),
        ],
      ),
    );
  }
}

class _AccountPromptCard extends StatelessWidget {
  const _AccountPromptCard();

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Keep learning later',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: ProlificSpacing.xs),
          const Text(
            'A free account will support saved progress, daily streaks, and offline downloads. Account access is not implemented yet.',
          ),
        ],
      ),
    );
  }
}
