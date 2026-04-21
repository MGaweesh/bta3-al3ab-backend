# Implementation Plan

- [ ] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Anime Size Field Missing
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to anime items in the data file to ensure reproducibility
  - Test implementation: Read `backend/data/movies.json`, check all items in the `"anime"` array
  - Assert that anime items have the `size` field with valid format (e.g., "15 GB", "2.5 GB")
  - The test assertions should match the Expected Behavior from design: anime items SHALL have size field
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found (e.g., "Anime item 'another' (id: 1) lacks size field")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Size Display Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-buggy inputs (movies and TV shows)
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that movie items with `size` field continue to display correctly
  - Test that TV show items with `size` field continue to display correctly
  - Test that items without `size` field gracefully hide the size display
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 3. Fix for anime size field missing

  - [ ] 3.1 Add size field to anime entries in data file
    - Open `backend/data/movies.json`
    - For each object in the `"anime"` array, add a `size` property with appropriate value
    - Size values should follow the format used by movies/TV shows (e.g., "15 GB", "20 GB")
    - Ensure all anime entries have the `size` field added consistently
    - Example change:
      ```json
      {
        "id": 1,
        "name": "another",
        "type": "أنمي",
        "year": "2012",
        "rating": "7.5",
        "episodes": 12,
        "size": "15 GB",
        "image": "..."
      }
      ```
    - _Bug_Condition: isBugCondition(item) where item.type === 'أنمي' AND item.category === 'anime' AND NOT hasProperty(item, 'size')_
    - _Expected_Behavior: Anime items SHALL have size field with valid size value (e.g., "15 GB")_
    - _Preservation: Movies and TV shows with size field must continue to display correctly; items without size must gracefully hide size display_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Anime Size Field Present
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Size Display Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [ ] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
