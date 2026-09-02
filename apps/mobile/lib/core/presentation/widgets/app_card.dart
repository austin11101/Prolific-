import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';

class AppCard extends StatelessWidget {
  const AppCard({
    required this.child,
    this.onTap,
    this.semanticLabel,
    this.focusNode,
    super.key,
  });

  final Widget child;
  final VoidCallback? onTap;
  final String? semanticLabel;
  final FocusNode? focusNode;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticLabel,
      button: onTap != null,
      child: MouseRegion(
        cursor: onTap == null ? MouseCursor.defer : SystemMouseCursors.click,
        child: Card(
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            focusNode: focusNode,
            hoverColor: Theme.of(context).colorScheme.primaryContainer,
            focusColor: Theme.of(context).colorScheme.secondaryContainer,
            child: Padding(
              padding: const EdgeInsets.all(ProlificSpacing.md),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
