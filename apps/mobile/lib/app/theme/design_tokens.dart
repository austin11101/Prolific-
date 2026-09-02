import 'package:flutter/material.dart';

abstract final class ProlificColors {
  static const primary = Color(0xFF176B51);
  static const onPrimary = Color(0xFFFFFFFF);
  static const primaryContainer = Color(0xFFB9F0D7);
  static const onPrimaryContainer = Color(0xFF002117);
  static const secondary = Color(0xFF4D635A);
  static const surface = Color(0xFFFFFBFE);
  static const surfaceContainer = Color(0xFFF0F4F1);
  static const textPrimary = Color(0xFF17211D);
  static const textSecondary = Color(0xFF4B5B54);
  static const outline = Color(0xFF718079);
  static const success = Color(0xFF176B51);
  static const warning = Color(0xFF815500);
  static const error = Color(0xFFBA1A1A);
}

abstract final class ProlificSpacing {
  static const xxs = 4.0;
  static const xs = 8.0;
  static const sm = 12.0;
  static const md = 16.0;
  static const lg = 24.0;
  static const xl = 32.0;
  static const xxl = 48.0;
}

abstract final class ProlificRadii {
  static const small = 8.0;
  static const medium = 16.0;
  static const large = 24.0;
  static const pill = 999.0;
}

abstract final class ProlificSizes {
  static const border = 1.0;
  static const borderStrong = 2.0;
  static const icon = 24.0;
  static const iconLarge = 32.0;
  static const minimumTouchTarget = 48.0;
  static const readingMaxWidth = 720.0;
  static const contentMaxWidth = 1200.0;
  static const compactBreakpoint = 600.0;
  static const expandedBreakpoint = 1024.0;
}

abstract final class ProlificElevation {
  static const level0 = 0.0;
  static const level1 = 1.0;
  static const level2 = 3.0;
}

abstract final class ProlificMotion {
  static const quick = Duration(milliseconds: 150);
  static const standard = Duration(milliseconds: 300);
  static const splashDelay = Duration(milliseconds: 650);
}
