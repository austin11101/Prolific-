import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';
import '../../../core/presentation/layout/prolific_scaffold.dart';
import '../../../core/presentation/widgets/app_card.dart';
import '../../../core/presentation/widgets/prolific_buttons.dart';

class AccessChoiceScreen extends StatelessWidget {
  const AccessChoiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ProlificScaffold(
      title: 'Choose how to continue',
      contentMaxWidth: ProlificSizes.readingMaxWidth,
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Try Prolific before creating an account.',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            const SizedBox(height: ProlificSpacing.md),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Guest access',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: ProlificSpacing.xs),
                  const Text(
                    'Explore limited content. Guest progress is temporary, and downloads, synchronization, and streaks require a free account.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: ProlificSpacing.md),
            PrimaryButton(
              label: 'Continue as Guest',
              icon: Icons.explore_outlined,
              onPressed: () => Navigator.of(
                context,
              ).pushNamedAndRemoveUntil(AppRoutes.home, (route) => false),
            ),
            const SizedBox(height: ProlificSpacing.lg),
            AppCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Free account benefits',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: ProlificSpacing.xs),
                  const Text(
                    'Save progress, build daily streaks, and download lessons for offline reading.',
                  ),
                ],
              ),
            ),
            const SizedBox(height: ProlificSpacing.md),
            SecondaryButton(
              label: 'Sign In',
              icon: Icons.login_rounded,
              onPressed: () =>
                  Navigator.of(context).pushNamed(AppRoutes.signIn),
            ),
            const SizedBox(height: ProlificSpacing.sm),
            TextButton(
              onPressed: () =>
                  Navigator.of(context).pushNamed(AppRoutes.createAccount),
              child: const Text('Create Free Account'),
            ),
          ],
        ),
      ),
    );
  }
}
