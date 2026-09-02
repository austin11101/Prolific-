import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/app/navigation/app_router.dart';
import 'package:prolific_mobile/app/theme/prolific_theme.dart';
import 'package:prolific_mobile/features/authentication/presentation/create_account_screen.dart';
import 'package:prolific_mobile/features/authentication/presentation/sign_in_screen.dart';
import 'package:prolific_mobile/features/home/presentation/home_screen.dart';
import 'package:prolific_mobile/features/onboarding/presentation/access_choice_screen.dart';
import 'package:prolific_mobile/features/onboarding/presentation/welcome_screen.dart';
import 'package:prolific_mobile/features/topics/presentation/topics_screen.dart';

Widget harness(Widget child, {double textScale = 1}) => MaterialApp(
  theme: ProlificTheme.light(),
  onGenerateRoute: AppRouter.onGenerateRoute,
  home: Builder(
    builder: (context) => MediaQuery(
      data: MediaQuery.of(
        context,
      ).copyWith(textScaler: TextScaler.linear(textScale)),
      child: child,
    ),
  ),
);

void main() {
  testWidgets('welcome remains usable with 200 percent text scaling', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(430, 932);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(harness(const WelcomeScreen(), textScale: 2));
    expect(
      find.text('Build confidence, one paragraph at a time.'),
      findsOneWidget,
    );
    expect(find.text('Get Started'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('access choice explains guest limitations', (tester) async {
    await tester.pumpWidget(harness(const AccessChoiceScreen()));
    expect(find.textContaining('Guest progress is temporary'), findsOneWidget);
    expect(
      find.textContaining('Save progress, build daily streaks'),
      findsOneWidget,
    );
  });

  testWidgets('sign in validates required credentials locally', (tester) async {
    await tester.pumpWidget(harness(const SignInScreen()));

    await tester.tap(find.text('Sign In'));
    await tester.pump();

    expect(find.text('Enter your email address.'), findsOneWidget);
    expect(find.text('Enter your password.'), findsOneWidget);
  });

  testWidgets('create account validates registration fields locally', (
    tester,
  ) async {
    await tester.pumpWidget(harness(const CreateAccountScreen()));

    await tester.ensureVisible(find.text('Create Account'));
    await tester.tap(find.text('Create Account'));
    await tester.pump();

    expect(find.text('Enter your name.'), findsOneWidget);
    expect(find.text('Create a password.'), findsOneWidget);
    expect(find.text('Confirm your password.'), findsOneWidget);
  });

  testWidgets('guest home shows approved paces and no fabricated statistics', (
    tester,
  ) async {
    await tester.pumpWidget(harness(const HomeScreen()));
    expect(find.text('Easy - 100 WPM'), findsOneWidget);
    expect(find.text('Medium - 150 WPM'), findsOneWidget);
    expect(find.text('Hard - 200 WPM'), findsOneWidget);
    expect(find.textContaining('Your activity is not saved'), findsOneWidget);
    expect(find.textContaining('%'), findsNothing);
  });

  testWidgets(
    'topics are deterministic, searchable, and expose an empty state',
    (tester) async {
      await tester.pumpWidget(harness(const TopicsScreen()));
      expect(find.text('Amazing African Animals'), findsOneWidget);
      expect(find.text('South African Landscapes'), findsOneWidget);

      await tester.enterText(find.byType(TextField), 'no matching topic');
      await tester.pump();
      expect(find.text('No topics found'), findsOneWidget);

      await tester.ensureVisible(find.text('Clear filters'));
      await tester.tap(find.text('Clear filters'));
      await tester.pump();
      expect(find.text('Amazing African Animals'), findsOneWidget);
    },
  );

  testWidgets('selecting a topic shows local topic details and setup entry', (
    tester,
  ) async {
    await tester.pumpWidget(harness(const TopicsScreen()));
    await tester.tap(find.text('Amazing African Animals'));
    await tester.pumpAndSettle();
    expect(find.text('Set up a lesson preview'), findsOneWidget);
    expect(find.text('Amazing African Animals'), findsOneWidget);
  });

  testWidgets('core screens lay out on a small phone at 200 percent text', (
    tester,
  ) async {
    tester.view.physicalSize = const Size(430, 932);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    for (final screen in <Widget>[
      const AccessChoiceScreen(),
      const SignInScreen(),
      const CreateAccountScreen(),
      const HomeScreen(),
      const TopicsScreen(),
    ]) {
      await tester.pumpWidget(harness(screen, textScale: 2));
      await tester.pump();
      expect(
        tester.takeException(),
        isNull,
        reason: '${screen.runtimeType} overflowed at 200 percent text',
      );
    }
  });
}
