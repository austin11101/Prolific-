import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/main.dart';

void main() {
  testWidgets('app starts with local Prolific splash presentation', (
    tester,
  ) async {
    await tester.pumpWidget(const MainApp());

    expect(find.text('Prolific'), findsOneWidget);
    expect(find.text('Read. Learn. Grow.'), findsOneWidget);

    await tester.pump(const Duration(milliseconds: 700));
    await tester.pumpAndSettle();
    expect(find.text('Welcome to Prolific'), findsOneWidget);
  });
}
