import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';
import 'prolific_buttons.dart';

enum StatePanelKind { empty, error, unavailable }

class StatePanel extends StatelessWidget {
  const StatePanel({
    required this.title,
    required this.message,
    this.kind = StatePanelKind.empty,
    this.actionLabel,
    this.onAction,
    super.key,
  });

  final String title;
  final String message;
  final StatePanelKind kind;
  final String? actionLabel;
  final VoidCallback? onAction;

  IconData get _icon => switch (kind) {
    StatePanelKind.empty => Icons.search_off_rounded,
    StatePanelKind.error => Icons.error_outline_rounded,
    StatePanelKind.unavailable => Icons.schedule_rounded,
  };

  @override
  Widget build(BuildContext context) {
    return Semantics(
      container: true,
      liveRegion: true,
      child: SingleChildScrollView(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: ProlificSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _icon,
                  size: ProlificSizes.iconLarge,
                  color: Theme.of(context).colorScheme.primary,
                ),
                const SizedBox(height: ProlificSpacing.sm),
                Text(title, style: Theme.of(context).textTheme.titleLarge),
                const SizedBox(height: ProlificSpacing.xs),
                Text(
                  message,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                if (actionLabel != null && onAction != null) ...[
                  const SizedBox(height: ProlificSpacing.md),
                  SecondaryButton(label: actionLabel!, onPressed: onAction),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class LoadingPlaceholder extends StatelessWidget {
  const LoadingPlaceholder({this.label = 'Loading', super.key});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: label,
      liveRegion: true,
      child: const Center(child: CircularProgressIndicator()),
    );
  }
}
