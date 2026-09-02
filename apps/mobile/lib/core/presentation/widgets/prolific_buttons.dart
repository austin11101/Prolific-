import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';

class PrimaryButton extends StatelessWidget {
  const PrimaryButton({
    required this.label,
    required this.onPressed,
    this.icon,
    this.isLoading = false,
    this.semanticLabel,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final callback = isLoading ? null : onPressed;
    final child = isLoading
        ? const SizedBox.square(
            dimension: ProlificSizes.icon,
            child: CircularProgressIndicator(strokeWidth: 2),
          )
        : Text(label);

    return Semantics(
      label: semanticLabel,
      button: true,
      child: icon == null || isLoading
          ? FilledButton(onPressed: callback, child: child)
          : FilledButton.icon(
              onPressed: callback,
              icon: Icon(icon),
              label: child,
            ),
    );
  }
}

class SecondaryButton extends StatelessWidget {
  const SecondaryButton({
    required this.label,
    required this.onPressed,
    this.icon,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return icon == null
        ? OutlinedButton(onPressed: onPressed, child: Text(label))
        : OutlinedButton.icon(
            onPressed: onPressed,
            icon: Icon(icon),
            label: Text(label),
          );
  }
}
