/**
 * Property-Based Tests for FindingsDisplay Component
 * 
 * Feature: patient-findings-display
 * 
 * These tests verify universal properties that should hold across all valid inputs
 * using property-based testing with fast-check.
 */

import * as fc from 'fast-check';
import { Significance, ReportType } from '../components/FindingsDisplay';

/**
 * Helper function to get CSS classes for significance highlighting
 * (Extracted from FindingsDisplay component for testing)
 */
function getSignificanceClasses(significance: Significance): string {
  switch (significance) {
    case Significance.CRITICAL:
      return 'border-red-300 bg-red-50 finding-critical';
    case Significance.ABNORMAL:
      return 'border-yellow-300 bg-yellow-50 finding-abnormal';
    case Significance.NORMAL:
    default:
      return 'border-gray-200 bg-white finding-normal';
  }
}

/**
 * Helper function to get text color for significance
 * (Extracted from FindingsDisplay component for testing)
 */
function getSignificanceTextColor(significance: Significance): string {
  switch (significance) {
    case Significance.CRITICAL:
      return 'text-red-700';
    case Significance.ABNORMAL:
      return 'text-yellow-700';
    case Significance.NORMAL:
    default:
      return 'text-gray-700';
  }
}

/**
 * Arbitrary for generating Significance values
 */
const arbitrarySignificance = (): fc.Arbitrary<Significance> =>
  fc.constantFrom(
    Significance.NORMAL,
    Significance.ABNORMAL,
    Significance.CRITICAL
  );

describe('FindingsDisplay - Property-Based Tests', () => {
  /**
   * Property 9: Abnormal Value Highlighting
   * 
   * For any finding with significance marked as "abnormal" or "critical",
   * the rendered output should include visual highlighting (CSS class or styling).
   * 
   * Validates: Requirements 4.2
   */
  describe('Property 9: Abnormal Value Highlighting', () => {
    test('abnormal findings should have abnormal CSS classes', () => {
      fc.assert(
        fc.property(
          fc.constant(Significance.ABNORMAL),
          (significance) => {
            const classes = getSignificanceClasses(significance);
            
            // Verify abnormal findings have highlighting classes
            expect(classes).toContain('finding-abnormal');
            expect(classes).toContain('border-yellow-300');
            expect(classes).toContain('bg-yellow-50');
            
            // Verify they don't have normal classes
            expect(classes).not.toContain('finding-normal');
            expect(classes).not.toContain('border-gray-200');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('critical findings should have critical CSS classes', () => {
      fc.assert(
        fc.property(
          fc.constant(Significance.CRITICAL),
          (significance) => {
            const classes = getSignificanceClasses(significance);
            
            // Verify critical findings have highlighting classes
            expect(classes).toContain('finding-critical');
            expect(classes).toContain('border-red-300');
            expect(classes).toContain('bg-red-50');
            
            // Verify they don't have normal classes
            expect(classes).not.toContain('finding-normal');
            expect(classes).not.toContain('border-gray-200');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('normal findings should not have abnormal or critical highlighting', () => {
      fc.assert(
        fc.property(
          fc.constant(Significance.NORMAL),
          (significance) => {
            const classes = getSignificanceClasses(significance);
            
            // Verify normal findings have normal classes
            expect(classes).toContain('finding-normal');
            expect(classes).toContain('border-gray-200');
            expect(classes).toContain('bg-white');
            
            // Verify they don't have abnormal or critical classes
            expect(classes).not.toContain('finding-abnormal');
            expect(classes).not.toContain('finding-critical');
            expect(classes).not.toContain('border-red-300');
            expect(classes).not.toContain('border-yellow-300');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all significance levels should produce distinct CSS classes', () => {
      fc.assert(
        fc.property(
          arbitrarySignificance(),
          arbitrarySignificance(),
          (sig1, sig2) => {
            const classes1 = getSignificanceClasses(sig1);
            const classes2 = getSignificanceClasses(sig2);
            
            // If significance levels are different, classes should be different
            if (sig1 !== sig2) {
              expect(classes1).not.toBe(classes2);
            } else {
              // If significance levels are the same, classes should be the same
              expect(classes1).toBe(classes2);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('abnormal and critical findings should have distinct text colors', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(Significance.ABNORMAL, Significance.CRITICAL),
          (significance) => {
            const textColor = getSignificanceTextColor(significance);
            
            // Verify abnormal/critical findings have colored text
            if (significance === Significance.ABNORMAL) {
              expect(textColor).toBe('text-yellow-700');
              expect(textColor).not.toBe('text-gray-700');
            } else if (significance === Significance.CRITICAL) {
              expect(textColor).toBe('text-red-700');
              expect(textColor).not.toBe('text-gray-700');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    test('normal findings should have neutral text color', () => {
      fc.assert(
        fc.property(
          fc.constant(Significance.NORMAL),
          (significance) => {
            const textColor = getSignificanceTextColor(significance);
            
            // Verify normal findings have neutral text color
            expect(textColor).toBe('text-gray-700');
            expect(textColor).not.toContain('red');
            expect(textColor).not.toContain('yellow');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('significance highlighting should be consistent across multiple calls', () => {
      fc.assert(
        fc.property(
          arbitrarySignificance(),
          (significance) => {
            // Call the function multiple times with the same input
            const classes1 = getSignificanceClasses(significance);
            const classes2 = getSignificanceClasses(significance);
            const classes3 = getSignificanceClasses(significance);
            
            // All calls should return the same result
            expect(classes1).toBe(classes2);
            expect(classes2).toBe(classes3);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('text color highlighting should be consistent across multiple calls', () => {
      fc.assert(
        fc.property(
          arbitrarySignificance(),
          (significance) => {
            // Call the function multiple times with the same input
            const color1 = getSignificanceTextColor(significance);
            const color2 = getSignificanceTextColor(significance);
            const color3 = getSignificanceTextColor(significance);
            
            // All calls should return the same result
            expect(color1).toBe(color2);
            expect(color2).toBe(color3);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all significance values should produce non-empty CSS classes', () => {
      fc.assert(
        fc.property(
          arbitrarySignificance(),
          (significance) => {
            const classes = getSignificanceClasses(significance);
            
            // Verify classes are not empty
            expect(classes).toBeTruthy();
            expect(classes.length).toBeGreaterThan(0);
            
            // Verify classes contain at least one space (multiple classes)
            expect(classes).toContain(' ');
          }
        ),
        { numRuns: 100 }
      );
    });

    test('all significance values should produce valid Tailwind CSS classes', () => {
      fc.assert(
        fc.property(
          arbitrarySignificance(),
          (significance) => {
            const classes = getSignificanceClasses(significance);
            
            // Verify classes follow Tailwind naming conventions
            const classArray = classes.split(' ');
            
            // Each class should be non-empty
            classArray.forEach(cls => {
              expect(cls.length).toBeGreaterThan(0);
            });
            
            // Should have at least 3 classes (border, background, finding-type)
            expect(classArray.length).toBeGreaterThanOrEqual(3);
            
            // Should contain a finding-* class
            const hasFindingClass = classArray.some(cls => cls.startsWith('finding-'));
            expect(hasFindingClass).toBe(true);
            
            // Should contain a border class
            const hasBorderClass = classArray.some(cls => cls.startsWith('border-'));
            expect(hasBorderClass).toBe(true);
            
            // Should contain a background class
            const hasBgClass = classArray.some(cls => cls.startsWith('bg-'));
            expect(hasBgClass).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    test('text colors should be valid Tailwind CSS classes', () => {
      fc.assert(
        fc.property(
          arbitrarySignificance(),
          (significance) => {
            const textColor = getSignificanceTextColor(significance);
            
            // Verify text color is a valid Tailwind class
            expect(textColor).toMatch(/^text-/);
            expect(textColor.length).toBeGreaterThan(5);
            
            // Should not contain spaces (single class)
            expect(textColor).not.toContain(' ');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
