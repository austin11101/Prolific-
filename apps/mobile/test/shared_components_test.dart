import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:prolific_mobile/app/theme/prolific_theme.dart';
import 'package:prolific_mobile/core/presentation/widgets/prolific_buttons.dart';

void main() {
  testWidgets('primary button exposes disabled and loading states', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: ProlificTheme.light(),
        home: const Scaffold(
          body: Column(
            children: [
              PrimaryButton(label: 'Disabled action', onPressed: null),
              PrimaryButton(label: 'Saving', onPressed: null, isLoading: true),
            ],
          ),
        ),
      ),
    );

    expect(find.text('Disabled action'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(
      tester.getSize(find.byType(FilledButton).first).height,
      greaterThanOrEqualTo(48),
    );
  });
}
