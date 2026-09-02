import 'package:flutter/material.dart';

import '../../../app/theme/design_tokens.dart';
import '../../../app/navigation/app_routes.dart';
import 'responsive_layout.dart';

class ProlificScaffold extends StatelessWidget {
  const ProlificScaffold({
    required this.child,
    this.title,
    this.actions,
    this.showBackButton = true,
    this.currentRoute,
    this.showPrimaryNavigation = false,
    this.contentMaxWidth = ProlificSizes.contentMaxWidth,
    this.padding = const EdgeInsets.all(ProlificSpacing.lg),
    super.key,
  });

  final Widget child;
  final String? title;
  final List<Widget>? actions;
  final bool showBackButton;
  final String? currentRoute;
  final bool showPrimaryNavigation;
  final double contentMaxWidth;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: title == null
          ? null
          : AppBar(
              automaticallyImplyLeading: showBackButton,
              title: Text(title!),
              actions: actions,
            ),
      body: SafeArea(
        child: ProlificResponsiveBuilder(
          builder: (context, constraints, windowClass) {
            final content = Align(
              alignment: Alignment.topCenter,
              child: SizedBox(
                width: constraints.maxWidth > contentMaxWidth
                    ? contentMaxWidth
                    : constraints.maxWidth,
                child: Padding(padding: padding, child: child),
              ),
            );

            if (!showPrimaryNavigation || !windowClass.showsNavigationRail) {
              return content;
            }

            return Row(
              children: [
                _DesktopNavigationRail(currentRoute: currentRoute),
                const VerticalDivider(width: 1),
                Expanded(child: content),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _DesktopNavigationRail extends StatelessWidget {
  const _DesktopNavigationRail({required this.currentRoute});

  final String? currentRoute;

  @override
  Widget build(BuildContext context) {
    final selectedIndex = switch (currentRoute) {
      AppRoutes.home => 0,
      AppRoutes.topics || AppRoutes.topicDetails => 1,
      _ => null,
    };

    return NavigationRail(
      extended: true,
      minExtendedWidth: 240,
      selectedIndex: selectedIndex,
      labelType: NavigationRailLabelType.none,
      leading: Padding(
        padding: const EdgeInsets.symmetric(vertical: ProlificSpacing.md),
        child: Semantics(
          header: true,
          child: Text(
            'Prolific',
            style: Theme.of(context).textTheme.titleLarge,
          ),
        ),
      ),
      destinations: const [
        NavigationRailDestination(
          icon: Icon(Icons.home_outlined),
          selectedIcon: Icon(Icons.home_rounded),
          label: Text('Home'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.grid_view_outlined),
          selectedIcon: Icon(Icons.grid_view_rounded),
          label: Text('Topics'),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.insights_outlined),
          label: Tooltip(
            message: 'Progress is coming later',
            child: Text('Progress'),
          ),
        ),
        NavigationRailDestination(
          icon: Icon(Icons.settings_outlined),
          label: Tooltip(
            message: 'Settings are coming later',
            child: Text('Settings'),
          ),
        ),
      ],
      onDestinationSelected: (index) {
        final target = switch (index) {
          0 => AppRoutes.home,
          1 => AppRoutes.topics,
          _ => null,
        };

        if (target == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('This area is coming later.')),
          );
          return;
        }
        if (target == currentRoute) return;
        Navigator.of(context).pushReplacementNamed(target);
      },
    );
  }
}
