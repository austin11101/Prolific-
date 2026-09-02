import 'package:flutter/widgets.dart';

import '../../../app/theme/design_tokens.dart';

enum ProlificWindowClass { compact, medium, expanded }

extension ProlificWindowClassCapabilities on ProlificWindowClass {
  bool get showsNavigationRail => this == ProlificWindowClass.expanded;

  int get topicColumns => switch (this) {
    ProlificWindowClass.compact => 1,
    ProlificWindowClass.medium => 2,
    ProlificWindowClass.expanded => 3,
  };
}

int prolificGridColumnsFor(double contentWidth) {
  if (contentWidth >= 1080) return 3;
  if (contentWidth >= ProlificSizes.compactBreakpoint) return 2;
  return 1;
}

ProlificWindowClass prolificWindowClassFor(double width) {
  if (width < ProlificSizes.compactBreakpoint) {
    return ProlificWindowClass.compact;
  }
  if (width < ProlificSizes.expandedBreakpoint) {
    return ProlificWindowClass.medium;
  }
  return ProlificWindowClass.expanded;
}

class ProlificResponsiveBuilder extends StatelessWidget {
  const ProlificResponsiveBuilder({required this.builder, super.key});

  final Widget Function(
    BuildContext context,
    BoxConstraints constraints,
    ProlificWindowClass windowClass,
  )
  builder;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => builder(
        context,
        constraints,
        prolificWindowClassFor(MediaQuery.sizeOf(context).width),
      ),
    );
  }
}
