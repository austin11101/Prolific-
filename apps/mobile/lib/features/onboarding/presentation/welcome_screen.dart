import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';

class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({this.notice, super.key});

  final String? notice;

  @override
  Widget build(BuildContext context) {
    return ProlificScaffold(
      showBackButton: false,
      contentMaxWidth: ProlificSizes.readingMaxWidth,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (notice != null) ...[
              MaterialBanner(
                content: Text(notice!),
                actions: const [SizedBox.shrink()],
              ),
              const SizedBox(height: ProlificSpacing.md),
            ],
            const SizedBox(height: ProlificSpacing.lg),
            Semantics(
              label: 'Open book and growing leaf illustration',
              image: true,
              child: ExcludeSemantics(
                child: Container(
                  height: 190,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(ProlificRadii.large),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      Icon(
                        Icons.menu_book_rounded,
                        size: 96,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                      const Positioned(
                        top: 30,
                        right: 58,
                        child: Icon(Icons.eco_rounded, size: 42),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: ProlificSpacing.xl),
            Text(
              'Welcome to Prolific',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: ProlificSpacing.md),
            Text(
              'Build confidence, one paragraph at a time.',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: ProlificSpacing.sm),
            Text(
              'Discover useful knowledge with guided reading practice designed to help you find your pace.',
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: ProlificSpacing.xl),
            PrimaryButton(
              label: 'Get Started',
              semanticLabel: 'Get started with Prolific',
              icon: Icons.arrow_forward_rounded,
              onPressed: () =>
                  Navigator.of(context).pushNamed(AppRoutes.accessChoice),
            ),
          ],
        ),
      ),
    );
  }
}
