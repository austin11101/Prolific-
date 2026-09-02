import 'package:flutter/material.dart';

import 'design_tokens.dart';

abstract final class ProlificTheme {
  static ThemeData light() {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: ProlificColors.primary,
      onPrimary: ProlificColors.onPrimary,
      primaryContainer: ProlificColors.primaryContainer,
      onPrimaryContainer: ProlificColors.onPrimaryContainer,
      secondary: ProlificColors.secondary,
      onSecondary: Colors.white,
      secondaryContainer: Color(0xFFD0E8DC),
      onSecondaryContainer: Color(0xFF0A2118),
      tertiary: Color(0xFF6B5F28),
      onTertiary: Colors.white,
      tertiaryContainer: Color(0xFFF4E394),
      onTertiaryContainer: Color(0xFF211B00),
      error: ProlificColors.error,
      onError: Colors.white,
      errorContainer: Color(0xFFFFDAD6),
      onErrorContainer: Color(0xFF410002),
      surface: ProlificColors.surface,
      onSurface: ProlificColors.textPrimary,
      surfaceContainerHighest: ProlificColors.surfaceContainer,
      onSurfaceVariant: ProlificColors.textSecondary,
      outline: ProlificColors.outline,
      outlineVariant: Color(0xFFC1CAC5),
      shadow: Colors.black,
      scrim: Colors.black,
      inverseSurface: Color(0xFF2C322F),
      onInverseSurface: Color(0xFFF0F1EE),
      inversePrimary: Color(0xFF9DD4BB),
    );

    final base = ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scheme.surface,
      visualDensity: VisualDensity.standard,
    );

    final textTheme = base.textTheme.copyWith(
      displaySmall: base.textTheme.displaySmall?.copyWith(
        fontSize: 40,
        height: 1.15,
        fontWeight: FontWeight.w700,
        color: ProlificColors.textPrimary,
      ),
      headlineMedium: base.textTheme.headlineMedium?.copyWith(
        fontSize: 30,
        height: 1.2,
        fontWeight: FontWeight.w700,
      ),
      titleLarge: base.textTheme.titleLarge?.copyWith(
        fontSize: 22,
        height: 1.3,
        fontWeight: FontWeight.w700,
      ),
      bodyLarge: base.textTheme.bodyLarge?.copyWith(fontSize: 18, height: 1.5),
      bodyMedium: base.textTheme.bodyMedium?.copyWith(
        fontSize: 16,
        height: 1.5,
      ),
      bodySmall: base.textTheme.bodySmall?.copyWith(fontSize: 14, height: 1.45),
      labelLarge: base.textTheme.labelLarge?.copyWith(
        fontSize: 16,
        fontWeight: FontWeight.w700,
      ),
    );

    return base.copyWith(
      textTheme: textTheme,
      appBarTheme: const AppBarTheme(
        centerTitle: false,
        elevation: ProlificElevation.level0,
        backgroundColor: ProlificColors.surface,
        foregroundColor: ProlificColors.textPrimary,
      ),
      cardTheme: CardThemeData(
        elevation: ProlificElevation.level0,
        color: scheme.surfaceContainerHighest,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(ProlificRadii.medium),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(ProlificSizes.minimumTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: ProlificSpacing.lg,
            vertical: ProlificSpacing.sm,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(ProlificRadii.medium),
          ),
          textStyle: textTheme.labelLarge,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          minimumSize: const Size.fromHeight(ProlificSizes.minimumTouchTarget),
          padding: const EdgeInsets.symmetric(
            horizontal: ProlificSpacing.lg,
            vertical: ProlificSpacing.sm,
          ),
          side: const BorderSide(
            color: ProlificColors.primary,
            width: ProlificSizes.borderStrong,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(ProlificRadii.medium),
          ),
          textStyle: textTheme.labelLarge,
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: scheme.surfaceContainerHighest,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ProlificRadii.medium),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ProlificRadii.medium),
          borderSide: const BorderSide(color: ProlificColors.outline),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(ProlificRadii.medium),
          borderSide: const BorderSide(
            color: ProlificColors.primary,
            width: ProlificSizes.borderStrong,
          ),
        ),
      ),
    );
  }
}
