import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/app/app.dart';
import 'package:prolific_mobile/app/navigation/app_router.dart';

void main() {
  testWidgets(
    'learner entry flow reaches topics and preserves back navigation',
    (tester) async {
      await tester.pumpWidget(const ProlificApp());
      await tester.pump(const Duration(milliseconds: 700));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Get Started'));
      await tester.pumpAndSettle();
      expect(find.text('Choose how to continue'), findsOneWidget);

      await tester.tap(find.text('Continue as Guest').first);
      await tester.pumpAndSettle();
      expect(find.text('Hello, reader!'), findsOneWidget);

      await tester.tap(find.text('Browse Topics'));
      await tester.pumpAndSettle();
      expect(find.text('Find something worth reading'), findsOneWidget);

      await tester.pageBack();
      await tester.pumpAndSettle();
      expect(find.text('Hello, reader!'), findsOneWidget);
    },
  );

  testWidgets('account actions route to local authentication screens', (
    tester,
  ) async {
    await tester.pumpWidget(const ProlificApp());
    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Sign In'));
    await tester.tap(find.text('Sign In'));
    await tester.pumpAndSettle();
    expect(find.text('Welcome back'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Create Free Account'));
    await tester.tap(find.text('Create Free Account'));
    await tester.pumpAndSettle();
    expect(find.text('Create a free account'), findsOneWidget);
  });

  testWidgets('unknown routes return a safe welcome fallback', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        initialRoute: '/not-a-prolific-route',
        onGenerateRoute: AppRouter.onGenerateRoute,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Welcome to Prolific'), findsOneWidget);
    expect(find.textContaining('That page is not available'), findsOneWidget);
  });
}
