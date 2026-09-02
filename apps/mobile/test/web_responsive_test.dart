import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/app/navigation/app_router.dart';
import 'package:prolific_mobile/app/navigation/app_routes.dart';
import 'package:prolific_mobile/app/theme/prolific_theme.dart';
import 'package:prolific_mobile/features/home/presentation/home_screen.dart';
import 'package:prolific_mobile/features/lesson_setup/presentation/language_selection_screen.dart';
import 'package:prolific_mobile/features/lesson_setup/presentation/lesson_setup_frame.dart';
import 'package:prolific_mobile/features/topics/presentation/topics_screen.dart';

Widget harness(Widget home) => MaterialApp(
  theme: ProlificTheme.light(),
  onGenerateRoute: AppRouter.onGenerateRoute,
  home: home,
);

void setViewport(WidgetTester tester, Size size) {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
}

void main() {
  tearDown(() {
    TestWidgetsFlutterBinding.instance.platformDispatcher.clearAllTestValues();
  });

  testWidgets('compact shell keeps mobile navigation and single-column cards', (
    tester,
  ) async {
    setViewport(tester, const Size(390, 844));
    await tester.pumpWidget(harness(const HomeScreen()));

    expect(find.byType(NavigationRail), findsNothing);
    expect(find.text('Hello, reader!'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('expanded Home shows rail and balanced two-column cards', (
    tester,
  ) async {
    setViewport(tester, const Size(1440, 900));
    await tester.pumpWidget(harness(const HomeScreen()));

    expect(find.byType(NavigationRail), findsOneWidget);
    expect(find.text('Progress'), findsOneWidget);
    final continueTopLeft = tester.getTopLeft(find.text('Continue Reading'));
    final progressTopLeft = tester.getTopLeft(
      find.text('Progress in guest mode'),
    );
    expect(progressTopLeft.dx, greaterThan(continueTopLeft.dx));
    expect(tester.takeException(), isNull);
  });

  testWidgets('Topic grid uses two medium columns and three expanded columns', (
    tester,
  ) async {
    setViewport(tester, const Size(800, 900));
    await tester.pumpWidget(harness(const TopicsScreen()));
    final firstMedium = tester.getTopLeft(find.text('Amazing African Animals'));
    final secondMedium = tester.getTopLeft(
      find.text('South African Landscapes'),
    );
    final thirdMedium = tester.getTopLeft(find.text('Stories from History'));
    expect(firstMedium.dy, secondMedium.dy);
    expect(thirdMedium.dy, greaterThan(firstMedium.dy));

    setViewport(tester, const Size(1600, 900));
    await tester.pumpWidget(harness(const TopicsScreen()));
    final firstExpanded = tester.getTopLeft(
      find.text('Amazing African Animals'),
    );
    final secondExpanded = tester.getTopLeft(
      find.text('South African Landscapes'),
    );
    final thirdExpanded = tester.getTopLeft(find.text('Stories from History'));
    expect(firstExpanded.dy, secondExpanded.dy);
    expect(secondExpanded.dy, thirdExpanded.dy);
    expect(find.byType(NavigationRail), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('clickable Topic cards expose a click cursor', (tester) async {
    setViewport(tester, const Size(1280, 900));
    await tester.pumpWidget(harness(const TopicsScreen()));

    final regions = find
        .ancestor(
          of: find.text('Amazing African Animals'),
          matching: find.byType(MouseRegion),
        )
        .evaluate()
        .map((element) => element.widget)
        .whereType<MouseRegion>();
    expect(
      regions.any((region) => region.cursor == SystemMouseCursors.click),
      isTrue,
    );
  });

  testWidgets('expanded lesson setup exposes steps and selectable options', (
    tester,
  ) async {
    setViewport(tester, const Size(1440, 900));
    await tester.pumpWidget(harness(const LanguageSelectionScreen()));

    expect(find.text('Your choices'), findsOneWidget);
    expect(find.text('Step 2 of 5'), findsNothing);

    await tester.tap(find.text('English').first);
    await tester.pump();

    expect(find.bySemanticsLabel('English, selected'), findsOneWidget);
    final continueButton = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Continue to difficulty'),
    );
    expect(continueButton.onPressed, isNotNull);
    expect(tester.takeException(), isNull);
  });

  testWidgets('selectable setup cards activate from keyboard focus', (
    tester,
  ) async {
    final focusNode = FocusNode();
    addTearDown(focusNode.dispose);
    var activated = false;
    await tester.pumpWidget(
      MaterialApp(
        theme: ProlificTheme.light(),
        home: Scaffold(
          body: SetupOptionCard(
            title: 'Keyboard option',
            description: 'Selectable without a pointer.',
            selected: false,
            focusNode: focusNode,
            onTap: () => activated = true,
          ),
        ),
      ),
    );

    focusNode.requestFocus();
    await tester.pump();
    await tester.sendKeyEvent(LogicalKeyboardKey.enter);
    expect(activated, isTrue);
  });

  testWidgets('direct Topic Details route fails safely without arguments', (
    tester,
  ) async {
    setViewport(tester, const Size(1280, 800));
    await tester.pumpWidget(
      MaterialApp(
        theme: ProlificTheme.light(),
        initialRoute: AppRoutes.topicDetails,
        onGenerateRoute: AppRouter.onGenerateRoute,
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Choose a topic first'), findsOneWidget);
    expect(find.text('Browse topics'), findsOneWidget);
  });

  testWidgets('built-in routes preserve browser-style back navigation', (
    tester,
  ) async {
    setViewport(tester, const Size(1280, 800));
    await tester.pumpWidget(harness(const HomeScreen()));
    await tester.tap(find.text('Browse Topics'));
    await tester.pumpAndSettle();
    expect(find.text('Find something worth reading'), findsOneWidget);

    await tester.pageBack();
    await tester.pumpAndSettle();
    expect(find.text('Hello, reader!'), findsOneWidget);
  });
}
