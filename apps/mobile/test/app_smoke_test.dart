import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/main.dart';

void main() {
  testWidgets('Sprint 0 app scaffold starts', (tester) async {
    await tester.pumpWidget(const MainApp());

    expect(find.text('Hello World!'), findsOneWidget);
  });
}
