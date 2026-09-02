import 'dart:async';

import 'package:flutter/material.dart';

import '../../../app/navigation/app_routes.dart';
import '../../../app/theme/design_tokens.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(ProlificMotion.splashDelay, _continueToWelcome);
  }

  void _continueToWelcome() {
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed(AppRoutes.welcome);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reducedMotion = MediaQuery.disableAnimationsOf(context);
    return Scaffold(
      body: SafeArea(
        child: Semantics(
          container: true,
          label: 'Prolific is starting',
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(ProlificSpacing.lg),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  ExcludeSemantics(
                    child: Icon(
                      Icons.auto_stories_rounded,
                      size: 64,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  const SizedBox(height: ProlificSpacing.md),
                  Text(
                    'Prolific',
                    style: Theme.of(context).textTheme.displaySmall,
                  ),
                  const SizedBox(height: ProlificSpacing.xs),
                  Text(
                    'Read. Learn. Grow.',
                    style: Theme.of(context).textTheme.bodyLarge,
                  ),
                  const SizedBox(height: ProlificSpacing.lg),
                  if (!reducedMotion)
                    const SizedBox.square(
                      dimension: ProlificSizes.icon,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
